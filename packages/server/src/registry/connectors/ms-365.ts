import type { ConnectorManifest } from '@hub/shared';

export const ms365: ConnectorManifest = {
  id: 'ms-365',
  name: 'Microsoft 365',
  icon: 'Mail',
  description:
    'Mail, calendar, contacts, OneDrive and Teams files through Microsoft Graph — the everyday Office suite for business users.',
  category: 'productivity',
  docsUrl: 'https://github.com/softeria-testing/ms-365-mcp-server',
  keywords: ['office', 'outlook', 'onedrive', 'excel', 'teams', 'graph'],
  command: { run: ['npx', '-y', '@softeria/ms-365-mcp-server'], env: {} },
  configSchema: {
    type: 'object',
    properties: {
      MS365_MCP_TENANT_ID: {
        type: 'string',
        title: 'Azure AD tenant ID (optional)',
        description: 'Only needed for a multi-tenant / organization app registration. Leave empty to use the default.',
        ui: { placeholder: '00000000-0000-0000-0000-000000000000' },
      },
      MS365_MCP_CLIENT_ID: {
        type: 'string',
        title: 'Azure app client ID (optional)',
        description: 'Your own Azure app registration client ID, if you do not want to use the built-in one.',
      },
      MS365_MCP_CLIENT_SECRET: {
        type: 'string',
        title: 'Azure app client secret (optional)',
        ui: { widget: 'password' },
      },
    },
  },
};
