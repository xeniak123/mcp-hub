import type { FastifyReply, FastifyRequest } from 'fastify';
import { query } from '../db/pool.js';
import { hashApiKey, resolveSession, SESSION_COOKIE } from './session.js';

/**
 * Session-or-bearer guard. Accepts either the UI session cookie or an
 * Authorization: Bearer <api_key> header (used by external MCP clients).
 * On success attaches req.user.
 */
export async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const user = await resolveSession(req);
  if (user) {
    req.user = user;
    return;
  }

  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice('Bearer '.length).trim();
    const { rows } = await query<{ user_id: string; email: string; role: string; key_id: string }>(
      `SELECT k.id AS key_id, k.user_id, u.email, u.role
       FROM api_keys k JOIN users u ON u.id = k.user_id
       WHERE k.key_hash = $1 AND k.revoked_at IS NULL`,
      [hashApiKey(token)]
    );
    const row = rows[0];
    if (row) {
      // fire-and-forget last-used stamp
      void query('UPDATE api_keys SET last_used_at = now() WHERE id = $1', [row.key_id]);
      req.user = { id: row.user_id, email: row.email, role: row.role };
      return;
    }
  }

  reply.code(401).send({ error: 'Unauthorized' });
}

/** Session-cookie-only guard for browser management routes. */
export async function requireSession(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const user = await resolveSession(req);
  if (!user) {
    reply.code(401).send({ error: 'Unauthorized' });
    return;
  }
  req.user = user;
}

export function sessionToken(req: FastifyRequest): string | undefined {
  return req.cookies[SESSION_COOKIE];
}

// Simple in-memory login rate limiter (per IP).
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 5 * 60 * 1000;

export function checkLoginRate(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || entry.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= MAX_ATTEMPTS;
}

// Per-key sliding-window rate limiter for the /mcp endpoint. Session
// traffic (the UI itself) is exempt; only Bearer API keys are limited,
// keyed by the key id so a revoked key's budget dies with it.
const MCP_LIMIT = 120; // requests per minute per key — generous for polling clients
const MCP_WINDOW_MS = 60_000;
const mcpBuckets = new Map<string, { count: number; resetAt: number }>();

function checkMcpRate(keyId: string): boolean {
  const now = Date.now();
  let entry = mcpBuckets.get(keyId);
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + MCP_WINDOW_MS };
    mcpBuckets.set(keyId, entry);
  }
  entry.count += 1;
  // Opportunistic cleanup so the map doesn't grow with dead keys.
  if (mcpBuckets.size > 1000) {
    for (const [k, v] of mcpBuckets) if (v.resetAt < now) mcpBuckets.delete(k);
  }
  return entry.count <= MCP_LIMIT;
}

/**
 * Same as requireAuth but applies the per-key rate limit to Bearer traffic.
 * Returns false when the reply has been sent (401 or 429).
 */
export async function requireMcpAuth(req: FastifyRequest, reply: FastifyReply): Promise<boolean> {
  const user = await resolveSession(req);
  if (user) {
    req.user = user;
    return true;
  }

  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice('Bearer '.length).trim();
    const { rows } = await query<{ key_id: string; user_id: string; email: string; role: string }>(
      `SELECT k.id AS key_id, k.user_id, u.email, u.role
       FROM api_keys k JOIN users u ON u.id = k.user_id
       WHERE k.key_hash = $1 AND k.revoked_at IS NULL`,
      [hashApiKey(token)]
    );
    const row = rows[0];
    if (row) {
      if (!checkMcpRate(row.key_id)) {
        reply.code(429).send({ error: 'Rate limit exceeded — slow down' });
        return false;
      }
      void query('UPDATE api_keys SET last_used_at = now() WHERE id = $1', [row.key_id]);
      req.user = { id: row.user_id, email: row.email, role: row.role };
      return true;
    }
  }

  reply.code(401).send({ error: 'Unauthorized' });
  return false;
}
