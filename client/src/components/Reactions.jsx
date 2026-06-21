import React, { useEffect, useRef, useState } from "react";
import { socket } from "../socket.js";

let key = 0;

// Listens for reaction events from the server and floats emojis up the TV.
export default function FloatingReactions() {
  const [items, setItems] = useState([]);
  const ref = useRef(items);
  ref.current = items;

  useEffect(() => {
    const onReaction = ({ emoji }) => {
      const id = key++;
      const left = 5 + Math.random() * 90;
      const dur = 2.2 + Math.random() * 1.3;
      setItems((cur) => [...cur, { id, emoji, left, dur }]);
      setTimeout(() => setItems((cur) => cur.filter((x) => x.id !== id)), dur * 1000);
    };
    socket.on("reaction", onReaction);
    return () => socket.off("reaction", onReaction);
  }, []);

  return (
    <div className="reactions-layer">
      {items.map((it) => (
        <span
          key={it.id}
          className="floating-emoji"
          style={{ left: `${it.left}%`, animationDuration: `${it.dur}s` }}
        >
          {it.emoji}
        </span>
      ))}
    </div>
  );
}
