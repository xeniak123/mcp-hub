import type { ConnectorManifest } from '@hub/shared';

export const slack: ConnectorManifest = {
  id: 'slack',
  name: 'Slack',
  icon: 'MessageSquare',
  description: 'List channels, post messages and read channel history in your workspace.',
  category: 'communication',
  docsUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/slack',
  official: true,
  keywords: ['chat', 'messages'],
  command: { run: ['npx', '-y', '@modelcontextprotocol/server-slack'], env: {} },
  configSchema: {
    type: 'object',
    required: ['SLACK_BOT_TOKEN', 'SLACK_TEAM_ID'],
    properties: {
      SLACK_BOT_TOKEN: {
        type: 'string',
        title: 'Bot Token (xoxb)',
        description: 'OAuth bot token with chat:write and channels:history scopes.',
        ui: { widget: 'password' },
      },
      SLACK_TEAM_ID: {
        type: 'string',
        title: 'Team ID',
        description: 'Workspace ID, found in the workspace URL.',
        ui: { placeholder: 'T01234567' },
      },
    },
  },
};
