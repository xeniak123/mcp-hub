import type { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { LogLine } from '@hub/shared';
import { pool } from '../db/pool.js';
import { config } from '../config.js';
import { events } from '../events.js';

type Level = LogLine['level'];

interface PendingLine {
  connectorId: string;
  level: Level;
  message: string;
}

function classify(line: string): Level {
  const lower = line.toLowerCase();
  if (/error|fatal|exception|panic/.test(lower)) return 'error';
  if (/\bwarn(ing)?\b/.test(lower)) return 'warn';
  if (/^\s*\{[\s\S]*"jsonrpc"[\s\S]*\}\s*$/.test(line)) return 'rpc';
  if (/\bdebug\b/.test(lower)) return 'debug';
  return 'info';
}

/**
 * Captures child-process stderr, classifies lines, batches them into the
 * `logs` table and broadcasts to WebSocket subscribers.
 */
class LogPipeline {
  private buffer: PendingLine[] = [];
  private flushTimer?: NodeJS.Timeout;
  /** Per-connector secret values (tokens, passwords) masked out of every line. */
  private secrets = new Map<string, string[]>();

  registerSecrets(connectorId: string, values: unknown[]): void {
    this.secrets.set(
      connectorId,
      values.filter((v): v is string => typeof v === 'string' && v.length >= 8)
    );
  }

  clearSecrets(connectorId: string): void {
    this.secrets.delete(connectorId);
  }

  private redact(connectorId: string, message: string): string {
    const vals = this.secrets.get(connectorId);
    if (!vals) return message;
    let out = message;
    for (const v of vals) out = out.split(v).join('••••••••');
    return out;
  }

  /** Tap a transport's stderr stream. */
  attachStderr(connectorId: string, stderr: AsyncIterable<Uint8Array>): void {
    void this.consume(connectorId, stderr);
  }

  private decoder = new TextDecoder();

  private async consume(connectorId: string, stream: AsyncIterable<Uint8Array>): Promise<void> {
    let partial = '';
    try {
      for await (const chunk of stream) {
        const text = partial + this.decoder.decode(chunk, { stream: true });
        const lines = text.split(/\r?\n/);
        partial = lines.pop() ?? '';
        for (const line of lines.slice(0, 200)) {
          if (line.trim())
            this.insertDirect(connectorId, classify(line), this.redact(connectorId, line).slice(0, 4000));
        }
      }
    } catch {
      // stream ended with process death — watchdog handles restart
    }
    if (partial.trim()) {
      this.insertDirect(connectorId, classify(partial), this.redact(connectorId, partial).slice(0, 4000));
    }
  }

  /** Insert a hub-generated line immediately. */
  insertDirect(connectorId: string, level: Level, message: string): void {
    this.buffer.push({ connectorId, level, message });
    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (this.flushTimer || this.buffer.length === 0) return;
    const flush = () => void this.flush();
    if (this.buffer.length >= 25) {
      this.flushTimer = setTimeout(flush, 10);
    } else {
      this.flushTimer = setTimeout(flush, 250);
    }
    this.flushTimer.unref?.();
  }

  private async flush(): Promise<void> {
    clearTimeout(this.flushTimer);
    this.flushTimer = undefined;
    const batch = this.buffer.splice(0, this.buffer.length);
    if (batch.length === 0) return;

    // broadcast first so live viewers never wait on the DB
    for (const item of batch) {
      events.emit({
        type: 'log',
        connectorId: item.connectorId,
        line: { id: -1, connectorId: item.connectorId, ts: new Date().toISOString(), level: item.level, message: item.message },
      });
    }

    const values: unknown[] = [];
    const tuples = batch.map((item, i) => {
      values.push(item.connectorId, item.level, item.message);
      const base = i * 3;
      return `($${base + 1}, $${base + 2}, $${base + 3})`;
    });
    try {
      await pool.query(
        `INSERT INTO logs (connector_id, level, message) VALUES ${tuples.join(',')}`,
        values
      );
    } catch (err) {
      console.error('[logs] failed to persist log batch:', (err as Error).message);
    }
  }

  /** Periodic ring-buffer prune: keep last N lines per connector and recent rows only. */
  startPruner(): void {
    const prune = async () => {
      try {
        await pool.query(`
          DELETE FROM logs
          WHERE id IN (
            SELECT id FROM (
              SELECT id, row_number() OVER (PARTITION BY connector_id ORDER BY id DESC) AS rn
              FROM logs
            ) ranked WHERE rn > $1
          )
        `, [config.logRetentionLines]);
        await pool.query(
          'DELETE FROM logs WHERE ts < now() - make_interval(days => $1::int)',
          [config.logRetentionDays]
        );
      } catch (err) {
        console.error('[logs] prune failed:', (err as Error).message);
      }
    };
    const timer = setInterval(() => void prune(), 60_000);
    timer.unref?.();
    void prune();
  }

  async shutdown(): Promise<void> {
    await this.flush();
  }
}

export const logPipeline = new LogPipeline();
