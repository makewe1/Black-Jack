import React from "react";

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
}: Props) {
    const showingBet = !isPlaying;
    const effectiveBet = Math.min(bet, tableMax);

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
                        <button
                            onClick={onClearBet}
                            disabled={false}
                            type="button"
                        >
                            Clear
                        </button>
                        <button
                            className="deal"
                            onClick={onDeal}
                            disabled={effectiveBet === 0 || status !== "idle"} // <-- added guard
                            type="button"
                        >
                            DEAL
                        </button>
                    </div>
                </div>
            ) : (
                <div className="actionbar">
                    <button className="double" disabled type="button">
                        DOUBLE
                    </button>
                    <button onClick={onHit} type="button">
                        HIT
                    </button>
                    <button onClick={onStay} type="button">
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
