import type { ConnectorManifest } from '@hub/shared';

export const homeAssistant: ConnectorManifest = {
  id: 'home-assistant',
  name: 'Home Assistant',
  icon: 'House',
  description: 'Control lights, switches and automations; read sensor states via the REST API.',
  category: 'other',
  docsUrl: 'https://www.home-assistant.io/integrations/mcp/',
  keywords: ['smart home', 'iot', 'automation'],
  command: { run: ['npx', '-y', 'homeassistant-mcp-server'], env: {} },
  configSchema: {
    type: 'object',
    required: ['HA_URL', 'HA_TOKEN'],
    properties: {
      HA_URL: {
        type: 'string',
        title: 'Instance URL',
        description: 'Base URL of your Home Assistant instance.',
        ui: { widget: 'text', placeholder: 'http://homeassistant.local:8123' },
      },
      HA_TOKEN: {
        type: 'string',
        title: 'Long-lived access token',
        description: 'Profile → Security → Long-lived access tokens.',
        ui: { widget: 'password', helpUrl: 'https://my.home-assistant.io/redirect/profile/' },
      },
    },
  },
};
