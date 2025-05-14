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

// Character schema with XP tracking
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
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});

export const insertCharacterSchema = createInsertSchema(characters).omit({
  id: true,
});

export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type Character = typeof characters.$inferSelect;

// Campaign schema with archive functionality and XP rewards
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  difficulty: text("difficulty").notNull(),
  narrativeStyle: text("narrative_style").notNull(),
  currentSession: integer("current_session").notNull().default(1),
  characters: integer("characters").array(),
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
