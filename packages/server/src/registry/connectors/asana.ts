import type { ConnectorManifest } from '@hub/shared';

export const asana: ConnectorManifest = {
  id: 'asana',
  name: 'Asana',
  icon: 'ListChecks',
  description: 'Tasks, projects and sections in Asana workspaces.',
  category: 'productivity',
  docsUrl: 'https://developers.asana.com/reference',
  keywords: ['tasks', 'projects', 'work management'],
  command: { run: ['npx', '-y', '@modelcontextprotocol/server-asana'], env: {} },
  configSchema: {
    type: 'object',
    required: ['ASANA_ACCESS_TOKEN'],
    properties: {
      ASANA_ACCESS_TOKEN: {
        type: 'string',
        title: 'Personal access token',
        ui: { widget: 'password', helpUrl: 'https://app.asana.com/0/my-apps' },
      },
    },
  },
};
