import type { NextFunction, Request, Response } from "express";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import type { User } from "../shared/schema";
import { storage } from "./storage";
import { getEnv } from "./env";
import * as crypto from "crypto";

const IS_DEV = process.env.NODE_ENV !== "production";

type AuthRequest = Request & {
  auth?: {
    uid: string;
    demoUserId?: number;
  };
  currentUser?: User;
};

// ── Firebase public-key cache ─────────────────────────────────────────────────
interface PublicKeyCache {
  keys: Record<string, string>; // kid → PEM public key
  expiresAt: number;
}
let pkCache: PublicKeyCache | null = null;

async function getFirebasePublicKeys(): Promise<Record<string, string>> {
  const now = Date.now();
  if (pkCache && now < pkCache.expiresAt) return pkCache.keys;

  const res = await fetch(
    "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",
  );
  if (!res.ok) throw new Error("Failed to fetch Firebase public keys");

  // Cache-Control header tells us how long to cache
  const cc = res.headers.get("cache-control") ?? "";
  const maxAgeMatch = cc.match(/max-age=(\d+)/);
  const ttl = maxAgeMatch ? parseInt(maxAgeMatch[1]) * 1000 : 3_600_000;

  const certs = (await res.json()) as Record<string, string>;
  pkCache = { keys: certs, expiresAt: now + ttl };
  return certs;
}

/**
 * Verifies a Firebase ID token using Firebase's published public keys.
 * This works without a Firebase Admin service account.
 */
async function verifyFirebaseToken(token: string): Promise<{ uid: string } | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Decode header to get the key id (kid)
    const headerJson = Buffer.from(
      parts[0].replace(/-/g, "+").replace(/_/g, "/") +
        "=".repeat((4 - (parts[0].length % 4)) % 4),
      "base64",
    ).toString("utf8");
    const header = JSON.parse(headerJson) as { kid?: string; alg?: string };

    if (header.alg !== "RS256" || !header.kid) return null;

    // Decode payload
    const payloadJson = Buffer.from(
      parts[1].replace(/-/g, "+").replace(/_/g, "/") +
        "=".repeat((4 - (parts[1].length % 4)) % 4),
      "base64",
    ).toString("utf8");
    const payload = JSON.parse(payloadJson) as Record<string, unknown>;

    // Extract uid
    const uid = extractUid(payload);
    if (!uid) return null;

    // Basic time checks
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === "number" && payload.exp < now) {
      console.warn("[auth] Firebase token expired");
      return null;
    }
    if (typeof payload.iat === "number" && payload.iat > now + 300) {
      console.warn("[auth] Firebase token issued in the future");
      return null;
    }

    // Fetch public keys and verify signature
    const certs = await getFirebasePublicKeys();
    const certPem = certs[header.kid];
    if (!certPem) {
      console.warn("[auth] No public key found for kid:", header.kid);
      return null;
    }

    const signingInput = `${parts[0]}.${parts[1]}`;
    const signature = Buffer.from(
      parts[2].replace(/-/g, "+").replace(/_/g, "/") +
        "=".repeat((4 - (parts[2].length % 4)) % 4),
      "base64",
    );

    const verify = crypto.createVerify("RSA-SHA256");
    verify.update(signingInput);
    const valid = verify.verify(certPem, signature);
    if (!valid) {
      console.warn("[auth] Firebase token signature invalid");
      return null;
    }

    return { uid };
  } catch (e) {
    console.warn("[auth] verifyFirebaseToken error:", e);
    return null;
  }
}

// ── Firebase Admin (requires service account creds) ──────────────────────────
function initializeFirebaseAdmin() {
  if (getApps().length > 0) return;

  const env = getEnv();
  const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (env.FIREBASE_CLIENT_EMAIL && privateKey) {
    initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
      projectId: env.FIREBASE_PROJECT_ID,
    });
    return;
  }

  initializeApp({
    credential: applicationDefault(),
    projectId: env.FIREBASE_PROJECT_ID,
  });
}

export async function verifyBearerToken(token: string) {
  initializeFirebaseAdmin();
  return getAuth().verifyIdToken(token, true);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function extractUid(payload: Record<string, unknown>): string | null {
  for (const field of ["user_id", "sub", "uid"]) {
    const val = payload[field];
    if (typeof val === "string" && val.trim().length > 0) return val.trim();
  }
  return null;
}

// ── Middleware ────────────────────────────────────────────────────────────────
export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  // Demo user shortcut (dev only)
  if (IS_DEV) {
    const demoUserId = Number(req.headers["x-demo-user-id"]);
    if (Number.isFinite(demoUserId) && demoUserId > 0) {
      req.auth = { uid: `demo:${demoUserId}`, demoUserId };
      return next();
    }
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing bearer token" });
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return res.status(401).json({ message: "Missing bearer token" });
  }

  // ── Step 1: Try public-key verification (works without service account) ────
  const verified = await verifyFirebaseToken(token);
  if (verified) {
    req.auth = { uid: verified.uid };
    return next();
  }

  // ── Step 2: Dev fallback — trust decoded payload (no signature check) ──────
  if (IS_DEV) {
    const payload = decodeJwtPayload(token);
    if (payload) {
      const uid = extractUid(payload);
      if (uid) {
        req.auth = { uid };
        return next();
      }
      console.warn("[auth] JWT payload decoded but no uid found. Keys:", Object.keys(payload));
      return res.status(401).json({ message: "Could not extract uid from token" });
    }
    console.warn("[auth] Bearer token is not a valid JWT. Length:", token.length);
    return res.status(401).json({ message: "Bearer token is not a valid JWT" });
  }

  // ── Step 3: Production — full Firebase Admin verification ─────────────────
  try {
    const decoded = await verifyBearerToken(token);
    req.auth = { uid: decoded.uid };
    return next();
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("environment variable")
        ? error.message
        : "Invalid or expired auth token";
    console.error("[auth] All auth methods failed:", error instanceof Error ? error.message : error);
    return res.status(message.startsWith("Missing required") ? 500 : 401).json({ message });
  }
}

export async function attachCurrentUser(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.auth?.uid) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.auth.demoUserId) {
    const demoUser = await storage.getUser(req.auth.demoUserId);
    if (!demoUser) {
      return res.status(404).json({ message: "Demo user no longer exists" });
    }
    req.currentUser = demoUser;
    return next();
  }

  const user = await storage.getUserByFirebaseUid(req.auth.uid);
  if (!user) {
    return res.status(404).json({ message: "User profile not found for this account" });
  }

  req.currentUser = user;
  return next();
}

export function getCurrentUser(req: AuthRequest): User {
  if (!req.currentUser) {
    throw new Error("Current user is not attached");
  }
  return req.currentUser;
}
