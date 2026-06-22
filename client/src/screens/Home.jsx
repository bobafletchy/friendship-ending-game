import React, { useState, useEffect } from "react";
import { emit } from "../socket.js";
import Avatar, { AVATARS, AVATAR_PICKS } from "../avatars.jsx";
import CharacterBuilder from "../components/CharacterBuilder.jsx";

const randPick = () => AVATAR_PICKS[Math.floor(Math.random() * AVATAR_PICKS.length)];

const HOW_TO = [
  { n: "1", title: "GRAB A SCREEN", body: "One device hosts on the TV. Everyone else joins from their phone." },
  { n: "2", title: "WRITE CHAOS", body: "Answer punchy prompts about your friends. Anonymously, obviously." },
  { n: "3", title: "REVEAL & VOTE", body: "Answers hit the big screen. Pick favorites. Guess the writer." },
  { n: "4", title: "END A FRIENDSHIP", body: "Rack up points across 5 rounds. Last round scores DOUBLE." },
];

export default function Home({ onHost, onJoin }) {
  const [tab, setTab] = useState("join"); // join | host
  const [code, setCode] = useState(() => {
    const c = new URLSearchParams(window.location.search).get("c");
    return c ? c.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) : "";
  });
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(randPick); // number (preset) or {custom:true,...}
  const [builderOpen, setBuilderOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tip, setTip] = useState(0);
  const isCustom = avatar && typeof avatar === "object";

  useEffect(() => {
    const i = setInterval(() => setTip((t) => (t + 1) % HOW_TO.length), 3500);
    return () => clearInterval(i);
  }, []);

  async function host() {
    setBusy(true);
    const res = await emit("create_room", {});
    setBusy(false);
    if (res.ok) onHost(res.code);
    else setError(res.error || "Could not create room.");
  }

  async function join(e) {
    e.preventDefault();
    setError("");
    if (code.trim().length < 4) return setError("Enter the 4-letter room code.");
    if (!name.trim()) return setError("Pick a nickname.");
    setBusy(true);
    const res = await emit("join_room", { code: code.trim().toUpperCase(), name: name.trim(), avatar });
    setBusy(false);
    if (res.ok) onJoin(res.code, res.playerId, res.name, res.avatar);
    else setError(res.error || "Could not join.");
  }

  return (
    <div className="home">
      <header className="home-head">
        <div className="logo-lockup">
          <span className="logo-spark">✶</span>
          <h1 className="logo">
            <span className="logo-1">THE FRIENDSHIP</span>
            <span className="logo-2">ENDING GAME</span>
          </h1>
        </div>
        <p className="tagline">Say something nice. <b>Lose a friend.</b></p>
      </header>

      <div className="home-grid">
        {/* PLAY CARD */}
        <section className="card play-card">
          <div className="tabs">
            <button className={`tab ${tab === "join" ? "on" : ""}`} onClick={() => setTab("join")}>📱 JOIN</button>
            <button className={`tab ${tab === "host" ? "on" : ""}`} onClick={() => setTab("host")}>🖥️ HOST</button>
          </div>

          {tab === "join" && (
            <form className="join-body" onSubmit={join}>
              <div className="avatar-stage">
                <Avatar index={avatar} size={132} className="hero" />
                <button type="button" className="shuffle" title="Shuffle"
                  onClick={() => setAvatar(randPick())}>
                  🎲
                </button>
              </div>
              <p className="avatar-name">{isCustom ? "Your creation ✨" : AVATARS[avatar].name}</p>

              <div className="avatar-rail">
                {AVATAR_PICKS.map((i) => (
                  <button type="button" key={i}
                    className={`avatar-pick ${i === avatar ? "sel" : ""}`}
                    onClick={() => setAvatar(i)} aria-label={AVATARS[i].name}>
                    <Avatar index={i} size={40} />
                  </button>
                ))}
                <button type="button" className={`avatar-pick make-own ${isCustom ? "sel" : ""}`}
                  onClick={() => setBuilderOpen(true)} aria-label="Make your own">✨</button>
              </div>

              <input className="input input-code" placeholder="ROOM CODE" maxLength={4} value={code}
                autoCapitalize="characters"
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))} />
              <input className="input" placeholder="Nickname" maxLength={20} value={name}
                onChange={(e) => setName(e.target.value)} />
              <button className="btn btn-big btn-lime" type="submit" disabled={busy}>START ▶</button>
            </form>
          )}

          {tab === "host" && (
            <div className="host-body">
              <div className="host-illustration">
                <Avatar index={7} size={88} />
                <Avatar index={6} size={104} />
                <Avatar index={9} size={88} />
              </div>
              <h2 className="host-title">Host on this screen</h2>
              <p className="host-sub">Cast this to your TV or laptop. Friends join with the room code on their phones.</p>
              <button className="btn btn-big btn-lime" onClick={host} disabled={busy}>CREATE ROOM ▶</button>
              <p className="host-foot">Best with 3+ players in the same room.</p>
            </div>
          )}

          {error && <p className="error-msg">{error}</p>}
        </section>

        {/* HOW TO PLAY RAIL */}
        <aside className="card howto-card">
          <h3 className="howto-head">HOW TO PLAY</h3>
          <div className="howto-step" key={tip}>
            <span className="howto-n">{HOW_TO[tip].n}</span>
            <div>
              <h4>{HOW_TO[tip].title}</h4>
              <p>{HOW_TO[tip].body}</p>
            </div>
          </div>
          <div className="howto-dots">
            {HOW_TO.map((_, i) => (
              <button key={i} className={`hdot ${i === tip ? "on" : ""}`} onClick={() => setTip(i)} />
            ))}
          </div>
        </aside>
      </div>

      {builderOpen && (
        <CharacterBuilder
          initial={isCustom ? avatar : null}
          onUse={(cfg) => { setAvatar(cfg); setBuilderOpen(false); }}
          onClose={() => setBuilderOpen(false)}
        />
      )}
    </div>
  );
}
