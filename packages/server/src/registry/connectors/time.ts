import type { ConnectorManifest } from '@hub/shared';

export const time: ConnectorManifest = {
  id: 'time',
  name: 'Time',
  icon: 'Clock',
  description: 'Current time and timezone conversions — zero configuration.',
  category: 'other',
  docsUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/time',
  official: true,
  keywords: ['clock', 'timezone'],
  command: { run: ['uvx', 'mcp-server-time'], env: {} },
  configSchema: { type: 'object', properties: {}, required: [] },
};
