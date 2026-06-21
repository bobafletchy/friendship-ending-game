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
const MIN_PLAYERS = 3;

// Plan of round kinds across the game (6 rounds default).
const ROUND_PLAN = ["targeted", "mixed", "madlibs", "targeted", "mixed", "madlibs"];

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
    if (!bots.length || !room.round) return false;
    const round = room.round;
    let changed = false;

    if (room.phase === "answering") {
      for (const b of bots) {
        if (!round.submissions.has(b.id) && Math.random() < 0.6) {
          const ans = round.kind === "madlibs"
            ? round.basePrompt.blanks.map(() => rand(BOT_BLANKS))
            : rand(BOT_ANSWERS);
          this.submitAnswer(room, b.id, ans);
          changed = true;
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
      submissions: new Map(),   // playerId -> { texts:[], targetId? }
      prompts: new Map(),       // playerId -> prompt object (mixed/madlibs)
      assignment: null,         // writerId -> targetId (targeted)
      revealGroups: [],         // targeted: [{ targetId, answers:[{id,writerId,text}] }]
      revealList: [],           // vote rounds: [{id, writerId, text, promptText}]
      groupCursor: 0,
      revealCursor: 0,          // how many answers shown so far in vote rounds
      picks: new Map(),         // targetId -> { bestAnswerId, guessId, done }
      votes: new Map(),         // voterId -> answerId
      twistRevealed: false,
    };

    if (kind === "targeted") {
      round.assignment = assignTargets(playerIds);
      const prompt = this.draw(room, "targeted");
      round.basePrompt = prompt;
      for (const [writer, target] of round.assignment) {
        const tName = room.players.get(target)?.name || "someone";
        round.prompts.set(writer, {
          id: prompt.id,
          text: prompt.text.replace(/\{TARGET\}/g, tName),
          targetId: target,
        });
      }
    } else if (kind === "mixed") {
      for (const pid of playerIds) {
        round.prompts.set(pid, this.draw(room, "mixed"));
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
    room.answerDeadline = Date.now() + ANSWER_SECONDS * 1000;
    return ANSWER_SECONDS;
  }

  submitAnswer(room, playerId, payload) {
    if (room.phase !== "answering") return { error: "Not accepting answers." };
    const round = room.round;
    if (!round.prompts.has(playerId)) return { error: "No prompt for you this round." };
    let texts = [];
    if (Array.isArray(payload)) texts = payload.map((t) => String(t || "").trim().slice(0, 140));
    else texts = [String(payload || "").trim().slice(0, 140)];
    if (texts.some((t) => t.length === 0)) return { error: "Fill in every blank!" };
    const prompt = round.prompts.get(playerId);
    round.submissions.set(playerId, { texts, targetId: prompt.targetId || null });
    const allIn = [...room.players.keys()].every((pid) => round.submissions.has(pid));
    return { allIn };
  }

  allSubmitted(room) {
    return [...room.players.keys()].every((pid) => room.round.submissions.has(pid));
  }

  // -------------------- BUILD REVEAL -------------------------
  lockSubmissions(room) {
    const round = room.round;
    room.answerDeadline = null;

    if (round.kind === "targeted") {
      // group answers by target
      const groups = new Map();
      for (const [writer, sub] of round.submissions) {
        const target = sub.targetId;
        if (!groups.has(target)) groups.set(target, []);
        groups.get(target).push({
          id: newId("a"),
          writerId: writer,
          text: sub.texts[0],
        });
      }
      round.revealGroups = [...groups.entries()].map(([targetId, answers]) => ({
        targetId,
        answers: makeDeck(answers),
      }));
      round.groupCursor = 0;
      room.phase = "reveal";
    } else {
      // vote rounds: flatten into a reveal list
      const list = [];
      for (const [writer, sub] of round.submissions) {
        const prompt = round.prompts.get(writer);
        let text, promptText;
        if (round.kind === "madlibs") {
          text = round.basePrompt.twist.replace(/\{(\d+)\}/g, (_, i) => sub.texts[Number(i)] ?? "____");
          promptText = "The Friendship Test";
        } else {
          text = sub.texts[0];
          promptText = prompt.text;
        }
        list.push({ id: newId("a"), writerId: writer, text, promptText });
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
    room.phase = "gameover";
    room.round = null;
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
    if (!round) return base;

    base.roundKind = round.kind;
    base.chaos = round.chaos;

    if (room.phase === "round_intro") {
      base.intro = ROUND_INTRO[round.kind];
      if (round.kind === "madlibs") base.setup = round.basePrompt.setup;
    }

    if (room.phase === "answering") {
      base.submittedCount = round.submissions.size;
      base.submittedIds = [...round.submissions.keys()];
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
            answers: g.answers.map((a) => ({ id: a.id, text: a.text })),
            promptText: round.basePrompt.text.replace(/\{TARGET\}/g, room.players.get(g.targetId)?.name || ""),
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
      const submitted = round.submissions.has(playerId);
      const prompt = round.prompts.get(playerId);
      if (submitted) {
        view.task = { type: "submitted", message: "Locked in. Watch the screen!" };
      } else if (round.kind === "madlibs") {
        view.task = {
          type: "answer_multi",
          setup: round.basePrompt.setup,
          blanks: round.basePrompt.blanks,
          deadline: room.answerDeadline,
        };
      } else {
        view.task = {
          type: "answer",
          promptText: prompt.text,
          targetName: prompt.targetId ? room.players.get(prompt.targetId)?.name : null,
          deadline: room.answerDeadline,
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
            answers: g.answers.map((a) => ({ id: a.id, text: a.text })),
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
    title: "Targeted Chaos",
    blurb: "You've each been assigned a victim. Answer the prompt about THEM. Anonymously, of course.",
  },
  mixed: {
    title: "Mixed Prompt Chaos",
    blurb: "Everyone gets a different prompt. Be the funniest. The room votes.",
  },
  madlibs: {
    title: "The Friendship Test",
    blurb: "Say something nice about your friends. What could possibly go wrong?",
  },
};

export { ROUND_INTRO, MIN_PLAYERS, ANSWER_SECONDS };
