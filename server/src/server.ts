// src/server.ts
import express from "express";
import cors from "cors";
import authRouter from "./auth.js";
import {
  ensureGame,
  startRound,
  hit as svcHit,
  stay as svcStay,
  buyChips as svcBuy,
} from "./game.js";

import dotenv from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { GoogleGenAI } from "@google/genai";

// --- Load .env (supports server/.env or project-root/.env) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envCandidates = [
  resolve(__dirname, "..", ".env"),      // /server/.env
  resolve(__dirname, "..", "..", ".env") // project-root/.env
];
for (const p of envCandidates) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}

// Prefer GOOGLE_API_KEY, fallback to GEMINI_API_KEY
const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI(API_KEY ? { apiKey: API_KEY } : {});

const app = express();
app.set("trust proxy", 1);
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN ?? "*").split(","),
    credentials: true,
  })
);
app.use(express.json());
app.use("/api/auth", authRouter);

/**
 * POST /api/games/start
 */
app.post("/api/games/start", (req, res) => {
  try {
    const { id, bet, seed, forceDealerGold } = req.body ?? {};
    const g = ensureGame({ id, seed });
    const pub = startRound(g, Number(bet), forceDealerGold);
    res.json(pub);
  } catch (e: any) {
    res.status(400).json({ error: e.message ?? "Bad request" });
  }
});

app.post("/api/games/:id/hit", (req, res) => {
  try {
    const g = ensureGame({ id: req.params.id });
    const pub = svcHit(g);
    res.json(pub);
  } catch (e: any) {
    res.status(400).json({ error: e.message ?? "Bad request" });
  }
});

app.post("/api/games/:id/stay", (req, res) => {
  try {
    const g = ensureGame({ id: req.params.id });
    const pub = svcStay(g);
    res.json(pub);
  } catch (e: any) {
    const msg = String(e?.message || "");
    const isBadReq =
      msg.includes("Round in progress") ||
      msg.includes("Invalid bet") ||
      msg.includes("Insufficient funds");
    res.status(isBadReq ? 400 : 500).json({ error: msg || "Internal error" });
  }
});

app.post("/api/games/:id/buy", (req, res) => {
  try {
    const g = ensureGame({ id: req.params.id });
    const pub = svcBuy(g, Number(req.body?.amount));
    res.json(pub);
  } catch (e: any) {
    res.status(400).json({ error: e.message ?? "Bad request" });
  }
});

/**
 * POST /api/games/:id/ai
 * Calls Gemini API to recommend HIT or STAND.
 */
app.post("/api/games/:id/ai", async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({ error: "Missing GOOGLE_API_KEY/GEMINI_API_KEY" });
    }

    const g = ensureGame({ id: req.params.id });
    if (!g || !g.player || !g.dealer) {
      return res.status(400).json({ error: "Invalid game state" });
    }

    const prompt = `You are a blackjack assistant.
Player cards: ${g.player.cards?.join(", ") || "none"}.
Dealer visible cards: ${g.dealer.visible?.join(", ") || "none"}.
Your response must be ONLY one word: "HIT" or "STAND".`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = (response.text ?? "").trim().toUpperCase();
    const recommendation =
      text.includes("HIT") ? "HIT" :
      text.includes("STAND") ? "STAND" :
      "No recommendation";

    res.json({ recommendation });
  } catch (_e) {
    res.status(500).json({ error: "Internal error" });
  }
});

app.get("/healthz", (_req, res) => res.json({ ok: true }));

const PORT = Number(process.env.PORT ?? 5174);
app.listen(PORT, () => {
  // no console spam in prod
});
