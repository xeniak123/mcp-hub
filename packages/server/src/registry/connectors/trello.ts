import type { ConnectorManifest } from '@hub/shared';

export const trello: ConnectorManifest = {
  id: 'trello',
  name: 'Trello',
  icon: 'SquareKanban',
  description: 'Boards, lists, cards and checklists — create and update from your AI client.',
  category: 'productivity',
  docsUrl: 'https://developer.atlassian.com/cloud/trello/rest/',
  keywords: ['kanban', 'boards', 'project'],
  command: { run: ['npx', '-y', '@modelcontextprotocol/server-trello'], env: {} },
  configSchema: {
    type: 'object',
    required: ['TRELLO_API_KEY', 'TRELLO_TOKEN'],
    properties: {
      TRELLO_API_KEY: {
        type: 'string',
        title: 'API key',
        ui: { widget: 'password', helpUrl: 'https://trello.com/app-key' },
      },
      TRELLO_TOKEN: {
        type: 'string',
        title: 'Token',
        description: 'Generated on the same page as the API key.',
        ui: { widget: 'password', helpUrl: 'https://trello.com/app-key' },
      },
    },
  },
};
