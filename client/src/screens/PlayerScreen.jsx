import React, { useEffect, useState } from "react";
import { socket, emit } from "../socket.js";
import { useCountdown } from "../components/Timer.jsx";
import Avatar from "../avatars.jsx";

export default function PlayerScreen({ code, playerId, onLeave }) {
  const [state, setState] = useState(null);

  useEffect(() => {
    const onState = (s) => setState(s);
    socket.on("player:state", onState);
    // on (re)connect, rejoin; if the room is truly gone, bounce to the menu
    const rejoin = () => emit("join_room", { code, playerId }).then((res) => {
      if (res && res.error) onLeave?.();
    });
    const onConnect = () => rejoin();
    socket.on("connect", onConnect);
    if (socket.connected) rejoin();
    return () => {
      socket.off("player:state", onState);
      socket.off("connect", onConnect);
    };
  }, [code, playerId]);

  if (!state) return <div className="phone screen-center"><h2>Connecting…</h2></div>;
  const you = state.you;
  const t = state.task || {};

  return (
    <div className="phone" style={{ "--me": you?.color || "#fff" }}>
      <div className="phone-bar">
        <span className="me-id">
          {you && (
            <span className="me-av">
              <Avatar index={you.avatar} size={32} />
              {you.isLeader && <span className="crown crown-sm">👑</span>}
            </span>
          )}
          <span className="me-name" style={{ color: you?.color }}>{you?.name}</span>
        </span>
        <span className="me-score">{you?.score ?? 0} pts</span>
      </div>

      <div className="phone-body">
        {t.type === "lobby" && <Lobby task={t} />}
        {t.type === "wait" && <Wait title={t.title} message={t.message} />}
        {t.type === "answer" && <Answer task={t} />}
        {t.type === "answer_targeted" && <AnswerTargeted task={t} />}
        {t.type === "answer_multi" && <AnswerMulti task={t} />}
        {t.type === "submitted" && <Submitted message={t.message} />}
        {t.type === "watch" && <Watch message={t.message} />}
        {t.type === "pick" && <Pick task={t} />}
        {t.type === "vote" && <Vote task={t} />}
        {t.type === "score" && <Score task={t} />}
        {t.type === "gameover" && <GameOver task={t} isLeader={you?.isLeader} onLeave={onLeave} />}
      </div>

      {(t.type === "watch" || t.type === "submitted" || t.type === "pick") && <ReactionBar />}
    </div>
  );
}

function Lobby({ task }) {
  const [busy, setBusy] = useState(false);
  if (task.isLeader) {
    const enough = task.count >= task.min;
    const start = async () => {
      setBusy(true);
      const res = await emit("start_game", {});
      setBusy(false);
      if (res.error) alert(res.error);
    };
    return (
      <div className="screen-center fade-in">
        <h1 className="phone-big">👑 You're the host!</h1>
        <p className="phone-sub">{task.count} in the room. You control the game.</p>
        <button className="btn btn-big btn-lime" onClick={start} disabled={!enough || busy} style={{ width: "100%" }}>
          {enough ? "START THE GAME ▶" : `Need ${task.min - task.count} more…`}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => emit("add_bots", { count: 3 })}>🤖 Add 3 test bots</button>
      </div>
    );
  }
  return (
    <div className="screen-center fade-in">
      <h1 className="phone-big">You're in! 🎉</h1>
      <p className="phone-sub">👑 {task.leaderName} will start the game. Look up at the big screen.</p>
    </div>
  );
}

function Wait({ title, message }) {
  return (
    <div className="screen-center fade-in">
      {title && <h2 className="phone-big">{title}</h2>}
      <p className="phone-sub">{message}</p>
      <div className="dots"><span /><span /><span /></div>
    </div>
  );
}

function PhoneTimer({ deadline }) {
  const remaining = useCountdown(deadline);
  return <div className={`phone-timer ${remaining <= 10 ? "danger" : ""}`}>⏱ {remaining}s</div>;
}

function Answer({ task }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    if (!text.trim()) return setErr("Type something!");
    setBusy(true);
    const res = await emit("submit_answer", { answer: text.trim() });
    setBusy(false);
    if (res.error) setErr(res.error);
  }

  return (
    <div className="fade-in answer-screen">
      <PhoneTimer deadline={task.deadline} />
      <p className="prompt-text">{task.promptText}</p>
      <textarea
        className="answer-input"
        placeholder="Your answer…"
        maxLength={140}
        value={text}
        autoFocus
        onChange={(e) => { setText(e.target.value); setErr(""); }}
      />
      <div className="char-count">{text.length}/140</div>
      {err && <p className="error-msg">{err}</p>}
      <button className="btn btn-big btn-primary" onClick={submit} disabled={busy}>SUBMIT</button>
    </div>
  );
}

function AnswerTargeted({ task }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const current = task.items.find((i) => !i.answered);

  if (!current) return <Submitted message="All done! Watch the screen." />;

  async function submit() {
    if (!text.trim()) return setErr("Type something!");
    setBusy(true);
    const res = await emit("submit_answer", { answer: { targetId: current.targetId, text: text.trim() } });
    setBusy(false);
    if (res.error) return setErr(res.error);
    setText(""); // next target renders when state updates
  }

  return (
    <div className="fade-in answer-screen">
      <PhoneTimer deadline={task.deadline} />
      <p className="answer-progress">writing about… ({task.doneCount + 1} of {task.total})</p>
      <div className="target-head">
        <Avatar index={current.targetAvatar} size={46} />
        <span style={{ fontWeight: 800 }}>{current.targetName}</span>
      </div>
      <p className="prompt-text">{current.promptText}</p>
      <textarea className="answer-input" placeholder="Your answer…" maxLength={140}
        value={text} autoFocus onChange={(e) => { setText(e.target.value); setErr(""); }} />
      <div className="char-count">{text.length}/140</div>
      {err && <p className="error-msg">{err}</p>}
      <button className="btn btn-big btn-lime" onClick={submit} disabled={busy}>
        {task.doneCount + 1 >= task.total ? "SUBMIT (last one!)" : "SUBMIT & NEXT →"}
      </button>
    </div>
  );
}

function AnswerMulti({ task }) {
  const [vals, setVals] = useState(task.blanks.map(() => ""));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  function set(i, v) {
    setVals((cur) => cur.map((x, idx) => (idx === i ? v : x)));
    setErr("");
  }
  async function submit() {
    if (vals.some((v) => !v.trim())) return setErr("Fill in every blank!");
    setBusy(true);
    const res = await emit("submit_answer", { answer: vals.map((v) => v.trim()) });
    setBusy(false);
    if (res.error) setErr(res.error);
  }

  return (
    <div className="fade-in answer-screen">
      <PhoneTimer deadline={task.deadline} />
      <p className="prompt-text small">{task.setup}</p>
      {task.blanks.map((b, i) => (
        <div key={i} className="blank-group">
          <label>{b}</label>
          <input
            className="answer-input single"
            maxLength={120}
            value={vals[i]}
            onChange={(e) => set(i, e.target.value)}
            placeholder="…"
          />
        </div>
      ))}
      {err && <p className="error-msg">{err}</p>}
      <button className="btn btn-big btn-primary" onClick={submit} disabled={busy}>SUBMIT</button>
    </div>
  );
}

function Submitted({ message }) {
  return (
    <div className="screen-center fade-in">
      <div className="big-check pop-in">✓</div>
      <h2 className="phone-big">Locked in!</h2>
      <p className="phone-sub">{message}</p>
    </div>
  );
}

function Watch({ message }) {
  return (
    <div className="screen-center fade-in">
      <div className="eyes">👀</div>
      <p className="phone-sub">{message}</p>
    </div>
  );
}

function Pick({ task }) {
  const [step, setStep] = useState("best"); // best -> guess
  const [bestAnswerId, setBest] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submitGuess(guessId) {
    setBusy(true);
    await emit("submit_pick", { bestAnswerId, guessId });
    setBusy(false);
  }

  if (step === "best") {
    return (
      <div className="fade-in">
        <h2 className="phone-prompt">Pick your favorite answer 😈</h2>
        <div className="choice-list">
          {task.answers.map((a) => (
            <button key={a.id} className="choice" onClick={() => { setBest(a.id); setStep("guess"); }}>
              {a.promptText && <span className="choice-prompt">"{a.promptText}"</span>}
              <span>{a.text}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="fade-in">
      <h2 className="phone-prompt">Who wrote it? 🕵️</h2>
      <div className="choice-list">
        {task.players.map((p) => (
          <button key={p.id} className="choice guess" style={{ "--c": p.color }} disabled={busy} onClick={() => submitGuess(p.id)}>
            <Avatar index={p.avatar} size={34} />
            <span>{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Vote({ task }) {
  const [busy, setBusy] = useState(false);
  async function vote(id) {
    setBusy(true);
    const res = await emit("submit_vote", { answerId: id });
    setBusy(false);
    if (res.error) alert(res.error);
  }
  return (
    <div className="fade-in">
      <h2 className="phone-prompt">Vote for the funniest! 🏆</h2>
      <div className="choice-list">
        {task.options.map((o) => (
          <button key={o.id} className="choice" disabled={busy} onClick={() => vote(o.id)}>
            {!task.madlibs && <span className="choice-prompt">"{o.promptText}"</span>}
            <span>{o.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Score({ task }) {
  return (
    <div className="screen-center fade-in">
      <p className="phone-sub">Your score</p>
      <h1 className="phone-score pop-in">{task.score}</h1>
      <p className="phone-sub">Rank #{task.rank} of {task.total}</p>
      <p className="muted">Watch the screen for the next round…</p>
    </div>
  );
}

function GameOver({ task, isLeader, onLeave }) {
  return (
    <div className="screen-center fade-in">
      <h1 className="phone-big">{task.won ? "👑 YOU WON!" : `#${task.rank}`}</h1>
      <p className="phone-sub">{task.won ? "Friendship successfully ended." : `${task.score} points. Not bad.`}</p>
      {isLeader ? (
        <button className="btn btn-big btn-lime" style={{ width: "100%" }} onClick={() => emit("restart_game", {})}>
          🔄 Play again (same crew)
        </button>
      ) : (
        <p className="phone-sub">Waiting for 👑 the host to start a new game…</p>
      )}
      <button className="btn btn-text" onClick={onLeave}>Leave</button>
    </div>
  );
}

const EMOJIS = ["😂", "😱", "💀", "🔥", "👏", "🙈"];
function ReactionBar() {
  return (
    <div className="reaction-bar">
      {EMOJIS.map((e) => (
        <button key={e} className="react-btn" onClick={() => socket.emit("reaction", { emoji: e })}>{e}</button>
      ))}
    </div>
  );
}
