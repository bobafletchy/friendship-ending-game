import React, { useEffect, useRef, useState } from "react";
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
  const [isLeader, setIsLeader] = useState(false);

  // track whether this device is the leader (first player to join)
  useEffect(() => {
    const onPS = (s) => setIsLeader(!!s.you?.isLeader);
    socket.on("player:state", onPS);
    return () => socket.off("player:state", onPS);
  }, []);

  function restart() { emit("restart_game", {}); setMenuOpen(false); }

  function toggleMusic() { unlockAudio(); const v = !musicOn; setMusic(v); setMusicOn(v); }
  function toggleSfx() { const v = !sfxOnState; setSfx(v); setSfxOnState(v); }

  const modeRef = useRef(mode);
  modeRef.current = mode;

  // Main-menu music: arm it on load and start the instant the player interacts
  // (browsers block true autoplay). On repeat visits it can start immediately.
  useEffect(() => {
    initMusic();
    setScene("menu");
    unlockAudio(); // tries now; if blocked, the first click below starts it
    const start = () => { if (modeRef.current !== "player") unlockAudio(); };
    window.addEventListener("pointerdown", start);
    window.addEventListener("keydown", start);
    return () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    };
  }, []);

  // Keep music to the menu + host TV; phones stay quiet during play.
  useEffect(() => {
    if (mode === "player") stopMusic();
    else if (mode === "home") setScene("menu");
    // host: HostScreen drives the scene per phase
  }, [mode]);

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
      <UiSlime />
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

            {mode === "host" && <button className="btn btn-big btn-ghost" onClick={leave}>🏠 Main menu</button>}

            {mode === "player" && isLeader && (
              <>
                <button className="btn btn-big btn-coral" onClick={restart}>🔄 Restart game</button>
                <button className="btn btn-big btn-ghost" onClick={leave}>🏠 Leave to main menu</button>
                <p className="menu-note">You're the host 👑 — restart or leave for everyone.</p>
              </>
            )}

            {mode === "player" && !isLeader && (
              <p className="menu-note">Only the host 👑 can restart or end the game. You can rejoin anytime with the same name.</p>
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

// Decorative slime oozing from the top edge — sits behind content (never covers text).
function UiSlime() {
  const drips = [5, 14, 23, 33, 44, 56, 67, 77, 86, 95];
  return (
    <div className="ui-slime" aria-hidden="true">
      <div className="ui-slime-band" />
      {drips.map((l, i) => (
        <span
          key={i}
          className="ui-drip"
          style={{
            left: `${l}%`,
            "--w": `${9 + (i % 3) * 5}px`,
            "--h": `${16 + ((i * 7) % 5) * 11}px`,
            animationDelay: `${(i % 4) * 0.6}s`,
          }}
        />
      ))}
    </div>
  );
}
