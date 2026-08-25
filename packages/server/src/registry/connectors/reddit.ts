import type { ConnectorManifest } from '@hub/shared';

export const reddit: ConnectorManifest = {
  id: 'reddit',
  name: 'Reddit',
  icon: 'MessagesSquare',
  description: 'Browse subreddits, fetch posts and read comment threads.',
  category: 'other',
  docsUrl: 'https://www.reddit.com/dev/api/',
  keywords: ['forum', 'posts', 'social'],
  command: { run: ['uvx', 'mcp-server-reddit'], env: {} },
  configSchema: {
    type: 'object',
    properties: {
      REDDIT_CLIENT_ID: { type: 'string', title: 'Client ID (optional)', ui: { widget: 'text' } },
      REDDIT_CLIENT_SECRET: { type: 'string', title: 'Client secret (optional)', ui: { widget: 'password' } },
    },
    required: [],
  },
};
