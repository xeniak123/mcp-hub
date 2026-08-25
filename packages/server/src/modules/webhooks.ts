import { config } from '../config.js';
import { events } from '../events.js';

/**
 * Failure alerts: when a connector transitions into the error state, POST a
 * JSON payload to ERROR_WEBHOOK_URL (Slack/Discord/Teams/generic receivers
 * all accept a JSON body; format kept receiver-agnostic).
 *
 * Debounced per connector so a flapping connector during backoff restarts
 * doesn't spam the channel — at most one alert per ALERT_COOLDOWN_MS.
 */

const COOLDOWN_MS = 5 * 60 * 1000;
const lastAlertAt = new Map<string, number>();

export function initWebhooks(): void {
  if (!config.errorWebhookUrl) return;

  events.subscribe((event) => {
    if (event.type !== 'status' || event.status !== 'error') return;

    const now = Date.now();
    const last = lastAlertAt.get(event.connectorId) ?? 0;
    if (now - last < COOLDOWN_MS) return;
    lastAlertAt.set(event.connectorId, now);

    const text = `🔴 MCP Hub: connector "${event.connectorId}" entered error state${event.detail ? ` — ${event.detail}` : ''}`;
    const payload = {
      text,
      content: text, // Discord
      connectorId: event.connectorId,
      status: 'error',
      detail: event.detail,
      timestamp: new Date().toISOString(),
    };

    // Fire-and-forget: an unreachable webhook must never affect the hub.
    void fetch(config.errorWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    }).catch((err) => {
      console.warn(`[webhooks] delivery failed: ${(err as Error).message}`);
    });
  });

  console.log(`[webhooks] error alerts enabled → ${config.errorWebhookUrl}`);
}
