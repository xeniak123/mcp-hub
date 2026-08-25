import type { ConnectorManifest } from '@hub/shared';

export const dynatrace: ConnectorManifest = {
  id: 'dynatrace',
  name: 'Dynatrace',
  icon: 'Activity',
  description:
    'Dynatrace observability — query problems, metrics, logs and security events from your monitoring environment.',
  category: 'cloud',
  docsUrl: 'https://www.npmjs.com/package/dynatrace-mcp-server',
  keywords: ['monitoring', 'observability', 'problems', 'davis'],
  command: { run: ['npx', '-y', 'dynatrace-mcp-server'], env: {} },
  configSchema: {
    type: 'object',
    required: ['DT_ENVIRONMENT_URL', 'DT_API_TOKEN'],
    properties: {
      DT_ENVIRONMENT_URL: {
        type: 'string',
        title: 'Environment URL',
        ui: { placeholder: 'https://abc12345.live.dynatrace.com' },
      },
      DT_API_TOKEN: {
        type: 'string',
        title: 'API token',
        description: 'Needs scopes: problems.read, entities.read, metrics.read, events.read, audit-logs.read, dql.query:all.',
        ui: { widget: 'password' },
      },
    },
  },
};
