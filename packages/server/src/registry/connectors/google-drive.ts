import type { ConnectorManifest } from '@hub/shared';

export const googleDrive: ConnectorManifest = {
  id: 'google-drive',
  name: 'Google Drive',
  icon: 'HardDrive',
  description: 'Search and read files from Google Drive.',
  category: 'files',
  docsUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/gdrive',
  official: true,
  keywords: ['docs', 'storage', 'google'],
  command: { run: ['npx', '-y', '@modelcontextprotocol/server-gdrive'], env: {} },
  configSchema: {
    type: 'object',
    required: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    properties: {
      GOOGLE_CLIENT_ID: {
        type: 'string',
        title: 'OAuth Client ID',
        ui: { helpUrl: 'https://console.cloud.google.com/apis/credentials' },
      },
      GOOGLE_CLIENT_SECRET: {
        type: 'string',
        title: 'OAuth Client Secret',
        ui: { widget: 'password' },
      },
    },
  },
};
