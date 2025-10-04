// server/src/auth.ts
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { timingSafeEqual } from "node:crypto";
import { sendVerificationCode } from "./mailer.js";

const router = express.Router();

// ---- In-memory stores (dev) ----
type User = { email: string; passwordHash?: string };
const users = new Map<string, User>();

type CodeRecord = {
    code: string;
    purpose: "signup" | "login";
    expiresAt: number;
};
const codes = new Map<string, CodeRecord>(); // key: email

const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME_SECRET";
const CODE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function makeCode() {
    return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

function isEmail(s = "") {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function issueJWT(email: string) {
    return jwt.sign({ email }, JWT_SECRET, { expiresIn: "2h" });
}

// ---- Helpers ----
async function saveCode(email: string, purpose: "signup" | "login") {
    const code = makeCode();
    const rec = { code, purpose, expiresAt: Date.now() + CODE_TTL_MS };
    codes.set(email, rec);

    // SEND the email
    await sendVerificationCode(email, code, purpose);

    return true;
}

function consumeValidCode(
    email: string,
    code: string,
    purpose: "signup" | "login",
) {
    const rec = codes.get(email);
    if (!rec) return false;
    if (rec.purpose !== purpose) return false;
    if (!isSixDigitCode(code)) return false;
    if (rec.expiresAt < Date.now()) return false;
    if (!safeEq(rec.code, code)) return false; // exact match required
    codes.delete(email); // one-time use
    return true;
}

function isSixDigitCode(s: string) {
    return /^[0-9]{6}$/.test(s);
}
function safeEq(a: string, b: string) {
    const A = Buffer.from(a);
    const B = Buffer.from(b);
    return A.length === B.length && timingSafeEqual(A, B);
}

// ---- Routes ----

// Request code (for both signup and login)
router.post("/request-code", async (req, res) => {
    const { email, purpose } = req.body as {
        email: string;
        purpose: "signup" | "login";
    };

    if (!isEmail(email) || !["signup", "login"].includes(purpose)) {
        return res.status(400).json({ error: "Bad request" });
    }

    const exists = users.has(email);
    if (purpose === "login" && !exists) {
        return res.status(400).json({ error: "No such user" });
    }

    try {
        await saveCode(email, purpose); // now sends a real email
        return res.json({ ok: true });
    } catch (err) {
        console.error("[MAIL] failed to send code:", err);
        return res.status(502).json({ error: "Email sending failed" });
    }
});
// Signup: verify code + set password (one step after user gets code)
router.post("/signup/verify", async (req, res) => {
    const { email, code, password } = req.body as {
        email: string;
        code: string;
        password: string;
    };
    if (!email || !password || !isSixDigitCode(code)) {
        return res.status(400).json({ error: "Invalid request" });
    }
    if (!consumeValidCode(email, code, "signup")) {
        return res.status(400).json({ error: "Invalid or expired code" });
    }
    if (users.has(email)) return res.status(400).json({ error: "User exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    users.set(email, { email, passwordHash });
    const token = issueJWT(email);
    res.json({ token });
});

// Login with password
router.post("/login/password", async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };
    const user = users.get(email);
    if (!user || !user.passwordHash)
        return res.status(400).json({ error: "No such user" });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: "Wrong credentials" });
    const token = issueJWT(email);
    res.json({ token });
});

// Login with email code
router.post("/login/code", (req, res) => {
    const { email, code } = req.body as { email: string; code: string };
    const user = users.get(email);
    if (!user) return res.status(400).json({ error: "No such user" });
    if (!consumeValidCode(email, code, "login"))
        return res.status(400).json({ error: "Invalid code" });
    const token = issueJWT(email);
    res.json({ token });
});

export default router;
