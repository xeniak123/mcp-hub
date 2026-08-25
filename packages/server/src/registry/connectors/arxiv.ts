import type { ConnectorManifest } from '@hub/shared';

export const arxiv: ConnectorManifest = {
  id: 'arxiv',
  name: 'arXiv',
  icon: 'GraduationCap',
  description: 'Search scientific preprints, fetch abstracts and download papers.',
  category: 'ai',
  docsUrl: 'https://github.com/modelcontextprotocol/servers',
  keywords: ['papers', 'science', 'research'],
  command: { run: ['uvx', 'mcp-server-arxiv'], env: {} },
  configSchema: { type: 'object', properties: {}, required: [] },
};
