import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { ConnectorStatus } from '@hub/shared';
import { query } from '../db/pool.js';
import { decryptConfig } from '../db/crypto.js';
import { getManifest } from '../registry/index.js';
import { config } from '../config.js';
import { logPipeline } from '../logs/pipeline.js';

export interface ManagedConnector {
  id: string;
  registryId: string;
  displayName: string;
  slug: string;
  enabled: boolean;
  status: ConnectorStatus;
  statusDetail: string | null;
  client?: Client;
  pid?: number;
  backoffMs: number;
  restartCount: number;
  healthyAt?: Date;
  /** Called by the proxy when the set of connectors changes (cache invalidation). */
  onCacheInvalidate?: () => void;
}

const MAX_BACKOFF_MS = 30_000;
const MAX_RESTARTS = 5;

/**
 * Owns the lifecycle of every installed connector's child process:
 * spawn, stop, restart, crash watchdog and health pings.
 */
class ConnectorManager {
  private connectors = new Map<string, ManagedConnector>();
  private healthTimer?: NodeJS.Timeout;

  /** Set by the hub proxy to clear the aggregation cache when instances change. */
  onCacheInvalidate?: () => void;

  get(id: string): ManagedConnector | undefined {
    return this.connectors.get(id);
  }

  all(): ManagedConnector[] {
    return [...this.connectors.values()];
  }

  enabled(): ManagedConnector[] {
    return this.all().filter((c) => c.enabled);
  }

  async loadAll(): Promise<void> {
    const { rows } = await query<{
      id: string;
      registry_id: string;
      display_name: string;
      enabled: boolean;
      status: string;
      status_detail: string | null;
      restart_count: number;
      last_healthy_at: Date | null;
    }>('SELECT * FROM connectors ORDER BY installed_at');
    for (const row of rows) {
      this.connectors.set(row.id, {
        id: row.id,
        registryId: row.registry_id,
        displayName: row.display_name,
        slug: row.registry_id,
        enabled: row.enabled,
        status: 'stopped',
        statusDetail: row.status_detail,
        backoffMs: 1000,
        restartCount: row.restart_count,
      });
    }
  }

  /** Boot recovery: start every connector that was enabled before shutdown. */
  async restoreEnabled(): Promise<void> {
    const toStart = this.enabled();
    for (let i = 0; i < toStart.length; i += 3) {
      await Promise.allSettled(toStart.slice(i, i + 3).map((c) => this.start(c.id)));
    }
    this.healthTimer = setInterval(() => void this.pingAll(), 30_000);
    this.healthTimer.unref?.();
  }

  register(managed: ManagedConnector): void {
    this.connectors.set(managed.id, managed);
    this.onCacheInvalidate?.();
  }

  unregister(id: string): void {
    const managed = this.connectors.get(id);
    if (managed && managed.client) {
      void managed.client.close().catch(() => {});
    }
    this.connectors.delete(id);
    logPipeline.clearSecrets(id);
    this.onCacheInvalidate?.();
  }

  async setStatus(id: string, status: ConnectorStatus, detail?: string | null): Promise<void> {
    const managed = this.connectors.get(id);
    if (!managed) return;
    managed.status = status;
    managed.statusDetail = detail ?? null;
    await query(
      'UPDATE connectors SET status = $2, status_detail = $3, updated_at = now() WHERE id = $1',
      [id, status, detail ?? null]
    );
    events.emit({ type: 'status', connectorId: id, status, detail: detail ?? null });
    if (status === 'running' || status === 'stopped') this.onCacheInvalidate?.();
  }

  /**
   * Spawn the child process and connect an MCP client over stdio.
   * Command argv comes from the manifest with {env.NAME} placeholders
   * substituted from the decrypted user config.
   */
  async start(id: string): Promise<void> {
    const managed = this.connectors.get(id);
    if (!managed) throw new Error(`Unknown connector ${id}`);
    if (managed.client) return; // already running

    const manifest = getManifest(managed.registryId);
    if (!manifest) throw new Error(`No manifest for ${managed.registryId}`);

    const { rows } = await query<{ ciphertext: Buffer }>(
      'SELECT ciphertext FROM connector_configs WHERE connector_id = $1',
      [id]
    );
    if (!rows[0]) throw new Error('Connector is not configured yet');

    let cfg: Record<string, unknown>;
    try {
      cfg = decryptConfig(rows[0]);
    } catch (err) {
      await this.setStatus(id, 'error', (err as Error).message);
      throw err;
    }

    // never let config secrets leak into the log pipeline
    logPipeline.registerSecrets(id, Object.values(cfg));

    // substitute {env.NAME} placeholders in argv
    const argv = manifest.command.run.map((arg) =>
      arg.replace(/\{env\.([A-Z0-9_]+)\}/g, (_, name: string) => String(cfg[name] ?? ''))
    );
    const command = argv[0];
    const args = argv.slice(1);

    await this.setStatus(id, 'starting');

    const transport = new StdioClientTransport({
      command,
      args,
      env: {
        ...(process.env.HOME ? { HOME: process.env.HOME } : {}),
        PATH: process.env.PATH ?? '/usr/local/bin:/usr/bin:/bin',
        ...Object.fromEntries(
          Object.entries(manifest.command.env).map(([k, v]) => [
            k,
            v.replace(/\{env\.([A-Z0-9_]+)\}/g, (_, name: string) => String(cfg[name] ?? '')),
          ])
        ),
        ...Object.fromEntries(Object.entries(cfg).map(([k, v]) => [k, String(v)])),
      },
      stderr: 'pipe',
    });

    if (transport.stderr) {
      logPipeline.attachStderr(
        id,
        transport.stderr as unknown as AsyncIterable<Uint8Array>
      );
    }

    const client = new Client({ name: 'mcp-hub', version: '0.1.0' });

    const startTimeout = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Timed out after ${config.connectorStartTimeoutMs}ms`)),
        config.connectorStartTimeoutMs
      )
    );

    try {
      await Promise.race([client.connect(transport), startTimeout]);
    } catch (err) {
      await client.close().catch(() => {});
      await this.setStatus(id, 'error', (err as Error).message);
      logPipeline.insertDirect(id, 'error', `Failed to start: ${(err as Error).message}`);
      throw err;
    }

    managed.client = client;
    managed.pid = transport.pid ?? undefined;
    managed.healthyAt = new Date();
    await query(
      'UPDATE connectors SET pid = $2, updated_at = now() WHERE id = $1',
      [id, transport.pid ?? null]
    );
    await this.setStatus(id, 'running');
    logPipeline.insertDirect(
      id,
      'info',
      `Started (${command} ${args.join(' ')})${transport.pid ? ` — pid ${transport.pid}` : ''}`
    );
    this.onCacheInvalidate?.();

    // Crash watchdog: exponential backoff restarts while enabled.
    transport.onclose = () => {
      if (managed.client !== client) return; // superseded by a newer start
      managed.client = undefined;
      managed.pid = undefined;
      void this.handleCrash(id, managed.enabled);
    };
  }

  private async handleCrash(id: string, enabled: boolean): Promise<void> {
    const managed = this.connectors.get(id);
    if (!managed || !enabled || managed.client) return;

    if (managed.backoffMs > MAX_BACKOFF_MS || managed.restartCount >= MAX_RESTARTS) {
      await this.setStatus(id, 'error', `Process exited; gave up after ${managed.restartCount} restarts`);
      logPipeline.insertDirect(id, 'error', 'Gave up restarting after repeated crashes');
      return;
    }
    await this.setStatus(id, 'starting', 'crashed — restarting');
    logPipeline.insertDirect(id, 'warn', `Crashed — restarting in ${managed.backoffMs}ms`);
    managed.restartCount += 1;
    await query('UPDATE connectors SET restart_count = $2 WHERE id = $1', [id, managed.restartCount]);

    setTimeout(() => {
      void this.start(id)
        .then(() => {
          const m = this.connectors.get(id);
          if (m) m.backoffMs = Math.min(m.backoffMs * 2, MAX_BACKOFF_MS);
        })
        .catch(() => {});
    }, managed.backoffMs);
  }

  async stop(id: string, reason = 'stopped by user'): Promise<void> {
    const managed = this.connectors.get(id);
    if (!managed) return;
    if (managed.client) {
      const client = managed.client;
      // Detach first so state is consistent even if close() misbehaves…
      managed.client = undefined;
      managed.pid = undefined;
      // …then close with a hard cap: some servers ignore graceful shutdown
      // and close() would otherwise hang forever.
      await Promise.race([
        client.close(),
        new Promise((resolve) => setTimeout(resolve, 5_000)),
      ]).catch(() => {});
    }
    await query('UPDATE connectors SET pid = NULL WHERE id = $1', [id]);
    await this.setStatus(id, 'stopped', null);
    logPipeline.insertDirect(id, 'info', reason);
    this.onCacheInvalidate?.();
  }

  async restart(id: string): Promise<void> {
    const managed = this.connectors.get(id);
    if (!managed) throw new Error(`Unknown connector ${id}`);
    await this.stop(id, 'restarted by user');
    managed.backoffMs = 1000;
    await this.start(id);
  }

  /** Periodic liveness check via MCP ping. */
  private async pingAll(): Promise<void> {
    for (const managed of this.all()) {
      if (!managed.client || !managed.enabled) continue;
      try {
        await Promise.race([
          managed.client.ping(),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error('ping timeout')), 5000)),
        ]);
        managed.healthyAt = new Date();
        await query('UPDATE connectors SET last_healthy_at = now() WHERE id = $1', [managed.id]);
        if (managed.status !== 'running') {
          await this.setStatus(managed.id, 'running');
        }
      } catch (err) {
        await this.setStatus(managed.id, 'error', `Health check failed: ${(err as Error).message}`);
        logPipeline.insertDirect(managed.id, 'warn', `Health check failed: ${(err as Error).message}`);
      }
    }
  }

  async shutdown(): Promise<void> {
    if (this.healthTimer) clearInterval(this.healthTimer);
    await Promise.allSettled(this.all().map((c) => this.stop(c.id, 'hub shutting down')));
  }
}

// Event bus wiring (avoids circular import with logs/events modules)
import { events } from '../events.js';

export const manager = new ConnectorManager();
