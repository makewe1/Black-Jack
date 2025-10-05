# Black Jack Server

An **Express + TypeScript** API that manages blackjack rounds, authentication, Gemini coaching, and historical analytics backed by **PostgreSQL** and transactional email delivery.

## Requirements

-   **Node.js** (ESM-compatible) with **npm**
-   **PostgreSQL** reachable via `DATABASE_URL` (SSL is preconfigured for hosted providers)

## Installation & Scripts

```bash
npm install
npm run dev      # watch-mode server
npm run build    # compile TypeScript
npm run start    # run compiled output
```

See server/package.json for the full command set.

## Environment Variables

| Variable                            | Purpose                                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`                      | Connection string for the PostgreSQL pool (**required**).                                        |
| `JWT_SECRET`                        | Signs and verifies JWT session tokens.                                                           |
| `GOOGLE_CLIENT_ID`                  | Validates Google ID tokens and links accounts.                                                   |
| `GOOGLE_API_KEY` / `GEMINI_API_KEY` | Credentials for Gemini-based AI hints.                                                           |
| `CORS_ORIGIN`                       | Comma-separated list of allowed browser origins.                                                 |
| `RESEND_API_KEY`, `MAIL_FROM`       | Enable Resend-powered email delivery; optional `MAIL_DRY_RUN` and `APP_NAME` customize behavior. |
| `PORT`                              | Overrides the default `5174` listen port.                                                        |

`.env` files are loaded automatically from either `server/.env` or the project root.

## Database Schema

The schema provisions **users**, **email verification codes**, and **game history** with supporting indexes and **Google OAuth metadata**.  
Apply the **base schema** and the **Google migration** before running in production.

## Gameplay Engine

`src/game.ts` encapsulates **deck shuffling**, **scoring**, **reshuffles**, and **chip settlement**, exposing helpers to:

-   Start new rounds
-   Process hits/stays
-   Sell chip bundles

All while maintaining **public-safe state objects** for client rendering.

## Authentication

`src/auth.ts` exposes routes for:

-   Requesting email codes
-   Verifying signups
-   Password logins
-   Google OAuth
-   Code-based logins

Upon success, it issues **JWT tokens**.  
The middleware supports **optional or required auth**, resolving users **lazily from the database** when needed.

## AI Coaching

**POST** `/api/games/:id/ai`  
Generates a prompt from the **live game state** and requests **Gemini** to respond with **HIT/STAND** guidance, returning a concise recommendation to the client.

## History & Persistence

Completed rounds trigger `persistHistory`, writing **bet sizes**, **card arrays**, and **counts** to the `game_history` table.  
**GET** `/api/history` paginates the stored rows with total counts for client consumption.

## API Surface

| Method   | Route                 | Description                                                     |
| -------- | --------------------- | --------------------------------------------------------------- |
| **POST** | `/api/games/start`    | Create or resume a game, validate bets, and deal opening hands. |
| **POST** | `/api/games/:id/hit`  | Draw the next card for the player.                              |
| **POST** | `/api/games/:id/stay` | Reveal the dealer, settle chips, and persist history.           |
| **POST** | `/api/games/:id/buy`  | Grant approved chip bundles between rounds.                     |
| **POST** | `/api/games/:id/ai`   | Return Gemini’s HIT/STAND advice.                               |
| **GET**  | `/api/history`        | Auth-protected pagination of past rounds.                       |
| **POST** | `/api/auth/*`         | Password, email code, and Google OAuth flows.                   |
| **GET**  | `/healthz`            | Health probe endpoint.                                          |

## Email Delivery

**Resend** is lazily instantiated to send **HTML/text verification codes**,  
with optional **dry-run logging** for development environments.
