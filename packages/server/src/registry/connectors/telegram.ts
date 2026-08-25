import type { ConnectorManifest } from '@hub/shared';

export const telegram: ConnectorManifest = {
  id: 'telegram',
  name: 'Telegram',
  icon: 'Send',
  description: 'Send messages, read chats and manage groups via a Telegram bot.',
  category: 'communication',
  docsUrl: 'https://core.telegram.org/bots/api',
  keywords: ['bot', 'messaging', 'chat'],
  command: { run: ['npx', '-y', 'mcp-telegram-server'], env: {} },
  configSchema: {
    type: 'object',
    required: ['TELEGRAM_BOT_TOKEN'],
    properties: {
      TELEGRAM_BOT_TOKEN: {
        type: 'string',
        title: 'Bot token',
        description: 'Create via @BotFather.',
        ui: { widget: 'password', helpUrl: 'https://t.me/BotFather' },
      },
    },
  },
};
