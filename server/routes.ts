import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { attachCurrentUser, getCurrentUser, requireAuth } from "./auth";

function parseId(value: unknown): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string" && typeof raw !== "number") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function ensureSameFamily(res: any, currentFamilyId: number | null, targetFamilyId: number): boolean {
  if (!currentFamilyId || currentFamilyId !== targetFamilyId) {
    res.status(403).json({ message: "Forbidden" });
    return false;
  }
  return true;
}

function ensureAdmin(res: any, role: string): boolean {
  if (role !== "admin") {
    res.status(403).json({ message: "Admins only" });
    return false;
  }
  return true;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  app.use("/api", requireAuth);

  app.post(api.families.create.path, async (req, res) => {
    try {
      const input = api.families.create.input.parse(req.body);
      const family = await storage.createFamily(input);
      return res.status(201).json(family);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.families.get.path, attachCurrentUser, async (req, res) => {
    const currentUser = getCurrentUser(req);
    const familyId = parseId(req.params.id);
    if (!familyId) return res.status(400).json({ message: "Invalid family id" });
    if (!ensureSameFamily(res, currentUser.familyId, familyId)) return;

    const family = await storage.getFamily(familyId);
    if (!family) return res.status(404).json({ message: "Not found" });
    return res.json(family);
  });

  app.get(api.families.getByCode.path, async (req, res) => {
    const family = await storage.getFamilyByCode(req.params.code);
    if (!family) return res.status(404).json({ message: "Not found" });
    return res.json(family);
  });

  app.get(api.families.getUsers.path, attachCurrentUser, async (req, res) => {
    const currentUser = getCurrentUser(req);
    const familyId = parseId(req.params.id);
    if (!familyId) return res.status(400).json({ message: "Invalid family id" });
    if (!ensureSameFamily(res, currentUser.familyId, familyId)) return;

    const users = await storage.getFamilyUsers(familyId);
    return res.json(users);
  });

  app.get(api.families.getChores.path, attachCurrentUser, async (req, res) => {
    const currentUser = getCurrentUser(req);
    const familyId = parseId(req.params.id);
    if (!familyId) return res.status(400).json({ message: "Invalid family id" });
    if (!ensureSameFamily(res, currentUser.familyId, familyId)) return;

    const chores = await storage.getFamilyChores(familyId);
    return res.json(chores);
  });

  app.get(api.families.getLeaderboard.path, attachCurrentUser, async (req, res) => {
    const currentUser = getCurrentUser(req);
    const familyId = parseId(req.params.id);
    if (!familyId) return res.status(400).json({ message: "Invalid family id" });
    if (!ensureSameFamily(res, currentUser.familyId, familyId)) return;

    const users = await storage.getFamilyUsers(familyId);
    return res.json(users);
  });

  app.get(api.families.getInviteInfo.path, attachCurrentUser, async (req, res) => {
    const currentUser = getCurrentUser(req);
    const familyId = parseId(req.params.id);
    if (!familyId) return res.status(400).json({ message: "Invalid request" });
    if (!ensureSameFamily(res, currentUser.familyId, familyId)) return;
    if (!ensureAdmin(res, currentUser.role)) return;

    const family = await storage.getFamily(familyId);
    if (!family) return res.status(404).json({ message: "Family not found" });

    const inviteUrl = `${req.protocol}://${req.get("host")}/join/${family.inviteCode}`;
    return res.json({ inviteCode: family.inviteCode, inviteUrl });
  });

  app.post(api.users.create.path, async (req, res) => {
    try {
      const input = api.users.create.input.parse(req.body);
      const tokenUid = (req as any).auth?.uid as string | undefined;
      if (!tokenUid) return res.status(401).json({ message: "Unauthorized" });
      if (input.firebaseUid !== tokenUid) {
        return res.status(403).json({ message: "firebaseUid must match authenticated user" });
      }

      if (input.firebaseUid) {
        const existing = await storage.getUserByFirebaseUid(input.firebaseUid);
        if (existing) {
          return res.status(409).json({ message: "Account already has a profile", user: existing });
        }
      }

      const user = await storage.createUser(input);
      return res.status(201).json(user);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.users.get.path, attachCurrentUser, async (req, res) => {
    const currentUser = getCurrentUser(req);
    const userId = parseId(req.params.id);
    if (!userId) return res.status(400).json({ message: "Invalid user id" });

    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "Not found" });
    if (!user.familyId || !ensureSameFamily(res, currentUser.familyId, user.familyId)) return;
    return res.json(user);
  });

  app.patch(api.users.updateAvatar.path, attachCurrentUser, async (req, res) => {
    try {
      const currentUser = getCurrentUser(req);
      const input = api.users.updateAvatar.input.parse(req.body);
      const userId = parseId(req.params.id);
      if (!userId) return res.status(400).json({ message: "Invalid user id" });
      if (currentUser.id !== userId) return res.status(403).json({ message: "Can only edit your own avatar" });

      const user = await storage.updateUserAvatar(userId, input.avatarConfig);
      return res.json(user);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.users.toggleLeaderboard.path, attachCurrentUser, async (req, res) => {
    try {
      const currentUser = getCurrentUser(req);
      const input = api.users.toggleLeaderboard.input.parse(req.body);
      const userId = parseId(req.params.id);
      if (!userId) return res.status(400).json({ message: "Invalid user id" });

      const target = await storage.getUser(userId);
      if (!target || !target.familyId) return res.status(404).json({ message: "User not found" });
      if (!ensureSameFamily(res, currentUser.familyId, target.familyId)) return;

      const canEdit = currentUser.id === userId || currentUser.role === "admin";
      if (!canEdit) return res.status(403).json({ message: "Forbidden" });

      const user = await storage.updateUserLeaderboard(userId, input.hideFromLeaderboard);
      if (!user) return res.status(404).json({ message: "User not found" });
      return res.json(user);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.users.getByFirebaseUid.path, attachCurrentUser, async (req, res) => {
    const currentUser = getCurrentUser(req);
    if (currentUser.firebaseUid !== req.params.uid) {
      return res.status(403).json({ message: "Can only access your own user profile" });
    }
    return res.json(currentUser);
  });

  app.patch(api.users.updateRole.path, attachCurrentUser, async (req, res) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!ensureAdmin(res, currentUser.role)) return;

      const input = api.users.updateRole.input.parse(req.body);
      const userId = parseId(req.params.id);
      if (!userId) return res.status(400).json({ message: "Invalid request" });

      const targetUser = await storage.getUser(userId);
      if (!targetUser || !targetUser.familyId) return res.status(404).json({ message: "User not found" });
      if (!ensureSameFamily(res, currentUser.familyId, targetUser.familyId)) return;

      const user = await storage.updateUserRole(userId, input.role);
      if (!user) return res.status(404).json({ message: "User not found" });
      return res.json(user);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.messages.list.path, attachCurrentUser, async (req, res) => {
    const currentUser = getCurrentUser(req);
    const familyId = parseId(req.params.id);
    if (!familyId) return res.status(400).json({ message: "Invalid family id" });
    if (!ensureSameFamily(res, currentUser.familyId, familyId)) return;

    const msgs = await storage.getMessages(familyId);
    return res.json(msgs);
  });

  app.post(api.messages.create.path, attachCurrentUser, async (req, res) => {
    try {
      const currentUser = getCurrentUser(req);
      const input = api.messages.create.input.parse(req.body);
      if (currentUser.id !== input.userId) {
        return res.status(403).json({ message: "userId must match authenticated user" });
      }
      if (!ensureSameFamily(res, currentUser.familyId, input.familyId)) return;

      const msg = await storage.createMessage(input);
      return res.status(201).json(msg);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.chores.create.path, attachCurrentUser, async (req, res) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!ensureAdmin(res, currentUser.role)) return;

      const input = api.chores.create.input.parse(req.body);
      if (!ensureSameFamily(res, currentUser.familyId, input.familyId!)) return;

      const chore = await storage.createChore(input);
      return res.status(201).json(chore);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.chores.update.path, attachCurrentUser, async (req, res) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!ensureAdmin(res, currentUser.role)) return;

      const choreId = parseId(req.params.id);
      if (!choreId) return res.status(400).json({ message: "Invalid chore id" });
      const input = api.chores.update.input.parse(req.body);
      const existing = await storage.getChore(choreId);
      if (!existing) return res.status(404).json({ message: "Chore not found" });
      if (!existing.familyId || !ensureSameFamily(res, currentUser.familyId, existing.familyId)) return;
      const chore = await storage.updateChore(choreId, input);
      return res.json(chore);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.chores.complete.path, attachCurrentUser, async (req, res) => {
    try {
      const currentUser = getCurrentUser(req);
      const choreId = parseId(req.params.id);
      if (!choreId) return res.status(400).json({ message: "Invalid chore id" });
      const input = api.chores.complete.input.parse(req.body);

      if (input.userId !== currentUser.id) {
        return res.status(403).json({ message: "userId must match authenticated user" });
      }

      const result = await storage.completeChore(choreId, input.userId);
      return res.json(result);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message });
      return res.status(404).json({ message: e instanceof Error ? e.message : "Not found" });
    }
  });

  app.get(api.rewards.list.path, attachCurrentUser, async (req, res) => {
    const currentUser = getCurrentUser(req);
    const familyId = parseId(req.params.id);
    if (!familyId) return res.status(400).json({ message: "Invalid family id" });
    if (!ensureSameFamily(res, currentUser.familyId, familyId)) return;

    const rewards = await storage.getRewards(familyId);
    return res.json(rewards);
  });

  app.post(api.rewards.create.path, attachCurrentUser, async (req, res) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!ensureAdmin(res, currentUser.role)) return;

      const input = api.rewards.create.input.parse(req.body);
      if (!ensureSameFamily(res, currentUser.familyId, input.familyId!)) return;
      const reward = await storage.createReward(input);
      return res.status(201).json(reward);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message });
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.rewards.claim.path, attachCurrentUser, async (req, res) => {
    try {
      const currentUser = getCurrentUser(req);
      const rewardId = parseId(req.params.id);
      if (!rewardId) return res.status(400).json({ message: "Invalid reward id" });
      const input = api.rewards.claim.input.parse(req.body);

      if (input.userId !== currentUser.id) {
        return res.status(403).json({ message: "userId must match authenticated user" });
      }

      const result = await storage.claimReward(rewardId, input.userId, input.quantity);
      return res.json(result);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message });
      return res.status(400).json({ message: e instanceof Error ? e.message : "Error claiming reward" });
    }
  });

  app.post(api.demo.setup.path, attachCurrentUser, async (req, res) => {
    try {
      if (process.env.NODE_ENV === "production") {
        return res.status(403).json({ message: "Demo setup disabled in production" });
      }
      const family = await storage.getOrCreateCurrentDemo();
      return res.status(201).json(family);
    } catch {
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
