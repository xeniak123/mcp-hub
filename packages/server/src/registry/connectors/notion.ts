import type { ConnectorManifest } from '@hub/shared';

export const notion: ConnectorManifest = {
  id: 'notion',
  name: 'Notion',
  icon: 'Notebook',
  description: 'Search, read and update Notion pages and databases.',
  category: 'productivity',
  docsUrl: 'https://github.com/makenotion/notion-mcp-server',
  keywords: ['wiki', 'docs'],
  command: { run: ['npx', '-y', '@notionhq/notion-mcp-server'], env: {} },
  configSchema: {
    type: 'object',
    required: ['NOTION_API_KEY'],
    properties: {
      NOTION_API_KEY: {
        type: 'string',
        title: 'Internal Integration Token',
        ui: { widget: 'password', helpUrl: 'https://www.notion.so/my-integrations' },
      },
    },
  },
};
