// src/pages/StartPage.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/GameButton.css";

type GuestSession = {
  mode: "guest";
  playerGold: number;
  dealerGold: number;
  gameId: string | null;
  createdAt: string;
  updatedAt: string;
};

function getSession(): GuestSession | null {
  const raw = localStorage.getItem("bj:session");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSession(s: GuestSession) {
  localStorage.setItem("bj:session", JSON.stringify(s));
}

export default function StartPage() {
  const nav = useNavigate();

  // Ensure we have a lightweight guest session if user lands here directly
  useEffect(() => {
    let s = getSession();
    if (!s) {
      const now = new Date().toISOString();
      s = {
        mode: "guest",
        playerGold: 1000,
        dealerGold: 2000,
        gameId: null,
        createdAt: now,
        updatedAt: now,
      };
      saveSession(s);
    } else {
      // patch required fields without resetting player gold
      const now = new Date().toISOString();
      const patched: GuestSession = {
        mode: "guest",
        playerGold: Number.isFinite((s as any).playerGold)
          ? (s as any).playerGold
          : 1000,
        dealerGold: Number.isFinite((s as any).dealerGold)
          ? (s as any).dealerGold
          : 2000,
        gameId: (s as any).gameId ?? null,
        createdAt: (s as any).createdAt ?? now,
        updatedAt: now,
      };
      saveSession(patched);
    }
  }, []);

  const onContinue = () => {
    nav("/play");
  };

  const onNewGame = () => {
    const s = getSession();
    if (s) {
      // ✅ Reset ONLY the dealer's bankroll; keep player's as-is.
      const now = new Date().toISOString();
      saveSession({
        ...s,
        dealerGold: 2000,
        // Optionally clear any ongoing server game id so a fresh round is started
        gameId: null,
        updatedAt: now,
      });
    }
    nav("/play?new=true");
  };

  const onExit = () => {
    // Clear all guest state per your rule
    localStorage.removeItem("bj:session");
    nav("/");
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-cover bg-center text-white p-6"
      style={{ backgroundImage: "url('/bg-start.png')" }}
    >
      {/* Left: Icon */}
      <div className="flex flex-col items-center justify-center mr-32">
        <img
          src="/bg-coin.png"
          alt="Blackjack Coin Icon"
          className="w-80 h-auto drop-shadow-2xl"
        />
      </div>

      {/* Right: Title + Buttons */}
      <div className="flex flex-col items-center space-y-6 max-w-md w-full">
        <h1 className="blackjack-style text-7xl">Black Jack</h1>

        <div className="relative game-button-container">
          <button className="game-button" onClick={onContinue}>
            CONTINUE
          </button>
        </div>

        <div className="relative game-button-container">
          <button className="game-button" onClick={onNewGame}>
            NEW GAME
          </button>
        </div>

        <div className="relative game-button-container">
          <button className="game-button" disabled>
            HISTORY
          </button>
        </div>

        <div className="relative game-button-container">
          <button className="game-button" onClick={onExit}>
            EXIT
          </button>
        </div>
      </div>
    </div>
  );
}
