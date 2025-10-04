// src/pages/HomePage.tsx
import React, { useState, useEffect } from "react";
import GoldCoinLogo from "../components/GoldCoinLogo";
import "@fontsource/alex-brush"; // you can remove if unused
import LoginPage from "./LoginPage";
import SignupPage from "./SignupPage";
import "@fontsource/montez";

interface ModalState {
    isVisible: boolean;
    title: string;
    message: string;
}

const ConfirmationModal: React.FC<{
    modal: ModalState;
    closeModal: () => void;
}> = ({ modal, closeModal }) => {
    if (!modal.isVisible) return null;
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
            onClick={closeModal}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="p-8 rounded-xl max-w-sm w-full text-center bg-gray-800 border-2 border-yellow-400 shadow-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-2xl font-bold text-yellow-400 mb-4">
                    {modal.title}
                </h3>
                <p
                    className="text-white mb-6"
                    dangerouslySetInnerHTML={{ __html: modal.message }}
                />
                <button
                    onClick={closeModal}
                    className="py-2 px-4 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition duration-150"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

const HomePage: React.FC = () => {
    const [modal, setModal] = useState<ModalState>({
        isVisible: false,
        title: "",
        message: "",
    });

    const [showLogin, setShowLogin] = useState(false);
    const [showSignup, setShowSignup] = useState(false);

    useEffect(() => {
        // If current session is guest, wipe round history on returning Home
        try {
            const s = JSON.parse(localStorage.getItem("bj:session") || "{}");
            if (s.mode === "guest") {
                localStorage.removeItem("bj:history");
            }
        } catch {
            // ignore
        }
    }, []);

    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = showLogin ? "hidden" : prev || "";
        return () => {
            document.body.style.overflow = prev || "";
        };
    }, [showLogin]);

    const closeModal = () => {
        setModal((prev) => ({ ...prev, isVisible: false }));
    };

    const handleGuestAction = () => {
        // Always start guest with a clean history
        localStorage.removeItem("bj:history");

        // Force session to guest (safe overwrite every time)
        const now = new Date().toISOString();
        localStorage.setItem(
            "bj:session",
            JSON.stringify({
                mode: "guest",
                playerGold: 1000,
                dealerGold: 2000,
                gameId: null,
                createdAt: now,
                updatedAt: now,
            }),
        );

        // Small confirmation modal then navigate
        setModal({
            isVisible: true,
            title: "Entering as Guest",
            message:
                "You will proceed as a <b>visitor</b>. Your data may not persist. Starting game...",
        });

        setTimeout(() => {
            closeModal();
            window.location.href = "/start"; // or navigate('/start')
        }, 800);
    };

    return (
        <div className="w-screen h-screen bg-gray-900 flex flex-col md:flex-row items-center justify-center md:justify-evenly p-8 gap-8 font-sans text-white">
            {/* Left: coin + cards */}
            <div className="relative inline-block">
                <GoldCoinLogo />
                <img
                    src="/2cards.png"
                    alt="Two Cards"
                    className="absolute bottom-0 right-0 w-20 h-auto scale-100"
                />
            </div>

            {/* Right: title + buttons */}
            <div className="flex flex-col items-center gap-6 w-full max-w-xs">
                <h1 className="blackjack-style text-7xl md:text-8xl mb-6">
                    Black Jack
                </h1>

                <button
                    type="button"
                    onClick={() => setShowLogin(true)}
                    className="w-full text-center p-3 uppercase font-extrabold text-white 
            bg-gradient-to-b from-purple-400 to-purple-800 
            border-[3px] border-yellow-900 rounded-md 
            shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),0_2px_4px_rgba(0,0,0,0.8)] 
            transition-all duration-300 hover:from-green-400 hover:to-green-700"
                >
                    Login
                </button>

                <button
                    type="button"
                    onClick={() => setShowSignup(true)}
                    className="w-full text-center p-3 uppercase font-extrabold text-white 
            bg-gradient-to-b from-purple-400 to-purple-800 
            border-[3px] border-yellow-900 rounded-md 
            shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),0_2px_4px_rgba(0,0,0,0.8)] 
            transition-all duration-300 hover:from-green-400 hover:to-green-700"
                >
                    Sign Up
                </button>

                <button
                    onClick={handleGuestAction}
                    className="w-full p-3 uppercase font-extrabold text-white 
            bg-gradient-to-b from-purple-400 to-purple-800 
            border-[3px] border-yellow-900 rounded-md 
            shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),0_2px_4px_rgba(0,0,0,0.8)] 
            transition-all duration-300 hover:from-green-400 hover:to-green-700"
                >
                    Play as Guest
                </button>
            </div>

            <ConfirmationModal modal={modal} closeModal={closeModal} />

            {showLogin && (
                <LoginPage
                    asModal
                    open={showLogin}
                    onClose={() => setShowLogin(false)}
                    title="Sign in"
                />
            )}

            {showSignup && (
                <SignupPage
                    asModal
                    open={showSignup}
                    onClose={() => setShowSignup(false)}
                    title="Create your account"
                />
            )}
        </div>
    );
};

export default HomePage;
