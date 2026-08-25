import type { ConnectorManifest } from '@hub/shared';

export const dropbox: ConnectorManifest = {
  id: 'dropbox',
  name: 'Dropbox',
  icon: 'FolderOpen',
  description: 'List, search, read and upload files in your Dropbox.',
  category: 'files',
  docsUrl: 'https://www.dropbox.com/developers/documentation',
  keywords: ['storage', 'cloud files'],
  command: { run: ['npx', '-y', 'mcp-dropbox-server'], env: {} },
  configSchema: {
    type: 'object',
    required: ['DROPBOX_ACCESS_TOKEN'],
    properties: {
      DROPBOX_ACCESS_TOKEN: {
        type: 'string',
        title: 'Access token',
        ui: { widget: 'password', helpUrl: 'https://www.dropbox.com/developers/apps' },
      },
    },
  },
};
