type EnvConfig = {
  DATABASE_URL: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_CLIENT_EMAIL?: string;
  FIREBASE_PRIVATE_KEY?: string;
  NODE_ENV: string;
  PORT: number;
};

let cachedEnv: EnvConfig | null = null;

function readString(name: string, required = false): string | undefined {
  const value = process.env[name]?.trim();
  if (!value && required) {
    console.error(`[Env] Missing required environment variable ${name}`);
    return undefined;
  }
  return value;
}

export function getEnv(): EnvConfig {
  if (cachedEnv) return cachedEnv;

  const env: EnvConfig = {
    DATABASE_URL: readString("DATABASE_URL") || "",
    FIREBASE_PROJECT_ID: readString("FIREBASE_PROJECT_ID") || "",
    FIREBASE_CLIENT_EMAIL: readString("FIREBASE_CLIENT_EMAIL"),
    FIREBASE_PRIVATE_KEY: readString("FIREBASE_PRIVATE_KEY"),
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: Number(process.env.PORT || "5000"),
  };


  if (env.FIREBASE_CLIENT_EMAIL && !env.FIREBASE_PRIVATE_KEY) {
    console.error("[Env] Incomplete Firebase credentials: FIREBASE_CLIENT_EMAIL is set but FIREBASE_PRIVATE_KEY is missing.");
  } else if (!env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    console.error("[Env] Incomplete Firebase credentials: FIREBASE_PRIVATE_KEY is set but FIREBASE_CLIENT_EMAIL is missing.");
  }

  cachedEnv = env;
  return env;
}

