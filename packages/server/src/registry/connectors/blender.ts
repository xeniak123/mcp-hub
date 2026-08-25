import type { ConnectorManifest } from '@hub/shared';

export const blender: ConnectorManifest = {
  id: 'blender',
  name: 'Blender',
  icon: 'Box',
  description: 'Scene control, object creation and rendering through the Blender MCP addon.',
  category: 'design',
  docsUrl: 'https://github.com/ahujasid/blender-mcp',
  keywords: ['3d', 'render', 'modeling'],
  command: { run: ['uvx', 'blender-mcp'], env: {} },
  configSchema: {
    type: 'object',
    required: ['BLENDER_HOST'],
    properties: {
      BLENDER_HOST: {
        type: 'string',
        title: 'Blender host',
        description: 'Host running Blender with the MCP addon socket server enabled.',
        ui: { widget: 'text', placeholder: 'host.docker.internal' },
      },
    },
  },
};
