import type { ConnectorManifest } from '@hub/shared';

export const postgres: ConnectorManifest = {
  id: 'postgres',
  name: 'PostgreSQL',
  icon: 'Database',
  description: 'Read-only SQL queries and schema inspection against a PostgreSQL database.',
  category: 'database',
  docsUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/postgres',
  official: true,
  keywords: ['sql', 'db'],
  // server-postgres takes the connection string as its first CLI argument,
  // not an environment variable.
  command: {
    run: ['npx', '-y', '@modelcontextprotocol/server-postgres', '{env.DATABASE_URI}'],
    env: {},
  },
  configSchema: {
    type: 'object',
    required: ['DATABASE_URI'],
    properties: {
      DATABASE_URI: {
        type: 'string',
        title: 'Connection String',
        description: 'postgresql://user:pass@host:5432/dbname',
        ui: { widget: 'text', placeholder: 'postgresql://...' },
      },
    },
  },
};
