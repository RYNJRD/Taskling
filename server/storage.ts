import { and, desc, eq } from "drizzle-orm";
import {
  activityEvents,
  choreSubmissions,
  chores,
  families,
  messages,
  monthlyWinners,
  rewardClaims,
  rewards,
  type ActivityEvent,
  type Chore,
  type ChoreSubmission,
  type Family,
  type InsertChore,
  type InsertFamily,
  type InsertReward,
  type InsertUser,
  type Message,
  type MonthlyWinner,
  type Reward,
  type RewardClaim,
  type User,
  userAchievements,
  users,
} from "@shared/schema";
import { db } from "./db";

function generateInviteCode(familyName: string): string {
  const words = ["STAR", "MOON", "FIRE", "WAVE", "BOLT", "LEAF", "ROCK", "WIND", "SNOW", "RAIN"];
  const word = words[Math.floor(Math.random() * words.length)];
  const prefix = familyName.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3) || "FAM";
  const number = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${word}${number}`;
}

export interface IStorage {
  createFamily(family: InsertFamily): Promise<Family>;
  getFamily(id: number): Promise<Family | undefined>;
  getFamilyByCode(code: string): Promise<Family | undefined>;
  getFamilyUsers(familyId: number): Promise<User[]>;
  getFamilyChores(familyId: number): Promise<Chore[]>;
  createUser(user: InsertUser): Promise<User>;
  getUser(id: number): Promise<User | undefined>;
  getUserByFirebaseUid(uid: string): Promise<User | undefined>;
  updateUserAvatar(id: number, avatarConfig: string, avatarInventory?: string): Promise<User>;
  updateUserLeaderboard(id: number, hide: boolean): Promise<User | undefined>;
  updateUserRole(id: number, role: string): Promise<User | undefined>;
  createChore(chore: InsertChore): Promise<Chore>;
  getChore(id: number): Promise<Chore | undefined>;
  updateChore(id: number, updates: Partial<InsertChore>): Promise<Chore>;
  getRewards(familyId: number): Promise<Reward[]>;
  createReward(reward: InsertReward): Promise<Reward>;
  getMessages(familyId: number): Promise<Message[]>;
  createMessage(message: { familyId: number; userId: number; senderName: string; content: string; isSystem?: boolean }): Promise<Message>;
  getActivity(familyId: number): Promise<ActivityEvent[]>;
  getAchievements(familyId: number): Promise<(typeof userAchievements.$inferSelect)[]>;
  getMonthlyWinners(familyId: number): Promise<MonthlyWinner[]>;
  getPendingChoreSubmissions(familyId: number): Promise<ChoreSubmission[]>;
  getPendingRewardClaims(familyId: number): Promise<RewardClaim[]>;
  getOrCreateCurrentDemo(): Promise<Family>;
}

let currentDemoFamily: Family | null = null;
let lastDemoRotation = 0;
const ROTATION_INTERVAL = 5 * 60 * 1000;

export class DatabaseStorage implements IStorage {
  async createFamily(family: InsertFamily): Promise<Family> {
    const payload = {
      name: family.name,
      inviteCode: family.inviteCode ?? generateInviteCode(family.name),
      timeZone: family.timeZone ?? "UTC",
      themeColor: family.themeColor ?? "violet",
    };
    const [newFamily] = await db.insert(families).values(payload).returning();
    return newFamily;
  }

  async getFamily(id: number): Promise<Family | undefined> {
    const [family] = await db.select().from(families).where(eq(families.id, id));
    return family;
  }

  async getFamilyByCode(code: string): Promise<Family | undefined> {
    const [family] = await db.select().from(families).where(eq(families.inviteCode, code));
    return family;
  }

  async getFamilyUsers(familyId: number): Promise<User[]> {
    return db.select().from(users).where(eq(users.familyId, familyId)).orderBy(desc(users.points), users.username);
  }

  async getFamilyChores(familyId: number): Promise<Chore[]> {
    return db.select().from(chores).where(and(eq(chores.familyId, familyId), eq(chores.isActive, true)));
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values({
      avatarConfig: user.avatarConfig ?? "{}",
      avatarInventory: user.avatarInventory ?? "{}",
      ...user,
    }).returning();
    return newUser;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByFirebaseUid(uid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, uid));
    return user;
  }

  async updateUserAvatar(id: number, avatarConfig: string, avatarInventory?: string): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ avatarConfig, ...(avatarInventory ? { avatarInventory } : {}) })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async updateUserLeaderboard(id: number, hide: boolean): Promise<User | undefined> {
    const [updated] = await db.update(users).set({ hideFromLeaderboard: hide }).where(eq(users.id, id)).returning();
    return updated;
  }

  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const [updated] = await db.update(users).set({ role }).where(eq(users.id, id)).returning();
    return updated;
  }

  async createChore(chore: InsertChore): Promise<Chore> {
    const [newChore] = await db.insert(chores).values(chore).returning();
    return newChore;
  }

  async getChore(id: number): Promise<Chore | undefined> {
    const [chore] = await db.select().from(chores).where(eq(chores.id, id));
    return chore;
  }

  async updateChore(id: number, updates: Partial<InsertChore>): Promise<Chore> {
    const [updated] = await db.update(chores).set(updates).where(eq(chores.id, id)).returning();
    return updated;
  }

  async getRewards(familyId: number): Promise<Reward[]> {
    return db.select().from(rewards).where(eq(rewards.familyId, familyId)).orderBy(rewards.costPoints);
  }

  async createReward(reward: InsertReward): Promise<Reward> {
    const [newReward] = await db.insert(rewards).values(reward).returning();
    return newReward;
  }

  async getMessages(familyId: number): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.familyId, familyId)).orderBy(messages.createdAt);
  }

  async createMessage(message: {
    familyId: number;
    userId: number;
    senderName: string;
    content: string;
    isSystem?: boolean;
  }): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getActivity(familyId: number): Promise<ActivityEvent[]> {
    return db.select().from(activityEvents).where(eq(activityEvents.familyId, familyId)).orderBy(desc(activityEvents.createdAt));
  }

  async getAchievements(familyId: number) {
    return db.select().from(userAchievements).where(eq(userAchievements.familyId, familyId)).orderBy(desc(userAchievements.earnedAt));
  }

  async getMonthlyWinners(familyId: number): Promise<MonthlyWinner[]> {
    return db.select().from(monthlyWinners).where(eq(monthlyWinners.familyId, familyId)).orderBy(desc(monthlyWinners.monthKey));
  }

  async getPendingChoreSubmissions(familyId: number): Promise<ChoreSubmission[]> {
    return db
      .select()
      .from(choreSubmissions)
      .where(and(eq(choreSubmissions.familyId, familyId), eq(choreSubmissions.status, "submitted")))
      .orderBy(desc(choreSubmissions.createdAt));
  }

  async getPendingRewardClaims(familyId: number): Promise<RewardClaim[]> {
    return db
      .select()
      .from(rewardClaims)
      .where(and(eq(rewardClaims.familyId, familyId), eq(rewardClaims.status, "submitted")))
      .orderBy(desc(rewardClaims.createdAt));
  }

  async getOrCreateCurrentDemo(): Promise<Family> {
    const now = Date.now();
    if (!currentDemoFamily || now - lastDemoRotation > ROTATION_INTERVAL) {
      currentDemoFamily = await setupDemoFamily(this);
      lastDemoRotation = now;
    }
    return currentDemoFamily;
  }
}

async function setupDemoFamily(storage: DatabaseStorage): Promise<Family> {
  const family = await storage.createFamily({
    name: "The Demo Family",
    inviteCode: generateInviteCode("DEMO"),
    timeZone: "Europe/London",
    themeColor: "violet",
  });

  const parent = await storage.createUser({
    familyId: family.id,
    username: "Jordan",
    role: "admin",
    gender: "other",
    age: 38,
    avatarConfig: JSON.stringify({}),
  });

  const alex = await storage.createUser({
    familyId: family.id,
    username: "Alex",
    role: "member",
    gender: "other",
    age: 13,
    avatarConfig: JSON.stringify({}),
  });

  const mia = await storage.createUser({
    familyId: family.id,
    username: "Mia",
    role: "member",
    gender: "other",
    age: 10,
    avatarConfig: JSON.stringify({}),
  });

  await storage.createChore({
    familyId: family.id,
    title: "Empty dishwasher",
    description: "Put everything away before dinner.",
    points: 20,
    type: "daily",
    assigneeId: alex.id,
    requiresApproval: false,
    createdBy: parent.id,
    emoji: "🍽️",
  });

  await storage.createChore({
    familyId: family.id,
    title: "Tidy bedroom",
    description: "Quick five-minute reset.",
    points: 15,
    type: "daily",
    assigneeId: mia.id,
    requiresApproval: false,
    createdBy: parent.id,
    emoji: "🧸",
  });

  await storage.createChore({
    familyId: family.id,
    title: "Take out recycling",
    description: "Snap a quick photo if the bin is already full.",
    points: 30,
    type: "weekly",
    assigneeId: alex.id,
    requiresApproval: true,
    createdBy: parent.id,
    emoji: "♻️",
  });

  await storage.createChore({
    familyId: family.id,
    title: "Dog walk backup",
    description: "Anyone can jump in and help.",
    points: 25,
    type: "box",
    assigneeId: null,
    requiresApproval: false,
    createdBy: parent.id,
    emoji: "🐶",
  });

  await storage.createReward({
    familyId: family.id,
    title: "Choose Friday movie",
    description: "Winner picks the family movie night pick.",
    costPoints: 120,
    emoji: "🎬",
    requiresApproval: false,
    createdBy: parent.id,
  });

  await storage.createReward({
    familyId: family.id,
    title: "Later bedtime pass",
    description: "Worth one extra hour on Saturday.",
    costPoints: 220,
    emoji: "🌙",
    requiresApproval: true,
    createdBy: parent.id,
  });

  await storage.createMessage({
    familyId: family.id,
    userId: parent.id,
    senderName: "Chorely",
    content: "Welcome to the demo family. Try completing a chore, claiming a reward, and reviewing an approval.",
    isSystem: true,
  });

  return family;
}

export const storage = new DatabaseStorage();
