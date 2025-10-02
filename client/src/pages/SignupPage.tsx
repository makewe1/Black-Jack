import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type Props = {
    asModal?: boolean;
    open?: boolean;
    onClose?: () => void;
    title?: string;
};

export default function SignupPage({
    asModal = false,
    open = true,
    onClose,
    title = "Sign Up",
}: Props) {
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [msg, setMsg] = useState("");
    const [sending, setSending] = useState(false);

    // resend timer
    const [secondsLeft, setSecondsLeft] = useState(0);
    const timerRef = useRef<number | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        if (secondsLeft <= 0) {
            if (timerRef.current) {
                window.clearInterval(timerRef.current);
                timerRef.current = null;
            }
            return;
        }
        if (!timerRef.current) {
            timerRef.current = window.setInterval(() => {
                setSecondsLeft((s) => Math.max(0, s - 1));
            }, 1000);
        }
        return () => {
            if (timerRef.current) {
                window.clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [secondsLeft]);

    function startCooldown() {
        setSecondsLeft(60);
    }
    function handleCodeChange(v: string) {
        const cleaned = v.replace(/\D/g, "").slice(0, 6); // digits only, max 6
        setCode(cleaned);
    }

    function handleCodePaste(e: React.ClipboardEvent<HTMLInputElement>) {
        e.preventDefault();
        const text = e.clipboardData.getData("text");
        handleCodeChange(text);
    }

    async function sendCode() {
        if (!email) return;
        setMsg("");
        setSending(true);
        try {
            const r = await fetch("/api/auth/request-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, purpose: "signup" }),
            });
            if (!r.ok) throw new Error("Failed to send code.");
            setMsg("Code sent! Check your email.");
            startCooldown();
        } catch (e: any) {
            setMsg(e.message || "Failed to send code.");
        } finally {
            setSending(false);
        }
    }

    async function completeSignup() {
        setMsg("");
        const r = await fetch("/api/auth/signup/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, code, password }),
        });
        const j = await r.json();
        if (!r.ok) {
            setMsg(j.error || "Signup failed.");
            return;
        }
        localStorage.setItem("token", j.token);
        navigate("/start", { replace: true });
    }

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

            {/* Card */}
            <div
                className="mx-auto max-w-[520px] rounded-2xl border border-[#3b3645]
                      bg-[#1b1921] p-6 md:p-7
                      shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_30px_rgba(0,0,0,0.6)]"
            >
                {/* Email + Send/Resend row */}
                <label className="block text-sm text-gray-300 mb-1">
                    Email
                </label>
                <div className="flex gap-3">
                    <input
                        className="flex-1 rounded-xl bg-[#24222b] border border-[#3b3645]
                       px-4 py-3 text-white outline-none focus:ring-2
                       focus:ring-purple-500 focus:border-purple-500"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <button
                        type="button"
                        onClick={sendCode}
                        disabled={!email || sending || secondsLeft > 0}
                        className="whitespace-nowrap min-w-[150px] rounded-xl border-[3px] border-yellow-900
                       bg-gradient-to-b from-purple-400 to-purple-800
                       text-white font-extrabold uppercase px-4 py-3
                       shadow-[inset_0_2px_6px_rgba(0,0,0,0.6),0_6px_14px_rgba(0,0,0,0.6)]
                       enabled:hover:from-green-400 enabled:hover:to-green-700
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {secondsLeft > 0
                            ? `Resend (${secondsLeft}s)`
                            : "Send Code"}
                    </button>
                </div>

                {/* Code */}
                <label className="block text-sm text-gray-300 mt-5 mb-1">
                    Verification Code
                </label>
                <input
                    type="text" // keep leading zeros
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    pattern="\d{6}"
                    className="w-full rounded-xl bg-[#24222b] border border-[#3b3645]
             px-4 py-3 text-white outline-none focus:ring-2
             focus:ring-purple-500 focus:border-purple-500 tracking-[0.4em]"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    onPaste={handleCodePaste}
                />

                {/* Password */}
                <label className="block text-sm text-gray-300 mt-4 mb-1">
                    Set Password
                </label>
                <input
                    className="w-full rounded-xl bg-[#24222b] border border-[#3b3645]
                     px-4 py-3 text-white outline-none focus:ring-2
                     focus:ring-purple-500 focus:border-purple-500"
                    placeholder="••••••••"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {/* Create account */}
                <button
                    onClick={completeSignup}
                    disabled={!/^[0-9]{6}$/.test(code) || !password || !email}
                    className="mt-5 w-full rounded-xl border-[3px] border-yellow-900
                     bg-gradient-to-b from-purple-400 to-purple-800
                     text-white font-extrabold tracking-wide uppercase py-3
                     shadow-[inset_0_2px_6px_rgba(0,0,0,0.6),0_6px_14px_rgba(0,0,0,0.6)]
                     enabled:hover:from-green-400 enabled:hover:to-green-700
                     disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    Create Account
                </button>

                {msg && (
                    <div className="mt-4 rounded-lg bg-[#2a2731] text-purple-200 px-3 py-2 text-sm border border-[#3b3645]">
                        {msg}
                    </div>
                )}
            </div>
        </div>
    );

    // Render: full page or modal
    if (!asModal) {
        return (
            <div className="min-h-screen w-full grid place-items-center bg-[#0f0e14] text-white p-6">
                <div className="w-[92vw] max-w-[600px]">{Form}</div>
            </div>
        );
    }
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div
                className="relative w-[92vw] max-w-[560px] md:max-w-[600px]
                   rounded-2xl bg-[#1e1e25]/95 text-white p-8
                   shadow-[0_20px_60px_rgba(0,0,0,0.7)]
                   border border-[#3b3645] backdrop-blur-md"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute right-3 top-3 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20"
                >
                    ✕
                </button>
                {Form}
            </div>
        </div>
    );
}
