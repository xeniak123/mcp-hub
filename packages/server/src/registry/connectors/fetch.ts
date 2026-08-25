import type { ConnectorManifest } from '@hub/shared';

export const fetchConnector: ConnectorManifest = {
  id: 'fetch',
  name: 'Fetch',
  icon: 'Globe',
  description: 'Fetch web pages and convert them to markdown for LLM consumption.',
  category: 'other',
  docsUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/fetch',
  official: true,
  keywords: ['web', 'http', 'scrape'],
  command: { run: ['npx', '-y', '@modelcontextprotocol/server-fetch'], env: {} },
  configSchema: {
    type: 'object',
    properties: {
      USER_AGENT: {
        type: 'string',
        title: 'User-Agent',
        description: 'Custom User-Agent header sent with requests.',
        ui: { placeholder: 'MCP-Hub/1.0' },
      },
    },
  },
};
