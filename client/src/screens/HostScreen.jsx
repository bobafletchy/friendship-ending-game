import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { socket, emit } from "../socket.js";
import TimerRing from "../components/Timer.jsx";
import FloatingReactions from "../components/Reactions.jsx";
import Avatar from "../avatars.jsx";

const ROUND_LABEL = {
  targeted: "TARGETED CHAOS",
  mixed: "MIXED PROMPT CHAOS",
  madlibs: "THE FRIENDSHIP TEST",
};

export default function HostScreen({ code }) {
  const [state, setState] = useState(null);
  const [slime, setSlime] = useState(false);
  const prevPhase = useRef("lobby");

  useEffect(() => {
    const onState = (s) => setState(s);
    socket.on("host:state", onState);
    // re-attach host on reconnect
    const onConnect = () => emit("host_reconnect", { code });
    socket.on("connect", onConnect);
    return () => {
      socket.off("host:state", onState);
      socket.off("connect", onConnect);
    };
  }, [code]);

  // screen-wide slime drop when the game kicks off (lobby -> first round)
  useEffect(() => {
    if (!state) return;
    if (prevPhase.current === "lobby" && state.phase === "round_intro") {
      setSlime(true);
      const t = setTimeout(() => setSlime(false), 2600);
      prevPhase.current = state.phase;
      return () => clearTimeout(t);
    }
    prevPhase.current = state.phase;
  }, [state?.phase]);

  if (!state) return <div className="tv screen-center"><h2>Loading the chaos…</h2></div>;

  const advance = () => emit("host_advance", {});
  const start = async () => {
    const res = await emit("start_game", {});
    if (res.error) alert(res.error);
  };

  return (
    <div className="tv">
      {slime && <SlimeDrop />}
      <FloatingReactions />
      <TopBar state={state} />
      <div className="tv-stage">
        {state.phase === "lobby" && <Lobby state={state} onStart={start} />}
        {state.phase === "round_intro" && <RoundIntro state={state} onNext={advance} />}
        {state.phase === "answering" && <Answering state={state} onNext={advance} />}
        {state.phase === "reveal" && <Reveal state={state} onNext={advance} />}
        {state.phase === "vote" && <Voting state={state} onNext={advance} />}
        {state.phase === "round_scores" && <RoundScores state={state} onNext={advance} />}
        {state.phase === "gameover" && <GameOver state={state} />}
      </div>
    </div>
  );
}

function TopBar({ state }) {
  const showRound = state.phase !== "lobby" && state.phase !== "gameover";
  return (
    <div className="tv-topbar">
      <span className="brand">🔥 Friendship Ending Game</span>
      {showRound && (
        <span className="round-pill">
          ROUND {state.roundIndex + 1}/{state.totalRounds}
          {state.chaos > 1 && <em className="chaos-tag">CHAOS ×2</em>}
        </span>
      )}
      {state.phase !== "lobby" && <span className="code-mini">ROOM {state.code}</span>}
    </div>
  );
}

function Lobby({ state, onStart }) {
  const enough = state.players.length >= state.minPlayers;
  const [qr, setQr] = useState("");

  const isLocal = /localhost|127\.0\.0\.1/.test(window.location.host);
  const base = isLocal ? (state.lanUrl || window.location.origin) : window.location.origin;
  const joinUrl = `${base}/?c=${state.code}`;
  const joinLabel = joinUrl.replace(/^https?:\/\//, "");

  useEffect(() => {
    QRCode.toDataURL(joinUrl, { margin: 1, width: 320, color: { dark: "#0e0e12", light: "#f5f3ec" } })
      .then(setQr).catch(() => setQr(""));
  }, [joinUrl]);

  return (
    <div className="lobby">
      <div className="lobby-left">
        <p className="join-hint">Scan to join, or go to</p>
        <p className="join-url">{joinLabel}</p>
        <div className="code-box">
          <span className="code-label">ROOM CODE</span>
          <span className="code-huge">{state.code}</span>
        </div>
        <div className="lobby-actions">
          <button className="btn btn-big btn-lime" onClick={onStart} disabled={!enough}>
            {enough ? "START THE GAME ▶" : `Need ${state.minPlayers - state.players.length} more…`}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => emit("add_bots", { count: 3 })}>
            🤖 Add 3 test bots
          </button>
        </div>
      </div>
      <div className="lobby-right">
        {qr && (
          <div className="qr-box pop-in">
            <img src={qr} alt="Join QR code" className="qr-img" />
            <span className="qr-cap">point your camera here 📸</span>
          </div>
        )}
        <h3>{state.players.length} in the room</h3>
        <div className="player-chips">
          {state.players.map((p) => (
            <span key={p.id} className="player-chip pop-in" style={{ "--c": p.color }}>
              <Avatar index={p.avatar} size={36} />
              {p.name}{p.isBot && " 🤖"}
            </span>
          ))}
          {state.players.length === 0 && <p className="muted">Waiting for victims…</p>}
        </div>
      </div>
    </div>
  );
}

// Screen-wide slime that drops down, holds, then drains away on game start.
function SlimeDrop() {
  return (
    <div className="slime-drop">
      <div className="slime-sheet">
        <svg className="slime-edge" viewBox="0 0 100 24" preserveAspectRatio="none">
          <path d="M0 0H100V8 Q97 18 92 9 Q88 22 82 10 Q77 20 70 9 Q64 21 56 10 Q50 19 44 9 Q38 22 30 10 Q24 20 16 9 Q10 21 6 10 Q3 16 0 8 Z" fill="#c6ff3d" />
        </svg>
        <span className="slime-glob g1" />
        <span className="slime-glob g2" />
        <span className="slime-glob g3" />
      </div>
    </div>
  );
}

function RoundIntro({ state, onNext }) {
  const intro = state.intro || {};
  return (
    <div className="screen-center fade-in">
      <p className="kicker">ROUND {state.roundIndex + 1}</p>
      <h1 className="round-title">{ROUND_LABEL[state.roundKind]}</h1>
      <p className="round-blurb">{intro.blurb}</p>
      {state.setup && <p className="madlibs-setup">"{state.setup}"</p>}
      {state.chaos > 1 && <p className="chaos-banner">⚡ CHAOS MULTIPLIER: all points DOUBLED ⚡</p>}
      <button className="btn btn-big btn-primary" onClick={onNext}>Send prompts →</button>
    </div>
  );
}

function Answering({ state, onNext }) {
  const total = state.players.length;
  const done = state.submittedCount || 0;
  return (
    <div className="answering screen-center fade-in">
      <h2 className="answer-head">✍️ Answer on your phones</h2>
      {state.setup && <p className="madlibs-setup big">"{state.setup}"</p>}
      <TimerRing deadline={state.answerDeadline} total={80} />
      <div className="submit-track">
        {state.players.map((p) => {
          const isIn = (state.submittedIds || []).includes(p.id);
          return (
            <span key={p.id} className={`sub-dot ${isIn ? "in" : ""}`} style={{ "--c": p.color }}>
              <Avatar index={p.avatar} size={26} /> {p.name} {isIn ? "✓" : "…"}
            </span>
          );
        })}
      </div>
      <p className="muted">{done} / {total} locked in</p>
      <button className="btn btn-ghost btn-sm host-skip" onClick={onNext}>Skip to reveal →</button>
    </div>
  );
}

function Reveal({ state, onNext }) {
  const r = state.reveal;
  if (!r) return <div className="screen-center"><h2>…</h2></div>;

  if (r.kind === "targeted") {
    return (
      <div className="reveal-targeted screen-center fade-in">
        <p className="kicker">Answers about</p>
        <div className="target-id pop-in">
          <Avatar index={r.targetAvatar} size={96} />
          <h1 className="target-name" style={{ color: r.targetColor }}>{r.targetName}</h1>
        </div>
        <p className="reveal-prompt">"{r.promptText}"</p>
        <div className="answer-cards">
          {r.answers.map((a, i) => (
            <div key={a.id} className="answer-card flip-in" style={{ animationDelay: `${i * 0.5}s` }}>
              {a.text}
            </div>
          ))}
        </div>
        <p className="big-instruction pulse">👉 {r.targetName}, pick your favorite & guess who wrote it!</p>
        <button className="btn btn-ghost btn-sm host-skip" onClick={onNext}>Skip →</button>
      </div>
    );
  }

  // vote-round reveal: answers shown one at a time
  const last = r.shown[r.shown.length - 1];
  return (
    <div className="reveal-list screen-center fade-in">
      <p className="kicker">{r.madlibs ? "The truth comes out…" : "The answers"}</p>
      {last ? (
        <div className="big-answer flip-in" key={last.id}>
          {!r.madlibs && <p className="ba-prompt">"{last.promptText}"</p>}
          <p className="ba-text">{last.text}</p>
        </div>
      ) : (
        <h2>Get ready…</h2>
      )}
      <p className="muted">{r.revealCursor} / {r.total}</p>
      <button className="btn btn-big btn-primary" onClick={onNext}>
        {r.revealCursor >= r.total ? "Start voting →" : "Next answer →"}
      </button>
    </div>
  );
}

function Voting({ state, onNext }) {
  const v = state.vote;
  return (
    <div className="voting screen-center fade-in">
      <h2 className="answer-head">🗳️ Vote for the funniest!</h2>
      <p className="muted">on your phones</p>
      <div className="vote-grid">
        {v.options.map((o) => (
          <div key={o.id} className="vote-tile">
            {!v.madlibs && <span className="vt-prompt">"{o.promptText}"</span>}
            <span className="vt-text">{o.text}</span>
          </div>
        ))}
      </div>
      <p className="muted">{v.voted} / {state.players.length} voted</p>
      <button className="btn btn-ghost btn-sm host-skip" onClick={onNext}>Force results →</button>
    </div>
  );
}

function RoundScores({ state, onNext }) {
  const res = state.roundResults;
  const board = state.players;
  const max = Math.max(1, ...board.map((p) => p.score));
  return (
    <div className="round-scores screen-center fade-in">
      {res?.kind === "targeted" && (
        <div className="round-recap">
          <h2>This round's verdicts</h2>
          <div className="recap-list">
            {res.items.map((it, i) => (
              <div key={i} className="recap-row slide-in" style={{ animationDelay: `${i * 0.15}s` }}>
                <b>{it.targetName}</b> loved: "<i>{it.bestText}</i>"
                <span className="recap-writer">
                  — by {it.writerName} {it.correctGuess ? "🎯 (caught them!)" : "🕵️ (got away with it)"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {res?.kind === "vote" && res.winner && (
        <div className="round-recap">
          <h2>🏆 Funniest answer</h2>
          <div className="winner-answer pop-in">
            {res.winner.promptText && res.winner.promptText !== "The Friendship Test" && (
              <p className="ba-prompt">"{res.winner.promptText}"</p>
            )}
            <p className="ba-text">{res.winner.text}</p>
            <p className="recap-writer">— {res.winner.writerName} · {res.winner.votes} votes</p>
          </div>
        </div>
      )}

      <h3 className="sb-head">Scores</h3>
      <div className="scoreboard">
        {board.map((p, i) => (
          <div key={p.id} className="sb-row" style={{ animationDelay: `${i * 0.08}s` }}>
            <span className="sb-rank">{i + 1}</span>
            <Avatar index={p.avatar} size={40} />
            <span className="sb-name" style={{ color: p.color }}>{p.name}</span>
            <span className="sb-bar"><span className="sb-fill" style={{ width: `${(p.score / max) * 100}%`, background: p.color }} /></span>
            <span className="sb-score">{p.score}</span>
          </div>
        ))}
      </div>
      <button className="btn btn-big btn-primary" onClick={onNext}>
        {state.isFinalRound ? "See the winner →" : "Next round →"}
      </button>
    </div>
  );
}

function GameOver({ state }) {
  const board = state.players;
  const winner = board[0];
  const [boom, setBoom] = useState(false);
  useEffect(() => { const t = setTimeout(() => setBoom(true), 400); return () => clearTimeout(t); }, []);
  return (
    <div className="gameover screen-center fade-in">
      {boom && <Confetti />}
      <p className="kicker">The friendship has officially ended.</p>
      {winner && <div className="champ-avatar pop-in"><Avatar index={winner.avatar} size={140} /></div>}
      <h1 className="winner-name" style={{ color: winner?.color }}>👑 {winner?.name}</h1>
      <p className="winner-sub">wins with {winner?.score} points</p>
      <div className="scoreboard final">
        {board.map((p, i) => (
          <div key={p.id} className={`sb-row ${i === 0 ? "champ" : ""}`}>
            <span className="sb-rank">{i + 1}</span>
            <Avatar index={p.avatar} size={36} />
            <span className="sb-name" style={{ color: p.color }}>{p.name}</span>
            <span className="sb-score">{p.score}</span>
          </div>
        ))}
      </div>
      <p className="footnote">Refresh the page to play again.</p>
    </div>
  );
}

function Confetti() {
  const bits = Array.from({ length: 60 });
  const colors = ["#ff4d6d", "#ffb703", "#06d6a0", "#4cc9f0", "#b5179e", "#f72585"];
  return (
    <div className="confetti">
      {bits.map((_, i) => (
        <span key={i} style={{
          left: `${Math.random() * 100}%`,
          background: colors[i % colors.length],
          animationDelay: `${Math.random() * 2}s`,
          animationDuration: `${2 + Math.random() * 2}s`,
        }} />
      ))}
    </div>
  );
}
