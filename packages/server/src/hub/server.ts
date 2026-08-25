import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { registerProxy } from './proxy.js';

/**
 * The unified MCP endpoint at /mcp. Every request is authenticated
 * (session cookie or bearer API key) and then proxied to the enabled
 * connector child processes.
 */
export function createHubServer(): McpServer {
  const server = new McpServer(
    { name: 'mcp-hub', version: '0.1.0' },
    { capabilities: { tools: { listChanged: false }, resources: {}, logging: {} } }
  );
  registerProxy(server);
  return server;
}

export async function mountMcp(app: FastifyInstance, server: McpServer): Promise<void> {
  // Stateless mode per the SDK docs: a fresh transport for each request,
  // since a shared one breaks after the first initialize handshake.
  const handler = async (req: FastifyRequest, reply: FastifyReply) => {
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    reply.raw.on('close', () => {
      void transport.close().catch(() => {});
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(req.raw, reply.raw, req.body as unknown);
    } catch (err) {
      console.error('[mcp] request failed:', (err as Error).message);
      if (!reply.raw.headersSent) {
        reply.code(500).send({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal error' },
          id: null,
        });
      }
    }
  };

  app.all('/mcp', handler);
}
