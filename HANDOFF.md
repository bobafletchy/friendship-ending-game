# 🤝 HANDOFF — The Friendship Ending Game

Read this first. It's the context dump for the next Claude Code instance working on this project.
Last updated: 2026-06-22.

---

## What this is
A Jackbox-style real-time party game (a roast game in the spirit of "Truth Bombs"). TV/laptop = host display ("main screen"); phones = controllers. No login, instant play.

- **Repo:** https://github.com/bobafletchy/friendship-ending-game (owner: `bobafletchy`, branch `main`)
- **Local path:** `C:\Users\fletc\OneDrive\friendship-ending-game`
- **Live URL:** Render (auto-deploys from `main`). App is one Node service that serves the built client AND the Socket.io server.

---

## Stack & layout
- **Server:** Node + Express + Socket.io (`server/`). In-memory state, no DB.
  - `server/index.js` — socket wiring, auto-advance loop (`autoTick`), bot driver, room reaper, serves `client/dist`.
  - `server/game.js` — authoritative `Game` class / state machine (the brain).
  - `server/prompts.js` — prompt bank (targeted/Hot-Seat, mixed [unused], madlibs/Friendship Test).
- **Client:** React + Vite (`client/`).
  - `src/App.jsx` — routes home/host/player, the ⚙️ settings menu, leader awareness, slime backdrop.
  - `src/screens/Home.jsx` — landing (Join/Host tabs, avatar picker).
  - `src/screens/HostScreen.jsx` — the TV. **All audio lives here.** Lobby, round flow, reveals, dancing winner.
  - `src/screens/PlayerScreen.jsx` — the phone controller (one task at a time).
  - `src/components/CharacterBuilder.jsx` — build-your-own avatar bottom-sheet.
  - `src/avatars.jsx` — preset mascots (`Critter`) + parametric custom avatars (`CustomCritter`, `SHAPES/EYES/MOUTHS/EXTRAS/COLORS`).
  - `src/sound.js` — Web Audio synth SFX + phase-based music tracks. **Host-only.**
  - `src/styles.css` — all styling ("Acid Pop" theme: ink + lime + coral + cream).
- Audio files: `client/public/music-menu.mp3`, `music-answer.mp3`, `music-reveal.mp3`, `sfx-slime.mp3` (committed).

---

## ⚠️ ENVIRONMENT GOTCHAS (this machine — read before running anything)
1. **Node is NOT on the Bash tool's PATH.** Use the **PowerShell tool** and prefix every command with:
   `$env:Path = "C:\Program Files\nodejs;" + $env:Path` then run `npm ...`. (Node 24 LTS is installed at `C:\Program Files\nodejs`.)
2. **PowerShell execution policy** blocks `npm.ps1` in the user's own terminal. For the user, tell them to run `npm.cmd ...` or `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`. (The Claude PowerShell tool itself runs fine.)
3. **`git push` triggers a GitHub login popup** (Git Credential Manager) the first time per session — it runs in the background and completes when the user authenticates. Commits use `Co-Authored-By: Claude Opus 4.8`.
4. **PowerShell heredoc commit messages are flaky** — use multiple `-m` flags instead of `@'...'@`.
5. **The preview screenshot tool times out on `backdrop-filter`/blur.** To screenshot, inject a temporary `<style>` disabling `backdrop-filter`/animations first (and re-enable after). Also: it captures at whatever viewport — reset with `preview_resize` if it gets stuck at 1px wide.
6. **Preview server** (`mcp__Claude_Preview__preview_start` name `feg`): `.claude/launch.json` exists at BOTH the project root and `C:\Users\fletc\OneDrive\.claude\` (the tool looks at the cwd root). It must use the **full node path** (`C:\\Program Files\\nodejs\\node.exe`) because the spawner has no PATH. After server-side changes, kill node + `preview_start` again to pick them up; client changes only need `npm run build`.

---

## Run / build / deploy
```powershell
# dev (two processes): npm run dev    (server :3001 + vite :5173)
# build the client:    npm --prefix client run build   (outputs client/dist)
# prod (one port):     npm start      (serves dist + sockets on :3001)
```
**Deploy = Render, NOT Vercel** (serverless can't hold the persistent WebSocket / in-memory rooms). `render.yaml` is committed: build `npm install && npm run build`, start `npm start`. Push to `main` → auto-deploys.

---

## Game design (current)
- **Rounds (`ROUND_PLAN` in game.js):** `["targeted","madlibs","targeted","madlibs","targeted"]` — 5 rounds, final is **chaos ×2**.
- **The Hot Seat** (targeted): everyone writes one answer about EACH other player (capped at `TARGET_CAP=5`). Reveal goes person-by-person; each answer reveals **staged**: question alone (`promptHold` 4s) → filled-in answer (`answerHold` 4.4s), one at a time, then an **"all" stage** shows the full grid and the target picks a favorite (+1 writer) & guesses the writer (+1 them). Stages: `round.answerStage` = `"prompt"|"answer"|"all"`.
- **The Friendship Test** (madlibs): wholesome blanks → twisted on reveal; `{NAME}` tokens get random real player names; group votes funniest.
- **Tie-breaker:** tied players answer about themselves, everyone votes.
- **Leader = first player to join** (`isLeader`, animated 👑). Only the leader can start/restart/leave-for-everyone; controls are on the leader's **phone** (TV is display-only). Leadership reassigns if the leader drops. Server gates via `leaderRoom()` in index.js.
- **Avatars:** presets minus Ghoul/Drippy/Imp (`AVATAR_PICKS`); unique per room (`pickAvatar`). Custom avatars are objects `{custom:true,c,s,e,m,x}` validated by `sanitizeAvatar` (`PART_COUNTS` in game.js MUST match array lengths in avatars.jsx — currently extras=20).
- **Audio is host-only.** `sound.js` plays phase music + SFX; triggered only in HostScreen. Phones are silent. `sfx.join` bloops on player join. Browser autoplay requires a gesture → unlocks on first host interaction.
- **Auto-advance:** `autoTick` (1s loop) in index.js drives all phase transitions on timers (`AUTO` object). `botStep` (1.7s loop) plays bots. No manual "next" needed; host has optional skip buttons.
- **Fail-safes:** late joiners welcome; rejoin-by-name reclaims slot+score; phases only wait on *connected* players; `pingTimeout` 60s; room reaper has a 10-min empty grace window.

---

## How to test (no full UI needed)
Engine logic is testable headlessly — write a throwaway `*.mjs` importing `./server/game.js` and `new Game()`, drive it directly (see git history for `enginecheck.mjs`, `leadertest.mjs` patterns — they were deleted after use). For full-flow/bot tests, connect `socket.io-client` from a script in `client/` (it has the dep). Always delete test scripts before committing. A full 5-round bot game currently takes ~8 min (staged reveals).

---

## Known issues / open questions (NOT yet decided by user)
1. **Game length:** Hot Seat reveals scale ~N×(N−1)×8s. Fine for 3–4 players (~8 min); long for 6+. Levers: `AUTO.promptHold`/`answerHold`, round count, or `TARGET_CAP`.
2. **Render free tier** sleeps after ~15 min idle (cold start ~30–60s) and a restart **wipes all in-memory rooms** (everyone must rejoin a new code). Would need Redis to survive restarts.
3. **TV has no Start button** (only the leader's phone). User may want to add one back.
4. **Non-leaders can't leave to main menu** (only the leader). Intentional; user may want a personal leave for everyone.
5. **Custom avatars aren't deduped** (two people can build identical; presets are unique).
6. The cheeky extras (cleavage, ball gag) are kept cartoon/PG-13. Masks (paper bag, elephant, monkey, nun) fully cover the face by design.

---

## Working style the user likes
- Just do the work, verify it (build + a quick test/screenshot), commit, push, and report — don't ask permission for each step. Leave genuine product decisions as questions at the END.
- Keep the vibe: chaotic, funny, "2027," acid-pop, slimy. Not corporate.
