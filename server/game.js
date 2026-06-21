// =============================================================
//  GAME ENGINE  -  The Friendship Ending Game
//  Authoritative, in-memory state machine. No database.
//
//  PHASES:  lobby -> round_intro -> answering -> reveal
//           -> [vote] -> round_scores -> (loop) -> gameover
// =============================================================
import {
  TARGETED_PROMPTS,
  MIXED_PROMPTS,
  MADLIBS_PROMPTS,
  makeDeck,
} from "./prompts.js";

const PLAYER_COLORS = [
  "#ff4d6d", "#ffb703", "#06d6a0", "#4cc9f0", "#b5179e",
  "#f72585", "#ff7b00", "#80ed99", "#7209b7", "#3a86ff",
  "#e63946", "#2a9d8f", "#e76f51", "#9b5de5", "#00bbf9",
  "#fb5607",
];

const ANSWER_SECONDS = 80;
const TARGETED_SECONDS = 120; // more time — you write about everyone
const MIN_PLAYERS = 3;
const TARGET_CAP = 5; // max people you write about per round (keeps big groups sane)

// Truth Bombs core (write about everyone) + the signature Friendship Test twist.
// Final round is chaos x2.
const ROUND_PLAN = ["targeted", "madlibs", "targeted"];

// Used only for the end-game tie-breaker: answer about YOURSELF, group votes.
const SELF_PROMPTS = [
  "Confess: the most unhinged thing about YOU is…",
  "The real reason YOU would get cancelled is…",
  "Your villain origin story begins the day you…",
  "The most embarrassing thing in YOUR search history is…",
  "If YOU had a warning label it would read…",
  "Your toxic trait that you secretly love is…",
];

const BOT_NAMES = ["RoboRick", "Glitch", "Nullbot", "CtrlAltDefeat", "Sir Spam", "404Steve", "BeepBoop"];
const BOT_ANSWERS = [
  "a suspicious amount of cheese", "crying in the cereal aisle", "yelling at a Roomba",
  "tax fraud, allegedly", "befriending a pigeon named Gerald", "a deeply cursed playlist",
  "interpretive dance at the DMV", "an unpaid parking ticket from 2009", "haunting a Wendy's",
  "explaining crypto to a houseplant", "a forbidden smoothie", "selling feet pics of their cat",
  "becoming the villain in a group project", "16 unread voicemails from their mom",
  "a tragic encounter with a revolving door", "moisturizing aggressively",
  "starting a podcast nobody asked for", "fighting a goose and losing",
];
const BOT_BLANKS = [
  "eating raw onions", "whispering to the toaster", "doing crimes", "crying softly",
  "petting strangers' dogs", "haunting the produce section", "screaming into a pillow",
  "billing it as a business expense", "blaming Mercury retrograde", "googling their symptoms",
];
const rand = (a) => a[Math.floor(Math.random() * a.length)];

let idCounter = 1;
const newId = (p = "id") => `${p}_${idCounter++}_${Math.random().toString(36).slice(2, 7)}`;

function genCode(existing) {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I/O to avoid confusion
  let code;
  do {
    code = Array.from({ length: 4 }, () => letters[Math.floor(Math.random() * letters.length)]).join("");
  } while (existing.has(code));
  return code;
}

// Balanced many-to-one target assignment so most targets receive
// 2+ answers (and nobody writes about themselves).
function assignTargets(playerIds) {
  const writers = makeDeck(playerIds);
  const n = playerIds.length;
  const numTargets = Math.max(1, Math.floor(n / 2));
  const targets = makeDeck(playerIds).slice(0, numTargets);
  const assignment = new Map();
  let ti = 0;
  for (const w of writers) {
    let attempts = 0;
    let t = targets[ti % targets.length];
    // avoid self-target if possible
    while (t === w && attempts < targets.length) {
      ti++;
      t = targets[ti % targets.length];
      attempts++;
    }
    if (t === w) {
      // fall back to any other player
      t = playerIds.find((p) => p !== w) || w;
    }
    assignment.set(w, t);
    ti++;
  }
  return assignment;
}

export class Game {
  constructor() {
    this.rooms = new Map();
  }

  getRoom(code) {
    return this.rooms.get((code || "").toUpperCase());
  }

  createRoom() {
    const code = genCode(this.rooms);
    const room = {
      code,
      hostSocketId: null,
      players: new Map(), // id -> player
      phase: "lobby",
      roundIndex: -1,
      totalRounds: ROUND_PLAN.length,
      round: null,
      decks: {
        targeted: makeDeck(TARGETED_PROMPTS),
        mixed: makeDeck(MIXED_PROMPTS),
        madlibs: makeDeck(MADLIBS_PROMPTS),
      },
      timer: null,
      answerDeadline: null,
      lastMessage: "",
    };
    this.rooms.set(code, room);
    return room;
  }

  addPlayer(room, name, existingId, avatar) {
    // reconnect path
    if (existingId && room.players.has(existingId)) {
      const p = room.players.get(existingId);
      p.connected = true;
      if (name) p.name = name.slice(0, 20);
      if (Number.isInteger(avatar)) p.avatar = avatar;
      return p;
    }
    const cleanName = (name || "Player").trim().slice(0, 20) || "Player";
    const color = PLAYER_COLORS[room.players.size % PLAYER_COLORS.length];
    const player = {
      id: newId("p"),
      name: cleanName,
      score: 0,
      connected: true,
      color,
      avatar: Number.isInteger(avatar) ? avatar : room.players.size % 14,
      socketId: null,
    };
    room.players.set(player.id, player);
    return player;
  }

  addBots(room, n = 3) {
    if (room.phase !== "lobby") return { error: "Can only add bots in the lobby." };
    const avatars = makeDeck([...Array(14).keys()]);
    for (let i = 0; i < n; i++) {
      const id = newId("bot");
      const idx = (room._botCount || 0);
      room.players.set(id, {
        id,
        name: BOT_NAMES[idx % BOT_NAMES.length],
        score: 0,
        connected: true,
        color: PLAYER_COLORS[room.players.size % PLAYER_COLORS.length],
        avatar: avatars[idx % avatars.length],
        socketId: null,
        isBot: true,
      });
      room._botCount = idx + 1;
    }
    return {};
  }

  // Advance any bots that owe an action for the current phase. Returns true if state changed.
  botStep(room) {
    const bots = [...room.players.values()].filter((p) => p.isBot);
    if (!bots.length) return false;
    const round = room.round;
    let changed = false;

    // ---- tie-breaker ----
    if (room.phase === "tiebreak_answer") {
      const tb = room.tiebreak;
      for (const b of bots) {
        if (tb.players.includes(b.id) && !tb.answers.has(b.id)) {
          this.submitTiebreakAnswer(room, b.id, rand(BOT_ANSWERS));
          changed = true;
        }
      }
      return changed;
    }
    if (room.phase === "tiebreak_vote") {
      const tb = room.tiebreak;
      for (const b of bots) {
        if (!tb.votes.has(b.id) && Math.random() < 0.6) {
          const opts = tb.list.filter((a) => a.writerId !== b.id);
          if (opts.length) { this.submitTiebreakVote(room, b.id, rand(opts).id); changed = true; }
        }
      }
      return changed;
    }

    if (!round) return changed;

    if (room.phase === "answering") {
      for (const b of bots) {
        if (this.writerDone(round, b.id)) continue;
        if (round.kind === "madlibs") {
          if (Math.random() < 0.6) {
            this.submitAnswer(room, b.id, round.basePrompt.blanks.map(() => rand(BOT_BLANKS)));
            changed = true;
          }
        } else {
          // answer the next un-done target in the queue (one per tick = staggered)
          const queue = round.queues.get(b.id) || [];
          const done = round.subs.get(b.id);
          const next = queue.find((q) => !done.has(q.targetId));
          if (next && Math.random() < 0.75) {
            this.submitAnswer(room, b.id, { targetId: next.targetId, text: rand(BOT_ANSWERS) });
            changed = true;
          }
        }
      }
      if (this.allSubmitted(room)) { this.lockSubmissions(room); changed = true; }
    } else if (room.phase === "reveal" && round.kind === "targeted") {
      const g = this.currentGroup(room);
      const target = g && room.players.get(g.targetId);
      if (target && target.isBot && !round.picks.has(g.targetId)) {
        const best = rand(g.answers).id;
        const others = [...room.players.values()].filter((p) => p.id !== g.targetId);
        this.submitPick(room, g.targetId, { bestAnswerId: best, guessId: rand(others)?.id });
        changed = true;
      }
    } else if (room.phase === "vote") {
      for (const b of bots) {
        if (!round.votes.has(b.id) && Math.random() < 0.6) {
          const opts = round.revealList.filter((a) => a.writerId !== b.id);
          if (opts.length) { this.submitVote(room, b.id, rand(opts).id); changed = true; }
        }
      }
    }
    return changed;
  }

  draw(room, kind) {
    if (room.decks[kind].length === 0) {
      const src = kind === "targeted" ? TARGETED_PROMPTS : kind === "mixed" ? MIXED_PROMPTS : MADLIBS_PROMPTS;
      room.decks[kind] = makeDeck(src);
    }
    return room.decks[kind].pop();
  }

  activePlayerIds(room) {
    return [...room.players.values()].map((p) => p.id);
  }

  // -------------------- ROUND SETUP --------------------------
  startGame(room) {
    if (room.players.size < MIN_PLAYERS) return { error: `Need at least ${MIN_PLAYERS} players.` };
    for (const p of room.players.values()) p.score = 0;
    room.roundIndex = -1;
    this.nextRound(room);
    return {};
  }

  nextRound(room) {
    room.roundIndex++;
    if (room.roundIndex >= room.totalRounds) {
      this.endGame(room);
      return;
    }
    const kind = ROUND_PLAN[room.roundIndex];
    const playerIds = this.activePlayerIds(room);
    const chaos = room.roundIndex === room.totalRounds - 1 ? 2 : 1; // final round = chaos x2

    const round = {
      kind,
      chaos,
      submissions: new Map(),   // madlibs: playerId -> { texts:[] }
      prompts: new Map(),       // madlibs: playerId -> prompt object
      queues: new Map(),        // targeted: writerId -> [{ targetId, promptId, text }]
      subs: new Map(),          // targeted: writerId -> Map(targetId -> text)
      revealGroups: [],         // targeted: [{ targetId, answers:[{id,writerId,text,promptText}] }]
      revealList: [],           // madlibs: [{id, writerId, text, promptText}]
      groupCursor: 0,
      revealCursor: 0,
      picks: new Map(),         // targetId -> { bestAnswerId, guessId }
      votes: new Map(),         // voterId -> answerId
    };

    if (kind === "targeted") {
      // Truth Bombs: every player writes one answer about each other player
      // (capped for big groups), each with its own prompt.
      for (const writer of playerIds) {
        let targets = makeDeck(playerIds.filter((p) => p !== writer));
        if (targets.length > TARGET_CAP) targets = targets.slice(0, TARGET_CAP);
        const items = targets.map((t) => {
          const prompt = this.draw(room, "targeted");
          return {
            targetId: t,
            promptId: prompt.id,
            text: prompt.text.replace(/\{TARGET\}/g, room.players.get(t)?.name || "them"),
          };
        });
        round.queues.set(writer, items);
        round.subs.set(writer, new Map());
      }
    } else if (kind === "madlibs") {
      const prompt = this.draw(room, "madlibs");
      round.basePrompt = prompt;
      for (const pid of playerIds) round.prompts.set(pid, prompt);
    }

    room.round = round;
    room.phase = "round_intro";
  }

  beginAnswering(room) {
    room.phase = "answering";
    const secs = room.round.kind === "targeted" ? TARGETED_SECONDS : ANSWER_SECONDS;
    room.answerDeadline = Date.now() + secs * 1000;
    return secs;
  }

  submitAnswer(room, playerId, payload) {
    if (room.phase !== "answering") return { error: "Not accepting answers." };
    const round = room.round;

    if (round.kind === "targeted") {
      const queue = round.queues.get(playerId);
      if (!queue) return { error: "You're not in this round." };
      const targetId = payload && payload.targetId;
      const text = String((payload && payload.text) || "").trim().slice(0, 140);
      if (!queue.some((q) => q.targetId === targetId)) return { error: "Invalid target." };
      if (!text) return { error: "Type something!" };
      round.subs.get(playerId).set(targetId, text);
      return { allIn: this.allSubmitted(room), myDone: this.writerDone(round, playerId) };
    }

    // madlibs (array of blank answers)
    const texts = Array.isArray(payload)
      ? payload.map((t) => String(t || "").trim().slice(0, 140))
      : [String(payload || "").trim().slice(0, 140)];
    if (texts.some((t) => t.length === 0)) return { error: "Fill in every blank!" };
    round.submissions.set(playerId, { texts });
    return { allIn: this.allSubmitted(room) };
  }

  writerDone(round, id) {
    if (round.kind === "targeted") {
      const q = round.queues.get(id);
      return q ? (round.subs.get(id)?.size || 0) >= q.length : true;
    }
    return round.submissions.has(id);
  }

  allSubmitted(room) {
    return [...room.players.keys()].every((id) => this.writerDone(room.round, id));
  }

  // -------------------- BUILD REVEAL -------------------------
  lockSubmissions(room) {
    const round = room.round;
    room.answerDeadline = null;

    if (round.kind === "targeted") {
      // group answers by Target — every player gets their own reveal stack
      const groups = new Map();
      for (const id of room.players.keys()) groups.set(id, []);
      for (const [writer, m] of round.subs) {
        const q = round.queues.get(writer) || [];
        for (const [targetId, text] of m) {
          const item = q.find((x) => x.targetId === targetId);
          if (!groups.has(targetId)) groups.set(targetId, []);
          groups.get(targetId).push({ id: newId("a"), writerId: writer, text, promptText: item?.text || "" });
        }
      }
      round.revealGroups = [...groups.entries()]
        .filter(([, answers]) => answers.length > 0)
        .map(([targetId, answers]) => ({ targetId, answers: makeDeck(answers) }));
      round.groupCursor = 0;
      room.phase = "reveal";
    } else {
      // madlibs: flatten twisted sentences into a reveal list for group voting
      const list = [];
      for (const [writer, sub] of round.submissions) {
        const text = round.basePrompt.twist.replace(/\{(\d+)\}/g, (_, i) => sub.texts[Number(i)] ?? "____");
        list.push({ id: newId("a"), writerId: writer, text, promptText: "The Friendship Test" });
      }
      round.revealList = makeDeck(list);
      round.revealCursor = 0;
      room.phase = "reveal";
    }
  }

  // host nudges the reveal forward (vote rounds reveal answers one-by-one)
  advanceReveal(room) {
    const round = room.round;
    if (round.kind === "targeted") {
      // skip current target (e.g. disconnected) -> next group
      this.finishGroup(room);
      return;
    }
    if (round.revealCursor < round.revealList.length) {
      round.revealCursor++;
    }
    if (round.revealCursor >= round.revealList.length) {
      room.phase = "vote";
    }
  }

  // -------------------- TARGETED PICKS -----------------------
  currentGroup(room) {
    const round = room.round;
    return round.revealGroups[round.groupCursor] || null;
  }

  submitPick(room, targetId, { bestAnswerId, guessId }) {
    const round = room.round;
    const group = this.currentGroup(room);
    if (!group || group.targetId !== targetId) return { error: "Not your turn." };
    const best = group.answers.find((a) => a.id === bestAnswerId);
    if (!best) return { error: "Pick a valid answer." };

    // scoring
    const mult = round.chaos;
    const writer = room.players.get(best.writerId);
    if (writer) writer.score += 1 * mult; // best-answer point
    let correctGuess = false;
    if (guessId && guessId === best.writerId) {
      const guesser = room.players.get(targetId);
      if (guesser) guesser.score += 1 * mult;
      correctGuess = true;
    }
    round.picks.set(targetId, { bestAnswerId, guessId, correctGuess, writerId: best.writerId });
    this.finishGroup(room);
    return { correctGuess };
  }

  finishGroup(room) {
    const round = room.round;
    round.groupCursor++;
    if (round.groupCursor >= round.revealGroups.length) {
      room.phase = "round_scores";
    }
  }

  // -------------------- VOTING -------------------------------
  submitVote(room, voterId, answerId) {
    if (room.phase !== "vote") return { error: "Not voting right now." };
    const round = room.round;
    const ans = round.revealList.find((a) => a.id === answerId);
    if (!ans) return { error: "Invalid choice." };
    if (ans.writerId === voterId) return { error: "You can't vote for your own answer!" };
    round.votes.set(voterId, answerId);
    const allVoted = [...room.players.keys()].every((pid) => round.votes.has(pid));
    if (allVoted) this.tallyVotes(room);
    return { allVoted };
  }

  tallyVotes(room) {
    const round = room.round;
    const tally = new Map();
    for (const aid of round.votes.values()) tally.set(aid, (tally.get(aid) || 0) + 1);
    for (const ans of round.revealList) {
      const votes = tally.get(ans.id) || 0;
      ans.votes = votes;
      const writer = room.players.get(ans.writerId);
      if (writer) writer.score += votes * round.chaos;
    }
    round.voteResults = [...round.revealList].sort((a, b) => (b.votes || 0) - (a.votes || 0));
    room.phase = "round_scores";
  }

  endGame(room) {
    const board = this.scoreboard(room);
    const top = board[0]?.score ?? 0;
    const tied = board.filter((p) => p.score === top).map((p) => p.id);
    room.round = null;
    if (tied.length >= 2) {
      room.tiebreak = {
        players: tied,
        promptText: rand(SELF_PROMPTS),
        answers: new Map(), // playerId -> text
        list: [],           // [{id, writerId, text}]
        votes: new Map(),   // voterId -> answerId
      };
      room.phase = "tiebreak_answer";
      room.answerDeadline = Date.now() + 45 * 1000;
      return;
    }
    room.phase = "gameover";
  }

  // -------------------- TIE-BREAKER --------------------------
  submitTiebreakAnswer(room, playerId, text) {
    if (room.phase !== "tiebreak_answer") return { error: "Not the tie-breaker." };
    const tb = room.tiebreak;
    if (!tb.players.includes(playerId)) return { error: "You're not in the tie-breaker." };
    const t = String(text || "").trim().slice(0, 140);
    if (!t) return { error: "Type something!" };
    tb.answers.set(playerId, t);
    if (tb.players.every((id) => tb.answers.has(id))) this.startTiebreakVote(room);
    return { ok: true };
  }

  startTiebreakVote(room) {
    const tb = room.tiebreak;
    room.answerDeadline = null;
    tb.list = makeDeck([...tb.answers.entries()].map(([writerId, text]) => ({ id: newId("a"), writerId, text })));
    if (tb.list.length < 2) return this.resolveTiebreak(room); // nothing to vote on
    room.phase = "tiebreak_vote";
  }

  submitTiebreakVote(room, voterId, answerId) {
    if (room.phase !== "tiebreak_vote") return { error: "Not voting." };
    const tb = room.tiebreak;
    const ans = tb.list.find((a) => a.id === answerId);
    if (!ans) return { error: "Invalid choice." };
    if (ans.writerId === voterId) return { error: "Can't vote for yourself!" };
    tb.votes.set(voterId, answerId);
    if ([...room.players.keys()].every((id) => tb.votes.has(id))) this.resolveTiebreak(room);
    return { ok: true };
  }

  resolveTiebreak(room) {
    const tb = room.tiebreak;
    const tally = new Map();
    for (const aid of tb.votes.values()) tally.set(aid, (tally.get(aid) || 0) + 1);
    let winnerAnswer = tb.list[0];
    let bestVotes = -1;
    for (const a of tb.list) {
      const v = tally.get(a.id) || 0;
      if (v > bestVotes) { bestVotes = v; winnerAnswer = a; }
    }
    if (winnerAnswer) {
      const winner = room.players.get(winnerAnswer.writerId);
      if (winner) winner.score += 1; // break the tie, sole leader
      room.tieWinnerId = winnerAnswer.writerId;
    }
    room.phase = "gameover";
  }

  // -------------------- VIEWS (broadcast payloads) -----------
  scoreboard(room) {
    return [...room.players.values()]
      .map((p) => ({ id: p.id, name: p.name, score: p.score, color: p.color, avatar: p.avatar, connected: p.connected, isBot: p.isBot }))
      .sort((a, b) => b.score - a.score);
  }

  // Full state for the TV / host screen.
  hostView(room) {
    const base = {
      code: room.code,
      phase: room.phase,
      roundIndex: room.roundIndex,
      totalRounds: room.totalRounds,
      players: this.scoreboard(room),
      minPlayers: MIN_PLAYERS,
      answerDeadline: room.answerDeadline,
    };
    const round = room.round;
    if (room.tiebreak && room.phase.startsWith("tiebreak")) {
      base.tiebreak = this.tiebreakHostView(room);
    }
    if (!round) return base;

    base.roundKind = round.kind;
    base.chaos = round.chaos;

    if (room.phase === "round_intro") {
      base.intro = ROUND_INTRO[round.kind];
      if (round.kind === "madlibs") base.setup = round.basePrompt.setup;
    }

    if (room.phase === "answering") {
      base.submittedCount = [...room.players.keys()].filter((id) => this.writerDone(round, id)).length;
      base.submittedIds = [...room.players.keys()].filter((id) => this.writerDone(round, id));
      base.answerTotal = round.kind === "targeted" ? TARGETED_SECONDS : ANSWER_SECONDS;
      if (round.kind === "madlibs") base.setup = round.basePrompt.setup;
    }

    if (room.phase === "reveal") {
      if (round.kind === "targeted") {
        const g = this.currentGroup(room);
        if (g) {
          base.reveal = {
            kind: "targeted",
            targetName: room.players.get(g.targetId)?.name,
            targetColor: room.players.get(g.targetId)?.color,
            targetAvatar: room.players.get(g.targetId)?.avatar,
            answers: g.answers.map((a) => ({ id: a.id, text: a.text, promptText: a.promptText })),
            index: round.groupCursor + 1,
            total: round.revealGroups.length,
          };
        }
      } else {
        base.reveal = {
          kind: "list",
          shown: round.revealList.slice(0, round.revealCursor).map((a) => ({
            id: a.id, text: a.text, promptText: a.promptText,
          })),
          revealCursor: round.revealCursor,
          total: round.revealList.length,
          madlibs: round.kind === "madlibs",
        };
      }
    }

    if (room.phase === "vote") {
      base.vote = {
        total: round.revealList.length,
        voted: round.votes.size,
        options: round.revealList.map((a) => ({ id: a.id, text: a.text, promptText: a.promptText })),
        madlibs: round.kind === "madlibs",
      };
    }

    if (room.phase === "round_scores") {
      base.roundResults = this.buildRoundResults(room);
      base.isFinalRound = room.roundIndex >= room.totalRounds - 1;
    }

    return base;
  }

  // tie-break payload shared by host view (room.round is null here)
  tiebreakHostView(room) {
    const tb = room.tiebreak;
    const names = tb.players.map((id) => room.players.get(id)?.name).filter(Boolean);
    if (room.phase === "tiebreak_answer") {
      return { phase: "answer", promptText: tb.promptText, names, answered: tb.answers.size, deadline: room.answerDeadline };
    }
    if (room.phase === "tiebreak_vote") {
      return { phase: "vote", promptText: tb.promptText, names, voted: tb.votes.size,
        options: tb.list.map((a) => ({ id: a.id, text: a.text })) };
    }
    return { phase: room.phase, names };
  }

  buildRoundResults(room) {
    const round = room.round;
    if (round.kind === "targeted") {
      const items = [];
      for (const g of round.revealGroups) {
        const pick = round.picks.get(g.targetId);
        if (!pick) continue;
        const best = g.answers.find((a) => a.id === pick.bestAnswerId);
        items.push({
          targetName: room.players.get(g.targetId)?.name,
          bestText: best?.text,
          writerName: room.players.get(pick.writerId)?.name,
          correctGuess: pick.correctGuess,
        });
      }
      return { kind: "targeted", items };
    }
    // vote rounds
    const top = (round.voteResults || [])[0];
    return {
      kind: "vote",
      winner: top ? {
        text: top.text,
        promptText: top.promptText,
        writerName: room.players.get(top.writerId)?.name,
        votes: top.votes || 0,
      } : null,
    };
  }

  // Personalized payload for a single player's phone.
  playerView(room, playerId) {
    const me = room.players.get(playerId);
    const view = {
      you: me ? { id: me.id, name: me.name, score: me.score, color: me.color, avatar: me.avatar } : null,
      phase: room.phase,
      roundIndex: room.roundIndex,
      totalRounds: room.totalRounds,
      roundKind: room.round?.kind,
      chaos: room.round?.chaos || 1,
      task: { type: "wait", message: "Hang tight…" },
    };
    if (!me) return view;
    const round = room.round;

    if (room.phase === "lobby") {
      view.task = { type: "lobby", message: "You're in! Watch the big screen." };
      return view;
    }
    if (room.phase === "round_intro") {
      view.task = { type: "wait", message: "Get ready…", title: ROUND_INTRO[round.kind].title };
      return view;
    }
    if (room.phase === "answering") {
      if (this.writerDone(round, playerId)) {
        view.task = { type: "submitted", message: "Locked in. Watch the screen!" };
      } else if (round.kind === "madlibs") {
        view.task = {
          type: "answer_multi",
          setup: round.basePrompt.setup,
          blanks: round.basePrompt.blanks,
          deadline: room.answerDeadline,
        };
      } else {
        // targeted: hand the phone its whole queue (which targets remain)
        const queue = round.queues.get(playerId) || [];
        const done = round.subs.get(playerId) || new Map();
        view.task = {
          type: "answer_targeted",
          deadline: room.answerDeadline,
          total: queue.length,
          doneCount: done.size,
          items: queue.map((q) => ({
            targetId: q.targetId,
            targetName: room.players.get(q.targetId)?.name,
            targetAvatar: room.players.get(q.targetId)?.avatar,
            promptText: q.text,
            answered: done.has(q.targetId),
          })),
        };
      }
      return view;
    }
    if (room.phase === "reveal") {
      if (round.kind === "targeted") {
        const g = this.currentGroup(room);
        if (g && g.targetId === playerId && !round.picks.has(playerId)) {
          view.task = {
            type: "pick",
            answers: g.answers.map((a) => ({ id: a.id, text: a.text, promptText: a.promptText })),
            players: [...room.players.values()]
              .filter((p) => p.id !== playerId)
              .map((p) => ({ id: p.id, name: p.name, color: p.color, avatar: p.avatar })),
          };
        } else {
          const tName = g ? room.players.get(g.targetId)?.name : "";
          view.task = { type: "watch", message: g ? `${tName} is picking…` : "Watch the screen!" };
        }
      } else {
        view.task = { type: "watch", message: "Reading answers… watch the screen!" };
      }
      return view;
    }
    if (room.phase === "vote") {
      if (round.votes.has(playerId)) {
        view.task = { type: "submitted", message: "Vote cast! Watch the screen." };
      } else {
        view.task = {
          type: "vote",
          options: round.revealList
            .filter((a) => a.writerId !== playerId)
            .map((a) => ({ id: a.id, text: a.text, promptText: a.promptText })),
          madlibs: round.kind === "madlibs",
        };
      }
      return view;
    }
    if (room.phase === "round_scores") {
      const board = this.scoreboard(room);
      const rank = board.findIndex((p) => p.id === playerId) + 1;
      view.task = { type: "score", score: me.score, rank, total: board.length };
      return view;
    }
    if (room.phase === "tiebreak_answer") {
      const tb = room.tiebreak;
      if (tb.players.includes(playerId) && !tb.answers.has(playerId)) {
        view.task = { type: "answer", promptText: tb.promptText, deadline: room.answerDeadline, tiebreak: true };
      } else {
        view.task = { type: "watch", message: "Tie-breaker! Watch the screen 👀" };
      }
      return view;
    }
    if (room.phase === "tiebreak_vote") {
      const tb = room.tiebreak;
      if (tb.votes.has(playerId)) {
        view.task = { type: "submitted", message: "Vote cast! Watch the screen." };
      } else {
        view.task = {
          type: "vote",
          options: tb.list.filter((a) => a.writerId !== playerId).map((a) => ({ id: a.id, text: a.text })),
        };
      }
      return view;
    }
    if (room.phase === "gameover") {
      const board = this.scoreboard(room);
      const rank = board.findIndex((p) => p.id === playerId) + 1;
      view.task = { type: "gameover", score: me.score, rank, won: rank === 1 };
      return view;
    }
    return view;
  }
}

const ROUND_INTRO = {
  targeted: {
    title: "Truth Bombs",
    blurb: "Write an answer about EACH of your friends. Anonymously. Then they pick a favorite and guess who wrote it.",
  },
  madlibs: {
    title: "The Friendship Test",
    blurb: "Say something nice about your friends. What could possibly go wrong?",
  },
};

export { ROUND_INTRO, MIN_PLAYERS, ANSWER_SECONDS };
