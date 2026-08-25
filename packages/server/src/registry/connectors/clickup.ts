import type { ConnectorManifest } from '@hub/shared';

export const clickup: ConnectorManifest = {
  id: 'clickup',
  name: 'ClickUp',
  icon: 'Layers',
  description: 'Tasks, lists and statuses across your ClickUp workspaces.',
  category: 'productivity',
  docsUrl: 'https://developer.clickup.com/reference',
  keywords: ['tasks', 'project', 'agile'],
  command: { run: ['npx', '-y', '@taazv/mcp-clickup'], env: {} },
  configSchema: {
    type: 'object',
    required: ['CLICKUP_API_KEY'],
    properties: {
      CLICKUP_API_KEY: {
        type: 'string',
        title: 'API key',
        ui: { widget: 'password', helpUrl: 'https://app.clickup.com/settings/apps' },
      },
    },
  },
};
