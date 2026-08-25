import type { LogLine } from './api.js';
import type { ConnectorStatus } from './api.js';

/** Messages pushed from server to browser over WebSocket. */
export type HubEvent =
  | { type: 'log'; connectorId: string; line: LogLine }
  | { type: 'status'; connectorId: string; status: ConnectorStatus; detail: string | null }
  | { type: 'connected' };

/** Subscribe request sent from browser to server on WS open. */
export interface WsSubscribe {
  type: 'subscribe';
  /** connector ids to receive log lines for; empty = all (status events always flow). */
  connectorIds: string[];
}
