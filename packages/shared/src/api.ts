import type { ConnectorManifest, ConnectorCategory } from './manifest.js';

export type ConnectorStatus = 'stopped' | 'starting' | 'running' | 'error';

/** Installed connector instance (row from `connectors` table + live state). */
export interface ConnectorInstance {
  id: string;
  registryId: string;
  displayName: string;
  enabled: boolean;
  status: ConnectorStatus;
  statusDetail: string | null;
  restartCount: number;
  lastHealthyAt: string | null;
  installedAt: string;
}

/** Registry entry overlaid with install state for the marketplace. */
export interface MarketplaceEntry {
  manifest: ConnectorManifest;
  installedCount: number;
}

export interface StatsResponse {
  installed: number;
  running: number;
  errors: number;
  enabled: number;
}

export interface LogLine {
  id: number;
  connectorId: string;
  ts: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'rpc';
  message: string;
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export interface CategoryInfo {
  id: ConnectorCategory;
  label: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'developer-tools', label: 'Developer Tools' },
  { id: 'communication', label: 'Communication' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'database', label: 'Databases' },
  { id: 'finance', label: 'Finance' },
  { id: 'design', label: 'Design' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'ai', label: 'AI' },
  { id: 'files', label: 'Files' },
  { id: 'other', label: 'Other' },
];
