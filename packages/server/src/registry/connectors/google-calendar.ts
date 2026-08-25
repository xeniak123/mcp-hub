import type { ConnectorManifest } from '@hub/shared';

export const googleCalendar: ConnectorManifest = {
  id: 'google-calendar',
  name: 'Google Calendar',
  icon: 'Calendar',
  description: 'List, create and update calendar events; check availability.',
  category: 'productivity',
  docsUrl: 'https://developers.google.com/workspace/calendar/api/guides',
  keywords: ['events', 'schedule', 'meetings'],
  command: { run: ['npx', '-y', '@gongrzhe/server-calendar-mcp'], env: {} },
  configSchema: {
    type: 'object',
    required: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN'],
    properties: {
      GOOGLE_CLIENT_ID: {
        type: 'string',
        title: 'OAuth client ID',
        ui: { widget: 'text', helpUrl: 'https://console.cloud.google.com/apis/credentials' },
      },
      GOOGLE_CLIENT_SECRET: { type: 'string', title: 'OAuth client secret', ui: { widget: 'password' } },
      GOOGLE_REFRESH_TOKEN: {
        type: 'string',
        title: 'Refresh token',
        description: 'Long-lived token with the calendar scope.',
        ui: { widget: 'password' },
      },
    },
  },
};
