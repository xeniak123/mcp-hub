import type { ConnectorManifest } from '@hub/shared';

export const mongodb: ConnectorManifest = {
  id: 'mongodb',
  name: 'MongoDB',
  icon: 'Leaf',
  description: 'Query collections, inspect indexes and aggregate documents in MongoDB.',
  category: 'database',
  docsUrl: 'https://github.com/modelcontextprotocol/servers',
  keywords: ['mongo', 'nosql', 'documents'],
  command: { run: ['npx', '-y', 'mcp-mongo-server', '{env.MONGODB_URI}'], env: {} },
  configSchema: {
    type: 'object',
    required: ['MONGODB_URI'],
    properties: {
      MONGODB_URI: {
        type: 'string',
        title: 'MongoDB URI',
        description: 'mongodb+srv:// or mongodb:// connection string.',
        ui: { widget: 'password', placeholder: 'mongodb://…' },
      },
    },
  },
};
