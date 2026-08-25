import type { ConnectorManifest } from '@hub/shared';

export const elasticsearch: ConnectorManifest = {
  id: 'elasticsearch',
  name: 'Elasticsearch',
  icon: 'Search',
  description: 'Search indices, inspect mappings and run queries on Elasticsearch/OpenSearch.',
  category: 'database',
  docsUrl: 'https://github.com/modelcontextprotocol/servers',
  keywords: ['search', 'opensearch', 'lucene'],
  command: { run: ['npx', '-y', '@elastic/mcp-server-elasticsearch'], env: {} },
  configSchema: {
    type: 'object',
    required: ['ES_URL'],
    properties: {
      ES_URL: {
        type: 'string',
        title: 'Endpoint URL',
        description: 'Base URL of your cluster.',
        ui: { widget: 'text', placeholder: 'https://es.example.com:9200' },
      },
      ES_API_KEY: {
        type: 'string',
        title: 'API key',
        description: 'Base64 API key (recommended) or leave empty for anonymous.',
        ui: { widget: 'password' },
      },
    },
  },
};
