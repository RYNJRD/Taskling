import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { choreLogs, monthlyWinners, users } from "@shared/schema";
import { db } from "../db";

function getMonthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

function getMonthBounds(date: Date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  return { start, end };
}

export async function ensurePreviousMonthWinners(familyId: number) {
  const now = new Date();
  const previousMonthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const monthKey = getMonthKey(previousMonthDate);

  const existing = await db.select().from(monthlyWinners).where(and(eq(monthlyWinners.familyId, familyId), eq(monthlyWinners.monthKey, monthKey)));
  if (existing.length > 0) return existing;

  const { start, end } = getMonthBounds(previousMonthDate);

  const topPoints = await db
    .select({
      userId: users.id,
      username: users.username,
      points: users.points,
      streak: users.streak,
      logs: sql<number>`count(${choreLogs.id})`,
    })
    .from(users)
    .leftJoin(
      choreLogs,
      and(eq(choreLogs.userId, users.id), gte(choreLogs.completedAt, start), lt(choreLogs.completedAt, end)),
    )
    .where(eq(users.familyId, familyId))
    .groupBy(users.id)
    .orderBy(desc(sql<number>`count(${choreLogs.id})`), desc(users.points))
    .limit(1);

  if (topPoints.length === 0) return [];
  const winner = topPoints[0];

  const [created] = await db
    .insert(monthlyWinners)
    .values({
      familyId,
      monthKey,
      awardType: "household_star",
      userId: winner.userId,
      title: "Household Star",
      summary: `${winner.username} led the family with the strongest month.`,
      stats: {
        completedChores: winner.logs,
        streak: winner.streak,
        points: winner.points,
      },
    })
    .returning();

  return [created];
}
