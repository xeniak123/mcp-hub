import type { FastifyInstance } from 'fastify';
import type { WebSocket } from 'ws';
import { query } from '../db/pool.js';
import { requireSession } from '../auth/middleware.js';
import { resolveSession } from '../auth/session.js';
import { events } from '../events.js';
import type { WsSubscribe } from '@hub/shared';

export async function logRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/api/logs/:connectorId',
    { onRequest: [requireSession] },
    async (req) => {
      const { connectorId } = req.params as { connectorId: string };
      const q = req.query as { after?: string; limit?: string };
      const after = Number(q.after ?? 0);
      const limit = Math.min(Number(q.limit ?? 200), 1000);
      const { rows } = await query<{
        id: number;
        connector_id: string;
        ts: Date;
        level: string;
        message: string;
      }>(
        `SELECT id, connector_id, ts, level, message FROM logs
         WHERE connector_id = $1 AND id > $2 ORDER BY id ASC LIMIT $3`,
        [connectorId, Number.isFinite(after) ? after : 0, limit]
      );
      return {
        lines: rows.map((r) => ({
          id: r.id,
          connectorId: r.connector_id,
          ts: r.ts.toISOString(),
          level: r.level,
          message: r.message,
        })),
      };
    }
  );

  // Live log/status stream (tail -f). Cookie-authenticated at upgrade time.
  app.get('/api/stream', { websocket: true }, async (socket: WebSocket, req) => {
    const user = await requireSessionWs(req);
    if (!user) {
      socket.close(4001, 'Unauthorized');
      return;
    }

    let subscribedIds = new Set<string>();
    const unsubscribe = events.subscribe((event) => {
      if (event.type === 'log' && !subscribedIds.has(event.connectorId)) return;
      if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify(event));
      }
    });

    socket.on('message', (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString()) as WsSubscribe;
        if (msg.type === 'subscribe') {
          subscribedIds = new Set(msg.connectorIds);
          socket.send(JSON.stringify({ type: 'connected' }));
        }
      } catch {
        // ignore malformed frames
      }
    });

    socket.on('close', unsubscribe);
  });
}

async function requireSessionWs(req: { cookies?: Record<string, string | undefined> }) {
  // lightweight reuse of the session resolver for the WS upgrade request
  return resolveSession({ cookies: req.cookies ?? {} } as never);
}
