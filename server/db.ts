import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { getEnv } from "./env";

let poolInstance: Pool | null = null;
let dbInstance: any = null;

export function getPool(): Pool {
  if (poolInstance) return poolInstance;
  const env = getEnv();
  
  if (!env.DATABASE_URL) {
    throw new Error("Application configuration error: DATABASE_URL environment variable is missing. If you are the developer, please set this in your Vercel/environment settings.");
  }

  const isProduction = env.NODE_ENV === "production" || !!process.env.VERCEL;

  poolInstance = new Pool({ 
    connectionString: env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    max: isProduction ? 10 : 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  return poolInstance;
}

export function getDb() {
  if (dbInstance) return dbInstance;
  dbInstance = drizzle(getPool(), { schema });
  return dbInstance;
}

// Keep exported constants for compatibility, but make them lazy (using proxies or just updating usage)
export const pool = new Proxy({} as Pool, {
  get: (target, prop) => (getPool() as any)[prop],
});
export const db = new Proxy({} as any, {
  get: (target, prop) => (getDb() as any)[prop],
});

/**
 * Ensures the DB is responsive and OTP table exists
 */
export async function ensureOtpTable() {
  try {
    const p = getPool();
    await p.query(`
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
