import type { ConnectorManifest } from '@hub/shared';

export const jira: ConnectorManifest = {
  id: 'jira',
  name: 'Jira',
  icon: 'KanbanSquare',
  description: 'Search and read Jira issues, projects and sprint data.',
  category: 'productivity',
  docsUrl: 'https://github.com/sooperset/mcp-atlassian',
  keywords: ['atlassian', 'issues', 'sprints'],
  command: {
    run: ['npx', '-y', 'mcp-atlassian'],
    env: {},
  },
  configSchema: {
    type: 'object',
    required: ['JIRA_URL', 'JIRA_USERNAME', 'JIRA_API_TOKEN'],
    properties: {
      JIRA_URL: {
        type: 'string',
        title: 'Site URL',
        description: 'Your Jira Cloud site URL.',
        ui: { widget: 'text', placeholder: 'https://yourcompany.atlassian.net' },
      },
      JIRA_USERNAME: {
        type: 'string',
        title: 'Email',
        description: 'Account email associated with the API token.',
      },
      JIRA_API_TOKEN: {
        type: 'string',
        title: 'API Token',
        ui: {
          widget: 'password',
          helpUrl: 'https://id.atlassian.com/manage-profile/security/api-tokens',
        },
      },
    },
  },
};
