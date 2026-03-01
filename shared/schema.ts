import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const families = pgTable("families", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  inviteCode: varchar("invite_code", { length: 50 }).notNull().unique(),
  timeZone: varchar("time_zone", { length: 100 }).notNull().default("UTC"),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => families.id),
  username: varchar("username", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default('member'),
  gender: varchar("gender", { length: 20 }),
  age: integer("age"),
  points: integer("points").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  streakLastCompletedDate: varchar("streak_last_completed_date", { length: 10 }),
  avatarUrl: text("avatar_url"),
  avatarConfig: text("avatar_config").default('{}'),
  hideFromLeaderboard: boolean("hide_from_leaderboard").default(false),
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
  points: integer("points").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'daily', 'weekly', 'monthly', 'box'
  assigneeId: integer("assignee_id").references(() => users.id), // null if in chore box
  lastCompletedAt: timestamp("last_completed_at"),
  lastCompletedBy: integer("last_completed_by").references(() => users.id),
  cooldownHours: integer("cooldown_hours"), // for big chores
  emoji: varchar("emoji", { length: 10 }),
});

export const choreLogs = pgTable("chore_logs", {
  id: serial("id").primaryKey(),
  choreId: integer("chore_id").references(() => chores.id),
  userId: integer("user_id").references(() => users.id),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => families.id),
  title: varchar("title", { length: 255 }).notNull(),
  costPoints: integer("cost_points").notNull(),
  emoji: varchar("emoji", { length: 10 }),
});

export const insertFamilySchema = createInsertSchema(families).omit({ id: true }).extend({
  inviteCode: z.string().optional(),
});
export const insertUserSchema = createInsertSchema(users).omit({ id: true, points: true, streak: true });
export const insertChoreSchema = createInsertSchema(chores).omit({ id: true, lastCompletedAt: true });
export const insertRewardSchema = createInsertSchema(rewards).omit({ id: true });

export type Family = typeof families.$inferSelect;
export type InsertFamily = z.infer<typeof insertFamilySchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Chore = typeof chores.$inferSelect;
export type InsertChore = z.infer<typeof insertChoreSchema>;

export type ChoreLog = typeof choreLogs.$inferSelect;

export type Message = typeof messages.$inferSelect;

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;

// Request and Response Types
export type CreateFamilyRequest = InsertFamily;
export type CreateUserRequest = InsertUser;
export type CreateChoreRequest = InsertChore;
export type UpdateChoreRequest = Partial<InsertChore>;
export type CompleteChoreRequest = { userId: number };
