import type { ConnectorManifest } from '@hub/shared';

export const filesystem: ConnectorManifest = {
  id: 'filesystem',
  name: 'Filesystem',
  icon: 'FolderOpen',
  description: 'Read, write and search files inside an allowed directory on the host.',
  category: 'files',
  docsUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem',
  official: true,
  keywords: ['files', 'local', 'disk'],
  command: {
    run: [
      'npx',
      '-y',
      '@modelcontextprotocol/server-filesystem',
      '{env.ALLOWED_DIRECTORY}',
    ],
    env: {},
  },
  configSchema: {
    type: 'object',
    required: ['ALLOWED_DIRECTORY'],
    properties: {
      ALLOWED_DIRECTORY: {
        type: 'string',
        title: 'Allowed Directory',
        description:
          'Absolute path the server may access. Inside Docker use a mounted volume, e.g. /app/data/workspace.',
        ui: { widget: 'text', placeholder: '/app/data/workspace' },
      },
    },
  },
};
