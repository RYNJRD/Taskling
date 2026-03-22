import type { NextFunction, Request, Response } from "express";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import type { User } from "@shared/schema";
import { storage } from "./storage";
import { getEnv } from "./env";

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

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV !== "production") {
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

  try {
    const decoded = await verifyBearerToken(token);
    req.auth = { uid: decoded.uid };
    return next();
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("environment variable")
        ? error.message
        : "Invalid or expired auth token";
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
