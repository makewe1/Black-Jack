import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/HistoryPage.css";
import { apiFetch } from "../lib/api";

type HistoryEntry = {
    id?: string;
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
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const pageSize = 5;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [authToken, setAuthToken] = useState<string | null>(() =>
        localStorage.getItem("token"),
    );
    const nav = useNavigate();

    // Prevent React 18 StrictMode dev double-run from mutating/duplicating
    const didInit = useRef(false);
    const isAuthed = Boolean(authToken);

    useEffect(() => {
        const onStorage = () => {
            setAuthToken(localStorage.getItem("token"));
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    useEffect(() => {
        if (isAuthed) {
            didInit.current = false; // allow future guest reloads if they log out
            return;
        }
        if (didInit.current) return;
        didInit.current = true;

        const raw = localStorage.getItem("bj:history");
        const h: HistoryEntry[] = raw ? JSON.parse(raw) : [];

        const ordered = [...h].reverse();
        setHistory(ordered);
        setTotal(ordered.length);
    }, [isAuthed]);

    useEffect(() => {
        if (!isAuthed) return;

        let cancelled = false;
        const controller = new AbortController();

        const fetchHistory = async () => {
            setLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams({
                    page: String(page),
                    pageSize: String(pageSize),
                });
                const resp = await apiFetch(
                    `/api/history?${params.toString()}`,
                    {
                        signal: controller.signal,
                    },
                );
                const payload = await resp.json().catch(() => null);
                if (!resp.ok) {
                    const message =
                        (payload as { error?: string } | null)?.error ??
                        "Failed to load history";
                    throw new Error(message);
                }
                if (cancelled) return;
                const items = Array.isArray((payload as any)?.items)
                    ? (payload as any).items
                    : [];
                const normalized = items.map((item: any, idx: number) => ({
                    id:
                        item?.id ??
                        item?.gameId ??
                        `${item?.resultTime ?? ""}-${item?.bet ?? 0}-${idx}`,
                    status: item?.outcome ?? item?.status ?? "",
                    playerCards: Array.isArray(item?.playerCards)
                        ? item.playerCards
                        : [],
                    dealerVisible: Array.isArray(item?.dealerCards)
                        ? item.dealerCards
                        : [],
                    playerCount: Number(item?.playerCount) || 0,
                    dealerCount:
                        item?.dealerCount === null ||
                        item?.dealerCount === undefined
                            ? undefined
                            : Number(item.dealerCount),
                    bet: Number(item?.bet) || 0,
                    resultTime:
                        typeof item?.resultTime === "string"
                            ? item.resultTime
                            : typeof item?.createdAt === "string"
                            ? item.createdAt
                            : new Date().toISOString(),
                }));
                const totalCount = Number((payload as any)?.total ?? 0);
                setHistory(normalized);
                setTotal(totalCount);

                if (totalCount === 0) {
                    setPage(1);
                } else {
                    const totalPages = Math.max(
                        1,
                        Math.ceil(totalCount / pageSize),
                    );
                    if (page > totalPages) {
                        setPage(totalPages);
                    }
                }
            } catch (err) {
                if (cancelled) return;
                setHistory([]);
                setTotal(0);
                setError(err instanceof Error ? err.message : String(err));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchHistory();

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [isAuthed, page, pageSize]);

    // If the length changes (e.g., a new game recorded), reset to first page
    useEffect(() => {
        if (!isAuthed) {
            setPage(1);
        }
    }, [isAuthed, history.length]);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);

    const changePage = (p: number) => {
        if (p >= 1 && p <= totalPages) setPage(p);
    };

    // Slice items for current page
    const current = useMemo(
        () =>
            isAuthed
                ? history
                : history.slice((page - 1) * pageSize, page * pageSize),
        [history, isAuthed, page],
    );

    // Build page numbers with ellipses (1 … p-1 p p+1 … N)
    const visiblePages = useMemo(() => {
        const nums: (number | -1)[] = [];
        for (let n = 1; n <= totalPages; n++) {
            const near = Math.abs(n - page) <= 1;
            const edge = n === 1 || n === totalPages;
            if (near || edge) nums.push(n);
            else if (nums[nums.length - 1] !== -1) nums.push(-1);
        }
        return nums;
    }, [page, totalPages]);

    return (
        <div
            className="history-bg"
            style={{ backgroundImage: "url('/bg-start.png')" }}
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

                {/* <p className="history-subtitle">
          {total === 0
            ? "Showing 0 games"
            : `Showing ${start}–${end} of ${total} games`}
        </p> */}

                {error && <div className="history-empty">{error}</div>}
                {loading ? (
                    <div className="history-empty">Loading history…</div>
                ) : total === 0 ? (
                    <div className="history-empty">No games played yet.</div>
                ) : (
                    <>
                        {/* Key the list by page to force a full remount and prevent any stale rows from lingering */}
                        <ul className="history-list" key={`page-${page}`}>
                            {current.map((h, i) => {
                                // stable, unique key per row
                                const fallbackKey = `${h.resultTime}-${h.bet}-${
                                    h.playerCount
                                }-${h.dealerCount ?? "?"}-${i}`;
                                const rowKey = h.id ?? fallbackKey;

                                return (
                                    <li key={rowKey} className="history-item">
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
                                            <span className="value">
                                                {h.bet} chips
                                            </span>
                                        </div>

                                        <div className="cell">
                                            <span className="label">Score</span>
                                            <span className="value">
                                                You: {h.playerCount} | Dealer:{" "}
                                                {h.dealerCount ?? "?"}
                                            </span>
                                        </div>

                                        <div className="cell result">
                                            <span
                                                className={`badge ${h.status}`}
                                            >
                                                {h.status === "won"
                                                    ? "Win"
                                                    : h.status === "lost"
                                                    ? "Lose"
                                                    : "Push"}
                                            </span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>

                        {totalPages > 1 && (
                            <>
                                <footer className="history-footer">
                                    <div className="pagination">
                                        <button
                                            onClick={() => changePage(page - 1)}
                                            disabled={page === 1}
                                            aria-label="Previous page"
                                        >
                                            &lt;
                                        </button>

                                        {visiblePages.map((num, idx) =>
                                            num === -1 ? (
                                                <span
                                                    key={`dots-${idx}`}
                                                    className="dots"
                                                >
                                                    …
                                                </span>
                                            ) : (
                                                <button
                                                    key={num}
                                                    className={
                                                        page === num
                                                            ? "active"
                                                            : ""
                                                    }
                                                    onClick={() =>
                                                        changePage(num)
                                                    }
                                                >
                                                    {num}
                                                </button>
                                            ),
                                        )}

                                        <button
                                            onClick={() => changePage(page + 1)}
                                            disabled={page === totalPages}
                                            aria-label="Next page"
                                        >
                                            &gt;
                                        </button>
                                    </div>

                                    <div className="page-info">
                                        Showing {start}–{end} of {total} games
                                    </div>
                                </footer>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
