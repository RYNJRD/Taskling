type EnvConfig = {
  DATABASE_URL: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_CLIENT_EMAIL?: string;
  FIREBASE_PRIVATE_KEY?: string;
  NODE_ENV: string;
  PORT: number;
};

let cachedEnv: EnvConfig | null = null;

function readString(name: string, required = true): string | undefined {
  const value = process.env[name]?.trim();
  if (!value && required) {
    throw new Error(
      `Missing required environment variable ${name}. Copy .env.example to .env, fill it in, then restart the server.`,
    );
  }
  return value;
}

export function getEnv(): EnvConfig {
  if (cachedEnv) return cachedEnv;

  const env: EnvConfig = {
    DATABASE_URL: readString("DATABASE_URL")!,
    FIREBASE_PROJECT_ID: readString("FIREBASE_PROJECT_ID")!,
    FIREBASE_CLIENT_EMAIL: readString("FIREBASE_CLIENT_EMAIL", false),
    FIREBASE_PRIVATE_KEY: readString("FIREBASE_PRIVATE_KEY", false),
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: Number(process.env.PORT || "5000"),
  };

  if (!!env.FIREBASE_CLIENT_EMAIL !== !!env.FIREBASE_PRIVATE_KEY) {
    throw new Error(
      "Firebase admin credentials are incomplete. Set both FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY, or configure application default credentials.",
    );
  }

  cachedEnv = env;
  return env;
}
