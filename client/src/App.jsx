import React, { useEffect, useRef, useState } from "react";
import { socket, emit } from "./socket.js";
import Home from "./screens/Home.jsx";
import HostScreen from "./screens/HostScreen.jsx";
import PlayerScreen from "./screens/PlayerScreen.jsx";
import { setMusic, setSfx, isMusicOn, isSfxOn, unlockAudio } from "./sound.js";

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

  // Audio lives ONLY on the host (main) screen — see HostScreen. Phones are silent.
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
      {mode !== "player" && <UiSlime />}
      {!connected && <div className="conn-banner">Reconnecting… (you'll be put right back in)</div>}

      <button className="cog-btn" title="Settings (Esc)" onClick={() => setMenuOpen(true)}>⚙️</button>
      {menuOpen && (
        <div className="menu-overlay" onClick={() => setMenuOpen(false)}>
          <div className="menu-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="menu-title">{inGame ? "Menu" : "Settings"}</h2>
            {/* Audio is host-only — phones don't show or play sound */}
            {mode !== "player" && (
              <div className="menu-toggles">
                <button className={`btn toggle ${musicOn ? "on" : ""}`} onClick={toggleMusic}>
                  {musicOn ? "🎵 Music: On" : "🔇 Music: Off"}
                </button>
                <button className={`btn toggle ${sfxOnState ? "on" : ""}`} onClick={toggleSfx}>
                  {sfxOnState ? "🔊 SFX: On" : "🔈 SFX: Off"}
                </button>
              </div>
            )}
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

// Decorative gooey slime oozing from the top edge — behind content (never covers text).
function UiSlime() {
  return (
    <div className="ui-slime" aria-hidden="true">
      <svg className="ui-slime-svg" viewBox="0 0 1200 155" preserveAspectRatio="none">
        <defs>
          <linearGradient id="slimeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4ff5e" />
            <stop offset="55%" stopColor="#a6e800" />
            <stop offset="100%" stopColor="#7ec900" />
          </linearGradient>
        </defs>
        <path fill="url(#slimeGrad)" d="M0 0 H1200 V58 C1185 70 1170 96 1150 96 C1130 96 1118 64 1098 58 C1078 80 1062 132 1040 132 C1018 132 1010 72 990 60 C968 78 952 100 932 100 C912 100 902 66 882 58 C858 88 840 128 818 128 C796 128 786 70 766 60 C742 80 726 150 702 150 C678 150 670 74 650 60 C628 80 612 104 592 104 C572 104 562 66 542 58 C516 84 498 126 476 126 C454 126 446 72 426 60 C404 80 388 100 368 100 C348 100 338 66 318 58 C292 86 274 134 252 134 C230 134 222 72 202 60 C180 80 164 104 144 104 C124 104 114 66 94 58 C72 82 56 110 36 110 C20 110 10 74 0 60 Z" />
        <path fill="#ECFFB3" opacity="0.5" d="M60 14 C120 8 220 8 280 16 C220 26 120 26 60 20 Z" />
        <path fill="#ECFFB3" opacity="0.45" d="M520 12 C600 6 720 6 800 14 C720 24 600 24 520 18 Z" />
        <path fill="#ECFFB3" opacity="0.45" d="M980 14 C1040 9 1120 9 1160 16 C1120 24 1040 24 980 19 Z" />
      </svg>
      <span className="ui-droplet d1" /><span className="ui-droplet d2" /><span className="ui-droplet d3" />
    </div>
  );
}
