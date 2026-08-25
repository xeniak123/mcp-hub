import type { ConnectorManifest } from '@hub/shared';

export const freshdesk: ConnectorManifest = {
  id: 'freshdesk',
  name: 'Freshdesk',
  icon: 'LifeBuoy',
  description:
    'Freshdesk support desk — browse, search, update and reply to tickets through the Freshdesk API v2.',
  category: 'communication',
  docsUrl: 'https://www.npmjs.com/package/ud-freshdesk-mcp',
  keywords: ['helpdesk', 'tickets', 'support', 'customer service'],
  command: { run: ['npx', '-y', 'ud-freshdesk-mcp'], env: {} },
  configSchema: {
    type: 'object',
    required: ['FRESHDESK_DOMAIN', 'FRESHDESK_API_KEY'],
    properties: {
      FRESHDESK_DOMAIN: {
        type: 'string',
        title: 'Domain',
        description: 'The part before .freshdesk.com in your portal URL.',
        ui: { placeholder: 'mycompany' },
      },
      FRESHDESK_API_KEY: {
        type: 'string',
        title: 'API key',
        description: 'Profile settings → Your API key.',
        ui: { widget: 'password' },
      },
    },
  },
};
