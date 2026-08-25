import type { ConnectorManifest } from '@hub/shared';

export const pipedrive: ConnectorManifest = {
  id: 'pipedrive',
  name: 'Pipedrive',
  icon: 'Filter',
  description:
    'Pipedrive CRM — manage deals, leads, persons, organizations and activities from your sales pipeline.',
  category: 'finance',
  docsUrl: 'https://www.npmjs.com/package/pipedrive-mcp-server',
  keywords: ['crm', 'deals', 'sales pipeline', 'leads'],
  command: { run: ['npx', '-y', 'pipedrive-mcp'], env: {} },
  configSchema: {
    type: 'object',
    required: ['PIPEDRIVE_API_TOKEN'],
    properties: {
      PIPEDRIVE_API_TOKEN: {
        type: 'string',
        title: 'API token',
        description: 'Pipedrive → Settings → Personal → API.',
        ui: { widget: 'password' },
      },
    },
  },
};
