// src/server.ts
import express from "express";
import cors from "cors";
import {
    ensureGame,
    startRound,
    hit as svcHit,
    stay as svcStay,
    buyChips as svcBuy,
} from "./game.js";

const app = express();
app.use(cors());
app.use(express.json());

/**
 * POST /api/games/start
 * body: { id?, bet, seed?: {playerGold?, dealerGold?}, forceDealerGold? }
 * - First ever round: uses seed.* to initialize bankrolls
 * - Every "new game": preserves playerGold, can reset dealerGold via forceDealerGold
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
        console.error("ERROR /api/games/start:", e?.stack || e);
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

app.post("/api/games/:id/buy", (req, res) => {
    try {
        const g = ensureGame({ id: req.params.id });
        const pub = svcBuy(g, Number(req.body?.amount));
        res.json(pub);
    } catch (e: any) {
        res.status(400).json({ error: e.message ?? "Bad request" });
    }
});

app.get("/healthz", (_req, res) => res.json({ ok: true }));

const PORT = Number(process.env.PORT ?? 5174);
app.listen(PORT, () => console.log(`API http://localhost:${PORT}`));
