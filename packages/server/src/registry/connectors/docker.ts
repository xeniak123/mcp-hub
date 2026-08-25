import type { ConnectorManifest } from '@hub/shared';

export const docker: ConnectorManifest = {
  id: 'docker',
  name: 'Docker',
  icon: 'Container',
  description: 'Manage Docker containers, images and volumes on the host.',
  category: 'cloud',
  docsUrl: 'https://github.com/docker/docker-mcp',
  keywords: ['containers', 'devops'],
  command: { run: ['npx', '-y', '@ckreuzberger/docker-mcp'], env: {} },
  configSchema: { type: 'object', properties: {} },
};
