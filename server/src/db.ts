// server/src/db.ts
import { Pool } from "pg";
export type GameOutcome = "won" | "lost" | "tie";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL missing");

// Render Postgres usually requires SSL
export const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export type GameHistoryInsert = {
    userId: string;
    gameId?: string | null;
    bet: number;
    outcome: GameOutcome;
    playerCards: string[];
    dealerCards: string[];
    playerCount: number;
    dealerCount: number | null;
};

export type GameHistoryRow = {
    id: string;
    userId: string;
    gameId: string | null;
    bet: number;
    outcome: GameOutcome;
    playerCards: string[];
    dealerCards: string[];
    playerCount: number;
    dealerCount: number | null;
    createdAt: string;
};

const parseCards = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.map((v) => String(v));
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed)
                ? parsed.map((v: unknown) => String(v))
                : [];
        } catch {
            return [];
        }
    }
    if (value && typeof value === "object") {
        // Unexpected shape; best effort to coerce arrays nested under "cards"
        if (Array.isArray((value as { cards?: unknown }).cards)) {
            return ((value as { cards: unknown[] }).cards || []).map((v) =>
                String(v),
            );
        }
    }
    return [];
};

export async function insertGameHistory(entry: GameHistoryInsert) {
    await query(
        `insert into game_history
      (user_id, game_id, bet, outcome, player_cards, dealer_cards, player_count, dealer_count)
     values ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8)`,
        [
            entry.userId,
            entry.gameId ?? null,
            entry.bet,
            entry.outcome,
            JSON.stringify(entry.playerCards ?? []),
            JSON.stringify(entry.dealerCards ?? []),
            entry.playerCount,
            entry.dealerCount,
        ],
    );
}

export async function fetchGameHistory(
    userId: string,
    options: { limit?: number; offset?: number } = {},
): Promise<{ total: number; items: GameHistoryRow[] }> {
    const rawLimit = Number.isFinite(options.limit)
        ? Number(options.limit)
        : 20;
    const limit = Math.min(Math.max(rawLimit, 1), 50);
    const offset = Math.max(0, options.offset ?? 0);

    const [{ rows }, countRes] = await Promise.all([
        query(
            `select id, user_id, game_id, bet, outcome, player_cards, dealer_cards,
              player_count, dealer_count, created_at
         from game_history
        where user_id = $1
        order by created_at desc
        limit $2 offset $3`,
            [userId, limit, offset],
        ),
        query(
            `select count(*)::int as count from game_history where user_id = $1`,
            [userId],
        ),
    ]);

    const total = Number(countRes.rows[0]?.count ?? 0);
    const items: GameHistoryRow[] = rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        gameId: row.game_id ?? null,
        bet: Number(row.bet) || 0,
        outcome: row.outcome,
        playerCards: parseCards(row.player_cards),
        dealerCards: parseCards(row.dealer_cards),
        playerCount: Number(row.player_count) || 0,
        dealerCount:
            row.dealer_count === null || row.dealer_count === undefined
                ? null
                : Number(row.dealer_count),
        createdAt: new Date(row.created_at).toISOString(),
    }));

    return { total, items };
}
