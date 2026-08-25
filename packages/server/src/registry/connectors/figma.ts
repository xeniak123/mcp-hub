import type { ConnectorManifest } from '@hub/shared';

export const figma: ConnectorManifest = {
  id: 'figma',
  name: 'Figma',
  icon: 'PenTool',
  description: 'Inspect Figma designs, frames and design tokens.',
  category: 'design',
  docsUrl: 'https://github.com/GLips/Figma-Context-MCP',
  keywords: ['design', 'ui'],
  command: {
    run: ['npx', '-y', 'figma-developer-mcp', '--stdio'],
    env: {},
  },
  configSchema: {
    type: 'object',
    required: ['FIGMA_API_KEY'],
    properties: {
      FIGMA_API_KEY: {
        type: 'string',
        title: 'API Key',
        ui: { widget: 'password', helpUrl: 'https://www.figma.com/settings' },
      },
    },
  },
};
