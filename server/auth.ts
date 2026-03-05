import type { NextFunction, Request, Response } from "express";
import { getApps, initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { storage } from "./storage";
import type { User } from "@shared/schema";

type AuthRequest = Request & {
  auth?: {
    uid: string;
  };
  currentUser?: User;
};

function initializeFirebaseAdmin() {
  if (getApps().length > 0) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
    return;
  }

  if (projectId) {
    initializeApp({
      credential: applicationDefault(),
      projectId,
    });
    return;
  }

  throw new Error(
    "Firebase admin credentials are not configured. Set FIREBASE_PROJECT_ID and either FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY or ADC credentials.",
  );
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing bearer token" });
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return res.status(401).json({ message: "Missing bearer token" });
  }

  try {
    initializeFirebaseAdmin();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Firebase auth misconfigured";
    return res.status(500).json({ message });
  }

  try {
    const decoded = await getAuth().verifyIdToken(token, true);
    req.auth = { uid: decoded.uid };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired auth token" });
  }
}

export async function attachCurrentUser(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.auth?.uid) {
    return res.status(401).json({ message: "Unauthorized" });
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
