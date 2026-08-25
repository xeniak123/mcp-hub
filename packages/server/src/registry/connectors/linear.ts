import type { ConnectorManifest } from '@hub/shared';

export const linear: ConnectorManifest = {
  id: 'linear',
  name: 'Linear',
  icon: 'Zap',
  description: 'Issues, projects, teams and cycles from Linear.',
  category: 'productivity',
  docsUrl: 'https://mcp.so/server/linear-mcp-server',
  keywords: ['issues', 'projects', 'tracking'],
  command: { run: ['npx', '-y', '@linear/mcp-server'], env: {} },
  configSchema: {
    type: 'object',
    required: ['LINEAR_API_KEY'],
    properties: {
      LINEAR_API_KEY: {
        type: 'string',
        title: 'API Key',
        ui: { widget: 'password', helpUrl: 'https://linear.app/settings/api' },
      },
    },
  },
};
