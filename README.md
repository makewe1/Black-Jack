# Black Jack

**Black Jack** is a full-stack blackjack platform that pairs a **Vite-powered React SPA** with an **Express + TypeScript API** to deliver AI-guided gameplay, resilient guest sessions, and multi-channel authentication for casual and registered players.

![Black Jack Banner](client/public/bg-coin.png)

## Architecture

### **Client (`client/`)**

A **React Router SPA** with dedicated routes for onboarding, play, history, and authentication, plus a **Three.js-powered gold coin hero** element that reinforces the brand.

### **Server (`server/`)**

An **Express API** that orchestrates blackjack rounds, enforces authentication, proxies Gemini hints, and persists history to **PostgreSQL** via a typed data layer and mailer utilities.

### **Shared Persistence**

Authenticated history is written to **PostgreSQL tables**, while **guest mode** relies on **local storage** to remember bankrolls, active games, and offline results for a seamless return experience.

## Core Features

-   **Deterministic blackjack engine** – In-memory deck management, scoring, reshuffles, and chip settlement encapsulated in TypeScript for predictable results across rounds.
-   **Guest and authenticated continuity** – Local storage scaffolding ensures guests resume bankrolls and tables, while authenticated sessions persist via tokens and server history records.
-   **Gemini-powered coaching** – A dedicated `/api/games/:id/ai` endpoint requests hit/stand guidance, surfaced contextually in the bottom action bar with visual cues.
-   **Multi-channel authentication** – Password, email code, and Google OAuth logins share JWT issuance and verification, with UI flows for modal or page-based entry.
-   **History tracking** – Completed rounds capture bets, hands, counts, and outcomes for paginated review, supporting both server-backed and offline guest histories.

## Getting Started

### Install Dependencies

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### Run Locally

```bash
# API (TypeScript watch)
cd server
npm run dev

# Client (Vite dev server)
cd ../client
npm run dev
```

### Build for Production

```bash
# API
cd server
npm run build
npm run start

# Client
cd ../client
npm run build
npm run preview
```

See each workspace’s package.json for the full script catalog.

## Environment Configuration

Set these variables before booting the server:

-   **DATABASE_URL** – PostgreSQL connection string; SSL is enabled for hosted deployments.
-   **JWT_SECRET** – Symmetric key for signing and verifying session tokens.
-   **GOOGLE_CLIENT_ID** – OAuth client used to validate Google ID tokens and link accounts.
-   **GOOGLE_API_KEY / GEMINI_API_KEY** – Gemini credentials for AI recommendations (either name is accepted).
-   **CORS_ORIGIN** – Comma-separated allowlist for browser origins interacting with the API.
-   **RESEND_API_KEY, MAIL_FROM** – Required to send verification emails; optional `MAIL_DRY_RUN` and `APP_NAME` adjust delivery behavior.
-   **PORT** – Overrides the Express listen port (defaults to `5174`).

Client-side configuration lives in `client/.env`:

-   **VITE_API_BASE** – Base URL for all API requests.
-   **VITE_GOOGLE_CLIENT_ID** – Enables Google One Tap login in the UI.

## Database

Apply the base schema, then optional migrations, to provision **users**, **email codes**, and **history** tables with supporting indexes and **Google OAuth metadata**.

## API Overview

| Route                          | Description                                                                   |
| ------------------------------ | ----------------------------------------------------------------------------- |
| **POST** `/api/games/start`    | Start or resume a round, enforce bet limits, and deal opening hands.          |
| **POST** `/api/games/:id/hit`  | Draw an additional player card, validating round state.                       |
| **POST** `/api/games/:id/stay` | Resolve the round, settle chips, and persist history for authenticated users. |
| **POST** `/api/games/:id/buy`  | Purchase approved chip bundles between rounds.                                |
| **POST** `/api/games/:id/ai`   | Request Gemini advice (**HIT/STAND**) for the current hand.                   |
| **GET** `/api/history`         | JWT-protected, paginated history feed for completed rounds.                   |
| **POST** `/api/auth/*`         | Email, password, and Google login endpoints share JWT issuance.               |
| **GET** `/healthz`             | Lightweight readiness probe.                                                  |

## Project Scripts

| Workspace  | Script            | Purpose                                 |
| ---------- | ----------------- | --------------------------------------- |
| **server** | `npm run dev`     | Watch-mode API server via tsx.          |
| **server** | `npm run build`   | Emit compiled output to `dist/`.        |
| **server** | `npm run start`   | Run the compiled bundle.                |
| **client** | `npm run dev`     | Launch Vite with HMR and proxying.      |
| **client** | `npm run build`   | Type-check and build production assets. |
| **client** | `npm run lint`    | Run ESLint across the SPA.              |
| **client** | `npm run preview` | Serve the built bundle locally.         |
