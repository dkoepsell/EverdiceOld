import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";

// Setup all application routes
export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // Set up WebSocket server for real-time communication
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Setup simple item and inventory routes for demonstration
  
  // Get all items
  app.get('/api/items', async (req: Request, res: Response) => {
    try {
      const items = await storage.getAllItems();
      res.json(items);
    } catch (error) {
      console.error('Error fetching items:', error);
      res.status(500).send('Error fetching items');
    }
  });
  
  // Get specific item
  app.get('/api/items/:id', async (req: Request, res: Response) => {
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
  
  // Get character's inventory
  app.get('/api/characters/:characterId/inventory', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send('Unauthorized');
    
    try {
      const characterId = parseInt(req.params.characterId);
      const character = await storage.getCharacter(characterId);
      
      if (!character) {
        return res.status(404).send('Character not found');
      }
      
      // Direct database query to get character inventory with item details
      const inventory = await storage.getCharacterInventory(characterId);
      res.json(inventory);
    } catch (error) {
      console.error('Error fetching character inventory:', error);
      res.status(500).send('Error fetching character inventory');
    }
  });
  
  // Get character's currency
  app.get('/api/characters/:characterId/currency', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send('Unauthorized');
    
    try {
      const characterId = parseInt(req.params.characterId);
      const character = await storage.getCharacter(characterId);
      
      if (!character) {
        return res.status(404).send('Character not found');
      }
      
      // Return the currency from character
      res.json({
        goldCoins: character.goldCoins || 0,
        silverCoins: character.silverCoins || 0,
        copperCoins: character.copperCoins || 0
      });
    } catch (error) {
      console.error('Error fetching character currency:', error);
      res.status(500).send('Error fetching character currency');
    }
  });
  
  // WebSocket connection handler
  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        console.log('Received message:', data);
        
        // Handle different message types
        if (data.type === 'roll_dice') {
          // Process dice roll
          const result = Math.floor(Math.random() * data.sides) + 1;
          
          // Broadcast the roll to all clients
          broadcastMessage('dice_rolled', {
            userId: data.userId,
            characterId: data.characterId,
            diceType: `d${data.sides}`,
            result: result,
            modifier: data.modifier || 0,
            total: result + (data.modifier || 0)
          });
        }
        
        // Item reward message handling
        if (data.type === 'reward_item') {
          handleItemReward(data);
        }
        
        // Currency reward message handling
        if (data.type === 'reward_currency') {
          handleCurrencyReward(data);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });
  
  // Broadcast message to all connected clients
  function broadcastMessage(type: string, payload: any) {
    const messageStr = JSON.stringify({ type, payload });
    
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }
  
  // Handle item rewards
  async function handleItemReward(data: any) {
    try {
      const { characterId, itemId, quantity = 1, reason = 'quest_reward' } = data;
      
      // Add item to character inventory
      await storage.addItemToCharacter({
        characterId,
        itemId,
        quantity,
        isEquipped: false,
        acquiredFrom: reason,
        notes: data.notes || 'Reward from adventure',
        acquiredAt: new Date().toISOString()
      });
      
      // Broadcast the reward
      broadcastMessage('item_rewarded', {
        characterId,
        itemId,
        quantity,
        reason
      });
      
      console.log(`Item ${itemId} added to character ${characterId}`);
    } catch (error) {
      console.error('Error handling item reward:', error);
    }
  }
  
  // Handle currency rewards
  async function handleCurrencyReward(data: any) {
    try {
      const { characterId, gold = 0, silver = 0, copper = 0, reason = 'quest_reward' } = data;
      
      // Get current character data
      const character = await storage.getCharacter(characterId);
      if (!character) return;
      
      // Update character currency
      await storage.updateCharacterCurrency(characterId, {
        goldCoins: (character.goldCoins || 0) + gold,
        silverCoins: (character.silverCoins || 0) + silver,
        copperCoins: (character.copperCoins || 0) + copper
      });
      
      // Calculate total copper value for transaction
      const totalCopper = (gold * 10000) + (silver * 100) + copper;
      
      // Record transaction
      await storage.addCurrencyTransaction({
        characterId,
        amount: totalCopper,
        reason,
        referenceType: data.referenceType || reason,
        createdAt: new Date().toISOString()
      });
      
      // Broadcast the reward
      broadcastMessage('currency_rewarded', {
        characterId,
        gold,
        silver,
        copper,
        reason
      });
      
      console.log(`Currency added to character ${characterId}: ${gold}g, ${silver}s, ${copper}c`);
    } catch (error) {
      console.error('Error handling currency reward:', error);
    }
  }
  
  return httpServer;
}