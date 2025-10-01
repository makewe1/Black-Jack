import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Mode = "password" | "code";

export default function LoginPage({
    // Turn the page into a modal when true
    asModal = false,
    // Control whether the modal is visible (only used when asModal)
    open = true,
    // Called when user clicks backdrop, close button, or presses Esc (only when asModal)
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

    // ---- Modal-only UX niceties ----
    // Close on Esc
    useEffect(() => {
        if (!asModal || !open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose?.();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [asModal, open, onClose]);

    // Lock body scroll while open
    useEffect(() => {
        if (!asModal || !open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [asModal, open]);

    function handleCodeChange(v: string) {
        // digits only, cap at 6 (keeps leading zeros)
        const cleaned = v.replace(/\D/g, "").slice(0, 6);
        setCode(cleaned);
    }

    function handleCodePaste(e: React.ClipboardEvent<HTMLInputElement>) {
        e.preventDefault();
        const text = e.clipboardData.getData("text");
        handleCodeChange(text);
    }

    async function loginPassword() {
        setMsg("");
        const r = await fetch("/api/auth/login/password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const j = await r.json();
        if (!r.ok) return setMsg(j.error || "Login failed.");
        localStorage.setItem("token", j.token);
        navigate("/play", { replace: true });
    }

    async function requestCode() {
        setMsg("");
        const r = await fetch("/api/auth/request-code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, purpose: "login" }),
        });
        if (!r.ok) return setMsg("Failed to send code.");
        setMsg("Code sent! Check your email.");
    }

    async function loginCode() {
        setMsg("");
        const r = await fetch("/api/auth/login/code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, code }),
        });
        const j = await r.json();
        if (!r.ok) return setMsg(j.error || "Login failed.");
        localStorage.setItem("token", j.token);
        navigate("/play", { replace: true });
    }

    // ----- Core form UI (unchanged) -----
    const Form = (
        <div className="w-full">
            {/* Title */}
            <h3
                className="text-center text-[34px] md:text-[40px] leading-tight
             font-semibold tracking-tight mb-6 text-[#FFD700]
             drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                style={{ fontFamily: '"Alex Brush", cursive' }}
            >
                {title}
            </h3>
            {/* Segmented switch */}
            <div className="mb-5 flex items-center justify-center">
                <div className="inline-flex rounded-2xl bg-[#2a2731] p-1 border border-[#3b3645] shadow-inner">
                    <button
                        onClick={() => setMode("password")}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                            mode === "password"
                                ? "bg-gradient-to-b from-purple-400 to-purple-700 text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                                : "text-gray-300 hover:text-white"
                        }`}
                    >
                        Password
                    </button>
                    <button
                        onClick={() => setMode("code")}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                            mode === "code"
                                ? "bg-gradient-to-b from-purple-400 to-purple-700 text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                                : "text-gray-300 hover:text-white"
                        }`}
                    >
                        Email Code
                    </button>
                </div>
            </div>

            {/* Card */}
            <div className="mx-auto max-w-md rounded-2xl border border-[#3b3645] bg-[#1b1921] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_30px_rgba(0,0,0,0.6)]">
                {/* Email */}
                <label className="block text-sm text-gray-300 mb-1">
                    Email
                </label>
                <input
                    className="w-full rounded-xl bg-[#24222b] border border-[#3b3645] px-4 py-2 text-white outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                {mode === "password" ? (
                    <>
                        <label className="block text-sm text-gray-300 mt-4 mb-1">
                            Password
                        </label>
                        <input
                            className="w-full rounded-xl bg-[#24222b] border border-[#3b3645] px-4 py-2 text-white outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            placeholder="••••••••"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        <button
                            onClick={loginPassword}
                            disabled={!email || !password}
                            className="mt-5 w-full rounded-xl border-[3px] border-yellow-900
                         bg-gradient-to-b from-purple-400 to-purple-800
                         text-white font-extrabold tracking-wide uppercase py-3
                         shadow-[inset_0_2px_6px_rgba(0,0,0,0.6),0_6px_14px_rgba(0,0,0,0.6)]
                         enabled:hover:from-green-400 enabled:hover:to-green-700
                         disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Login
                        </button>
                    </>
                ) : (
                    <>
                        <div className="mt-4 flex items-center gap-2">
                            <button
                                onClick={requestCode}
                                disabled={!email}
                                className="px-3 py-2 rounded-lg text-sm font-semibold
                           bg-[#2f2b38] text-gray-200 border border-[#3b3645]
                           hover:bg-[#363146] transition enabled:hover:text-white
                           disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Send Code
                            </button>
                            <span className="text-xs text-gray-400">
                                We’ll email a 6-digit code
                            </span>
                        </div>

                        <label className="block text-sm text-gray-300 mt-4 mb-1">
                            Verification Code
                        </label>
                        <input
                            type="text" // keep leading zeros
                            inputMode="numeric" // mobile keypad
                            autoComplete="one-time-code"
                            maxLength={6} // hard cap
                            pattern="\d{6}" // HTML hint/validation
                            className="w-full rounded-xl bg-[#24222b] border border-[#3b3645] px-4 py-2
             text-white outline-none focus:ring-2 focus:ring-purple-500
             focus:border-purple-500 tracking-[0.4em]"
                            placeholder="000000"
                            value={code}
                            onChange={(e) => handleCodeChange(e.target.value)}
                            onPaste={handleCodePaste}
                        />

                        <button
                            onClick={loginCode}
                            disabled={!email || !/^[0-9]{6}$/.test(code)}
                            className="mt-5 w-full rounded-xl border-[3px] border-yellow-900
                         bg-gradient-to-b from-purple-400 to-purple-800
                         text-white font-extrabold tracking-wide uppercase py-3
                         shadow-[inset_0_2px_6px_rgba(0,0,0,0.6),0_6px_14px_rgba(0,0,0,0.6)]
                         enabled:hover:from-green-400 enabled:hover:to-green-700
                         disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Login with Code
                        </button>
                    </>
                )}

                {msg && (
                    <div className="mt-4 rounded-lg bg-[#2a2731] text-purple-200 px-3 py-2 text-sm border border-[#3b3645]">
                        {msg}
                    </div>
                )}
            </div>
        </div>
    );

    // ----- Render as full page OR as a popup modal -----
    if (!asModal) {
        // Original page rendering
        return (
            <div className="min-h-screen w-full grid place-items-center bg-gray-900 text-white">
                {Form}
            </div>
        );
    }

    // As modal: if not open, render nothing
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center
                 bg-black/70 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            onClick={() => onClose?.()} // backdrop click closes
        >
            <div
                className="relative w-[92vw] max-w-lg rounded-2xl bg-[#1e1e25] text-white p-6
                   shadow-2xl border border-gray-700
                   animate-[fadeIn_120ms_ease-out,scaleIn_120ms_ease-out]"
                onClick={(e) => e.stopPropagation()} // don't close when clicking the card
            >
                {/* Close button */}
                <button
                    onClick={() => onClose?.()}
                    aria-label="Close"
                    className="absolute right-3 top-3 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20"
                >
                    ✕
                </button>

                {Form}
            </div>

            {/* keyframes (can be moved to your global CSS) */}
            <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scaleIn { from { transform: scale(0.98) } to { transform: scale(1) } }
      `}</style>
        </div>
    );
}
