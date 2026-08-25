import type { ConnectorManifest } from '@hub/shared';

export const quickbooks: ConnectorManifest = {
  id: 'quickbooks',
  name: 'QuickBooks',
  icon: 'Receipt',
  description:
    'QuickBooks Online accounting — customers, invoices, payments and reports through the official QBO API.',
  category: 'finance',
  docsUrl: 'https://github.com/kjnh10/qlib-mcp/tree/main/apps/mcp-server-quickbooks',
  keywords: ['accounting', 'invoices', 'bookkeeping', 'qbo'],
  command: { run: ['npx', '-y', 'quickbooks-mcp'], env: {} },
  configSchema: {
    type: 'object',
    required: ['QBO_CLIENT_ID', 'QBO_CLIENT_SECRET', 'QBO_REFRESH_TOKEN', 'QBO_COMPANY_ID'],
    properties: {
      QBO_CLIENT_ID: {
        type: 'string',
        title: 'Client ID',
        description: 'From your Intuit Developer app (OAuth 2.0).',
      },
      QBO_CLIENT_SECRET: {
        type: 'string',
        title: 'Client secret',
        ui: { widget: 'password' },
      },
      QBO_REFRESH_TOKEN: {
        type: 'string',
        title: 'Refresh token',
        description: 'Generated during the Intuit OAuth flow.',
        ui: { widget: 'password' },
      },
      QBO_COMPANY_ID: {
        type: 'string',
        title: 'Company (realm) ID',
        description: 'Visible in the QuickBooks Online URL when the company is open.',
      },
      QBO_SANDBOX: {
        type: 'boolean',
        title: 'Use sandbox environment',
        default: false,
      },
    },
  },
};
