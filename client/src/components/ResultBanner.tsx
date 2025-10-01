// ResultBanner.tsx
import React, { useEffect, useState } from "react";
import "./ResultBanner.css";
type GameStatus = "idle" | "playing" | "won" | "lost" | "tie";

export default function ResultBanner({
  status,
  autoHideMs = 2000,
}: { status: GameStatus; autoHideMs?: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status === "won" || status === "lost" || status === "tie") {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), autoHideMs);
      return () => clearTimeout(t);
    }
    setVisible(false);
  }, [status, autoHideMs]);

  if (!visible) return null;

  const label =
    status === "won" ? "You Win" : status === "lost" ? "You Lose" : "Draw";

  return <div className={`banner banner-${status}`}><span>{label}</span></div>;
}