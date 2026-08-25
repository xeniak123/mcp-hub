import type { ConnectorManifest } from '@hub/shared';

export const hubspot: ConnectorManifest = {
  id: 'hubspot',
  name: 'HubSpot',
  icon: 'Contact',
  description: 'Contacts, companies, deals and engagements from your HubSpot CRM.',
  category: 'finance',
  docsUrl: 'https://developers.hubspot.com/docs/api/overview',
  keywords: ['crm', 'deals', 'sales'],
  command: { run: ['npx', '-y', '@hubspot/mcp-server'], env: {} },
  configSchema: {
    type: 'object',
    required: ['HUBSPOT_ACCESS_TOKEN'],
    properties: {
      HUBSPOT_ACCESS_TOKEN: {
        type: 'string',
        title: 'Private app token',
        ui: { widget: 'password', helpUrl: 'https://developers.hubspot.com/beta-docs/guides/apps/private-apps/' },
      },
    },
  },
};
