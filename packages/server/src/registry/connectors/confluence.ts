import type { ConnectorManifest } from '@hub/shared';

export const confluence: ConnectorManifest = {
  id: 'confluence',
  name: 'Confluence',
  icon: 'FileText',
  description: 'Spaces, pages and comments — search and edit your Confluence wiki.',
  category: 'productivity',
  docsUrl: 'https://developer.atlassian.com/cloud/confluence/rest/v2/',
  keywords: ['wiki', 'docs', 'atlassian'],
  command: { run: ['npx', '-y', 'mcp-atlassian'], env: {} },
  configSchema: {
    type: 'object',
    required: ['CONFLUENCE_URL', 'CONFLUENCE_USERNAME', 'CONFLUENCE_API_TOKEN'],
    properties: {
      CONFLUENCE_URL: {
        type: 'string',
        title: 'Site URL',
        ui: { widget: 'text', placeholder: 'https://your.atlassian.net/wiki' },
      },
      CONFLUENCE_USERNAME: { type: 'string', title: 'Email', ui: { widget: 'text' } },
      CONFLUENCE_API_TOKEN: {
        type: 'string',
        title: 'API token',
        ui: { widget: 'password', helpUrl: 'https://id.atlassian.com/manage-profile/security/api-tokens' },
      },
    },
  },
};
