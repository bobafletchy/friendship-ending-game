import React, { useEffect, useState } from "react";

// Big dramatic countdown driven by a server deadline (epoch ms).
export function useCountdown(deadline) {
  const [remaining, setRemaining] = useState(() =>
    deadline ? Math.max(0, Math.round((deadline - Date.now()) / 1000)) : 0
  );
  useEffect(() => {
    if (!deadline) return;
    const tick = () => setRemaining(Math.max(0, Math.round((deadline - Date.now()) / 1000)));
    tick();
    const i = setInterval(tick, 250);
    return () => clearInterval(i);
  }, [deadline]);
  return remaining;
}

export default function TimerRing({ deadline, total = 80 }) {
  const remaining = useCountdown(deadline);
  const frac = Math.max(0, Math.min(1, remaining / total));
  const R = 54;
  const C = 2 * Math.PI * R;
  const danger = remaining <= 10;
  return (
    <div className={`timer-ring ${danger ? "danger" : ""}`}>
      <svg viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={R} className="ring-bg" />
        <circle
          cx="60" cy="60" r={R}
          className="ring-fg"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - frac)}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <span className="timer-num">{remaining}</span>
    </div>
  );
}
