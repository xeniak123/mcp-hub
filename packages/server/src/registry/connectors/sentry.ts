import type { ConnectorManifest } from '@hub/shared';

export const sentry: ConnectorManifest = {
  id: 'sentry',
  name: 'Sentry',
  icon: 'ShieldAlert',
  description: 'Resolve Sentry issues, stack traces and release health.',
  category: 'developer-tools',
  docsUrl: 'https://github.com/getsentry/sentry-mcp',
  keywords: ['errors', 'monitoring'],
  command: { run: ['npx', '-y', '@sentry/mcp-server'], env: {} },
  configSchema: {
    type: 'object',
    required: ['SENTRY_TOKEN'],
    properties: {
      SENTRY_TOKEN: {
        type: 'string',
        title: 'Auth Token',
        ui: { widget: 'password', helpUrl: 'https://sentry.io/settings/auth-tokens/' },
      },
    },
  },
};
