import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LoginPage.css";
import { apiFetch } from "../lib/api";

type Mode = "password" | "code";

export default function LoginPage({
    asModal = false,
    open = true,
    onClose,
    title = "Login",
}: {
    asModal?: boolean;
    open?: boolean;
    onClose?: () => void;
    title?: string;
}) {
    const [mode, setMode] = useState<Mode>("password");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [msg, setMsg] = useState("");
    const navigate = useNavigate();

    // Close on Esc (modal only)
    useEffect(() => {
        if (!asModal || !open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose?.();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [asModal, open, onClose]);

    // Lock body scroll (modal only)
    useEffect(() => {
        if (!asModal || !open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [asModal, open]);

    function handleCodeChange(v: string) {
        const cleaned = v.replace(/\D/g, "").slice(0, 6); // digits only, max 6
        setCode(cleaned);
    }

    function handleCodePaste(e: React.ClipboardEvent<HTMLInputElement>) {
        e.preventDefault();
        const text = e.clipboardData.getData("text");
        handleCodeChange(text);
    }

    async function loginPassword() {
        setMsg("");
        const r = await apiFetch("/api/auth/login/password", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });

        const j = await r.json();
        if (!r.ok) return setMsg(j.error || "Login failed.");
        localStorage.setItem("token", j.token);
        navigate("/start", { replace: true });
    }

    async function requestCode() {
        setMsg("");
        const r = await apiFetch("/api/auth/request-code", {
            method: "POST",
            body: JSON.stringify({ email, purpose: "login" }),
        });

        if (!r.ok) return setMsg("Failed to send code.");
        setMsg("Code sent! Check your email.");
    }

    async function loginCode() {
        setMsg("");
        const r = await apiFetch("/api/auth/login/code", {
            method: "POST",
            body: JSON.stringify({ email, code }),
        });

        const j = await r.json();
        if (!r.ok) return setMsg(j.error || "Login failed.");
        localStorage.setItem("token", j.token);
        navigate("/start", { replace: true });
    }

    const Form = (
        <div className="login-form-wrap">
            <h3
                className="login-title"
                style={{ fontFamily: '"Alex Brush", cursive' }}
            >
                {title}
            </h3>

            {/* Segmented switch */}
            <div className="segment">
                <button
                    className={`segment-btn ${
                        mode === "password" ? "is-active" : ""
                    }`}
                    onClick={() => setMode("password")}
                >
                    Password
                </button>
                <button
                    className={`segment-btn ${
                        mode === "code" ? "is-active" : ""
                    }`}
                    onClick={() => setMode("code")}
                >
                    Email Code
                </button>
            </div>

            {/* Card */}
            <div className="login-card">
                <label className="label">Email</label>
                <input
                    className="input"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                {mode === "password" ? (
                    <>
                        <label className="label mt">Password</label>
                        <input
                            className="input"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        <button
                            className="btn-primary full mt"
                            onClick={loginPassword}
                            disabled={!email || !password}
                        >
                            Login
                        </button>
                    </>
                ) : (
                    <>
                        <div className="row mt">
                            <button
                                className="btn-secondary"
                                onClick={requestCode}
                                disabled={!email}
                            >
                                Send Code
                            </button>
                            <span className="hint">
                                We’ll email a 6-digit code
                            </span>
                        </div>

                        <label className="label mt">Verification Code</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            pattern="\d{6}"
                            className="input code"
                            placeholder="000000"
                            value={code}
                            onChange={(e) => handleCodeChange(e.target.value)}
                            onPaste={handleCodePaste}
                        />

                        <button
                            className="btn-primary full mt"
                            onClick={loginCode}
                            disabled={!email || !/^[0-9]{6}$/.test(code)}
                        >
                            Login with Code
                        </button>
                    </>
                )}

                {msg && <div className="msg mt">{msg}</div>}
            </div>
        </div>
    );

    if (!asModal) {
        return (
            <div className="login-page">
                <div className="page-inner">{Form}</div>
            </div>
        );
    }
    if (!open) return null;

    return (
        <div
            className="modal-backdrop"
            role="dialog"
            aria-modal="true"
            onClick={() => onClose?.()}
        >
            <div
                className="modal animate-pop"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="modal-close"
                    onClick={() => onClose?.()}
                    aria-label="Close"
                >
                    ✕
                </button>
                {Form}
            </div>
        </div>
    );
}
