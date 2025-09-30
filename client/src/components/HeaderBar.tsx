// client/src/components/HeaderBar.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
            {/* Header row: left = gold pill, right = auth buttons */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                }}
            >
                {/* LEFT: Gold pill with + */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: "#1f1f1f",
                        color: "white",
                        padding: "6px 10px",
                        borderRadius: 999,
                    }}
                >
                    <span role="img" aria-label="coin">
                        🪙
                    </span>
                    <strong>{playerGold}</strong>
                    <button
                        onClick={() => setShowBuy(true)}
                        style={{
                            marginLeft: 6,
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            border: "1px solid #555",
                            background: "transparent",
                            color: "white",
                            cursor: "pointer",
                        }}
                        title="Buy chips"
                    >
                        +
                    </button>
                </div>

                {/* RIGHT: Auth bar */}
                <div>
                    {!token ? (
                        <>
                            <button onClick={() => navigate("/login")}>
                                Login
                            </button>
                            <button onClick={() => navigate("/signup")}>
                                Sign Up
                            </button>
                        </>
                    ) : (
                        <button onClick={handleLogout}>Logout</button>
                    )}
                </div>
            </div>

            {/* BUY MODAL */}
            {showBuy && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 999,
                    }}
                    onClick={() => setShowBuy(false)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: 420,
                            background: "#111",
                            color: "white",
                            borderRadius: 12,
                            padding: 20,
                            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <h3 style={{ margin: 0 }}>Buy Chips</h3>
                            <button
                                onClick={() => setShowBuy(false)}
                                style={{
                                    background: "transparent",
                                    color: "white",
                                    border: "none",
                                    fontSize: 20,
                                    cursor: "pointer",
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <p style={{ color: "#bbb", marginTop: 6 }}>
                            Select the amount of chips you want to purchase.
                        </p>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: 12,
                                marginTop: 12,
                            }}
                        >
                            {[50, 100, 500, 1000, 5000, 10000].map((a) => (
                                <button
                                    key={a}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                        onBuy(a);
                                    }}
                                    style={{
                                        padding: "16px 12px",
                                        borderRadius: 10,
                                        border: "1px solid #333",
                                        background: "#1a1a1a",
                                        color: "white",
                                        cursor: "pointer",
                                        fontWeight: 600,
                                    }}
                                >
                                    {a} Chips
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
