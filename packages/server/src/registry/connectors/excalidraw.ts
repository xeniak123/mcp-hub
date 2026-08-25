import type { ConnectorManifest } from '@hub/shared';

export const excalidraw: ConnectorManifest = {
  id: 'excalidraw',
  name: 'Excalidraw',
  icon: 'PenTool',
  description: 'Create and edit hand-drawn style diagrams as excalidraw JSON scenes.',
  category: 'design',
  docsUrl: 'https://github.com/excalidraw/excalidraw',
  keywords: ['diagram', 'whiteboard', 'sketch'],
  command: { run: ['npx', '-y', 'excalidraw-mcp'], env: {} },
  configSchema: {
    type: 'object',
    required: ['EXCALIDRAW_API_KEY'],
    properties: {
      EXCALIDRAW_API_KEY: {
        type: 'string',
        title: 'API key',
        description: 'For storing scenes in your Excalidraw+ workspace.',
        ui: { widget: 'password' },
      },
    },
  },
};
