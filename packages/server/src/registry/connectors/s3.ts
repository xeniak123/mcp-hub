import type { ConnectorManifest } from '@hub/shared';

export const s3: ConnectorManifest = {
  id: 's3',
  name: 'AWS S3',
  icon: 'Bucket',
  description: 'List and read objects in AWS S3 buckets.',
  category: 'cloud',
  docsUrl: 'https://github.com/aws-samples/aws-mcp-server',
  keywords: ['aws', 'storage'],
  command: { run: ['uvx', 'aws-sdk-mcp-server'], env: {} },
  configSchema: {
    type: 'object',
    required: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'],
    properties: {
      AWS_ACCESS_KEY_ID: {
        type: 'string',
        title: 'Access Key ID',
      },
      AWS_SECRET_ACCESS_KEY: {
        type: 'string',
        title: 'Secret Access Key',
        ui: { widget: 'password' },
      },
      AWS_REGION: {
        type: 'string',
        title: 'Region',
        ui: { widget: 'text', placeholder: 'us-east-1' },
      },
    },
  },
};
