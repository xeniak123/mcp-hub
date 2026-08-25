import type { ConnectorManifest } from '@hub/shared';

export const kagi: ConnectorManifest = {
  id: 'kagi',
  name: 'Kagi Search',
  icon: 'Compass',
  description: 'Ad-free web search and summarization via the Kagi API.',
  category: 'other',
  docsUrl: 'https://github.com/kagisearch/mcp-server',
  keywords: ['search', 'web'],
  command: { run: ['npx', '-y', '@mgmorton/kagi-mcp-server'], env: {} },
  configSchema: {
    type: 'object',
    required: ['KAGI_API_KEY'],
    properties: {
      KAGI_API_KEY: {
        type: 'string',
        title: 'API Key',
        ui: { widget: 'password', helpUrl: 'https://kagi.com/settings/user_api' },
      },
    },
  },
};
