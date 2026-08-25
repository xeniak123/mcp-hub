import type { ConnectorManifest } from '@hub/shared';

export const odoo: ConnectorManifest = {
  id: 'odoo',
  name: 'Odoo ERP',
  icon: 'Boxes',
  description:
    'Odoo ERP — search and update records across sales, inventory, accounting, HR and every installed Odoo module.',
  category: 'finance',
  docsUrl: 'https://www.npmjs.com/package/odoo-mcp-server',
  keywords: ['erp', 'sales', 'inventory', 'accounting', 'invoicing'],
  command: { run: ['npx', '-y', 'odoo-mcp-server'], env: {} },
  configSchema: {
    type: 'object',
    required: ['ODOO_URL', 'ODOO_DB', 'ODOO_USERNAME', 'ODOO_PASSWORD'],
    properties: {
      ODOO_URL: {
        type: 'string',
        title: 'Odoo URL',
        ui: { placeholder: 'https://mycompany.odoo.com' },
      },
      ODOO_DB: {
        type: 'string',
        title: 'Database name',
      },
      ODOO_USERNAME: {
        type: 'string',
        title: 'Username / email',
      },
      ODOO_PASSWORD: {
        type: 'string',
        title: 'Password / API key',
        description: 'For Odoo.sh and hosted plans prefer an API key from account security settings.',
        ui: { widget: 'password' },
      },
    },
  },
};
