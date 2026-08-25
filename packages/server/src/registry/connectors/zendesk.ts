import type { ConnectorManifest } from '@hub/shared';

export const zendesk: ConnectorManifest = {
  id: 'zendesk',
  name: 'Zendesk',
  icon: 'Headphones',
  description:
    'Zendesk Support & Help Center — search tickets, draft replies, manage macros and Help Center articles end to end.',
  category: 'communication',
  docsUrl: 'https://www.npmjs.com/package/@fruggr/zendesk-mcp-server',
  keywords: ['helpdesk', 'tickets', 'support', 'customer service'],
  command: { run: ['npx', '-y', '@fruggr/zendesk-mcp-server'], env: {} },
  configSchema: {
    type: 'object',
    required: ['ZENDESK_SUBDOMAIN', 'ZENDESK_EMAIL', 'ZENDESK_API_TOKEN'],
    properties: {
      ZENDESK_SUBDOMAIN: {
        type: 'string',
        title: 'Subdomain',
        description: 'The part before .zendesk.com in your help desk URL.',
        ui: { placeholder: 'mycompany' },
      },
      ZENDESK_EMAIL: {
        type: 'string',
        title: 'Agent email',
        ui: { placeholder: 'agent@mycompany.com' },
      },
      ZENDESK_API_TOKEN: {
        type: 'string',
        title: 'API token',
        description: 'Admin Center → Apps and APIs → Zendesk API.',
        ui: { widget: 'password' },
      },
    },
  },
};
