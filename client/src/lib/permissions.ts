import type { UserRole } from "../../../shared/constants";

export type AppFeature =
  | "manage_chores"        // create / edit / delete chores
  | "manage_rewards"       // create / edit rewards
  | "approve_claims"       // approve reward/chore submissions
  | "invite_family"        // generate invite links
  | "change_family_settings" // family name, reset cycle
  | "reset_data"           // reset all app data
  | "view_admin"           // access the admin panel
  | "complete_chores"      // mark chores as done (everyone)
  | "claim_rewards";       // claim / request rewards (everyone)

const PARENT_ONLY: AppFeature[] = [
  "manage_chores",
  "manage_rewards",
  "approve_claims",
  "invite_family",
  "change_family_settings",
  "reset_data",
  "view_admin",
];

/** Check whether a user with the given role can access a feature. */
export function canAccess(feature: AppFeature, role: UserRole): boolean {
  if (PARENT_ONLY.includes(feature)) return role === "admin";
  return true;
}

/** True when the role has parent-level privileges. */
export function isParent(role: UserRole): boolean {
  return role === "admin";
}

/** Human-readable role label. */
export function getRoleLabel(role: UserRole): string {
  return role === "admin" ? "Parent" : "Child";
}

/** Emoji indicator for the role. */
export function getRoleEmoji(role: UserRole): string {
  return role === "admin" ? "ðŸ‘‘" : "â­";
}

/** Friendly message shown when a child tries a parent-only action. */
export const PARENT_ONLY_MSG = "Only parents can do this ðŸ˜Š";
