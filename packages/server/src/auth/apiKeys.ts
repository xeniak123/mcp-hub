import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { generateApiKey, hashApiKey } from './session.js';
import { requireSession } from './middleware.js';
import { audit } from './routes.js';

export async function apiKeyRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/keys', { onRequest: [requireSession] }, async (req) => {
    const { rows } = await query<{
      id: string;
      name: string;
      key_prefix: string;
      last_used_at: string | null;
      revoked_at: string | null;
      created_at: string;
    }>(
      `SELECT id, name, key_prefix, last_used_at, revoked_at, created_at
       FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user!.id]
    );
    return {
      keys: rows.map((r) => ({
        id: r.id,
        name: r.name,
        keyPrefix: r.key_prefix,
        lastUsedAt: r.last_used_at,
        revokedAt: r.revoked_at,
        createdAt: r.created_at,
      })),
    };
  });

  app.post('/api/keys', { onRequest: [requireSession] }, async (req, reply) => {
    const body = z.object({ name: z.string().min(1).max(64) }).safeParse(req.body);
    if (!body.success) return reply.code(400).send({ error: 'Name required' });

    const { token, prefix } = generateApiKey();
    const { rows } = await query<{ id: string; created_at: string }>(
      `INSERT INTO api_keys (user_id, name, key_prefix, key_hash)
       VALUES ($1, $2, $3, $4) RETURNING id, created_at`,
      [req.user!.id, body.data.name, prefix, hashApiKey(token)]
    );
    await audit(req.user!.id, 'apikey.create', req.ip, { name: body.data.name });

    // The raw token is returned exactly once — only its sha256 hash is stored.
    return { id: rows[0].id, token, createdAt: rows[0].created_at };
  });

  app.delete('/api/keys/:id', { onRequest: [requireSession] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const result = await query(
      'UPDATE api_keys SET revoked_at = now() WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL',
      [id, req.user!.id]
    );
    if (result.rowCount === 0) return reply.code(404).send({ error: 'Key not found' });
    await audit(req.user!.id, 'apikey.revoke', req.ip, { keyId: id });
    return { ok: true };
  });
}
