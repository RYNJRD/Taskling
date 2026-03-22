ALTER TABLE "families" ADD COLUMN IF NOT EXISTS "theme_color" varchar(20) DEFAULT 'violet';
ALTER TABLE "families" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_inventory" text DEFAULT '{}';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "chores" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "chores" ADD COLUMN IF NOT EXISTS "requires_approval" boolean DEFAULT false NOT NULL;
ALTER TABLE "chores" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;
ALTER TABLE "chores" ADD COLUMN IF NOT EXISTS "created_by" integer;
ALTER TABLE "chores" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "rewards" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "rewards" ADD COLUMN IF NOT EXISTS "requires_approval" boolean DEFAULT false NOT NULL;
ALTER TABLE "rewards" ADD COLUMN IF NOT EXISTS "created_by" integer;
ALTER TABLE "rewards" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

CREATE TABLE IF NOT EXISTS "chore_submissions" (
  "id" serial PRIMARY KEY NOT NULL,
  "family_id" integer NOT NULL,
  "chore_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "status" varchar(30) DEFAULT 'submitted' NOT NULL,
  "note" text,
  "rejection_reason" text,
  "review_note" text,
  "points_awarded" integer DEFAULT 0 NOT NULL,
  "reviewed_by" integer,
  "reviewed_at" timestamp,
  "undone_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "reward_claims" (
  "id" serial PRIMARY KEY NOT NULL,
  "family_id" integer NOT NULL,
  "reward_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "quantity" integer DEFAULT 1 NOT NULL,
  "total_cost" integer NOT NULL,
  "status" varchar(30) DEFAULT 'approved' NOT NULL,
  "note" text,
  "review_note" text,
  "reviewed_by" integer,
  "reviewed_at" timestamp,
  "undone_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "activity_events" (
  "id" serial PRIMARY KEY NOT NULL,
  "family_id" integer NOT NULL,
  "user_id" integer,
  "type" varchar(50) NOT NULL,
  "title" varchar(255) NOT NULL,
  "body" text NOT NULL,
  "related_entity_type" varchar(50),
  "related_entity_id" integer,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "user_achievements" (
  "id" serial PRIMARY KEY NOT NULL,
  "family_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "code" varchar(100) NOT NULL,
  "title" varchar(255) NOT NULL,
  "description" text NOT NULL,
  "emoji" varchar(20) NOT NULL,
  "earned_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "monthly_winners" (
  "id" serial PRIMARY KEY NOT NULL,
  "family_id" integer NOT NULL,
  "month_key" varchar(7) NOT NULL,
  "award_type" varchar(50) NOT NULL,
  "user_id" integer NOT NULL,
  "title" varchar(255) NOT NULL,
  "summary" text NOT NULL,
  "stats" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);
