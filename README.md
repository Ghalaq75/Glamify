# Glamify

Beauty booking platform for Riyadh.

## Structure

```
glamify-project/
├── frontend/    React 18 + Vite client
├── backend/     Express + MongoDB server
└── shared/
    └── riyadh-districts/   Shared district data (used by both)
```

## Setup

### Backend
```bash
cd backend
npm install
# copy .env.example → .env and fill in values
npm run dev        # starts on PORT (default 3000)
```

### Frontend
```bash
cd frontend
npm install
npm run dev        # starts Vite dev server
```

## Required environment variables (backend/.env)

| Variable | Description |
|---|---|
| MONGODB_URI | MongoDB connection string (leave blank to use in-memory) |
| JWT_SECRET | Secret key for JWT signing |
| SENDGRID_API_KEY | SendGrid API key for email |
| SENDGRID_FROM_EMAIL | Verified sender email address |
| STRIPE_SECRET_KEY | Stripe secret key |
| STRIPE_WEBHOOK_SECRET | Stripe webhook signing secret |
| PORT | Port for the API server (default 3000) |
| NODE_ENV | `development` or `production` |
