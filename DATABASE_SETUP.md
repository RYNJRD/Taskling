# Database Setup Guide

Your app needs a PostgreSQL database to run. Here are your options:

## Option 1: Free Cloud Database (Recommended for Quick Start)

### Using Neon (Free tier available)
1. Go to [neon.tech](https://neon.tech)
2. Sign up for a free account
3. Create a new project
4. Copy the connection string (looks like: `postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/neondb`)
5. Paste it into `.env` as `DATABASE_URL`

### Using Supabase (Free tier available)
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the "Connection string" (URI format)
5. Paste it into `.env` as `DATABASE_URL`

### Using Railway (Free trial)
1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Add PostgreSQL
4. Copy the connection string from Variables tab
5. Paste it into `.env` as `DATABASE_URL`

## Option 2: Local PostgreSQL

### Install PostgreSQL locally
1. Download from [postgresql.org](https://www.postgresql.org/download/)
2. Install and remember your password
3. Create a database:
   ```bash
   psql -U postgres
   CREATE DATABASE chorely;
   \q
   ```
4. Update `.env`:
   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/chorely
   ```

## After Setting Up Database

1. Install dependencies (including dotenv):
   ```bash
   npm install
   ```

2. Push database schema:
   ```bash
   npm run db:push
   ```

3. Start the app:
   ```bash
   npm run dev
   ```

## Troubleshooting

### Error: "DATABASE_URL must be set"
- Make sure `.env` file exists in the root directory
- Check that `DATABASE_URL` is set in `.env`
- Restart the dev server after changing `.env`

### Connection errors
- Verify your connection string is correct
- Check if database is running (for local setup)
- Ensure firewall allows the connection
- For cloud databases, check if IP is whitelisted

### Schema errors
- Run `npm run db:push` to sync schema
- Check Drizzle documentation if issues persist
