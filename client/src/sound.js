// =============================================================
//  SOUND  —  generative Web Audio SFX + background music
//  No audio files needed for SFX; everything is synthesized so
//  it matches the chaotic "Acid Pop" vibe (gooey, arcade, punchy).
//  Background music is an optional file the host drops in
//  client/public/music.mp3 (see README).
// =============================================================

let ctx = null;
let masterSfx = null;
let sfxOn = true;
let musicOn = true;
let bgm = null;

function ac() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterSfx = ctx.createGain();
    masterSfx.gain.value = 0.5;
    masterSfx.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// must be called from a user gesture (host clicking a button) to satisfy autoplay rules
export function unlockAudio() {
  ac();
  if (bgm && musicOn) bgm.play().catch(() => {});
}

export function isSfxOn() { return sfxOn; }
export function isMusicOn() { return musicOn; }
export function setSfx(on) { sfxOn = on; }
export function setMusic(on) {
  musicOn = on;
  if (!bgm) return;
  if (on) bgm.play().catch(() => {});
  else bgm.pause();
}

// ---- background music ----
export function initMusic(src = "/music.mp3", volume = 0.35) {
  if (bgm) return;
  bgm = new Audio(src);
  bgm.loop = true;
  bgm.volume = volume;
  bgm.preload = "auto";
  // if the file isn't there, fail silently
  bgm.addEventListener("error", () => { bgm = null; });
}

// ---- synth primitives ----
function tone({ freq = 440, type = "sine", dur = 0.2, gain = 0.25, slideTo = null, when = 0, attack = 0.008 }) {
  const c = ac(); const t = c.currentTime + when;
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(masterSfx);
  o.start(t); o.stop(t + dur + 0.03);
}

function noiseHit({ dur = 0.3, gain = 0.3, filter = "lowpass", freq = 900, slideTo = null, when = 0, q = 1 }) {
  const c = ac(); const t = c.currentTime + when;
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = filter; f.Q.value = q;
  f.frequency.setValueAtTime(freq, t);
  if (slideTo) f.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(masterSfx);
  src.start(t); src.stop(t + dur);
}

const guard = (fn) => (...a) => { if (!sfxOn) return; try { fn(...a); } catch {} };

// ---- the kit ----
export const sfx = {
  // gooey "bloop" as each truth bomb drops in
  reveal: guard(() => {
    tone({ freq: 180, slideTo: 520, type: "sine", dur: 0.18, gain: 0.3 });
    noiseHit({ dur: 0.12, gain: 0.12, freq: 2400, slideTo: 600, filter: "bandpass", q: 0.7, when: 0.02 });
  }),
  // squelchy slime splat for the opening goop
  slime: guard(() => {
    tone({ freq: 90, slideTo: 40, type: "sawtooth", dur: 0.7, gain: 0.32 });
    noiseHit({ dur: 0.7, gain: 0.35, freq: 1400, slideTo: 120, filter: "lowpass", q: 6 });
    tone({ freq: 240, slideTo: 70, type: "sine", dur: 0.5, gain: 0.18, when: 0.05 });
  }),
  // bright arpeggio when a guess is correct
  correct: guard(() => {
    [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, type: "triangle", dur: 0.16, gain: 0.26, when: i * 0.07 }));
  }),
  // comedic descending "wah" for a miss / dud
  dud: guard(() => {
    tone({ freq: 320, slideTo: 120, type: "sawtooth", dur: 0.45, gain: 0.22 });
  }),
  // coin-ish double blip for points
  score: guard(() => {
    tone({ freq: 880, type: "square", dur: 0.07, gain: 0.18 });
    tone({ freq: 1320, type: "square", dur: 0.12, gain: 0.18, when: 0.08 });
  }),
  // punchy stab when a round / prompts kick off
  roundStart: guard(() => {
    tone({ freq: 130, type: "sawtooth", dur: 0.35, gain: 0.28 });
    tone({ freq: 196, type: "sawtooth", dur: 0.35, gain: 0.22, when: 0.005 });
    noiseHit({ dur: 0.18, gain: 0.18, freq: 3000, slideTo: 800, filter: "highpass" });
  }),
  // soft blip entering voting
  vote: guard(() => {
    tone({ freq: 660, type: "triangle", dur: 0.12, gain: 0.2 });
    tone({ freq: 990, type: "triangle", dur: 0.14, gain: 0.16, when: 0.06 });
  }),
  // tension riser
  riser: guard(() => {
    tone({ freq: 200, slideTo: 900, type: "sawtooth", dur: 0.6, gain: 0.16 });
  }),
  // triumphant little fanfare for the winner
  win: guard(() => {
    [523, 659, 784, 1047, 1319].forEach((f, i) => tone({ freq: f, type: "triangle", dur: 0.3, gain: 0.28, when: i * 0.12 }));
    tone({ freq: 784, type: "sawtooth", dur: 0.8, gain: 0.14, when: 0.5 });
  }),
};
