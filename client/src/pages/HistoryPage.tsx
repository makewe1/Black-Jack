import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type HistoryEntry = {
    id: string;
    status: string;
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
        setHistory(h);
    }, []);

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <h1 className="text-3xl mb-6">Game History</h1>
            {history.length === 0 ? (
                <p>No games played yet.</p>
            ) : (
                <ul className="space-y-4">
                    {history.map((h, i) => (
                        <li
                            key={i}
                            className="border p-4 rounded-lg bg-gray-800"
                        >
                            <div>
                                <strong>Round:</strong> {i + 1}
                            </div>
                            <div>
                                <strong>Result:</strong>{" "}
                                {h.status.toUpperCase()}
                            </div>
                            <div>
                                <strong>Bet:</strong> {h.bet}
                            </div>
                            <div>
                                <strong>Player:</strong>{" "}
                                {h.playerCards.join(", ")} ({h.playerCount})
                            </div>
                            <div>
                                <strong>Dealer:</strong>{" "}
                                {h.dealerVisible.join(", ")} (
                                {h.dealerCount ?? "?"})
                            </div>
                            <div>
                                <strong>Time:</strong>{" "}
                                {new Date(h.resultTime).toLocaleString()}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            <button
                className="mt-6 px-4 py-2 bg-blue-600 rounded"
                onClick={() => nav("/start")}
            >
                Back
            </button>
        </div>
    );
}
