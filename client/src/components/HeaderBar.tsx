import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HeaderBar.css";
import BuyModal from "./BuyModal";

export default function HeaderBar({
  playerGold,
  onBuy,
}: {
  playerGold: number;
  onBuy: (amount: number) => void;
}) {
  const navigate = useNavigate();
  const [showBuy, setShowBuy] = useState(false);
  const token = localStorage.getItem("token");

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/", { replace: true });
  }

  return (
    <>
      <div className="headerbar">
        <div className="gold-pill">
          <span role="img" aria-label="coin">🪙</span>
          <strong>{playerGold}</strong>
          <button onClick={() => setShowBuy(true)} className="plus-icon">+</button>
        </div>

        <div className="authbar">
          {!token ? (
            <>
              <button onClick={() => navigate("/login")}>Login</button>
              <button onClick={() => navigate("/signup")}>Sign Up</button>
            </>
          ) : (
            <button onClick={handleLogout}>Logout</button>
          )}
        </div>
      </div>

      {showBuy && <BuyModal onClose={() => setShowBuy(false)} onBuy={onBuy} />}
    </>
  );
}
