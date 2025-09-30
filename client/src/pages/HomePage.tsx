import React, { useState } from "react";
import GoldCoinLogo from "../components/GoldCoinLogo"; // Make sure this component exists

// Define types for the Modal state
interface ModalState {
    isVisible: boolean;
    title: string;
    message: string;
}

// Component for the Confirmation Modal
const ConfirmationModal: React.FC<{
    modal: ModalState;
    closeModal: () => void;
}> = ({ modal, closeModal }) => {
    if (!modal.isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm" onClick={closeModal}>
            <div className="p-8 rounded-xl max-w-sm w-full text-center bg-gray-800 border-2 border-yellow-400 shadow-lg" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-2xl font-bold text-yellow-400 mb-4">{modal.title}</h3>
                <p className="text-white mb-6" dangerouslySetInnerHTML={{ __html: modal.message }}></p>
                <button onClick={closeModal} className="py-2 px-4 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition duration-150">
                    Close
                </button>
            </div>
        </div>
    );
};

/**
 * Main HomePage Component - Login/Landing Screen
 */
const HomePage: React.FC = () => {
    const [modal, setModal] = useState<ModalState>({
        isVisible: false,
        title: "",
        message: "",
    });

    const handleGuestAction = () => {
        setModal({
            isVisible: true,
            title: "Entering as Guest",
            message: "You will proceed as a **visitor**. Your data will not be persistently saved. Starting game...",
        });

        setTimeout(() => {
            closeModal();
            window.location.href = "/play";
        }, 1500);
    };

    const closeModal = () => {
        setModal((prev) => ({ ...prev, isVisible: false }));
    };

    return (
        // Main container with a dark background, using Flexbox for layout
        <div className="w-screen h-screen bg-gray-900 flex flex-col md:flex-row items-center justify-center md:justify-evenly p-8 gap-8 font-sans text-white">
            
            {/* Left Side: Logo */}
            <div>
                <GoldCoinLogo />
            </div>

            {/* Right Side: Title and Menu Buttons */}
            <div className="flex flex-col items-center gap-6 w-full max-w-xs">
                {/* Title with a custom font and shadow effect */}
                <h1 className="font-serif text-5xl md:text-6xl text-yellow-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.7)]">
                    Blackjack Story
                </h1>
                
                {/* Buttons styled with Tailwind CSS utility classes */}
                <a href="/login" className="w-full text-center p-3 uppercase font-bold text-white bg-purple-700 rounded-lg shadow-md hover:bg-purple-800 transition-colors duration-200">
                    Login
                </a>

                <a href="/signup" className="w-full text-center p-3 uppercase font-bold text-white bg-purple-700 rounded-lg shadow-md hover:bg-purple-800 transition-colors duration-200">
                    Sign Up
                </a>
                
                <button onClick={handleGuestAction} className="w-full p-3 uppercase font-bold text-white bg-purple-700 rounded-lg shadow-md hover:bg-purple-800 transition-colors duration-200">
                    Play as Guest
                </button>
            </div>

            <ConfirmationModal modal={modal} closeModal={closeModal} />
        </div>
    );
};

export default HomePage;