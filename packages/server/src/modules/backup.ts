import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { encrypt, decryptConfig } from '../db/crypto.js';
import { getManifest } from '../registry/index.js';
import { manager } from '../connectors/manager.js';
import { requireSession } from '../auth/middleware.js';
import { audit } from '../auth/routes.js';

/**
 * Backup / restore: export the full hub configuration as one JSON file
 * (installed connectors + their decrypted configs), and import it onto a
 * fresh instance. API keys are deliberately NOT exported — they are hashes
 * that would be useless on another instance with a different master key.
 */

interface ExportedConnector {
  registryId: string;
  displayName: string;
  enabled: boolean;
  config: Record<string, unknown> | null;
}

const importSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string().optional(),
  connectors: z
    .array(
      z.object({
        registryId: z.string(),
        displayName: z.string().min(1).max(64).optional(),
        enabled: z.boolean().optional(),
        config: z.record(z.string(), z.unknown()).nullable().optional(),
      })
    )
    .max(500),
});

export async function backupRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/backup', { onRequest: [requireSession] }, async (req, reply) => {
    const { rows } = await query<{
      id: string;
      registry_id: string;
      display_name: string;
      enabled: boolean;
    }>('SELECT id, registry_id, display_name, enabled FROM connectors ORDER BY installed_at');

    const connectors: ExportedConnector[] = [];
    for (const row of rows) {
      let configData: Record<string, unknown> | null = null;
      const cfgRes = await query<{ ciphertext: Buffer }>(
        'SELECT ciphertext FROM connector_configs WHERE connector_id = $1',
        [row.id]
      );
      if (cfgRes.rows[0]) {
        try {
          // decryptConfig throws when the master key changed; export what we can
          configData = decryptConfig({ ciphertext: cfgRes.rows[0].ciphertext });
        } catch (err) {
          console.warn(`[backup] skipping config of ${row.id}: ${(err as Error).message}`);
        }
      }
      connectors.push({
        registryId: row.registry_id,
        displayName: row.display_name,
        enabled: row.enabled,
        config: configData,
      });
    }

    await audit(req.user!.id, 'hub.export', req.ip, { count: connectors.length });
    // Content-Disposition so browsers download instead of navigating.
    return reply
      .header('Content-Type', 'application/json')
      .header('Content-Disposition', 'attachment; filename="mcp-hub-backup.json"')
      .send({
        version: 1,
        exportedAt: new Date().toISOString(),
        connectors,
      });
  });

  app.post('/api/backup/restore', { onRequest: [requireSession] }, async (req, reply) => {
    const body = importSchema.safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: 'Invalid backup file' });

    let installed = 0;
    let skipped = 0;
    for (const entry of body.data.connectors) {
      if (!getManifest(entry.registryId)) {
        skipped++; // built-in removed or custom manifest not present here
        continue;
      }
      // Idempotence: skip registry ids already installed.
      const existing = manager.all().some((c) => c.registryId === entry.registryId);
      if (existing) {
        skipped++;
        continue;
      }

      const displayName =
        entry.displayName ?? entry.registryId;
      const { rows } = await query<{ id: string }>(
        `INSERT INTO connectors (registry_id, display_name, enabled)
         VALUES ($1, $2, false) RETURNING id`,
        [entry.registryId, displayName]
      );
      const id = rows[0].id;

      manager.register({
        id,
        registryId: entry.registryId,
        displayName,
        slug: entry.registryId,
        enabled: false,
        status: 'stopped',
        statusDetail: null,
        backoffMs: 1000,
        restartCount: 0,
      });

      if (entry.config && Object.keys(entry.config).length > 0) {
        await query(
          `INSERT INTO connector_configs (connector_id, ciphertext, updated_at)
           VALUES ($1, $2, now())`,
          [id, encrypt(JSON.stringify(entry.config))]
        );
      }
      installed++;

      // Auto-enable previously-enabled connectors after config restore.
      if (entry.enabled) {
        try {
          await query('UPDATE connectors SET enabled = true WHERE id = $1', [id]);
          const managed = manager.get(id)!;
          managed.enabled = true;
          await manager.start(id);
        } catch (err) {
          console.warn(`[backup] start ${displayName} failed: ${(err as Error).message}`);
        }
      }
    }

    await audit(req.user!.id, 'hub.import', req.ip, { installed, skipped });
    return { ok: true, installed, skipped };
  });
}
