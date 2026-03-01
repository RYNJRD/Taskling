import { db } from "./db";
import { families, users, chores, choreLogs, rewards, messages, type InsertFamily, type InsertUser, type InsertChore, type InsertReward, type Family, type User, type Chore, type Reward, type Message } from "@shared/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { calculateStreakMultiplier, getEffectiveStreakForDate, getFamilyTimeZone, getLocalDateKey } from "@shared/streak";

// Helper to generate a memorable invite code
function generateInviteCode(familyName: string): string {
  const words = ['STAR', 'MOON', 'FIRE', 'WAVE', 'BOLT', 'LEAF', 'ROCK', 'WIND', 'SNOW', 'RAIN'];
  const word = words[Math.floor(Math.random() * words.length)];
  const prefix = familyName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3) || 'FAM';
  const number = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${word}${number}`;
}

// Helper to check if user is admin of family
export async function isUserAdminOfFamily(userId: number, familyId: number): Promise<boolean> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  return user?.familyId === familyId && user?.role === 'admin';
}

export interface IStorage {
  createFamily(family: InsertFamily): Promise<Family>;
  getFamily(id: number): Promise<Family | undefined>;
  getFamilyByCode(code: string): Promise<Family | undefined>;
  getFamilyUsers(familyId: number): Promise<User[]>;
  getFamilyChores(familyId: number): Promise<Chore[]>;
  createUser(user: InsertUser): Promise<User>;
  getUser(id: number): Promise<User | undefined>;
  updateUserAvatar(id: number, config: string): Promise<User>;
  updateUserLeaderboard(id: number, hide: boolean): Promise<User | undefined>;
  createChore(chore: InsertChore): Promise<Chore>;
  updateChore(id: number, updates: Partial<InsertChore>): Promise<Chore>;
  completeChore(choreId: number, userId: number): Promise<{ chore: Chore, user: User }>;
  getRewards(familyId: number): Promise<Reward[]>;
  createReward(reward: InsertReward): Promise<Reward>;
  claimReward(rewardId: number, userId: number, quantity: number): Promise<{ user: User }>;
  getMessages(familyId: number): Promise<Message[]>;
  createMessage(message: { familyId: number, userId: number, senderName: string, content: string, isSystem?: boolean }): Promise<Message>;
  setupDemo(): Promise<Family>;
  getOrCreateCurrentDemo(): Promise<Family>;
}

let currentDemoFamily: Family | null = null;
let lastDemoRotation: number = 0;
const ROTATION_INTERVAL = 5 * 60 * 1000; // 5 minutes

export class DatabaseStorage implements IStorage {
  async getOrCreateCurrentDemo(): Promise<Family> {
    const now = Date.now();
    if (!currentDemoFamily || (now - lastDemoRotation) > ROTATION_INTERVAL) {
      currentDemoFamily = await this.setupDemo();
      lastDemoRotation = now;
    }
    return currentDemoFamily;
  }

  async createFamily(family: InsertFamily): Promise<Family> {
    // If no invite code provided, generate a memorable one
    if (!family.inviteCode) {
      family.inviteCode = generateInviteCode(family.name);
    }
    const [newFamily] = await db.insert(families).values(family).returning();
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
    return await db.select().from(users).where(eq(users.familyId, familyId)).orderBy(desc(users.points));
  }
  async getFamilyChores(familyId: number): Promise<Chore[]> {
    return await db.select().from(chores).where(eq(chores.familyId, familyId));
  }
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async updateUserAvatar(id: number, config: string): Promise<User> {
    const [updated] = await db.update(users).set({ avatarConfig: config }).where(eq(users.id, id)).returning();
    return updated;
  }
  async updateUserLeaderboard(id: number, hide: boolean): Promise<User | undefined> {
    const [updated] = await db.update(users).set({ hideFromLeaderboard: hide }).where(eq(users.id, id)).returning();
    return updated;
  }
  async createChore(chore: InsertChore): Promise<Chore> {
    const [newChore] = await db.insert(chores).values(chore).returning();
    return newChore;
  }
  async updateChore(id: number, updates: Partial<InsertChore>): Promise<Chore> {
    const [updated] = await db.update(chores).set(updates).where(eq(chores.id, id)).returning();
    return updated;
  }
  async completeChore(choreId: number, userId: number): Promise<{ chore: Chore, user: User }> {
    const [chore] = await db.select().from(chores).where(eq(chores.id, choreId));
    if (!chore) throw new Error("Chore not found");
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new Error("User not found");

    const family = user.familyId
      ? await this.getFamily(user.familyId)
      : undefined;
    const timeZone = getFamilyTimeZone(family);
    const now = new Date();
    const todayKey = getLocalDateKey(now, timeZone);

    const effectiveStreak = getEffectiveStreakForDate(user, now, timeZone);
    const { multiplier, bonusPercent } = calculateStreakMultiplier(effectiveStreak);

    const isAssignedDaily =
      chore.type === "daily" && chore.assigneeId === user.id;

    const basePoints = chore.points;
    const finalPoints =
      isAssignedDaily && bonusPercent > 0
        ? Math.ceil(basePoints * multiplier)
        : basePoints;

    const [updatedChore] = await db
      .update(chores)
      .set({
        lastCompletedAt: now,
        lastCompletedBy: userId,
      })
      .where(eq(chores.id, choreId))
      .returning();

    const [userWithPoints] = await db
      .update(users)
      .set({ points: user.points + finalPoints })
      .where(eq(users.id, userId))
      .returning();

    await db.insert(choreLogs).values({
      choreId,
      userId,
    });

    const updatedUser = await this.updateUserStreakIfAllDailyDoneToday(
      userWithPoints,
      family,
      todayKey,
      timeZone
    );

    await this.createMessage({
      familyId: user.familyId!,
      userId: user.id,
      senderName: "Chorely",
      content: `✅ ${user.username} has completed: ${chore.title} ⭐️`,
      isSystem: true,
    });

    return { chore: updatedChore, user: updatedUser };
  }
  async getRewards(familyId: number): Promise<Reward[]> {
    return await db.select().from(rewards).where(eq(rewards.familyId, familyId));
  }
  async createReward(reward: InsertReward): Promise<Reward> {
    const [newReward] = await db.insert(rewards).values(reward).returning();
    return newReward;
  }
  async claimReward(rewardId: number, userId: number, quantity: number): Promise<{ user: User }> {
    const [reward] = await db.select().from(rewards).where(eq(rewards.id, rewardId));
    if (!reward) throw new Error("Reward not found");
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new Error("User not found");

    const totalCost = reward.costPoints * quantity;
    if (user.points < totalCost) throw new Error("Not enough stars!");

    const [updatedUser] = await db.update(users)
      .set({ points: user.points - totalCost })
      .where(eq(users.id, userId)).returning();

    const qtyText = quantity === 1 ? "one" : quantity.toString();
    await this.createMessage({
      familyId: user.familyId!,
      userId: user.id,
      senderName: "Chorely",
      content: `✨ ROYALTY ALERT ✨ ${user.username} purchased ${qtyText} "${reward.title}"! 👑`,
      isSystem: true
    });

    return { user: updatedUser };
  }
  async getMessages(familyId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.familyId, familyId)).orderBy(messages.createdAt);
  }
  async createMessage(message: { familyId: number, userId: number, senderName: string, content: string, isSystem?: boolean }): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }
  private async updateUserStreakIfAllDailyDoneToday(
    user: User,
    family: Family | undefined,
    todayKey: string,
    timeZone: string
  ): Promise<User> {
    if (!family) return user;

    const dailyChores = await db
      .select()
      .from(chores)
      .where(
        and(
          eq(chores.familyId, family.id),
          eq(chores.type, "daily"),
          eq(chores.assigneeId, user.id)
        )
      );

    if (dailyChores.length === 0) return user;

    const choreIds = dailyChores.map((c) => c.id);

    const logs = await db
      .select()
      .from(choreLogs)
      .where(
        and(
          eq(choreLogs.userId, user.id),
          inArray(choreLogs.choreId, choreIds)
        )
      );

    const completedToday = new Set(
      logs
        .filter(
          (log) => getLocalDateKey(log.completedAt, timeZone) === todayKey
        )
        .map((log) => log.choreId)
    );

    const allDailyDone = dailyChores.every((c) =>
      completedToday.has(c.id)
    );

    if (!allDailyDone) return user;

    const currentDate = new Date();
    const effectiveStreak = getEffectiveStreakForDate(
      user,
      currentDate,
      timeZone
    );

    const newStreak = effectiveStreak > 0 ? effectiveStreak + 1 : 1;

    const [updatedUser] = await db
      .update(users)
      .set({
        streak: newStreak,
        streakLastCompletedDate: todayKey,
      })
      .where(eq(users.id, user.id))
      .returning();

    return updatedUser;
  }
  async setupDemo(): Promise<Family> {
    const code = generateInviteCode("DEMO");
    const family = await this.createFamily({ name: "The Demo Family", inviteCode: code });
    
    const dad = await this.createUser({ familyId: family.id, username: "Dad", role: "admin", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dad" });
    const mom = await this.createUser({ familyId: family.id, username: "Mom", role: "admin", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mom" });
    const kid1 = await this.createUser({ familyId: family.id, username: "Jimmy", role: "member", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jimmy" });
    const kid2 = await this.createUser({ familyId: family.id, username: "Sarah", role: "member", avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" });
    
    await this.createChore({ familyId: family.id, title: "Empty Dishwasher", points: 10, type: "daily", assigneeId: kid1.id });
    await this.createChore({ familyId: family.id, title: "Tidy Room", points: 15, type: "daily", assigneeId: kid2.id });
    await this.createChore({ familyId: family.id, title: "Take out Trash", points: 10, type: "daily", assigneeId: null });
    await this.createChore({ familyId: family.id, title: "Mow the Lawn", points: 50, type: "weekly", assigneeId: dad.id });
    await this.createChore({ familyId: family.id, title: "Clean Bathroom", points: 40, type: "weekly", assigneeId: mom.id });
    await this.createChore({ familyId: family.id, title: "Deep Clean Garage", points: 100, type: "monthly", assigneeId: dad.id });
    await this.createChore({ familyId: family.id, title: "Fold Laundry", points: 20, type: "box", assigneeId: null });
    await this.createChore({ familyId: family.id, title: "Walk the Dog", points: 30, type: "box", assigneeId: null });
    
    await this.createReward({ familyId: family.id, title: "$10 Robux Card", costPoints: 500 });
    await this.createReward({ familyId: family.id, title: "Stay up 1hr later", costPoints: 200 });
    await this.createReward({ familyId: family.id, title: "Pizza Night Choice", costPoints: 300 });

    return family;
  }
}

export const storage = new DatabaseStorage();
