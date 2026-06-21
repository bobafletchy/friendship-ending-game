import { io } from "socket.io-client";

// Same-origin in production (server serves the client). In dev, Vite
// proxies /socket.io to the Node server, so same-origin works too.
export const socket = io("/", {
  autoConnect: true,
  transports: ["websocket", "polling"],
});

export function emit(event, payload) {
  return new Promise((resolve) => {
    socket.emit(event, payload, (res) => resolve(res || {}));
  });
}
