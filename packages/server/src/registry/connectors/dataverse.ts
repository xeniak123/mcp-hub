import type { ConnectorManifest } from '@hub/shared';

/**
 * Microsoft Dataverse (Power Platform / Dynamics 365 data layer) through the
 * generic REST MCP server — works with any instance exposing the Web API.
 */
export const dataverse: ConnectorManifest = {
  id: 'dataverse',
  name: 'Microsoft Dataverse',
  icon: 'Database',
  description:
    'Microsoft Dataverse / Dynamics 365 data platform — query and update tables behind Power Apps, Power Automate and Dynamics.',
  category: 'database',
  docsUrl: 'https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/overview',
  keywords: ['dynamics', 'power platform', 'crm', 'erp', 'microsoft'],
  command: { run: ['npx', '-y', 'mcp-remote', '{env.DATAVERSE_URL}'], env: {} },
  configSchema: {
    type: 'object',
    required: ['DATAVERSE_URL'],
    properties: {
      DATAVERSE_URL: {
        type: 'string',
        title: 'Dataverse Web API URL',
        description:
          'https://<org>.crm.dynamics.com/api/data/v9.2 — the hub proxies it with mcp-remote. Requires an MCP-enabled endpoint.',
        ui: { placeholder: 'https://myorg.crm4.dynamics.com/api/data/v9.2' },
      },
    },
  },
};
