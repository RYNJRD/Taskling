# Database Setup

Chorely uses PostgreSQL through Drizzle.

## Quick Start Options

### Neon
1. Create a project at `https://neon.tech`
2. Copy the Postgres connection string
3. Put it in `.env` as `DATABASE_URL`

### Supabase
1. Create a project at `https://supabase.com`
2. Open `Settings -> Database`
3. Copy the URI connection string
4. Put it in `.env` as `DATABASE_URL`

### Local PostgreSQL
1. Install PostgreSQL locally
2. Create a database:
   ```sql
   CREATE DATABASE chorely;
   ```
3. Set:
   `DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/chorely`

## Apply The Schema

Run:

```bash
npm run db:push
```

If you want generated Drizzle SQL files first:

```bash
npm run db:generate
```

## Common Issues

- `Missing DATABASE_URL`
  Copy `.env.example` to `.env` and fill it in.
- Firebase auth verification errors
  Make sure both server Firebase Admin env vars and client `VITE_FIREBASE_*` env vars are present.
- Drizzle command failures
  Restart your terminal after editing `.env` so the shell picks up the new values.
