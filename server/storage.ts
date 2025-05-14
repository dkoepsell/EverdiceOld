import { 
  users, type User, type InsertUser,
  characters, type Character, type InsertCharacter,
  campaigns, type Campaign, type InsertCampaign,
  campaignSessions, type CampaignSession, type InsertCampaignSession,
  diceRolls, type DiceRoll, type InsertDiceRoll
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Character operations
  getAllCharacters(): Promise<Character[]>;
  getCharacter(id: number): Promise<Character | undefined>;
  createCharacter(character: InsertCharacter): Promise<Character>;
  updateCharacter(id: number, character: Partial<Character>): Promise<Character | undefined>;
  deleteCharacter(id: number): Promise<boolean>;
  
  // Campaign operations
  getAllCampaigns(): Promise<Campaign[]>;
  getCampaign(id: number): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, campaign: Partial<Campaign>): Promise<Campaign | undefined>;
  updateCampaignSession(id: number, sessionNumber: number): Promise<Campaign | undefined>;
  deleteCampaign(id: number): Promise<boolean>;
  
  // Campaign Session operations
  getCampaignSession(campaignId: number, sessionNumber: number): Promise<CampaignSession | undefined>;
  getCampaignSessions(campaignId: number): Promise<CampaignSession[]>;
  createCampaignSession(session: InsertCampaignSession): Promise<CampaignSession>;
  
  // Dice Roll operations
  createDiceRoll(diceRoll: InsertDiceRoll): Promise<DiceRoll>;
  getDiceRollHistory(userId: number, limit?: number): Promise<DiceRoll[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private characterStore: Map<number, Character>;
  private campaignStore: Map<number, Campaign>;
  private sessionStore: Map<string, CampaignSession>; // key is campaignId:sessionNumber
  private diceRollStore: Map<number, DiceRoll>;
  
  private userIdCounter: number;
  private characterIdCounter: number;
  private campaignIdCounter: number;
  private sessionIdCounter: number;
  private diceRollIdCounter: number;

  constructor() {
    this.users = new Map();
    this.characterStore = new Map();
    this.campaignStore = new Map();
    this.sessionStore = new Map();
    this.diceRollStore = new Map();
    
    this.userIdCounter = 1;
    this.characterIdCounter = 1;
    this.campaignIdCounter = 1;
    this.sessionIdCounter = 1;
    this.diceRollIdCounter = 1;
    
    // Add sample data for demonstration
    this.initializeSampleData();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Character operations
  async getAllCharacters(): Promise<Character[]> {
    return Array.from(this.characterStore.values());
  }
  
  async getCharacter(id: number): Promise<Character | undefined> {
    return this.characterStore.get(id);
  }
  
  async createCharacter(insertCharacter: InsertCharacter): Promise<Character> {
    const id = this.characterIdCounter++;
    const character: Character = { ...insertCharacter, id };
    this.characterStore.set(id, character);
    return character;
  }
  
  async updateCharacter(id: number, characterUpdate: Partial<Character>): Promise<Character | undefined> {
    const character = this.characterStore.get(id);
    if (!character) return undefined;
    
    const updatedCharacter = { ...character, ...characterUpdate };
    this.characterStore.set(id, updatedCharacter);
    return updatedCharacter;
  }
  
  async deleteCharacter(id: number): Promise<boolean> {
    return this.characterStore.delete(id);
  }
  
  // Campaign operations
  async getAllCampaigns(): Promise<Campaign[]> {
    return Array.from(this.campaignStore.values());
  }
  
  async getCampaign(id: number): Promise<Campaign | undefined> {
    return this.campaignStore.get(id);
  }
  
  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const id = this.campaignIdCounter++;
    const campaign: Campaign = { ...insertCampaign, id };
    this.campaignStore.set(id, campaign);
    return campaign;
  }
  
  async updateCampaign(id: number, campaignUpdate: Partial<Campaign>): Promise<Campaign | undefined> {
    const campaign = this.campaignStore.get(id);
    if (!campaign) return undefined;
    
    const updatedCampaign = { ...campaign, ...campaignUpdate };
    this.campaignStore.set(id, updatedCampaign);
    return updatedCampaign;
  }
  
  async updateCampaignSession(id: number, sessionNumber: number): Promise<Campaign | undefined> {
    const campaign = this.campaignStore.get(id);
    if (!campaign) return undefined;
    
    const updatedCampaign = { 
      ...campaign, 
      currentSession: sessionNumber 
    };
    this.campaignStore.set(id, updatedCampaign);
    return updatedCampaign;
  }
  
  async deleteCampaign(id: number): Promise<boolean> {
    return this.campaignStore.delete(id);
  }
  
  // Campaign Session operations
  async getCampaignSession(campaignId: number, sessionNumber: number): Promise<CampaignSession | undefined> {
    const key = `${campaignId}:${sessionNumber}`;
    return this.sessionStore.get(key);
  }
  
  async getCampaignSessions(campaignId: number): Promise<CampaignSession[]> {
    const sessions: CampaignSession[] = [];
    for (const session of this.sessionStore.values()) {
      if (session.campaignId === campaignId) {
        sessions.push(session);
      }
    }
    return sessions.sort((a, b) => a.sessionNumber - b.sessionNumber);
  }
  
  async createCampaignSession(insertSession: InsertCampaignSession): Promise<CampaignSession> {
    const id = this.sessionIdCounter++;
    const session: CampaignSession = { ...insertSession, id };
    const key = `${session.campaignId}:${session.sessionNumber}`;
    this.sessionStore.set(key, session);
    return session;
  }
  
  // Dice Roll operations
  async createDiceRoll(insertDiceRoll: InsertDiceRoll): Promise<DiceRoll> {
    const id = this.diceRollIdCounter++;
    const diceRoll: DiceRoll = { ...insertDiceRoll, id };
    this.diceRollStore.set(id, diceRoll);
    return diceRoll;
  }
  
  async getDiceRollHistory(userId: number, limit: number = 10): Promise<DiceRoll[]> {
    const userRolls = Array.from(this.diceRollStore.values())
      .filter(roll => roll.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return userRolls.slice(0, limit);
  }
  
  // Initialize sample data for demonstration
  private async initializeSampleData() {
    // Create sample user
    const user = await this.createUser({
      username: "demo_user",
      password: "password123"
    });
    
    // Create sample character
    const character = await this.createCharacter({
      userId: user.id,
      name: "Thorne Ironfist",
      race: "Dwarf",
      class: "Fighter",
      level: 5,
      background: "Soldier",
      alignment: "Lawful Good",
      strength: 16,
      dexterity: 12,
      constitution: 15,
      intelligence: 10,
      wisdom: 13,
      charisma: 8,
      hitPoints: 45,
      maxHitPoints: 45,
      armorClass: 17,
      skills: ["Athletics", "Perception", "Intimidation", "Survival"],
      equipment: ["Battleaxe", "Chain Mail", "Shield", "Adventurer's Pack"],
      createdAt: new Date().toISOString()
    });
    
    // Create sample campaign
    const campaign = await this.createCampaign({
      userId: user.id,
      title: "The Forgotten Crypts",
      description: "An adventure into ancient crypts filled with undead and forgotten treasures.",
      difficulty: "Normal - Balanced Challenge",
      narrativeStyle: "Descriptive",
      currentSession: 1,
      characters: [character.id],
      createdAt: new Date().toISOString()
    });
    
    // Create sample campaign session
    await this.createCampaignSession({
      campaignId: campaign.id,
      sessionNumber: 1,
      title: "The Ancient Chamber",
      narrative: "The stone door grinds open, revealing a vast chamber bathed in an eerie blue light. Ancient pillars stretch upward to a ceiling lost in shadow, and at the center of the room sits a stone altar.\n\nAs Thorne steps forward, the dust of centuries swirls around his boots. The air feels heavy with magic and danger. The runes etched into the altar begin to glow with increasing intensity.\n\n\"I've seen this before,\" whispers Elyndra, the elven mage in your party. \"This is a binding circle. Something powerful was imprisoned here.\"\n\nA low rumble shakes the chamber, and small stones begin to fall from the ceiling. Whatever was bound here seems to be awakening.",
      choices: [
        {
          action: "Inspect the altar more closely",
          description: "Make an Investigation check to learn more about the altar and its purpose.",
          icon: "search"
        },
        {
          action: "Cast Detect Magic",
          description: "Identify magical auras and their schools of magic within 30 feet.",
          icon: "hand-sparkles"
        },
        {
          action: "Retreat back to the hallway",
          description: "Move away from potential danger to reassess the situation.",
          icon: "running"
        },
        {
          action: "Ready your weapon",
          description: "Prepare for potential combat as the binding weakens.",
          icon: "sword"
        }
      ],
      createdAt: new Date().toISOString()
    });
    
    // Create sample dice rolls
    await this.createDiceRoll({
      userId: user.id,
      characterId: character.id,
      diceType: "d20",
      result: 20,
      modifier: 0,
      purpose: "Attack Roll",
      createdAt: new Date().toISOString()
    });
    
    await this.createDiceRoll({
      userId: user.id,
      characterId: character.id,
      diceType: "d8",
      result: 6,
      modifier: 3,
      purpose: "Damage",
      createdAt: new Date().toISOString()
    });
  }
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Character operations
  async getAllCharacters(): Promise<Character[]> {
    return db.select().from(characters);
  }
  
  async getCharacter(id: number): Promise<Character | undefined> {
    const [character] = await db.select().from(characters).where(eq(characters.id, id));
    return character || undefined;
  }
  
  async createCharacter(insertCharacter: InsertCharacter): Promise<Character> {
    const [character] = await db
      .insert(characters)
      .values(insertCharacter)
      .returning();
    return character;
  }
  
  async updateCharacter(id: number, characterUpdate: Partial<Character>): Promise<Character | undefined> {
    const [character] = await db
      .update(characters)
      .set(characterUpdate)
      .where(eq(characters.id, id))
      .returning();
    return character || undefined;
  }
  
  async deleteCharacter(id: number): Promise<boolean> {
    const result = await db
      .delete(characters)
      .where(eq(characters.id, id));
    return true; // If no error occurs, consider it successful
  }
  
  // Campaign operations
  async getAllCampaigns(): Promise<Campaign[]> {
    return db.select().from(campaigns);
  }
  
  async getCampaign(id: number): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign || undefined;
  }
  
  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db
      .insert(campaigns)
      .values(insertCampaign)
      .returning();
    return campaign;
  }
  
  async updateCampaign(id: number, campaignUpdate: Partial<Campaign>): Promise<Campaign | undefined> {
    const [campaign] = await db
      .update(campaigns)
      .set(campaignUpdate)
      .where(eq(campaigns.id, id))
      .returning();
    return campaign || undefined;
  }
  
  async updateCampaignSession(id: number, sessionNumber: number): Promise<Campaign | undefined> {
    const [campaign] = await db
      .update(campaigns)
      .set({ currentSession: sessionNumber })
      .where(eq(campaigns.id, id))
      .returning();
    return campaign || undefined;
  }
  
  async deleteCampaign(id: number): Promise<boolean> {
    const result = await db
      .delete(campaigns)
      .where(eq(campaigns.id, id));
    return true; // If no error occurs, consider it successful
  }
  
  // Campaign Session operations
  async getCampaignSession(campaignId: number, sessionNumber: number): Promise<CampaignSession | undefined> {
    const [session] = await db
      .select()
      .from(campaignSessions)
      .where(and(
        eq(campaignSessions.campaignId, campaignId),
        eq(campaignSessions.sessionNumber, sessionNumber)
      ));
    return session || undefined;
  }
  
  async getCampaignSessions(campaignId: number): Promise<CampaignSession[]> {
    return db
      .select()
      .from(campaignSessions)
      .where(eq(campaignSessions.campaignId, campaignId))
      .orderBy(campaignSessions.sessionNumber);
  }
  
  async createCampaignSession(insertSession: InsertCampaignSession): Promise<CampaignSession> {
    const [session] = await db
      .insert(campaignSessions)
      .values(insertSession)
      .returning();
    return session;
  }
  
  // Dice Roll operations
  async createDiceRoll(insertDiceRoll: InsertDiceRoll): Promise<DiceRoll> {
    const [roll] = await db
      .insert(diceRolls)
      .values(insertDiceRoll)
      .returning();
    return roll;
  }
  
  async getDiceRollHistory(userId: number, limit: number = 10): Promise<DiceRoll[]> {
    return db
      .select()
      .from(diceRolls)
      .where(eq(diceRolls.userId, userId))
      .orderBy(desc(diceRolls.createdAt))
      .limit(limit);
  }

  // Initialize sample data for demonstration if needed
  async initializeSampleData() {
    // We'll only create sample data if the users table is empty
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      return; // Data already exists, no need to initialize
    }
    
    // Create sample user
    const user = await this.createUser({
      username: "demo_user",
      password: "password123"
    });
    
    // Create sample character
    const character = await this.createCharacter({
      userId: user.id,
      name: "Thorne Ironfist",
      race: "Dwarf",
      class: "Fighter",
      level: 5,
      background: "Soldier",
      alignment: "Lawful Good",
      strength: 16,
      dexterity: 12,
      constitution: 15,
      intelligence: 10,
      wisdom: 13,
      charisma: 8,
      hitPoints: 45,
      maxHitPoints: 45,
      armorClass: 17,
      skills: ["Athletics", "Perception", "Intimidation", "Survival"],
      equipment: ["Battleaxe", "Chain Mail", "Shield", "Adventurer's Pack"],
      createdAt: new Date().toISOString()
    });
    
    // Create sample campaign
    const campaign = await this.createCampaign({
      userId: user.id,
      title: "The Forgotten Crypts",
      description: "An adventure into ancient crypts filled with undead and forgotten treasures.",
      difficulty: "Normal - Balanced Challenge",
      narrativeStyle: "Descriptive",
      currentSession: 1,
      characters: [character.id],
      createdAt: new Date().toISOString()
    });
    
    // Create sample campaign session
    await this.createCampaignSession({
      campaignId: campaign.id,
      sessionNumber: 1,
      title: "The Ancient Chamber",
      narrative: "The stone door grinds open, revealing a vast chamber bathed in an eerie blue light. Ancient pillars stretch upward to a ceiling lost in shadow, and at the center of the room sits a stone altar.\n\nAs Thorne steps forward, the dust of centuries swirls around his boots. The air feels heavy with magic and danger. The runes etched into the altar begin to glow with increasing intensity.\n\n\"I've seen this before,\" whispers Elyndra, the elven mage in your party. \"This is a binding circle. Something powerful was imprisoned here.\"\n\nA low rumble shakes the chamber, and small stones begin to fall from the ceiling. Whatever was bound here seems to be awakening.",
      choices: [
        {
          action: "Inspect the altar more closely",
          description: "Make an Investigation check to learn more about the altar and its purpose.",
          icon: "search"
        },
        {
          action: "Cast Detect Magic",
          description: "Identify magical auras and their schools of magic within 30 feet.",
          icon: "hand-sparkles"
        },
        {
          action: "Retreat back to the hallway",
          description: "Move away from potential danger to reassess the situation.",
          icon: "running"
        },
        {
          action: "Ready your weapon",
          description: "Prepare for potential combat as the binding weakens.",
          icon: "sword"
        }
      ],
      createdAt: new Date().toISOString()
    });
    
    // Create sample dice rolls
    await this.createDiceRoll({
      userId: user.id,
      characterId: character.id,
      diceType: "d20",
      result: 20,
      modifier: 0,
      purpose: "Attack Roll",
      createdAt: new Date().toISOString()
    });
    
    await this.createDiceRoll({
      userId: user.id,
      characterId: character.id,
      diceType: "d8",
      result: 6,
      modifier: 3,
      purpose: "Damage",
      createdAt: new Date().toISOString()
    });
  }
}

// Switch from MemStorage to DatabaseStorage
export const storage = new DatabaseStorage();
