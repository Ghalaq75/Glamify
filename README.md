# Glamify — Local Setup

Beauty booking platform for Riyadh. Full-stack JavaScript: React 18 + Vite + React Router on the frontend, Express + MongoDB/Mongoose on the backend.

## Prerequisites

- [Node.js](https://nodejs.org) v18 or higher (includes npm).

## Folder structure

```
glamify-project/
├── glamify/             # React frontend
├── api-server/          # Express backend
└── riyadh-districts/    # Shared library used by both
```

## Setup

### 1. Backend

Open a terminal in this folder and run:

```bash
cd api-server
npm install
cp .env.example .env
```

Open `.env` in any text editor and set:

- `MONGODB_URI` — your MongoDB Atlas connection string. **Leave it blank/commented out to use an in-memory database** that resets on every restart (great for local testing).
- `JWT_SECRET` — any long random string.

Start the backend:

```bash
npm run dev
```

You should see `Server running on port 8080`. Leave this terminal open.

> **Note for macOS users:** Port 8080 is used by default to avoid conflicting with Apple's AirPlay Receiver, which holds port 5000.

### 2. Frontend

Open a **second** terminal:

```bash
cd glamify
npm install
npm run dev
```

You should see `Local: http://localhost:5173/`.

### 3. Open the app

Visit **http://localhost:5173** in your browser.

The frontend automatically forwards all `/api/*` calls to the backend on port 8080, so you don't have to think about CORS.

## Demo accounts

All use password `password`:

- `client@glamify.sa` — client portal
- `provider@glamify.sa` — provider dashboard
- `admin@glamify.sa` — admin panel

(Demo accounts only exist when using the in-memory database. Atlas connections start with an empty database — register fresh accounts there.)

## Features included

- Role-based authentication (Client / Provider / Admin) with JWT
- Provider discovery, profiles, services, gallery, ratings & reviews
- Bookings (request, confirm, cancel, complete) with gift booking support
- Favourites with distance-aware ordering
- Geocoding helpers for "Near me" sorting
- Provider onboarding & approval workflow
- Admin moderation tools
- Modal-based Registration & Use Policy with read-to-enable agreement
- Riyadh districts dropdown for provider locations (see note below)

## ⚠️ Riyadh districts placeholder

The `riyadh-districts/data.json` file currently contains a single placeholder entry. While the placeholder is in place, **provider registration and provider profile location updates will return HTTP 503** with a clear error message — this is intentional and prevents bad data from being saved.

To enable provider location features, replace the contents of `riyadh-districts/data.json` with the real list of approved Riyadh districts (sourced from the Riyadh Municipality / Amanah GIS portal). The format expected:

```json
{
  "source": "Riyadh Municipality / Amanah GIS portal",
  "capturedAt": "2026-01-01",
  "districts": [
    { "id": "olaya", "englishName": "Al Olaya", "arabicName": "العليا" },
    { "id": "malaz", "englishName": "Al Malaz", "arabicName": "الملز" }
  ]
}
```

The dropdown and validation unlock automatically as soon as the placeholder entry is replaced — no code change required.

Client registration and the rest of the app work normally regardless of this placeholder.

## Common issues

**`Error: listen EADDRINUSE :::8080`** — another process is using port 8080. Either change `PORT` in `.env` (and the matching `target:` in `glamify/vite.config.js`), or stop the other process.

**Frontend shows API errors** — make sure the backend is running on port 8080 and that the proxy target in `glamify/vite.config.js` matches the backend port.

**Provider registration returns 503** — the Riyadh districts list is still a placeholder. See the "⚠️ Riyadh districts placeholder" section above.
