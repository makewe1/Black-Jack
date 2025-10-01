// client/src/components/GamePanel.tsx
import "./GamePanel.css";
import ResultBanner from "./ResultBanner";

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
};

export default function GamePanel({
    status,
    reveal,
    dealerVisible,
    dealerCount,
    playerCards,
    playerCount,
    deckLeft,
}: Props) {
    return (
        <div className="game-panel">
            {/* Deck counter (top right, golden text) */}
            <div className="deck-counter-top">
                CARDS LEFT IN THE DECK:{" "}
                <span className="count">{deckLeft}</span>
            </div>

            {/* Dealer side */}
            <section className="row">
                <h2 className="scoreline">
                    Dealer:{" "}
                    <span className="count">
                        {reveal && dealerCount !== undefined ? dealerCount : 0}
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

            {/* Player side */}
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

            {/* Win/Lose/Draw banner */}
            <ResultBanner status={status} />
        </div>
    );
}
