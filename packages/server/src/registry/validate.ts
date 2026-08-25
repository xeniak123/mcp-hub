import type { ConnectorManifest } from '@hub/shared';

/**
 * Shared validation for external connector manifests (volume JSON files and
 * community repo entries). Throws with a human-readable message on anything
 * that would break the manager or the marketplace UI.
 */
export function validateManifestJson(raw: unknown, source: string): ConnectorManifest {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('not a JSON object');
  }
  const m = raw as Record<string, unknown>;
  for (const key of ['id', 'name', 'icon', 'description', 'category', 'docsUrl'] as const) {
    if (typeof m[key] !== 'string') throw new Error(`missing string field "${key}"`);
  }
  if (typeof m.command !== 'object' || m.command === null || Array.isArray(m.command)) {
    throw new Error('missing "command"');
  }
  // command.run: non-empty string array; command.env: string->string record
  const run = (m.command as unknown as Record<string, unknown>).run;
  if (!Array.isArray(run) || run.length === 0 || run.some((a) => typeof a !== 'string')) {
    throw new Error('"command.run" must be a non-empty array of strings');
  }
  if (!m.configSchema || typeof m.configSchema !== 'object') {
    throw new Error('missing "configSchema"');
  }
  const props = (m.configSchema as Record<string, unknown>).properties;
  if (!props || typeof props !== 'object' || Array.isArray(props)) {
    throw new Error('"configSchema.properties" must be an object');
  }
  return {
    ...(raw as object),
    id: String(m.id),
    name: String(m.name),
    icon: String(m.icon),
    description: String(m.description),
    category: String(m.category) as ConnectorManifest['category'],
    docsUrl: String(m.docsUrl),
    official: false,
  } as ConnectorManifest;
}
