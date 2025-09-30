import React, { useState } from "react";
// We use standard <a> tags and window.location for stable routing instead of useNavigate.

// Define custom colors and animations using a style tag.
const CustomStyles: React.FC = () => (
    <style
        dangerouslySetInnerHTML={{
            __html: `
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Inter:wght@400;700&display=swap');

        :root {
            --primary-color: #5c35a8; /* Deep Purple */
            --accent-color: #ffc107;  /* Gold/Yellow */
            --dark-background: #1a1a2e; /* Dark Blue/Black */
            --button-background: #4a2b8e; /* A slightly lighter purple for buttons */
        }

        /* Main container for the full-screen layout */
        .home-container {
            width: 100vw;
            height: 100vh;
            background-color: var(--dark-background);
            background-image: radial-gradient(circle, #2e2a52 0%, var(--dark-background) 70%);
            display: flex;
            flex-direction: column; /* Mobile first: stack logo and menu */
            align-items: center;
            justify-content: center;
            padding: 2rem;
            gap: 2rem;
            font-family: 'Inter', sans-serif;
            color: white;
        }

        /* Desktop layout using a media query */
        @media (min-width: 768px) {
            .home-container {
                flex-direction: row; /* Side-by-side layout on desktop */
                justify-content: space-evenly;
                gap: 4rem;
            }
        }

        /* Left side panel for the logo */
        .left-panel {
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        /* Right side panel for the title and buttons */
        .right-panel {
            display: flex;
            flex-direction: column;
            align-items: center; /* Center title and buttons */
            justify-content: center;
            gap: 1.5rem;
            width: 90%;
            max-width: 320px;
        }

        .game-title {
            font-family: 'Caveat', cursive;
            font-size: 3.5rem; 
            color: var(--accent-color);
            text-shadow: 0 0 10px rgba(255, 193, 7, 0.6);
            line-height: 1;
            margin-bottom: 1rem;
        }

        @media (min-width: 768px) {
            .game-title {
                font-size: 4.5rem; 
            }
        }
        
        /* New Button Styling to match the reference image */
        .menu-button {
            transition: all 0.2s ease-in-out;
            background-color: var(--button-background);
            border: 2px solid #7d59b8;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
            letter-spacing: 0.1em;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none; /* Remove underline for links */
            padding: 0.75rem 1rem; /* py-3 px-4 */
            font-size: 1.125rem; /* text-lg */
            font-weight: 700; /* font-bold */
            color: white;
            border-radius: 8px; /* Slightly rounded corners */
            text-transform: uppercase;
        }

        .menu-button:hover {
            transform: scale(1.03);
            border-color: var(--accent-color);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6), 0 0 10px var(--accent-color);
        }

        .menu-button:active {
            transform: scale(0.98);
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
        }

        /* Animation and drop shadow for the rotating coin */
        @keyframes rotate-coin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .rotating-maze {
            animation: rotate-coin 10s linear infinite;
            filter: drop-shadow(0 0 15px rgba(255, 193, 7, 0.7));
        }
    `,
        }}
    />
);

// Define types for the Modal state
interface ModalState {
    isVisible: boolean;
    title: string;
    message: string;
}

/**
 * Component for the Skull Coin Logo with Maze Animation
 */
const SkullCoinLogo: React.FC = () => (
    // Increased size for more prominence
    <div className="relative w-64 h-64 md:w-80 md:h-80">
        {/* Outer Ring (Maze) */}
        <svg
            className="absolute inset-0 rotating-maze"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                {/* Define the maze pattern (a simplified Greek Key labyrinth) */}
                <path
                    id="mazePath"
                    fill="none"
                    stroke="#ffc107"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M 10 10 H 90 V 90 H 10 Z 
                           M 20 20 H 80 V 80 H 20 Z 
                           M 30 30 H 70 V 70 H 30 Z
                           M 40 40 H 60 V 60 H 40 Z"
                />
            </defs>
            {/* Coin background ring */}
            <circle cx="50" cy="50" r="48" fill="#d49a00" />
            {/* Maze pattern on the edge */}
            <use xlinkHref="#mazePath" transform="scale(0.9) translate(5 5)" />
        </svg>

        {/* Inner Skull */}
        <svg
            className="absolute inset-0"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle cx="50" cy="50" r="35" fill="#ffc107" />
            {/* Simplified Skull Shape */}
            <path
                fill="#5c35a8"
                d="M 35 40 Q 50 30, 65 40 L 65 55 Q 65 70, 50 75 Q 35 70, 35 55 Z M 44 50 Q 45 45, 50 45 Q 55 45, 56 50 Z M 42 60 H 58 L 56 63 H 44 Z M 40 48 Q 42 42, 45 40 L 40 35 H 60 L 55 40 Q 58 42, 60 48 Z"
            />
            {/* Eye Sockets */}
            <path
                fill="#1a1a2e"
                d="M 40 45 L 45 55 L 50 45 Z M 60 45 L 55 55 L 50 45 Z"
            />
            {/* Nose hole */}
            <circle cx="50" cy="55" r="2.5" fill="#1a1a2e" />
        </svg>

        {/* Blackjack Cards */}
        <div className="absolute -bottom-4 right-0 transform rotate-12 flex space-x-2">
            <div
                className="bg-white p-1 rounded-md shadow-lg text-red-600 text-sm font-bold w-10 h-14 flex flex-col justify-between"
                style={{ border: "1px solid #ccc" }}
            >
                <span>A</span>
                <span className="text-2xl text-center">♥</span>
                <span className="self-end transform rotate-180">A</span>
            </div>
        </div>
    </div>
);


/**
 * Component for the Confirmation Modal
 */
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
                className="p-8 rounded-xl max-w-sm w-full text-center modal-content"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                style={{
                    backgroundColor: "var(--card-background)",
                    border: "3px solid var(--accent-color)",
                    boxShadow: "0 0 30px rgba(255, 193, 7, 0.7)",
                }}
            >
                <h3 className="text-2xl font-bold text-yellow-400 mb-4">
                    {modal.title}
                </h3>
                <p
                    className="text-white mb-6"
                    dangerouslySetInnerHTML={{ __html: modal.message }}
                ></p>
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
            message:
                "You will proceed as a **visitor**. Your data will not be persistently saved. Starting game...",
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
        <div className="home-container">
            <CustomStyles />

            {/* Left Side: Logo */}
            <div className="left-panel">
                <SkullCoinLogo />
            </div>

            {/* Right Side: Title and Menu Buttons */}
            <div className="right-panel">
                <h1 className="game-title">
                    Blackjack Story
                </h1>
                
                <a href="/login" className="menu-button">
                    Login
                </a>

                <a href="/signup" className="menu-button">
                    Sign Up
                </a>
                
                <button onClick={handleGuestAction} className="menu-button">
                    Play as Guest
                </button>
            </div>

            <ConfirmationModal modal={modal} closeModal={closeModal} />
        </div>
    );
};

export default HomePage;