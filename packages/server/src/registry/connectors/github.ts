import type { ConnectorManifest } from '@hub/shared';

export const github: ConnectorManifest = {
  id: 'github',
  name: 'GitHub',
  icon: 'Github',
  description:
    'Repositories, issues, pull requests, code search and GitHub Actions workflows.',
  category: 'developer-tools',
  docsUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/github',
  official: true,
  keywords: ['git', 'issues', 'prs', 'code'],
  command: { run: ['npx', '-y', '@modelcontextprotocol/server-github'], env: {} },
  configSchema: {
    type: 'object',
    required: ['GITHUB_PERSONAL_ACCESS_TOKEN'],
    properties: {
      GITHUB_PERSONAL_ACCESS_TOKEN: {
        type: 'string',
        title: 'Personal Access Token',
        description: 'Classic or fine-grained PAT with repo scope.',
        ui: { widget: 'password', helpUrl: 'https://github.com/settings/tokens' },
      },
    },
  },
};
