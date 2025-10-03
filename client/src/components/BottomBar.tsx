import React, { useEffect, useState } from "react";
import "./BottomBar.css";

type GameStatus = "idle" | "playing" | "won" | "lost" | "tie";

type Props = {
    status: GameStatus;
    chips: number[];
    tableMax: number;
    bet: number;
    currentBet: number;
    isPlaying: boolean;
    onAddChip: (v: number) => void;
    onClearBet: () => void;
    onDeal: () => void;
    onHit: () => void;
    onStay: () => void;

    // NEW
    playerGold: number;
    dealerGold: number;
    displayPlayerGold: number;
    displayDealerGold: number;

    // For AI API call
    gameId?: string | null;
};

export default function BottomBar({
    status,
    chips,
    tableMax,
    bet,
    currentBet,
    isPlaying,
    onAddChip,
    onClearBet,
    onDeal,
    onHit,
    onStay,
    playerGold,
    dealerGold,
    displayPlayerGold,
    displayDealerGold,
    gameId,
}: Props) {
    const showingBet = !isPlaying;
    const effectiveBet = Math.min(bet, tableMax);

    // 'hit' | 'stand' | null — which action to highlight
    const [aiRec, setAiRec] = useState<"hit" | "stand" | null>(null);

    async function onAskAI() {
        if (!isPlaying || !gameId) return;
        try {
            const resp = await fetch(`/api/games/${gameId}/ai`, { method: "POST" });
            const data = await resp.json();
            const r = String(data?.recommendation ?? "").toUpperCase();
            if (r.includes("HIT")) setAiRec("hit");
            else if (r.includes("STAND")) setAiRec("stand");
            else setAiRec(null);
        } catch {
            setAiRec(null);
        }
    }

    // Clear highlight when the round ends (won/lost/tie) or goes back to idle
    useEffect(() => {
        if (status !== "playing") setAiRec(null);
    }, [status]);

    const handleHit = () => {
        setAiRec(null); // optional: clear once player acts
        onHit();
    };
    const handleStay = () => {
        setAiRec(null); // optional: clear once player acts
        onStay();
    };

    return (
        <div className="bottombar">
            {/* Bankroll strip */}
            <div className="bank">
                <div>
                    Your Gold: <strong>{displayPlayerGold}</strong>
                </div>
                <div>
                    Dealer’s Gold: <strong>{displayDealerGold}</strong>
                </div>
            </div>

            {showingBet ? (
                <div className="betbar">
                    <div className="bet-display">
                        Bet: <strong>{effectiveBet}</strong>
                    </div>
                    <div className="chip-row">
                        {chips.map((c) => (
                            <button
                                key={c}
                                onClick={() => onAddChip(c)}
                                disabled={effectiveBet >= tableMax}
                                type="button"
                            >
                                {c}
                            </button>
                        ))}
                        <button onClick={onClearBet} type="button">
                            Clear
                        </button>
                        <button
                            className="deal"
                            onClick={onDeal}
                            disabled={effectiveBet === 0 || status !== "idle"}
                            type="button"
                        >
                            DEAL
                        </button>
                    </div>
                </div>
            ) : (
                <div className="actionbar">
                    {/* AI Button */}
                    <div className="ai-helper">
                        <button
                            className={`ai-btn ${aiRec ? "ai-active" : ""}`}
                            onClick={onAskAI}
                            type="button"
                            title="AI Recommendation"
                            aria-label="AI Recommendation"
                        >
                            ?
                        </button>
                    </div>

                    <button className="double" disabled type="button">
                        DOUBLE
                    </button>
                    <button
                        className={aiRec === "hit" ? "action-suggest" : ""}
                        onClick={handleHit}
                        type="button"
                    >
                        HIT
                    </button>
                    <button
                        className={aiRec === "stand" ? "action-suggest" : ""}
                        onClick={handleStay}
                        type="button"
                    >
                        STAND
                    </button>
                    <div className="locked-bet">
                        Bet: <strong>{currentBet}</strong>
                    </div>
                </div>
            )}
        </div>
    );
}
