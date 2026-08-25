import type { ConnectorManifest } from '@hub/shared';

export const sequentialThinking: ConnectorManifest = {
  id: 'sequential-thinking',
  name: 'Sequential Thinking',
  icon: 'Lightbulb',
  description:
    'Structured step-by-step reasoning with revision and branching for complex problem solving.',
  category: 'ai',
  docsUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking',
  official: true,
  keywords: ['reasoning', 'planning'],
  command: { run: ['npx', '-y', '@modelcontextprotocol/server-sequential-thinking'], env: {} },
  configSchema: { type: 'object', properties: {} },
};
