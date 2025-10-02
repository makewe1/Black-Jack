import React, { useState, useEffect } from "react";
import GoldCoinLogo from "../components/GoldCoinLogo";
import "@fontsource/alex-brush";
import LoginPage from "./LoginPage";
import SignupPage from "./SignupPage";

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

    // NEW: login modal toggle
    const [showLogin, setShowLogin] = useState(false);
    const [showSignup, setShowSignup] = useState(false);

    // lock body scroll when modal open (nice-to-have)
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = showLogin ? "hidden" : prev || "";
        return () => {
            document.body.style.overflow = prev || "";
        };
    }, [showLogin]);

    const handleGuestAction = () => {
        setModal({
            isVisible: true,
            title: "Entering as Guest",
            message:
                "You will proceed as a <b>visitor</b>. Your data will not be persistently saved. Starting game...",
        });
        setTimeout(() => {
            closeModal();
            window.location.href = "/start";
        }, 900);
    };

    const closeModal = () => {
        setModal((prev) => ({ ...prev, isVisible: false }));
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
                <h1 className="font-calligraphy text-6xl md:text-7xl text-yellow-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.7)] mb-6">
                    Black Jack
                </h1>

                {/* CHANGE: use <button> (no href) so we never navigate */}
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

                {/* was: <a href="/signup" ...> */}
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

            {/* Login pop-up (stays on Home) */}
            {showLogin && (
                <LoginPage
                    asModal
                    open={showLogin}
                    onClose={() => setShowLogin(false)}
                    title="Sign in"
                />
            )}
            {/* SIGN UP modal (new) */}
            {showSignup && (
                <SignupPage
                    asModal
                    open={showSignup}
                    onClose={() => setShowSignup(false)} // ✕ and backdrop will call this
                    title="Create your account"
                />
            )}
        </div>
    );
};

export default HomePage;
