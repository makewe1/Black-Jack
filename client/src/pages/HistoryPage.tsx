import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/HistoryPage.css";

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
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const nav = useNavigate();

  // Prevent React 18 StrictMode dev double-run from mutating/duplicating
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    const raw = localStorage.getItem("bj:history");
    const h: HistoryEntry[] = raw ? JSON.parse(raw) : [];

    // clone then reverse; never mutate the array pulled from storage
    setHistory([...h].reverse());
  }, []);

  // If the length changes (e.g., a new game recorded), reset to first page
  useEffect(() => {
    setPage(1);
  }, [history.length]);

  const total = history.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const changePage = (p: number) => {
    if (p >= 1 && p <= totalPages) setPage(p);
  };

  // Slice items for current page
  const current = useMemo(
    () => history.slice((page - 1) * pageSize, page * pageSize),
    [history, page]
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
          <h1 className="blackjack-style history-title">Game History</h1>

          <div className="history-actions">
            <button className="game-button" onClick={() => nav("/play")}>
              BACK TO GAME
            </button>
            <button className="game-button" onClick={() => nav("/start")}>
              START MENU
            </button>
          </div>
        </div>

        <p className="history-subtitle">
          {total === 0
            ? "Showing 0 games"
            : `Showing ${start}–${end} of ${total} games`}
        </p>

        {total === 0 ? (
          <div className="history-empty">No games played yet.</div>
        ) : (
          <>
            {/* Key the list by page to force a full remount and prevent any stale rows from lingering */}
            <ul className="history-list" key={`page-${page}`}>
              {current.map((h, i) => {
                // stable, unique key per row
                const fallbackKey = `${h.resultTime}-${h.bet}-${h.playerCount}-${
                  h.dealerCount ?? "?"
                }-${i}`;
                const rowKey = h.id ?? fallbackKey;

                return (
                  <li key={rowKey} className="history-item">
                    <div className="cell">
                      <span className="label">Date</span>
                      <span className="value">
                        {new Date(h.resultTime).toLocaleString()}
                      </span>
                    </div>

                    <div className="cell">
                      <span className="label">Bet</span>
                      <span className="value">{h.bet} chips</span>
                    </div>

                    <div className="cell">
                      <span className="label">Score</span>
                      <span className="value">
                        You: {h.playerCount} | Dealer: {h.dealerCount ?? "?"}
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
                );
              })}
            </ul>

            {totalPages > 1 && (
              <>
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
                      <span key={`dots-${idx}`}>…</span>
                    ) : (
                      <button
                        key={num}
                        className={page === num ? "active" : ""}
                        onClick={() => changePage(num)}
                      >
                        {num}
                      </button>
                    )
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
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
