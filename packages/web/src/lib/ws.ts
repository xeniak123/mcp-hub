import type { HubEvent } from '@hub/shared';

/** Singleton WebSocket to /api/stream with auto-reconnect. */
export function createHubSocket(onEvent: (e: HubEvent) => void): () => void {
  let socket: WebSocket | null = null;
  let retryMs = 1000;
  let closed = false;

  const connect = () => {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    socket = new WebSocket(`${proto}://${window.location.host}/api/stream`);

    socket.onopen = () => {
      // empty subscribe set = all status events; logs filtered per-connector below
      socket?.send(JSON.stringify({ type: 'subscribe', connectorIds: [] }));
      retryMs = 1000;
    };
    socket.onmessage = (ev) => {
      try {
        onEvent(JSON.parse(ev.data as string) as HubEvent);
      } catch {
        // ignore malformed frames
      }
    };
    socket.onclose = () => {
      if (closed) return;
      setTimeout(connect, retryMs);
      retryMs = Math.min(retryMs * 2, 15_000);
    };
  };

  connect();
  return () => {
    closed = true;
    socket?.close();
  };
}
