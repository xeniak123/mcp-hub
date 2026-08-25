import type { ConnectorManifest } from '@hub/shared';

export const twilio: ConnectorManifest = {
  id: 'twilio',
  name: 'Twilio',
  icon: 'Phone',
  description:
    'Twilio communications — send SMS/WhatsApp messages, manage calls, lookup numbers and use the full Twilio API surface.',
  category: 'communication',
  docsUrl: 'https://www.npmjs.com/package/@twilio-alpha/mcp',
  official: true,
  keywords: ['sms', 'whatsapp', 'voice', 'notifications'],
  command: { run: ['npx', '-y', '@twilio-alpha/mcp'], env: {} },
  configSchema: {
    type: 'object',
    required: ['TWILIO_ACCOUNT_SID', 'TWILIO_API_KEY', 'TWILIO_API_SECRET'],
    properties: {
      TWILIO_ACCOUNT_SID: {
        type: 'string',
        title: 'Account SID',
        description: 'Found on the Twilio Console dashboard.',
        ui: { placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
      },
      TWILIO_API_KEY: {
        type: 'string',
        title: 'API key SID',
        description: 'Console → Account → API keys & tokens.',
      },
      TWILIO_API_SECRET: {
        type: 'string',
        title: 'API key secret',
        ui: { widget: 'password' },
      },
    },
  },
};
