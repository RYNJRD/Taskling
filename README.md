# Chorely

Chorely is a mobile-first family chore game built with React, Vite, Express, PostgreSQL, Drizzle, and Firebase Authentication.

## Local Setup

1. Install dependencies.
   `npm install`
2. Copy the server env template.
   `Copy-Item .env.example .env`
3. Copy the client env template.
   `Copy-Item client/.env.example client/.env.local`
4. Fill in:
   - `DATABASE_URL`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - all `VITE_FIREBASE_*` values in `client/.env.local`
5. Push the schema.
   `npm run db:push`
6. Start the app.
   `npm run dev`

The server now validates required env vars early and fails with setup-focused messages if anything important is missing.

## Useful Scripts

- `npm run dev` starts the Express API and Vite-powered client together.
- `npm run check` runs TypeScript.
- `npm run build` builds the client and bundled server.
- `npm run verify` runs both typecheck and build.
- `npm run db:push` syncs the schema to your database.
- `npm run db:generate` generates Drizzle migration files.

## Auth Model

- Firebase handles identity on the client.
- The client sends Firebase ID tokens with API requests.
- The Express backend verifies those tokens with `firebase-admin`.
- App profiles are linked through `users.firebaseUid`.

## V1 Features

- Family creation and join flows with guided starter content
- Google sign-in, email/password sign-in, and email verification gating
- Dashboard focused on today, upcoming work, recent wins, activity, achievements, and monthly winners
- Real-time chat and family activity updates through Server-Sent Events
- Approval-required chores and rewards for parent trust
- Activity history, achievements, and monthly winner records
- Admin review queues, role management, invite sharing, chore creation, reward creation, and leaderboard visibility controls
- Expanded avatar customization with lightweight profile personalization

## Notes

- Demo setup is available only outside production.
- The app expects PostgreSQL. See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for database options.
- The schema now includes approvals, activity events, achievements, reward claims, and monthly winners. Check the `migrations/` folder before rolling out to an existing database.
