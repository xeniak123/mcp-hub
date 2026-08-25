import type { ConnectorManifest } from '@hub/shared';

/**
 * Official Salesforce DX MCP server. Auth is delegated to the Salesforce CLI:
 * orgs are authorized beforehand (`sf org login web`) and the server resolves
 * them by alias/username, so no secrets live in the hub config.
 */
export const salesforce: ConnectorManifest = {
  id: 'salesforce',
  name: 'Salesforce',
  icon: 'Cloud',
  description:
    'Official Salesforce CRM server — query records (SOQL), manage metadata, Apex tests and users against your authorized orgs.',
  category: 'finance',
  docsUrl: 'https://github.com/salesforcecli/mcp',
  official: true,
  keywords: ['crm', 'soql', 'apex', 'sales cloud', 'dx'],
  command: {
    run: [
      'npx',
      '-y',
      '@salesforce/mcp',
      '--orgs',
      '{env.SF_ORG_ALIAS}',
      '--toolsets',
      '{env.SF_TOOLSETS}',
    ],
    env: {},
  },
  configSchema: {
    type: 'object',
    required: ['SF_ORG_ALIAS'],
    properties: {
      SF_ORG_ALIAS: {
        type: 'string',
        title: 'Org username or alias',
        description:
          'A username or `sf org login web` alias already authorized on this machine. Use ALLOW_ALL_ORGS to expose every stored org.',
        ui: { placeholder: 'DEFAULT_TARGET_ORG' },
      },
      SF_TOOLSETS: {
        type: 'string',
        title: 'Toolsets',
        description: 'Comma-separated toolset list. Default covers the common read/write sets.',
        default: 'orgs,metadata,data,users',
      },
    },
  },
};
