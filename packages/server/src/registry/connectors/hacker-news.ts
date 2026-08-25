import type { ConnectorManifest } from '@hub/shared';

export const hackerNews: ConnectorManifest = {
  id: 'hacker-news',
  name: 'Hacker News',
  icon: 'Newspaper',
  description: 'Top stories, Ask HN, comments and user profiles from the Hacker News API.',
  category: 'other',
  docsUrl: 'https://github.com/erithwik/mcp-hn',
  keywords: ['news', 'tech', 'hn'],
  command: { run: ['uvx', 'mcp-hn'], env: {} },
  configSchema: { type: 'object', properties: {}, required: [] },
};
