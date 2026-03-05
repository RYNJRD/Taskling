# Chorely-2.0

## Local Firebase Env Setup

1. Copy `.env.example` to `client/.env.local`.
2. Add your Firebase web app config values to `client/.env.local`.
3. Restart the Vite dev server after changing env values.

Vite reads env files at startup, and only variables prefixed with `VITE_` are exposed to client-side code.

## Server Auth Setup

The API now verifies Firebase ID tokens server-side. Set these env vars for backend auth:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (use `\n` for newlines when stored in dashboards)
