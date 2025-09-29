import { useState } from "react";

type ApiGame = {
  id: string;
  dealer: { visible: string[]; count: number };
  player: { cards: string[]; count: number };
  status: "playing" | "won" | "lost" | "tie";
  reveal: boolean;
};

function Card({ code, alt, size=96 }: { code: string; alt?: string; size?: number }) {
  return (
    <img
      src={`/cards/${code}.png`}
      alt={alt ?? `${code} card`}
      width={size}
      height={Math.round(size * 1.4)}
      style={{ borderRadius: 6, boxShadow: "0 6px 14px rgba(0,0,0,.28)" }}
      draggable={false}
      onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/cards/BACK.png"; }}
    />
  );
}

function Row({ title, cards, count, hidden }:{
  title: string; cards?: string[]; count?: number; hidden?: boolean;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <strong>{title}</strong> <span>({count ?? "—"})</span>
      <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {cards?.length ? cards.map((c, i) => <Card key={i} code={c} />) : <em>—</em>}
        {hidden ? <img src="/cards/BACK.png" alt="Hidden" width={96} /> : null}
      </div>
    </div>
  );
}

export default function App() {
  const [g, setG] = useState<ApiGame | null>(null);
  const playing = g?.status === "playing";

  const start = async () => {
    const r = await fetch("/api/games/start", { method: "POST" });
    setG(await r.json());
  };
  const hit = async () => {
    if (!g) return;
    const r = await fetch(`/api/games/${g.id}/hit`, { method: "POST" });
    setG(await r.json());
  };
  const stay = async () => {
    if (!g) return;
    const r = await fetch(`/api/games/${g.id}/stay`, { method: "POST" });
    setG(await r.json());
  };

  return (
    <div style={{ fontFamily:"system-ui, Arial", padding:16, maxWidth:800, margin:"0 auto" }}>
      <h1>Blackjack</h1>
      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
        <button onClick={start}>Start</button>
        <button onClick={hit} disabled={!playing}>Hit</button>
        <button onClick={stay} disabled={!playing}>Stay</button>
      </div>

      <Row title="Dealer" cards={g?.dealer.visible} count={g?.dealer.count} hidden={!g?.reveal} />
      <Row title="You"    cards={g?.player.cards}   count={g?.player.count} />

      {g && g.status !== "playing" &&
        <div style={{ marginTop: 12, fontSize: 18 }}>
          Result: <strong>{g.status === "won" ? "You Win!" : g.status === "lost" ? "You Lose!" : "Tie!"}</strong>
        </div>}
    </div>
  );
}
