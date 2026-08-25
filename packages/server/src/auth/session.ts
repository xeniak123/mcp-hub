import { randomBytes, createHash } from 'node:crypto';
import argon2 from 'argon2';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { query } from '../db/pool.js';

export const SESSION_COOKIE = 'hub_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface SessionUser {
  id: string;
  email: string;
  role: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: SessionUser;
  }
}

export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

export function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

export async function createSession(
  userId: string,
  meta: { userAgent?: string; ip?: string }
): Promise<string> {
  const token = randomBytes(32).toString('hex');
  await query(
    `INSERT INTO sessions (id, user_id, expires_at, user_agent, ip)
     VALUES ($1, $2, now() + interval '1 millisecond' * $3, $4, $5)`,
    [token, userId, SESSION_TTL_MS, meta.userAgent ?? null, meta.ip ?? null]
  );
  return token;
}

export function setSessionCookie(reply: FastifyReply, token: string): void {
  reply.setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: false, // self-hosted behind LAN/Tailscale; set true if fronted by TLS proxy
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(SESSION_COOKIE, { path: '/' });
}

/** Resolve the session cookie to a user; returns null when absent/expired. */
export async function resolveSession(req: FastifyRequest): Promise<SessionUser | null> {
  const token = req.cookies[SESSION_COOKIE];
  if (!token) return null;
  const { rows } = await query<{
    id: string;
    email: string;
    role: string;
  }>(
    `SELECT u.id, u.email, u.role FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = $1 AND s.expires_at > now()`,
    [token]
  );
  return rows[0] ?? null;
}

export async function destroySession(token: string): Promise<void> {
  await query('DELETE FROM sessions WHERE id = $1', [token]);
}

// --- API keys (bearer tokens for external MCP clients) ---

export function hashApiKey(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateApiKey(): { token: string; prefix: string } {
  const token = `mcp_${randomBytes(24).toString('hex')}`;
  return { token, prefix: token.slice(0, 12) };
}
