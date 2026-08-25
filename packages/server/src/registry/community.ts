import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import type { ConnectorManifest } from '@hub/shared';
import { config } from '../config.js';

/**
 * Community connector repos. A "repo source" is a GitHub `owner/repo` (or a
 * full raw.githubusercontent URL). The hub fetches every `*.json` manifest
 * listed there — either from an `index.json` at the repo root or by probing
 * the GitHub API for JSON files — validates each one exactly like the
 * connectors volume does, and caches them under DATA_DIR so the marketplace
 * works offline after the first fetch.
 *
 * Community entries are namespaced `community:<id>` and never marked
 * official; built-ins always win on bare-id collisions.
 */

const COMMUNITY_PREFIX = 'community:';
const FETCH_TIMEOUT_MS = 15_000;

interface RepoSource {
  /** Cache key / display slug, e.g. "xeniak10/mcp-connectors" */
  repo: string;
  addedAt: string;
}

function sourcesFile(): string {
  return path.join(config.dataDir, 'community-repos.json');
}

export function listCommunityRepos(): Array<{ repo: string; addedAt: string; connectors: number }> {
  if (!existsSync(sourcesFile())) return [];
  try {
    const sources = JSON.parse(readFileSync(sourcesFile(), 'utf8')) as RepoSource[];
    const cached = loadCache();
    return sources.map((s) => ({
      repo: s.repo,
      addedAt: s.addedAt,
      connectors: cached.filter((m) => m.id.startsWith(`${COMMUNITY_PREFIX}${s.repo}/`)).length,
    }));
  } catch {
    return [];
  }
}

export async function addCommunityRepo(repoInput: string): Promise<{ added: number; skipped: number }> {
  const repo = normalizeRepo(repoInput);
  const manifests = await fetchRepoManifests(repo); // throws with a readable message on failure

  const sources: RepoSource[] = existsSync(sourcesFile())
    ? (JSON.parse(readFileSync(sourcesFile(), 'utf8')) as RepoSource[])
    : [];
  if (!sources.some((s) => s.repo === repo)) {
    sources.push({ repo, addedAt: new Date().toISOString() });
    mkdirSync(config.dataDir, { recursive: true });
    writeFileSync(sourcesFile(), JSON.stringify(sources, null, 2));
  }

  // Re-merge everything so the cache file always mirrors the source list.
  await refreshAllCommunityManifests(new Map([[repo, manifests]]));
  const added = loadCache().filter((m) => m.id.startsWith(`${COMMUNITY_PREFIX}${repo}/`)).length;
  return { added, skipped: Math.max(0, manifests.length - added) };
}

export async function removeCommunityRepo(repo: string): Promise<void> {
  const normalized = normalizeRepo(repo);
  const sources: RepoSource[] = existsSync(sourcesFile())
    ? (JSON.parse(readFileSync(sourcesFile(), 'utf8')) as RepoSource[])
    : [];
  writeFileSync(
    sourcesFile(),
    JSON.stringify(sources.filter((s) => s.repo !== normalized), null, 2)
  );
  // Drop its manifests from the cache file.
  const rest = loadCache().filter((m) => !m.id.startsWith(`${COMMUNITY_PREFIX}${normalized}/`));
  writeFileSync(cacheFile(), JSON.stringify(rest, null, 2));
}

export function loadCachedCommunityManifests(): ConnectorManifest[] {
  return loadCache();
}

// --- internals ---------------------------------------------------------------

function normalizeRepo(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, '');
  // Accept full github URLs, raw URLs or plain owner/repo.
  const gh = trimmed.match(/github\.com\/([^/]+\/[^/#?]+)/);
  if (gh) return gh[1].replace(/\.git$/, '');
  if (!/^[\w.-]+\/[\w.-]+$/.test(trimmed)) {
    throw new Error('Expected a GitHub repo like "owner/repo"');
  }
  return trimmed;
}

function cacheFile(): string {
  return path.join(config.dataDir, 'community-manifests.json');
}

function loadCache(): ConnectorManifest[] {
  try {
    return JSON.parse(readFileSync(cacheFile(), 'utf8')) as ConnectorManifest[];
  } catch {
    return [];
  }
}

async function refreshAllCommunityManifests(
  overrides: Map<string, ConnectorManifest[]>
): Promise<void> {
  const sources: RepoSource[] = existsSync(sourcesFile())
    ? (JSON.parse(readFileSync(sourcesFile(), 'utf8')) as RepoSource[])
    : [];
  const all: ConnectorManifest[] = [];
  for (const s of sources) {
    const fresh = overrides.get(s.repo);
    all.push(...(fresh ?? []));
  }
  writeFileSync(cacheFile(), JSON.stringify(all, null, 2));
}

/**
 * Discover manifests in the repo:
 *  1. try `index.json` at the repo root (an explicit list is authoritative)
 *  2. otherwise fall back to the GitHub code-search API for root-level *.json
 */
async function fetchRepoManifests(repo: string): Promise<ConnectorManifest[]> {
  const base = `https://raw.githubusercontent.com/${repo}/HEAD/`;
  const paths: string[] = [];

  const indexRaw = await tryFetch(base + 'index.json');
  if (indexRaw) {
    let index: unknown;
    try {
      index = JSON.parse(indexRaw);
    } catch {
      throw new Error('index.json in the repo is not valid JSON');
    }
    if (Array.isArray(index)) {
      paths.push(...index.filter((p): p is string => typeof p === 'string'));
    } else {
      throw new Error('index.json must be an array of file paths');
    }
  } else {
    // Fall back to listing root contents via the GitHub API (no auth needed
    // for public repos; rate-limited to 60 req/h per IP which is fine here).
    const api = `https://api.github.com/repos/${repo}/contents/`;
    const listing = await tryFetch(api);
    if (!listing) throw new Error(`Could not reach GitHub for "${repo}" — check the repo exists and is public`);
    const files = JSON.parse(listing) as Array<{ name: string; type: string }>;
    if (!Array.isArray(files)) throw new Error('Unexpected response from the GitHub API');
    paths.push(...files.filter((f) => f.type === 'file' && f.name.endsWith('.json')).map((f) => f.name));
  }

  if (paths.length === 0) return [];

  const results = await Promise.allSettled(
    paths.map(async (p) => {
      const raw = await fetchWithTimeout(base + p);
      if (!raw) throw new Error(`could not fetch ${p}`);
      // Same validation as volume manifests — reuse via dynamic import keeps
      // this module independent of registry boot order.
      const { validateManifestJson } = await import('./validate.js');
      return validateManifestJson(JSON.parse(raw), `${repo}/${p}`);
    })
  );

  const valid: ConnectorManifest[] = [];
  let invalid = 0;
  for (const r of results) {
    if (r.status === 'fulfilled') {
      const m = r.value;
      // Namespace community ids so they can never shadow built-ins, and
      // force non-official regardless of what the JSON claims.
      valid.push({ ...m, id: `${COMMUNITY_PREFIX}${repo}/${m.id}`, official: false });
    } else {
      invalid += 1;
      console.warn(`[registry] community ${repo}: skipping one manifest (${(r.reason as Error).message})`);
    }
  }
  if (valid.length === 0 && invalid > 0) {
    throw new Error(`No valid manifests found in "${repo}"`);
  }
  return valid;
}

async function tryFetch(url: string): Promise<string | null> {
  try {
    return await fetchWithTimeout(url);
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url: string): Promise<string> {
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}
