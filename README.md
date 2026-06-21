# 🔥 The Friendship Ending Game

A Jackbox-style real-time party game for your phone + a shared TV/laptop screen.
Players write funny, slightly unhinged answers about each other. The room votes.
Friendships end. No login, no install, instant play.

> **Say something nice. Lose a friend.**

---

## How it plays

1. One person opens the site on a **laptop/TV** and clicks **Host on this screen**.
2. Everyone else opens the site on their **phone**, taps **Join**, enters the 4-letter **room code** + a name.
3. Host hits **Start** (needs 3+ players). The TV is the stage; phones are controllers.
4. 6 rounds rotate through three modes:
   - **Targeted Chaos** – answer a prompt about a specific friend. They pick the best answer and guess who wrote it.
   - **Mixed Prompt Chaos** – everyone gets a different prompt; the room votes funniest.
   - **The Friendship Test** – fill in a wholesome-looking mad-lib… then watch it get twisted on the big screen. Room votes funniest.
5. Final round has a **Chaos ×2** multiplier. Highest score wins. 👑

Scoring: best-answer pick = +1 to the writer · correct author guess = +1 to the guesser · vote rounds = +1 per vote received. (All doubled in the chaos round.)

---

## Tech

- **Frontend:** React + Vite (`client/`)
- **Backend:** Node + Express + Socket.io (`server/`)
- **State:** in-memory (no database)
- Two-screen design: full game state on the TV, one task at a time on phones (info asymmetry baked in).

---

## Run locally

Requires Node 18+.

```bash
# from the project root
npm run install:all      # installs root + client deps
npm run dev              # starts server (:3001) AND client (:5173)
```

Then:
- **Host screen:** open <http://localhost:5173> on the laptop/TV → *Host on this screen*
- **Players:** on each phone, open `http://<your-laptop-LAN-ip>:5173` (e.g. `http://192.168.1.20:5173`) → *Join*

> Phones must be on the same Wi-Fi as the laptop. Find your LAN IP with `ipconfig` (Windows) / `ifconfig` (mac/linux).

### Single-port mode (closest to production)

```bash
npm run install:all
npm run build           # builds the client into client/dist
npm start               # server serves the app on http://localhost:3001
```

Everyone (host + phones) uses port **3001**.

---

## Deploy for free

### ⚠️ Not Vercel — use Render

Vercel (and Netlify) run your backend as **stateless serverless functions** that spin up per request and time out. This game needs a **single, always-on Node process holding a Socket.io WebSocket and in-memory room state** — exactly what serverless can't do. So skip Vercel for this; use a host that runs a persistent web service.

**Recommended: [Render](https://render.com) free tier.** The repo includes [`render.yaml`](render.yaml), so:

1. Push this folder to a GitHub repo.
2. On Render → **New → Blueprint** → pick the repo. It reads `render.yaml` automatically:
   - Build: `npm install && npm run build`
   - Start: `npm start`
   - Plan: `free`
3. Deploy. You get a URL like `https://friendship-ending-game.onrender.com`.
4. Open it on the TV → **Host**. Everyone scans the QR or opens the same URL → **Join**.

The server serves the built client AND the WebSocket from one port (`process.env.PORT`), so it's **one free service** — no separate frontend/backend.

> **Equally good free alternatives:** [Railway](https://railway.app), [Fly.io](https://fly.io), [Koyeb](https://koyeb.com). Same idea — build `npm run build`, start `npm start`.

> **Free-tier note:** Render's free service sleeps after ~15 min idle and cold-starts in ~30–60s on the next visit. Fine for game night. State is in-memory, so a restart clears active rooms (add Redis only if you ever run multiple instances).

### Testing & joining

- **Test bots:** in the lobby, click **🤖 Add 3 test bots** — they auto-answer, vote, and pick so you can play through solo anytime.
- **QR join:** the lobby shows a QR code. On your deployed URL it just works. **Locally**, it points at your laptop's Wi-Fi IP (e.g. `192.168.x.x:3001`) so phones on the same Wi-Fi can scan it — if your machine has several network adapters and the QR IP looks wrong, just type the room code on the phone instead.

---

## 🎵 Audio: phase-based soundtrack + SFX

The host (TV) screen plays a **looping music track that changes with the game phase**, plus a slime sound effect on game start. Subtle synth accents (answer blip, vote, points) sit under the music. **Audio only plays on the host screen** — never on players' phones — so the room has one clean source.

Tracks live in **`client/public/`** with these exact names (drop in your own to replace them):

| File | Plays during |
|------|--------------|
| `music-menu.mp3`   | lobby + round intros |
| `music-answer.mp3` | writing/answering phase |
| `music-reveal.mp3` | reveals, voting, scoreboard, winner |
| `sfx-slime.mp3`    | the game-start slime drop (one-shot) |

- Any browser-playable format works (`.mp3`/`.ogg`/`.m4a`) — keep the filenames, or edit the `TRACKS` map / `playSlime()` path in `client/src/sound.js`.
- **Per-track volume:** the `vol` values in the `TRACKS` map in `client/src/sound.js` (0–1).
- Browsers block audio until a click — it kicks in on the first interaction with the host screen.
- Toggle anytime from the **⚙️ menu → 🎵 Music / 🔊 SFX**.
- **Deploying:** the files are committed in `client/public/` and the build copies them into the deploy automatically.

> ⚖️ Use music you have the rights to. This repo is public — swapping in copyrighted tracks publicly is your call.

---

## Project structure

```
friendship-ending-game/
├─ package.json            # root scripts + server deps
├─ server/
│  ├─ index.js             # express + socket.io wiring
│  ├─ game.js              # authoritative game state machine
│  └─ prompts.js           # 100+ original prompts (3 round types)
└─ client/
   ├─ index.html
   ├─ vite.config.js
   └─ src/
      ├─ App.jsx           # routes home / host / player
      ├─ socket.js
      ├─ styles.css
      ├─ components/       # Timer, floating Reactions
      └─ screens/          # Home, HostScreen (TV), PlayerScreen (phone)
```

---

## Content & tone

Prompts are original and written for general audiences — funny and chaotic, never hateful, explicit, or built on real-world harassment. The mad-lib twist humor comes from **context shift**, not cruelty. Keep it that way if you add your own. 💜
