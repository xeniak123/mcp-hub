import type { ConnectorManifest } from '@hub/shared';

export const memory: ConnectorManifest = {
  id: 'memory',
  name: 'Memory',
  icon: 'Brain',
  description: 'Persistent knowledge-graph memory across conversations.',
  category: 'ai',
  docsUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/memory',
  official: true,
  keywords: ['knowledge', 'graph', 'context'],
  command: { run: ['npx', '-y', '@modelcontextprotocol/server-memory'], env: {} },
  configSchema: {
    type: 'object',
    properties: {
      MEMORY_FILE_PATH: {
        type: 'string',
        title: 'Memory File Path',
        description: 'Where the knowledge graph is persisted (inside the container).',
        ui: { widget: 'text', placeholder: '/app/data/memory.json' },
      },
    },
  },
};
