// server/src/auth.ts
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { timingSafeEqual } from "node:crypto";
import { sendVerificationCode } from "./mailer.js";
import { query } from "./db.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME_SECRET";
const CODE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ---- DB helpers (Postgres) ----
async function getUserByEmail(email: string) {
    const { rows } = await query(
        "select id, email, password_hash from users where lower(email)=lower($1)",
        [email],
    );
    return rows[0] || null;
}

async function createUser(email: string, passwordHash: string) {
    await query("insert into users (email, password_hash) values ($1,$2)", [
        email,
        passwordHash,
    ]);
}

async function upsertEmailCode(
    email: string,
    code: string,
    purpose: "signup" | "login",
    ttlMs: number,
) {
    await query(
        `insert into email_codes (email, code, purpose, expires_at)
     values ($1,$2,$3, now() + ($4 || ' milliseconds')::interval)
     on conflict (email) do update
       set code = excluded.code,
           purpose = excluded.purpose,
           expires_at = excluded.expires_at`,
        [email, code, purpose, String(ttlMs)],
    );
}

async function consumeValidCode(
    email: string,
    code: string,
    purpose: "signup" | "login",
) {
    const { rows } = await query(
        "select code, purpose, expires_at from email_codes where email=$1",
        [email],
    );
    if (!rows[0]) return false;
    const rec = rows[0];
    if (rec.purpose !== purpose) return false;
    if (new Date(rec.expires_at).getTime() < Date.now()) return false;

    const A = Buffer.from(String(rec.code));
    const B = Buffer.from(String(code));
    const ok = A.length === B.length && timingSafeEqual(A, B);
    if (!ok) return false;

    await query("delete from email_codes where email=$1", [email]); // one-time use
    return true;
}

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
    await upsertEmailCode(email, code, purpose, CODE_TTL_MS);
    await sendVerificationCode(email, code, purpose);
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

    const user = await getUserByEmail(email);
    if (purpose === "login" && !user) {
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

  if (!isEmail(email) || !password || !isSixDigitCode(code)) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const ok = await consumeValidCode(email, code, "signup");
  if (!ok) {
    return res.status(400).json({ error: "Invalid or expired code" });
  }

  const exists = await getUserByEmail(email);
  if (exists) {
    return res.status(400).json({ error: "User exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await createUser(email, passwordHash);

  const token = issueJWT(email);
  res.json({ token });
});

// Login with password
router.post("/login/password", async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };

  if (!isEmail(email) || !password) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const user = await getUserByEmail(email);
  if (!user || !user.password_hash) {
    return res.status(400).json({ error: "No such user" });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(400).json({ error: "Wrong credentials" });
  }

  const token = issueJWT(email);
  res.json({ token });
});


// Login with email code
router.post("/login/code", async (req, res) => {
  const { email, code } = req.body as { email: string; code: string };

  if (!isEmail(email) || !isSixDigitCode(code)) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const user = await getUserByEmail(email);
  if (!user) return res.status(400).json({ error: "No such user" });

  const ok = await consumeValidCode(email, code, "login");
  if (!ok) return res.status(400).json({ error: "Invalid or expired code" });

  const token = issueJWT(email);
  res.json({ token });
});

export default router;
