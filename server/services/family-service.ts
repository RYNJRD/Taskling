import { eq, sql } from "drizzle-orm";
import { chores, families, rewards, users } from "@shared/schema";
import { db } from "../db";

export async function getFamilyOnboardingChecklist(familyId: number) {
  const [familyStats] = await db
    .select({
      members: sql<number>`(select count(*) from ${users} where ${users.familyId} = ${familyId})`,
      choresCount: sql<number>`(select count(*) from ${chores} where ${chores.familyId} = ${familyId})`,
      rewardsCount: sql<number>`(select count(*) from ${rewards} where ${rewards.familyId} = ${familyId})`,
    })
    .from(families)
    .where(eq(families.id, familyId));

  return [
    {
      key: "family-created",
      label: "Create your family",
      description: "Your home base is ready to go.",
      complete: true,
    },
    {
      key: "add-first-chore",
      label: "Add your first chore",
      description: "Give everyone something they can do tonight.",
      complete: (familyStats?.choresCount ?? 0) > 0,
    },
    {
      key: "create-reward",
      label: "Create a reward",
      description: "Connect stars to something exciting.",
      complete: (familyStats?.rewardsCount ?? 0) > 0,
    },
    {
      key: "invite-family",
      label: "Invite another family member",
      description: "The game gets better when more people join in.",
      complete: (familyStats?.members ?? 0) > 1,
    },
  ];
}
