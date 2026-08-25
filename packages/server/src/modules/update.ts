import type { FastifyInstance } from 'fastify';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireSession } from '../auth/middleware.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Update check. The hub cannot safely replace its own container image from
 * inside the container (no docker.sock by design), so "one-click update" is
 * split honestly into three layers:
 *
 *  1. this module — detects that a newer release exists and tells the UI;
 *  2. the UI — shows an update banner with a copy-paste upgrade command for
 *     `docker compose` deployments, or a Portainer hint;
 *  3. optional fully-automatic updates — a Watchtower sidecar enabled via
 *     `docker compose --profile autoupdate up -d` which pulls new images.
 */

const DOCKER_HUB_TAGS =
  'https://hub.docker.com/v2/repositories/xeniak123/mcp-hub/tags?page_size=25';
const GITHUB_RELEASES = 'https://api.github.com/repos/xeniak123/mcp-hub/releases/latest';
// Re-check at most every 6 hours; result is also cached in memory.
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

interface UpdateState {
  lastCheck: number;
  currentVersion: string;
  latestVersion: string | null;
  releaseUrl: string | null;
  releaseNotes: string | null;
  publishedAt: string | null;
}

let cache: UpdateState | null = null;

function currentVersion(): string {
  try {
    // dist/modules/update.js → packages/server/package.json
    const pkg = JSON.parse(
      readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8')
    ) as { version?: string };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function cleanTag(tag: string): string {
  return tag.replace(/^v/, '').trim();
}

/** True when a < b, comparing numeric dot-separated versions. */
function versionLess(a: string, b: string): boolean {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) < (pb[i] ?? 0);
  }
  return false;
}

/** Query Docker Hub tags + GitHub releases. Throws nothing — failures mean "unknown". */
async function fetchLatest(): Promise<{
  latestVersion: string | null;
  releaseUrl: string | null;
  releaseNotes: string | null;
  publishedAt: string | null;
}> {
  const result: {
    latestVersion: string | null;
    releaseUrl: string | null;
    releaseNotes: string | null;
    publishedAt: string | null;
  } = { latestVersion: null, releaseUrl: null, releaseNotes: null, publishedAt: null };

  // Prefer GitHub releases when one exists (has notes + URL); fall back to
  // the newest semver-looking tag on Docker Hub.
  try {
    const res = await fetch(GITHUB_RELEASES, {
      headers: { 'User-Agent': 'mcp-hub', Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) {
      const rel = (await res.json()) as {
        tag_name?: string;
        html_url?: string;
        body?: string;
        published_at?: string;
      };
      if (rel.tag_name) {
        result.latestVersion = cleanTag(rel.tag_name);
        result.releaseUrl = rel.html_url ?? null;
        result.releaseNotes = rel.body ? rel.body.slice(0, 2000) : null;
        result.publishedAt = rel.published_at ?? null;
      }
    }
  } catch {
    // ignore — try Docker Hub below
  }

  if (!result.latestVersion) {
    try {
      const res = await fetch(DOCKER_HUB_TAGS, { signal: AbortSignal.timeout(10_000) });
      if (res.ok) {
        const data = (await res.json()) as { results?: Array<{ name: string }> };
        const versions = (data.results ?? [])
          .map((t) => cleanTag(t.name))
          .filter((v) => /^\d+\.\d+\.\d+/.test(v));
        versions.sort((a, b) => {
          // newest first without pulling in full semver comparison here
          const pa = a.split('.').map(Number);
          const pb = b.split('.').map(Number);
          for (let i = 0; i < 3; i++) {
            if ((pb[i] ?? 0) !== (pa[i] ?? 0)) return (pb[i] ?? 0) - (pa[i] ?? 0);
          }
          return 0;
        });
        result.latestVersion = versions[0] ?? null;
      }
    } catch {
      // ignore — stays unknown
    }
  }

  return result;
}

async function getUpdateState(force: boolean): Promise<UpdateState> {
  const now = Date.now();
  if (
    !force &&
    cache &&
    now - cache.lastCheck < CHECK_INTERVAL_MS &&
    cache.currentVersion === currentVersion()
  ) {
    return cache;
  }
  const latest = await fetchLatest();
  cache = {
    lastCheck: now,
    currentVersion: currentVersion(),
    ...latest,
  };
  return cache;
}

export async function updateRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/update/check', { onRequest: [requireSession] }, async (req) => {
    const force = Boolean(req.query && (req.query as Record<string, unknown>).force === '1');
    const state = await getUpdateState(force);
    const hasUpdate =
      state.latestVersion !== null &&
      versionLess(state.currentVersion, state.latestVersion);
    return {
      currentVersion: state.currentVersion,
      latestVersion: state.latestVersion,
      updateAvailable: hasUpdate,
      releaseUrl: state.releaseUrl,
      releaseNotes: state.releaseNotes,
      publishedAt: state.publishedAt,
      checkedAt: new Date(state.lastCheck).toISOString(),
    };
  });
}
