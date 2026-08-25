import type { ConnectorManifest } from '@hub/shared';

export const wikipedia: ConnectorManifest = {
  id: 'wikipedia',
  name: 'Wikipedia',
  icon: 'BookOpen',
  description: 'Search and read Wikipedia articles in any language edition.',
  category: 'other',
  docsUrl: 'https://github.com/modelcontextprotocol/servers',
  keywords: ['encyclopedia', 'reference', 'knowledge'],
  command: { run: ['uvx', 'mcp-server-fetch'], env: {} },
  configSchema: { type: 'object', properties: {}, required: [] },
};
