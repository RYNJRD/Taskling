export const USER_ROLES = ["admin", "member"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const CHORE_TYPES = ["daily", "weekly", "monthly", "box"] as const;
export type ChoreType = (typeof CHORE_TYPES)[number];

export const REVIEW_STATUSES = [
  "submitted",
  "approved",
  "rejected",
  "cancelled",
  "undone",
] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const ACTIVITY_EVENT_TYPES = [
  "chat_message",
  "chore_completed",
  "chore_submitted",
  "chore_approved",
  "chore_rejected",
  "reward_claimed",
  "reward_requested",
  "reward_approved",
  "reward_rejected",
  "achievement_earned",
  "streak_milestone",
  "monthly_winner",
  "role_changed",
  "family_joined",
  "family_created",
  "system",
] as const;
export type ActivityEventType = (typeof ACTIVITY_EVENT_TYPES)[number];

export const SSE_EVENT_TYPES = [
  "family:activity",
  "family:message",
  "family:leaderboard",
  "family:chore",
  "family:reward",
  "family:review",
  "family:user",
  "family:heartbeat",
] as const;
export type SseEventType = (typeof SSE_EVENT_TYPES)[number];
