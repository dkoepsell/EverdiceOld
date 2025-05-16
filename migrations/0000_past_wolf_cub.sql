CREATE TABLE "adventure_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"character_id" integer NOT NULL,
	"campaign_id" integer NOT NULL,
	"xp_awarded" integer NOT NULL,
	"completed_at" text NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "adventure_elements" (
	"id" serial PRIMARY KEY NOT NULL,
	"element_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"details" jsonb NOT NULL,
	"is_public" boolean DEFAULT false,
	"created_by" integer NOT NULL,
	"created_at" text DEFAULT '2025-05-16T15:59:08.993Z' NOT NULL,
	"updated_at" text
);
--> statement-breakpoint
CREATE TABLE "adventure_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"structure" jsonb NOT NULL,
	"difficulty_range" text NOT NULL,
	"recommended_levels" text NOT NULL,
	"tags" text[],
	"is_public" boolean DEFAULT true,
	"created_by" integer NOT NULL,
	"created_at" text DEFAULT '2025-05-16T15:59:08.992Z' NOT NULL,
	"updated_at" text
);
--> statement-breakpoint
CREATE TABLE "campaign_npcs" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"npc_id" integer NOT NULL,
	"role" text DEFAULT 'companion' NOT NULL,
	"turn_order" integer,
	"is_active" boolean DEFAULT true,
	"joined_at" text DEFAULT '2025-05-16T15:59:08.995Z' NOT NULL,
	"last_active_at" text,
	"custom_behavior_rules" jsonb DEFAULT '{}'::jsonb,
	"controlled_by" integer
);
--> statement-breakpoint
CREATE TABLE "campaign_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"character_id" integer NOT NULL,
	"role" text DEFAULT 'player' NOT NULL,
	"turn_order" integer,
	"is_active" boolean DEFAULT true,
	"joined_at" text NOT NULL,
	"last_active_at" text
);
--> statement-breakpoint
CREATE TABLE "campaign_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"session_number" integer NOT NULL,
	"title" text NOT NULL,
	"narrative" text NOT NULL,
	"location" text,
	"choices" jsonb NOT NULL,
	"session_xp_reward" integer DEFAULT 0,
	"is_completed" boolean DEFAULT false,
	"completed_at" text,
	"created_at" text NOT NULL,
	"updated_at" text
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"difficulty" text NOT NULL,
	"narrative_style" text NOT NULL,
	"current_session" integer DEFAULT 1 NOT NULL,
	"current_turn_user_id" integer,
	"is_turn_based" boolean DEFAULT false,
	"turn_time_limit" integer,
	"turn_started_at" text,
	"xp_reward" integer DEFAULT 0,
	"is_archived" boolean DEFAULT false,
	"is_completed" boolean DEFAULT false,
	"completed_at" text,
	"created_at" text NOT NULL,
	"updated_at" text
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"race" text NOT NULL,
	"class" text NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"background" text,
	"alignment" text,
	"strength" integer NOT NULL,
	"dexterity" integer NOT NULL,
	"constitution" integer NOT NULL,
	"intelligence" integer NOT NULL,
	"wisdom" integer NOT NULL,
	"charisma" integer NOT NULL,
	"hit_points" integer NOT NULL,
	"max_hit_points" integer NOT NULL,
	"armor_class" integer NOT NULL,
	"experience" integer DEFAULT 0 NOT NULL,
	"skills" text[],
	"equipment" text[],
	"appearance" text,
	"portrait_url" text,
	"background_story" text,
	"created_at" text NOT NULL,
	"updated_at" text
);
--> statement-breakpoint
CREATE TABLE "dice_rolls" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"character_id" integer,
	"dice_type" text NOT NULL,
	"result" integer NOT NULL,
	"modifier" integer DEFAULT 0,
	"count" integer DEFAULT 1,
	"purpose" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "encounters" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"monster_list" jsonb NOT NULL,
	"difficulty" text NOT NULL,
	"environment" text,
	"treasure_rewards" jsonb DEFAULT '[]'::jsonb,
	"xp_reward" integer DEFAULT 0,
	"notes" text,
	"created_by" integer NOT NULL,
	"created_at" text DEFAULT '2025-05-16T15:59:08.993Z' NOT NULL,
	"updated_at" text
);
--> statement-breakpoint
CREATE TABLE "learning_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"content" text NOT NULL,
	"difficulty" text DEFAULT 'beginner' NOT NULL,
	"related_rules" text,
	"examples" jsonb DEFAULT '[]'::jsonb,
	"created_at" text DEFAULT '2025-05-16T15:59:08.991Z' NOT NULL,
	"updated_at" text
);
--> statement-breakpoint
CREATE TABLE "npcs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"race" text NOT NULL,
	"occupation" text NOT NULL,
	"personality" text NOT NULL,
	"appearance" text NOT NULL,
	"motivation" text NOT NULL,
	"is_companion" boolean DEFAULT false,
	"is_stock_companion" boolean DEFAULT false,
	"companion_type" text,
	"ai_personality" text,
	"combat_abilities" jsonb DEFAULT '[]'::jsonb,
	"support_abilities" jsonb DEFAULT '[]'::jsonb,
	"decision_making_rules" jsonb DEFAULT '{}'::jsonb,
	"level" integer DEFAULT 1,
	"hit_points" integer,
	"max_hit_points" integer,
	"armor_class" integer,
	"strength" integer,
	"dexterity" integer,
	"constitution" integer,
	"intelligence" integer,
	"wisdom" integer,
	"charisma" integer,
	"skills" text[],
	"equipment" text[],
	"portrait_url" text,
	"is_public" boolean DEFAULT false,
	"created_by" integer NOT NULL,
	"created_at" text DEFAULT '2025-05-16T15:59:08.994Z' NOT NULL,
	"updated_at" text
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" text NOT NULL,
	"expires_at" text NOT NULL,
	"created_at" text NOT NULL,
	"last_used" text,
	"user_agent" text,
	"ip_address" text,
	CONSTRAINT "user_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text,
	"display_name" text,
	"last_login" text,
	"created_at" text DEFAULT '2025-05-16T15:59:08.983Z' NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
