import type { ConnectorManifest } from '@hub/shared';

export const tavily: ConnectorManifest = {
  id: 'tavily',
  name: 'Tavily',
  icon: 'Globe',
  description: 'AI-optimized web search and content extraction, tuned for LLM agents.',
  category: 'ai',
  docsUrl: 'https://docs.tavily.com/documentation/mcp',
  keywords: ['search', 'web', 'research'],
  command: { run: ['npx', '-y', 'tavily-mcp@latest'], env: {} },
  configSchema: {
    type: 'object',
    required: ['TAVILY_API_KEY'],
    properties: {
      TAVILY_API_KEY: {
        type: 'string',
        title: 'API key',
        ui: { widget: 'password', helpUrl: 'https://app.tavily.com/home' },
      },
    },
  },
};
