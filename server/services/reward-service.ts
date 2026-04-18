import { and, eq } from "drizzle-orm";
import { rewardClaims, rewards, users } from "@shared/schema";
import type { User } from "@shared/schema";
import { db } from "../db";
import { recordActivity } from "./activity-service";
import { createSystemMessage } from "./message-service";
import { evaluateAchievements } from "./achievement-service";
import { publishFamilyEvent } from "../realtime";
import { notifyParentsOfRewardClaimed } from "./email-service";

async function getRewardClaim(id: number) {
  const [claim] = await db.select().from(rewardClaims).where(eq(rewardClaims.id, id));
  return claim;
}

export async function claimReward(rewardId: number, userId: number, quantity: number, note?: string) {
  const [reward] = await db.select().from(rewards).where(eq(rewards.id, rewardId));
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!reward || !user || !user.familyId) throw new Error("Reward not found");

  const totalCost = reward.costPoints * quantity;
  if (!reward.requiresApproval && user.points < totalCost) {
    throw new Error("Not enough stars yet.");
  }

  const [claim] = await db
    .insert(rewardClaims)
    .values({
      familyId: user.familyId,
      rewardId,
      userId,
      quantity,
      totalCost,
      note,
      status: reward.requiresApproval ? "submitted" : "approved",
      reviewedAt: reward.requiresApproval ? null : new Date(),
      reviewedBy: reward.requiresApproval ? null : user.id,
    })
    .returning();

  if (reward.requiresApproval) {
    await recordActivity({
      familyId: user.familyId,
      userId: user.id,
      type: "reward_requested",
      title: `${user.username} requested a reward`,
      body: `${reward.title} is waiting for approval.`,
      relatedEntityType: "reward_claim",
      relatedEntityId: claim.id,
    });
    await createSystemMessage(user.familyId, user.id, `🎟️ ${user.username} requested "${reward.title}".`);
    publishFamilyEvent(user.familyId, "family:review", claim);
    return { user, claim };
  }

  const [updatedUser] = await db
    .update(users)
    .set({ points: user.points - totalCost })
    .where(eq(users.id, user.id))
    .returning();

  await recordActivity({
    familyId: user.familyId,
    userId: user.id,
    type: "reward_claimed",
    title: `${user.username} claimed a reward`,
    body: `${reward.title} cost ${totalCost} stars.`,
    relatedEntityType: "reward_claim",
    relatedEntityId: claim.id,
  });
  await createSystemMessage(user.familyId, user.id, `🎉 ${user.username} claimed "${reward.title}" for ${totalCost} stars.`);
  await evaluateAchievements(updatedUser);
  publishFamilyEvent(user.familyId, "family:reward", claim);
  publishFamilyEvent(user.familyId, "family:leaderboard", { familyId: user.familyId, userId: updatedUser.id });
  
  notifyParentsOfRewardClaimed(user.familyId, user.username, reward.title).catch(console.error);

  return { user: updatedUser, claim };
}

export async function reviewRewardClaim(claimId: number, reviewer: User, action: "approve" | "reject" | "undo" | "cancel", note?: string) {
  const claim = await getRewardClaim(claimId);
  if (!claim) throw new Error("Claim not found");
  if (claim.familyId !== reviewer.familyId) throw new Error("Forbidden");

  const [reward] = await db.select().from(rewards).where(eq(rewards.id, claim.rewardId));
  const [user] = await db.select().from(users).where(eq(users.id, claim.userId));
  if (!reward || !user || !user.familyId) throw new Error("Claim is no longer valid");

  if (action === "approve") {
    if (user.points < claim.totalCost) {
      throw new Error("That user no longer has enough stars.");
    }

    const [updatedUser] = await db
      .update(users)
      .set({ points: user.points - claim.totalCost })
      .where(eq(users.id, user.id))
      .returning();

    const [updatedClaim] = await db
      .update(rewardClaims)
      .set({ status: "approved", reviewedAt: new Date(), reviewedBy: reviewer.id, reviewNote: note })
      .where(eq(rewardClaims.id, claimId))
      .returning();

    await recordActivity({
      familyId: user.familyId,
      userId: user.id,
      type: "reward_approved",
      title: `${user.username}'s reward was approved`,
      body: `${reward.title} is all set.`,
      relatedEntityType: "reward_claim",
      relatedEntityId: updatedClaim.id,
    });
    await createSystemMessage(user.familyId, reviewer.id, `✅ ${user.username}'s "${reward.title}" reward was approved.`);
    await evaluateAchievements(updatedUser);
    publishFamilyEvent(user.familyId, "family:review", updatedClaim);
    publishFamilyEvent(user.familyId, "family:leaderboard", { familyId: user.familyId, userId: updatedUser.id });
    return { claim: updatedClaim, user: updatedUser };
  }

  if (action === "reject") {
    const [updatedClaim] = await db
      .update(rewardClaims)
      .set({ status: "rejected", reviewedAt: new Date(), reviewedBy: reviewer.id, reviewNote: note })
      .where(eq(rewardClaims.id, claimId))
      .returning();

    await recordActivity({
      familyId: user.familyId,
      userId: user.id,
      type: "reward_rejected",
      title: `${user.username}'s reward request was declined`,
      body: note || `${reward.title} was not approved this time.`,
      relatedEntityType: "reward_claim",
      relatedEntityId: updatedClaim.id,
    });
    publishFamilyEvent(user.familyId, "family:review", updatedClaim);
    return { claim: updatedClaim, user };
  }

  if (action === "cancel" && claim.userId === reviewer.id && claim.status === "submitted") {
    const [updatedClaim] = await db
      .update(rewardClaims)
      .set({ status: "cancelled", reviewNote: note })
      .where(eq(rewardClaims.id, claimId))
      .returning();
    publishFamilyEvent(user.familyId, "family:review", updatedClaim);
    return { claim: updatedClaim, user };
  }

  throw new Error("Unsupported review action");
}
