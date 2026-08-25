import type { ConnectorManifest } from '@hub/shared';

export const sqlite: ConnectorManifest = {
  id: 'sqlite',
  name: 'SQLite',
  icon: 'Table',
  description: 'Query and explore a local SQLite database file.',
  category: 'database',
  docsUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite',
  official: true,
  keywords: ['sql', 'db', 'local'],
  command: {
    run: [
      'uvx',
      'mcp-server-sqlite',
      '--db-path',
      '{env.DB_PATH}',
    ],
    env: {},
  },
  configSchema: {
    type: 'object',
    required: ['DB_PATH'],
    properties: {
      DB_PATH: {
        type: 'string',
        title: 'Database Path',
        description: 'Path to the .sqlite/.db file inside the container.',
        ui: { widget: 'text', placeholder: '/app/data/example.db' },
      },
    },
  },
};
