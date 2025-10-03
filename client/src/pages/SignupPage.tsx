import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/SignupPage.css";

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
    <div className="signup-form-wrap">
      <h3 className="signup-title" style={{ fontFamily: '"Alex Brush", cursive' }}>
        {title}
      </h3>

      <div className="signup-card">
        <label className="label">Email</label>
        <div className="row">
          <input
            className="input"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="button"
            onClick={sendCode}
            disabled={!email || sending || secondsLeft > 0}
            className="btn-primary"
          >
            {secondsLeft > 0 ? `Resend (${secondsLeft}s)` : "Send Code"}
          </button>
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

        <label className="label mt">Set Password</label>
        <input
          className="input"
          placeholder="••••••••"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={completeSignup}
          disabled={!/^[0-9]{6}$/.test(code) || !password || !email}
          className="btn-primary full mt"
        >
          Create Account
        </button>

        {msg && <div className="msg">{msg}</div>}
      </div>
    </div>
  );

  if (!asModal) {
    return (
      <div className="page">
        <div className="page-inner">{Form}</div>
      </div>
    );
  }
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close" className="modal-close">
          ✕
        </button>
        {Form}
      </div>
    </div>
  );
}
