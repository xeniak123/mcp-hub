import type { FastifyInstance } from 'fastify';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { query } from '../db/pool.js';
import { manager } from '../connectors/manager.js';
import { requireSession } from '../auth/middleware.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolved once at boot: package version + git commit baked into the image
// via the GIT_COMMIT build arg (falls back to 'unknown' for local runs).
function resolveVersion(): { version: string; commit: string } {
  let version = 'unknown';
  try {
    const pkg = JSON.parse(
      // dist/modules/health.js → packages/server/package.json
      readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8')
    ) as { version?: string };
    if (pkg.version) version = pkg.version;
  } catch {
    // keep fallback
  }
  return { version, commit: process.env.GIT_COMMIT || 'unknown' };
}

const meta = resolveVersion();

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  // Unauthenticated liveness probe for uptime monitors (Uptime-Kuma etc.).
  // Deliberately returns no details beyond what a monitor needs.
  app.get('/healthz', async () => {
    try {
      await query('SELECT 1');
      return { ok: true };
    } catch {
      return { ok: false };
    }
  });

  app.get('/api/meta', { onRequest: [requireSession] }, async () => ({
    version: meta.version,
    commit: meta.commit,
  }));

  app.get('/api/health', async () => {
    try {
      await query('SELECT 1');
      return { ok: true };
    } catch {
      return { ok: false };
    }
  });

  app.get('/api/stats', { onRequest: [requireSession] }, async () => {
    const all = manager.all();
    return {
      installed: all.length,
      running: all.filter((c) => c.status === 'running').length,
      errors: all.filter((c) => c.status === 'error').length,
      enabled: all.filter((c) => c.enabled).length,
    };
  });
}
