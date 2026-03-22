import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const families = pgTable("families", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  inviteCode: varchar("invite_code", { length: 50 }).notNull().unique(),
  timeZone: varchar("time_zone", { length: 100 }).notNull().default("UTC"),
  themeColor: varchar("theme_color", { length: 20 }).default("violet"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => families.id),
  firebaseUid: varchar("firebase_uid", { length: 255 }).unique(),
  username: varchar("username", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("member"),
  gender: varchar("gender", { length: 20 }),
  age: integer("age"),
  points: integer("points").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  streakLastCompletedDate: varchar("streak_last_completed_date", { length: 10 }),
  avatarUrl: text("avatar_url"),
  avatarConfig: text("avatar_config").default("{}"),
  avatarInventory: text("avatar_inventory").default("{}"),
  hideFromLeaderboard: boolean("hide_from_leaderboard").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => families.id),
  userId: integer("user_id").references(() => users.id),
  senderName: varchar("sender_name", { length: 255 }).notNull(),
  content: text("content").notNull(),
  isSystem: boolean("is_system").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chores = pgTable("chores", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => families.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  points: integer("points").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  assigneeId: integer("assignee_id").references(() => users.id),
  lastCompletedAt: timestamp("last_completed_at"),
  lastCompletedBy: integer("last_completed_by").references(() => users.id),
  cooldownHours: integer("cooldown_hours"),
  emoji: varchar("emoji", { length: 20 }),
  requiresApproval: boolean("requires_approval").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const choreLogs = pgTable("chore_logs", {
  id: serial("id").primaryKey(),
  choreId: integer("chore_id").references(() => chores.id),
  userId: integer("user_id").references(() => users.id),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const choreSubmissions = pgTable("chore_submissions", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => families.id).notNull(),
  choreId: integer("chore_id").references(() => chores.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("submitted"),
  note: text("note"),
  rejectionReason: text("rejection_reason"),
  reviewNote: text("review_note"),
  pointsAwarded: integer("points_awarded").notNull().default(0),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  undoneAt: timestamp("undone_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => families.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  costPoints: integer("cost_points").notNull(),
  emoji: varchar("emoji", { length: 20 }),
  requiresApproval: boolean("requires_approval").notNull().default(false),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rewardClaims = pgTable("reward_claims", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => families.id).notNull(),
  rewardId: integer("reward_id").references(() => rewards.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  quantity: integer("quantity").notNull().default(1),
  totalCost: integer("total_cost").notNull(),
  status: varchar("status", { length: 30 }).notNull().default("approved"),
  note: text("note"),
  reviewNote: text("review_note"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  undoneAt: timestamp("undone_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activityEvents = pgTable("activity_events", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => families.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  relatedEntityType: varchar("related_entity_type", { length: 50 }),
  relatedEntityId: integer("related_entity_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => families.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  code: varchar("code", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  emoji: varchar("emoji", { length: 20 }).notNull(),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
});

export const monthlyWinners = pgTable("monthly_winners", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => families.id).notNull(),
  monthKey: varchar("month_key", { length: 7 }).notNull(),
  awardType: varchar("award_type", { length: 50 }).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  summary: text("summary").notNull(),
  stats: jsonb("stats").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFamilySchema = createInsertSchema(families)
  .omit({ id: true, createdAt: true })
  .extend({
    inviteCode: z.string().optional(),
  });

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  points: true,
  streak: true,
  streakLastCompletedDate: true,
  createdAt: true,
});

export const insertChoreSchema = createInsertSchema(chores).omit({
  id: true,
  lastCompletedAt: true,
  lastCompletedBy: true,
  createdAt: true,
});

export const insertRewardSchema = createInsertSchema(rewards).omit({
  id: true,
  createdAt: true,
});

export const createChoreSubmissionSchema = createInsertSchema(choreSubmissions).omit({
  id: true,
  reviewedAt: true,
  reviewedBy: true,
  createdAt: true,
  undoneAt: true,
});

export const createRewardClaimSchema = createInsertSchema(rewardClaims).omit({
  id: true,
  reviewedAt: true,
  reviewedBy: true,
  createdAt: true,
  undoneAt: true,
});

export type Family = typeof families.$inferSelect;
export type InsertFamily = z.infer<typeof insertFamilySchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Chore = typeof chores.$inferSelect;
export type InsertChore = z.infer<typeof insertChoreSchema>;

export type ChoreLog = typeof choreLogs.$inferSelect;
export type ChoreSubmission = typeof choreSubmissions.$inferSelect;
export type InsertChoreSubmission = z.infer<typeof createChoreSubmissionSchema>;

export type Message = typeof messages.$inferSelect;

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;
export type RewardClaim = typeof rewardClaims.$inferSelect;
export type InsertRewardClaim = z.infer<typeof createRewardClaimSchema>;

export type ActivityEvent = typeof activityEvents.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type MonthlyWinner = typeof monthlyWinners.$inferSelect;

export type CreateFamilyRequest = InsertFamily;
export type CreateUserRequest = InsertUser;
export type CreateChoreRequest = InsertChore;
export type UpdateChoreRequest = Partial<InsertChore>;
export type CompleteChoreRequest = { userId: number; note?: string };
