import type { ConnectorManifest } from '@hub/shared';

export const youtube: ConnectorManifest = {
  id: 'youtube',
  name: 'YouTube',
  icon: 'Youtube',
  description: 'Search videos, fetch transcripts and read video metadata.',
  category: 'other',
  docsUrl: 'https://github.com/modelcontextprotocol/servers',
  keywords: ['video', 'transcript', 'search'],
  command: { run: ['uvx', 'mcp-youtube-transcript'], env: {} },
  configSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};
