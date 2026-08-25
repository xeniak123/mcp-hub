import { z } from 'zod';
import { readFileSync, mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import path from 'node:path';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  POSTGRES_PASSWORD: z.string().default(''),
  MASTER_ENCRYPTION_KEY: z.string().default(''),
  SESSION_SECRET: z.string().default(''),
  APP_PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  LOG_RETENTION_LINES: z.coerce.number().int().positive().default(5000),
  LOG_RETENTION_DAYS: z.coerce.number().int().positive().default(7),
  CONNECTOR_START_TIMEOUT_MS: z.coerce.number().int().positive().default(20000),
  DATA_DIR: z.string().default('/app/data'),
  // Optional: POST a JSON alert here whenever a connector enters error state.
  // Empty string is allowed and means "disabled".
  ERROR_WEBHOOK_URL: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.string().url().optional()
  ).default(undefined),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

const raw = parsed.data;

// Zero-touch fallback: persist an auto-generated master key to DATA_DIR so
// configs survive restarts even when the user did not set the env var.
function resolveMasterKey(): string {
  if (raw.MASTER_ENCRYPTION_KEY) return raw.MASTER_ENCRYPTION_KEY;
  const keyPath = path.join(raw.DATA_DIR, 'master.key');
  if (existsSync(keyPath)) {
    return readFileSync(keyPath, 'utf8').trim();
  }
  const generated = randomBytes(32).toString('hex');
  mkdirSync(raw.DATA_DIR, { recursive: true });
  writeFileSync(keyPath, generated + '\n', { mode: 0o600 });
  console.warn(
    `MASTER_ENCRYPTION_KEY not set — auto-generated and persisted to ${keyPath}. ` +
      'Set it explicitly in .env to keep secrets decryptable across volume loss.'
  );
  return generated;
}

function resolveSessionSecret(): string {
  if (raw.SESSION_SECRET) return raw.SESSION_SECRET;
  const secret = randomBytes(32).toString('hex');
  console.warn('SESSION_SECRET not set — using a per-boot random secret (all sessions invalidate on restart).');
  return secret;
}

export const config = {
  databaseUrl: raw.DATABASE_URL,
  masterKey: resolveMasterKey(),
  sessionSecret: resolveSessionSecret(),
  port: raw.APP_PORT,
  nodeEnv: raw.NODE_ENV,
  isDev: raw.NODE_ENV === 'development',
  logRetentionLines: raw.LOG_RETENTION_LINES,
  logRetentionDays: raw.LOG_RETENTION_DAYS,
  connectorStartTimeoutMs: raw.CONNECTOR_START_TIMEOUT_MS,
  dataDir: raw.DATA_DIR,
  errorWebhookUrl: raw.ERROR_WEBHOOK_URL ?? '',
};

export type Config = typeof config;
