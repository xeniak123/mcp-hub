import type { ConnectorManifest } from '@hub/shared';

export const servicenow: ConnectorManifest = {
  id: 'servicenow',
  name: 'ServiceNow',
  icon: 'Building2',
  description:
    'ServiceNow ITSM — full CRUD on incidents, changes and CMDB records, plus background scripts and flow testing.',
  category: 'other',
  docsUrl: 'https://www.npmjs.com/package/@onlyflows/servicenow-mcp',
  keywords: ['itsm', 'incidents', 'cmdb', 'it service'],
  command: { run: ['npx', '-y', '@onlyflows/servicenow-mcp'], env: {} },
  configSchema: {
    type: 'object',
    required: ['SN_INSTANCE', 'SN_USER', 'SN_PASSWORD'],
    properties: {
      SN_INSTANCE: {
        type: 'string',
        title: 'Instance URL',
        ui: { placeholder: 'https://mycompany.service-now.com' },
      },
      SN_USER: {
        type: 'string',
        title: 'Username',
      },
      SN_PASSWORD: {
        type: 'string',
        title: 'Password',
        ui: { widget: 'password' },
      },
      SN_DISPLAY_VALUE: {
        type: 'boolean',
        title: 'Return display values instead of raw sys_ids',
        default: true,
      },
    },
  },
};
