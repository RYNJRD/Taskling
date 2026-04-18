import { and, eq, inArray } from "drizzle-orm";
import { choreLogs, choreSubmissions, chores, families, users } from "@shared/schema";
import type { ChoreSubmission, User } from "@shared/schema";
import { db } from "../db";
import { calculateStreakMultiplier, getEffectiveStreakForDate, getFamilyTimeZone, getLocalDateKey } from "@shared/streak";
import { createSystemMessage } from "./message-service";
import { recordActivity } from "./activity-service";
import { evaluateAchievements } from "./achievement-service";
import { publishFamilyEvent } from "../realtime";
import { notifyParentsOfChoreCompleted } from "./email-service";
import { notifyParentsOfChoreCompleted } from "./email-service";

async function getFamilyById(id: number | null | undefined) {
  if (!id) return undefined;
  const [family] = await db.select().from(families).where(eq(families.id, id));
  return family;
}

async function getCurrentUserById(id: number) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

async function updateUserStreakIfAllDailyDoneToday(user: User): Promise<User> {
  const family = await getFamilyById(user.familyId);
  if (!family) return user;
  const timeZone = getFamilyTimeZone(family);
  const todayKey = getLocalDateKey(new Date(), timeZone);

  const dailyChores = await db
    .select()
    .from(chores)
    .where(and(eq(chores.familyId, family.id), eq(chores.type, "daily"), eq(chores.assigneeId, user.id), eq(chores.isActive, true)));

  if (dailyChores.length === 0) return user;

  const logs = await db
    .select()
    .from(choreLogs)
    .where(and(eq(choreLogs.userId, user.id), inArray(choreLogs.choreId, dailyChores.map((chore) => chore.id))));

  const completedToday = new Set(
    logs.filter((log) => getLocalDateKey(log.completedAt, timeZone) === todayKey).map((log) => log.choreId),
  );

  const allDone = dailyChores.every((chore) => completedToday.has(chore.id));
  if (!allDone) return user;

  const effectiveStreak = getEffectiveStreakForDate(user, new Date(), timeZone);
  const [updated] = await db
    .update(users)
    .set({
      streak: effectiveStreak > 0 ? effectiveStreak + 1 : 1,
      streakLastCompletedDate: todayKey,
    })
    .where(eq(users.id, user.id))
    .returning();

  if (updated.streak === 7 || updated.streak === 30) {
    await recordActivity({
      familyId: family.id,
      userId: updated.id,
      type: "streak_milestone",
      title: `${updated.username} hit a ${updated.streak}-day streak`,
      body: `${updated.username} is on a roll.`,
      relatedEntityType: "user",
      relatedEntityId: updated.id,
      metadata: { streak: updated.streak },
    });
    await createSystemMessage(family.id, updated.id, `🔥 ${updated.username} reached a ${updated.streak}-day streak!`);
  }

  return updated;
}

function calculateAwardedPoints(chore: typeof chores.$inferSelect, user: User, familyTimeZone: string) {
  const effectiveStreak = getEffectiveStreakForDate(user, new Date(), familyTimeZone);
  const { multiplier, bonusPercent } = calculateStreakMultiplier(effectiveStreak);
  const isAssignedDaily = chore.type === "daily" && chore.assigneeId === user.id;
  const finalPoints = isAssignedDaily && bonusPercent > 0 ? Math.ceil(chore.points * multiplier) : chore.points;
  return { finalPoints, bonusPercent };
}

async function approveChoreSubmissionInternal(submissionId: number, reviewerId: number, note?: string) {
  const [submission] = await db.select().from(choreSubmissions).where(eq(choreSubmissions.id, submissionId));
  if (!submission) throw new Error("Submission not found");
  if (submission.status !== "submitted") throw new Error("This submission has already been reviewed");

  const [chore] = await db.select().from(chores).where(eq(chores.id, submission.choreId));
  const [user] = await db.select().from(users).where(eq(users.id, submission.userId));
  if (!chore || !user || !user.familyId) throw new Error("Submission is no longer valid");

  const now = new Date();
  await db.insert(choreLogs).values({ choreId: chore.id, userId: user.id, completedAt: now });

  await db.update(chores).set({ lastCompletedAt: now, lastCompletedBy: user.id }).where(eq(chores.id, chore.id));

  const [scoredUser] = await db
    .update(users)
    .set({ points: user.points + submission.pointsAwarded })
    .where(eq(users.id, user.id))
    .returning();

  const updatedUser = await updateUserStreakIfAllDailyDoneToday(scoredUser);

  const [updatedSubmission] = await db
    .update(choreSubmissions)
    .set({
      status: "approved",
      reviewedBy: reviewerId,
      reviewedAt: now,
      reviewNote: note,
    })
    .where(eq(choreSubmissions.id, submissionId))
    .returning();

  if (reviewerId !== user.id) {
    await recordActivity({
      familyId: user.familyId,
      userId: user.id,
      type: "chore_approved",
      title: `${user.username}'s chore was approved`,
      body: `${chore.title} earned ${submission.pointsAwarded} stars.`,
      relatedEntityType: "chore_submission",
      relatedEntityId: updatedSubmission.id,
    });

    await createSystemMessage(user.familyId, user.id, `✅ ${user.username}'s "${chore.title}" was approved for ${submission.pointsAwarded} stars.`);
  }
  await evaluateAchievements(updatedUser);
  publishFamilyEvent(user.familyId, "family:leaderboard", { familyId: user.familyId, userId: updatedUser.id });
  publishFamilyEvent(user.familyId, "family:review", updatedSubmission);
  return { submission: updatedSubmission, user: updatedUser };
}

export async function completeChore(choreId: number, userId: number, note?: string) {
  const [chore] = await db.select().from(chores).where(eq(chores.id, choreId));
  const user = await getCurrentUserById(userId);
  if (!chore || !user || !user.familyId) throw new Error("Chore not found");

  if (chore.assigneeId && chore.assigneeId !== user.id && chore.assigneeId !== null) {
    throw new Error("This chore belongs to someone else");
  }

  const [existingPending] = await db
    .select()
    .from(choreSubmissions)
    .where(and(eq(choreSubmissions.choreId, choreId), eq(choreSubmissions.userId, userId), eq(choreSubmissions.status, "submitted")));

  if (existingPending) {
    throw new Error("This chore is already waiting for review");
  }

  const family = await getFamilyById(user.familyId);
  const timeZone = getFamilyTimeZone(family);
  const { finalPoints } = calculateAwardedPoints(chore, user, timeZone);

  if (chore.requiresApproval) {
    const [submission] = await db
      .insert(choreSubmissions)
      .values({
        familyId: user.familyId,
        choreId,
        userId,
        note,
        status: "submitted",
        pointsAwarded: finalPoints,
      })
      .returning();

    await recordActivity({
      familyId: user.familyId,
      userId: user.id,
      type: "chore_submitted",
      title: `${user.username} submitted a chore`,
      body: `${chore.title} is ready for review.`,
      relatedEntityType: "chore_submission",
      relatedEntityId: submission.id,
    });
    await createSystemMessage(user.familyId, user.id, `📝 ${user.username} submitted "${chore.title}" for review.`);
    publishFamilyEvent(user.familyId, "family:review", submission);

    notifyParentsOfChoreCompleted(user.familyId, user.username, chore.title).catch(console.error);

    return {
      chore,
      user,
      submission,
      awardedPoints: 0,
    };
  }

  const [submission] = await db
    .insert(choreSubmissions)
    .values({
      familyId: user.familyId,
      choreId,
      userId,
      note,
      status: "submitted",
      pointsAwarded: finalPoints,
    })
    .returning();

  const result = await approveChoreSubmissionInternal(submission.id, user.id, "Auto-approved");

  await recordActivity({
    familyId: user.familyId,
    userId: user.id,
    type: "chore_completed",
    title: `${user.username} completed a chore`,
    body: `${chore.title} earned ${finalPoints} stars.`,
    relatedEntityType: "chore",
    relatedEntityId: chore.id,
  });
  await createSystemMessage(user.familyId, user.id, `✨ ${user.username} completed "${chore.title}" for ${finalPoints} stars.`);
  publishFamilyEvent(user.familyId, "family:chore", { choreId: chore.id, userId: user.id, awardedPoints: finalPoints });

  notifyParentsOfChoreCompleted(user.familyId, user.username, chore.title).catch(console.error);

  return {
    chore,
    user: result.user,
    submission: result.submission,
    awardedPoints: finalPoints,
  };
}

export async function reviewChoreSubmission(submissionId: number, reviewer: User, action: "approve" | "reject" | "undo" | "cancel", note?: string) {
  const [submission] = await db.select().from(choreSubmissions).where(eq(choreSubmissions.id, submissionId));
  if (!submission) throw new Error("Submission not found");
  if (reviewer.familyId !== submission.familyId) throw new Error("Forbidden");

  if (action === "approve") {
    return approveChoreSubmissionInternal(submissionId, reviewer.id, note);
  }

  const [chore] = await db.select().from(chores).where(eq(chores.id, submission.choreId));
  const [user] = await db.select().from(users).where(eq(users.id, submission.userId));
  if (!user || !user.familyId) throw new Error("Submission is no longer valid");

  if (action === "reject") {
    const [updated] = await db
      .update(choreSubmissions)
      .set({
        status: "rejected",
        reviewedBy: reviewer.id,
        reviewedAt: new Date(),
        rejectionReason: note,
      })
      .where(eq(choreSubmissions.id, submissionId))
      .returning();

    await recordActivity({
      familyId: user.familyId,
      userId: user.id,
      type: "chore_rejected",
      title: `${user.username}'s chore needs another pass`,
      body: note || `${chore?.title || "That chore"} was sent back for another try.`,
      relatedEntityType: "chore_submission",
      relatedEntityId: updated.id,
    });
    await createSystemMessage(user.familyId, reviewer.id, `💬 ${user.username}'s "${chore?.title || "chore"}" needs another pass.`);
    publishFamilyEvent(user.familyId, "family:review", updated);
    return { submission: updated, user };
  }

  if (action === "cancel" && submission.userId === reviewer.id && submission.status === "submitted") {
    const [updated] = await db
      .update(choreSubmissions)
      .set({ status: "cancelled", reviewNote: note })
      .where(eq(choreSubmissions.id, submissionId))
      .returning();
    publishFamilyEvent(user.familyId, "family:review", updated);
    return { submission: updated, user };
  }

  throw new Error("Unsupported review action");
}
