import type { Express, Response } from "express";
import type { Server } from "http";
import { randomUUID } from "crypto";
import { z } from "zod";
import { api } from "@shared/routes";
import { attachCurrentUser, getCurrentUser, requireAuth, verifyBearerToken } from "./auth";
import { storage } from "./storage";
import { canApprove, canManageFamily, ensureSameFamily } from "./permissions";
import { completeChore, reviewChoreSubmission } from "./services/chore-service";
import { claimReward, reviewRewardClaim } from "./services/reward-service";
import { createMessage } from "./services/message-service";
import { getFamilyOnboardingChecklist } from "./services/family-service";
import { ensurePreviousMonthWinners } from "./services/monthly-winners-service";
import { recordActivity } from "./services/activity-service";
import { notifyNewParentSignup } from "./services/email-service";
import { publishFamilyEvent, registerSseClient, removeSseClient } from "./realtime";

function parseId(value: unknown): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string" && typeof raw !== "number") return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function forbidden(res: Response, message = "Forbidden") {
  return res.status(403).json({ message });
}

function handleError(res: Response, error: unknown) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ message: error.errors[0]?.message || "Invalid request" });
  }

  return res.status(500).json({
    message: error instanceof Error ? error.message : "Internal server error",
  });
}

function sameFamilyOrReject(res: Response, currentFamilyId: number | null | undefined, targetFamilyId: number | null | undefined) {
  if (!ensureSameFamily(currentFamilyId, targetFamilyId)) {
    forbidden(res);
    return false;
  }
  return true;
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Dev-only debug endpoint — shows token decode result without Firebase Admin
  if (process.env.NODE_ENV !== "production") {
    app.get("/api/debug/auth", (req, res) => {
      const authHeader = req.headers.authorization ?? "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
      if (!token) return res.json({ status: "no_token", IS_DEV: true, NODE_ENV: process.env.NODE_ENV });

      try {
        const parts = token.split(".");
        if (parts.length !== 3) return res.json({ status: "not_a_jwt", parts: parts.length });
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
        const payload = JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
        const uid = payload.user_id ?? payload.sub ?? payload.uid ?? null;
        return res.json({ status: "ok", uid, keys: Object.keys(payload), IS_DEV: true, NODE_ENV: process.env.NODE_ENV });
      } catch (e) {
        return res.json({ status: "decode_error", error: String(e) });
      }
    });
  }

  app.post(api.families.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.families.create.input.parse(req.body);
      const family = await storage.createFamily(input);
      return res.status(201).json(family);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid request" });
      }
      return res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  app.get(api.families.get.path, requireAuth, attachCurrentUser, async (req, res) => {
    const currentUser = getCurrentUser(req);
    const familyId = parseId(req.params.id);
    if (!familyId) return res.status(400).json({ message: "Invalid family id" });
    if (!sameFamilyOrReject(res, currentUser.familyId, familyId)) return;

    const family = await storage.getFamily(familyId);
    if (!family) return res.status(404).json({ message: "Family not found" });
    return res.json(family);
  });

  app.get(api.families.getByCode.path, requireAuth, async (req, res) => {
    const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
    const family = await storage.getFamilyByCode(code);
    if (!family) return res.status(404).json({ message: "Family not found" });
    return res.json(family);
  });

  app.get(api.families.getUsers.path, requireAuth, attachCurrentUser, async (req, res) => {
    const currentUser = getCurrentUser(req);
    const familyId = parseId(req.params.id);
    if (!familyId) return res.status(400).json({ message: "Invalid family id" });
    if (!sameFamilyOrReject(res, currentUser.familyId, familyId)) return;
    return res.json(await storage.getFamilyUsers(familyId));
  });

  app.get(api.families.getChores.path, requireAuth, attachCurrentUser, async (req, res) => {
    const currentUser = getCurrentUser(req);
    const familyId = parseId(req.params.id);
    if (!familyId) return res.status(400).json({ message: "Invalid family id" });
    if (!sameFamilyOrReject(res, currentUser.familyId, familyId)) return;
    return res.json(await storage.getFamilyChores(familyId, currentUser.id));
  });

  app.get(api.families.getLeaderboard.path, requireAuth, attachCurrentUser, async (req, res) => {
    const currentUser = getCurrentUser(req);
    const familyId = parseId(req.params.id);
    if (!familyId) return res.status(400).json({ message: "Invalid family id" });
    if (!sameFamilyOrReject(res, currentUser.familyId, familyId)) return;
    return res.json(await storage.getFamilyUsers(familyId));
  });

  app.get(api.families.getInviteInfo.path, requireAuth, attachCurrentUser, async (req, res) => {
    const currentUser = getCurrentUser(req);
    const familyId = parseId(req.params.id);
    if (!familyId) return res.status(400).json({ message: "Invalid family id" });
    if (!sameFamilyOrReject(res, currentUser.familyId, familyId)) return;
    if (!canManageFamily(currentUser)) return forbidden(res, "Admins only");

    const family = await storage.getFamily(familyId);
    if (!family) return res.status(404).json({ message: "Family not found" });
    return res.json({
      inviteCode: family.inviteCode,
      inviteUrl: `${req.protocol}://${req.get("host")}/join/${family.inviteCode}`,
    });
  });

  app.get(api.families.getActivity.path, requireAuth, attachCurrentUser, async (req, res) => {
    const currentUser = getCurrentUser(req);
    const familyId = parseId(req.params.id);
    if (!familyId) return res.status(400).json({ message: "Invalid family id" });
    if (!sameFamilyOrReject(res, currentUser.familyId, familyId)) return;
    return res.json(await storage.getActivity(familyId));
  });

  app.get(api.families.getMonthlyWinners.path, requireAuth, attachCurrentUser, async (req, res) => {
    const currentUser = getCurrentUser(req);
    const familyId = parseId(req.params.id);
    if (!familyId) return res.status(400).json({ message: "Invalid family id" });
    if (!sameFamilyOrReject(res, currentUser.familyId, familyId)) return;
    await ensurePreviousMonthWinners(familyId);
    return res.json(await storage.getMonthlyWinners(familyId));
  });

  app.get(api.families.getAchievements.path, requireAuth, attachCurrentUser, async (req, res) => {
    const currentUser = getCurrentUser(req);
    const familyId = parseId(req.params.id);
    if (!familyId) return res.status(400).json({ message: "Invalid family id" });
    if (!sameFamilyOrReject(res, currentUser.familyId, familyId)) return;
    return res.json(await storage.getAchievements(familyId));
  });

  app.get(api.families.getOnboarding.path, requireAuth, attachCurrentUser, async (req, res) => {
    const currentUser = getCurrentUser(req);
    const familyId = parseId(req.params.id);
    if (!familyId) return res.status(400).json({ message: "Invalid family id" });
    if (!sameFamilyOrReject(res, currentUser.familyId, familyId)) return;
    return res.json({ checklist: await getFamilyOnboardingChecklist(familyId) });
  });

  app.post(api.users.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.users.create.input.parse(req.body);
      const tokenUid = (req as any).auth?.uid as string | undefined;
      if (!tokenUid) return res.status(401).json({ message: "Unauthorized" });
      if (input.firebaseUid !== tokenUid) return forbidden(res, "firebaseUid must match authenticated user");

      const existing = input.firebaseUid ? await storage.getUserByFirebaseUid(input.firebaseUid) : undefined;
      if (existing) return res.status(409).json({ message: "Account already has a profile", user: existing });

      const user = await storage.createUser(input);
      if (user.familyId) {
        await recordActivity({
          familyId: user.familyId,
          userId: user.id,
          type: "family_joined",
          title: `${user.username} joined the family`,
          body: `${user.username} is ready to jump in.`,
          relatedEntityType: "user",
          relatedEntityId: user.id,
        });
      }
      
      if (user.role === "admin" && user.firebaseUid) {
        notifyNewParentSignup(user.firebaseUid, user.username).catch(console.error);
      }

      return res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid request" });
      }
      return res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  app.get(api.users.get.path, requireAuth, attachCurrentUser, async (req, res) => {
    const currentUser = getCurrentUser(req);
    const userId = parseId(req.params.id);
    if (!userId) return res.status(400).json({ message: "Invalid user id" });
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!sameFamilyOrReject(res, currentUser.familyId, user.familyId)) return;
    return res.json(user);
  });

  app.get(api.users.getByFirebaseUid.path, requireAuth, attachCurrentUser, async (req, res) => {
    const currentUser = getCurrentUser(req);
    if (currentUser.firebaseUid !== req.params.uid) return forbidden(res, "Can only access your own profile");
    return res.json(currentUser);
  });

  app.patch(api.users.updateProfile.path, requireAuth, attachCurrentUser, async (req, res) => {
    try {
      const currentUser = getCurrentUser(req);
      const userId = parseId(req.params.id);
      if (!userId) return res.status(400).json({ message: "Invalid user id" });
      if (currentUser.id !== userId) return res.status(403).json({ message: "You can only update your own profile" });
      const input = api.users.updateProfile.input.parse(req.body);
      const updated = await storage.updateUserProfile(userId, input.username.trim());
      if (!updated) return res.status(404).json({ message: "User not found" });
      return res.json(updated);
    } catch (e) {
      return handleError(res, e);
    }
  });

  app.patch(api.users.updateAvatar.path, requireAuth, attachCurrentUser, async (req, res) => {
    try {
      const currentUser = getCurrentUser(req);
      const userId = parseId(req.params.id);
      if (!userId) return res.status(400).json({ message: "Invalid user id" });
      if (currentUser.id !== userId) return forbidden(res, "Can only edit your own profile");
      const input = api.users.updateAvatar.input.parse(req.body);
      return res.json(await storage.updateUserAvatar(userId, input.avatarConfig, input.avatarInventory));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid request" });
      }
      return res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  app.patch(api.users.toggleLeaderboard.path, requireAuth, attachCurrentUser, async (req, res) => {
    try {
      const currentUser = getCurrentUser(req);
      const userId = parseId(req.params.id);
      if (!userId) return res.status(400).json({ message: "Invalid user id" });
      const input = api.users.toggleLeaderboard.input.parse(req.body);
      const targetUser = await storage.getUser(userId);
      if (!targetUser) return res.status(404).json({ message: "User not found" });
      if (!sameFamilyOrReject(res, currentUser.familyId, targetUser.familyId)) return;
      if (currentUser.id !== userId && !canManageFamily(currentUser)) return forbidden(res);
      const updated = await storage.updateUserLeaderboard(userId, input.hideFromLeaderboard);
      if (!updated) return res.status(404).json({ message: "User not found" });
      if (updated.familyId) {
        publishFamilyEvent(updated.familyId, "family:user", updated);
      }
      return res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid request" });
      }
      return res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  app.patch(api.users.updateRole.path, requireAuth, attachCurrentUser, async (req, res) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!canManageFamily(currentUser)) return forbidden(res, "Admins only");
      const userId = parseId(req.params.id);
      if (!userId) return res.status(400).json({ message: "Invalid user id" });
      const input = api.users.updateRole.input.parse(req.body);
      const targetUser = await storage.getUser(userId);
      if (!targetUser) return res.status(404).json({ message: "User not found" });
      if (!sameFamilyOrReject(res, currentUser.familyId, targetUser.familyId)) return;

      const updated = await storage.updateUserRole(userId, input.role);
      if (updated?.familyId) {
        await recordActivity({
          familyId: updated.familyId,
          userId: updated.id,
          type: "role_changed",
          title: `${updated.username}'s role changed`,
          body: `${updated.username} is now a ${updated.role}.`,
          relatedEntityType: "user",
          relatedEntityId: updated.id,
        });
        publishFamilyEvent(updated.familyId, "family:user", updated);
      }
      return res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid request" });
      }
      return res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  app.get(api.messages.list.path, requireAuth, attachCurrentUser, async (req, res) => {
    const currentUser = getCurrentUser(req);
    const familyId = parseId(req.params.id);
    if (!familyId) return res.status(400).json({ message: "Invalid family id" });
    if (!sameFamilyOrReject(res, currentUser.familyId, familyId)) return;
    return res.json(await storage.getMessages(familyId));
  });

  app.post(api.messages.create.path, requireAuth, attachCurrentUser, async (req, res) => {
    try {
      const currentUser = getCurrentUser(req);
      const input = api.messages.create.input.parse(req.body);
      if (input.userId !== currentUser.id) return forbidden(res, "userId must match authenticated user");
      if (!sameFamilyOrReject(res, currentUser.familyId, input.familyId)) return;
      return res.status(201).json(await createMessage(input));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid request" });
      }
      return res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  app.post(api.chores.create.path, requireAuth, attachCurrentUser, async (req, res) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!canManageFamily(currentUser)) return forbidden(res, "Admins only");
      const input = api.chores.create.input.parse(req.body);
      if (!sameFamilyOrReject(res, currentUser.familyId, input.familyId)) return;
      return res.status(201).json(await storage.createChore({ ...input, createdBy: currentUser.id }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid request" });
      }
      return res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  app.patch(api.chores.update.path, requireAuth, attachCurrentUser, async (req, res) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!canManageFamily(currentUser)) return forbidden(res, "Admins only");
      const choreId = parseId(req.params.id);
      if (!choreId) return res.status(400).json({ message: "Invalid chore id" });
      const existing = await storage.getChore(choreId);
      if (!existing) return res.status(404).json({ message: "Chore not found" });
      if (!sameFamilyOrReject(res, currentUser.familyId, existing.familyId)) return;
      const input = api.chores.update.input.parse(req.body);
      return res.json(await storage.updateChore(choreId, input));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid request" });
      }
      return res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  app.post(api.chores.complete.path, requireAuth, attachCurrentUser, async (req, res) => {
    try {
      const currentUser = getCurrentUser(req);
      const choreId = parseId(req.params.id);
      if (!choreId) return res.status(400).json({ message: "Invalid chore id" });
      const input = api.chores.complete.input.parse(req.body);
      if (input.userId !== currentUser.id) return forbidden(res, "userId must match authenticated user");
      return res.json(await completeChore(choreId, input.userId, input.note));
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : "Could not complete chore" });
    }
  });

  app.get(api.reviews.chorePending.path, requireAuth, attachCurrentUser, async (req, res) => {
    const currentUser = getCurrentUser(req);
    const familyId = parseId(req.params.id);
    if (!familyId) return res.status(400).json({ message: "Invalid family id" });
    if (!sameFamilyOrReject(res, currentUser.familyId, familyId)) return;
    if (!canApprove(currentUser)) return forbidden(res, "Admins only");
    return res.json(await storage.getPendingChoreSubmissions(familyId));
  });

  app.post(api.reviews.reviewChore.path, requireAuth, attachCurrentUser, async (req, res) => {
    try {
      const currentUser = getCurrentUser(req);
      const submissionId = parseId(req.params.id);
      if (!submissionId) return res.status(400).json({ message: "Invalid submission id" });
      const input = api.reviews.reviewChore.input.parse(req.body);
      if (input.action !== "cancel" && !canApprove(currentUser)) return forbidden(res, "Admins only");
      const result = await reviewChoreSubmission(submissionId, currentUser, input.action, input.note);
      return res.json(result.submission);
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : "Could not review chore" });
    }
  });

  app.get(api.rewards.list.path, requireAuth, attachCurrentUser, async (req, res) => {
    const currentUser = getCurrentUser(req);
    const familyId = parseId(req.params.id);
    if (!familyId) return res.status(400).json({ message: "Invalid family id" });
    if (!sameFamilyOrReject(res, currentUser.familyId, familyId)) return;
    return res.json(await storage.getRewards(familyId));
  });

  app.post(api.rewards.create.path, requireAuth, attachCurrentUser, async (req, res) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!canManageFamily(currentUser)) return forbidden(res, "Admins only");
      const input = api.rewards.create.input.parse(req.body);
      if (!sameFamilyOrReject(res, currentUser.familyId, input.familyId)) return;
      return res.status(201).json(await storage.createReward({ ...input, createdBy: currentUser.id }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid request" });
      }
      return res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  app.post(api.rewards.claim.path, requireAuth, attachCurrentUser, async (req, res) => {
    try {
      const currentUser = getCurrentUser(req);
      const rewardId = parseId(req.params.id);
      if (!rewardId) return res.status(400).json({ message: "Invalid reward id" });
      const input = api.rewards.claim.input.parse(req.body);
      if (input.userId !== currentUser.id) return forbidden(res, "userId must match authenticated user");
      return res.json(await claimReward(rewardId, currentUser.id, input.quantity, input.note));
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : "Could not claim reward" });
    }
  });

  app.get(api.reviews.rewardPending.path, requireAuth, attachCurrentUser, async (req, res) => {
    const currentUser = getCurrentUser(req);
    const familyId = parseId(req.params.id);
    if (!familyId) return res.status(400).json({ message: "Invalid family id" });
    if (!sameFamilyOrReject(res, currentUser.familyId, familyId)) return;
    if (!canApprove(currentUser)) return forbidden(res, "Admins only");
    return res.json(await storage.getPendingRewardClaims(familyId));
  });

  app.post(api.reviews.reviewReward.path, requireAuth, attachCurrentUser, async (req, res) => {
    try {
      const currentUser = getCurrentUser(req);
      const claimId = parseId(req.params.id);
      if (!claimId) return res.status(400).json({ message: "Invalid claim id" });
      const input = api.reviews.reviewReward.input.parse(req.body);
      if (input.action !== "cancel" && !canApprove(currentUser)) return forbidden(res, "Admins only");
      const result = await reviewRewardClaim(claimId, currentUser, input.action, input.note);
      return res.json(result.claim);
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : "Could not review reward" });
    }
  });

  app.get(api.events.stream.path, async (req, res) => {
    const parsed = api.events.stream.input.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: "Missing token or familyId" });
    }

    try {
      let currentUser = null;
      if (parsed.data.demoUserId && process.env.NODE_ENV !== "production") {
        currentUser = await storage.getUser(parsed.data.demoUserId);
      } else if (parsed.data.token) {
        const decoded = await verifyBearerToken(parsed.data.token);
        currentUser = await storage.getUserByFirebaseUid(decoded.uid);
      }
      if (!currentUser || !sameFamilyOrReject(res, currentUser.familyId, parsed.data.familyId)) return;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      const clientId = randomUUID();
      registerSseClient(clientId, parsed.data.familyId, res);

      const heartbeat = setInterval(() => {
        res.write(`event: family:heartbeat\n`);
        res.write(`data: ${JSON.stringify({ at: new Date().toISOString() })}\n\n`);
      }, 25000);

      req.on("close", () => {
        clearInterval(heartbeat);
        removeSseClient(clientId);
        res.end();
      });
    } catch (error) {
      return res.status(401).json({ message: error instanceof Error ? error.message : "Unauthorized" });
    }
  });

  app.post(api.demo.setup.path, async (_req, res) => {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ message: "Demo setup is disabled in production" });
    }
    const family = await storage.getOrCreateCurrentDemo();
    const users = await storage.getFamilyUsers(family.id);
    return res.status(201).json({ family, users });
  });

  // ── DB-backed OTP — survives Vercel serverless cold starts ───────────────────
  const { pool } = await import("./db");
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
  `).catch((e: any) => console.warn("[OTP] table init warning:", e.message));

  // POST /api/auth/send-code
  // Client creates the Firebase user first (Firebase Auth SDK), then calls this
  // to store the OTP in DB and send via Resend. No Firebase Admin needed here.
  app.post("/api/auth/send-code", async (req, res) => {
    try {
      const { email, firebaseUid } = req.body;
      if (!email || !firebaseUid) return res.status(400).json({ message: "Email and firebaseUid are required." });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: "Invalid email address." });

      // Throttle: 60-second cooldown per email
      const { rows: existing } = await pool.query(
        "SELECT last_sent_at FROM email_verification_codes WHERE email = $1 ORDER BY created_at DESC LIMIT 1",
        [email]
      );
      if (existing.length > 0) {
        const lastSent = new Date(existing[0].last_sent_at).getTime();
        const waitMs = 60_000 - (Date.now() - lastSent);
        if (waitMs > 0) {
          const waitSecs = Math.ceil(waitMs / 1000);
          return res.status(429).json({ message: `Please wait ${waitSecs} seconds before requesting a new code.`, waitSecs });
        }
      }

      // Generate 6-digit code and upsert
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 10 * 60_000);
      const now = new Date();

      // Delete old record then insert fresh (simpler than true upsert with no unique constraint)
      await pool.query("DELETE FROM email_verification_codes WHERE email = $1", [email]);
      await pool.query(
        "INSERT INTO email_verification_codes (email, firebase_uid, code, expires_at, attempts, last_sent_at) VALUES ($1, $2, $3, $4, 0, $5)",
        [email, firebaseUid, code, expiresAt, now]
      );

      // Send via Resend
      const { sendOtpEmail } = await import("./services/email-service");
      await sendOtpEmail(email, code);

      console.log(`[OTP] Code sent to ${email} uid=${firebaseUid}`);
      return res.json({ success: true });
    } catch (e: any) {
      console.error("[OTP] send-code error:", e);
      return res.status(500).json({ message: e.message || "Failed to send verification code." });
    }
  });

  // POST /api/auth/verify-code — validate OTP from DB
  app.post("/api/auth/verify-code", async (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) return res.status(400).json({ message: "Email and code are required." });

      const { rows } = await pool.query(
        "SELECT * FROM email_verification_codes WHERE email = $1 ORDER BY created_at DESC LIMIT 1",
        [email]
      );
      const record = rows[0];
      if (!record) return res.status(400).json({ message: "No verification code found. Please request a new one." });

      if (new Date() > new Date(record.expires_at)) {
        await pool.query("DELETE FROM email_verification_codes WHERE email = $1", [email]);
        return res.status(400).json({ message: "Your code has expired. Please request a new one.", expired: true });
      }

      const newAttempts = record.attempts + 1;
      if (newAttempts > 5) {
        await pool.query("DELETE FROM email_verification_codes WHERE email = $1", [email]);
        return res.status(429).json({ message: "Too many incorrect attempts. Please request a new code.", tooManyAttempts: true });
      }
      await pool.query("UPDATE email_verification_codes SET attempts = $1 WHERE email = $2", [newAttempts, email]);

      if (record.code !== code.trim()) {
        const remaining = 5 - newAttempts;
        return res.status(400).json({ message: `Incorrect code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.` });
      }

      // Code correct — try Firebase Admin to mark verified + issue custom token (graceful fallback)
      const firebaseUid: string = record.firebase_uid;
      await pool.query("DELETE FROM email_verification_codes WHERE email = $1", [email]);
      console.log(`[OTP] Code verified for ${email} uid=${firebaseUid}`);

      try {
        const { getAuth } = await import("firebase-admin/auth");
        const adminAuth = getAuth();
        await adminAuth.updateUser(firebaseUid, { emailVerified: true });
        const customToken = await adminAuth.createCustomToken(firebaseUid);
        return res.json({ success: true, customToken, uid: firebaseUid });
      } catch (adminErr: any) {
        // No service account — client already has a Firebase session from createUserWithEmailAndPassword
        console.warn("[OTP] Admin SDK unavailable, returning uid only:", adminErr.message);
        return res.json({ success: true, uid: firebaseUid });
      }
    } catch (e: any) {
      console.error("[OTP] verify-code error:", e);
      return res.status(500).json({ message: e.message || "Verification failed." });
    }
  });

  app.post("/api/auth/verify-email", requireAuth, async (req, res) => {
    try {
      const { getAuth } = await import("firebase-admin/auth");
      const { sendVerificationEmail } = await import("./services/email-service");
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email required" });
      const link = await getAuth().generateEmailVerificationLink(email);
      await sendVerificationEmail(email, link);
      return res.json({ success: true });
    } catch (e: any) {
      console.error("[Auth] verification email error", e);
      return res.status(500).json({ message: e.message || "Failed to send email" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { getAuth } = await import("firebase-admin/auth");
      const { sendPasswordResetEmail } = await import("./services/email-service");
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email required" });
      const link = await getAuth().generatePasswordResetLink(email);
      await sendPasswordResetEmail(email, link);
      return res.json({ success: true });
    } catch (e: any) {
      console.error("[Auth] reset password email error", e);
      // DO NOT return 404/500 if user doesn't exist to prevent email enumeration
      return res.json({ success: true });
    }
  });

  return httpServer;
}
