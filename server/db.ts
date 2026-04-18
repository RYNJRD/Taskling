import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import { getEnv } from "./env";

let poolInstance: Pool | null = null;

export function getPool(): Pool {
  if (poolInstance) return poolInstance;
  const env = getEnv();
  
  if (!env.DATABASE_URL || env.DATABASE_URL.length < 10) {
    throw new Error("Missing or invalid DATABASE_URL. Please check your environment variables.");
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
  return drizzle(getPool(), { schema });
}

// Exported for code that hasn't been updated to use getters yet
// We initialize these only when exported properties are accessed
export const pool = {
  query: (...args: any[]) => getPool().query(...args as any),
  connect: () => getPool().connect(),
  on: (event: string, listener: any) => getPool().on(event, listener),
  end: () => getPool().end(),
} as unknown as Pool;

export const db = new Proxy({} as any, {
  get: (target, prop) => {
    const d = getDb();
    return (d as any)[prop];
  }
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
