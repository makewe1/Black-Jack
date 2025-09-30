import { useState } from "react";
import { useNavigate } from "react-router-dom";



export default function SignupPage() {
    const [step, setStep] = useState<"request" | "verify">("request");
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [msg, setMsg] = useState("");
    const navigate = useNavigate();

    async function requestCode() {
        setMsg("");
        const r = await fetch("/api/auth/request-code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, purpose: "signup" }),
        });
        if (!r.ok) return setMsg("Failed to send code.");
        setMsg("Code sent! Check server console (dev).");
        setStep("verify");
    }

    async function completeSignup() {
        setMsg("");
        const r = await fetch("/api/auth/signup/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, code, password }),
        });
        const j = await r.json();
        if (!r.ok) return setMsg(j.error || "Signup failed.");

        localStorage.setItem("token", j.token);
        navigate("/play", { replace: true }); // jump to game page
    }

    return (
        <div className="auth">
            <h2>Sign Up</h2>
            {step === "request" ? (
                <>
                    <input
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <button onClick={requestCode} disabled={!email}>
                        Send Code
                    </button>
                </>
            ) : (
                <>
                    <div>
                        Email: <strong>{email}</strong>
                    </div>
                    <input
                        placeholder="Verification code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                    />
                    <input
                        placeholder="Set password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                        onClick={completeSignup}
                        disabled={!/^[0-9]{6}$/.test(code) || !password}
                    >
                        Create Account
                    </button>
                </>
            )}
            <div className="msg">{msg}</div>
        </div>
    );
}
