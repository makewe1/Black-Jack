import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// ----------------------------------------------------------------------
// 1. IMPORT THE NEW HOMEPAGE COMPONENT
import HomePage from "./pages/HomePage"; 
// ----------------------------------------------------------------------
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import App from "./App"; // your main game app

import "./index.css";

// FIX: Added the non-null assertion operator (!) after getElementById("root")
// to tell TypeScript that this element will definitely be present in index.html.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* 2. USE THE HOMEPAGE COMPONENT AT THE ROOT PATH */}
        <Route path="/" element={<HomePage />} /> 
        
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/play" element={<App />} />
        
        {/* optional catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
