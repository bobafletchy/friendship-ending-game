import React, { useState } from "react";
import Avatar, { COLORS, SHAPE_COUNT, EYE_COUNT, MOUTH_COUNT, EXTRA_COUNT } from "../avatars.jsx";

const rnd = (n) => Math.floor(Math.random() * n);
const randomCfg = () => ({
  custom: true, c: rnd(COLORS.length), s: rnd(SHAPE_COUNT),
  e: rnd(EYE_COUNT), m: rnd(MOUTH_COUNT), x: rnd(EXTRA_COUNT),
});

// NOTE: defined at module scope (not inside the component) so the scroll
// containers keep their identity across re-renders and don't snap back.
function PartRow({ label, count, k, cfg, onPick }) {
  return (
    <div className="cb-row">
      <span className="cb-label">{label}</span>
      <div className="cb-opts">
        {Array.from({ length: count }).map((_, i) => (
          <button key={i} type="button" className={`cb-opt ${cfg[k] === i ? "on" : ""}`} onClick={() => onPick(k, i)}>
            <Avatar index={{ ...cfg, [k]: i }} size={38} animate={false} />
          </button>
        ))}
      </div>
    </div>
  );
}

// Seamless on-phone popup (no page load): tap parts, watch the live preview.
export default function CharacterBuilder({ initial, onUse, onClose }) {
  const [cfg, setCfg] = useState(() => (initial && initial.custom ? { ...initial } : randomCfg()));
  const pick = (k, v) => setCfg((p) => ({ ...p, [k]: v }));

  return (
    <div className="cb-overlay" onClick={onClose}>
      <div className="cb-card" onClick={(e) => e.stopPropagation()}>
        <div className="cb-head">
          <div className="cb-preview"><Avatar index={cfg} size={92} className="hero" /></div>
          <h3 className="cb-title">Build your guy</h3>
          <button type="button" className="cb-x" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <PartRow label="Body" count={SHAPE_COUNT} k="s" cfg={cfg} onPick={pick} />
        <div className="cb-row">
          <span className="cb-label">Color</span>
          <div className="cb-opts">
            {COLORS.map((col, i) => (
              <button key={i} type="button" className={`cb-swatch ${cfg.c === i ? "on" : ""}`}
                style={{ background: col }} onClick={() => pick("c", i)} aria-label={`color ${i}`} />
            ))}
          </div>
        </div>
        <PartRow label="Eyes" count={EYE_COUNT} k="e" cfg={cfg} onPick={pick} />
        <PartRow label="Mouth" count={MOUTH_COUNT} k="m" cfg={cfg} onPick={pick} />
        <PartRow label="Extra" count={EXTRA_COUNT} k="x" cfg={cfg} onPick={pick} />

        <div className="cb-actions">
          <button type="button" className="btn btn-ghost" onClick={() => setCfg(randomCfg())}>🎲 Random</button>
          <button type="button" className="btn btn-lime" onClick={() => onUse(cfg)}>✓ Use this guy</button>
        </div>
      </div>
    </div>
  );
}
