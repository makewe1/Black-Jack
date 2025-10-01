// client/src/components/GamePanel.tsx
import "./GamePanel.css";
import ResultBanner from "./ResultBanner";
import { FaCoins } from "react-icons/fa"; 

type Card = string;
type GameStatus = "idle" | "playing" | "won" | "lost" | "tie";

type Props = {
    status: GameStatus;
    reveal: boolean;
    dealerVisible: Card[];
    dealerCount?: number;
    playerCards: Card[];
    playerCount: number;
    deckLeft: number;
    currentBet: number;
};

export default function GamePanel({
    status,
    reveal,
    dealerVisible,
    dealerCount,
    playerCards,
    playerCount,
    deckLeft,
    currentBet,
}: Props) {
    return (
        <div className="game-panel">
            {/* LEFT: table area (labels + cards) */}
            <div className="table">
                <div className="table-header">
                    <div className="deck-counter-top">
                        CARDS LEFT IN THE DECK:{" "}
                        <span className="count">{deckLeft}</span>
                    </div>
                </div>

                {/* Dealer row */}
                <section className="row">
                    <h2 className="scoreline">
                        Dealer:{" "}
                        <span className="count">
                            {reveal && dealerCount !== undefined
                                ? dealerCount
                                : 0}
                        </span>
                    </h2>
                    <div className="cards">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div className="slot" key={i}>
                                {dealerVisible[i] ? (
                                    <img
                                        src={
                                            reveal
                                                ? `/cards/${dealerVisible[i]}.png`
                                                : i === 0
                                                ? `/cards/${dealerVisible[i]}.png`
                                                : "/cards/BACK.png"
                                        }
                                        alt={dealerVisible[i]}
                                    />
                                ) : null}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Player row */}
                <section className="row">
                    <h2 className="scoreline">
                        You: <span className="count">{playerCount}</span>
                    </h2>
                    <div className="cards">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div className="slot" key={i}>
                                {playerCards[i] ? (
                                    <img
                                        src={`/cards/${playerCards[i]}.png`}
                                        alt={playerCards[i]}
                                    />
                                ) : null}
                            </div>
                        ))}
                    </div>
                </section>

                <ResultBanner status={status} />
            </div>

            {/* RIGHT: dedicated bet column */}
            <aside className="bet-col">
                <div className="bet-pill">
                    <FaCoins className="coin-icon" /> 
                    <span className="bet-value">{currentBet}</span>
                </div>
            </aside>
        </div>
    );
}
