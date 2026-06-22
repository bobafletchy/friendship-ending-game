// =============================================================
//  SOUND  —  phase-based music soundtrack + SFX
//  Music tracks (host-provided files in client/public) crossfade
//  as the game changes scenes. Plus a slime one-shot and a few
//  subtle synth accents that sit under the music.
// =============================================================

let ctx = null;
let masterSfx = null;
let sfxOn = true;
let musicOn = true;

// ---------- music: one looping track per "scene" ----------
const TRACKS = {
  menu:   { src: "/music-menu.mp3",   vol: 0.5 },
  answer: { src: "/music-answer.mp3", vol: 0.45 },
  reveal: { src: "/music-reveal.mp3", vol: 0.5 },
};
const audios = {};
let currentScene = null;
let unlocked = false;

function getTrack(key) {
  if (audios[key]) return audios[key];
  const def = TRACKS[key];
  if (!def) return null;
  const a = new Audio(def.src);
  a.loop = true;
  a.preload = "auto";
  a.volume = 0;
  a.__vol = def.vol;
  a.addEventListener("error", () => {}); // missing file = silent
  audios[key] = a;
  return a;
}

function fade(audio, to, ms = 450) {
  if (!audio) return;
  const from = audio.volume;
  const start = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - start) / ms);
    audio.volume = Math.max(0, Math.min(1, from + (to - from) * k));
    if (k < 1) requestAnimationFrame(step);
    else if (to === 0) audio.pause();
  };
  requestAnimationFrame(step);
}

// switch the looping background track to match the current scene
export function setScene(key) {
  if (!TRACKS[key] || key === currentScene) return;
  const prev = currentScene;
  currentScene = key;
  if (!musicOn || !unlocked) return; // will start on unlock
  const prevA = prev && audios[prev];
  if (prevA) fade(prevA, 0);
  const a = getTrack(key);
  if (a) { a.play().catch(() => {}); fade(a, a.__vol); }
}

// must run inside a user gesture (host clicking a button)
export function unlockAudio() {
  ac();
  unlocked = true;
  if (musicOn && currentScene) {
    const a = getTrack(currentScene);
    if (a) { a.play().catch(() => {}); fade(a, a.__vol); }
  }
}

export function initMusic() { Object.keys(TRACKS).forEach(getTrack); } // preload

// fade out + stop all music (e.g. on a player's phone during play)
export function stopMusic() {
  Object.values(audios).forEach((a) => fade(a, 0));
  currentScene = null;
}

export function isSfxOn() { return sfxOn; }
export function isMusicOn() { return musicOn; }
export function setSfx(on) { sfxOn = on; }
export function setMusic(on) {
  musicOn = on;
  if (on) { if (currentScene && unlocked) { const a = getTrack(currentScene); a.play().catch(() => {}); fade(a, a.__vol); } }
  else Object.values(audios).forEach((a) => fade(a, 0));
}

// ---------- a couple of file-based one-shots ----------
let slimeAudio = null;
export function playSlime() {
  if (!sfxOn) return;
  try {
    if (!slimeAudio) { slimeAudio = new Audio("/sfx-slime.mp3"); slimeAudio.volume = 0.8; }
    slimeAudio.currentTime = 0;
    slimeAudio.play().catch(() => {});
  } catch {}
}

// ---------- subtle synth accents (sit under the music) ----------
function ac() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterSfx = ctx.createGain();
    masterSfx.gain.value = 0.32;
    masterSfx.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}
function tone({ freq = 440, type = "sine", dur = 0.18, gain = 0.22, slideTo = null, when = 0 }) {
  const c = ac(); const t = c.currentTime + when;
  const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(masterSfx); o.start(t); o.stop(t + dur + 0.03);
}
const guard = (fn) => (...a) => { if (!sfxOn) return; try { fn(...a); } catch {} };

export const sfx = {
  join: guard(() => { tone({ freq: 420, slideTo: 720, type: "sine", dur: 0.12, gain: 0.24 }); tone({ freq: 720, slideTo: 1020, type: "sine", dur: 0.13, gain: 0.18, when: 0.09 }); }),
  reveal: guard(() => tone({ freq: 200, slideTo: 540, type: "sine", dur: 0.16, gain: 0.2 })),
  correct: guard(() => [523, 784, 1047].forEach((f, i) => tone({ freq: f, type: "triangle", dur: 0.14, gain: 0.2, when: i * 0.07 }))),
  score: guard(() => { tone({ freq: 880, type: "square", dur: 0.06, gain: 0.16 }); tone({ freq: 1320, type: "square", dur: 0.1, gain: 0.16, when: 0.07 }); }),
  vote: guard(() => tone({ freq: 660, type: "triangle", dur: 0.12, gain: 0.16 })),
};
