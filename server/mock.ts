import type { Express, Request, Response } from "express";
import type {
  ActivityEvent,
  Chore,
  ChoreSubmission,
  Family,
  Message,
  MonthlyWinner,
  Reward,
  RewardClaim,
  User,
  UserAchievement,
} from "@shared/schema";

type DemoState = {
  families: Family[];
  users: User[];
  chores: Chore[];
  rewards: Reward[];
  messages: Message[];
  activity: ActivityEvent[];
  achievements: UserAchievement[];
  monthlyWinners: MonthlyWinner[];
  choreSubmissions: ChoreSubmission[];
  rewardClaims: RewardClaim[];
  nextFamilyId: number;
  nextUserId: number;
  nextChoreId: number;
  nextRewardId: number;
  nextMessageId: number;
  nextActivityId: number;
  nextAchievementId: number;
  nextWinnerId: number;
  nextSubmissionId: number;
  nextClaimId: number;
};

const sseClients = new Set<{ res: Response; familyId: number }>();

function publishDemoEvent(familyId: number, event: string, payload: unknown) {
  for (const client of sseClients) {
    if (client.familyId === familyId) {
      client.res.write(`event: ${event}\n`);
      client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
    }
  }
}

const DEMO_FAMILY_ID = 1;
const DEMO_INVITE_CODE = "DEMO123";
const LOCAL_DEMO_FIREBASE_UID = "demo-local-user";

function currentDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

function parseParamId(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildInviteCode(name: string) {
  const cleaned = name.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) || "FAM";
  return `${cleaned}${Math.floor(1000 + Math.random() * 9000)}`;
}

function findCurrentDemoUser(req: Request, state: DemoState) {
  const headerValue = req.header("X-Demo-User-Id");
  const parsedHeader = headerValue ? Number(headerValue) : NaN;
  const requestedId = Number.isFinite(parsedHeader) ? parsedHeader : 1;
  return state.users.find((user) => user.id === requestedId) ?? state.users[0] ?? null;
}

function createInitialDemoState(): DemoState {
  const now = new Date();

  const family: Family = {
    id: DEMO_FAMILY_ID,
    name: "Demo Family",
    inviteCode: DEMO_INVITE_CODE,
    timeZone: "Europe/Dublin",
    themeColor: "violet",
    createdAt: now,
  };

  const jordan: User = {
    id: 1,
    familyId: family.id,
    firebaseUid: null,
    username: "Jordan",
    role: "admin",
    gender: "other",
    age: 38,
    points: 460,
    streak: 7,
    streakLastCompletedDate: currentDateOnly(),
    avatarUrl: null,
    avatarConfig: "{}",
    avatarInventory: "{}",
    hideFromLeaderboard: false,
    createdAt: now,
  };

  const alex: User = {
    id: 2,
    familyId: family.id,
    firebaseUid: null,
    username: "Alex",
    role: "member",
    gender: "other",
    age: 13,
    points: 330,
    streak: 4,
    streakLastCompletedDate: currentDateOnly(),
    avatarUrl: null,
    avatarConfig: JSON.stringify({ outfit: "tuxedo" }),
    avatarInventory: "{}",
    hideFromLeaderboard: false,
    createdAt: now,
  };

  const mia: User = {
    id: 3,
    familyId: family.id,
    firebaseUid: null,
    username: "Mia",
    role: "member",
    gender: "other",
    age: 10,
    points: 280,
    streak: 2,
    streakLastCompletedDate: currentDateOnly(),
    avatarUrl: null,
    avatarConfig: "{}",
    avatarInventory: "{}",
    hideFromLeaderboard: false,
    createdAt: now,
  };

  const chores: Chore[] = [
    {
      id: 1,
      familyId: family.id,
      title: "Empty dishwasher",
      description: "Put everything away before dinner.",
      points: 20,
      type: "daily",
      assigneeId: alex.id,
      lastCompletedAt: null,
      lastCompletedBy: null,
      cooldownHours: null,
      emoji: "🍽️",
      requiresApproval: false,
      isActive: true,
      createdBy: jordan.id,
      createdAt: now,
    },
    {
      id: 2,
      familyId: family.id,
      title: "Tidy bedroom",
      description: "Quick five-minute reset.",
      points: 15,
      type: "daily",
      assigneeId: mia.id,
      lastCompletedAt: null,
      lastCompletedBy: null,
      cooldownHours: null,
      emoji: "🧸",
      requiresApproval: false,
      isActive: true,
      createdBy: jordan.id,
      createdAt: now,
    },
    {
      id: 3,
      familyId: family.id,
      title: "Take out recycling",
      description: "Ask for a quick check before claiming stars.",
      points: 30,
      type: "weekly",
      assigneeId: alex.id,
      lastCompletedAt: null,
      lastCompletedBy: null,
      cooldownHours: null,
      emoji: "♻️",
      requiresApproval: true,
      isActive: true,
      createdBy: jordan.id,
      createdAt: now,
    },
    {
      id: 4,
      familyId: family.id,
      title: "Dog walk backup",
      description: "Anyone can jump in and help.",
      points: 25,
      type: "box",
      assigneeId: null,
      lastCompletedAt: null,
      lastCompletedBy: null,
      cooldownHours: null,
      emoji: "🐶",
      requiresApproval: false,
      isActive: true,
      createdBy: jordan.id,
      createdAt: now,
    },
  ];

  const rewards: Reward[] = [
    {
      id: 1,
      familyId: family.id,
      title: "Choose Friday movie",
      description: "Winner picks the family movie night pick.",
      costPoints: 120,
      emoji: "🎬",
      requiresApproval: false,
      createdBy: jordan.id,
      createdAt: now,
    },
    {
      id: 2,
      familyId: family.id,
      title: "Later bedtime pass",
      description: "Worth one extra hour on Saturday.",
      costPoints: 220,
      emoji: "🌙",
      requiresApproval: true,
      createdBy: jordan.id,
      createdAt: now,
    },
  ];

  const messages: Message[] = [
    {
      id: 1,
      familyId: family.id,
      userId: jordan.id,
      senderName: "Chorely",
      content: "Family chat started. Try dropping a message here!",
      isSystem: true,
      createdAt: now,
    },
  ];

  const activity: ActivityEvent[] = [
    {
      id: 1,
      familyId: family.id,
      userId: jordan.id,
      type: "family_joined",
      title: "Jordan created the demo family",
      body: "Everything is ready for a quick walkthrough.",
      relatedEntityType: "family",
      relatedEntityId: family.id,
      metadata: {},
      createdAt: now,
    },
  ];

  const achievements: UserAchievement[] = [
    {
      id: 1,
      familyId: family.id,
      userId: alex.id,
      code: "first_streak",
      title: "Streak Starter",
      description: "Completed chores three days in a row.",
      emoji: "🔥",
      earnedAt: now,
    },
  ];

  const monthlyWinners: MonthlyWinner[] = [
    {
      id: 1,
      familyId: family.id,
      monthKey: `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`,
      awardType: "top_points",
      userId: jordan.id,
      title: "Family MVP",
      summary: "Jordan kept the streaks alive and the routine running smoothly.",
      stats: { points: jordan.points },
      createdAt: now,
    },
  ];

  return {
    families: [family],
    users: [jordan, alex, mia],
    chores,
    rewards,
    messages,
    activity,
    achievements,
    monthlyWinners,
    choreSubmissions: [],
    rewardClaims: [],
    nextFamilyId: 2,
    nextUserId: 4,
    nextChoreId: 5,
    nextRewardId: 3,
    nextMessageId: 2,
    nextActivityId: 2,
    nextAchievementId: 2,
    nextWinnerId: 2,
    nextSubmissionId: 1,
    nextClaimId: 1,
  };
}

let state = createInitialDemoState();

function onboardingChecklistForFamily(familyId: number) {
  const familyUsers = state.users.filter((user) => user.familyId === familyId);
  const familyChores = state.chores.filter((chore) => chore.familyId === familyId && chore.isActive);
  const familyRewards = state.rewards.filter((reward) => reward.familyId === familyId);

  return [
    {
      key: "add-family",
      label: "Family created",
      description: "Your space is ready.",
      complete: true,
    },
    {
      key: "add-members",
      label: "Invite another family member",
      description: "Everything gets more fun once more people join.",
      complete: familyUsers.length > 1,
    },
    {
      key: "add-chore",
      label: "Add your first chore",
      description: "Set something simple everyone can try.",
      complete: familyChores.length > 0,
    },
    {
      key: "add-reward",
      label: "Add a reward",
      description: "Give everyone something fun to work toward.",
      complete: familyRewards.length > 0,
    },
  ];
}

function appendActivity(event: Omit<ActivityEvent, "id" | "createdAt">) {
  state.activity.unshift({
    ...event,
    id: state.nextActivityId++,
    createdAt: new Date(),
  });
}

export function setupDemoMode(app: Express) {
  if (process.env.CHORELY_DEMO_MODE !== "true") return;

  console.log("Demo mode enabled: using in-memory data.");

  app.post("/api/demo/setup", (_req, res) => {
    const family = state.families.find((item) => item.id === DEMO_FAMILY_ID) ?? state.families[0];
    const users = state.users.filter((user) => user.familyId === family.id);
    return res.status(201).json({ family, users });
  });

  app.post("/api/families", (req, res) => {
    const family: Family = {
      id: state.nextFamilyId++,
      name: typeof req.body?.name === "string" ? req.body.name.trim() || "New Family" : "New Family",
      inviteCode: buildInviteCode(typeof req.body?.name === "string" ? req.body.name : "FAMILY"),
      timeZone: typeof req.body?.timeZone === "string" ? req.body.timeZone : "UTC",
      themeColor: typeof req.body?.themeColor === "string" ? req.body.themeColor : "violet",
      createdAt: new Date(),
    };
    state.families.push(family);
    return res.status(201).json(family);
  });

  app.get("/api/families/code/:code", (req, res) => {
    const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
    const family = state.families.find((item) => item.inviteCode === code);
    if (!family) return res.status(404).json({ message: "Family not found" });
    return res.json(family);
  });

  app.post("/api/users", (req, res) => {
    const familyId = Number(req.body?.familyId);
    const family = state.families.find((item) => item.id === familyId);
    if (!family) return res.status(404).json({ message: "Family not found" });

    const user: User = {
      id: state.nextUserId++,
      familyId,
      firebaseUid:
        typeof req.body?.firebaseUid === "string" && req.body.firebaseUid !== LOCAL_DEMO_FIREBASE_UID
          ? req.body.firebaseUid
          : null,
      username: typeof req.body?.username === "string" ? req.body.username.trim() || "New User" : "New User",
      role: typeof req.body?.role === "string" ? req.body.role : "member",
      gender: typeof req.body?.gender === "string" ? req.body.gender : null,
      age: Number.isFinite(Number(req.body?.age)) ? Number(req.body.age) : null,
      points: 0,
      streak: 0,
      streakLastCompletedDate: null,
      avatarUrl: null,
      avatarConfig: "{}",
      avatarInventory: "{}",
      hideFromLeaderboard: false,
      createdAt: new Date(),
    };

    state.users.push(user);
    appendActivity({
      familyId,
      userId: user.id,
      type: "family_joined",
      title: `${user.username} joined the family`,
      body: `${user.username} is ready to jump in.`,
      relatedEntityType: "user",
      relatedEntityId: user.id,
      metadata: {},
    });
    return res.status(201).json(user);
  });

  app.get("/api/families/:id", (req, res) => {
    const familyId = parseParamId(req.params.id);
    const family = familyId ? state.families.find((item) => item.id === familyId) : null;
    if (!family) return res.status(404).json({ message: "Family not found" });
    return res.json(family);
  });

  app.patch("/api/users/:id/avatar", (req, res) => {
    const userId = parseParamId(req.params.id);
    const targetUser = state.users.find(u => u.id === userId);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    if (req.body?.avatarConfig) {
      targetUser.avatarConfig = req.body.avatarConfig;
    }
    return res.json(targetUser);
  });

  app.get("/api/families/:id/users", (req, res) => {
    const familyId = parseParamId(req.params.id);
    if (!familyId) return res.status(400).json({ message: "Invalid family id" });
    return res.json(state.users.filter((user) => user.familyId === familyId));
  });

  app.get("/api/families/:id/leaderboard", (req, res) => {
    const familyId = parseParamId(req.params.id);
    if (!familyId) return res.status(400).json({ message: "Invalid family id" });
    const users = state.users
      .filter((user) => user.familyId === familyId)
      .sort((a, b) => b.points - a.points);
    return res.json(users);
  });

  app.get("/api/families/:id/chores", (req, res) => {
    const familyId = parseParamId(req.params.id);
    if (!familyId) return res.status(400).json({ message: "Invalid family id" });
    return res.json(state.chores.filter((chore) => chore.familyId === familyId && chore.isActive));
  });

  app.get("/api/families/:id/rewards", (req, res) => {
    const familyId = parseParamId(req.params.id);
    if (!familyId) return res.status(400).json({ message: "Invalid family id" });
    return res.json(state.rewards.filter((reward) => reward.familyId === familyId));
  });

  app.get("/api/families/:id/activity", (req, res) => {
    const familyId = parseParamId(req.params.id);
    if (!familyId) return res.status(400).json({ message: "Invalid family id" });
    return res.json(state.activity.filter((event) => event.familyId === familyId).slice(0, 40));
  });

  app.get("/api/families/:id/monthly-winners", (req, res) => {
    const familyId = parseParamId(req.params.id);
    if (!familyId) return res.status(400).json({ message: "Invalid family id" });
    return res.json(state.monthlyWinners.filter((winner) => winner.familyId === familyId));
  });

  app.get("/api/families/:id/achievements", (req, res) => {
    const familyId = parseParamId(req.params.id);
    if (!familyId) return res.status(400).json({ message: "Invalid family id" });
    return res.json(state.achievements.filter((achievement) => achievement.familyId === familyId));
  });

  app.get("/api/families/:id/onboarding", (req, res) => {
    const familyId = parseParamId(req.params.id);
    if (!familyId) return res.status(400).json({ message: "Invalid family id" });
    return res.json({ checklist: onboardingChecklistForFamily(familyId) });
  });

  app.get("/api/families/:id/messages", (req, res) => {
    const familyId = parseParamId(req.params.id);
    if (!familyId) return res.status(400).json({ message: "Invalid family id" });
    return res.json(state.messages.filter((message) => message.familyId === familyId));
  });

  app.post("/api/chores", (req, res) => {
    const familyId = Number(req.body?.familyId);
    const createdBy = Number(req.body?.createdBy);
    const chore: Chore = {
      id: state.nextChoreId++,
      familyId,
      title: typeof req.body?.title === "string" ? req.body.title : "New chore",
      description: typeof req.body?.description === "string" ? req.body.description : null,
      points: Number.isFinite(Number(req.body?.points)) ? Number(req.body.points) : 10,
      type: typeof req.body?.type === "string" ? req.body.type : "daily",
      assigneeId: Number.isFinite(Number(req.body?.assigneeId)) ? Number(req.body.assigneeId) : null,
      lastCompletedAt: null,
      lastCompletedBy: null,
      cooldownHours: null,
      emoji: typeof req.body?.emoji === "string" ? req.body.emoji : null,
      requiresApproval: Boolean(req.body?.requiresApproval),
      isActive: true,
      createdBy: Number.isFinite(createdBy) ? createdBy : null,
      createdAt: new Date(),
    };
    state.chores.push(chore);
    appendActivity({
      familyId,
      userId: chore.createdBy,
      type: "chore_created",
      title: `${chore.title} was added`,
      body: "A new chore is ready for the family.",
      relatedEntityType: "chore",
      relatedEntityId: chore.id,
      metadata: {},
    });
    return res.status(201).json(chore);
  });

  app.post("/api/rewards", (req, res) => {
    const familyId = Number(req.body?.familyId);
    const createdBy = Number(req.body?.createdBy);
    const reward: Reward = {
      id: state.nextRewardId++,
      familyId,
      title: typeof req.body?.title === "string" ? req.body.title : "New reward",
      description: typeof req.body?.description === "string" ? req.body.description : null,
      costPoints: Number.isFinite(Number(req.body?.costPoints)) ? Number(req.body.costPoints) : 50,
      emoji: typeof req.body?.emoji === "string" ? req.body.emoji : null,
      requiresApproval: Boolean(req.body?.requiresApproval),
      createdBy: Number.isFinite(createdBy) ? createdBy : null,
      createdAt: new Date(),
    };
    state.rewards.push(reward);
    appendActivity({
      familyId,
      userId: reward.createdBy,
      type: "reward_created",
      title: `${reward.title} was added`,
      body: "A new reward is ready to claim.",
      relatedEntityType: "reward",
      relatedEntityId: reward.id,
      metadata: {},
    });
    return res.status(201).json(reward);
  });

  app.post("/api/chores/:id/complete", (req, res) => {
    const choreId = parseParamId(req.params.id);
    const userId = Number(req.body?.userId);
    const chore = choreId ? state.chores.find((item) => item.id === choreId) : null;
    const user = state.users.find((item) => item.id === userId);

    if (!chore || !user) return res.status(404).json({ message: "Chore or user not found" });
    if (chore.familyId == null) return res.status(400).json({ message: "Chore is missing a family" });

    chore.lastCompletedAt = new Date();
    chore.lastCompletedBy = user.id;

    let awardedPoints = 0;
    let submission: ChoreSubmission | null = null;

    if (chore.requiresApproval) {
      submission = {
        id: state.nextSubmissionId++,
        familyId: chore.familyId,
        choreId: chore.id,
        userId: user.id,
        status: "submitted",
        note: null,
        rejectionReason: null,
        reviewNote: null,
        pointsAwarded: 0,
        reviewedBy: null,
        reviewedAt: null,
        undoneAt: null,
        createdAt: new Date(),
      };

      appendActivity({
        familyId: chore.familyId,
        userId: user.id,
        type: "chore_submitted",
        title: `${user.username} submitted ${chore.title}`,
        body: "Waiting for review.",
        relatedEntityType: "chore",
        relatedEntityId: chore.id,
        metadata: {},
      });
      state.choreSubmissions.push(submission);
    } else {
      awardedPoints = chore.points;
      user.points += awardedPoints;
      user.streak += 1;
      user.streakLastCompletedDate = currentDateOnly();

      appendActivity({
        familyId: chore.familyId,
        userId: user.id,
        type: "chore_completed",
        title: `${user.username} completed ${chore.title}`,
        body: `Earned ${awardedPoints} stars.`,
        relatedEntityType: "chore",
        relatedEntityId: chore.id,
        metadata: { points: awardedPoints },
      });
    }

    return res.json({ chore, user, submission, awardedPoints });
  });

  app.post("/api/messages", (req, res) => {
    const familyId = Number(req.body?.familyId);
    const userId = Number(req.body?.userId);
    const currentUser = state.users.find(u => u.id === userId);
    
    const message: Message = {
      id: state.nextMessageId++,
      familyId,
      userId,
      senderName: currentUser?.username || "Unknown",
      content: typeof req.body?.content === "string" ? req.body.content : "",
      isSystem: false,
      createdAt: new Date(),
    };
    state.messages.push(message);
    return res.status(201).json(message);
  });

  app.patch("/api/users/:id/role", (req, res) => {
    const userId = parseParamId(req.params.id);
    const role = req.body?.role;
    const targetUser = state.users.find(u => u.id === userId);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    targetUser.role = role;
    if (targetUser.familyId) {
      appendActivity({
        familyId: targetUser.familyId,
        userId: targetUser.id,
        type: "role_changed",
        title: `${targetUser.username}'s role changed`,
        body: `${targetUser.username} is now a ${targetUser.role}.`,
        relatedEntityType: "user",
        relatedEntityId: targetUser.id,
        metadata: {},
      });
    }
    publishDemoEvent(targetUser.familyId!, "family:user", targetUser);

    return res.json(targetUser);
  });
  
  app.patch("/api/users/:id/leaderboard", (req, res) => {
    const userId = parseParamId(req.params.id);
    const targetUser = state.users.find(u => u.id === userId);
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    if (req.body?.hideFromLeaderboard !== undefined) {
      targetUser.hideFromLeaderboard = req.body.hideFromLeaderboard;
    }
    if (targetUser.familyId) {
      publishDemoEvent(targetUser.familyId, "family:user", targetUser);
    }
    return res.json(targetUser);
  });

  app.post("/api/rewards/:id/claim", (req, res) => {
    const rewardId = parseParamId(req.params.id);
    const userId = Number(req.body?.userId);
    const reward = state.rewards.find(r => r.id === rewardId);
    const user = state.users.find(u => u.id === userId);

    if (!reward || !user) return res.status(404).json({ message: "Reward or user not found" });

    const quantity = Number.isFinite(Number(req.body?.quantity)) ? Number(req.body.quantity) : 1;
    const totalCost = reward.costPoints * quantity;

    if (user.points < totalCost && !reward.requiresApproval) {
      return res.status(400).json({ message: "Not enough stars" });
    }

    const claim: RewardClaim = {
      id: state.nextClaimId++,
      familyId: reward.familyId!,
      rewardId: reward.id,
      userId: user.id,
      quantity,
      totalCost,
      status: reward.requiresApproval ? "submitted" : "approved",
      note: typeof req.body?.note === "string" ? req.body.note : null,
      reviewNote: null,
      reviewedBy: null,
      reviewedAt: null,
      undoneAt: null,
      createdAt: new Date(),
    };

    if (!reward.requiresApproval) {
      user.points -= totalCost;
      appendActivity({
        familyId: reward.familyId!,
        userId: user.id,
        type: "reward_claimed",
        title: `${user.username} claimed ${reward.title}`,
        body: `Spent ${totalCost} stars.`,
        relatedEntityType: "reward",
        relatedEntityId: reward.id,
        metadata: { cost: totalCost },
      });
    } else {
       appendActivity({
        familyId: reward.familyId!,
        userId: user.id,
        type: "reward_claimed",
        title: `${user.username} requested ${reward.title}`,
        body: "Waiting for review.",
        relatedEntityType: "reward",
        relatedEntityId: reward.id,
        metadata: { cost: totalCost },
      });
    }

    state.rewardClaims.push(claim);
    return res.status(201).json({ claim, user });
  });

  app.get("/api/families/:id/reward-claims/pending", (req, res) => {
    const familyId = parseParamId(req.params.id);
    if (!familyId) return res.status(400).json({ message: "Invalid family id" });
    return res.json(state.rewardClaims.filter(c => c.familyId === familyId && c.status === "submitted").map(c => ({
      ...c,
      reward: state.rewards.find(r => r.id === c.rewardId),
      user: state.users.find(u => u.id === c.userId),
    })));
  });

  app.post("/api/reward-claims/:id/review", (req, res) => {
    const claimId = parseParamId(req.params.id);
    const action = req.body?.action;
    const claim = state.rewardClaims.find(c => c.id === claimId);
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    const user = state.users.find(u => u.id === claim.userId);
    const reward = state.rewards.find(r => r.id === claim.rewardId);
    const currentUser = findCurrentDemoUser(req, state);

    if (action === "approve") {
      claim.status = "approved";
      claim.reviewedBy = currentUser?.id ?? null;
      claim.reviewedAt = new Date();
      if (user) {
        user.points -= claim.totalCost;
        appendActivity({
          familyId: claim.familyId,
          userId: user.id,
          type: "reward_claimed",
          title: `${user.username}'s claim for ${reward?.title} was approved!`,
          body: `Spent ${claim.totalCost} stars.`,
          relatedEntityType: "reward",
          relatedEntityId: claim.rewardId,
          metadata: { cost: claim.totalCost, approvedBy: currentUser?.id },
        });
      }
    } else if (action === "reject") {
      claim.status = "rejected";
    }

    return res.json({ claim });
  });

  app.get("/api/families/:id/chore-submissions/pending", (req, res) => {
    const familyId = parseParamId(req.params.id);
    if (!familyId) return res.status(400).json({ message: "Invalid family id" });
    return res.json(state.choreSubmissions.filter(c => c.familyId === familyId && c.status === "submitted").map(c => ({
      ...c,
      chore: state.chores.find(ch => ch.id === c.choreId),
      user: state.users.find(u => u.id === c.userId),
    })));
  });

  app.post("/api/chore-submissions/:id/review", (req, res) => {
    const subId = parseParamId(req.params.id);
    const action = req.body?.action;
    const sub = state.choreSubmissions.find(s => s.id === subId);
    if (!sub) return res.status(404).json({ message: "Submission not found" });

    const user = state.users.find(u => u.id === sub.userId);
    const chore = state.chores.find(c => c.id === sub.choreId);
    const currentUser = findCurrentDemoUser(req, state);
    const awardedPoints = chore?.points ?? 0;

    if (action === "approve") {
      sub.status = "approved";
      sub.reviewedBy = currentUser?.id ?? null;
      sub.pointsAwarded = awardedPoints;
      sub.reviewedAt = new Date();
      
      if (user) {
        user.points += awardedPoints;
        user.streak += 1;
        user.streakLastCompletedDate = currentDateOnly();
        appendActivity({
          familyId: sub.familyId,
          userId: user.id,
          type: "chore_approved",
          title: `${chore?.title} was approved!`,
          body: `Earned ${awardedPoints} stars.`,
          relatedEntityType: "chore",
          relatedEntityId: sub.choreId,
          metadata: { points: awardedPoints, approvedBy: currentUser?.id },
        });
      }
    } else if (action === "reject") {
      sub.status = "rejected";
    }

    return res.json({ submission: sub });
  });

  app.get("/api/events/stream", (req, res) => {
    const familyId = Number(req.query.familyId);
    const currentUser = findCurrentDemoUser(req, state);
    if (!currentUser || !Number.isFinite(familyId) || currentUser.familyId !== familyId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();
    res.write(`event: family:heartbeat\n`);
    res.write(`data: ${JSON.stringify({ at: new Date().toISOString() })}\n\n`);

    const client = { res, familyId };
    sseClients.add(client);

    const timer = setInterval(() => {
      res.write(`event: family:heartbeat\n`);
      res.write(`data: ${JSON.stringify({ at: new Date().toISOString() })}\n\n`);
    }, 25000);

    req.on("close", () => {
      clearInterval(timer);
      sseClients.delete(client);
      res.end();
    });
  });
}
