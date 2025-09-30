import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import authRoutes from "./auth.js";

type Card = string; // e.g. "A-S", "10-H"
type GameStatus = "idle" | "playing" | "won" | "lost" | "tie";

type Game = {
    id: string;
    deck: Card[];
    player: { cards: Card[] }; // <-- player.cards
    dealer: { visible: Card[]; hidden: Card[] }; // <-- dealer.visible / dealer.hidden
    reveal: boolean;
    status: GameStatus;

    // Betting
    playerGold: number;
    dealerGold: number;
    currentBet: number;
};

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

const games = new Map<string, Game>();
const PORT = 5174;

function buildDeck(): Card[] {
    const values = [
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
    const suits = ["C", "D", "H", "S"];
    const deck: Card[] = [];
    for (const s of suits) for (const v of values) deck.push(`${v}-${s}`);
    // Fisher–Yates
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function getValue(card: Card): number {
    const v = card.split("-")[0];
    if (v === "A") return 11;
    if (["J", "Q", "K"].includes(v)) return 10;
    return parseInt(v, 10);
}
function checkAce(card: Card): number {
    return card.startsWith("A") ? 1 : 0;
}
function reduceAce(sum: number, aces: number): number {
    while (sum > 21 && aces > 0) {
        sum -= 10;
        aces--;
    }
    return sum;
}
function score(hand: Card[]): number {
    let sum = 0,
        aces = 0;
    for (const c of hand) {
        sum += getValue(c);
        aces += checkAce(c);
    }
    return reduceAce(sum, aces);
}
function dealerShouldHit(dealer: Card[]): boolean {
    // match your “hit to 17” rule, no fancy soft-17 toggle (leanest)
    return score(dealer) < 17;
}

function draw(g: Game): Card {
    // Only reshuffle when the deck is empty
    if (g.deck.length === 0) {
        g.deck = buildDeck();
    }
    return g.deck.pop()!;
}

function publicState(g: Game) {
    const dealerAll = [...g.dealer.visible, ...g.dealer.hidden];
    return {
        id: g.id,
        status: g.status,
        reveal: g.reveal,
        dealer: g.reveal
            ? { visible: dealerAll, count: score(dealerAll) }
            : { visible: g.dealer.visible, count: score(g.dealer.visible) },
        player: { cards: g.player.cards, count: score(g.player.cards) },
        playerGold: g.playerGold,
        dealerGold: g.dealerGold,
        currentBet: g.currentBet,
        deckLeft: g.deck.length, // NEW
    };
}

function settle(
    g: Game,
    outcome:
        | "player_bust"
        | "dealer_bust"
        | "player_wins"
        | "dealer_wins"
        | "push"
        | "player_blackjack"
        | "dealer_blackjack",
) {
    const b = g.currentBet;
    if (outcome === "push") {
        g.status = "tie";
    } else if (
        outcome === "player_bust" ||
        outcome === "dealer_blackjack" ||
        outcome === "dealer_wins"
    ) {
        g.playerGold -= b;
        g.dealerGold += b;
        g.status = "lost";
    } else {
        g.playerGold += b;
        g.dealerGold -= b;
        g.status = "won";
    }
    g.currentBet = 0;
}

/* ---------- API ---------- */

// Start/Deal: body = { id?: string, bet: 10|50|100|500 }
app.post("/api/games/start", (req, res) => {
  const { id, bet } = req.body as { id?: string; bet: number };

  // get existing game or create a new one
  let g = id ? games.get(id) : undefined;
  if (!g) {
    g = {
      id: randomUUID(),
      deck: buildDeck(),
      player: { cards: [] },
      dealer: { visible: [], hidden: [] },
      reveal: false,
      status: "idle",
      playerGold: 1000,
      dealerGold: 1000,
      currentBet: 0,
    };
    games.set(g.id, g);
  }

  // cannot start if a round is already in progress
  if (g.status === "playing") {
    return res.status(400).json({ error: "Round in progress" });
  }

  // validate + CLAMP bet to what both can cover
  if (!Number.isInteger(bet) || bet <= 0) {
    return res.status(400).json({ error: "Invalid bet" });
  }
  const tableMax = Math.min(g.playerGold, g.dealerGold);
  const amount = Math.min(bet, tableMax);
  if (amount === 0) {
    return res.status(400).json({ error: "Insufficient funds" });
  }

  // deal using single-deck shoe (reshuffle only when empty)
  g.player.cards = [draw(g), draw(g)];
  g.dealer.visible = [draw(g)];
  g.dealer.hidden  = [draw(g)];
  g.reveal = false;
  g.status = "playing";
  g.currentBet = amount; // <- use clamped amount

  // Natural blackjack checks
  const ps = score(g.player.cards);
  const ds = score([...g.dealer.visible, ...g.dealer.hidden]);
  if (ps === 21 || ds === 21) {
    g.reveal = true;
    if (ps === 21 && ds !== 21) settle(g, "player_blackjack");
    else if (ds === 21 && ps !== 21) settle(g, "dealer_blackjack");
    else settle(g, "push");
  }

  res.json(publicState(g));
});


app.post("/api/games/:id/hit", (req, res) => {
    const g = games.get(req.params.id);
    if (!g) return res.status(404).json({ error: "Not found" });
    if (g.status !== "playing")
        return res.status(400).json({ error: "Game over" });

    g.player.cards.push(draw(g));

    if (score(g.player.cards) > 21) {
        g.reveal = true;
        settle(g, "player_bust");
    }

    res.json(publicState(g));
});

app.post("/api/games/:id/stay", (req, res) => {
    const g = games.get(req.params.id);
    if (!g) return res.status(404).json({ error: "Not found" });
    if (g.status !== "playing")
        return res.status(400).json({ error: "Game over" });

    g.reveal = true;

    let dealerAll = [...g.dealer.visible, ...g.dealer.hidden];
    while (dealerShouldHit(dealerAll)) {
        dealerAll.push(draw(g));

    }
    g.dealer.visible = dealerAll;
    g.dealer.hidden = [];

    const ps = score(g.player.cards);
    const ds = score(dealerAll);

    if (ds > 21) settle(g, "dealer_bust");
    else if (ps > ds) settle(g, "player_wins");
    else if (ps < ds) settle(g, "dealer_wins");
    else settle(g, "push");

    res.json(publicState(g));
});

// Buy chips (adjust playerGold; does not affect dealerGold)
app.post("/api/wallet/buy", (req, res) => {
  const { id, amount } = req.body as { id?: string; amount: number };

  // find or create a game session (reuse your existing initializer)
  let g = id ? games.get(id) : undefined;
  if (!g) {
    g = {
      id: randomUUID(),
      deck: buildDeck(),
      player: { cards: [] },
      dealer: { visible: [], hidden: [] },
      reveal: false,
      status: "idle",
      playerGold: 1000,
      dealerGold: 1000,
      currentBet: 0,
    };
    games.set(g.id, g);
  }

  const allowed = new Set([50, 100, 500, 1000, 5000, 10000]);
  if (!allowed.has(amount)) {
    return res.status(400).json({ error: "Invalid amount" });
  }
  if (g.status === "playing") {
    // optional: forbid buying mid-round; remove this check if you want to allow it
    return res.status(400).json({ error: "Cannot buy chips during an active round" });
  }

  g.playerGold += amount;
  return res.json(publicState(g));
});


app.listen(PORT, () => console.log(`API http://localhost:${PORT}`));
