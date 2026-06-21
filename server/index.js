// =============================================================
//  SERVER  -  The Friendship Ending Game
//  Express + Socket.io. Serves the built client in production.
// =============================================================
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import os from "os";
import { Game, MIN_PLAYERS } from "./game.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

function lanIP() {
  const ifaces = os.networkInterfaces();
  const addrs = [];
  for (const name of Object.keys(ifaces)) {
    for (const i of ifaces[name] || []) {
      if (i.family === "IPv4" && !i.internal) addrs.push(i.address);
    }
  }
  // Prefer typical home Wi-Fi ranges over virtual adapters (Hyper-V/WSL often 172.x).
  return addrs.find((a) => a.startsWith("192.168.")) ||
         addrs.find((a) => a.startsWith("10.")) ||
         addrs[0] || "localhost";
}
const LAN_URL = `http://${lanIP()}:${PORT}`;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

const game = new Game();

// socketId -> { code, playerId, role }
const sockets = new Map();

app.get("/health", (_req, res) => res.json({ ok: true, rooms: game.rooms.size }));

// Serve built client (client/dist) in production.
const clientDist = path.join(__dirname, "..", "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

// ---------------- broadcasting helpers -----------------------
function broadcast(room) {
  if (!room) return;
  // TV / host
  if (room.hostSocketId) {
    io.to(room.hostSocketId).emit("host:state", { ...game.hostView(room), lanUrl: LAN_URL });
  }
  // each player gets a personalized payload
  for (const player of room.players.values()) {
    if (player.socketId) {
      io.to(player.socketId).emit("player:state", game.playerView(room, player.id));
    }
  }
}

function clearTimers(room) {
  if (room.timer) {
    clearTimeout(room.timer);
    room.timer = null;
  }
}

function startAnswerTimer(room) {
  clearTimers(room);
  const seconds = game.beginAnswering(room);
  broadcast(room);
  room.timer = setTimeout(() => {
    if (room.phase === "answering") {
      game.lockSubmissions(room);
      broadcast(room);
    }
  }, seconds * 1000 + 800);
}

// ---------------- socket lifecycle ---------------------------
io.on("connection", (socket) => {
  // ---- HOST creates a room (TV screen) ----
  socket.on("create_room", (_data, cb) => {
    const room = game.createRoom();
    room.hostSocketId = socket.id;
    sockets.set(socket.id, { code: room.code, role: "host" });
    cb?.({ ok: true, code: room.code });
    broadcast(room);
  });

  // ---- HOST reconnects to existing room ----
  socket.on("host_reconnect", ({ code }, cb) => {
    const room = game.getRoom(code);
    if (!room) return cb?.({ error: "Room not found." });
    room.hostSocketId = socket.id;
    sockets.set(socket.id, { code: room.code, role: "host" });
    cb?.({ ok: true, code: room.code });
    broadcast(room);
  });

  // ---- PLAYER joins ----
  socket.on("join_room", ({ code, name, playerId, avatar }, cb) => {
    const room = game.getRoom(code);
    if (!room) return cb?.({ error: "No room with that code." });
    if (!playerId && room.phase !== "lobby") {
      return cb?.({ error: "Game already in progress." });
    }
    const player = game.addPlayer(room, name, playerId, avatar);
    player.socketId = socket.id;
    sockets.set(socket.id, { code: room.code, role: "player", playerId: player.id });
    cb?.({ ok: true, playerId: player.id, code: room.code, name: player.name, avatar: player.avatar });
    broadcast(room);
  });

  // ---- HOST adds test bots ----
  socket.on("add_bots", ({ count } = {}, cb) => {
    const ctx = sockets.get(socket.id);
    const room = ctx && game.getRoom(ctx.code);
    if (!room) return cb?.({ error: "No room." });
    const res = game.addBots(room, Math.min(6, Math.max(1, count || 3)));
    if (res.error) return cb?.(res);
    cb?.({ ok: true });
    broadcast(room);
  });

  // ---- HOST starts the game ----
  socket.on("start_game", (_d, cb) => {
    const ctx = sockets.get(socket.id);
    const room = ctx && game.getRoom(ctx.code);
    if (!room) return cb?.({ error: "No room." });
    const res = game.startGame(room);
    if (res.error) return cb?.(res);
    cb?.({ ok: true });
    broadcast(room);
  });

  // ---- HOST: generic "advance" button (drives the show) ----
  socket.on("host_advance", (_d, cb) => {
    const ctx = sockets.get(socket.id);
    const room = ctx && game.getRoom(ctx.code);
    if (!room) return cb?.({ error: "No room." });

    switch (room.phase) {
      case "round_intro":
        startAnswerTimer(room);
        break;
      case "answering":
        clearTimers(room);
        game.lockSubmissions(room);
        broadcast(room);
        break;
      case "reveal":
        game.advanceReveal(room);
        broadcast(room);
        break;
      case "vote":
        // host can force-tally if stragglers remain
        game.tallyVotes(room);
        broadcast(room);
        break;
      case "round_scores":
        clearTimers(room);
        game.nextRound(room);
        broadcast(room);
        break;
      default:
        break;
    }
    cb?.({ ok: true });
  });

  // ---- PLAYER submits an answer ----
  socket.on("submit_answer", ({ answer }, cb) => {
    const ctx = sockets.get(socket.id);
    const room = ctx && game.getRoom(ctx.code);
    if (!room || !ctx.playerId) return cb?.({ error: "No room." });
    const res = game.submitAnswer(room, ctx.playerId, answer);
    if (res.error) return cb?.(res);
    cb?.({ ok: true });
    broadcast(room);
    if (res.allIn && room.phase === "answering") {
      clearTimers(room);
      // tiny grace so the TV shows "everyone's in!" before flipping
      setTimeout(() => {
        if (room.phase === "answering") {
          game.lockSubmissions(room);
          broadcast(room);
        }
      }, 1000);
    }
  });

  // ---- PLAYER (target) submits best pick + author guess ----
  socket.on("submit_pick", ({ bestAnswerId, guessId }, cb) => {
    const ctx = sockets.get(socket.id);
    const room = ctx && game.getRoom(ctx.code);
    if (!room || !ctx.playerId) return cb?.({ error: "No room." });
    const res = game.submitPick(room, ctx.playerId, { bestAnswerId, guessId });
    if (res.error) return cb?.(res);
    cb?.({ ok: true, correctGuess: res.correctGuess });
    broadcast(room);
  });

  // ---- PLAYER votes ----
  socket.on("submit_vote", ({ answerId }, cb) => {
    const ctx = sockets.get(socket.id);
    const room = ctx && game.getRoom(ctx.code);
    if (!room || !ctx.playerId) return cb?.({ error: "No room." });
    const res = game.submitVote(room, ctx.playerId, answerId);
    if (res.error) return cb?.(res);
    cb?.({ ok: true });
    broadcast(room);
  });

  // ---- Emoji reactions (bonus): fan out to host screen ----
  socket.on("reaction", ({ emoji }) => {
    const ctx = sockets.get(socket.id);
    const room = ctx && game.getRoom(ctx.code);
    if (!room || !room.hostSocketId) return;
    io.to(room.hostSocketId).emit("reaction", { emoji });
  });

  // ---- disconnect ----
  socket.on("disconnect", () => {
    const ctx = sockets.get(socket.id);
    if (!ctx) return;
    const room = game.getRoom(ctx.code);
    sockets.delete(socket.id);
    if (!room) return;
    if (ctx.role === "host" && room.hostSocketId === socket.id) {
      room.hostSocketId = null;
    } else if (ctx.role === "player" && ctx.playerId) {
      const p = room.players.get(ctx.playerId);
      if (p) {
        p.connected = false;
        p.socketId = null;
      }
      broadcast(room);
    }
  });
});

// Bot driver: every ~1.7s, let any bots take their pending action.
setInterval(() => {
  for (const room of game.rooms.values()) {
    try {
      if (game.botStep(room)) broadcast(room);
    } catch (e) {
      console.error("botStep error:", e.message);
    }
  }
}, 1700);

// Reap empty/idle rooms every 10 minutes.
setInterval(() => {
  for (const [code, room] of game.rooms) {
    const anyConnected = room.hostSocketId || [...room.players.values()].some((p) => p.connected);
    if (!anyConnected) {
      clearTimers(room);
      game.rooms.delete(code);
    }
  }
}, 10 * 60 * 1000);

httpServer.listen(PORT, () => {
  console.log(`\n  🔥 The Friendship Ending Game`);
  console.log(`  Server running on http://localhost:${PORT}`);
  console.log(`  Min players: ${MIN_PLAYERS}\n`);
});
