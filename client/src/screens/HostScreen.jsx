import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { socket, emit } from "../socket.js";
import TimerRing from "../components/Timer.jsx";
import FloatingReactions from "../components/Reactions.jsx";
import Avatar from "../avatars.jsx";
import { sfx, unlockAudio, initMusic, setScene, playSlime } from "../sound.js";

// which looping track plays for each phase
function sceneFor(ph) {
  switch (ph) {
    case "answering": case "tiebreak_answer": return "answer";
    case "reveal": case "vote": case "round_scores": case "tiebreak_vote": case "gameover": return "reveal";
    default: return "menu"; // lobby, round_intro
  }
}

const ROUND_LABEL = {
  targeted: "THE HOT SEAT",
  madlibs: "THE FRIENDSHIP TEST",
};

export default function HostScreen({ code }) {
  const [state, setState] = useState(null);
  const [slime, setSlime] = useState(false);
  const prevPhase = useRef("lobby");
  const sound = useRef({ phase: null, count: 0, mad: 0, gi: 0 });

  // preload music + unlock audio on the very first interaction (autoplay rules)
  useEffect(() => {
    initMusic();
    const onFirst = () => { unlockAudio(); window.removeEventListener("pointerdown", onFirst); };
    window.addEventListener("pointerdown", onFirst);
    return () => window.removeEventListener("pointerdown", onFirst);
  }, []);

  useEffect(() => {
    const onState = (s) => setState(s);
    socket.on("host:state", onState);
    // re-attach host on (re)connect AND immediately on mount, so we never
    // get stuck on the loading screen if we missed the first broadcast
    const onConnect = () => emit("host_reconnect", { code });
    socket.on("connect", onConnect);
    if (socket.connected) emit("host_reconnect", { code });
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
      playSlime();
      const t = setTimeout(() => setSlime(false), 2600);
      prevPhase.current = state.phase;
      return () => clearTimeout(t);
    }
    prevPhase.current = state.phase;
  }, [state?.phase]);

  // sound effects driven by state changes
  useEffect(() => {
    if (!state) return;
    const s = sound.current;
    const ph = state.phase;
    if (ph !== s.phase) {
      setScene(sceneFor(ph)); // crossfade the background track to match the phase
      if (ph === "vote" || ph === "tiebreak_vote") sfx.vote();
      else if (ph === "round_scores") sfx.score();
      s.phase = ph; s.mad = 0; s.lastAns = null;
    }
    const rv = state.reveal;
    if (ph === "reveal" && rv) {
      if (rv.kind === "targeted") {
        // ping when the ANSWER drops in (not the question)
        const key = `${rv.index}:${rv.answerNum}`;
        if (rv.current?.text && s.lastAns !== key) { sfx.reveal(); s.lastAns = key; }
      } else if (typeof rv.revealCursor === "number" && rv.revealCursor > s.mad) {
        sfx.reveal(); s.mad = rv.revealCursor;
      }
    }
  }, [state]);

  if (!state) return <div className="tv screen-center"><h2>Loading the chaos…</h2></div>;

  const advance = () => { unlockAudio(); emit("host_advance", {}); };

  return (
    <div className="tv">
      {slime && <SlimeDrop />}
      <FloatingReactions />
      <TopBar state={state} />
      <div className="tv-stage">
        {state.phase === "lobby" && <Lobby state={state} />}
        {state.phase === "round_intro" && <RoundIntro state={state} onNext={advance} />}
        {state.phase === "answering" && <Answering state={state} onNext={advance} />}
        {state.phase === "reveal" && <Reveal state={state} onNext={advance} />}
        {state.phase === "vote" && <Voting state={state} onNext={advance} />}
        {state.phase === "round_scores" && <RoundScores state={state} onNext={advance} />}
        {state.phase === "tiebreak_answer" && <TiebreakAnswer state={state} />}
        {state.phase === "tiebreak_vote" && <TiebreakVote state={state} />}
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

function Lobby({ state }) {
  const enough = state.players.length >= state.minPlayers;
  const leader = state.players.find((p) => p.isLeader);
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
          {leader
            ? <p className="lobby-status">👑 <b style={{ color: leader.color }}>{leader.name}</b> {enough ? "can start on their phone" : `— need ${state.minPlayers - state.players.length} more player${state.minPlayers - state.players.length === 1 ? "" : "s"}`}</p>
            : <p className="lobby-status">First to join becomes the host 👑</p>}
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
              <span className="chip-av">
                <Avatar index={p.avatar} size={36} />
                {p.isLeader && <span className="crown crown-sm">👑</span>}
              </span>
              {p.name}{p.isBot && " 🤖"}
            </span>
          ))}
          {state.players.length === 0 && <p className="muted">Waiting for victims…</p>}
        </div>
      </div>
    </div>
  );
}

// Screen-wide slime that oozes down, holds, then drains away on game start.
function SlimeDrop() {
  const drips = [4, 12, 21, 30, 39, 48, 57, 66, 75, 84, 93];
  const droplets = [14, 33, 52, 70, 88];
  return (
    <div className="slime-drop">
      <div className="slime-sheet">
        <div className="slime-shine" />
        {drips.map((l, i) => (
          <span key={i} className="slime-drip" style={{
            left: `${l}%`,
            "--w": `${5 + (i % 4) * 1.8}vmin`,
            "--h": `${7 + ((i * 3) % 5) * 3}vmin`,
            animationDelay: `${(i % 5) * 0.05}s`,
          }} />
        ))}
      </div>
      {droplets.map((l, i) => (
        <span key={i} className="slime-droplet" style={{ left: `${l}%`, animationDelay: `${0.7 + i * 0.13}s` }} />
      ))}
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
      <p className="auto-hint">prompts coming to your phones…</p>
      <button className="btn btn-sm btn-ghost host-skip" onClick={onNext}>skip ⏭</button>
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
      <TimerRing deadline={state.answerDeadline} total={state.answerTotal || 80} />
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
        <div className="reveal-target-row pop-in">
          <Avatar index={r.targetAvatar} size={56} />
          <span className="rt-label">answers about <b style={{ color: r.targetColor }}>{r.targetName}</b></span>
        </div>
        <p className="kicker">answer {r.answerNum} of {r.totalAnswers} · {r.index}/{r.total} on the hot seat</p>

        {!r.allRevealed && r.current ? (
          // ROLLOUT: question alone first, then the answer drops in under it
          <div className="bomb-card" key={`${r.index}-${r.answerNum}`}>
            <span className="bomb-prompt flip-in">"{r.current.promptText}"</span>
            {r.current.text
              ? <span className="bomb-answer flip-in">{r.current.text}</span>
              : <span className="bomb-suspense">🤔💭</span>}
          </div>
        ) : (
          <>
            <div className="answer-cards">
              {r.answers.map((a) => (
                <div key={a.id} className="answer-card flip-in">
                  {a.promptText && <span className="ac-prompt">"{a.promptText}"</span>}
                  <span className="ac-text">{a.text}</span>
                </div>
              ))}
            </div>
            <p className="big-instruction pulse">👉 {r.targetName}, pick your favorite & guess who wrote it!</p>
          </>
        )}
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
      <button className="btn btn-sm btn-ghost host-skip" onClick={onNext}>
        {r.revealCursor >= r.total ? "start voting ⏭" : "next ⏭"}
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
            <span className="chip-av"><Avatar index={p.avatar} size={40} />{p.isLeader && <span className="crown crown-sm">👑</span>}</span>
            <span className="sb-name" style={{ color: p.color }}>{p.name}</span>
            <span className="sb-bar"><span className="sb-fill" style={{ width: `${(p.score / max) * 100}%`, background: p.color }} /></span>
            <span className="sb-score">{p.score}</span>
          </div>
        ))}
      </div>
      <button className="btn btn-sm btn-ghost host-skip" onClick={onNext}>
        {state.isFinalRound ? "see the winner ⏭" : "next round ⏭"}
      </button>
    </div>
  );
}

function TiebreakAnswer({ state }) {
  const tb = state.tiebreak || {};
  return (
    <div className="screen-center fade-in">
      <p className="kicker">It's a tie!</p>
      <h1 className="round-title">TIE-BREAKER</h1>
      <p className="round-blurb">{(tb.names || []).join(" vs ")} — answer about <b>YOURSELF</b> on your phones 😬</p>
      <p className="madlibs-setup big">"{tb.promptText}"</p>
      <p className="muted">{tb.answered || 0} / {(tb.names || []).length} answered</p>
    </div>
  );
}

function TiebreakVote({ state }) {
  const tb = state.tiebreak || {};
  return (
    <div className="voting screen-center fade-in">
      <h2 className="answer-head">🗳️ Vote for the best self-own!</h2>
      <p className="muted">on your phones</p>
      <div className="vote-grid">
        {(tb.options || []).map((o) => (
          <div key={o.id} className="vote-tile"><span className="vt-text">{o.text}</span></div>
        ))}
      </div>
      <p className="muted">{tb.voted || 0} voted</p>
    </div>
  );
}

// A dancing little body topped with the player's avatar head. Goes feral.
function Dancer({ avatar, color, size = 90, crown = false, delay = 0 }) {
  return (
    <div className="dancer" style={{ "--c": color, "--s": `${size}px`, animationDelay: `${delay}s` }}>
      <span className="d-arm d-arm-l" style={{ animationDelay: `${delay}s` }} />
      <span className="d-arm d-arm-r" style={{ animationDelay: `${delay}s` }} />
      <div className="d-legs">
        <span className="d-leg d-leg-l" style={{ animationDelay: `${delay}s` }} />
        <span className="d-leg d-leg-r" style={{ animationDelay: `${delay + 0.1}s` }} />
      </div>
      <div className="d-torso" style={{ animationDelay: `${delay}s` }} />
      <div className="d-head">
        {crown && <span className="crown d-crown">👑</span>}
        <Avatar index={avatar} size={size} />
      </div>
    </div>
  );
}

function GameOver({ state }) {
  const board = state.players;
  const winner = board[0];
  return (
    <div className="gameover screen-center fade-in">
      <Confetti />
      <p className="kicker">The friendship has officially ended.</p>
      {winner && (
        <div className="winner-stage">
          <Dancer avatar={winner.avatar} color={winner.color} size={150} crown delay={0} />
        </div>
      )}
      <h1 className="winner-name" style={{ color: winner?.color }}>{winner?.name}</h1>
      <p className="winner-sub">wins with {winner?.score} points 🏆</p>

      <div className="dance-floor">
        {board.map((p, i) => (
          <Dancer key={p.id} avatar={p.avatar} color={p.color} size={70} delay={(i % 5) * 0.07} />
        ))}
      </div>

      <div className="scoreboard final">
        {board.map((p, i) => (
          <div key={p.id} className={`sb-row ${i === 0 ? "champ" : ""}`}>
            <span className="sb-rank">{i + 1}</span>
            <span className="chip-av"><Avatar index={p.avatar} size={36} />{p.isLeader && <span className="crown crown-sm">👑</span>}</span>
            <span className="sb-name" style={{ color: p.color }}>{p.name}</span>
            <span className="sb-score">{p.score}</span>
          </div>
        ))}
      </div>
      <p className="footnote">👑 {board.find((p) => p.isLeader)?.name || "The host"} can hit ⚙️ → Restart on their phone to run it back.</p>
    </div>
  );
}

// Continuous heavy confetti rain.
function Confetti() {
  const colors = ["#ff4d6d", "#ffb703", "#06d6a0", "#4cc9f0", "#b5179e", "#f72585", "#c6ff3d", "#ff7b00"];
  const bits = Array.from({ length: 150 });
  return (
    <div className="confetti">
      {bits.map((_, i) => (
        <span key={i} style={{
          left: `${Math.random() * 100}%`,
          background: colors[i % colors.length],
          width: `${7 + Math.random() * 8}px`,
          height: `${10 + Math.random() * 10}px`,
          animationDelay: `${Math.random() * 3}s`,
          animationDuration: `${1.6 + Math.random() * 2.2}s`,
        }} />
      ))}
    </div>
  );
}
