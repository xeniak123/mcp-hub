import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import type { ConnectorManifest } from '@hub/shared';
import { config } from '../config.js';
import { validateManifestJson } from './validate.js';

/**
 * Custom connector manifests: JSON files dropped into
 * `${DATA_DIR}/connectors/*.json`. This lets anyone add marketplace entries
 * without rebuilding the image — mount a volume and restart the hub.
 *
 * The JSON shape is exactly ConnectorManifest (same as the built-in ones);
 * `official` cannot be set via file — custom entries are never marked official.
 */
export function loadCustomManifests(): ConnectorManifest[] {
  const dir = path.join(config.dataDir, 'connectors');
  if (!existsSync(dir)) return [];

  const manifests: ConnectorManifest[] = [];
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const full = path.join(dir, file);
    try {
      const parsed = validateManifestJson(JSON.parse(readFileSync(full, 'utf8')), file);
      manifests.push(parsed);
    } catch (err) {
      console.warn(`[registry] skipping custom manifest ${file}: ${(err as Error).message}`);
    }
  }
  return manifests;
}
