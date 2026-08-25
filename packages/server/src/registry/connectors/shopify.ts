import type { ConnectorManifest } from '@hub/shared';

export const shopify: ConnectorManifest = {
  id: 'shopify',
  name: 'Shopify',
  icon: 'ShoppingCart',
  description: 'Products, orders and customers via the Shopify Admin GraphQL API.',
  category: 'finance',
  docsUrl: 'https://shopify.dev/docs/api/admin-graphql',
  keywords: ['ecommerce', 'orders', 'store'],
  command: { run: ['npx', '-y', 'shopify-mcp-server'], env: {} },
  configSchema: {
    type: 'object',
    required: ['SHOPIFY_STORE_DOMAIN', 'SHOPIFY_ACCESS_TOKEN'],
    properties: {
      SHOPIFY_STORE_DOMAIN: {
        type: 'string',
        title: 'Store domain',
        ui: { widget: 'text', placeholder: 'mystore.myshopify.com' },
      },
      SHOPIFY_ACCESS_TOKEN: {
        type: 'string',
        title: 'Admin API access token',
        ui: { widget: 'password', helpUrl: 'https://help.shopify.com/en/manual/apps/app-types/custom-apps' },
      },
    },
  },
};
