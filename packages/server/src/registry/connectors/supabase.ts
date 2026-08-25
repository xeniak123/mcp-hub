import type { ConnectorManifest } from '@hub/shared';

export const supabase: ConnectorManifest = {
  id: 'supabase',
  name: 'Supabase',
  icon: 'Triangle',
  description: 'Query tables and manage your Supabase project.',
  category: 'database',
  docsUrl: 'https://github.com/supabase-community/supabase-mcp',
  keywords: ['postgres', 'baas'],
  command: {
    run: [
      'npx',
      '-y',
      '@supabase/mcp-server-supabase',
      '--access-token={env.SUPABASE_ACCESS_TOKEN}',
    ],
    env: {},
  },
  configSchema: {
    type: 'object',
    required: ['SUPABASE_ACCESS_TOKEN'],
    properties: {
      SUPABASE_ACCESS_TOKEN: {
        type: 'string',
        title: 'Access Token',
        ui: { widget: 'password', helpUrl: 'https://supabase.com/dashboard/account/tokens' },
      },
      SUPABASE_PROJECT_REF: {
        type: 'string',
        title: 'Project Ref',
        description: 'Optional project reference to scope the server to one project.',
      },
    },
  },
};
