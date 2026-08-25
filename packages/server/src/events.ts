import { EventEmitter } from 'node:events';
import type { HubEvent } from '@hub/shared';

type Handler = (event: HubEvent) => void;

/** Internal pub/sub hub for WS broadcasts (status changes, log lines). */
class EventBus {
  private emitter = new EventEmitter().setMaxListeners(100);

  emit(event: HubEvent): boolean {
    return this.emitter.emit('event', event);
  }

  /** Subscribe to all hub events; returns an unsubscribe function. */
  subscribe(handler: Handler): () => void {
    this.emitter.on('event', handler);
    return () => this.emitter.off('event', handler);
  }
}

export const events = new EventBus();
