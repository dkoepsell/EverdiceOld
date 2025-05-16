import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  displayName: text("display_name"),
  lastLogin: text("last_login"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  displayName: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// User sessions for authentication
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
  lastUsed: text("last_used"),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
});

export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type UserSession = typeof userSessions.$inferSelect;

// Character schema with XP tracking and portrait generation
export const characters = pgTable("characters", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  race: text("race").notNull(),
  class: text("class").notNull(),
  level: integer("level").notNull().default(1),
  background: text("background"),
  alignment: text("alignment"),
  strength: integer("strength").notNull(),
  dexterity: integer("dexterity").notNull(),
  constitution: integer("constitution").notNull(),
  intelligence: integer("intelligence").notNull(),
  wisdom: integer("wisdom").notNull(),
  charisma: integer("charisma").notNull(),
  hitPoints: integer("hit_points").notNull(),
  maxHitPoints: integer("max_hit_points").notNull(),
  armorClass: integer("armor_class").notNull(),
  experience: integer("experience").notNull().default(0),
  skills: text("skills").array(),
  equipment: text("equipment").array(),
  // New fields for character visualization
  appearance: text("appearance"),
  portraitUrl: text("portrait_url"),
  backgroundStory: text("background_story"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});

export const insertCharacterSchema = createInsertSchema(characters).omit({
  id: true,
});

export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type Character = typeof characters.$inferSelect;

// Campaign schema with archive functionality, XP rewards, and multi-user support
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Campaign creator/DM
  title: text("title").notNull(),
  description: text("description"),
  difficulty: text("difficulty").notNull(),
  narrativeStyle: text("narrative_style").notNull(),
  currentSession: integer("current_session").notNull().default(1),
  currentTurnUserId: integer("current_turn_user_id"), // Current player's turn
  isTurnBased: boolean("is_turn_based").default(false), // Whether campaign is turn-based
  turnTimeLimit: integer("turn_time_limit"), // Time limit in seconds (null = no limit)
  turnStartedAt: text("turn_started_at"), // Timestamp of when current turn started
  xpReward: integer("xp_reward").default(0),
  isArchived: boolean("is_archived").default(false),
  isCompleted: boolean("is_completed").default(false),
  completedAt: text("completed_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
});

export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

// Campaign participants join table for multi-user campaigns
export const campaignParticipants = pgTable("campaign_participants", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  userId: integer("user_id").notNull(),
  characterId: integer("character_id").notNull(), // Character used in this campaign
  role: text("role").notNull().default("player"), // DM or player
  turnOrder: integer("turn_order"), // Position in turn order (null = not turn-based)
  isActive: boolean("is_active").default(true), // Whether participant is active
  joinedAt: text("joined_at").notNull(),
  lastActiveAt: text("last_active_at"), // Last time they took a turn
});

export const insertCampaignParticipantSchema = createInsertSchema(campaignParticipants).omit({
  id: true,
});

export type InsertCampaignParticipant = z.infer<typeof insertCampaignParticipantSchema>;
export type CampaignParticipant = typeof campaignParticipants.$inferSelect;

// Campaign session schema with XP rewards
export const campaignSessions = pgTable("campaign_sessions", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  sessionNumber: integer("session_number").notNull(),
  title: text("title").notNull(),
  narrative: text("narrative").notNull(),
  location: text("location"),
  choices: jsonb("choices").notNull(),
  sessionXpReward: integer("session_xp_reward").default(0),
  isCompleted: boolean("is_completed").default(false),
  completedAt: text("completed_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});

export const insertCampaignSessionSchema = createInsertSchema(campaignSessions).omit({
  id: true,
});

export type InsertCampaignSession = z.infer<typeof insertCampaignSessionSchema>;
export type CampaignSession = typeof campaignSessions.$inferSelect;

// Table for tracking adventure completions and XP rewards
export const adventureCompletions = pgTable("adventure_completions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  characterId: integer("character_id").notNull(),
  campaignId: integer("campaign_id").notNull(),
  xpAwarded: integer("xp_awarded").notNull(),
  completedAt: text("completed_at").notNull(),
  notes: text("notes"),
});

export const insertAdventureCompletionSchema = createInsertSchema(adventureCompletions).omit({
  id: true,
});

export type InsertAdventureCompletion = z.infer<typeof insertAdventureCompletionSchema>;
export type AdventureCompletion = typeof adventureCompletions.$inferSelect;

// Dice roll history
export const diceRolls = pgTable("dice_rolls", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  characterId: integer("character_id"),
  diceType: text("dice_type").notNull(),
  result: integer("result").notNull(),
  modifier: integer("modifier").default(0),
  count: integer("count").default(1), // Adding count field with default of 1
  purpose: text("purpose"),
  createdAt: text("created_at").notNull(),
});

export const insertDiceRollSchema = createInsertSchema(diceRolls).omit({
  id: true,
});

export type InsertDiceRoll = z.infer<typeof insertDiceRollSchema>;
export type DiceRoll = typeof diceRolls.$inferSelect;

// D&D Learning Content
export const learningContent = pgTable("learning_content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(), // character_creation, combat, spells, etc.
  content: text("content").notNull(),
  difficulty: text("difficulty").notNull().default("beginner"), // beginner, intermediate, advanced
  relatedRules: text("related_rules"),
  examples: jsonb("examples").default([]),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at"),
});

export const insertLearningContentSchema = createInsertSchema(learningContent).omit({
  id: true,
});

export type InsertLearningContent = z.infer<typeof insertLearningContentSchema>;
export type LearningContent = typeof learningContent.$inferSelect;

// DM Tools - Adventure Templates
export const adventureTemplates = pgTable("adventure_templates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  structure: jsonb("structure").notNull(), // JSON containing adventure structure
  difficultyRange: text("difficulty_range").notNull(),
  recommendedLevels: text("recommended_levels").notNull(),
  tags: text("tags").array(),
  isPublic: boolean("is_public").default(true),
  createdBy: integer("created_by").notNull(), // User ID
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at"),
});

export const insertAdventureTemplateSchema = createInsertSchema(adventureTemplates).omit({
  id: true,
});

export type InsertAdventureTemplate = z.infer<typeof insertAdventureTemplateSchema>;
export type AdventureTemplate = typeof adventureTemplates.$inferSelect;

// DM Tools - Encounter Builder
export const encounters = pgTable("encounters", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  monsterList: jsonb("monster_list").notNull(), // List of monsters with stats
  difficulty: text("difficulty").notNull(),
  environment: text("environment"),
  treasureRewards: jsonb("treasure_rewards").default([]),
  xpReward: integer("xp_reward").default(0),
  notes: text("notes"),
  createdBy: integer("created_by").notNull(), // User ID
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at"),
});

export const insertEncounterSchema = createInsertSchema(encounters).omit({
  id: true,
});

export type InsertEncounter = z.infer<typeof insertEncounterSchema>;
export type Encounter = typeof encounters.$inferSelect;

// Adventure building blocks - NPCs, locations, quests, etc.
export const adventureElements = pgTable("adventure_elements", {
  id: serial("id").primaryKey(),
  elementType: text("element_type").notNull(), // npc, location, quest, item, etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  details: jsonb("details").notNull(), // Element-specific details
  isPublic: boolean("is_public").default(false),
  createdBy: integer("created_by").notNull(), // User ID
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at"),
});

export const insertAdventureElementSchema = createInsertSchema(adventureElements).omit({
  id: true,
});

export type InsertAdventureElement = z.infer<typeof insertAdventureElementSchema>;
export type AdventureElement = typeof adventureElements.$inferSelect;

// Dedicated NPC table with companion functionality
export const npcs = pgTable("npcs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  race: text("race").notNull(),
  occupation: text("occupation").notNull(),
  personality: text("personality").notNull(),
  appearance: text("appearance").notNull(),
  motivation: text("motivation").notNull(),
  // NPC companion functionality
  isCompanion: boolean("is_companion").default(false),
  isStockCompanion: boolean("is_stock_companion").default(false), // Indicates a pre-made companion
  companionType: text("companion_type"), // combat, support, utility, social, etc.
  aiPersonality: text("ai_personality"), // For AI-driven behavior
  combatAbilities: jsonb("combat_abilities").default([]), // Combat moves and abilities
  supportAbilities: jsonb("support_abilities").default([]), // Healing, buffing, etc.
  decisionMakingRules: jsonb("decision_making_rules").default({}), // Rules for automated decisions
  level: integer("level").default(1),
  hitPoints: integer("hit_points"),
  maxHitPoints: integer("max_hit_points"),
  armorClass: integer("armor_class"),
  strength: integer("strength"),
  dexterity: integer("dexterity"),
  constitution: integer("constitution"),
  intelligence: integer("intelligence"),
  wisdom: integer("wisdom"),
  charisma: integer("charisma"),
  skills: text("skills").array(),
  equipment: text("equipment").array(),
  portraitUrl: text("portrait_url"),
  isPublic: boolean("is_public").default(false),
  createdBy: integer("created_by").notNull(), // User ID
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at"),
});

export const insertNpcSchema = createInsertSchema(npcs).omit({
  id: true,
});

export type InsertNpc = z.infer<typeof insertNpcSchema>;
export type Npc = typeof npcs.$inferSelect;

// Campaign NPC companions join table
export const campaignNpcs = pgTable("campaign_npcs", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  npcId: integer("npc_id").notNull(),
  role: text("role").notNull().default("companion"), // companion, ally, neutral, enemy
  turnOrder: integer("turn_order"), // Position in turn order (null = not turn-based)
  isActive: boolean("is_active").default(true), // Whether NPC is active
  joinedAt: text("joined_at").notNull().default(new Date().toISOString()),
  lastActiveAt: text("last_active_at"), // Last time they took a turn
  // Override NPC default behavior
  customBehaviorRules: jsonb("custom_behavior_rules").default({}),
  controlledBy: integer("controlled_by"), // User ID of player who controls this NPC, null = AI controlled
});

export const insertCampaignNpcSchema = createInsertSchema(campaignNpcs).omit({
  id: true,
});

export type InsertCampaignNpc = z.infer<typeof insertCampaignNpcSchema>;
export type CampaignNpc = typeof campaignNpcs.$inferSelect;
