import React, { useEffect, useState } from "react";
import { socket, emit } from "./socket.js";
import Home from "./screens/Home.jsx";
import HostScreen from "./screens/HostScreen.jsx";
import PlayerScreen from "./screens/PlayerScreen.jsx";

export default function App() {
  // mode: 'home' | 'host' | 'player'
  const [mode, setMode] = useState("home");
  const [code, setCode] = useState("");
  const [playerId, setPlayerId] = useState(null);
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  // Try to restore a player session on reload.
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("feg_session") || "null");
    if (saved?.role === "player" && saved.code && saved.playerId) {
      const rejoin = () =>
        emit("join_room", { code: saved.code, playerId: saved.playerId, name: saved.name, avatar: saved.avatar }).then((res) => {
          if (res.ok) {
            setCode(res.code);
            setPlayerId(res.playerId);
            setMode("player");
          } else {
            localStorage.removeItem("feg_session");
          }
        });
      if (socket.connected) rejoin();
      else socket.once("connect", rejoin);
    }
  }, []);

  function handleHost(roomCode) {
    setCode(roomCode);
    setMode("host");
  }

  function handleJoin(roomCode, pid, name, avatar) {
    setCode(roomCode);
    setPlayerId(pid);
    localStorage.setItem("feg_session", JSON.stringify({ role: "player", code: roomCode, playerId: pid, name, avatar }));
    setMode("player");
  }

  function leave() {
    localStorage.removeItem("feg_session");
    setMode("home");
    setCode("");
    setPlayerId(null);
  }

  return (
    <>
      <div className="liquid-bg" aria-hidden="true">
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />
        <span className="blob b4" />
      </div>
      {!connected && <div className="conn-banner">Reconnecting…</div>}
      {mode === "home" && <Home onHost={handleHost} onJoin={handleJoin} />}
      {mode === "host" && <HostScreen code={code} />}
      {mode === "player" && <PlayerScreen code={code} playerId={playerId} onLeave={leave} />}
    </>
  );
}
