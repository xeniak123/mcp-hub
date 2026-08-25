import type { ConnectorManifest } from '@hub/shared';

export const git: ConnectorManifest = {
  id: 'git',
  name: 'Git',
  icon: 'GitBranch',
  description: 'Local repository operations: status, diff, log, branches and commits.',
  category: 'developer-tools',
  docsUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/git',
  official: true,
  keywords: ['version control', 'repo'],
  command: { run: ['uvx', 'mcp-server-git', '--repository', '{env.REPO_PATH}'], env: {} },
  configSchema: {
    type: 'object',
    required: ['REPO_PATH'],
    properties: {
      REPO_PATH: {
        type: 'string',
        title: 'Repository path',
        description: 'Path inside the hub container. Mount your code via a volume.',
        ui: { widget: 'text', placeholder: '/repos/my-project' },
      },
    },
  },
};
