import type { ConnectorManifest } from '@hub/shared';

export const bitbucket: ConnectorManifest = {
  id: 'bitbucket',
  name: 'Bitbucket',
  icon: 'GitBranch',
  description:
    'Atlassian Bitbucket — browse workspaces, repositories and pull requests; read diffs, comments and pipeline status.',
  category: 'developer-tools',
  docsUrl: 'https://www.npmjs.com/package/@aashari/mcp-server-atlassian-bitbucket',
  keywords: ['git', 'pull requests', 'atlassian', 'code review'],
  command: { run: ['npx', '-y', '@aashari/mcp-server-atlassian-bitbucket'], env: {} },
  configSchema: {
    type: 'object',
    required: ['ATLASSIAN_USER_EMAIL', 'ATLASSIAN_API_TOKEN'],
    properties: {
      ATLASSIAN_USER_EMAIL: {
        type: 'string',
        title: 'Atlassian account email',
      },
      ATLASIAN_BITBUCKET_USERNAME: { type: 'string', title: 'Bitbucket username (optional)' },
      ATLASSIAN_API_TOKEN: {
        type: 'string',
        title: 'API token',
        description: 'id.atlassian.com → Security → Create and manage API tokens.',
        ui: { widget: 'password' },
      },
    },
  },
};
