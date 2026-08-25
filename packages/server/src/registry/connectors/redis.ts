import type { ConnectorManifest } from '@hub/shared';

export const redis: ConnectorManifest = {
  id: 'redis',
  name: 'Redis',
  icon: 'DatabaseZap',
  description: 'Browse keys, inspect data types and run read-only commands against Redis.',
  category: 'database',
  docsUrl: 'https://github.com/modelcontextprotocol/servers',
  keywords: ['cache', 'kv', 'nosql'],
  command: { run: ['npx', '-y', '@gongrzhe/server-redis-mcp', '{env.REDIS_URI}'], env: {} },
  configSchema: {
    type: 'object',
    required: ['REDIS_URI'],
    properties: {
      REDIS_URI: {
        type: 'string',
        title: 'Redis URI',
        description: 'e.g. redis://user:pass@host:6379',
        ui: { widget: 'password', placeholder: 'redis://…' },
      },
    },
  },
};
