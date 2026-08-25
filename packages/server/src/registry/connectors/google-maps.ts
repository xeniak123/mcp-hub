import type { ConnectorManifest } from '@hub/shared';

export const googleMaps: ConnectorManifest = {
  id: 'google-maps',
  name: 'Google Maps',
  icon: 'Map',
  description: 'Geocoding, directions, places and distance matrix via Google Maps.',
  category: 'other',
  docsUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/google-maps',
  official: true,
  keywords: ['maps', 'geo', 'directions'],
  command: { run: ['npx', '-y', '@modelcontextprotocol/server-google-maps'], env: {} },
  configSchema: {
    type: 'object',
    required: ['GOOGLE_MAPS_API_KEY'],
    properties: {
      GOOGLE_MAPS_API_KEY: {
        type: 'string',
        title: 'API Key',
        ui: { widget: 'password', helpUrl: 'https://console.cloud.google.com/apis/credentials' },
      },
    },
  },
};
