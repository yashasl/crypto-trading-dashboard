/**
 * WebSocket service helpers for live price updates.
 * Simple wrapper – the App creates the WebSocket directly via useDashboard,
 * but this file centralises URL config for easy changes.
 */

export const WS_URL = 'ws://localhost:8000/api/ws/prices';
export const API_URL = 'http://localhost:8000';

export function connectWebSocket(onMessage: (data: any) => void, onClose?: () => void): WebSocket {
  const ws = new WebSocket(WS_URL);
  ws.onmessage = (e) => {
    try { onMessage(JSON.parse(e.data)); } catch { /* ignore */ }
  };
  ws.onclose = () => { onClose?.(); };
  return ws;
}

export default { WS_URL, API_URL, connectWebSocket };