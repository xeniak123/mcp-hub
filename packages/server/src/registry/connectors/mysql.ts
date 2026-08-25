import type { ConnectorManifest } from '@hub/shared';

export const mysql: ConnectorManifest = {
  id: 'mysql',
  name: 'MySQL / MariaDB',
  icon: 'Database',
  description: 'Read-only SQL queries and schema inspection for MySQL and MariaDB.',
  category: 'database',
  docsUrl: 'https://github.com/modelcontextprotocol/servers',
  keywords: ['mariadb', 'sql', 'db'],
  command: { run: ['npx', '-y', '@benborla29/mcp-server-mysql'], env: {} },
  configSchema: {
    type: 'object',
    required: ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASS'],
    properties: {
      MYSQL_HOST: { type: 'string', title: 'Host', ui: { widget: 'text' } },
      MYSQL_PORT: { type: 'string', title: 'Port', default: '3306', ui: { widget: 'text' } },
      MYSQL_USER: { type: 'string', title: 'User', ui: { widget: 'text' } },
      MYSQL_PASS: { type: 'string', title: 'Password', ui: { widget: 'password' } },
      MYSQL_DB: { type: 'string', title: 'Database', ui: { widget: 'text' } },
    },
  },
};
