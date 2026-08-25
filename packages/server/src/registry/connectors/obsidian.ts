import type { ConnectorManifest } from '@hub/shared';

export const obsidian: ConnectorManifest = {
  id: 'obsidian',
  name: 'Obsidian',
  icon: 'NotebookPen',
  description: 'Read, search and edit notes in your Obsidian vault via the Local REST API plugin.',
  category: 'productivity',
  docsUrl: 'https://github.com/coddingtonbear/obsidian-local-rest-api',
  keywords: ['notes', 'markdown', 'vault'],
  command: { run: ['npx', '-y', 'mcp-obsidian'], env: {} },
  configSchema: {
    type: 'object',
    required: ['OBSIDIAN_API_KEY'],
    properties: {
      OBSIDIAN_API_KEY: {
        type: 'string',
        title: 'REST API key',
        description: 'From the Local REST API plugin settings in Obsidian.',
        ui: { widget: 'password' },
      },
    },
  },
};
