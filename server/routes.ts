import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupInventoryRoutes } from "./inventory-routes";
import { setupAuth } from "./auth";
import { 
  insertUserSchema, 
  insertCharacterSchema, 
  insertCampaignSchema, 
  insertCampaignSessionSchema, 
  insertDiceRollSchema,
  insertAdventureCompletionSchema,
  insertCampaignParticipantSchema,
  insertNpcSchema,
  insertCampaignNpcSchema,
  insertCampaignInvitationSchema,
  insertDmNoteSchema,
  insertAnnouncementSchema,
  insertCharacterItemSchema,
  insertCurrencyTransactionSchema,
  insertTradeSchema,
  insertTradeItemSchema,
  // Table references
  npcs,
  users,
  campaigns,
  campaignParticipants,
  items,
  characterItems,
  currencyTransactions,
  trades,
  tradeItems
} from "@shared/schema";
import { setupAuth } from "./auth";
import { generateCampaign, CampaignGenerationRequest } from "./lib/openai";
import { generateCharacterPortrait, generateCharacterBackground } from "./lib/characterImageGenerator";
import { registerCampaignDeploymentRoutes } from "./lib/campaignDeploy";
import { db, pool } from "./db";
import { eq, sql, desc, gt, and } from "drizzle-orm";
import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

// Active WebSocket connections
type ClientWebSocket = WebSocket;
const activeConnections = new Set<ClientWebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Register campaign deployment routes
  registerCampaignDeploymentRoutes(app);
  
  // Announcements API
  app.get('/api/announcements', async (req, res) => {
    try {
      // Public endpoint - only shows approved announcements
      const announcements = await storage.getAnnouncementsByStatus('approved');
      res.json(announcements);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      res.status(500).send('Error fetching announcements');
    }
  });
  
  app.get('/api/announcements/type/:type', async (req, res) => {
    try {
      const { type } = req.params;
      const announcements = await storage.getAnnouncementsByType(type);
      // Filter to only show approved announcements to the public
      const filteredAnnouncements = announcements.filter(a => a.status === 'approved');
      res.json(filteredAnnouncements);
    } catch (error) {
      console.error('Error fetching announcements by type:', error);
      res.status(500).send('Error fetching announcements');
    }
  });
  
  app.get('/api/announcements/:id', async (req, res) => {
    try {
      // Skip validation for "all" route
      if (req.params.id === "all") {
        const announcements = await storage.getAllAnnouncements();
        return res.json(announcements);
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).send('Invalid announcement ID');
      }
      
      const announcement = await storage.getAnnouncement(id);
      if (!announcement) {
        return res.status(404).send('Announcement not found');
      }
      res.json(announcement);
    } catch (error) {
      console.error('Error fetching announcement:', error);
      res.status(500).send('Error fetching announcement');
    }
  });
  
  app.post('/api/announcements', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send('Unauthorized');
    try {
      const userId = req.user!.id;
      const announcementData = insertAnnouncementSchema.parse({
        ...req.body,
        userId
      });
      
      const announcement = await storage.createAnnouncement(announcementData);
      res.status(201).json(announcement);
    } catch (error) {
      console.error('Error creating announcement:', error);
      res.status(500).send('Error creating announcement');
    }
  });
  
  app.post('/api/announcements/:id/flag', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send('Unauthorized');
    try {
      const id = parseInt(req.params.id);
      const userId = req.user!.id;
      
      const flaggedAnnouncement = await storage.flagAnnouncement(id, userId);
      if (!flaggedAnnouncement) {
        return res.status(404).send('Announcement not found');
      }
      
      res.json({ success: true, message: 'Announcement flagged for review' });
    } catch (error) {
      console.error('Error flagging announcement:', error);
      res.status(500).send('Error flagging announcement');
    }
  });
  
  // Admin routes for announcement moderation
  app.get('/api/admin/announcements/pending', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send('Unauthorized');
    // Check if user is admin (user ID 1 is admin in this case)
    if (req.user!.id !== 1) return res.status(403).send('Forbidden');
    
    try {
      const announcements = await storage.getAnnouncementsByStatus('pending');
      res.json(announcements);
    } catch (error) {
      console.error('Error fetching pending announcements:', error);
      res.status(500).send('Error fetching announcements');
    }
  });
  
  app.get('/api/admin/announcements/flagged', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send('Unauthorized');
    // Check if user is admin (user ID 1 is admin in this case)
    if (req.user!.id !== 1) return res.status(403).send('Forbidden');
    
    try {
      const announcements = await storage.getFlaggedAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error('Error fetching flagged announcements:', error);
      res.status(500).send('Error fetching announcements');
    }
  });
  
  app.post('/api/admin/announcements/:id/moderate', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send('Unauthorized');
    // Check if user is admin (user ID 1 is admin in this case)
    if (req.user!.id !== 1) return res.status(403).send('Forbidden');
    
    try {
      const id = parseInt(req.params.id);
      const adminId = req.user!.id;
      const { status, notes } = req.body;
      
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).send('Invalid status value');
      }
      
      const moderatedAnnouncement = await storage.moderateAnnouncement(id, adminId, status, notes);
      if (!moderatedAnnouncement) {
        return res.status(404).send('Announcement not found');
      }
      
      res.json({ success: true, announcement: moderatedAnnouncement });
    } catch (error) {
      console.error('Error moderating announcement:', error);
      res.status(500).send('Error moderating announcement');
    }
  });
  
  app.delete('/api/admin/announcements/:id', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send('Unauthorized');
    // Check if user is admin (KoeppyLoco or user ID 2)
    const username = req.user!.username;
    if (req.user!.id !== 2 && username !== 'KoeppyLoco' && username !== 'KoeppyLoco ') {
      return res.status(403).send('Forbidden - Admin access required');
    }
    
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAnnouncement(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      res.status(500).send('Error deleting announcement');
    }
  });
  
  // Item system routes
  
  // Get all available items
  app.get('/api/items', async (req, res) => {
    try {
      const allItems = await storage.getAllItems();
      res.json(allItems);
    } catch (error) {
      console.error('Error fetching items:', error);
      res.status(500).send('Error fetching items');
    }
  });
  
  // Get items by type
  app.get('/api/items/type/:type', async (req, res) => {
    try {
      const { type } = req.params;
      const items = await storage.getItemsByType(type);
      res.json(items);
    } catch (error) {
      console.error('Error fetching items by type:', error);
      res.status(500).send('Error fetching items by type');
    }
  });
  
  // Get items by rarity
  app.get('/api/items/rarity/:rarity', async (req, res) => {
    try {
      const { rarity } = req.params;
      const items = await storage.getItemsByRarity(rarity);
      res.json(items);
    } catch (error) {
      console.error('Error fetching items by rarity:', error);
      res.status(500).send('Error fetching items by rarity');
    }
  });
  
  // Get specific item
  app.get('/api/items/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getItem(id);
      
      if (!item) {
        return res.status(404).send('Item not found');
      }
      
      res.json(item);
    } catch (error) {
      console.error('Error fetching item:', error);
      res.status(500).send('Error fetching item');
    }
  });
  
  // Character inventory routes
  
  // Get character's inventory
  app.get('/api/characters/:characterId/inventory', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send('Unauthorized');
    
    try {
      const characterId = parseInt(req.params.characterId);
      const character = await storage.getCharacter(characterId);
      
      if (!character) {
        return res.status(404).send('Character not found');
      }
      
      // Only character owners can view their inventory for now
      // We'll implement DM checks in a future update
      const authorized = character.userId === req.user!.id;
      
      if (!authorized) {
        return res.status(403).send('Not authorized to view this character inventory');
      }
      
      // Get the inventory items for this character
      const inventory = await storage.getCharacterItems(characterId);
      res.json(inventory);
    } catch (error) {
      console.error('Error fetching character inventory:', error);
      res.status(500).send('Error fetching character inventory');
    }
  });
  
  // Add item to character (DM only route)
  app.post('/api/characters/:characterId/inventory', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send('Unauthorized');
    
    try {
      const characterId = parseInt(req.params.characterId);
      const character = await storage.getCharacter(characterId);
      
      if (!character) {
        return res.status(404).send('Character not found');
      }
      
      // This endpoint is restricted - only DMs can add items to characters
      // Check if user is a DM for a campaign this character is in
      let isDm = false;
      
      // Get campaigns where user is DM
      const userCampaigns = await db.select()
        .from(campaigns)
        .where(eq(campaigns.userId, req.user!.id));
        
      if (userCampaigns.length > 0) {
        // Check if character is in any of those campaigns
        for (const campaign of userCampaigns) {
          const participant = await db.select()
            .from(campaignParticipants)
            .where(and(
              eq(campaignParticipants.campaignId, campaign.id),
              eq(campaignParticipants.characterId, characterId)
            ))
            .limit(1);
            
          if (participant.length > 0) {
            isDm = true;
            break;
          }
        }
      }
      
      // Admin check (if you have a special admin role)
      const isAdmin = req.user!.id === 2; // Hardcode for KoeppyLoco (your admin account)
      
      if (!isDm && !isAdmin) {
        return res.status(403).send('Not authorized to add items to this character. Items can only be obtained through quests, rewards, or trading.');
      }
      
      // Now continue with item addition
      const { itemId, quantity = 1, notes, acquiredFrom = "dm_reward" } = req.body;
        const isParticipating = await db.select()
          .from(campaignParticipants)
          .where(eq(campaignParticipants.characterId, characterId));
          
        if (isParticipating.length === 0) {
          return res.status(403).send('Not authorized to add items to this character');
        }
        
        const campaign = await storage.getCampaign(isParticipating[0].campaignId);
        if (!campaign || campaign.userId !== req.user!.id) {
          return res.status(403).send('Not authorized to add items to this character');
        }
      }
    } catch (error) {
      console.error("Error checking campaign participation:", error);
      return res.status(500).send('Server error');
    }
      
    const { itemId, quantity = 1, isEquipped = false, notes, acquiredFrom = "dm_reward" } = req.body;
      
      const item = await storage.getItem(itemId);
      if (!item) {
        return res.status(404).send('Item not found');
      }
      
      const characterItem = await storage.addItemToCharacter({
        characterId,
        itemId,
        quantity,
        isEquipped,
        notes,
        acquiredFrom
      });
      
      res.status(201).json(characterItem);
      
      const item = await storage.getItem(itemId);
      if (!item) {
        return res.status(404).send('Item not found');
      }
      
      const characterItem = await storage.addItemToCharacter({
        characterId,
        itemId,
        quantity,
        isEquipped,
        notes,
        acquiredFrom
      });
      
      res.status(201).json(characterItem);
    } catch (error) {
      console.error('Error adding item to character:', error);
      res.status(500).send('Error adding item to character');
    }
  });
  
  // Update character item (equip/unequip, change quantity, etc.)
  app.patch('/api/characters/:characterId/inventory/:itemId', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send('Unauthorized');
    
    try {
      const characterId = parseInt(req.params.characterId);
      const itemId = parseInt(req.params.itemId);
      
      const character = await storage.getCharacter(characterId);
      if (!character) {
        return res.status(404).send('Character not found');
      }
      
      // Only character owner can update items
      if (character.userId !== req.user!.id) {
        return res.status(403).send('Not authorized to update this character item');
      }
      
      // Check if item exists in character inventory
      const characterItemResult = await storage.getCharacterItem(itemId);
      if (!characterItemResult || characterItemResult.characterItem.characterId !== characterId) {
        return res.status(404).send('Item not found in character inventory');
      }
      
      const { quantity, isEquipped, notes } = req.body;
      const updatedItem = await storage.updateCharacterItem(itemId, {
        quantity,
        isEquipped,
        notes
      });
      
      res.json(updatedItem);
    } catch (error) {
      console.error('Error updating character item:', error);
      res.status(500).send('Error updating character item');
    }
  });
  
  // Remove item from character
  app.delete('/api/characters/:characterId/inventory/:itemId', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send('Unauthorized');
    
    try {
      const characterId = parseInt(req.params.characterId);
      const itemId = parseInt(req.params.itemId);
      
      const character = await storage.getCharacter(characterId);
      if (!character) {
        return res.status(404).send('Character not found');
      }
      
      // Only character owner can remove items
      if (character.userId !== req.user!.id) {
        return res.status(403).send('Not authorized to remove this character item');
      }
      
      // Check if item exists in character inventory
      const characterItemResult = await storage.getCharacterItem(itemId);
      if (!characterItemResult || characterItemResult.characterItem.characterId !== characterId) {
        return res.status(404).send('Item not found in character inventory');
      }
      
      const removed = await storage.removeItemFromCharacter(itemId);
      if (!removed) {
        return res.status(500).send('Failed to remove item');
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error removing character item:', error);
      res.status(500).send('Error removing character item');
    }
  });
  
  // Currency management routes
  
  // Get character currency
  app.get('/api/characters/:characterId/currency', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send('Unauthorized');
    
    try {
      const characterId = parseInt(req.params.characterId);
      const character = await storage.getCharacter(characterId);
      
      if (!character) {
        return res.status(404).send('Character not found');
      }
      
      // Only character owner can view currency
      if (character.userId !== req.user!.id) {
        return res.status(403).send('Not authorized to view this character currency');
      }
      
      // Return character currency fields
      const currency = {
        gold: character.goldCoins || 0,
        silver: character.silverCoins || 0,
        copper: character.copperCoins || 0
      };
      res.json(currency);
    } catch (error) {
      console.error('Error fetching character currency:', error);
      res.status(500).send('Error fetching character currency');
    }
  });
  
  // Update character currency
  app.post('/api/characters/:characterId/currency', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send('Unauthorized');
    
    try {
      const characterId = parseInt(req.params.characterId);
      const character = await storage.getCharacter(characterId);
      
      if (!character) {
        return res.status(404).send('Character not found');
      }
      
      // Only character owner or DM can update currency
      let isDm = false;
      if (character.userId !== req.user!.id) {
        // Check if is DM of a campaign
        const isParticipating = await db.select()
          .from(campaignParticipants)
          .where(eq(campaignParticipants.characterId, characterId));
          
        if (isParticipating.length === 0) {
          return res.status(403).send('Not authorized to update this character currency');
        }
        
        for (const participant of isParticipating) {
          const campaign = await storage.getCampaign(participant.campaignId);
          if (campaign && campaign.userId === req.user!.id) {
            isDm = true;
            break;
          }
        }
        
        if (!isDm) {
          return res.status(403).send('Not authorized to update this character currency');
        }
      }
      
      const { goldDelta = 0, silverDelta = 0, copperDelta = 0, reason } = req.body;
      
      // Update currency
      const updatedCharacter = await storage.updateCharacterCurrency(
        characterId,
        goldDelta,
        silverDelta,
        copperDelta
      );
      
      if (!updatedCharacter) {
        return res.status(400).send('Insufficient funds');
      }
      
      // Log the transaction
      if (reason) {
        await storage.addCurrencyTransaction({
          characterId,
          amount: goldDelta * 10000 + silverDelta * 100 + copperDelta, // Store in copper for consistency
          reason,
          referenceType: req.body.referenceType,
          referenceId: req.body.referenceId ? parseInt(req.body.referenceId) : undefined
        });
      }
      
      const currency = await storage.getCharacterCurrency(characterId);
      res.json(currency);
    } catch (error) {
      console.error('Error updating character currency:', error);
      res.status(500).send('Error updating character currency');
    }
  });
  
  // Get character currency transaction history
  app.get('/api/characters/:characterId/currency/history', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send('Unauthorized');
    
    try {
      const characterId = parseInt(req.params.characterId);
      const character = await storage.getCharacter(characterId);
      
      if (!character) {
        return res.status(404).send('Character not found');
      }
      
      // Only character owner can view transaction history
      if (character.userId !== req.user!.id) {
        return res.status(403).send('Not authorized to view this character transaction history');
      }
      
      const transactions = await storage.getCharacterTransactions(characterId);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching character transaction history:', error);
      res.status(500).send('Error fetching character transaction history');
    }
  });
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Initialize WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // WebSocket event handlers
  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    activeConnections.add(ws);
    
    ws.on('message', (message: WebSocket.Data) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received WebSocket message:', data);
        
        // Handle different message types
        if (data.type === 'dice_roll') {
          // Broadcast dice roll to all connected clients
          broadcastMessage(data.type, data.payload);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      activeConnections.delete(ws);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      activeConnections.delete(ws);
    });
  });
  
  // Function to broadcast messages to all connected clients
  function broadcastMessage(type: string, payload: any) {
    const message = JSON.stringify({ type, payload });
    activeConnections.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
  // API Routes
  app.get("/api/characters", async (req, res) => {
    try {
      const characters = await storage.getAllCharacters();
      res.json(characters);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch characters" });
    }
  });

  app.post("/api/characters", async (req, res) => {
    try {
      const characterData = insertCharacterSchema.parse(req.body);
      const character = await storage.createCharacter(characterData);
      res.status(201).json(character);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid character data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create character" });
      }
    }
  });

  app.get("/api/characters/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const character = await storage.getCharacter(id);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      res.json(character);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch character" });
    }
  });
  
  // Testing OpenAI portrait generation
  app.get("/api/test-portrait-generation", async (req, res) => {
    try {
      // Test portrait generation
      const testPrompt = "Create a fantasy portrait of a dwarf fighter with armor and axe";
      
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      console.log("Testing OpenAI portrait generation...");
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: testPrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "vivid",
      });
      
      console.log("OpenAI response:", response);
      
      const imageData = response.data?.[0];
      if (!imageData || !imageData.url) {
        throw new Error("No image data returned from OpenAI");
      }
      
      res.json({ 
        success: true, 
        message: "Test portrait generation successful", 
        url: imageData.url
      });
    } catch (error: any) {
      console.error("Error testing portrait generation:", error);
      res.status(500).json({ 
        success: false, 
        message: "Test portrait generation failed", 
        error: error.message 
      });
    }
  });

  // Character Portrait and Background Generation endpoints
  app.post("/api/characters/:id/generate-portrait", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const character = await storage.getCharacter(id);
      
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      
      // Generate portrait using OpenAI
      const portraitData = await generateCharacterPortrait({
        name: character.name,
        race: character.race,
        class: character.class,
        background: character.background || undefined,
        appearance: character.appearance || undefined
      });
      
      // Update character with portrait URL
      const updatedCharacter = await storage.updateCharacter(id, {
        portraitUrl: portraitData.url
      });
      
      res.json({ 
        portraitUrl: portraitData.url, 
        character: updatedCharacter 
      });
    } catch (error: any) {
      console.error("Error generating character portrait:", error);
      res.status(500).json({ 
        message: "Failed to generate character portrait", 
        error: error.message 
      });
    }
  });
  
  app.post("/api/characters/:id/generate-background", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const character = await storage.getCharacter(id);
      
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      
      // Generate background story using OpenAI
      const backgroundStory = await generateCharacterBackground({
        name: character.name,
        race: character.race,
        class: character.class,
        background: character.background || undefined
      });
      
      // Update character with background story
      const updatedCharacter = await storage.updateCharacter(id, {
        backgroundStory: backgroundStory
      });
      
      res.json({ 
        backgroundStory: backgroundStory, 
        character: updatedCharacter 
      });
    } catch (error: any) {
      console.error("Error generating character background:", error);
      res.status(500).json({ 
        message: "Failed to generate character background", 
        error: error.message 
      });
    }
  });

  // Campaign routes
  app.get("/api/campaigns", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user.id;
      const allCampaigns = await storage.getAllCampaigns();
      const userCampaigns = [];
      
      // For each campaign, add participant information
      for (const campaign of allCampaigns) {
        const participants = await storage.getCampaignParticipants(campaign.id);
        
        // Check if user is the creator or a participant
        if (campaign.userId === userId || participants.some(p => p.userId === userId)) {
          const campaignWithParticipants = {
            ...campaign,
            participants: participants
          };
          
          userCampaigns.push(campaignWithParticipants);
        }
      }
      
      res.json(userCampaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });
  
  // Get archived campaigns
  app.get("/api/campaigns/archived", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user.id;
      const archivedCampaigns = await storage.getArchivedCampaigns();
      const userArchivedCampaigns = [];
      
      // For each archived campaign, add participant information
      for (const campaign of archivedCampaigns) {
        // Check if user is the creator
        if (campaign.userId === userId) {
          const participants = await storage.getCampaignParticipants(campaign.id);
          const campaignWithParticipants = {
            ...campaign,
            participants
          };
          userArchivedCampaigns.push(campaignWithParticipants);
        }
      }
      
      res.json(userArchivedCampaigns);
    } catch (error) {
      console.error("Failed to fetch archived campaigns:", error);
      res.status(500).json({ message: "Failed to fetch archived campaigns" });
    }
  });

  // Generate a campaign using AI
  app.post("/api/campaigns/generate", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Check if OpenAI API key exists
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }
      
      const campaignRequest: CampaignGenerationRequest = {
        theme: req.body.theme,
        difficulty: req.body.difficulty,
        narrativeStyle: req.body.narrativeStyle,
        numberOfSessions: req.body.numberOfSessions
      };
      
      const generatedCampaign = await generateCampaign(campaignRequest);
      
      res.json({
        ...generatedCampaign,
        // Include additional fields needed for campaign creation form
        userId: req.user.id,
        createdAt: new Date().toISOString(),
        currentSession: 1
      });
    } catch (error) {
      console.error("Error generating campaign:", error);
      res.status(500).json({ message: "Failed to generate campaign" });
    }
  });

  app.post("/api/campaigns", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const campaignData = insertCampaignSchema.parse({
        ...req.body,
        userId: req.user.id,
        createdAt: new Date().toISOString(),
        currentSession: 1,
        isPublished: false,
        isPrivate: true,
        maxPlayers: 6
      });
      
      const campaign = await storage.createCampaign(campaignData);
      
      // Add the creator as a DM participant if a characterId is provided
      if (req.body.characterId) {
        await storage.addCampaignParticipant({
          campaignId: campaign.id,
          userId: req.user.id,
          characterId: req.body.characterId,
          role: 'dm',
          joinedAt: new Date().toISOString()
        });
      }
      
      // Generate and create the initial session for this campaign
      try {
        // Generate initial narrative based on campaign description
        const openaiClient = new OpenAI({ 
          apiKey: process.env.OPENAI_API_KEY
        });
        
        // Get NPC companions for context
        const campaignNpcs = await storage.getCampaignNpcs(campaign.id);
        let companionInfo = "";
        
        if (campaignNpcs && campaignNpcs.length > 0) {
          // Get full NPC data for active companions
          const activeCompanions = await Promise.all(
            campaignNpcs
              .filter(cnpc => cnpc.isActive)
              .map(async (cnpc) => {
                const npc = await storage.getNpc(cnpc.npcId);
                return {
                  ...cnpc,
                  details: npc
                };
              })
          );
          
          const validCompanions = activeCompanions.filter(c => c.details);
          if (validCompanions.length > 0) {
            companionInfo = "Companions traveling with the party: " + 
              validCompanions.map(comp => {
                const npc = comp.details;
                if (!npc) return "";
                return `${npc.name} (${npc.race} ${npc.occupation}, ${comp.role})`;
              }).filter(Boolean).join(", ");
          }
        }
        
        const prompt = `
You are an expert Dungeon Master for a D&D game with a ${campaign.narrativeStyle || "descriptive"} storytelling style.
Campaign: ${campaign.title}. ${campaign.description || ""}
${companionInfo}
Difficulty level: ${campaign.difficulty || "Normal - Balanced Challenge"}

Generate the opening scene for this campaign. Include:
1. A descriptive narrative of the initial setting and situation (3-4 paragraphs)
2. A title for this opening scene
3. Four possible actions the players can take next, with at least 2 actions requiring dice rolls (skill checks, saving throws, or combat rolls)

IMPORTANT: If there are any companions traveling with the party, make sure they actively participate in the narrative. They should:
- Contribute meaningful dialogue and interactions
- Provide assistance during challenging situations based on their type (combat companions should help in battles, support companions should offer healing, etc.)
- Have distinct personalities that show through their actions and words
- Offer advice or suggestions related to their skills and knowledge

Return your response as a JSON object with these fields:
- narrative: The descriptive text of the opening scene
- sessionTitle: A short, engaging title for this scene
- location: The current location or setting where the campaign begins
- choices: An array of 4 objects, each with:
  - action: A short description of a possible action
  - description: A brief explanation of what this action entails 
  - icon: A simple icon identifier (use: "search", "hand-sparkles", "running", "sword", or any basic icon name)
  - requiresDiceRoll: Boolean indicating if this action requires a dice roll
  - diceType: If requiresDiceRoll is true, include the type of dice to roll ("d20" for most skill checks and attacks, "d4", "d6", "d8", etc. for damage)
  - rollDC: If requiresDiceRoll is true, include the DC/difficulty (number to beat) for this roll
  - rollModifier: The modifier to add to the roll (based on character attributes, usually -2 to +5)
  - rollPurpose: A short explanation of what the roll is for (e.g., "Perception Check", "Athletics Check", "Attack Roll")
  - successText: Brief text to display on a successful roll
  - failureText: Brief text to display on a failed roll
`;
        
        const response = await openaiClient.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          max_tokens: 1500,
        });
        
        const responseContent = response.choices[0].message.content;
        let initialSessionData;
        
        try {
          initialSessionData = JSON.parse(responseContent);
          
          // Ensure the response has the expected structure
          if (!initialSessionData.narrative || !initialSessionData.sessionTitle || 
              !initialSessionData.location || !Array.isArray(initialSessionData.choices)) {
            throw new Error("Invalid response structure");
          }
          
          // Set default values for optional fields to prevent type errors
          initialSessionData.choices.forEach(choice => {
            if (choice.requiresDiceRoll) {
              choice.rollModifier = choice.rollModifier || 0;
            }
          });
          
          // Create initial session
          const sessionData = {
            campaignId: campaign.id,
            sessionNumber: 1,
            title: initialSessionData.sessionTitle,
            narrative: initialSessionData.narrative,
            location: initialSessionData.location,
            choices: JSON.stringify(initialSessionData.choices), // Convert to JSON string
            sessionXpReward: 100, // Add initial XP reward 
            createdAt: new Date().toISOString(),
          };
          
          await storage.createCampaignSession(sessionData);
          console.log(`Created initial session for campaign ${campaign.id}`);
          
        } catch (parseError) {
          console.error("Failed to parse OpenAI response for initial session:", parseError);
          console.log("Raw response:", responseContent);
          
          // Create a fallback session if parsing fails
          const fallbackSessionData = {
            campaignId: campaign.id,
            sessionNumber: 1,
            title: "The Adventure Begins",
            narrative: "Your journey begins in a small settlement at the edge of the known world. The air is filled with possibility as you prepare to embark on your first adventure.",
            location: "Starting Village",
            choices: JSON.stringify([
              { action: "Visit the local tavern", description: "Gather information from the locals", requiresDiceRoll: false },
              { action: "Meet with the town elder", description: "Learn about problems facing the settlement", requiresDiceRoll: false },
              { action: "Investigate nearby ruins", description: "Search for treasure and adventure", requiresDiceRoll: true, diceType: "d20", rollDC: 12, rollModifier: 0 }
            ]),
            sessionXpReward: 100,
            createdAt: new Date().toISOString(),
          };
          
          await storage.createCampaignSession(fallbackSessionData);
          console.log(`Created fallback session for campaign ${campaign.id} due to parsing error`);
        }
        
        // Update the campaign with the session number to establish the link
        await storage.updateCampaignSession(campaign.id, 1);
        
      } catch (sessionError) {
        console.error("Error creating initial session:", sessionError);
        
        // Create a fallback session if OpenAI call fails
        const fallbackSessionData = {
          campaignId: campaign.id,
          sessionNumber: 1,
          title: "The Adventure Begins",
          narrative: "Your journey begins in a small settlement at the edge of the known world. The air is filled with possibility as you prepare to embark on your first adventure.",
          location: "Starting Village",
          choices: JSON.stringify([
            { action: "Visit the local tavern", description: "Gather information from the locals", requiresDiceRoll: false },
            { action: "Meet with the town elder", description: "Learn about problems facing the settlement", requiresDiceRoll: false },
            { action: "Investigate nearby ruins", description: "Search for treasure and adventure", requiresDiceRoll: true, diceType: "d20", rollDC: 12, rollModifier: 0 }
          ]),
          sessionXpReward: 100,
          createdAt: new Date().toISOString(),
        };
        
        try {
          await storage.createCampaignSession(fallbackSessionData);
          console.log(`Created fallback session for campaign ${campaign.id} due to API error`);
          
          // Update the campaign with the session number to establish the link
          await storage.updateCampaignSession(campaign.id, 1);
        } catch (fallbackError) {
          console.error("Failed to create fallback session:", fallbackError);
        }
      }
      
      res.status(201).json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid campaign data", errors: error.errors });
      } else {
        console.error("Error creating campaign:", error);
        res.status(500).json({ message: "Failed to create campaign" });
      }
    }
  });

  app.get("/api/campaigns/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      const campaign = await storage.getCampaign(id);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Check if user is authorized to view this campaign
      const participants = await storage.getCampaignParticipants(id);
      const isParticipant = participants.some(p => p.userId === req.user.id);
      
      if (campaign.userId !== req.user.id && !isParticipant) {
        return res.status(403).json({ message: "Not authorized to view this campaign" });
      }
      
      // Get character details for each participant
      const participantsWithDetails = await Promise.all(
        participants.map(async (p) => {
          const character = await storage.getCharacter(p.characterId);
          const user = await storage.getUser(p.userId);
          return {
            ...p,
            character: character,
            username: user ? user.username : 'Unknown',
            displayName: user ? user.displayName : null
          };
        })
      );
      
      const campaignWithParticipants = {
        ...campaign,
        participants: participantsWithDetails
      };
      
      res.json(campaignWithParticipants);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ message: "Failed to fetch campaign" });
    }
  });

  // Campaign Session routes
  app.get("/api/campaigns/:campaignId/sessions/:sessionNumber", async (req, res) => {
    try {
      const campaignId = parseInt(req.params.campaignId);
      const sessionNumber = parseInt(req.params.sessionNumber);
      const session = await storage.getCampaignSession(campaignId, sessionNumber);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });
  
  // Get all sessions for a campaign
  app.get("/api/campaigns/:campaignId/sessions", async (req, res) => {
    try {
      const campaignId = parseInt(req.params.campaignId);
      const sessions = await storage.getCampaignSessions(campaignId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch campaign sessions" });
    }
  });
  
  // Complete a session and award rewards to participants
  app.post("/api/campaigns/:campaignId/sessions/:sessionId/complete", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const campaignId = parseInt(req.params.campaignId);
      const sessionId = parseInt(req.params.sessionId);
      
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Only the DM can mark a session as complete
      if (campaign.userId !== req.user.id) {
        return res.status(403).json({ message: "Only the DM can complete a session" });
      }
      
      const sessions = await storage.getCampaignSessions(campaignId);
      const session = sessions.find(s => s.id === sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (session.isCompleted) {
        return res.status(400).json({ message: "Session is already completed" });
      }
      
      // Mark the session as complete
      let completedSession = session;
      try {
        const updateData = {
          isCompleted: true,
          completedAt: new Date().toISOString()
        };
        
        // Get the updated session by manually setting it
        completedSession = {
          ...session,
          ...updateData
        };
        
        // Use storage API but handle any errors
        await storage.updateCampaignSession(sessionId, updateData);
      } catch (dbError) {
        console.error('Error updating session in database:', dbError);
        return res.status(500).json({ message: 'Database error when completing session' });
      }
      
      // Get all participants in the campaign
      const participants = await storage.getCampaignParticipants(campaignId);
      
      // Award currency to each active participant
      for (const participant of participants) {
        if (participant.isActive) {
          try {
            // Get the character
            const character = await storage.getCharacter(participant.characterId);
            if (!character) continue;
            
            // Calculate reward based on level and randomness
            const level = character.level || 1;
            const goldReward = Math.floor(5 + (level * 2) + (Math.random() * level * 3));
            const silverReward = Math.floor(10 + (level * 3) + (Math.random() * level * 5));
            const copperReward = Math.floor(15 + (level * 5) + (Math.random() * level * 10));
            
            // Award currency
            await storage.updateCharacter(participant.characterId, {
              goldCoins: (character.goldCoins || 0) + goldReward,
              silverCoins: (character.silverCoins || 0) + silverReward,
              copperCoins: (character.copperCoins || 0) + copperReward
            });
            
            // Record currency transaction
            await storage.addCurrencyTransaction({
              characterId: participant.characterId,
              amount: (goldReward * 10000) + (silverReward * 100) + copperReward,
              reason: 'quest_reward',
              referenceId: session.id,
              referenceType: 'campaign_session',
              createdAt: new Date().toISOString()
            });
            
            console.log(`Awarded currency to ${character.name}: ${goldReward}g, ${silverReward}s, ${copperReward}c`);
            
            // Award XP if available
            if (session.sessionXpReward) {
              await storage.updateCharacter(participant.characterId, {
                experience: (character.experience || 0) + session.sessionXpReward
              });
              console.log(`Awarded ${session.sessionXpReward} XP to character ${character.name}`);
            }
          } catch (rewardError) {
            console.error(`Error awarding rewards to character ${participant.characterId}:`, rewardError);
            // Continue with other participants even if one fails
          }
        }
      }
      
      res.json({
        completedSession,
        message: "Session completed and rewards distributed to all participants"
      });
    } catch (error) {
      console.error("Error completing campaign session:", error);
      res.status(500).json({ message: "Failed to complete campaign session" });
    }
  });
  
  // Multi-user Campaign Participant Management
  
  // Get participants for a campaign
  app.get("/api/campaigns/:campaignId/participants", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const campaignId = parseInt(req.params.campaignId);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Check if user is authorized to view this campaign's participants
      const userParticipant = await storage.getCampaignParticipant(campaignId, req.user.id);
      if (!userParticipant && campaign.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to view participants" });
      }
      
      const participants = await storage.getCampaignParticipants(campaignId);
      
      // Get user and character details for each participant
      const participantsWithDetails = await Promise.all(
        participants.map(async (p) => {
          const character = await storage.getCharacter(p.characterId);
          const user = await storage.getUser(p.userId);
          return {
            ...p,
            character,
            username: user ? user.username : 'Unknown',
            displayName: user ? user.displayName : null
          };
        })
      );
      
      res.json(participantsWithDetails);
    } catch (error) {
      console.error("Error fetching participants:", error);
      res.status(500).json({ message: "Failed to fetch participants" });
    }
  });
  
  // Add a participant to a campaign - THIS ROUTE IS DUPLICATED
  // SEE MULTI-USER CAMPAIGN MANAGEMENT SECTION FOR THE ACTIVE IMPLEMENTATION
  app.post("/api/campaigns/:campaignId/participants-unused", async (req, res) => {
    try {
      res.status(500).json({ message: "This route is deprecated" });
    } catch (err) {
      res.status(500).json({ message: "This route is deprecated" });
    }
  });
  
  // Remove a participant from a campaign
  app.delete("/api/campaigns/:campaignId/participants/:userId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const campaignId = parseInt(req.params.campaignId);
      const userIdToRemove = parseInt(req.params.userId);
      
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Verify permissions: only campaign owner or the participant themselves can remove
      if (campaign.userId !== req.user.id && userIdToRemove !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to remove participants" });
      }
      
      // Remove the participant
      const result = await storage.removeCampaignParticipant(campaignId, userIdToRemove);
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error removing participant:", error);
      res.status(500).json({ message: "Failed to remove participant" });
    }
  });
  
  // Turn-based Campaign Management
  
  // Get the current turn information
  app.get("/api/campaigns/:campaignId/turns/current", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const campaignId = parseInt(req.params.campaignId);
      
      // Verify the campaign exists
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Check if user is a participant
      const participant = await storage.getCampaignParticipant(campaignId, req.user.id);
      if (!participant && campaign.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to view this campaign" });
      }
      
      // Get current turn info
      const turnInfo = await storage.getCurrentTurn(campaignId);
      
      if (!turnInfo) {
        return res.json({ active: false });
      }
      
      // Get user details for the current turn
      const user = await storage.getUser(turnInfo.userId);
      const participantInfo = await storage.getCampaignParticipant(campaignId, turnInfo.userId);
      const character = participantInfo ? await storage.getCharacter(participantInfo.characterId) : null;
      
      res.json({
        active: true,
        userId: turnInfo.userId,
        username: user ? user.username : 'Unknown',
        displayName: user ? user.displayName : null,
        character: character,
        startedAt: turnInfo.startedAt,
        isCurrentUser: turnInfo.userId === req.user.id
      });
    } catch (error) {
      console.error("Error fetching current turn:", error);
      res.status(500).json({ message: "Failed to fetch current turn information" });
    }
  });
  
  // Start the next turn in the campaign
  app.post("/api/campaigns/:campaignId/turns/next", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const campaignId = parseInt(req.params.campaignId);
      
      // Verify the campaign exists
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Only the DM can advance turns
      if (campaign.userId !== req.user.id) {
        return res.status(403).json({ message: "Only the DM can advance turns" });
      }
      
      // Start the next turn
      const turnInfo = await storage.startNextTurn(campaignId);
      
      if (!turnInfo) {
        return res.status(400).json({ message: "Failed to start next turn" });
      }
      
      // Get user details for the new turn
      const user = await storage.getUser(turnInfo.userId);
      const participantInfo = await storage.getCampaignParticipant(campaignId, turnInfo.userId);
      const character = participantInfo ? await storage.getCharacter(participantInfo.characterId) : null;
      
      // Broadcast turn change via WebSocket
      broadcastMessage('turn_change', {
        campaignId,
        userId: turnInfo.userId,
        username: user ? user.username : 'Unknown',
        startedAt: turnInfo.startedAt
      });
      
      res.json({
        userId: turnInfo.userId,
        username: user ? user.username : 'Unknown',
        displayName: user ? user.displayName : null,
        character: character,
        startedAt: turnInfo.startedAt
      });
    } catch (error) {
      console.error("Error starting next turn:", error);
      res.status(500).json({ message: "Failed to start next turn" });
    }
  });
  
  // End the current turn
  app.post("/api/campaigns/:campaignId/turns/end", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const campaignId = parseInt(req.params.campaignId);
      
      // Verify the campaign exists
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Only the DM or current player can end the turn
      if (campaign.userId !== req.user.id && campaign.currentTurnUserId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to end the current turn" });
      }
      
      // End the current turn
      const result = await storage.endCurrentTurn(campaignId);
      
      // Broadcast turn end via WebSocket
      broadcastMessage('turn_ended', { campaignId });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error ending turn:", error);
      res.status(500).json({ message: "Failed to end turn" });
    }
  });

  app.post("/api/campaigns/:campaignId/sessions", async (req, res) => {
    try {
      const campaignId = parseInt(req.params.campaignId);
      const sessionData = insertCampaignSessionSchema.parse({
        ...req.body,
        campaignId
      });
      
      const session = await storage.createCampaignSession(sessionData);
      
      // Update the campaign's current session number
      const campaign = await storage.getCampaign(campaignId);
      if (campaign) {
        await storage.updateCampaignSession(campaignId, session.sessionNumber);
      }
      
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid session data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create session" });
      }
    }
  });

  // Dice roll routes
  app.post("/api/dice/roll", async (req, res) => {
    try {
      // Log the raw request body for debugging
      console.log("Dice roll request body:", req.body);
      
      // Authentication check
      if (!req.isAuthenticated()) {
        req.body.userId = 1; // For demo, use user ID 1 if not authenticated
      } else {
        req.body.userId = req.user?.id;
      }
      
      // Ensure we have all the required fields with defaults
      const diceRollData = {
        ...req.body,
        userId: req.body.userId || 1,
        createdAt: new Date().toISOString(),
        diceType: req.body.diceType || "d20",
        result: 0 // This will be replaced with actual result
      };
      
      // Now try to parse with the schema
      const validatedData = insertDiceRollSchema.parse(diceRollData);
      
      // Implement actual dice rolling
      const { diceType, modifier, purpose } = validatedData;
      const count = validatedData.count || 1; // Default to 1 if count is not provided
      
      // Parse and validate dice type
      let max = 20; // Default to d20
      if (diceType && diceType.startsWith('d')) {
        const parsedMax = parseInt(diceType.substring(1));
        if (!isNaN(parsedMax) && parsedMax > 0) {
          max = parsedMax;
        } else {
          console.warn(`Server: Invalid dice type format: ${diceType}, defaulting to d20`);
        }
      } else {
        console.warn(`Server: Invalid dice type: ${diceType}, defaulting to d20`);
      }
      
      console.log(`Server rolling ${count}d${max} with modifier ${modifier || 0}`);
      
      // Roll the dice the specified number of times
      const rolls: number[] = [];
      for (let i = 0; i < count; i++) {
        const roll = Math.floor(Math.random() * max) + 1;
        console.log(`Server roll ${i+1} result: ${roll}`);
        rolls.push(roll);
      }
      
      // Calculate total
      const rollSum = rolls.reduce((sum, roll) => sum + roll, 0);
      const total = rollSum + (modifier || 0); // Ensure modifier is a number
      
      // Check for critical hit or fumble (only applies to d20)
      const isCritical = diceType === "d20" && rolls.some(roll => roll === 20);
      const isFumble = diceType === "d20" && rolls.some(roll => roll === 1);
      
      // Save dice roll to storage with the calculated result
      // Make sure we have the actual result before saving
      const dataToSave = {
        ...validatedData,
        result: total,
        modifier: modifier || 0,
        count: count
      };
      
      console.log("Saving dice roll to storage:", dataToSave);
      
      const diceRoll = await storage.createDiceRoll(dataToSave);
      
      // Full result object with all details for client
      const fullResult = {
        ...diceRoll,
        rolls,
        total,
        isCritical,
        isFumble,
        // Make sure we include these for the client
        diceType: diceType,
        modifier: modifier || 0,
        count: count,
        purpose: purpose || null
      };
      
      console.log("Server sending dice roll result:", JSON.stringify(fullResult));
      
      // Return full result with rolls details
      res.status(201).json(fullResult);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid dice roll data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to process dice roll" });
      }
    }
  });

  app.get("/api/dice/history", async (req, res) => {
    try {
      const rolls = await storage.getDiceRollHistory(1); // Default user for demo
      res.json(rolls);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dice roll history" });
    }
  });

  // Route to advance campaign story based on player actions
  app.post("/api/campaigns/advance-story", async (req, res) => {
    // Set content type to ensure consistent JSON responses
    res.setHeader('Content-Type', 'application/json');
    
    try {
      const { campaignId, prompt, narrativeStyle, difficulty, storyDirection, currentLocation, action, sessionId } = req.body;
      
      console.log("Story advancement request:", { campaignId, action });
      
      if (!campaignId) {
        return res.status(400).json({ message: "Campaign ID is required" });
      }
      
      // Validate action has been provided
      if (!action) {
        return res.status(400).json({ message: "Action is required" });
      }
      
      // Remove any "What will you do?" text from the prompt if prompt exists
      const cleanedPrompt = prompt ? prompt.replace(/What will you do\?/g, "").trim() : "";
      
      // Get campaign and character information for context
      let campaignContext = "";
      let locationContext = "";
      
      if (currentLocation) {
        locationContext = `Current location: ${currentLocation}.`;
      }
      
      const campaign = await storage.getCampaign(parseInt(campaignId));
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      campaignContext = `Campaign: ${campaign.title}. ${campaign.description || ""}`;
      
      // Get campaign participants to find characters
      const participants = await storage.getCampaignParticipants(campaign.id);
      if (participants && participants.length > 0) {
        // Get character info for each participant
        const characters = await Promise.all(
          participants.map(async (p) => await storage.getCharacter(p.characterId))
        );
        
        const validCharacters = characters.filter(Boolean);
        if (validCharacters.length > 0) {
          campaignContext += " Characters in party: " + 
            validCharacters.map(char => {
              if (!char) return "";
              return `${char.name || "Unknown"} (Level ${char.level || 1} ${char.race || "Human"} ${char.class || "Fighter"})`;
            }).filter(Boolean).join(", ");
        }
      }
      
      // Get NPC companions to include in the narrative
      const campaignNpcs = await storage.getCampaignNpcs(campaign.id);
      if (campaignNpcs && campaignNpcs.length > 0) {
        // Get full NPC data for active companions
        const activeCompanions = await Promise.all(
          campaignNpcs
            .filter(cnpc => cnpc.isActive)
            .map(async (cnpc) => {
              const npc = await storage.getNpc(cnpc.npcId);
              return {
                ...cnpc,
                details: npc
              };
            })
        );
        
        const validCompanions = activeCompanions.filter(c => c.details);
        if (validCompanions.length > 0) {
          campaignContext += " Companions traveling with the party: " + 
            validCompanions.map(comp => {
              const npc = comp.details;
              if (!npc) return "";
              return `${npc.name} (${npc.race} ${npc.occupation}, ${comp.role})`;
            }).filter(Boolean).join(", ");
        }
      }
      
      const promptWithContext = `
You are an expert Dungeon Master for a D&D game with a ${narrativeStyle || "descriptive"} storytelling style.
${campaignContext}
${locationContext}
Difficulty level: ${difficulty || "Normal - Balanced Challenge"}
Story direction preference: ${storyDirection || "balanced mix of combat, roleplay, and exploration"}

Based on the player's action: "${action}", generate the next part of the adventure. Include:
1. A descriptive narrative of what happens next (3-4 paragraphs)
2. A title for this scene/encounter
3. Four possible actions the player can take next, with at least 2 actions requiring dice rolls (skill checks, saving throws, or combat rolls)

IMPORTANT GAME MECHANICS:
1. COMBAT PROGRESSION - If the action was a combat roll:
   - Describe vivid combat with attacks, counterattacks, and tactical positioning
   - Include NPC reactions and support during combat
   - Show injuries, stamina loss, or other combat effects on both players and enemies
   - Indicate how close enemies are to defeat (e.g., "the goblin staggers, badly wounded")

2. REWARDS SYSTEM - After significant accomplishments, always include some form of reward:
   - After combat: Describe defeated enemies dropping weapons, armor, potions, or currency
   - After exploration: Describe discovery of hidden treasures, ancient artifacts, or magical items
   - After social encounters: Describe gaining valuable information, favors, or alliances
   - Include specific item names and basic properties for important finds

3. STORY COMPLETION - If the player resolves a major plot point:
   - Provide clear narrative closure to that part of the adventure
   - Indicate progress toward larger campaign goals 
   - Suggest new adventure hooks or paths forward
   - Consider awarding XP or level advancement for major accomplishments

If there are any companions traveling with the party, make sure they actively participate in the narrative. They should:
- Contribute meaningful dialogue and interactions
- Provide assistance during challenging situations based on their type
- Have distinct personalities that show through their actions and words
- Offer advice or suggestions related to their skills and knowledge

Return your response as a JSON object with these fields:
- narrative: The descriptive text of what happens next
- sessionTitle: A short, engaging title for this scene
- location: The current location or setting where this scene takes place
- rewards: An array of rewards the player earns from this action (leave empty if none apply):
  - Each reward should have:
    - type: "item" | "currency" | "experience"
    - name: Name of the item, type of currency, or "XP"
    - description: Brief description of the reward
    - value: Numerical value (amount of gold, XP points)
    - rarity: For items only - "common" | "uncommon" | "rare" | "very rare" | "legendary"
- choices: An array of 4 objects, each with:
  - action: A short description of a possible action
  - description: A brief explanation of what this action entails 
  - icon: A simple icon identifier (use: "search", "hand-sparkles", "running", "sword", or any basic icon name)
  - requiresDiceRoll: Boolean indicating if this action requires a dice roll
  - diceType: If requiresDiceRoll is true, include the type of dice to roll ("d20" for most skill checks and attacks, "d4", "d6", "d8", etc. for damage)
  - rollDC: If requiresDiceRoll is true, include the DC/difficulty (number to beat) for this roll
  - rollModifier: The modifier to add to the roll (based on character attributes, usually -2 to +5)
  - rollPurpose: A short explanation of what the roll is for (e.g., "Perception Check", "Athletics Check", "Attack Roll")
  - successText: Brief text to display on a successful roll
  - failureText: Brief text to display on a failed roll
`;

      // Check if there was a recent dice roll to include in the context
      let diceContext = "";
      try {
        // Get recent dice rolls for this campaign
        const recentRolls = await storage.getDiceRollHistory(1, 5); // Get last 5 rolls
        if (recentRolls && recentRolls.length > 0) {
          const latestRoll = recentRolls[0]; // Most recent roll
          
          // Add dice roll context to the prompt
          diceContext = `
The player recently made a ${latestRoll.purpose || "dice"} roll:
- Rolled: ${latestRoll.diceType} (result: ${latestRoll.result})
- Total with modifier (${latestRoll.modifier || 0}): ${latestRoll.result + (latestRoll.modifier || 0)}
- Purpose: ${latestRoll.purpose || "Unknown"}
- ${latestRoll.result === 20 ? "CRITICAL SUCCESS!" : latestRoll.result === 1 ? "CRITICAL FAILURE!" : ""}

Make sure your narrative directly incorporates the outcome of this roll.
`;
        }
      } catch (rollError) {
        console.error("Error fetching recent dice rolls:", rollError);
        // Continue without dice context if there's an error
      }
      
      // Add the dice context to the prompt if available
      const finalPrompt = diceContext ? `${promptWithContext}\n${diceContext}` : promptWithContext;
      
      // Generate story directly using OpenAI
      const openaiClient = new OpenAI({ 
        apiKey: process.env.OPENAI_API_KEY
      });
      
      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages: [{ role: "user", content: finalPrompt }],
        response_format: { type: "json_object" },
        max_tokens: 1500,
      });

      const responseContent = response.choices[0].message.content;
      let storyData;
      
      try {
        storyData = JSON.parse(responseContent);
        
        // Ensure the response has the expected structure
        if (!storyData.narrative || !storyData.sessionTitle || 
            !storyData.location || !Array.isArray(storyData.choices)) {
          throw new Error("Invalid response structure");
        }
        
        // Ensure rewards is an array (even if empty)
        if (!storyData.rewards) {
          storyData.rewards = [];
        }
      } catch (parseError) {
        console.error("Failed to parse OpenAI response:", parseError);
        console.log("Raw response:", responseContent);
        return res.status(500).json({ 
          message: "Failed to parse story generation response",
          error: parseError.message
        });
      }
      
      // Create new session with incrementing session number
      const sessionNumber = (campaign.currentSession || 0) + 1;
      console.log(`Creating new session ${sessionNumber} for campaign ${campaignId}`);
      
      // Process rewards if present
      if (storyData.rewards && Array.isArray(storyData.rewards) && storyData.rewards.length > 0) {
        console.log(`Story advancement includes ${storyData.rewards.length} rewards:`, storyData.rewards);
        
        // For each reward, we could add it to the character's inventory or currency
        try {
          // Get the main character for this campaign
          const participants = await storage.getCampaignParticipants(parseInt(campaignId));
          if (participants && participants.length > 0) {
            // Process rewards for each participant
            for (const participant of participants) {
              for (const reward of storyData.rewards) {
                if (reward.type === 'currency' && reward.value > 0) {
                  // Add currency reward to character
                  try {
                    await pool.query(
                      `INSERT INTO currency_transactions 
                      (character_id, amount, transaction_type, description, created_at) 
                      VALUES ($1, $2, $3, $4, NOW())`,
                      [participant.characterId, reward.value, 'reward', `Reward from adventure: ${reward.name}`]
                    );
                    console.log(`Added ${reward.value} currency to character ${participant.characterId}`);
                  } catch (err) {
                    console.error(`Failed to add currency reward:`, err);
                  }
                } 
                else if (reward.type === 'item') {
                  // Add item reward to character inventory
                  try {
                    // Check if item exists first
                    const [existingItem] = await pool.query(
                      `SELECT id FROM items WHERE name = $1`, 
                      [reward.name]
                    ).then(res => res.rows);
                    
                    let itemId;
                    if (existingItem) {
                      itemId = existingItem.id;
                    } else {
                      // Create the item if it doesn't exist
                      const [newItem] = await pool.query(
                        `INSERT INTO items (name, description, category, rarity, created_at) 
                        VALUES ($1, $2, $3, $4, NOW()) RETURNING id`,
                        [reward.name, reward.description, 'loot', reward.rarity || 'common']
                      ).then(res => res.rows);
                      itemId = newItem.id;
                    }
                    
                    // Add to character inventory
                    await pool.query(
                      `INSERT INTO character_items (character_id, item_id, quantity, created_at) 
                      VALUES ($1, $2, $3, NOW())
                      ON CONFLICT (character_id, item_id) 
                      DO UPDATE SET quantity = character_items.quantity + $3`,
                      [participant.characterId, itemId, 1]
                    );
                    
                    console.log(`Added item ${reward.name} to character ${participant.characterId}`);
                  } catch (err) {
                    console.error(`Failed to add item reward:`, err);
                  }
                }
                else if (reward.type === 'experience' && reward.value > 0) {
                  // For now just log XP rewards, as we don't have an XP system yet
                  console.log(`Character ${participant.characterId} would receive ${reward.value} XP`);
                }
              }
            }
          }
        } catch (rewardErr) {
          console.error("Error processing rewards:", rewardErr);
        }
      }
      
      const sessionData = {
        campaignId: parseInt(campaignId),
        sessionNumber,
        title: storyData.sessionTitle,
        narrative: storyData.narrative,
        location: storyData.location,
        choices: JSON.stringify(storyData.choices), // Convert choices to JSON string for storage
        createdAt: new Date().toISOString(), // Add required createdAt field
        // Include any rewards in the session data
        rewards: storyData.rewards ? JSON.stringify(storyData.rewards) : '[]',
        // Add session XP reward for completing actions
        sessionXpReward: 100 + (sessionNumber * 25) // Scale XP with session number
      };
      
      // Save the session
      const session = await storage.createCampaignSession(sessionData);
      
      // Update campaign's current session with Drizzle ORM
      try {
        // Use direct pool query as a more reliable approach
        await pool.query(
          `UPDATE campaigns SET current_session = $1, updated_at = NOW() WHERE id = $2`,
          [sessionNumber, parseInt(campaignId)]
        );
        
        console.log(`Successfully updated campaign ${campaignId} to session ${sessionNumber}`);
        
        // Return both campaign and session for client to update properly
        res.status(201).json({
          session,
          campaignId: parseInt(campaignId),
          newSessionNumber: sessionNumber,
          success: true
        });
      } catch (updateError) {
        console.error("Error updating campaign session:", updateError);
        // Even if update fails, return the session
        res.status(201).json({
          session, 
          updateError: "Failed to update campaign but session was created",
          success: true
        });
      }
    } catch (error) {
      console.error("Error advancing story:", error);
      
      // More detailed error handling
      let errorMessage = "Failed to advance story";
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error("Error details:", error.stack);
      }
      
      // Ensure we're sending a proper JSON response with the correct Content-Type
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ 
        message: "Failed to advance story", 
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error)
      });
    }
  });

  // OpenAI integration routes
  app.post("/api/openai/generate-story", async (req, res) => {
    try {
      const { prompt, narrativeStyle, difficulty, storyDirection, campaignId, currentLocation } = req.body;

      // Get campaign and character information for context if provided
      let campaignContext = "";
      let locationContext = "";
      
      if (currentLocation) {
        locationContext = `Current location: ${currentLocation}.`;
      }
      
      if (campaignId) {
        const campaign = await storage.getCampaign(parseInt(campaignId));
        if (campaign) {
          campaignContext = `Campaign: ${campaign.title}. ${campaign.description || ""}`;
          
          // Get campaign participants to find characters
          const participants = await storage.getCampaignParticipants(parseInt(campaignId));
          if (participants && participants.length > 0) {
            // Get character info for each participant
            const characters = await Promise.all(
              participants.map(async (p) => await storage.getCharacter(p.characterId))
            );
            
            const validCharacters = characters.filter(Boolean);
            if (validCharacters.length > 0) {
              campaignContext += " Characters in party: " + 
                validCharacters.map(char => {
                  if (!char) return "";
                  return `${char.name || "Unknown"} (Level ${char.level || 1} ${char.race || "Human"} ${char.class || "Fighter"})`;
                }).filter(Boolean).join(", ");
            }
          }
        }
      }

      const promptWithContext = `
You are an expert Dungeon Master for a D&D game with a ${narrativeStyle || "descriptive"} storytelling style.
${campaignContext}
${locationContext}
Difficulty level: ${difficulty || "Normal - Balanced Challenge"}
Story direction preference: ${storyDirection || "balanced mix of combat, roleplay, and exploration"}

Based on the player's action: "${prompt}", generate the next part of the adventure. Include:
1. A descriptive narrative of what happens next (3-4 paragraphs)
2. A title for this scene/encounter
3. Four possible actions the player can take next, with at least 2 actions requiring dice rolls (skill checks, saving throws, or combat rolls)

Return your response as a JSON object with these fields:
- narrative: The descriptive text of what happens next
- sessionTitle: A short, engaging title for this scene
- location: The current location or setting where this scene takes place
- choices: An array of 4 objects, each with:
  - action: A short description of a possible action
  - description: A brief explanation of what this action entails 
  - icon: A simple icon identifier (use: "search", "hand-sparkles", "running", "sword", or any basic icon name)
  - requiresDiceRoll: Boolean indicating if this action requires a dice roll
  - diceType: If requiresDiceRoll is true, include the type of dice to roll ("d20" for most skill checks and attacks, "d4", "d6", "d8", etc. for damage)
  - rollDC: If requiresDiceRoll is true, include the DC/difficulty (number to beat) for this roll
  - rollModifier: The modifier to add to the roll (based on character attributes, usually -2 to +5)
  - rollPurpose: A short explanation of what the roll is for (e.g., "Perception Check", "Athletics Check", "Attack Roll")
  - successText: Brief text to display on a successful roll
  - failureText: Brief text to display on a failed roll
`;

      const openaiClient = new OpenAI({ 
        apiKey: process.env.OPENAI_API_KEY
      });
      
      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages: [{ role: "user", content: promptWithContext }],
        response_format: { type: "json_object" },
        max_tokens: 1500,
      });

      const responseContent = response.choices[0].message.content;
      let parsedResponse;
      
      try {
        parsedResponse = JSON.parse(responseContent);
        
        // Ensure the response has the expected structure
        if (!parsedResponse.narrative || !parsedResponse.sessionTitle || 
            !parsedResponse.location || !Array.isArray(parsedResponse.choices)) {
          throw new Error("Invalid response structure");
        }
        
        res.json(parsedResponse);
      } catch (parseError) {
        // Fallback for parsing errors
        res.status(500).json({ 
          message: "Failed to parse OpenAI response",
          rawResponse: responseContent
        });
      }
    } catch (error) {
      console.error("OpenAI API error:", error);
      // More detailed error logging
      if (error.response) {
        console.error("OpenAI API error details:", {
          status: error.response.status,
          data: error.response.data
        });
      }
      res.status(500).json({ 
        message: "Failed to generate story", 
        error: error.message 
      });
    }
  });

  app.post("/api/openai/generate-character", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }
      
      const { prompt } = req.body;

      const characterPrompt = `
Generate a unique and compelling character concept for a Dungeons & Dragons 5th Edition game. 
${prompt ? `Additional requirements: ${prompt}` : ""}

Return your response as a JSON object with these fields:
- name: A fantasy-appropriate name for the character
- race: A D&D race (Human, Elf, Dwarf, Halfling, etc.)
- class: A D&D class (Fighter, Wizard, Rogue, etc.)
- background: A D&D background (Soldier, Sage, Criminal, etc.)
- alignment: The character's alignment (Lawful Good, Chaotic Neutral, etc.)
- personality: A brief description of personality traits
- backstory: A short paragraph about the character's history
`;

      // Import the OpenAI client from our module
      const openaiClient = new OpenAI({ 
        apiKey: process.env.OPENAI_API_KEY
      });
      
      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages: [{ role: "user", content: characterPrompt }],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });

      const characterData = JSON.parse(response.choices[0].message.content);
      res.json(characterData);
    } catch (error) {
      console.error("OpenAI API error:", error);
      res.status(500).json({ message: "Failed to generate character" });
    }
  });

  app.post("/api/openai/explain-rule", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }
      
      const { ruleTopic } = req.body;

      const rulePrompt = `
Explain the following D&D 5e rule topic in a clear, concise way: "${ruleTopic}"

Return your response as a JSON object with these fields:
- title: The name of the rule or mechanic
- explanation: A clear explanation of how the rule works in 2-3 paragraphs
- examples: An array of 2-3 practical examples of how this rule is applied in gameplay
`;

      // Import the OpenAI client from our module
      const openaiClient = new OpenAI({ 
        apiKey: process.env.OPENAI_API_KEY
      });
      
      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages: [{ role: "user", content: rulePrompt }],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });

      const ruleExplanation = JSON.parse(response.choices[0].message.content);
      res.json(ruleExplanation);
    } catch (error) {
      console.error("OpenAI API error:", error);
      res.status(500).json({ message: "Failed to explain rule" });
    }
  });

  // Get dice roll history
  app.get("/api/dice/history", async (req, res) => {
    try {
      // Default user ID for demo
      const userId = 1;
      // Get the last 20 dice rolls
      const history = await storage.getDiceRollHistory(userId, 20);
      res.json(history);
    } catch (error) {
      console.error("Failed to retrieve dice roll history:", error);
      res.status(500).json({ message: "Failed to retrieve dice roll history" });
    }
  });
  
  // Archive a campaign
  app.post("/api/campaigns/:campaignId/archive", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const campaignId = parseInt(req.params.campaignId);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Only campaign owner can archive
      if (campaign.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to archive this campaign" });
      }
      
      const archivedCampaign = await storage.archiveCampaign(campaignId);
      res.json(archivedCampaign);
    } catch (error) {
      console.error("Error archiving campaign:", error);
      res.status(500).json({ message: "Failed to archive campaign" });
    }
  });
  
  // Restore a campaign from archive
  app.post("/api/campaigns/:campaignId/restore", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const campaignId = parseInt(req.params.campaignId);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Only campaign owner can restore
      if (campaign.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to restore this campaign" });
      }
      
      // Update campaign to remove archive flag
      const restoredCampaign = await storage.updateCampaign(campaignId, { 
        isArchived: false,
        updatedAt: new Date().toISOString()
      });
      
      res.json(restoredCampaign);
    } catch (error) {
      console.error("Error restoring campaign:", error);
      res.status(500).json({ message: "Failed to restore campaign" });
    }
  });
  
  // Mark a campaign as complete
  app.post("/api/campaigns/:campaignId/complete", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const campaignId = parseInt(req.params.campaignId);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Only campaign owner can complete
      if (campaign.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to complete this campaign" });
      }
      
      const completedCampaign = await storage.completeCampaign(campaignId);
      
      // TODO: Award XP to all characters involved in this campaign
      
      res.json(completedCampaign);
    } catch (error) {
      console.error("Error completing campaign:", error);
      res.status(500).json({ message: "Failed to complete campaign" });
    }
  });

  // Multi-user Campaign Management API
  
  // Get all participants in a campaign
  app.get("/api/campaigns/:campaignId/participants", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaignId = parseInt(req.params.campaignId);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Check if user is authorized to view this campaign
      const participant = await storage.getCampaignParticipant(campaignId, req.user.id);
      if (!participant && campaign.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to view this campaign's participants" });
      }
      
      const participants = await storage.getCampaignParticipants(campaignId);
      
      // Get character details for each participant
      const participantsWithCharacters = await Promise.all(
        participants.map(async (p) => {
          const character = await storage.getCharacter(p.characterId);
          const user = await storage.getUser(p.userId);
          return {
            ...p,
            character: character,
            username: user ? user.username : 'Unknown',
            displayName: user ? user.displayName : null
          };
        })
      );
      
      // Get NPC companions in this campaign
      const campaignNpcs = await storage.getCampaignNpcs(campaignId);
      
      // Get full NPC data for each campaign NPC
      const npcsWithDetails = await Promise.all(
        campaignNpcs.map(async (campaignNpc) => {
          const npc = await storage.getNpc(campaignNpc.npcId);
          return {
            ...campaignNpc,
            isNpc: true,
            npc: npc,
            // Match the structure of participants for the frontend
            character: {
              id: npc.id,
              name: npc.name,
              race: npc.race,
              class: npc.occupation,
              level: npc.level || 1,
              portraitUrl: npc.portraitUrl
            }
          };
        })
      );
      
      // Combine participants and NPCs
      const allParticipants = [...participantsWithCharacters, ...npcsWithDetails];
      
      res.json(allParticipants);
    } catch (error) {
      console.error("Failed to get campaign participants:", error);
      res.status(500).json({ message: "Failed to get campaign participants" });
    }
  });
  
  // Add a participant to a campaign
  app.post("/api/campaigns/:campaignId/participants", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaignId = parseInt(req.params.campaignId);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Users can either join themselves or the DM can add others
      const targetUserId = req.body.userId || req.user.id;
      
      // If adding someone else, must be campaign owner
      if (targetUserId !== req.user.id && campaign.userId !== req.user.id) {
        return res.status(403).json({ message: "Only the campaign owner can add other participants" });
      }
      
      const participantData = req.body;
      const validationSchema = insertCampaignParticipantSchema.extend({
        userId: z.number(),
        characterId: z.number(),
      });
      
      const validatedData = validationSchema.parse({
        ...participantData,
        campaignId,
        joinedAt: new Date().toISOString()
      });
      
      // Check if user and character exist
      const user = await storage.getUser(validatedData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const character = await storage.getCharacter(validatedData.characterId);
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      
      // Check if participant already exists
      const existingParticipant = await storage.getCampaignParticipant(campaignId, validatedData.userId);
      if (existingParticipant) {
        return res.status(400).json({ message: "User is already a participant in this campaign" });
      }
      
      const participant = await storage.addCampaignParticipant(validatedData);
      
      // Notify via WebSocket
      broadcastMessage('participant_added', {
        campaignId,
        participant: {
          ...participant,
          username: user.username,
          displayName: user.displayName
        }
      });
      
      res.status(201).json(participant);
    } catch (error) {
      console.error("Failed to add campaign participant:", error);
      
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid participant data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to add campaign participant" });
      }
    }
  });
  
  // Remove a participant from a campaign
  app.delete("/api/campaigns/:campaignId/participants/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaignId = parseInt(req.params.campaignId);
      const userId = parseInt(req.params.userId);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Only campaign owner or the participant themselves can remove
      if (campaign.userId !== req.user.id && userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to remove this participant" });
      }
      
      const removed = await storage.removeCampaignParticipant(campaignId, userId);
      
      if (!removed) {
        return res.status(404).json({ message: "Participant not found" });
      }
      
      // Notify via WebSocket
      broadcastMessage('participant_removed', {
        campaignId,
        userId
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to remove campaign participant:", error);
      res.status(500).json({ message: "Failed to remove campaign participant" });
    }
  });
  
  // Turn-based gameplay endpoints
  
  // Get current turn info
  app.get("/api/campaigns/:campaignId/turn", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaignId = parseInt(req.params.campaignId);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Check if user is a participant
      const participant = await storage.getCampaignParticipant(campaignId, req.user.id);
      if (!participant && campaign.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to view this campaign's turn information" });
      }
      
      // If campaign is not turn-based, return error
      if (!campaign.isTurnBased) {
        return res.status(400).json({ message: "This campaign is not turn-based" });
      }
      
      const turnInfo = await storage.getCurrentTurn(campaignId);
      
      if (!turnInfo) {
        return res.json({ active: false });
      }
      
      // Get additional info about the current player
      const currentUser = await storage.getUser(turnInfo.userId);
      const currentParticipant = await storage.getCampaignParticipant(campaignId, turnInfo.userId);
      
      res.json({
        active: true,
        userId: turnInfo.userId,
        username: currentUser ? currentUser.username : 'Unknown',
        displayName: currentUser ? currentUser.displayName : null,
        startedAt: turnInfo.startedAt,
        // Include time remaining if there's a time limit
        timeLimit: campaign.turnTimeLimit,
        isYourTurn: turnInfo.userId === req.user.id
      });
    } catch (error) {
      console.error("Failed to get turn information:", error);
      res.status(500).json({ message: "Failed to get turn information" });
    }
  });
  
  // Start next turn
  app.post("/api/campaigns/:campaignId/turn/next", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaignId = parseInt(req.params.campaignId);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Only campaign owner or current player can end their turn
      const currentTurn = await storage.getCurrentTurn(campaignId);
      if (campaign.userId !== req.user.id && 
          (!currentTurn || currentTurn.userId !== req.user.id)) {
        return res.status(403).json({ message: "Not authorized to change turns" });
      }
      
      // If campaign is not turn-based, return error
      if (!campaign.isTurnBased) {
        return res.status(400).json({ message: "This campaign is not turn-based" });
      }
      
      const nextTurn = await storage.startNextTurn(campaignId);
      
      if (!nextTurn) {
        return res.status(500).json({ message: "Failed to start next turn" });
      }
      
      // Get additional info about the next player
      const nextUser = await storage.getUser(nextTurn.userId);
      
      const turnInfo = {
        userId: nextTurn.userId,
        username: nextUser ? nextUser.username : 'Unknown',
        displayName: nextUser ? nextUser.displayName : null,
        startedAt: nextTurn.startedAt
      };
      
      // Notify via WebSocket
      broadcastMessage('turn_changed', {
        campaignId,
        ...turnInfo
      });
      
      res.json(turnInfo);
    } catch (error) {
      console.error("Failed to start next turn:", error);
      res.status(500).json({ message: "Failed to start next turn" });
    }
  });
  
  // End current turn without starting a new one
  app.post("/api/campaigns/:campaignId/turn/end", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaignId = parseInt(req.params.campaignId);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Only campaign owner or current player can end their turn
      const currentTurn = await storage.getCurrentTurn(campaignId);
      if (campaign.userId !== req.user.id && 
          (!currentTurn || currentTurn.userId !== req.user.id)) {
        return res.status(403).json({ message: "Not authorized to end the current turn" });
      }
      
      // If campaign is not turn-based, return error
      if (!campaign.isTurnBased) {
        return res.status(400).json({ message: "This campaign is not turn-based" });
      }
      
      const success = await storage.endCurrentTurn(campaignId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to end current turn" });
      }
      
      // Notify via WebSocket
      broadcastMessage('turn_ended', {
        campaignId
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to end current turn:", error);
      res.status(500).json({ message: "Failed to end current turn" });
    }
  });
  
  // Convert a campaign to turn-based or back to real-time
  // NPC Companions API Routes
  
  // Get all NPCs
  app.get("/api/npcs", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const npcs = await storage.getAllNpcs();
      res.json(npcs);
    } catch (error) {
      console.error("Failed to fetch NPCs:", error);
      res.status(500).json({ message: "Failed to fetch NPCs" });
    }
  });
  
  // Get NPCs belonging to a user
  app.get("/api/npcs/user", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user.id;
      const npcs = await storage.getUserNpcs(userId);
      res.json(npcs);
    } catch (error) {
      console.error("Failed to fetch user NPCs:", error);
      res.status(500).json({ message: "Failed to fetch user NPCs" });
    }
  });
  
  // Get NPC companions belonging to a user
  app.get("/api/npcs/companions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user.id;
      const companionNpcs = await storage.getCompanionNpcs(userId);
      res.json(companionNpcs);
    } catch (error) {
      console.error("Failed to fetch companion NPCs:", error);
      res.status(500).json({ message: "Failed to fetch companion NPCs" });
    }
  });
  
  // Get stock (pre-made) companion NPCs
  app.get("/api/npcs/stock-companions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Set content-type explicitly to application/json
      res.setHeader('Content-Type', 'application/json');
      
      // Return hardcoded stock companions (this ensures they are always available)
      const stockCompanions = [
        {
          id: 1001,
          name: "Grimshaw the Guardian",
          race: "Half-Orc",
          class: "Barbarian",
          occupation: "Barbarian",
          level: 5,
          isStockCompanion: true,
          strength: 18,
          dexterity: 12,
          constitution: 16,
          intelligence: 8,
          wisdom: 10,
          charisma: 11,
          hitPoints: 55,
          maxHitPoints: 55,
          armorClass: 14,
          portraitUrl: "/images/companions/grimshaw.jpg",
          appearance: "Grimshaw towers over most at nearly seven feet tall, with grayish-green skin and prominent tusks. Battle scars crisscross his muscular frame, each telling a story of survival.",
          personality: "Stoic and honorable, Grimshaw speaks little but observes much. His loyalty, once earned, is unshakable.",
          motivation: "To protect those who cannot protect themselves and to prove that half-orcs can be more than the savage stereotypes many believe.",
          backstory: "Once an outcast from both human and orc societies, Grimshaw found purpose as a guardian of travelers through dangerous lands. After saving a merchant caravan from bandits, his reputation grew, and he now serves as a bodyguard and companion to adventurers."
        },
        {
          id: 1002,
          name: "Lyra Moonwhisper",
          race: "Elf",
          class: "Ranger",
          occupation: "Ranger",
          level: 4,
          isStockCompanion: true,
          strength: 12,
          dexterity: 18,
          constitution: 10,
          intelligence: 14,
          wisdom: 16,
          charisma: 13,
          hitPoints: 35,
          maxHitPoints: 35,
          armorClass: 15,
          portraitUrl: "/images/companions/lyra.jpg",
          appearance: "Tall and lithe with silver hair and amber eyes that seem to glow in dim light. Her movements are graceful and silent.",
          personality: "Perceptive and calm, with a dry sense of humor that emerges once she trusts someone.",
          motivation: "To protect the balance of nature and uncover ancient elven knowledge lost to time.",
          backstory: "Raised deep in the forests of Sylverwood, Lyra trained from childhood as a guardian of the sacred groves. When blight began affecting her homeland, she set out to find its source and a cure."
        },
        {
          id: 1003,
          name: "Thordin Stoneheart",
          race: "Dwarf",
          class: "Cleric",
          occupation: "Cleric",
          level: 3,
          isStockCompanion: true,
          strength: 14,
          dexterity: 8,
          constitution: 16,
          intelligence: 10,
          wisdom: 18,
          charisma: 12,
          hitPoints: 29,
          maxHitPoints: 29,
          armorClass: 18,
          portraitUrl: "/images/companions/thordin.jpg",
          appearance: "Broad-shouldered with a copper-colored beard braided with metal trinkets. His hands are calloused from forge work and healing alike.",
          personality: "Gruff but kind-hearted, always ready with practical advice or a healing spell.",
          motivation: "To honor the forge gods by creating items of power and using divine magic to protect others.",
          backstory: "Third son of a renowned dwarven smith, Thordin found his calling in the temple rather than the forge. He now travels to spread the blessings of his deity and to find worthy recipients for his divinely-crafted items."
        }
      ];
      
      res.json(stockCompanions);
    } catch (error) {
      console.error("Failed to fetch stock companion NPCs:", error);
      res.status(500).json({ message: "Failed to fetch stock companion NPCs" });
    }
  });
  
  // Get a specific NPC by ID
  app.get("/api/npcs/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      const npc = await storage.getNpc(id);
      
      if (!npc) {
        return res.status(404).json({ message: "NPC not found" });
      }
      
      res.json(npc);
    } catch (error) {
      console.error("Failed to fetch NPC:", error);
      res.status(500).json({ message: "Failed to fetch NPC" });
    }
  });
  
  // Create a new NPC
  app.post("/api/npcs", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const npcData = insertNpcSchema.parse({
        ...req.body,
        createdBy: req.user.id,
        createdAt: new Date().toISOString()
      });
      
      const npc = await storage.createNpc(npcData);
      res.status(201).json(npc);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid NPC data", errors: error.errors });
      } else {
        console.error("Failed to create NPC:", error);
        res.status(500).json({ message: "Failed to create NPC" });
      }
    }
  });
  
  // Update an NPC
  app.put("/api/npcs/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      const npc = await storage.getNpc(id);
      
      if (!npc) {
        return res.status(404).json({ message: "NPC not found" });
      }
      
      // Make sure the user can only update their own NPCs
      if (npc.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this NPC" });
      }
      
      const updatedNpc = await storage.updateNpc(id, {
        ...req.body,
        updatedAt: new Date().toISOString()
      });
      
      res.json(updatedNpc);
    } catch (error) {
      console.error("Failed to update NPC:", error);
      res.status(500).json({ message: "Failed to update NPC" });
    }
  });
  
  // Delete an NPC
  app.delete("/api/npcs/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const id = parseInt(req.params.id);
      const npc = await storage.getNpc(id);
      
      if (!npc) {
        return res.status(404).json({ message: "NPC not found" });
      }
      
      // Make sure the user can only delete their own NPCs
      if (npc.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to delete this NPC" });
      }
      
      const deleted = await storage.deleteNpc(id);
      
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete NPC" });
      }
    } catch (error) {
      console.error("Failed to delete NPC:", error);
      res.status(500).json({ message: "Failed to delete NPC" });
    }
  });
  
  // Campaign NPC Routes
  
  // Get NPCs in a campaign
  app.get("/api/campaigns/:campaignId/npcs", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const campaignId = parseInt(req.params.campaignId);
      
      // Get the campaign to check authorization
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Check if user is a participant in this campaign
      const participants = await storage.getCampaignParticipants(campaignId);
      const isParticipant = participants.some(p => p.userId === req.user.id) || campaign.userId === req.user.id;
      
      if (!isParticipant) {
        return res.status(403).json({ message: "Not authorized to view NPCs in this campaign" });
      }
      
      const campaignNpcs = await storage.getCampaignNpcs(campaignId);
      
      // Get full NPC data for each campaign NPC
      const npcsWithDetails = await Promise.all(
        campaignNpcs.map(async (campaignNpc) => {
          const npc = await storage.getNpc(campaignNpc.npcId);
          return {
            ...campaignNpc,
            npc
          };
        })
      );
      
      res.json(npcsWithDetails);
    } catch (error) {
      console.error("Failed to fetch campaign NPCs:", error);
      res.status(500).json({ message: "Failed to fetch campaign NPCs" });
    }
  });
  
  // Add an NPC to a campaign
  app.post("/api/campaigns/:campaignId/npcs", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const campaignId = parseInt(req.params.campaignId);
      
      // Get the campaign to check authorization
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Only DM can add NPCs to the campaign
      if (campaign.userId !== req.user.id) {
        return res.status(403).json({ message: "Only the DM can add NPCs to this campaign" });
      }
      
      // Get the NPC to check if it exists and belongs to the user
      const npcId = req.body.npcId;
      const npc = await storage.getNpc(npcId);
      
      if (!npc) {
        return res.status(404).json({ message: "NPC not found" });
      }
      
      // Check if NPC is already in the campaign
      const existingCampaignNpc = await storage.getCampaignNpc(campaignId, npcId);
      if (existingCampaignNpc) {
        return res.status(400).json({ message: "NPC is already in this campaign" });
      }
      
      const campaignNpcData = insertCampaignNpcSchema.parse({
        campaignId,
        npcId,
        role: req.body.role || 'companion',
        turnOrder: req.body.turnOrder,
        isActive: true,
        joinedAt: new Date().toISOString()
      });
      
      const campaignNpc = await storage.addNpcToCampaign(campaignNpcData);
      
      // Get full NPC data to return
      const npcWithDetails = {
        ...campaignNpc,
        npc
      };
      
      res.status(201).json(npcWithDetails);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid campaign NPC data", errors: error.errors });
      } else {
        console.error("Failed to add NPC to campaign:", error);
        res.status(500).json({ message: "Failed to add NPC to campaign" });
      }
    }
  });
  
  // Remove an NPC from a campaign
  app.delete("/api/campaigns/:campaignId/npcs/:npcId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const campaignId = parseInt(req.params.campaignId);
      const npcId = parseInt(req.params.npcId);
      
      // Get the campaign to check authorization
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Only DM can remove NPCs from the campaign
      if (campaign.userId !== req.user.id) {
        return res.status(403).json({ message: "Only the DM can remove NPCs from this campaign" });
      }
      
      const removed = await storage.removeNpcFromCampaign(campaignId, npcId);
      
      if (removed) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "NPC not found in this campaign" });
      }
    } catch (error) {
      console.error("Failed to remove NPC from campaign:", error);
      res.status(500).json({ message: "Failed to remove NPC from campaign" });
    }
  });
  
  // Simulate NPC turn in a campaign
  app.post("/api/campaigns/:campaignId/npcs/:npcId/simulate-turn", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const campaignId = parseInt(req.params.campaignId);
      const npcId = parseInt(req.params.npcId);
      
      // Get the campaign to check authorization
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Only DM can simulate NPC turns
      if (campaign.userId !== req.user.id) {
        return res.status(403).json({ message: "Only the DM can simulate NPC turns" });
      }
      
      // Check if NPC is in the campaign
      const campaignNpc = await storage.getCampaignNpc(campaignId, npcId);
      if (!campaignNpc) {
        return res.status(404).json({ message: "NPC not found in this campaign" });
      }
      
      // Simulate the NPC's turn
      const turnResult = await storage.simulateNpcTurn(campaignId, npcId);
      
      // Broadcast the turn action to all connected clients via WebSocket
      broadcastMessage('npc_action', {
        campaignId,
        npcId,
        action: turnResult.action,
        details: turnResult.details,
        message: turnResult.message
      });
      
      res.json(turnResult);
    } catch (error) {
      console.error("Failed to simulate NPC turn:", error);
      res.status(500).json({ message: "Failed to simulate NPC turn" });
    }
  });

  app.patch("/api/campaigns/:campaignId/turn-based", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const campaignId = parseInt(req.params.campaignId);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Only campaign owner can change turn-based settings
      if (campaign.userId !== req.user.id) {
        return res.status(403).json({ message: "Only the campaign owner can change turn-based settings" });
      }
      
      const { isTurnBased, turnTimeLimit } = req.body;
      
      // Update campaign settings
      const updatedCampaign = await storage.updateCampaign(campaignId, {
        isTurnBased: isTurnBased === true,
        turnTimeLimit: turnTimeLimit || null
      });
      
      if (!updatedCampaign) {
        return res.status(500).json({ message: "Failed to update campaign settings" });
      }
      
      // If turning on turn-based mode, we may want to set the initial turn
      if (isTurnBased && !campaign.isTurnBased) {
        // Start with the campaign owner's turn
        await storage.updateCampaign(campaignId, {
          currentTurnUserId: campaign.userId,
          turnStartedAt: new Date().toISOString()
        });
      }
      
      // If turning off turn-based mode, clear any active turns
      if (!isTurnBased && campaign.isTurnBased) {
        await storage.endCurrentTurn(campaignId);
      }
      
      // Notify via WebSocket
      broadcastMessage('turn_based_changed', {
        campaignId,
        isTurnBased: isTurnBased === true,
        turnTimeLimit: turnTimeLimit || null
      });
      
      res.json(updatedCampaign);
    } catch (error) {
      console.error("Failed to update turn-based settings:", error);
      res.status(500).json({ message: "Failed to update turn-based settings" });
    }
  });
  
  // User Statistics API Endpoint
  // Get all users (for selection in invitations, etc.)
  app.get("/api/users", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Return a list of users with limited fields for security
      const usersList = await db.select({
        id: users.id,
        username: users.username,
        displayName: users.displayName
      }).from(users);
      
      res.json(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/user-stats", async (req, res) => {
    try {
      // Count total registered users
      const totalUsers = await db.select({ count: sql`COUNT(*)` }).from(users);
      const totalRegistered = totalUsers[0]?.count || 0;
      
      // Calculate online users based on active WebSocket connections
      // Each client may have multiple connections, so count unique IPs
      const activeConnections = new Set();
      wss.clients.forEach((client) => {
        if (client.readyState === 1) { // 1 = OPEN state
          // Get a unique identifier (use socket properties or default to unknown)
          const clientId = (client as any)._socket?.remoteAddress || 'unknown';
          activeConnections.add(clientId);
        }
      });
      
      // Return the stats
      res.json({
        totalRegistered: Number(totalRegistered),
        onlineUsers: activeConnections.size
      });
    } catch (error) {
      console.error("Failed to fetch user statistics:", error);
      res.status(500).json({ message: "Failed to fetch user statistics" });
    }
  });
  
  // Campaign Invitation routes
  app.post("/api/campaigns/:campaignId/invitations", async (req, res) => {
    try {
      // Authentication check
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const campaignId = parseInt(req.params.campaignId);
      
      // Get the campaign to check authorization
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Only campaign owner can create invitations
      if (campaign.userId !== req.user.id) {
        return res.status(403).json({ message: "Only the DM can create invitations" });
      }
      
      // Create invitation with createdBy field
      const invitationData = {
        ...req.body,
        campaignId,
        createdBy: req.user.id,
        createdAt: new Date().toISOString()
      };
      
      // Generate random invite code if not provided
      if (!invitationData.inviteCode) {
        invitationData.inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      }
      
      // Validate with Zod schema
      const validatedData = insertCampaignInvitationSchema.parse(invitationData);
      
      // Create the invitation
      const invitation = await storage.createCampaignInvitation(validatedData);
      
      res.status(201).json(invitation);
    } catch (error) {
      console.error("Failed to create invitation:", error);
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });
  
  app.get("/api/campaigns/:campaignId/invitations", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const campaignId = parseInt(req.params.campaignId);
      
      // Get the campaign to check authorization
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Only campaign owner can view all invitations
      if (campaign.userId !== req.user.id) {
        return res.status(403).json({ message: "Only the DM can view all invitations" });
      }
      
      const invitations = await storage.getCampaignInvitations(campaignId);
      res.json(invitations);
    } catch (error) {
      console.error("Failed to fetch invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });
  
  app.get("/api/invitations/:code", async (req, res) => {
    try {
      const code = req.params.code;
      const invitation = await storage.getCampaignInvitationByCode(code);
      
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      // Get campaign data to return with the invitation
      const campaign = await storage.getCampaign(invitation.campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      res.json({
        invitation,
        campaign: {
          id: campaign.id,
          title: campaign.title,
          description: campaign.description,
          difficulty: campaign.difficulty
        }
      });
    } catch (error) {
      console.error("Failed to fetch invitation:", error);
      res.status(500).json({ message: "Failed to fetch invitation" });
    }
  });
  
  app.post("/api/invitations/:code/accept", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const code = req.params.code;
      const characterId = req.body.characterId;
      
      if (!characterId) {
        return res.status(400).json({ message: "Character ID is required" });
      }
      
      // Get the invitation
      const invitation = await storage.getCampaignInvitationByCode(code);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found or expired" });
      }
      
      // Check if invitation is still valid
      if (invitation.status !== 'pending') {
        return res.status(400).json({ message: `Invitation is ${invitation.status}` });
      }
      
      // Use the invitation (this increments the use count)
      const updatedInvitation = await storage.useInvitation(code);
      if (!updatedInvitation) {
        return res.status(400).json({ message: "Failed to use invitation" });
      }
      
      // Add user as campaign participant
      const participant = await storage.addCampaignParticipant({
        campaignId: invitation.campaignId,
        userId: req.user.id,
        characterId,
        role: invitation.role,
        permissions: 'standard',
        joinedAt: new Date().toISOString()
      });
      
      // Broadcast to connected clients about new participant
      broadcastMessage('participant_joined', {
        campaignId: invitation.campaignId,
        userId: req.user.id,
        role: invitation.role
      });
      
      res.json({
        success: true,
        participant,
        message: "Successfully joined campaign"
      });
    } catch (error) {
      console.error("Failed to accept invitation:", error);
      res.status(500).json({ message: "Failed to accept invitation" });
    }
  });
  
  app.delete("/api/campaigns/:campaignId/invitations/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const campaignId = parseInt(req.params.campaignId);
      const invitationId = parseInt(req.params.id);
      
      // Get the campaign to check authorization
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Only campaign owner can delete invitations
      if (campaign.userId !== req.user.id) {
        return res.status(403).json({ message: "Only the DM can delete invitations" });
      }
      
      const result = await storage.deleteCampaignInvitation(invitationId);
      if (!result) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete invitation:", error);
      res.status(500).json({ message: "Failed to delete invitation" });
    }
  });
  
  // DM Notes routes
  app.post("/api/campaigns/:campaignId/notes", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const campaignId = parseInt(req.params.campaignId);
      
      // Get the campaign to check authorization
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Check if the user is the DM
      if (campaign.userId !== req.user.id) {
        // Check if user is a participant with appropriate permissions
        const participant = await storage.getCampaignParticipant(campaignId, req.user.id);
        if (!participant || (participant.role !== 'co-dm' && participant.permissions !== 'editor')) {
          return res.status(403).json({ message: "You don't have permission to create notes" });
        }
      }
      
      const noteData = {
        ...req.body,
        campaignId,
        createdBy: req.user.id,
        createdAt: new Date().toISOString()
      };
      
      // Validate with schema
      const validatedData = insertDmNoteSchema.parse(noteData);
      
      // Create the note
      const note = await storage.createDmNote(validatedData);
      
      res.status(201).json(note);
    } catch (error) {
      console.error("Failed to create note:", error);
      res.status(500).json({ message: "Failed to create note" });
    }
  });
  
  app.get("/api/campaigns/:campaignId/notes", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const campaignId = parseInt(req.params.campaignId);
      
      // Get the campaign to check authorization
      const campaign = await storage.getCampaign(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Check if user is the DM or a participant
      const isOwner = campaign.userId === req.user.id;
      if (!isOwner) {
        const participant = await storage.getCampaignParticipant(campaignId, req.user.id);
        if (!participant) {
          return res.status(403).json({ message: "You are not a participant in this campaign" });
        }
      }
      
      // Fetch the notes for this user
      const notes = await storage.getDmNotes(campaignId, req.user.id);
      
      // If the user is the DM, also get notes with isPrivate=false from other participants
      if (isOwner) {
        // This would be a more complex query in a real implementation
        // For now, omit fetching shared notes from other participants
      }
      
      res.json(notes);
    } catch (error) {
      console.error("Failed to fetch notes:", error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });
  
  app.get("/api/campaigns/:campaignId/notes/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const campaignId = parseInt(req.params.campaignId);
      const noteId = parseInt(req.params.id);
      
      // Get the note
      const note = await storage.getDmNote(noteId);
      if (!note || note.campaignId !== campaignId) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      // Check permission - must be the note creator unless it's shared and user is a participant
      const isCreator = note.createdBy === req.user.id;
      if (!isCreator) {
        if (note.isPrivate) {
          return res.status(403).json({ message: "You don't have permission to view this note" });
        }
        
        // If note is shared, user must be a participant or DM
        const campaign = await storage.getCampaign(campaignId);
        const isDM = campaign && campaign.userId === req.user.id;
        if (!isDM) {
          const participant = await storage.getCampaignParticipant(campaignId, req.user.id);
          if (!participant) {
            return res.status(403).json({ message: "You are not a participant in this campaign" });
          }
        }
      }
      
      res.json(note);
    } catch (error) {
      console.error("Failed to fetch note:", error);
      res.status(500).json({ message: "Failed to fetch note" });
    }
  });
  
  app.put("/api/campaigns/:campaignId/notes/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const campaignId = parseInt(req.params.campaignId);
      const noteId = parseInt(req.params.id);
      
      // Get the note
      const note = await storage.getDmNote(noteId);
      if (!note || note.campaignId !== campaignId) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      // Only the creator can edit the note
      if (note.createdBy !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to edit this note" });
      }
      
      // Update the note
      const updatedNote = await storage.updateDmNote(noteId, {
        ...req.body,
        updatedAt: new Date().toISOString()
      });
      
      res.json(updatedNote);
    } catch (error) {
      console.error("Failed to update note:", error);
      res.status(500).json({ message: "Failed to update note" });
    }
  });
  
  app.delete("/api/campaigns/:campaignId/notes/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const campaignId = parseInt(req.params.campaignId);
      const noteId = parseInt(req.params.id);
      
      // Get the note
      const note = await storage.getDmNote(noteId);
      if (!note || note.campaignId !== campaignId) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      // Only the creator can delete the note
      if (note.createdBy !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this note" });
      }
      
      // Delete the note
      const result = await storage.deleteDmNote(noteId);
      if (!result) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete note:", error);
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  return httpServer;
}
