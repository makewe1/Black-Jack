// src/pages/StartPage.tsx
import { useNavigate } from "react-router-dom";
import "../styles/GameButton.css";

export default function StartPage() {
    const nav = useNavigate();

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
                    <button
                        className="game-button"
                        onClick={() => nav("/play")}
                    >
                        CONTINUE
                    </button>
                </div>

                <div className="relative game-button-container">
                    <button
                        className="game-button"
                        onClick={() => nav("/play?new=true")}
                    >
                        NEW GAME
                    </button>
                </div>

                <div className="relative game-button-container">
                    <button className="game-button">HISTORY</button>
                </div>

                <div className="relative game-button-container">
                    <button className="game-button" onClick={() => nav("/")}>
                        EXIT
                    </button>
                </div>
            </div>
        </div>
    );
}
