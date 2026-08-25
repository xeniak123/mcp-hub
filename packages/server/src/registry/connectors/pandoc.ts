import type { ConnectorManifest } from '@hub/shared';

export const pandoc: ConnectorManifest = {
  id: 'pandoc',
  name: 'Pandoc',
  icon: 'FileType',
  description: 'Convert documents between formats (Markdown, DOCX, PDF, HTML…) using Pandoc.',
  category: 'files',
  docsUrl: 'https://github.com/vivekVells/mcp-pandoc',
  keywords: ['convert', 'documents'],
  command: { run: ['npx', '-y', 'mcp-pandoc'], env: {} },
  configSchema: {
    type: 'object',
    properties: {},
  },
};
