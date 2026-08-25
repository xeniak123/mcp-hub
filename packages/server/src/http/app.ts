import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import websocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { authRoutes } from '../auth/routes.js';
import { apiKeyRoutes } from '../auth/apiKeys.js';
import { marketplaceAndConnectorRoutes } from '../modules/marketplace.js';
import { backupRoutes } from '../modules/backup.js';
import { healthRoutes } from '../modules/health.js';
import { logRoutes } from '../logs/routes.js';
import { mountMcp } from '../hub/server.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function buildApp(hubServer: McpServer) {
  const app = Fastify({
    logger: false,
    trustProxy: true,
  });

  await app.register(cookie);
  await app.register(websocket, { options: { maxPayload: 1024 * 1024 } });

  await app.register(authRoutes);
  await app.register(apiKeyRoutes);
  await app.register(marketplaceAndConnectorRoutes);
  await app.register(backupRoutes);
  await app.register(healthRoutes);
  await app.register(logRoutes);

  // unified MCP endpoint
  app.addHook('onRequest', async (req, reply) => {
    if (req.raw.url?.startsWith('/mcp')) {
      const { requireMcpAuth } = await import('../auth/middleware.js');
      await requireMcpAuth(req, reply);
    }
  });
  await mountMcp(app, hubServer);

  // static web bundle (built by @hub/web) with SPA fallback.
  // Three levels up works both from src/<dev> and dist/<compiled>.
  const webDist = path.resolve(__dirname, '../../../web/dist');
  if (existsSync(webDist)) {
    await app.register(fastifyStatic, { root: webDist });
    app.setNotFoundHandler((req, reply) => {
      if (req.raw.url?.startsWith('/api/') || req.raw.url?.startsWith('/mcp')) {
        reply.code(404).send({ error: 'Not found' });
        return;
      }
      return reply.sendFile('index.html');
    });
  }

  return app;
}
