export function connectRoomSocket(serverUrl) {
  const url = serverUrl.replace(/^http/, "ws") + "/ws";
  const ws = new WebSocket(url);
  const listeners = new Map();
  const queue = [];
  let open = false;

  const emit = (event, payload) => {
    const frame = JSON.stringify({ event, payload });
    if (open && ws.readyState === WebSocket.OPEN) {
      ws.send(frame);
      return;
    }
    queue.push(frame);
  };

  ws.addEventListener("open", () => {
    open = true;
    while (queue.length) ws.send(queue.shift());
  });

  ws.addEventListener("message", (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      const fns = listeners.get(msg.event) || [];
      fns.forEach((fn) => fn(msg.payload));
    } catch {
      /* ignore malformed frames */
    }
  });

  return {
    emit,
    on(event, fn) {
      if (!listeners.has(event)) listeners.set(event, []);
      listeners.get(event).push(fn);
    },
    disconnect() {
      open = false;
      ws.close();
    },
  };
}
