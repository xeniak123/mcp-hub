import type { ConnectorManifest } from '@hub/shared';

export const googleSheets: ConnectorManifest = {
  id: 'google-sheets',
  name: 'Google Sheets',
  icon: 'Table',
  description:
    'Google Sheets — read, write and structure spreadsheet data for reports, budgets, inventory lists and team trackers.',
  category: 'productivity',
  docsUrl: 'https://www.npmjs.com/package/mcp-google-sheets-full',
  keywords: ['spreadsheet', 'excel', 'tables', 'reports', 'data entry'],
  command: { run: ['npx', '-y', 'mcp-google-sheets-full'], env: {} },
  configSchema: {
    type: 'object',
    required: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN'],
    properties: {
      GOOGLE_CLIENT_ID: {
        type: 'string',
        title: 'Google OAuth client ID',
        description: 'Google Cloud Console → APIs & Services → Credentials.',
      },
      GOOGLE_CLIENT_SECRET: {
        type: 'string',
        title: 'Client secret',
        ui: { widget: 'password' },
      },
      GOOGLE_REFRESH_TOKEN: {
        type: 'string',
        title: 'Refresh token',
        description: 'OAuth token with the spreadsheets scope; generate once with oauth2l or a small script.',
        ui: { widget: 'password' },
      },
    },
  },
};
