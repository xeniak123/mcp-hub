import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { MarketplaceEntry, ConnectorInstance } from '@hub/shared';
import { REGISTRY, getManifest } from '../registry/index.js';
import { addCommunityRepo, listCommunityRepos, removeCommunityRepo } from '../registry/community.js';
import { manager } from '../connectors/manager.js';
import { query } from '../db/pool.js';
import { encrypt } from '../db/crypto.js';
import { requireSession } from '../auth/middleware.js';
import { audit } from '../auth/routes.js';

function toInstance(row: {
  id: string;
  registry_id: string;
  display_name: string;
  enabled: boolean;
  status: string;
  status_detail: string | null;
  restart_count: number;
  last_healthy_at: Date | null;
  installed_at: Date;
}): ConnectorInstance {
  const live = manager.get(row.id);
  return {
    id: row.id,
    registryId: row.registry_id,
    displayName: row.display_name,
    enabled: row.enabled,
    status: live?.status ?? (row.status as ConnectorInstance['status']),
    statusDetail: live?.statusDetail ?? row.status_detail,
    restartCount: row.restart_count,
    lastHealthyAt: row.last_healthy_at?.toISOString() ?? null,
    installedAt: row.installed_at.toISOString(),
  };
}

export async function marketplaceAndConnectorRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/marketplace', { onRequest: [requireSession] }, async () => {
    const { rows } = await query<{ registry_id: string; count: string }>(
      'SELECT registry_id, count(*) AS count FROM connectors GROUP BY registry_id'
    );
    const counts = new Map(rows.map((r) => [r.registry_id, Number(r.count)]));
    const entries: MarketplaceEntry[] = REGISTRY.map((manifest) => ({
      manifest,
      installedCount: counts.get(manifest.id) ?? 0,
    }));
    return { entries };
  });

  // --- Community connector repos -------------------------------------------

  app.get('/api/community/repos', { onRequest: [requireSession] }, async () => {
    return { repos: listCommunityRepos() };
  });

  app.post('/api/community/repos', { onRequest: [requireSession] }, async (req, reply) => {
    const body = z
      .object({ repo: z.string().min(3).max(200) })
      .safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: 'Provide a repo like "owner/repo"' });
    try {
      const result = await addCommunityRepo(body.data.repo);
      await audit(req.user!.id, 'community.repo-add', req.ip, { repo: body.data.repo, ...result });
      // New manifests are only picked up from the registry on next boot;
      // report that honestly so the UI can prompt for a restart.
      return { ...result, restartRequired: true };
    } catch (err) {
      return reply.code(422).send({ error: (err as Error).message });
    }
  });

  app.delete('/api/community/repos/:repo', { onRequest: [requireSession] }, async (req, reply) => {
    const { repo } = req.params as { repo: string };
    await removeCommunityRepo(decodeURIComponent(repo));
    await audit(req.user!.id, 'community.repo-remove', req.ip, { repo });
    return { ok: true, restartRequired: true };
  });

  app.get('/api/connectors', { onRequest: [requireSession] }, async () => {
    const { rows } = await query<Record<string, unknown>>(
      'SELECT * FROM connectors ORDER BY installed_at'
    );
    return { connectors: rows.map((r) => toInstance(r as never)) };
  });

  app.post('/api/connectors', { onRequest: [requireSession] }, async (req, reply) => {
    const body = z
      .object({ registryId: z.string(), displayName: z.string().min(1).max(64).optional() })
      .safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: 'Invalid payload' });

    const manifest = getManifest(body.data.registryId);
    if (!manifest) return reply.code(404).send({ error: 'Unknown registry entry' });

    const displayName =
      body.data.displayName ??
      `${manifest.name}${countsOf(manifest.id) > 0 ? ` ${countsOf(manifest.id) + 1}` : ''}`;

    const { rows } = await query<{ id: string; installed_at: Date }>(
      `INSERT INTO connectors (registry_id, display_name)
       VALUES ($1, $2) RETURNING id, installed_at`,
      [manifest.id, displayName]
    );
    await audit(req.user!.id, 'connector.install', req.ip, { registryId: manifest.id });

    // register in the manager so it shows up immediately
    manager.register({
      id: rows[0].id,
      registryId: manifest.id,
      displayName,
      slug: manifest.id,
      enabled: false,
      status: 'stopped',
      statusDetail: null,
      backoffMs: 1000,
      restartCount: 0,
    });
    return { id: rows[0].id };
  });

  app.put('/api/connectors/:id/config', { onRequest: [requireSession] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const managed = manager.get(id);
    if (!managed) return reply.code(404).send({ error: 'Connector not found' });
    const manifest = getManifest(managed.registryId);
    if (!manifest) return reply.code(500).send({ error: 'Missing manifest' });

    const cfg = req.body as Record<string, unknown> | undefined;
    if (!cfg || typeof cfg !== 'object') return reply.code(400).send({ error: 'Config object required' });

    // validate required fields
    const missing = (manifest.configSchema.required ?? []).filter(
      (key) => cfg[key] === undefined || cfg[key] === ''
    );
    if (missing.length > 0) {
      return reply.code(400).send({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    await query(
      `INSERT INTO connector_configs (connector_id, ciphertext, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (connector_id) DO UPDATE SET ciphertext = EXCLUDED.ciphertext, updated_at = now()`,
      [id, encrypt(JSON.stringify(cfg))]
    );
    await audit(req.user!.id, 'connector.configure', req.ip, { connectorId: id });
    return { ok: true };
  });

  app.post('/api/connectors/:id/enable', { onRequest: [requireSession] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const managed = manager.get(id);
    if (!managed) return reply.code(404).send({ error: 'Connector not found' });
    try {
      await query('UPDATE connectors SET enabled = true WHERE id = $1', [id]);
      managed.enabled = true;
      managed.restartCount = 0;
      managed.backoffMs = 1000;
      await manager.start(id);
      await audit(req.user!.id, 'connector.enable', req.ip, { connectorId: id });
      return { ok: true };
    } catch (err) {
      return reply.code(502).send({ error: (err as Error).message });
    }
  });

  app.post('/api/connectors/:id/disable', { onRequest: [requireSession] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const managed = manager.get(id);
    if (!managed) return reply.code(404).send({ error: 'Connector not found' });
    managed.enabled = false;
    await query('UPDATE connectors SET enabled = false WHERE id = $1', [id]);
    await manager.stop(id, 'disabled');
    await audit(req.user!.id, 'connector.disable', req.ip, { connectorId: id });
    return { ok: true };
  });

  app.post('/api/connectors/:id/restart', { onRequest: [requireSession] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    if (!manager.get(id)) return reply.code(404).send({ error: 'Connector not found' });
    try {
      await manager.restart(id);
      return { ok: true };
    } catch (err) {
      return reply.code(502).send({ error: (err as Error).message });
    }
  });

  app.delete('/api/connectors/:id', { onRequest: [requireSession] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    if (!manager.get(id)) return reply.code(404).send({ error: 'Connector not found' });
    await manager.unregister(id);
    await query('DELETE FROM connectors WHERE id = $1', [id]); // cascades configs + logs
    await audit(req.user!.id, 'connector.uninstall', req.ip, { connectorId: id });
    return { ok: true };
  });

  app.put('/api/connectors/:id', { onRequest: [requireSession] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const managed = manager.get(id);
    if (!managed) return reply.code(404).send({ error: 'Connector not found' });
    const body = z
      .object({ displayName: z.string().min(1).max(64) })
      .safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: 'displayName must be 1-64 characters' });

    managed.displayName = body.data.displayName;
    await query('UPDATE connectors SET display_name = $2 WHERE id = $1', [id, body.data.displayName]);
    await audit(req.user!.id, 'connector.rename', req.ip, { connectorId: id });
    return { ok: true };
  });

  app.post('/api/connectors/restart-all', { onRequest: [requireSession] }, async (req) => {
    const targets = manager.all().filter((c) => c.enabled);
    const results = await Promise.allSettled(
      targets.map(async (c) => {
        c.restartCount = 0;
        c.backoffMs = 1000;
        await manager.restart(c.id);
      })
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    await audit(req.user!.id, 'connector.restart-all', req.ip, {
      count: targets.length,
      failed,
    });
    return { restarted: targets.length - failed, failed };
  });

  app.post('/api/connectors/stop-all', { onRequest: [requireSession] }, async (req) => {
    const targets = manager.all().filter((c) => c.enabled);
    for (const c of targets) {
      c.enabled = false;
      try {
        await manager.stop(c.id, 'stopped via stop-all');
      } catch {
        // keep stopping the rest
      }
    }
    await query('UPDATE connectors SET enabled = false WHERE enabled = true');
    await audit(req.user!.id, 'connector.stop-all', req.ip, { count: targets.length });
    return { stopped: targets.length };
  });

  app.get('/api/connectors/:id/tools', { onRequest: [requireSession] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const managed = manager.get(id);
    if (!managed) return reply.code(404).send({ error: 'Connector not found' });
    if (!managed.client) return reply.code(409).send({ error: 'Connector is not running' });
    try {
      const res = await managed.client.listTools();
      return { tools: res.tools };
    } catch (err) {
      return reply.code(502).send({ error: (err as Error).message });
    }
  });
}

function countsOf(registryId: string): number {
  return manager.all().filter((c) => c.registryId === registryId).length;
}
