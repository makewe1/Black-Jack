import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HeaderBar.css";
import BuyModal from "./BuyModal";

type Props = {
    playerGold: number;
    onBuy: (amount: number) => void;
    /** Optional: parent can open a side/menu sheet, etc. */
    onMenuClick?: () => void;
};

// ...imports stay the same
export default function HeaderBar({ playerGold, onBuy, onMenuClick }: Props) {
    const [showBuy, setShowBuy] = useState(false);

    return (
        <>
            <header className="headerbar">
                <div className="headerbar-content">
                    {/* left: gold pill */}
                    <div className="gold-pill">
                        <span role="img" aria-label="coin">
                            🪙
                        </span>
                        <strong>{playerGold}</strong>
                        <button
                            onClick={() => setShowBuy(true)}
                            className="plus-icon"
                            aria-label="Buy chips"
                        >
                            +
                        </button>
                    </div>

                    {/* right: hamburger */}
                    <button
                        className="menu-button"
                        aria-label="Open menu"
                        onClick={onMenuClick ?? (() => {})}
                    >
                        <span />
                        <span />
                        <span />
                    </button>
                </div>
            </header>

            {showBuy && (
                <BuyModal onClose={() => setShowBuy(false)} onBuy={onBuy} />
            )}
        </>
    );
}
