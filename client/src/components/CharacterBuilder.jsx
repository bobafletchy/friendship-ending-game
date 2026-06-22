import React, { useState } from "react";
import Avatar, { COLORS, SHAPE_COUNT, EYE_COUNT, MOUTH_COUNT, EXTRA_COUNT } from "../avatars.jsx";

const rnd = (n) => Math.floor(Math.random() * n);
const randomCfg = () => ({
  custom: true, c: rnd(COLORS.length), s: rnd(SHAPE_COUNT),
  e: rnd(EYE_COUNT), m: rnd(MOUTH_COUNT), x: rnd(EXTRA_COUNT),
});

// Seamless on-phone popup (no page load): tap parts, watch the live preview.
export default function CharacterBuilder({ initial, onUse, onClose }) {
  const [cfg, setCfg] = useState(() => (initial && initial.custom ? { ...initial } : randomCfg()));
  const set = (k, v) => setCfg((p) => ({ ...p, [k]: v }));

  const Row = ({ label, count, k }) => (
    <div className="cb-row">
      <span className="cb-label">{label}</span>
      <div className="cb-opts">
        {Array.from({ length: count }).map((_, i) => (
          <button key={i} type="button" className={`cb-opt ${cfg[k] === i ? "on" : ""}`} onClick={() => set(k, i)}>
            <Avatar index={{ ...cfg, [k]: i }} size={38} animate={false} />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="cb-overlay" onClick={onClose}>
      <div className="cb-card" onClick={(e) => e.stopPropagation()}>
        <div className="cb-head">
          <div className="cb-preview"><Avatar index={cfg} size={92} className="hero" /></div>
          <h3 className="cb-title">Build your guy</h3>
          <button type="button" className="cb-x" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <Row label="Body" count={SHAPE_COUNT} k="s" />
        <div className="cb-row">
          <span className="cb-label">Color</span>
          <div className="cb-opts">
            {COLORS.map((col, i) => (
              <button key={i} type="button" className={`cb-swatch ${cfg.c === i ? "on" : ""}`}
                style={{ background: col }} onClick={() => set("c", i)} aria-label={`color ${i}`} />
            ))}
          </div>
        </div>
        <Row label="Eyes" count={EYE_COUNT} k="e" />
        <Row label="Mouth" count={MOUTH_COUNT} k="m" />
        <Row label="Extra" count={EXTRA_COUNT} k="x" />

        <div className="cb-actions">
          <button type="button" className="btn btn-ghost" onClick={() => setCfg(randomCfg())}>🎲 Random</button>
          <button type="button" className="btn btn-lime" onClick={() => onUse(cfg)}>✓ Use this guy</button>
        </div>
      </div>
    </div>
  );
}
