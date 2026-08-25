import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { manager } from '../connectors/manager.js';
import { decodeNamespaced } from './namespace.js';

const CACHE_TTL_MS = 30_000;

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

type AggregatedTool = {
  name: string;
  description?: string;
  inputSchema: object;
};

/**
 * Aggregates every enabled connector's tools/resources under
 * namespaced names and routes calls back to the owning child process.
 */
export function registerProxy(server: McpServer): void {
  const toolCache = new Map<string, CacheEntry<AggregatedTool[]>>();
  const resourceCache = new Map<string, CacheEntry<Awaited<ReturnType<typeof listResourcesOf>>>>();

  function invalidate(): void {
    toolCache.clear();
    resourceCache.clear();
  }
  manager.onCacheInvalidate = invalidate;

  async function listToolsOf(connectorId: string) {
    const managed = manager.get(connectorId);
    if (!managed?.client || !managed.enabled) return [];
    try {
      const res = await managed.client.listTools();
      return res.tools;
    } catch (err) {
      console.warn(`[hub] listTools failed for ${managed.slug}: ${(err as Error).message}`);
      return [];
    }
  }

  async function aggregateTools(): Promise<AggregatedTool[]> {
    const now = Date.now();
    const cached = toolCache.get('all');
    if (cached && cached.expiresAt > now) return cached.data;

    const results = await Promise.allSettled(
      manager.enabled().map(async (managed) => {
        const tools = await listToolsOf(managed.id);
        const mapped: AggregatedTool[] = [];
        for (const tool of tools) {
          // guard: original names must not contain the separator
          if (!tool.name.includes('__')) {
            mapped.push({
              name: `${managed.slug}__${tool.name}`,
              description: tool.description,
              inputSchema: tool.inputSchema,
            });
          }
        }
        return mapped;
      })
    );
    const tools = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
    toolCache.set('all', { data: tools, expiresAt: now + CACHE_TTL_MS });
    return tools;
  }

  // --- Tools ---
  server.server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = await aggregateTools();
    return { tools };
  });

  server.server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const decoded = decodeNamespaced(name);
    if (!decoded) throw new Error(`Tool not found: ${name}`);
    const managed = manager.all().find((c) => c.slug === decoded.slug);
    if (!managed?.client || !managed.enabled) {
      throw new Error(`Connector '${decoded.slug}' is not running`);
    }
    return managed.client.callTool({ name: decoded.tool, arguments: args ?? {} });
  });

  // --- Resources ---
  server.server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const resources = await aggregateResources();
    return { resources };
  });

  server.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    if (!uri.startsWith('connector://')) throw new Error(`Unknown resource: ${uri}`);
    const rest = uri.slice('connector://'.length);
    const sepIdx = rest.indexOf('/');
    const slug = rest.slice(0, sepIdx);
    const original = decodeURIComponent(rest.slice(sepIdx + 1));
    const managed = manager.all().find((c) => c.slug === slug);
    if (!managed?.client || !managed.enabled) {
      throw new Error(`Connector '${slug}' is not running`);
    }
    return managed.client.readResource({ uri: original });
  });

  async function listResourcesOf(connectorId: string) {
    const managed = manager.get(connectorId);
    if (!managed?.client || !managed.enabled) return [];
    try {
      const res = await managed.client.listResources();
      return res.resources;
    } catch {
      return [];
    }
  }

  async function aggregateResources() {
    const now = Date.now();
    const cached = resourceCache.get('all');
    if (cached && cached.expiresAt > now) return cached.data;
    const results = await Promise.allSettled(
      manager.enabled().map(async (managed) => {
        const resources = await listResourcesOf(managed.id);
        return resources.map((r) => ({
          ...r,
          uri: `connector://${managed.slug}/${encodeURIComponent(r.uri)}`,
        }));
      })
    );
    const resources = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
    resourceCache.set('all', { data: resources, expiresAt: now + CACHE_TTL_MS });
    return resources;
  }
}
