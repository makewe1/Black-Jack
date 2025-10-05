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
    type PublicGame,
} from "./game.js";

import { optionalAuth, requireAuth } from "./auth-middleware.js";
import { fetchGameHistory, insertGameHistory, type GameOutcome } from "./db.js";
import type { Request } from "express";

import dotenv from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { GoogleGenAI } from "@google/genai";

// --- Load .env (supports server/.env or project-root/.env) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envCandidates = [
    resolve(__dirname, "..", ".env"), // /server/.env
    resolve(__dirname, "..", "..", ".env"), // project-root/.env
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

// --- Robust CORS setup ---
const allowList = (process.env.CORS_ORIGIN ?? "")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, "")) // trim + drop trailing slash
    .filter(Boolean);

const corsOptions: cors.CorsOptions = {
    origin(origin, cb) {
        if (!origin) return cb(null, true); // allow curl/server-to-server
        const o = origin.replace(/\/$/, "");
        if (allowList.includes(o)) return cb(null, true);
        cb(new Error(`CORS blocked: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false, // only set true if you need cookies
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // <-- handle preflights globally
// ---------------------------------

app.use(express.json());
app.use("/api/auth", authRouter);

const isCompletedStatus = (status: string): status is GameOutcome =>
    status === "won" || status === "lost" || status === "tie";

async function persistHistory(req: Request, game: PublicGame) {
    if (!req.user) return;
    if (!isCompletedStatus(game.status)) return;

    try {
        await insertGameHistory({
            userId: req.user.id,
            gameId: game.id,
            bet: typeof game.currentBet === "number" ? game.currentBet : 0,
            outcome: game.status,
            playerCards: Array.isArray(game.player.cards)
                ? [...game.player.cards]
                : [],
            dealerCards: Array.isArray(game.dealer.visible)
                ? [...game.dealer.visible]
                : [],
            playerCount:
                typeof game.player.count === "number" ? game.player.count : 0,
            dealerCount:
                typeof game.dealer.count === "number"
                    ? game.dealer.count
                    : null,
        });
    } catch (err) {
        console.error("Failed to persist game history", err);
    }
}

/**
 * POST /api/games/start
 */
app.post("/api/games/start", optionalAuth, (req, res) => {
    try {
        const { id, bet, seed, forceDealerGold } = req.body ?? {};
        const g = ensureGame({ id, seed });
        const pub = startRound(g, Number(bet), forceDealerGold);
        res.json(pub);
    } catch (e: any) {
        res.status(400).json({ error: e.message ?? "Bad request" });
    }
});

app.post("/api/games/:id/hit", optionalAuth, (req, res) => {
    try {
        const g = ensureGame({ id: req.params.id });
        const pub = svcHit(g);
        res.json(pub);
    } catch (e: any) {
        res.status(400).json({ error: e.message ?? "Bad request" });
    }
});

app.post("/api/games/:id/stay", optionalAuth, async (req, res) => {
    try {
        const g = ensureGame({ id: req.params.id });
        const pub = svcStay(g);
        await persistHistory(req, pub);
        res.json(pub);
    } catch (e: any) {
        const msg = String(e?.message || "");
        const isBadReq =
            msg.includes("Round in progress") ||
            msg.includes("Invalid bet") ||
            msg.includes("Insufficient funds");
        res.status(isBadReq ? 400 : 500).json({
            error: msg || "Internal error",
        });
    }
});

app.post("/api/games/:id/buy", optionalAuth, (req, res) => {
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
            return res
                .status(500)
                .json({ error: "Missing GOOGLE_API_KEY/GEMINI_API_KEY" });
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
        const recommendation = text.includes("HIT")
            ? "HIT"
            : text.includes("STAND")
            ? "STAND"
            : "No recommendation";

        res.json({ recommendation });
    } catch (_e) {
        res.status(500).json({ error: "Internal error" });
    }
});

app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.get("/api/history", requireAuth, async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page ?? 1) || 1);
        const pageSizeRaw = Number(req.query.pageSize ?? 10) || 10;
        const pageSize = Math.min(Math.max(pageSizeRaw, 1), 50);
        const offset = (page - 1) * pageSize;

        const { total, items } = await fetchGameHistory(req.user!.id, {
            limit: pageSize,
            offset,
        });
        const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);

        res.json({
            page,
            pageSize,
            total,
            totalPages,
            items: items.map((item) => ({
                id: item.id,
                gameId: item.gameId,
                bet: item.bet,
                outcome: item.outcome,
                playerCards: item.playerCards,
                dealerCards: item.dealerCards,
                playerCount: item.playerCount,
                dealerCount: item.dealerCount,
                resultTime: item.createdAt,
            })),
        });
    } catch (err) {
        console.error("Failed to load history", err);
        res.status(500).json({ error: "Failed to load history" });
    }
});

const PORT = Number(process.env.PORT ?? 5174);
app.listen(PORT, () => {
    // no console spam in prod
});
