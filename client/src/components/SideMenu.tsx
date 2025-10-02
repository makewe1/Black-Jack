// src/components/SideMenu.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./SideMenu.css";

type Props = {
    open: boolean;
    onClose: () => void;
};

export default function SideMenu({ open, onClose }: Props) {
    const nav = useNavigate();

    return (
        <div
            className={`sidemenu-backdrop ${open ? "open" : ""}`}
            onClick={onClose}
        >
            <div
                className={`sidemenu-panel ${open ? "open" : ""}`}
                onClick={(e) => e.stopPropagation()}
            >
                <button className="sidemenu-close" onClick={onClose}>
                    ✕
                </button>

                <ul className="sidemenu-list">
                    <li>
                        <button
                            className="sidemenu-btn"
                            onClick={() => {
                                nav("/play"); // continue game
                                onClose();
                            }}
                        >
                            CONTINUE
                        </button>
                    </li>
                    <li>
                        <button
                            className="sidemenu-btn"
                            onClick={() => {
                                nav("/play?new=true"); // new game
                                onClose();
                            }}
                        >
                            NEW GAME
                        </button>
                    </li>
                    <li>
                        <button
                            className="sidemenu-btn"
                            onClick={() => {
                                // TODO: implement history route when ready
                                alert("History not implemented yet");
                                onClose();
                            }}
                        >
                            HISTORY
                        </button>
                    </li>
                    <li>
                        <button
                            className="sidemenu-btn"
                            onClick={() => {
                                nav("/start"); // go back to StartPage
                                onClose();
                            }}
                        >
                            EXIT
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    );
}
