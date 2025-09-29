import { useState } from "react";
import "./App.css";

type Card = string;
type GameStatus = "idle" | "playing" | "won" | "lost" | "tie";

type ApiState = {
  id: string;
  status: GameStatus;
  reveal: boolean;
  dealer: { visible: Card[]; count?: number };
  player: { cards: Card[]; count: number };
  playerGold: number;
  dealerGold: number;
  currentBet: number;  // locked bet during active round
  deckLeft: number;
};

export default function App() {
  // ----- server state -----
  const [gameId, setGameId] = useState<string | null>(null);
  const [status, setStatus] = useState<GameStatus>("idle");
  const [reveal, setReveal] = useState(false);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerVisible, setDealerVisible] = useState<Card[]>([]);
  const [playerCount, setPlayerCount] = useState(0);
  const [dealerCount, setDealerCount] = useState<number | undefined>(undefined);
  const [playerGold, setPlayerGold] = useState(1000);
  const [dealerGold, setDealerGold] = useState(1000);
  const [currentBet, setCurrentBet] = useState(0);
  const [deckLeft, setDeckLeft] = useState(52);

  // ----- local UI (pre-deal) -----
  const [bet, setBet] = useState(0);
  const chips = [10, 50, 100, 500];

  // table cap: both must afford the bet
  const tableMax = Math.min(playerGold, dealerGold);
  const effectiveBet = Math.min(bet, tableMax);          // clamped bet used everywhere pre-deal
  const isPlaying = status === "playing";

  function apply(r: ApiState) {
    setGameId(r.id);
    setStatus(r.status);
    setReveal(r.reveal);
    setPlayerCards(r.player.cards);
    setDealerVisible(r.dealer.visible);
    setPlayerCount(r.player.count);
    setDealerCount(r.dealer.count);
    setPlayerGold(r.playerGold);
    setDealerGold(r.dealerGold);
    setCurrentBet(r.currentBet ?? 0);
    setDeckLeft(r.deckLeft ?? deckLeft);

    // when a round begins, clear choosing UI; when it ends, clear locked bet
    if (r.status === "playing") setBet(0);
    else setCurrentBet(0);
  }

  // preview balances
  const subtract = isPlaying ? currentBet : effectiveBet;
  const displayPlayerGold = Math.max(0, playerGold - subtract);
  const displayDealerGold = Math.max(0, dealerGold - subtract);

  // ----- actions -----
  function addChip(v: number) {
    if (isPlaying) return;
    setBet(b => Math.min(b + v, tableMax));
  }

  function clearBet() {
    if (isPlaying) return;
    setBet(0);
  }

  async function onDeal() {
    if (isPlaying) return;
    const amount = effectiveBet;            // always send the clamped amount
    if (amount === 0) return;

    const resp = await fetch("/api/games/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: gameId ?? undefined, bet: amount }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      console.error("DEAL error:", err);
      return;
    }
    const r: ApiState = await resp.json();
    apply(r);
  }

  async function onHit() {
    if (!gameId || !isPlaying) return;
    const resp = await fetch(`/api/games/${gameId}/hit`, { method: "POST" });
    const r: ApiState = await resp.json();
    apply(r);
  }

  async function onStay() {
    if (!gameId || !isPlaying) return;
    const resp = await fetch(`/api/games/${gameId}/stay`, { method: "POST" });
    const r: ApiState = await resp.json();
    apply(r);
  }

  // ----- UI -----
  return (
    <div className="app">
      <h1>Blackjack</h1>

      <div style={{ marginBottom: 12 }}>
        Cards left in the deck: <strong>{deckLeft}</strong>
      </div>

      {/* Bankroll / Bet */}
      <div className="panel">
        <div className="bank">
          <div>Your Gold: <strong>{displayPlayerGold}</strong></div>
          <div>Dealer’s Gold: <strong>{displayDealerGold}</strong></div>
        </div>

        <div className="bet-row">
          <div>
            Bet: <strong>{isPlaying ? currentBet : effectiveBet}</strong>
          </div>
          <div className="chips">
            {chips.map(c => (
              <button
                key={c}
                onClick={() => addChip(c)}
                disabled={isPlaying || effectiveBet >= tableMax}
              >
                {c}
              </button>
            ))}
            <button onClick={clearBet} disabled={isPlaying}>Clear</button>
            <button
              className="deal"
              onClick={onDeal}
              disabled={isPlaying || effectiveBet === 0}
            >
              DEAL
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table">
        <section>
          <h2>Dealer {reveal && dealerCount !== undefined ? `(${dealerCount})` : ""}</h2>
          <div className="cards">
            {dealerVisible.map((c, i) => (
              <img
                key={i}
                src={reveal ? `/cards/${c}.png` : i === 0 ? `/cards/${c}.png` : "/cards/BACK.png"}
                alt={c}
              />
            ))}
            {!reveal && dealerVisible.length === 1 && (
              <img src="/cards/BACK.png" alt="Hidden" />
            )}
          </div>
        </section>

        <section>
          <h2>You ({playerCount})</h2>
          <div className="cards">
            {playerCards.map((c, i) => (
              <img key={i} src={`/cards/${c}.png`} alt={c} />
            ))}
          </div>
        </section>
      </div>

      {/* Actions */}
      <div className="actions">
        <button onClick={onHit} disabled={!isPlaying}>Hit</button>
        <button onClick={onStay} disabled={!isPlaying}>Stay</button>
        {status !== "playing" && status !== "idle" && (
          <div className={`result ${status}`}>Result: {status}</div>
        )}
      </div>
    </div>
  );
}
