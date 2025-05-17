import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./fixed-routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage, DatabaseStorage } from "./storage";
import simpleApi from "./simple-api.js";
import characterApi from "./character-api.js";
import directApi from "./direct-api.js";
import { setupAuth } from "./auth";
import { pool } from "./db";

// We'll set up inventory API routes directly in this file

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set up auth middleware
setupAuth(app);

// Register our new character API routes
app.use('/api', characterApi);

// Register our direct API routes for reliable character data access
app.use('/api', directApi);

// Direct inventory and character data routes
app.get('/api/characters/:characterId/inventory', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const characterId = parseInt(req.params.characterId);
    const userId = req.user.id;
    
    // First check if character belongs to user
    const characterQuery = await pool.query(
      'SELECT * FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );
    
    if (characterQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    // Get character items with item details
    const inventoryQuery = await pool.query(
      `SELECT ci.*, i.* 
       FROM character_items ci
       JOIN items i ON ci.item_id = i.id
       WHERE ci.character_id = $1`,
      [characterId]
    );
    
    // Format inventory items as needed by frontend
    const inventory = inventoryQuery.rows.map(row => ({
      characterItem: {
        id: row.id,
        characterId: row.character_id,
        itemId: row.item_id,
        quantity: row.quantity,
        isEquipped: row.is_equipped,
        notes: row.notes,
        acquiredAt: row.acquired_at,
        acquiredFrom: row.acquired_from,
        updatedAt: row.updated_at
      },
      item: {
        id: row.id,
        name: row.name,
        description: row.description,
        type: row.type,
        rarity: row.rarity,
        value: row.value,
        properties: row.properties,
        requiredLevel: row.required_level,
        equipSlot: row.equip_slot,
        isConsumable: row.is_consumable,
        weight: row.weight,
        imageUrl: row.image_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    }));
    
    res.json(inventory);
  } catch (error) {
    console.error('Error fetching character inventory:', error);
    res.status(500).json({ error: 'Failed to fetch character inventory' });
  }
});

// Get all characters for the authenticated user
app.get('/api/characters', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userId = req.user.id;
    
    // Get characters belonging to the user
    const charactersQuery = await pool.query(
      'SELECT * FROM characters WHERE user_id = $1',
      [userId]
    );
    
    res.json(charactersQuery.rows);
  } catch (error) {
    console.error('Error fetching characters:', error);
    res.status(500).json({ error: 'Failed to fetch characters' });
  }
});

// Get campaign participants
app.get('/api/campaigns/:campaignId/participants', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { campaignId } = req.params;
    
    // Get all participants with character info
    const participantsQuery = await pool.query(
      `SELECT 
        cp.id, cp.campaign_id, cp.user_id, cp.character_id, cp.role, cp.turn_order, 
        cp.is_active, cp.joined_at, cp.last_active_at,
        u.username, u.display_name,
        c.name, c.race, c.class, c.level, c.background, c.alignment, c.portrait_url
      FROM campaign_participants cp
      JOIN users u ON cp.user_id = u.id
      JOIN characters c ON cp.character_id = c.id
      WHERE cp.campaign_id = $1`,
      [campaignId]
    );
    
    // Format the participants data to match client expectations
    const participants = participantsQuery.rows.map(p => ({
      id: p.id,
      campaignId: parseInt(campaignId),
      userId: p.user_id,
      characterId: p.character_id,
      role: p.role,
      turnOrder: p.turn_order,
      isActive: p.is_active,
      joinedAt: p.joined_at,
      lastActiveAt: p.last_active_at,
      username: p.username,
      displayName: p.display_name,
      character: {
        id: p.character_id,
        name: p.name,
        race: p.race,
        class: p.class,
        level: p.level,
        background: p.background,
        alignment: p.alignment,
        portraitUrl: p.portrait_url
      }
    }));
    
    res.json(participants);
  } catch (error) {
    console.error('Error fetching campaign participants:', error);
    res.status(500).json({ error: 'Failed to fetch campaign participants' });
  }
});

// Get registered users count and online users count
app.get('/api/stats/users', async (req: Request, res: Response) => {
  try {
    // Count total registered users
    const totalUsersQuery = await pool.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(totalUsersQuery.rows[0].count);
    
    // Count currently online users (those who have been active in the last 15 minutes)
    const fifteenMinutesAgo = new Date();
    fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);
    
    const onlineUsersQuery = await pool.query(
      `SELECT COUNT(*) as count FROM users 
       WHERE last_active_at > $1`,
      [fifteenMinutesAgo.toISOString()]
    );
    
    const onlineUsers = parseInt(onlineUsersQuery.rows[0]?.count || '0');
    
    res.json({
      registeredUsers: totalUsers,
      onlineUsers: onlineUsers
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// Add a participant to a campaign
app.post('/api/campaigns/:campaignId/participants', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { campaignId } = req.params;
    const { characterId } = req.body;
    const userId = req.user.id;
    
    if (!characterId) {
      return res.status(400).json({ error: 'Character ID is required' });
    }
    
    // Check if campaign exists
    const campaignQuery = await pool.query(
      'SELECT * FROM campaigns WHERE id = $1',
      [campaignId]
    );
    
    if (campaignQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Check if character exists and belongs to the user
    const characterQuery = await pool.query(
      'SELECT * FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );
    
    if (characterQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found or does not belong to you' });
    }
    
    // Check if participant already exists in campaign
    const participantQuery = await pool.query(
      'SELECT * FROM campaign_participants WHERE campaign_id = $1 AND user_id = $2',
      [campaignId, userId]
    );
    
    if (participantQuery.rows.length > 0) {
      // If participant exists, return the expected error
      return res.status(400).json({ error: 'You are already a participant in this campaign' });
    }
    
    // Add participant to campaign
    const insertResult = await pool.query(
      'INSERT INTO campaign_participants (campaign_id, user_id, character_id, joined_at) VALUES ($1, $2, $3, $4) RETURNING *',
      [campaignId, userId, characterId, new Date().toISOString()]
    );
    
    // Update the campaign's characters array to include this character
    await pool.query(
      'UPDATE campaigns SET characters = array_append(characters, $1) WHERE id = $2',
      [characterId, campaignId]
    );
    
    res.status(201).json(insertResult.rows[0]);
  } catch (error) {
    console.error('Error adding participant to campaign:', error);
    res.status(500).json({ error: 'Failed to add participant to campaign' });
  }
});

// Get all campaigns for the authenticated user
app.get('/api/campaigns', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userId = req.user.id;
    
    // Get campaigns where user is a participant or DM
    const campaignsQuery = await pool.query(
      `SELECT c.* 
       FROM campaigns c
       LEFT JOIN campaign_participants cp ON c.id = cp.campaign_id
       WHERE (c.user_id = $1 OR cp.user_id = $1)
       AND c.is_archived = false
       AND c.is_completed = false`,
      [userId]
    );
    
    res.json(campaignsQuery.rows);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Get archived campaigns for the authenticated user
app.get('/api/campaigns/archived', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userId = req.user.id;
    
    // Get archived campaigns where user is a participant or DM
    const campaignsQuery = await pool.query(
      `SELECT c.* 
       FROM campaigns c
       LEFT JOIN campaign_participants cp ON c.id = cp.campaign_id
       WHERE (c.user_id = $1 OR cp.user_id = $1)
       AND (c.is_archived = true OR c.is_completed = true)`,
      [userId]
    );
    
    res.json(campaignsQuery.rows);
  } catch (error) {
    console.error('Error fetching archived campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch archived campaigns' });
  }
});

app.get('/api/characters/:characterId/currency', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const characterId = parseInt(req.params.characterId);
    const userId = req.user.id;
    
    // Check if character belongs to user
    const characterQuery = await pool.query(
      'SELECT gold_coins, silver_coins, copper_coins FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );
    
    if (characterQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    const character = characterQuery.rows[0];
    
    // Format currency for frontend
    res.json({
      gold: character.gold_coins || 0,
      silver: character.silver_coins || 0,
      copper: character.copper_coins || 0
    });
  } catch (error) {
    console.error('Error fetching character currency:', error);
    res.status(500).json({ error: 'Failed to fetch character currency' });
  }
});

// Register our simple API routes
app.use('/api', simpleApi);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize database with sample data if needed
  if (storage instanceof DatabaseStorage) {
    try {
      await storage.initializeSampleData();
      log('Sample data initialization completed successfully');
    } catch (error) {
      console.error('Error initializing sample data:', error);
    }
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
