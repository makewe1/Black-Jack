// src/game.ts
import { randomUUID as nodeRandomUUID, randomBytes } from "node:crypto";

/* ---------- Types ---------- */
export type Card = string; // e.g. "A-S"
export type GameStatus = "idle" | "playing" | "won" | "lost" | "tie";
export type Game = {
    id: string;
    deck: Card[];
    player: { cards: Card[] };
    dealer: { visible: Card[]; hidden: Card[] };
    reveal: boolean;
    status: GameStatus;
    playerGold: number;
    dealerGold: number;
    currentBet: number;
};
export type PublicGame = {
    id: string;
    player: { cards: Card[]; count: number };
    dealer: { visible: Card[]; hidden: number; count?: number };
    reveal: boolean;
    status: GameStatus;
    playerGold: number;
    dealerGold: number;
    currentBet: number;
    deckLeft: number;
};
const toPublic = (g: Game): PublicGame => {
    const playerCount = score(g.player.cards);
    const dealerVisibleCount = score(g.dealer.visible);
    const fullDealer = g.dealer.visible.concat(g.dealer.hidden);

    return {
        id: g.id,
        player: { cards: g.player.cards, count: playerCount },
        // show dealer’s visible total while playing; full total once revealed
        dealer: {
            visible: g.dealer.visible,
            hidden: g.dealer.hidden.length,
            count: g.reveal ? score(fullDealer) : dealerVisibleCount,
        },
        reveal: g.reveal,
        status: g.status,
        playerGold: g.playerGold,
        dealerGold: g.dealerGold,
        currentBet: g.currentBet,
        deckLeft: g.deck.length,
    };
};

/* ---------- In-memory store (swappable later) ---------- */
const games = new Map<string, Game>();

/* ---------- Deck helpers ---------- */
const SUITS = ["S", "H", "D", "C"];
const RANKS = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
];

function safeUUID(): string {
    // Node 14.17+ has crypto.randomUUID; older Node may not
    try {
        if (typeof nodeRandomUUID === "function") return nodeRandomUUID();
    } catch {}
    // Fallback: 32 hex chars (not RFC-4122 but perfectly fine as a unique id)
    return randomBytes(16).toString("hex");
}

function buildDeck(): Card[] {
    const deck: Card[] = [];
    for (const s of SUITS) for (const r of RANKS) deck.push(`${r}-${s}`);
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}
function drawOne(deck: Card[]): Card {
    if (!deck.length) throw new Error("Deck empty");
    return deck.pop()!;
}

/* ---------- Scoring ---------- */
function getValue(c: Card): number {
    const r = c.split("-")[0];
    if (r === "A") return 11;
    if (["K", "Q", "J", "10"].includes(r)) return 10;
    return Number(r);
}
function score(hand: Card[]): number {
    let sum = 0,
        aces = 0;
    for (const c of hand) {
        sum += getValue(c);
        if (c.startsWith("A-")) aces++;
    }
    while (sum > 21 && aces > 0) {
        sum -= 10;
        aces--;
    }
    return sum;
}
function dealerShouldHit(dealer: Card[]): boolean {
    return score(dealer) < 17; // tweak if you want soft-17 stand
}

/* ---------- Core orchestration ---------- */
export function ensureGame(opts?: {
    id?: string;
    seed?: { playerGold?: number; dealerGold?: number };
}): Game {
    if (opts?.id) {
        const g = games.get(opts.id);
        if (g) return g;
    }
    const g: Game = {
        id: safeUUID(),
        deck: buildDeck(),
        player: { cards: [] },
        dealer: { visible: [], hidden: [] },
        reveal: false,
        status: "idle",
        playerGold: opts?.seed?.playerGold ?? 1000,
        dealerGold: opts?.seed?.dealerGold ?? 2000,
        currentBet: 0,
    };
    games.set(g.id, g);
    return g;
}

export function startRound(
    g: Game,
    bet: number,
    forceDealerGold?: number,
): PublicGame {
    if (g.status === "playing") throw new Error("Round in progress");
    if (Number.isFinite(forceDealerGold)) g.dealerGold = forceDealerGold!;
    if (!Number.isInteger(bet) || bet <= 0) throw new Error("Invalid bet");

    const tableMax = Math.min(g.playerGold, g.dealerGold);
    const amount = Math.min(bet, tableMax);
    if (amount === 0) throw new Error("Insufficient funds");

    // reset per-round state
    if (g.deck.length < 15) g.deck = buildDeck(); // quick reshuffle policy
    g.player.cards = [];
    g.dealer.visible = [];
    g.dealer.hidden = [];
    g.reveal = false;
    g.status = "playing";
    g.currentBet = amount;

    // initial deal
    g.player.cards.push(drawOne(g.deck));
    g.dealer.visible.push(drawOne(g.deck));
    g.player.cards.push(drawOne(g.deck));
    g.dealer.hidden.push(drawOne(g.deck));

    return toPublic(g);
}

export function hit(g: Game): PublicGame {
    if (g.status !== "playing") throw new Error("Game over");
    g.player.cards.push(drawOne(g.deck));
    return toPublic(g);
}

export function stay(g: Game): PublicGame {
    if (g.status !== "playing") throw new Error("Game over");
    g.reveal = true;

    // Flip hole card(s) so the client actually receives the full dealer hand
    if (g.dealer.hidden.length) {
        g.dealer.visible.push(...g.dealer.hidden);
        g.dealer.hidden = [];
    }

    const fullDealer = () => g.dealer.visible; // now visible IS the full hand
    while (dealerShouldHit(fullDealer()))
        g.dealer.visible.push(drawOne(g.deck));

    const ps = score(g.player.cards);
    const ds = score(fullDealer());
    if (ps > 21 || (ds <= 21 && ds > ps)) {
        // player loses
        g.playerGold -= g.currentBet;
        g.dealerGold += g.currentBet;
        g.status = "lost";
    } else if (ds > 21 || ps > ds) {
        // player wins
        g.playerGold += g.currentBet;
        g.dealerGold -= g.currentBet;
        g.status = "won";
    } else {
        g.status = "tie";
    }
    return toPublic(g);
}

export function buyChips(g: Game, amount: number): PublicGame {
    const allowed = new Set([50, 100, 500, 1000, 5000, 10000]);
    if (!allowed.has(amount)) throw new Error("Invalid amount");
    if (g.status === "playing") throw new Error("Cannot buy during round");
    g.playerGold += amount;
    return toPublic(g);
}
