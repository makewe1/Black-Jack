// src/App.tsx
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import StartPage from "./pages/StartPage";
import GamePage from "./pages/GamePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import HistoryPage from "./pages/HistoryPage";

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/start" element={<StartPage />} />
            <Route path="/play" element={<GamePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/history" element={<HistoryPage />} /> 
            <Route path="*" element={<HomePage />} />
        </Routes>
    );
}
