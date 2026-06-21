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
    case 9: // Tako — taco
      return (<g>
        <path d="M16 66a34 32 0 0 1 68 0Z" fill={c} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M20 64c10-10 50-10 60 0" stroke="#57C785" strokeWidth="6" fill="none" strokeLinecap="round" />
        <circle cx="34" cy="60" r="4.5" fill="#FF5C49" stroke={INK} strokeWidth="2" />
        <circle cx="52" cy="57" r="4.5" fill="#FF5C49" stroke={INK} strokeWidth="2" />
        <circle cx="68" cy="60" r="4.5" fill="#FF5C49" stroke={INK} strokeWidth="2" />
        <Eye cx="40" cy="73" r="5.5" pr="2.6" /><Eye cx="60" cy="73" r="5.5" pr="2.6" />
        <path d="M45 82c3 2 7 2 10 0" {...S2} />
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

export default function Avatar({ index = 0, size = 64, className = "", animate = true }) {
  const a = AVATARS[((index % AVATAR_COUNT) + AVATAR_COUNT) % AVATAR_COUNT];
  const delay = `${-((index % 7) * 0.45).toFixed(2)}s`;
  return (
    <span className={`avatar ${className}`} style={{ width: size, height: size, display: "inline-block" }}>
      <svg
        viewBox="0 0 100 100" width={size} height={size}
        className={animate ? "av-svg" : ""}
        style={animate ? { animationDelay: delay } : undefined}
      >
        <Critter index={index} c={a.color} />
      </svg>
    </span>
  );
}
