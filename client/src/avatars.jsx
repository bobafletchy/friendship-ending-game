import React from "react";

// 14 weird-but-cute mascots. Bold flat shapes, ink outlines, big eyes.
// Referenced by index everywhere (server stores the index).
export const AVATARS = [
  { name: "Blurp",  color: "#8CE65C" }, // 0 alien
  { name: "Gloop",  color: "#5EEAD4" }, // 1 three-eyed blob
  { name: "Spooky", color: "#EDEBE2" }, // 2 ghost
  { name: "Mort",   color: "#7FB069" }, // 3 zombie
  { name: "Ghoul",  color: "#7FE3FF" }, // 4 fanged ghoul
  { name: "Yuck",   color: "#B6E36A" }, // 5 the puking one
  { name: "Bob",    color: "#F2C49B" }, // 6 businessman w/ comb-over
  { name: "Chode",  color: "#9B6BFF" }, // 7 eggplant
  { name: "Peachy", color: "#FFB07A" }, // 8 peach
  { name: "Tako",   color: "#FFCB47" }, // 9 taco
  { name: "Bones",  color: "#EDEBE2" }, // 10 skull
  { name: "Drippy", color: "#C6FF3D" }, // 11 slime
  { name: "Gazer",  color: "#FF5C49" }, // 12 eyeball monster
  { name: "Imp",    color: "#FF6B6B" }, // 13 little devil
];
export const AVATAR_COUNT = AVATARS.length;
// Pickable presets — Ghoul (4), Drippy (11), Imp (13) removed from selection.
export const AVATAR_PICKS = [0, 1, 2, 3, 5, 6, 7, 8, 9, 10, 12];

const INK = "#0E0E12";
const S = { stroke: INK, strokeWidth: 4, strokeLinejoin: "round", strokeLinecap: "round", fill: "none" };
const S2 = { ...S, strokeWidth: 3 };

// Cute eye: white sclera + pupil that gently darts (CSS .av-pup). Never "flies".
const Eye = ({ cx, cy, r = 8, pr = 3.4, dx = 1.4, dy = 1.6 }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="#fff" stroke={INK} strokeWidth={2.6} />
    <circle className="av-pup" cx={cx + dx} cy={cy + dy} r={pr} fill={INK} />
  </g>
);

function Critter({ index, c }) {
  switch (((index % AVATAR_COUNT) + AVATAR_COUNT) % AVATAR_COUNT) {
    case 0: // Blurp — alien with antennae + black almond eyes
      return (<g>
        <line x1="38" y1="22" x2="31" y2="9" {...S} /><circle cx="31" cy="7" r="4.5" fill={c} stroke={INK} strokeWidth="4" />
        <line x1="62" y1="22" x2="69" y2="9" {...S} /><circle cx="69" cy="7" r="4.5" fill={c} stroke={INK} strokeWidth="4" />
        <path d="M50 18c-17 0-29 13-29 31 0 19 13 33 29 33s29-14 29-33c0-18-12-31-29-31Z" fill={c} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <ellipse cx="39" cy="48" rx="7" ry="11" fill={INK} /><circle className="av-pup" cx="41" cy="43" r="2.6" fill="#fff" />
        <ellipse cx="61" cy="48" rx="7" ry="11" fill={INK} /><circle className="av-pup" cx="63" cy="43" r="2.6" fill="#fff" />
        <path d="M44 67c3 3 9 3 12 0" {...S2} />
      </g>);
    case 1: // Gloop — three-eyed blob with little legs
      return (<g>
        <path d="M36 86v8M64 86v8" {...S} />
        <path d="M22 60c0-22 12-38 28-38s28 16 28 38c0 9-8 12-14 10s-8 4-14 4-8-2-14-4-14-1-14-10Z" fill={c} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <Eye cx="35" cy="46" r="7" /><Eye cx="65" cy="46" r="7" /><Eye cx="50" cy="59" r="6" pr="2.8" />
        <path d="M42 71c4 3 12 3 16 0" {...S2} />
      </g>);
    case 2: // Spooky — ghost with tongue
      return (<g>
        <path d="M50 14c-15 0-25 12-25 28v34l8-7 8 7 9-7 8 7 9-7V42c0-16-12-28-25-28Z" fill={c} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <Eye cx="40" cy="44" /><Eye cx="60" cy="44" />
        <path d="M42 58c3 5 13 5 16 0Z" fill={INK} />
        <path d="M48 62c0 4 4 4 4 0" fill="#FF5C49" stroke={INK} strokeWidth="2" />
      </g>);
    case 3: // Mort — zombie, mismatched eyes, stitched mouth
      return (<g>
        <path d="M24 32c2-11 14-18 26-18s24 7 26 18c3 12-1 24-7 33-5 8-11 15-19 15s-15-8-20-16c-5-9-8-20-6-32Z" fill={c} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M33 27l5 4 5-4" {...S2} />
        <Eye cx="38" cy="47" r="10" pr="3.4" />
        <circle className="av-pup" cx="62" cy="48" r="3.4" fill={INK} />
        <path d="M62 41l-5 2 5 2" {...S2} />
        <path d="M35 66h30M41 62v8M50 62v8M59 62v8" {...S2} />
        <path d="M30 40c-3 6-2 10 1 14" {...S2} />
      </g>);
    case 4: // Ghoul — horns + fangs, cutely menacing
      return (<g>
        <path d="M28 24 22 12l16 7M72 24 78 12 62 19" fill={c} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <circle cx="50" cy="52" r="30" fill={c} stroke={INK} strokeWidth="4" />
        <Eye cx="39" cy="50" /><Eye cx="61" cy="50" />
        <path d="M31 39l13 5M69 39l-13 5" {...S2} />
        <path d="M37 64c6 8 20 8 26 0Z" fill={INK} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <path d="M41 64l3 7 3-7M53 64l3 7 3-7" fill="#fff" />
      </g>);
    case 5: // Yuck — the puking one
      return (<g>
        <circle cx="50" cy="44" r="30" fill={c} stroke={INK} strokeWidth="4" />
        <path d="M30 36c4-2 8-2 11 1M70 36c-4-2-8-2-11 1" {...S2} />
        <Eye cx="40" cy="44" r="6.5" dy="2.4" /><Eye cx="60" cy="44" r="6.5" dy="2.4" />
        <path d="M40 58c0 9 20 9 20 0Z" fill={INK} />
        <path className="av-drip" d="M43 64c-3 9-1 18 7 26 5-7 7-15 6-24" fill="#7ED957" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <circle cx="74" cy="34" r="4" fill="#9DD9FF" stroke={INK} strokeWidth="2" />
      </g>);
    case 6: // Bob — businessman with comb-over, glasses, tie
      return (<g>
        <path d="M26 44c-4 5-3 14 2 18M74 44c4 5 3 14-2 18" fill={c} stroke={INK} strokeWidth="4" />
        <circle cx="50" cy="44" r="25" fill={c} stroke={INK} strokeWidth="4" />
        <path d="M27 33c6-11 40-11 46 0" stroke="#6b4423" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M30 31c13-7 28-5 38 2M31 36c12-6 26-4 36 3" stroke="#6b4423" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <circle cx="40" cy="44" r="7" fill="#fff" stroke={INK} strokeWidth="2.6" />
        <circle cx="60" cy="44" r="7" fill="#fff" stroke={INK} strokeWidth="2.6" />
        <line x1="47" y1="44" x2="53" y2="44" {...S2} />
        <circle className="av-pup" cx="40" cy="44" r="2.6" fill={INK} /><circle className="av-pup" cx="60" cy="44" r="2.6" fill={INK} />
        <path d="M40 56c4 4 16 4 20 0" stroke="#6b4423" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M33 66l17 11 17-11v9H33Z" fill="#fff" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <path d="M50 70l-5 6 5 16 5-16-5-6Z" fill="#FF5C49" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      </g>);
    case 7: { // Chode — goofy grinning eggplant w/ tongue + spots
      const hi = "#C2A0FF";
      return (<g>
        <line x1="52" y1="16" x2="56" y2="7" {...S} />
        <path d="M40 22c3 8 17 8 20 0 2 8-3 14-10 14s-12-6-10-14Z" fill="#57C785" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M50 20C66 20 72 34 72 50C72 72 63 90 50 90C37 90 28 72 28 50C28 34 34 20 50 20Z" fill={c} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <ellipse cx="40" cy="40" rx="4" ry="7" fill={hi} opacity=".7" />
        <circle cx="60" cy="62" r="2.6" fill={hi} opacity=".7" /><circle cx="44" cy="70" r="2.2" fill={hi} opacity=".7" />
        <Eye cx="42" cy="48" r="8.5" pr="4" /><Eye cx="60" cy="48" r="8.5" pr="4" />
        <path d="M40 60c4 10 16 10 20 0Z" fill={INK} />
        <path d="M44 66c1 6 11 6 12 0Z" fill="#FF5C49" />
      </g>);
    }
    case 8: { // Peachy — butt-peach with buck teeth (no limbs)
      return (<g>
        <path d="M53 24c5-5 14-4 17 3-5 3-12 2-17-3Z" fill="#57C785" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M50 32C45 23 30 22 26 35C21 50 30 66 50 80C70 66 79 50 74 35C70 22 55 23 50 32Z" fill={c} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M50 34C50 48 50 62 50 76" stroke="#E8895A" strokeWidth="3.4" fill="none" strokeLinecap="round" />
        <Eye cx="39" cy="46" r="6" /><Eye cx="61" cy="46" r="6" />
        <path d="M43 56c3 4 11 4 14 0Z" fill={INK} />
        <rect x="46" y="56" width="8" height="6" rx="1.5" fill="#fff" stroke={INK} strokeWidth="2" />
        <line x1="50" y1="56" x2="50" y2="62" stroke={INK} strokeWidth="1.6" />
        <circle cx="31" cy="54" r="3.2" fill="#FF6F91" opacity=".7" /><circle cx="69" cy="54" r="3.2" fill="#FF6F91" opacity=".7" />
      </g>);
    }
    case 9: // Tako — cute taco
      return (<g>
        <path d="M18 70a32 30 0 0 1 64 0Z" fill={c} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M22 68c9-9 47-9 56 0" stroke="#6BD66B" strokeWidth="8" fill="none" strokeLinecap="round" />
        <circle cx="35" cy="63" r="3.6" fill="#FF6B5C" stroke={INK} strokeWidth="2" />
        <circle cx="65" cy="63" r="3.6" fill="#FF6B5C" stroke={INK} strokeWidth="2" />
        <Eye cx="40" cy="74" r="7.5" pr="3.4" /><Eye cx="60" cy="74" r="7.5" pr="3.4" />
        <circle cx="30" cy="82" r="3.6" fill="#FF8FA3" opacity=".8" /><circle cx="70" cy="82" r="3.6" fill="#FF8FA3" opacity=".8" />
        <path d="M45 85c2.5 2.5 7.5 2.5 10 0" {...S2} />
      </g>);
    case 10: // Bones — skull
      return (<g>
        <path d="M50 16c-18 0-29 13-29 30 0 10 5 17 11 21v7c0 3 3 6 6 6h24c3 0 6-3 6-6v-7c6-4 11-11 11-21 0-17-11-30-29-30Z" fill={c} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <circle cx="38" cy="46" r="9" fill={INK} /><circle className="av-pup" cx="39" cy="46" r="3" fill="#fff" />
        <circle cx="62" cy="46" r="9" fill={INK} /><circle className="av-pup" cx="63" cy="46" r="3" fill="#fff" />
        <path d="M50 54l-4 9h8Z" fill={INK} />
        <path d="M40 76h20M46 71v9M54 71v9" {...S2} />
      </g>);
    case 11: // Drippy — slime
      return (<g>
        <path className="av-drip" d="M30 70c-2 9 0 15 3 19 3-4 4-11 3-19" fill={c} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <path d="M20 66c0-26 13-44 30-44s30 18 30 44c0 8-7 9-12 7s-7 5-13 5-8-3-13-5-12-3-12-7Z" fill={c} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <Eye cx="40" cy="48" r="8.5" /><Eye cx="62" cy="48" r="8.5" />
        <path d="M42 62c5 4 13 4 18 0" {...S2} />
        <circle cx="66" cy="34" r="4" fill="#fff" opacity=".55" />
      </g>);
    case 12: // Gazer — eyeball monster with tentacle legs
      return (<g>
        <path d="M34 70c-7 6-9 15-7 22M50 74v22M66 70c7 6 9 15 7 22" stroke={c} strokeWidth="7" fill="none" strokeLinecap="round" />
        <circle cx="50" cy="44" r="30" fill="#fff" stroke={INK} strokeWidth="4" />
        <path d="M26 36c5 3 7 7 7 9M74 36c-5 3-7 7-7 9" stroke="#FF9AA2" strokeWidth="2.4" fill="none" />
        <circle cx="50" cy="44" r="15" fill={c} stroke={INK} strokeWidth="2.6" />
        <circle className="av-pup" cx="50" cy="44" r="7.5" fill={INK} />
        <circle cx="46" cy="40" r="2.6" fill="#fff" />
      </g>);
    case 13: // Imp — little devil
      return (<g>
        <path d="M34 24 30 11l11 8M66 24 70 11 59 19" fill={c} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <circle cx="50" cy="51" r="30" fill={c} stroke={INK} strokeWidth="4" />
        <Eye cx="40" cy="47" /><Eye cx="60" cy="47" />
        <path d="M32 36l13 5M68 36l-13 5" {...S2} />
        <path d="M38 61c6 8 18 8 24 0Z" fill={INK} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <path d="M44 61l3 6 3-6M53 61l3 6 3-6" fill="#fff" />
      </g>);
    default:
      return null;
  }
}

// ================= BUILD-YOUR-OWN AVATAR =================
// A custom avatar is { custom:true, c,s,e,m,x } (indexes into the arrays below).
export const COLORS = [
  "#FF5C49", "#FF8A3D", "#FFD23F", "#8CE65C", "#3DDC97", "#5EEAD4",
  "#45C4FF", "#7FB0FF", "#9B6BFF", "#FF7AD5", "#FF9AA2", "#EDEBE2",
];
const bodyOf = (d, c) => <path d={d} fill={c} stroke={INK} strokeWidth="4" strokeLinejoin="round" />;
export const SHAPES = [
  (c) => bodyOf("M50 16c20 0 32 14 32 34S70 86 50 86 18 70 18 50 30 16 50 16Z", c),                         // round blob
  (c) => bodyOf("M30 22h40a10 10 0 0 1 10 10v36a10 10 0 0 1-10 10H30a10 10 0 0 1-10-10V32a10 10 0 0 1 10-10Z", c), // rounded square
  (c) => bodyOf("M50 13c16 0 24 17 24 37S66 88 50 88 26 70 26 50 34 13 50 13Z", c),                          // tall egg
  (c) => bodyOf("M50 14c12 0 16 8 24 12s12 14 8 24 0 18-10 22-18 4-30 2-18-2-22-12-2-16 2-26 6-12 14-16 12-2 22-2Z", c), // bumpy
  (c) => bodyOf("M50 12l10 20 22 3-16 16 4 22-20-11-20 11 4-22-16-16 22-3Z", c),                             // star
  (c) => bodyOf("M22 52c0-22 12-36 28-36s28 14 28 36c0 14-12 20-28 20S22 66 22 52Z", c),                     // wide
];
export const SHAPE_COUNT = SHAPES.length;
export const EYES = [
  () => (<g key="e0"><circle cx="40" cy="46" r="4.5" fill={INK} /><circle cx="60" cy="46" r="4.5" fill={INK} /></g>),
  () => (<g key="e1"><Eye cx="40" cy="46" r="8" /><Eye cx="60" cy="46" r="8" /></g>),
  () => (<g key="e2"><path d="M34 46c3 3 9 3 12 0M54 46c3 3 9 3 12 0" {...S2} /></g>),
  () => (<g key="e3"><circle cx="40" cy="46" r="9" fill="#fff" stroke={INK} strokeWidth="2.6" /><circle className="av-pup" cx="42" cy="48" r="4.5" fill={INK} /><circle cx="60" cy="46" r="9" fill="#fff" stroke={INK} strokeWidth="2.6" /><circle className="av-pup" cx="58" cy="49" r="4.5" fill={INK} /></g>),
  () => (<g key="e4"><path d="M32 38l13 5M68 38l-13 5" {...S2} /><Eye cx="40" cy="49" r="6" /><Eye cx="60" cy="49" r="6" /></g>),
  () => (<g key="e5"><circle cx="50" cy="46" r="12" fill="#fff" stroke={INK} strokeWidth="3" /><circle className="av-pup" cx="51" cy="47" r="5" fill={INK} /></g>),
  () => (<g key="e6"><path d="M35 41l9 9M44 41l-9 9M56 41l9 9M65 41l-9 9" {...S2} /></g>),
  () => (<g key="e7"><circle cx="40" cy="46" r="7" fill="none" {...S2} /><circle cx="40" cy="46" r="2.6" fill="none" {...S2} /><circle cx="60" cy="46" r="7" fill="none" {...S2} /><circle cx="60" cy="46" r="2.6" fill="none" {...S2} /></g>),
  () => (<g key="e8"><path d="M40 51l-6-6a3.6 3.6 0 0 1 6-3 3.6 3.6 0 0 1 6 3Z" fill="#FF5C49" stroke={INK} strokeWidth="2" /><path d="M60 51l-6-6a3.6 3.6 0 0 1 6-3 3.6 3.6 0 0 1 6 3Z" fill="#FF5C49" stroke={INK} strokeWidth="2" /></g>),
];
export const EYE_COUNT = EYES.length;
export const MOUTHS = [
  () => <path key="m0" d="M42 64c4 5 12 5 16 0" {...S2} />,
  () => (<g key="m1"><path d="M40 62h20v5a4 4 0 0 1-4 4H44a4 4 0 0 1-4-4Z" fill="#fff" stroke={INK} strokeWidth="2.6" /><line x1="50" y1="62" x2="50" y2="71" stroke={INK} strokeWidth="2" /></g>),
  () => (<g key="m2"><path d="M42 62c2 8 14 8 16 0Z" fill={INK} /><path d="M46 68c1 4 7 4 8 0Z" fill="#FF5C49" /></g>),
  () => <path key="m3" d="M42 70c4-5 12-5 16 0" {...S2} />,
  () => <path key="m4" d="M39 65c3-4 5 4 8 0s5-4 8 0 5 4 5 0" {...S2} />,
  () => (<g key="m5"><path d="M40 62c5 6 15 6 20 0Z" fill={INK} /><path d="M45 62l2 6 3-6M53 62l2 6 3-6" fill="#fff" /></g>),
  () => <path key="m6" d="M40 64l5 5 5-5 5 5 5-5" {...S2} />,
  () => <circle key="m7" cx="50" cy="66" r="5" fill={INK} />,
];
export const MOUTH_COUNT = MOUTHS.length;
export const EXTRAS = [
  () => null,
  () => (<g key="x1"><path d="M40 18l-5-10M60 18l5-10" {...S2} /><circle cx="34" cy="7" r="3.6" fill="#FF5C49" stroke={INK} strokeWidth="2" /><circle cx="66" cy="7" r="3.6" fill="#FF5C49" stroke={INK} strokeWidth="2" /></g>),
  () => <path key="x2" d="M30 22 23 8l15 9M70 22 77 8 62 17" fill="#FFD23F" stroke={INK} strokeWidth="3" strokeLinejoin="round" />,
  () => <path key="x3" d="M38 59c4 3 20 3 24 0" stroke="#6b4423" strokeWidth="5" fill="none" strokeLinecap="round" />,
  () => (<g key="x4"><circle cx="50" cy="22" r="6" fill="#fff" stroke={INK} strokeWidth="2.6" /><circle className="av-pup" cx="50" cy="23" r="2.6" fill={INK} /></g>),
  () => <ellipse key="x5" cx="50" cy="9" rx="14" ry="4" fill="none" stroke="#FFD23F" strokeWidth="3" />,
  () => (<g key="x6"><rect x="37" y="4" width="26" height="11" rx="2" fill={INK} /><rect x="31" y="15" width="38" height="4" rx="2" fill={INK} /></g>),
];
export const EXTRA_COUNT = EXTRAS.length;

function CustomCritter({ cfg }) {
  const c = COLORS[(cfg.c | 0) % COLORS.length];
  return (
    <g>
      {SHAPES[(cfg.s | 0) % SHAPE_COUNT](c)}
      {EYES[(cfg.e | 0) % EYE_COUNT]()}
      {MOUTHS[(cfg.m | 0) % MOUTH_COUNT]()}
      {EXTRAS[(cfg.x | 0) % EXTRA_COUNT]()}
    </g>
  );
}

export default function Avatar({ index = 0, size = 64, className = "", animate = true }) {
  const isCustom = index && typeof index === "object";
  const seed = isCustom ? (index.s || 0) : index;
  const delay = `${-((seed % 7) * 0.45).toFixed(2)}s`;
  const c = isCustom ? null : AVATARS[((index % AVATAR_COUNT) + AVATAR_COUNT) % AVATAR_COUNT].color;
  return (
    <span className={`avatar ${className}`} style={{ width: size, height: size, display: "inline-block" }}>
      <svg
        viewBox="0 0 100 100" width={size} height={size}
        className={animate ? "av-svg" : ""}
        style={animate ? { animationDelay: delay } : undefined}
      >
        {isCustom ? <CustomCritter cfg={index} /> : <Critter index={index} c={c} />}
      </svg>
    </span>
  );
}
