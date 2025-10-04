// src/pages/GamePage.tsx
import { useEffect, useState } from "react";
import "../App.css";
import HeaderBar from "../components/HeaderBar";
import BottomBar from "../components/BottomBar";
import GamePanel from "../components/GamePanel";
import SideMenu from "../components/SideMenu";
import { useLocation, useNavigate } from "react-router-dom";

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

// -------------------- session persistence --------------------
const SESSION_KEY = "bj:session";

type Session = {
    playerGold?: number;
    dealerGold?: number;
    deckLeft?: number;
    gameId?: string | null;
    status?: GameStatus;
};

function loadSession(): Session {
    try {
        return JSON.parse(localStorage.getItem(SESSION_KEY) || "{}");
    } catch {
        return {};
    }
}

function saveSession(patch: Session) {
    const prev: Session = loadSession();
    localStorage.setItem(SESSION_KEY, JSON.stringify({ ...prev, ...patch }));
}
// -------------------------------------------------------------

export default function GamePage() {
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
    const [menuOpen, setMenuOpen] = useState(false);

    // ----- local UI (pre-deal) -----
    const [bet, setBet] = useState(0);
    const chips = [10, 50, 100, 500];

    // router bits for "NEW GAME" reset (keep playerGold)
    const location = useLocation();
    const navigate = useNavigate();

    // Restore bankroll/deck/id on first mount so CONTINUE resumes properly
    useEffect(() => {
        const s = loadSession();
        if (typeof s.playerGold === "number") setPlayerGold(s.playerGold);
        if (typeof s.dealerGold === "number") setDealerGold(s.dealerGold);
        if (typeof s.deckLeft === "number") setDeckLeft(s.deckLeft);
        if (typeof s.gameId !== "undefined") setGameId(s.gameId ?? null);
        if (typeof s.status !== "undefined") setStatus(s.status);
    }, []);

    // If /play?new=true → reset table, dealer, deck; keep playerGold
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get("new") === "true") {
            // reset round/table state
            // setGameId(null);
            setStatus("idle");
            setReveal(false);
            setPlayerCards([]);
            setDealerVisible([]);
            setPlayerCount(0);
            setDealerCount(undefined);
            setCurrentBet(0);
            setBet(0);

            // reset dealer + deck ONLY
            setDealerGold(2000);
            setDeckLeft(52);

            // keep bankroll; refresh saved non-table fields
            saveSession({
                // playerGold:
                //     typeof s.playerGold === "number"
                //         ? s.playerGold
                //         : playerGold,
                dealerGold: 2000,
                deckLeft: 52,
                // gameId: null,
                status: "idle",
            });

            // clean URL so it doesn't keep re-triggering
            navigate("/play", { replace: true });
        }
    }, [location.search, navigate, playerGold]);

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
                // persist status so CONTINUE shows correct pre-deal state
                saveSession({ status: "idle" });
            }, 2000);
            return () => clearTimeout(t);
        }
    }, [status]);

    // save game history on round end
    useEffect(() => {
        if (status === "won" || status === "lost" || status === "tie") {
            const history = JSON.parse(
                localStorage.getItem("bj:history") || "[]",
            );
            const newEntry = {
                id: gameId,
                status,
                playerCards,
                dealerVisible,
                playerCount,
                dealerCount,
                bet: currentBet,
                resultTime: new Date().toISOString(),
            };
            history.push(newEntry);
            localStorage.setItem("bj:history", JSON.stringify(history));
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

        // persist bankroll + deck + id for "CONTINUE"
        saveSession({
            playerGold: r.playerGold,
            dealerGold: r.dealerGold,
            deckLeft: r.deckLeft ?? deckLeft,
            gameId: r.id,
            status: r.status,
        });

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
            body: JSON.stringify({
                id: gameId ?? undefined,
                bet: amount,
                // key bits:
                seed: { playerGold, dealerGold }, // used when the game is first created
                forceDealerGold: dealerGold, // reset ONLY dealer each new round
            }),
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
        // Optional: disallow buying mid-round (server also enforces this)
        if (status === "playing") return;
        const pathId = gameId ?? "new"; // placeholder; server will create a new game id if needed
        const resp = await fetch(`/api/games/${pathId}/buy`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount }),
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
        // capture/remember the server's game id for future actions
        if (r.id) setGameId(r.id);

        // persist wallet + deck so CONTINUE doesn't reset
        saveSession({
            playerGold: r.playerGold,
            deckLeft: r.deckLeft ?? deckLeft,
            gameId: r.id ?? gameId,
        });

        // do NOT call apply(r) here; we don't want to alter table state
    }

    // ----- UI -----
    return (
        <div className="game-page">
            <HeaderBar
                playerGold={playerGold}
                onBuy={buy}
                onMenuClick={() => setMenuOpen(true)}
            />

            <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

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
                tableMax={Math.min(playerGold, dealerGold)}
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
                gameId={gameId}
            />
        </div>
    );
}
