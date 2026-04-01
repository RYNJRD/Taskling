import type { NextFunction, Request, Response } from "express";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import type { User } from "@shared/schema";
import { storage } from "./storage";
import { getEnv } from "./env";

const IS_DEV = process.env.NODE_ENV !== "production";

type AuthRequest = Request & {
  auth?: {
    uid: string;
    demoUserId?: number;
  };
  currentUser?: User;
};

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

/**
 * Decodes the payload segment of a JWT without cryptographic verification.
 * Handles both base64url and standard base64 encoding.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const segment = parts[1];

    // Convert base64url → standard base64 manually (most compatible)
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Tries to extract a Firebase UID from a decoded JWT payload.
 * Firebase ID tokens always carry the uid in `user_id` and `sub`.
 */
function extractUid(payload: Record<string, unknown>): string | null {
  for (const field of ["user_id", "sub", "uid"]) {
    const val = payload[field];
    if (typeof val === "string" && val.trim().length > 0) return val.trim();
  }
  return null;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  // ── Demo user shortcut (dev only) ──────────────────────────────────────────
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

  // ── Dev bypass: decode JWT locally, no Firebase Admin needed ───────────────
  if (IS_DEV) {
    const payload = decodeJwtPayload(token);

    if (payload) {
      const uid = extractUid(payload);
      if (uid) {
        req.auth = { uid };
        return next();
      }
      // Payload decoded but no uid — log and reject clearly
      console.warn("[auth] JWT payload decoded but no uid field found. Keys:", Object.keys(payload));
      return res.status(401).json({ message: "Could not extract uid from token" });
    }

    // Token isn't a valid JWT at all
    console.warn("[auth] Bearer token is not a valid JWT (couldn't decode payload). Token length:", token.length);
    return res.status(401).json({ message: "Bearer token is not a valid JWT" });
  }

  // ── Production: full Firebase Admin verification ───────────────────────────
  try {
    const decoded = await verifyBearerToken(token);
    req.auth = { uid: decoded.uid };
    return next();
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("environment variable")
        ? error.message
        : "Invalid or expired auth token";
    console.error("[auth] Token verification failed:", error instanceof Error ? error.message : error);
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
