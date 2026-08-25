import type { ConnectorManifest } from '@hub/shared';

export const airtable: ConnectorManifest = {
  id: 'airtable',
  name: 'Airtable',
  icon: 'Table2',
  description: 'Bases, tables and records — list, create and update Airtable data.',
  category: 'productivity',
  docsUrl: 'https://airtable.com/developers/web/api/introduction',
  keywords: ['spreadsheet', 'base', 'records'],
  command: { run: ['npx', '-y', 'airtable-mcp-server'], env: {} },
  configSchema: {
    type: 'object',
    required: ['AIRTABLE_API_KEY'],
    properties: {
      AIRTABLE_API_KEY: {
        type: 'string',
        title: 'Personal access token',
        ui: { widget: 'password', helpUrl: 'https://airtable.com/create/tokens' },
      },
    },
  },
};
