import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { getEnv } from "./env";

const { Pool } = pg;
const env = getEnv();

const isProduction = env.NODE_ENV === "production" || !!process.env.VERCEL;

export const pool = new Pool({ 
  connectionString: env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  max: isProduction ? 10 : 20, // Limit connections on serverless
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export const db = drizzle(pool, { schema });

/**
 * Ensures the DB is responsive and OTP table exists
 */
export async function ensureOtpTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_verification_codes (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        firebase_uid VARCHAR(255) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        last_sent_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    return true;
  } catch (err) {
    console.error("[DB] OTP table init failed:", err);
    return false;
  }
}
