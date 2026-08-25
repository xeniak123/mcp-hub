import type { ConnectorManifest } from '@hub/shared';

export const cloudflare: ConnectorManifest = {
  id: 'cloudflare',
  name: 'Cloudflare',
  icon: 'Cloud',
  description: 'Workers, KV, R2, DNS records and cache purge via the Cloudflare API.',
  category: 'cloud',
  docsUrl: 'https://developers.cloudflare.com/api/',
  keywords: ['dns', 'workers', 'cdn'],
  command: { run: ['npx', '-y', 'mcp-server-cloudflare'], env: {} },
  configSchema: {
    type: 'object',
    required: ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID'],
    properties: {
      CLOUDFLARE_API_TOKEN: {
        type: 'string',
        title: 'API token',
        ui: { widget: 'password', helpUrl: 'https://dash.cloudflare.com/profile/api-tokens' },
      },
      CLOUDFLARE_ACCOUNT_ID: { type: 'string', title: 'Account ID', ui: { widget: 'text' } },
    },
  },
};
