import { useState } from "react";
import { useNavigate } from "react-router-dom"; 

export default function LoginPage() {
  const [mode, setMode] = useState<"password"|"code">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();             

  async function loginPassword() {
    setMsg("");
    const r = await fetch("/api/auth/login/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
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
      body: JSON.stringify({ email, purpose: "login" })
    });
    if (!r.ok) return setMsg("Failed to send code.");
    setMsg("Code sent! Check your email.");
  }

  async function loginCode() {
    setMsg("");
    const r = await fetch("/api/auth/login/code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code })
    });
    const j = await r.json();
    if (!r.ok) return setMsg(j.error || "Login failed.");
    localStorage.setItem("token", j.token);
    navigate("/play", { replace: true });       
  }

  return (
    <div className="auth">
      <h2>Login</h2>

      <div style={{ marginBottom: 8 }}>
        <button onClick={() => setMode("password")} disabled={mode==="password"}>Password</button>
        <button onClick={() => setMode("code")} disabled={mode==="code"}>Email Code</button>
      </div>

      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />

      {mode === "password" ? (
        <>
          <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <button onClick={loginPassword} disabled={!email || !password}>Login</button>
        </>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={requestCode} disabled={!email}>Send Code</button>
          </div>
          <input placeholder="Verification code" value={code} onChange={e=>setCode(e.target.value)} />
          <button onClick={loginCode} disabled={!email || !/^[0-9]{6}$/.test(code)}>Login with Code</button>
        </>
      )}

      <div className="msg">{msg}</div>
    </div>
  );
}
