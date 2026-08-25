import type { ConnectorManifest } from '@hub/shared';

export const discord: ConnectorManifest = {
  id: 'discord',
  name: 'Discord',
  icon: 'MessagesSquare',
  description: 'Read and send messages in Discord channels via a bot.',
  category: 'communication',
  docsUrl: 'https://github.com/1SneakyMarmot/mcp-discord',
  keywords: ['chat', 'community'],
  command: { run: ['npx', '-y', '@sirmews/mcp-discord'], env: {} },
  configSchema: {
    type: 'object',
    required: ['DISCORD_TOKEN'],
    properties: {
      DISCORD_TOKEN: {
        type: 'string',
        title: 'Bot Token',
        ui: { widget: 'password', helpUrl: 'https://discord.com/developers/applications' },
      },
    },
  },
};
