import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";

type Card = string; // e.g. "A-S", "10-H"
type Status = "playing" | "won" | "lost" | "tie";

type Game = {
  id: string;
  deck: Card[];
  dealerVisible: Card[];   // shown now
  dealerHidden: Card[];    // revealed on stay
  player: Card[];
  status: Status;
  reveal: boolean;
};

const app = express();
app.use(cors());
app.use(express.json());

const games = new Map<string, Game>();
const PORT = 5174;

function buildDeck(): Card[] {
  const values = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
  const suits  = ["C","D","H","S"];
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
  if (["J","Q","K"].includes(v)) return 10;
  return parseInt(v, 10);
}
function checkAce(card: Card): number {
  return card.startsWith("A") ? 1 : 0;
}
function reduceAce(sum: number, aces: number): number {
  while (sum > 21 && aces > 0) { sum -= 10; aces--; }
  return sum;
}
function score(hand: Card[]): number {
  let sum = 0, aces = 0;
  for (const c of hand) { sum += getValue(c); aces += checkAce(c); }
  return reduceAce(sum, aces);
}
function dealerShouldHit(dealer: Card[]): boolean {
  // match your “hit to 17” rule, no fancy soft-17 toggle (leanest)
  return score(dealer) < 17;
}

/* ---------- API ---------- */

// Start game: deal 2 to player, 1 visible + 1 hidden to dealer
app.post("/api/games/start", (_req, res) => {
  const id = randomUUID();
  const deck = buildDeck();
  const g: Game = {
    id, deck,
    dealerVisible: [deck.pop()!],
    dealerHidden: [deck.pop()!],
    player: [deck.pop()!, deck.pop()!],
    status: "playing",
    reveal: false
  };
  games.set(id, g);
  res.json({
    id,
    dealer: { visible: g.dealerVisible, count: score(g.dealerVisible) },
    player: { cards: g.player, count: score(g.player) },
    status: g.status,
    reveal: g.reveal
  });
});

// Player hits: add a card, auto-lose if bust
app.post("/api/games/:id/hit", (req, res) => {
  const g = games.get(req.params.id);
  if (!g) return res.status(404).json({ error: "Not found" });
  if (g.status !== "playing") return res.status(400).json({ error: "Game over" });

  g.player.push(g.deck.pop()!);
  if (score(g.player) > 21) { g.status = "lost"; g.reveal = true; }

  const dealerAll = [...g.dealerVisible, ...g.dealerHidden];
  res.json({
    id: g.id,
    dealer: g.reveal
      ? { visible: dealerAll, count: score(dealerAll) }
      : { visible: g.dealerVisible, count: score(g.dealerVisible) },
    player: { cards: g.player, count: score(g.player) },
    status: g.status,
    reveal: g.reveal
  });
});

// Player stays: reveal hidden; dealer draws to 17; decide result
app.post("/api/games/:id/stay", (req, res) => {
  const g = games.get(req.params.id);
  if (!g) return res.status(404).json({ error: "Not found" });

  g.reveal = true;
  let dealer = [...g.dealerVisible, ...g.dealerHidden];
  while (dealerShouldHit(dealer)) dealer.push(g.deck.pop()!);
  g.dealerVisible = dealer; g.dealerHidden = [];

  const ps = score(g.player), ds = score(dealer);
  g.status = ps > 21 ? "lost" : ds > 21 ? "won" : ps > ds ? "won" : ps < ds ? "lost" : "tie";

  res.json({
    id: g.id,
    dealer: { visible: dealer, count: ds },
    player: { cards: g.player, count: ps },
    status: g.status,
    reveal: g.reveal
  });
});

app.listen(PORT, () => console.log(`API http://localhost:${PORT}`));
