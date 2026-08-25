import type { ConnectorManifest } from '@hub/shared';

export const stripe: ConnectorManifest = {
  id: 'stripe',
  name: 'Stripe',
  icon: 'CreditCard',
  description: 'Manage Stripe customers, payments, subscriptions and balances.',
  category: 'finance',
  docsUrl: 'https://github.com/stripe/agent-toolkit',
  keywords: ['payments', 'billing'],
  command: {
    run: [
      'npx',
      '-y',
      '@stripe/mcp',
      '--tools=all',
      '--api-key={env.STRIPE_SECRET_KEY}',
    ],
    env: {},
  },
  configSchema: {
    type: 'object',
    required: ['STRIPE_SECRET_KEY'],
    properties: {
      STRIPE_SECRET_KEY: {
        type: 'string',
        title: 'Secret Key',
        description: 'Stripe API secret key (sk_live_… or sk_test_…).',
        ui: { widget: 'password', helpUrl: 'https://dashboard.stripe.com/apikeys' },
      },
    },
  },
};
