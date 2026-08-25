import type { ConnectorManifest } from '@hub/shared';

export const bigquery: ConnectorManifest = {
  id: 'bigquery',
  name: 'Google BigQuery',
  icon: 'DatabaseBackup',
  description: 'Run SQL against BigQuery datasets and inspect table schemas.',
  category: 'database',
  docsUrl: 'https://cloud.google.com/bigquery/docs/reference/rest',
  keywords: ['gcp', 'sql', 'warehouse'],
  command: { run: ['uvx', 'mcp-server-bigquery'], env: {} },
  configSchema: {
    type: 'object',
    required: ['BQ_PROJECT_ID', 'BQ_SERVICE_ACCOUNT_JSON'],
    properties: {
      BQ_PROJECT_ID: { type: 'string', title: 'GCP project ID', ui: { widget: 'text' } },
      BQ_SERVICE_ACCOUNT_JSON: {
        type: 'string',
        title: 'Service account JSON',
        description: 'Full JSON key file contents.',
        ui: { widget: 'textarea', placeholder: '{ "type": "service_account", … }' },
      },
    },
  },
};
