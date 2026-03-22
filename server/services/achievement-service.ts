import { and, eq, sql } from "drizzle-orm";
import { ACHIEVEMENTS, getAchievementDefinition } from "@shared/achievements";
import { choreLogs, rewardClaims, userAchievements, users } from "@shared/schema";
import type { User } from "@shared/schema";
import { db } from "../db";
import { recordActivity } from "./activity-service";
import { createSystemMessage } from "./message-service";

async function hasAchievement(userId: number, code: string) {
  const [existing] = await db
    .select()
    .from(userAchievements)
    .where(and(eq(userAchievements.userId, userId), eq(userAchievements.code, code)));
  return !!existing;
}

export async function awardAchievementIfMissing(user: User, code: string) {
  const definition = getAchievementDefinition(code);
  if (!definition || !user.familyId) return null;
  if (await hasAchievement(user.id, code)) return null;

  const [achievement] = await db
    .insert(userAchievements)
    .values({
      familyId: user.familyId,
      userId: user.id,
      code: definition.code,
      title: definition.title,
      description: definition.description,
      emoji: definition.emoji,
    })
    .returning();

  await recordActivity({
    familyId: user.familyId,
    userId: user.id,
    type: "achievement_earned",
    title: `${definition.emoji} ${definition.title}`,
    body: `${user.username} earned ${definition.title}.`,
    relatedEntityType: "achievement",
    relatedEntityId: achievement.id,
    metadata: { code },
  });

  await createSystemMessage(
    user.familyId,
    user.id,
    `${definition.emoji} ${user.username} unlocked ${definition.title}!`,
  );

  return achievement;
}

export async function evaluateAchievements(user: User) {
  const familyId = user.familyId;
  if (!familyId) return [];

  const [completedStats] = await db
    .select({ count: sql<number>`count(*)` })
    .from(choreLogs)
    .where(eq(choreLogs.userId, user.id));

  const [sharedStats] = await db
    .select({ count: sql<number>`count(*)` })
    .from(choreLogs)
    .innerJoin(users, eq(users.id, choreLogs.userId))
    .where(eq(choreLogs.userId, user.id));

  const [rewardStats] = await db
    .select({ count: sql<number>`count(*)` })
    .from(rewardClaims)
    .where(and(eq(rewardClaims.userId, user.id), eq(rewardClaims.status, "approved")));

  const earned = [];
  if ((completedStats?.count ?? 0) >= 1) {
    const achievement = await awardAchievementIfMissing(user, "first_steps");
    if (achievement) earned.push(achievement);
  }
  if ((completedStats?.count ?? 0) >= 10) {
    const achievement = await awardAchievementIfMissing(user, "helper_10");
    if (achievement) earned.push(achievement);
  }
  if (user.streak >= 7) {
    const achievement = await awardAchievementIfMissing(user, "streak_7");
    if (achievement) earned.push(achievement);
  }
  if (user.streak >= 30) {
    const achievement = await awardAchievementIfMissing(user, "streak_30");
    if (achievement) earned.push(achievement);
  }
  if ((rewardStats?.count ?? 0) >= 1) {
    const achievement = await awardAchievementIfMissing(user, "reward_redeemer");
    if (achievement) earned.push(achievement);
  }
  if ((sharedStats?.count ?? 0) >= 3) {
    const achievement = await awardAchievementIfMissing(user, "team_player");
    if (achievement) earned.push(achievement);
  }
  return earned;
}

export { ACHIEVEMENTS };
