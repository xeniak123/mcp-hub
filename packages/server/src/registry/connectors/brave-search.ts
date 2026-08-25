import type { ConnectorManifest } from '@hub/shared';

export const braveSearch: ConnectorManifest = {
  id: 'brave-search',
  name: 'Brave Search',
  icon: 'Shield',
  description: 'Privacy-focused web and local search via the Brave Search API.',
  category: 'ai',
  docsUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search',
  official: true,
  keywords: ['web search', 'privacy'],
  command: { run: ['npx', '-y', '@modelcontextprotocol/server-brave-search'], env: {} },
  configSchema: {
    type: 'object',
    required: ['BRAVE_API_KEY'],
    properties: {
      BRAVE_API_KEY: {
        type: 'string',
        title: 'API key',
        ui: { widget: 'password', helpUrl: 'https://api-dashboard.search.brave.com/register' },
      },
    },
  },
};
