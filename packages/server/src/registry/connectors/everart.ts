import type { ConnectorManifest } from '@hub/shared';

export const everart: ConnectorManifest = {
  id: 'everart',
  name: 'EverArt',
  icon: 'Image',
  description: 'AI image generation with multiple models via EverArt.',
  category: 'design',
  docsUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/everart',
  official: true,
  keywords: ['images', 'generation'],
  command: { run: ['npx', '-y', '@modelcontextprotocol/server-everart'], env: {} },
  configSchema: {
    type: 'object',
    required: ['EVERART_API_KEY'],
    properties: {
      EVERART_API_KEY: {
        type: 'string',
        title: 'API Key',
        ui: { widget: 'password', helpUrl: 'https://everart.ai/dashboard' },
      },
    },
  },
};
