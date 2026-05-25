type TickHandler = (price: number) => void;

interface WebSocketManager {
  connect: (symbol: string, onTick: TickHandler) => void;
  disconnect: () => void;
}

const WS_BASE = 'wss://stream.binance.com:9443/ws';
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECTS = 5;

export function createBinanceWebSocket(): WebSocketManager {
  let ws: WebSocket | null = null;
  let reconnectCount = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let currentSymbol = '';
  let currentHandler: TickHandler | null = null;
  let stopped = false;

  function connect(symbol: string, onTick: TickHandler) {
    stopped = false;
    currentSymbol = symbol.toLowerCase();
    currentHandler = onTick;
    reconnectCount = 0;
    openSocket();
  }

  function openSocket() {
    if (stopped) return;
    const stream = `${WS_BASE}/${currentSymbol}@miniTicker`;
    ws = new WebSocket(stream);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as { c?: string };
        if (data.c && currentHandler) {
          // Use requestAnimationFrame for smooth 60fps UI updates
          requestAnimationFrame(() => {
            currentHandler?.(parseFloat(data.c!));
          });
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      if (stopped) return;
      if (reconnectCount < MAX_RECONNECTS) {
        reconnectCount++;
        reconnectTimer = setTimeout(() => {
          openSocket();
        }, RECONNECT_DELAY_MS * reconnectCount); // exponential-ish backoff
      }
    };

    ws.onerror = () => {
      ws?.close();
    };
  }

  function disconnect() {
    stopped = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    ws?.close();
    ws = null;
    currentHandler = null;
  }

  return { connect, disconnect };
}
