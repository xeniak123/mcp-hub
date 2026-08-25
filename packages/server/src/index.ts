import { config } from './config.js';
import { pool } from './db/pool.js';
import { runMigrations } from './db/migrate.js';
import { buildApp } from './http/app.js';
import { manager } from './connectors/manager.js';
import { logPipeline } from './logs/pipeline.js';
import { createHubServer } from './hub/server.js';
import { initWebhooks } from './modules/webhooks.js';

async function main(): Promise<void> {
  console.log('[hub] starting…');
  // Subscribe before restore so alerts fire for failures during boot, too.
  initWebhooks();

  // 1. wait for DB and apply migrations
  for (let attempt = 1; ; attempt++) {
    try {
      await runMigrations();
      break;
    } catch (err) {
      if (attempt >= 30) throw err;
      console.warn(`[db] not ready (${(err as Error).message}); retrying in 2s…`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  // 2. build HTTP app with the unified MCP endpoint
  const hubServer = createHubServer();
  const app = await buildApp(hubServer);
  await app.listen({ port: config.port, host: '0.0.0.0' });
  console.log(`[hub] listening on :${config.port} (MCP at /mcp)`);

  // 3. restore connector processes from the previous session
  try {
    await manager.loadAll();
    await manager.restoreEnabled();
    logPipeline.startPruner();
    const running = manager.all().filter((c) => c.status === 'running').length;
    console.log(`[hub] ${manager.all().length} connectors loaded, ${running} running`);
  } catch (err) {
    console.error('[hub] connector restore failed:', (err as Error).message);
  }

  // 4. graceful shutdown
  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[hub] ${signal} received — shutting down`);
    await Promise.allSettled([manager.shutdown(), logPipeline.shutdown(), app.close(), pool.end()]);
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('[hub] fatal:', err);
  process.exit(1);
});
