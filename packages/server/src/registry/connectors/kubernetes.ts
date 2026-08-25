import type { ConnectorManifest } from '@hub/shared';

export const kubernetes: ConnectorManifest = {
  id: 'kubernetes',
  name: 'Kubernetes',
  icon: 'Ship',
  description: 'Pods, deployments and logs across clusters — read and manage resources.',
  category: 'cloud',
  docsUrl: 'https://github.com/Flux159/mcp-server-kubernetes',
  keywords: ['k8s', 'cluster', 'devops'],
  command: { run: ['npx', '-y', 'mcp-server-kubernetes'], env: {} },
  configSchema: {
    type: 'object',
    required: ['KUBECONFIG'],
    properties: {
      KUBECONFIG: {
        type: 'string',
        title: 'kubeconfig',
        description:
          'Contents of your kubeconfig file (paste as text). Runs with the hub container\'s network access.',
        ui: { widget: 'textarea', placeholder: 'apiVersion: v1\nclusters:\n- cluster: …' },
      },
    },
  },
};
