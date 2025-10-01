// client/src/App.tsx
import { useEffect, useState } from "react";
import "./App.css";
import HeaderBar from "./components/HeaderBar";
import BottomBar from "./components/BottomBar";
import ResultBanner from "./components/ResultBanner";
import GamePanel from "./components/GamePanel";

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
    currentBet: number;
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
    const [dealerCount, setDealerCount] = useState<number | undefined>(
        undefined,
    );
    const [playerGold, setPlayerGold] = useState(1000);
    const [dealerGold, setDealerGold] = useState(2000);
    const [currentBet, setCurrentBet] = useState(0);
    const [deckLeft, setDeckLeft] = useState(52);

    // ----- local UI (pre-deal) -----
    const [bet, setBet] = useState(0);
    const chips = [10, 50, 100, 500];

    // table cap: both must afford the bet
    const tableMax = Math.min(playerGold, dealerGold);
    const effectiveBet = Math.min(bet, tableMax);
    const isPlaying = status === "playing";

    // Auto-reset table 2s after round ends (keep bankroll changes)
    useEffect(() => {
        if (status === "won" || status === "lost" || status === "tie") {
            const t = setTimeout(() => {
                // clear table & go back to betting
                setReveal(false);
                setPlayerCards([]);
                setDealerVisible([]);
                setPlayerCount(0);
                setDealerCount(undefined);
                setCurrentBet(0);
                setBet(0);
                setStatus("idle");
            }, 2000);
            return () => clearTimeout(t);
        }
    }, [status]);

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

        // Only clear bet when a new round starts
        if (r.status === "playing") setBet(0);
    }

    // preview balances
    const subtract = isPlaying ? currentBet : effectiveBet;
    const displayPlayerGold = Math.max(0, playerGold - subtract);
    const displayDealerGold = Math.max(0, dealerGold - subtract);

    // ----- actions -----
    function addChip(v: number) {
        if (isPlaying) return;
        setBet((b) => Math.min(b + v, tableMax));
    }

    function clearBet() {
        if (isPlaying) return;
        setBet(0);
    }

    async function onDeal() {
        if (isPlaying) return;
        const amount = effectiveBet;
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
        const resp = await fetch(`/api/games/${gameId}/hit`, {
            method: "POST",
        });
        const r: ApiState = await resp.json();
        apply(r);
    }

    async function onStay() {
        if (!gameId || !isPlaying) return;
        const resp = await fetch(`/api/games/${gameId}/stay`, {
            method: "POST",
        });
        const r: ApiState = await resp.json();
        apply(r);
    }

    async function buy(amount: number) {
        const resp = await fetch("/api/wallet/buy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: gameId ?? undefined, amount }),
        });
        if (!resp.ok) {
            const e = await resp.json().catch(() => ({}));
            console.error("BUY error:", e);
            return;
        }
        const r: ApiState = await resp.json();
        // only touch wallet + deck counter
        setPlayerGold(r.playerGold);
        setDeckLeft(r.deckLeft ?? deckLeft);
        // do NOT call apply(r) here
    }

    // ----- UI -----
    return (
        <div className="game-page">
            <HeaderBar playerGold={playerGold} onBuy={buy} />

            <h1 className="game-title">Black Jack</h1>

            {/* Game table panel */}
            <GamePanel
                status={status}
                reveal={reveal}
                dealerVisible={dealerVisible}
                dealerCount={dealerCount}
                playerCards={playerCards}
                playerCount={playerCount}
                deckLeft={deckLeft}
                currentBet={currentBet}
            />

            <BottomBar
                status={status}
                chips={chips}
                tableMax={tableMax}
                bet={bet}
                currentBet={currentBet}
                isPlaying={isPlaying}
                onAddChip={addChip}
                onClearBet={clearBet}
                onDeal={onDeal}
                onHit={onHit}
                onStay={onStay}
                playerGold={playerGold}
                dealerGold={dealerGold}
                displayPlayerGold={displayPlayerGold}
                displayDealerGold={displayDealerGold}
            />
        </div>
    );
}
