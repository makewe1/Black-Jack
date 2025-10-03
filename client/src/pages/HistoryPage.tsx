import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/HistoryPage.css";

type HistoryEntry = {
    id: string;
    status: "won" | "lost" | "tie" | string;
    playerCards: string[];
    dealerVisible: string[];
    playerCount: number;
    dealerCount?: number;
    bet: number;
    resultTime: string;
};

export default function HistoryPage() {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const nav = useNavigate();

    useEffect(() => {
        const h = JSON.parse(localStorage.getItem("bj:history") || "[]");
        // newest first
        setHistory(h.reverse());
    }, []);

    const total = useMemo(() => history.length, [history]);

    return (
        <div
            className="history-bg"
            style={{ backgroundImage: "url('/bg-start.png')" }} // reuse start bg
        >
            <div className="history-container">
                <div className="history-header">
                    <h1 className="blackjack-style history-title">
                        Game History
                    </h1>

                    <div className="history-actions">
                        <button
                            className="game-button"
                            onClick={() => nav("/play")}
                        >
                            BACK TO GAME
                        </button>
                        <button
                            className="game-button"
                            onClick={() => nav("/start")}
                        >
                            START MENU
                        </button>
                    </div>
                </div>

                <p className="history-subtitle">
                    Showing {total} {total === 1 ? "game" : "games"}
                </p>

                {history.length === 0 ? (
                    <div className="history-empty">No games played yet.</div>
                ) : (
                    <ul className="history-list">
                        {history.map((h, i) => (
                            <li key={i} className="history-item">
                                <div className="cell">
                                    <span className="label">Date</span>
                                    <span className="value">
                                        {new Date(
                                            h.resultTime,
                                        ).toLocaleString()}
                                    </span>
                                </div>

                                <div className="cell">
                                    <span className="label">Bet</span>
                                    <span className="value">{h.bet} chips</span>
                                </div>

                                <div className="cell">
                                    <span className="label">Score</span>
                                    <span className="value">
                                        You: {h.playerCount} | Dealer:{" "}
                                        {h.dealerCount ?? "?"}
                                    </span>
                                </div>

                                <div className="cell result">
                                    <span className={`badge ${h.status}`}>
                                        {h.status === "won"
                                            ? "Win"
                                            : h.status === "lost"
                                            ? "Lose"
                                            : "Push"}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
