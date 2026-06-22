import React, { useEffect, useState } from "react";
import { socket, emit } from "./socket.js";
import Home from "./screens/Home.jsx";
import HostScreen from "./screens/HostScreen.jsx";
import PlayerScreen from "./screens/PlayerScreen.jsx";
import { setMusic, setSfx, isMusicOn, isSfxOn, unlockAudio, initMusic, setScene, stopMusic } from "./sound.js";

export default function App() {
  // mode: 'home' | 'host' | 'player'
  const [mode, setMode] = useState("home");
  const [code, setCode] = useState("");
  const [playerId, setPlayerId] = useState(null);
  const [connected, setConnected] = useState(socket.connected);
  const [menuOpen, setMenuOpen] = useState(false);
  const [musicOn, setMusicOn] = useState(isMusicOn());
  const [sfxOnState, setSfxOnState] = useState(isSfxOn());

  function toggleMusic() { unlockAudio(); const v = !musicOn; setMusic(v); setMusicOn(v); }
  function toggleSfx() { const v = !sfxOnState; setSfx(v); setSfxOnState(v); }

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
    setMenuOpen(false);
    setMode("home");
    setCode("");
    setPlayerId(null);
  }

  // Esc opens/closes the settings menu anywhere (including the main menu).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setMenuOpen((o) => !o);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const inGame = mode === "host" || mode === "player";

  return (
    <>
      <div className="liquid-bg" aria-hidden="true">
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />
        <span className="blob b4" />
      </div>
      {!connected && <div className="conn-banner">Reconnecting… (you'll be put right back in)</div>}

      <button className="cog-btn" title="Settings (Esc)" onClick={() => setMenuOpen(true)}>⚙️</button>
      {menuOpen && (
        <div className="menu-overlay" onClick={() => setMenuOpen(false)}>
          <div className="menu-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="menu-title">{inGame ? "Menu" : "Settings"}</h2>
            <div className="menu-toggles">
              <button className={`btn toggle ${musicOn ? "on" : ""}`} onClick={toggleMusic}>
                {musicOn ? "🎵 Music: On" : "🔇 Music: Off"}
              </button>
              <button className={`btn toggle ${sfxOnState ? "on" : ""}`} onClick={toggleSfx}>
                {sfxOnState ? "🔊 SFX: On" : "🔈 SFX: Off"}
              </button>
            </div>
            <button className="btn btn-big btn-lime" onClick={() => setMenuOpen(false)}>
              {inGame ? "← Back to game" : "Done"}
            </button>
            {inGame && <button className="btn btn-big btn-ghost" onClick={leave}>🏠 Main menu</button>}
            {inGame && (
              <p className="menu-note">
                {mode === "host"
                  ? "Leaving ends this room for everyone."
                  : "You can rejoin with the same code & name anytime — your score is kept."}
              </p>
            )}
          </div>
        </div>
      )}

      {mode === "home" && <Home onHost={handleHost} onJoin={handleJoin} />}
      {mode === "host" && <HostScreen code={code} onLeave={leave} />}
      {mode === "player" && <PlayerScreen code={code} playerId={playerId} onLeave={leave} />}
    </>
  );
}
