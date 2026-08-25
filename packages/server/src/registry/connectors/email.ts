import type { ConnectorManifest } from '@hub/shared';

/**
 * Universal IMAP/SMTP email — works with Gmail (app password), Outlook,
 * Zoho, company Exchange servers and any standards-compliant provider.
 */
export const email: ConnectorManifest = {
  id: 'email',
  name: 'Email (IMAP/SMTP)',
  icon: 'MailCheck',
  description:
    'Read, send, reply and draft email over IMAP/SMTP — works with Gmail, Outlook, Zoho or any company mail server.',
  category: 'communication',
  docsUrl: 'https://www.npmjs.com/package/email-mcp-server',
  keywords: ['mail', 'gmail', 'outlook', 'imap', 'smtp', 'inbox'],
  command: { run: ['npx', '-y', 'email-mcp-server'], env: {} },
  configSchema: {
    type: 'object',
    required: ['EMAIL_ADDRESS', 'EMAIL_PASSWORD', 'IMAP_HOST', 'SMTP_HOST'],
    properties: {
      EMAIL_ADDRESS: {
        type: 'string',
        title: 'Email address',
        ui: { placeholder: 'you@company.com' },
      },
      EMAIL_PASSWORD: {
        type: 'string',
        title: 'Password / app password',
        description: 'Gmail requires an App Password (2FA must be on).',
        ui: { widget: 'password' },
      },
      IMAP_HOST: {
        type: 'string',
        title: 'IMAP host',
        default: 'imap.gmail.com',
      },
      IMAP_PORT: {
        type: 'string',
        title: 'IMAP port',
        default: '993',
      },
      SMTP_HOST: {
        type: 'string',
        title: 'SMTP host',
        default: 'smtp.gmail.com',
      },
      SMTP_PORT: {
        type: 'string',
        title: 'SMTP port',
        default: '465',
      },
    },
  },
};
