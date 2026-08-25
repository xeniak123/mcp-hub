import type {
  ApiKey,
  AuthUser,
  ConnectorInstance,
  LogLine,
  MarketplaceEntry,
  StatsResponse,
} from '@hub/shared';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Only send a content-type when there is actually a body: Fastify rejects
  // "Content-Type: application/json" requests with an empty body (400).
  const headers = init?.body ? { 'Content-Type': 'application/json' } : undefined;
  const res = await fetch(path, { ...init, headers });
  if (res.status === 401) {
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error(String(json.error ?? res.statusText));
  return json as T;
}

export const api = {
  authStatus: () => request<{ usersExist: boolean }>('/api/auth/status'),
  login: (email: string, password: string) =>
    request<{ user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  bootstrap: (email: string, password: string) =>
    request<{ user: AuthUser }>('/api/auth/bootstrap', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ ok: true }>('/api/auth/logout', { method: 'POST' }),

  marketplace: () => request<{ entries: MarketplaceEntry[] }>('/api/marketplace'),
  connectors: () => request<{ connectors: ConnectorInstance[] }>('/api/connectors'),
  installConnector: (registryId: string, displayName?: string) =>
    request<{ id: string }>('/api/connectors', {
      method: 'POST',
      body: JSON.stringify({ registryId, displayName }),
    }),
  saveConfig: (id: string, config: Record<string, unknown>) =>
    request<{ ok: true }>(`/api/connectors/${id}/config`, {
      method: 'PUT',
      body: JSON.stringify(config),
    }),
  enable: (id: string) =>
    request<{ ok: true }>(`/api/connectors/${id}/enable`, { method: 'POST' }),
  disable: (id: string) =>
    request<{ ok: true }>(`/api/connectors/${id}/disable`, { method: 'POST' }),
  restart: (id: string) =>
    request<{ ok: true }>(`/api/connectors/${id}/restart`, { method: 'POST' }),
  renameConnector: (id: string, displayName: string) =>
    request<{ ok: true }>(`/api/connectors/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ displayName }),
    }),
  restartAll: () =>
    request<{ restarted: number; failed: number }>('/api/connectors/restart-all', { method: 'POST' }),
  stopAll: () => request<{ stopped: number }>('/api/connectors/stop-all', { method: 'POST' }),
  meta: () => request<{ version: string; commit: string }>('/api/meta'),
  updateCheck: (force = false) =>
    request<{
      currentVersion: string;
      latestVersion: string | null;
      updateAvailable: boolean;
      releaseUrl: string | null;
      releaseNotes: string | null;
      publishedAt: string | null;
      checkedAt: string;
    }>(`/api/update/check${force ? '?force=1' : ''}`),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ ok: true }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  sessions: () =>
    request<{
      sessions: Array<{
        id: string;
        createdAt: string;
        expiresAt: string;
        ip: string | null;
        userAgent: string | null;
        current: boolean;
      }>;
    }>('/api/auth/sessions'),
  revokeSession: (id: string) =>
    request<{ ok: true }>(`/api/auth/sessions/${id}`, { method: 'DELETE' }),
  uninstall: (id: string) =>
    request<{ ok: true }>(`/api/connectors/${id}`, { method: 'DELETE' }),
  communityRepos: () =>
    request<{
      repos: Array<{ repo: string; addedAt: string; connectors: number }>;
    }>('/api/community/repos'),
  addCommunityRepo: (repo: string) =>
    request<{ repo: string; added: number; skipped: number; restartRequired: boolean }>(
      '/api/community/repos',
      { method: 'POST', body: JSON.stringify({ repo }) }
    ),
  removeCommunityRepo: (repo: string) =>
    request<{ ok: true; restartRequired: boolean }>(
      `/api/community/repos/${encodeURIComponent(repo)}`,
      { method: 'DELETE' }
    ),
  connectorTools: (id: string) =>
    request<{ tools: Array<{ name: string; description?: string; inputSchema: object }> }>(
      `/api/connectors/${id}/tools`
    ),
  logs: (connectorId: string, after = 0) =>
    request<{ lines: LogLine[] }>(`/api/logs/${connectorId}?after=${after}`),
  stats: () => request<StatsResponse>('/api/stats'),
  keys: () => request<{ keys: ApiKey[] }>('/api/keys'),
  createKey: (name: string) =>
    request<{ id: string; token: string; createdAt: string }>('/api/keys', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  revokeKey: (id: string) =>
    request<{ ok: true }>(`/api/keys/${id}`, { method: 'DELETE' }),
  restoreBackup: (data: unknown) =>
    request<{ ok: true; installed: number; skipped: number }>('/api/backup/restore', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Export uses a plain link so the browser handles the download (and the
// Content-Disposition attachment header) natively.
export function backupDownloadUrl(): string {
  return '/api/backup';
}
