import { z } from "zod";
import {
  activityEvents,
  choreSubmissions,
  createChoreSubmissionSchema,
  createRewardClaimSchema,
  insertChoreSchema,
  insertFamilySchema,
  insertRewardSchema,
  insertUserSchema,
  messages,
  monthlyWinners,
  rewards,
  userAchievements,
  users,
  chores,
  rewardClaims,
  families,
} from "./schema";
import { REVIEW_STATUSES, USER_ROLES } from "./constants";

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const reviewDecisionSchema = z.object({
  action: z.enum(["approve", "reject", "undo", "cancel"]),
  note: z.string().max(250).optional(),
});

export const api = {
  families: {
    create: {
      method: "POST" as const,
      path: "/api/families" as const,
      input: insertFamilySchema.extend({
        starterMode: z.enum(["guided", "blank"]).default("guided").optional(),
      }),
      responses: { 201: z.custom<typeof families.$inferSelect>() },
    },
    get: {
      method: "GET" as const,
      path: "/api/families/:id" as const,
      responses: { 200: z.custom<typeof families.$inferSelect>() },
    },
    getByCode: {
      method: "GET" as const,
      path: "/api/families/code/:code" as const,
      responses: { 200: z.custom<typeof families.$inferSelect>() },
    },
    getUsers: {
      method: "GET" as const,
      path: "/api/families/:id/users" as const,
      responses: { 200: z.array(z.custom<typeof users.$inferSelect>()) },
    },
    getChores: {
      method: "GET" as const,
      path: "/api/families/:id/chores" as const,
      responses: {
        200: z.array(
          z.custom<typeof chores.$inferSelect & {
            latestSubmissionStatus?: string;
            rejectionReason?: string;
            submissionNote?: string;
          }>()
        )
      },
    },
    getLeaderboard: {
      method: "GET" as const,
      path: "/api/families/:id/leaderboard" as const,
      responses: { 200: z.array(z.custom<typeof users.$inferSelect>()) },
    },
    getInviteInfo: {
      method: "GET" as const,
      path: "/api/families/:id/invite" as const,
      responses: { 200: z.object({ inviteCode: z.string(), inviteUrl: z.string() }) },
    },
    getActivity: {
      method: "GET" as const,
      path: "/api/families/:id/activity" as const,
      responses: { 200: z.array(z.custom<typeof activityEvents.$inferSelect>()) },
    },
    getMonthlyWinners: {
      method: "GET" as const,
      path: "/api/families/:id/monthly-winners" as const,
      responses: { 200: z.array(z.custom<typeof monthlyWinners.$inferSelect>()) },
    },
    getAchievements: {
      method: "GET" as const,
      path: "/api/families/:id/achievements" as const,
      responses: { 200: z.array(z.custom<typeof userAchievements.$inferSelect>()) },
    },
    getOnboarding: {
      method: "GET" as const,
      path: "/api/families/:id/onboarding" as const,
      responses: {
        200: z.object({
          checklist: z.array(
            z.object({
              key: z.string(),
              label: z.string(),
              description: z.string(),
              complete: z.boolean(),
            }),
          ),
        }),
      },
    },
  },
  users: {
    create: {
      method: "POST" as const,
      path: "/api/users" as const,
      input: insertUserSchema,
      responses: { 201: z.custom<typeof users.$inferSelect>() },
    },
    get: {
      method: "GET" as const,
      path: "/api/users/:id" as const,
      responses: { 200: z.custom<typeof users.$inferSelect>() },
    },
    getByFirebaseUid: {
      method: "GET" as const,
      path: "/api/users/firebase/:uid" as const,
      responses: { 200: z.custom<typeof users.$inferSelect>() },
    },
    updateProfile: {
      method: "PATCH" as const,
      path: "/api/users/:id/profile" as const,
      input: z.object({ username: z.string().min(1).max(40) }),
      responses: { 200: z.custom<typeof users.$inferSelect>() },
    },
    updateAvatar: {
      method: "PATCH" as const,
      path: "/api/users/:id/avatar" as const,
      input: z.object({ avatarConfig: z.string(), avatarInventory: z.string().optional() }),
      responses: { 200: z.custom<typeof users.$inferSelect>() },
    },
    toggleLeaderboard: {
      method: "PATCH" as const,
      path: "/api/users/:id/leaderboard" as const,
      input: z.object({ hideFromLeaderboard: z.boolean() }),
      responses: { 200: z.custom<typeof users.$inferSelect>() },
    },
    updateRole: {
      method: "PATCH" as const,
      path: "/api/users/:id/role" as const,
      input: z.object({ role: z.enum(USER_ROLES) }),
      responses: { 200: z.custom<typeof users.$inferSelect>() },
    },
  },
  messages: {
    list: {
      method: "GET" as const,
      path: "/api/families/:id/messages" as const,
      responses: { 200: z.array(z.custom<typeof messages.$inferSelect>()) },
    },
    create: {
      method: "POST" as const,
      path: "/api/messages" as const,
      input: z.object({
        familyId: z.coerce.number(),
        userId: z.coerce.number(),
        senderName: z.string(),
        content: z.string().min(1).max(400),
      }),
      responses: { 201: z.custom<typeof messages.$inferSelect>() },
    },
  },
  chores: {
    create: {
      method: "POST" as const,
      path: "/api/chores" as const,
      input: insertChoreSchema,
      responses: { 201: z.custom<typeof chores.$inferSelect>() },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/chores/:id" as const,
      input: insertChoreSchema.partial(),
      responses: { 200: z.custom<typeof chores.$inferSelect>() },
    },
    complete: {
      method: "POST" as const,
      path: "/api/chores/:id/complete" as const,
      input: z.object({ userId: z.coerce.number(), note: z.string().max(250).optional() }),
      responses: {
        200: z.object({
          chore: z.custom<typeof chores.$inferSelect>(),
          user: z.custom<typeof users.$inferSelect>(),
          submission: z.custom<typeof choreSubmissions.$inferSelect>().nullable(),
          awardedPoints: z.number(),
        }),
      },
    },
  },
  reviews: {
    chorePending: {
      method: "GET" as const,
      path: "/api/families/:id/chore-submissions/pending" as const,
      responses: { 200: z.array(z.custom<typeof choreSubmissions.$inferSelect>()) },
    },
    rewardPending: {
      method: "GET" as const,
      path: "/api/families/:id/reward-claims/pending" as const,
      responses: { 200: z.array(z.custom<typeof rewardClaims.$inferSelect>()) },
    },
    reviewChore: {
      method: "POST" as const,
      path: "/api/chore-submissions/:id/review" as const,
      input: reviewDecisionSchema,
      responses: { 200: z.custom<typeof choreSubmissions.$inferSelect>() },
    },
    reviewReward: {
      method: "POST" as const,
      path: "/api/reward-claims/:id/review" as const,
      input: reviewDecisionSchema,
      responses: { 200: z.custom<typeof rewardClaims.$inferSelect>() },
    },
  },
  rewards: {
    list: {
      method: "GET" as const,
      path: "/api/families/:id/rewards" as const,
      responses: { 200: z.array(z.custom<typeof rewards.$inferSelect>()) },
    },
    create: {
      method: "POST" as const,
      path: "/api/rewards" as const,
      input: insertRewardSchema,
      responses: { 201: z.custom<typeof rewards.$inferSelect>() },
    },
    claim: {
      method: "POST" as const,
      path: "/api/rewards/:id/claim" as const,
      input: z.object({ userId: z.coerce.number(), quantity: z.coerce.number().default(1), note: z.string().max(250).optional() }),
      responses: {
        200: z.object({
          user: z.custom<typeof users.$inferSelect>(),
          claim: z.custom<typeof rewardClaims.$inferSelect>(),
        }),
      },
    },
  },
  events: {
    stream: {
      method: "GET" as const,
      path: "/api/events/stream" as const,
      input: z.object({
        token: z.string().min(1).optional(),
        demoUserId: z.coerce.number().optional(),
        familyId: z.coerce.number(),
      }),
    },
  },
  demo: {
    setup: {
      method: "POST" as const,
      path: "/api/demo/setup" as const,
      responses: { 201: z.object({ family: z.custom<typeof families.$inferSelect>(), users: z.array(z.custom<typeof users.$inferSelect>()) }) },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type CreateFamilyRequest = z.infer<typeof api.families.create.input>;
export type CreateChoreRequest = z.infer<typeof api.chores.create.input>;
export type UpdateChoreRequest = z.infer<typeof api.chores.update.input>;
