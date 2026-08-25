import type { ConnectorManifest } from '@hub/shared';

export const xero: ConnectorManifest = {
  id: 'xero',
  name: 'Xero',
  icon: 'Landmark',
  description:
    'Xero accounting — invoices, bills, contacts, bank transactions and reports from your Xero organization.',
  category: 'finance',
  docsUrl: 'https://github.com/gonzalezreal/xero-mcp',
  keywords: ['accounting', 'invoices', 'bookkeeping'],
  command: { run: ['npx', '-y', 'xero-mcp'], env: {} },
  configSchema: {
    type: 'object',
    required: ['XERO_CLIENT_ID', 'XERO_CLIENT_SECRET'],
    properties: {
      XERO_CLIENT_ID: {
        type: 'string',
        title: 'Client ID',
        description: 'From your Xero developer app.',
      },
      XERO_CLIENT_SECRET: {
        type: 'string',
        title: 'Client secret',
        ui: { widget: 'password' },
      },
      XERO_REDIRECT_URI: {
        type: 'string',
        title: 'Redirect URI (optional)',
        default: 'http://localhost:3000/callback',
      },
    },
  },
};
