import type { ConnectorManifest } from '@hub/shared';

export const todoist: ConnectorManifest = {
  id: 'todoist',
  name: 'Todoist',
  icon: 'CheckSquare',
  description: 'Manage tasks, projects and labels in Todoist.',
  category: 'productivity',
  docsUrl: 'https://github.com/abhiz123/todoist-mcp-server',
  keywords: ['tasks', 'todo'],
  command: { run: ['npx', '-y', '@abhiz123/todoist-mcp-server'], env: {} },
  configSchema: {
    type: 'object',
    required: ['TODOIST_API_TOKEN'],
    properties: {
      TODOIST_API_TOKEN: {
        type: 'string',
        title: 'API Token',
        ui: { widget: 'password', helpUrl: 'https://app.todoist.com/app/settings/integrations' },
      },
    },
  },
};
