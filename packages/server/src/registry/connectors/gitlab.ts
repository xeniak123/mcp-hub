import type { ConnectorManifest } from '@hub/shared';

export const gitlab: ConnectorManifest = {
  id: 'gitlab',
  name: 'GitLab',
  icon: 'GitBranch',
  description: 'GitLab projects, issues, merge requests and pipelines.',
  category: 'developer-tools',
  docsUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/gitlab',
  official: true,
  keywords: ['git', 'ci', 'repos'],
  command: { run: ['npx', '-y', '@modelcontextprotocol/server-gitlab'], env: {} },
  configSchema: {
    type: 'object',
    required: ['GITLAB_PERSONAL_ACCESS_TOKEN'],
    properties: {
      GITLAB_PERSONAL_ACCESS_TOKEN: {
        type: 'string',
        title: 'Personal Access Token',
        ui: { widget: 'password', helpUrl: 'https://gitlab.com/-/user_settings/personal_access_tokens' },
      },
      GITLAB_API_URL: {
        type: 'string',
        title: 'API URL',
        description: 'Leave empty for gitlab.com; set for self-hosted instances.',
        ui: { widget: 'text', placeholder: 'https://gitlab.example.com/api/v4' },
      },
    },
  },
};
