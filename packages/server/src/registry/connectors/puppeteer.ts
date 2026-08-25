import type { ConnectorManifest } from '@hub/shared';

export const puppeteer: ConnectorManifest = {
  id: 'puppeteer',
  name: 'Puppeteer',
  icon: 'AppWindow',
  description: 'Browser automation: navigate pages, take screenshots and interact with elements.',
  category: 'developer-tools',
  docsUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer',
  official: true,
  keywords: ['browser', 'automation', 'screenshots'],
  command: { run: ['npx', '-y', '@modelcontextprotocol/server-puppeteer'], env: {} },
  configSchema: {
    type: 'object',
    properties: {},
  },
};
