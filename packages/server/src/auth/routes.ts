import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../db/pool.js';
import {
  createSession,
  destroySession,
  hashPassword,
  setSessionCookie,
  clearSessionCookie,
  SESSION_COOKIE,
  verifyPassword,
} from './session.js';
import { checkLoginRate, requireAuth, requireSession, sessionToken } from './middleware.js';

async function audit(
  userId: string | null,
  action: string,
  ip?: string,
  detail: Record<string, unknown> = {}
): Promise<void> {
  await query(
    'INSERT INTO audit_log (user_id, action, ip, detail) VALUES ($1, $2, $3, $4)',
    [userId, action, ip ?? null, JSON.stringify(detail)]
  );
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // First-run admin creation — only works while the users table is empty.
  app.post('/api/auth/bootstrap', async (req, reply) => {
    const body = z
      .object({ email: z.string().email(), password: z.string().min(8) })
      .safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ error: 'Email and a password of at least 8 characters required' });
    }

    const { rows } = await query<{ count: string }>('SELECT count(*) AS count FROM users');
    if (Number(rows[0].count) > 0) {
      return reply.code(409).send({ error: 'An administrator already exists' });
    }

    const hash = await hashPassword(body.data.password);
    const inserted = await query<{ id: string; email: string; role: string }>(
      `INSERT INTO users (email, password_hash) VALUES ($1, $2)
       RETURNING id, email, role`,
      [body.data.email.toLowerCase(), hash]
    );
    const user = inserted.rows[0];

    const token = await createSession(user.id, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
    setSessionCookie(reply, token);
    await audit(user.id, 'auth.bootstrap', req.ip);
    return { user };
  });

  app.get('/api/auth/status', async () => {
    const { rows } = await query<{ count: string }>('SELECT count(*) AS count FROM users');
    return { usersExist: Number(rows[0].count) > 0 };
  });

  app.post('/api/auth/login', async (req, reply) => {
    if (!checkLoginRate(req.ip)) {
      return reply.code(429).send({ error: 'Too many attempts, try again in a few minutes' });
    }
    const body = z
      .object({ email: z.string().email(), password: z.string() })
      .safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ error: 'Invalid payload' });
    }

    const { rows } = await query<{ id: string; password_hash: string; email: string; role: string }>(
      'SELECT id, password_hash, email, role FROM users WHERE email = $1',
      [body.data.email.toLowerCase()]
    );
    const user = rows[0];
    if (!user || !(await verifyPassword(user.password_hash, body.data.password))) {
      return reply.code(401).send({ error: 'Invalid email or password' });
    }

    const token = await createSession(user.id, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
    setSessionCookie(reply, token);
    await audit(user.id, 'auth.login', req.ip);
    return { user: { id: user.id, email: user.email, role: user.role } };
  });

  app.post('/api/auth/logout', { onRequest: [requireAuth] }, async (req, reply) => {
    const token = req.cookies[SESSION_COOKIE];
    if (token) await destroySession(token);
    clearSessionCookie(reply);
    return { ok: true };
  });

  app.get('/api/auth/me', { onRequest: [requireAuth] }, async (req) => {
    return { user: req.user };
  });

  // Change password; invalidates every other session but keeps this one.
  app.post('/api/auth/change-password', { onRequest: [requireSession] }, async (req, reply) => {
    const body = z
      .object({ currentPassword: z.string().min(1), newPassword: z.string().min(8) })
      .safeParse(req.body);
    if (!body.success) {
      return reply.code(400).send({ error: 'New password must be at least 8 characters' });
    }

    const { rows } = await query<{ password_hash: string }>(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user!.id]
    );
    if (!rows[0] || !(await verifyPassword(rows[0].password_hash, body.data.currentPassword))) {
      return reply.code(401).send({ error: 'Current password is incorrect' });
    }

    const hash = await hashPassword(body.data.newPassword);
    await query('UPDATE users SET password_hash = $2 WHERE id = $1', [req.user!.id, hash]);

    // Kill all other sessions (this one survives so the UI stays logged in).
    const currentToken = sessionToken(req);
    await query(
      'DELETE FROM sessions WHERE user_id = $1 AND id <> $2',
      [req.user!.id, currentToken ?? '']
    );
    await audit(req.user!.id, 'auth.change-password', req.ip);
    return { ok: true };
  });

  app.get('/api/auth/sessions', { onRequest: [requireSession] }, async (req) => {
    const currentToken = sessionToken(req);
    const { rows } = await query<{
      id: string;
      created_at: Date;
      expires_at: Date;
      ip: string | null;
      user_agent: string | null;
    }>(
      `SELECT id, created_at, expires_at, ip, user_agent FROM sessions
       WHERE user_id = $1 AND expires_at > now()
       ORDER BY created_at DESC`,
      [req.user!.id]
    );
    return {
      sessions: rows.map((r) => ({
        id: r.id,
        createdAt: r.created_at.toISOString(),
        expiresAt: r.expires_at.toISOString(),
        ip: r.ip,
        userAgent: r.user_agent,
        current: r.id === currentToken,
      })),
    };
  });

  app.delete('/api/auth/sessions/:id', { onRequest: [requireSession] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const result = await query(
      'DELETE FROM sessions WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user!.id]
    );
    if (result.rows.length === 0) return reply.code(404).send({ error: 'Session not found' });
    await audit(req.user!.id, 'auth.session-revoke', req.ip, { sessionId: id.slice(0, 8) });
    return { ok: true };
  });
}

export { audit };
