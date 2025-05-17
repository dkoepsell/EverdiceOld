import type { Express, Request, Response } from "express";
import { storage } from "./storage";

// Setup inventory and item routes
export function setupInventoryRoutes(app: Express) {
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
      
      // Only character owner or admin can view inventory
      if (character.userId !== req.user!.id && req.user!.id !== 2) { // Admin ID is 2
        return res.status(403).send('Not authorized to view this character');
      }
      
      const inventory = await storage.getCharacterInventory(characterId);
      res.json(inventory);
    } catch (error) {
      console.error('Error fetching character inventory:', error);
      res.status(500).send('Error fetching character inventory');
    }
  });
  
  // Add item to character (for DMs only)
  app.post('/api/characters/:characterId/inventory', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send('Unauthorized');
    
    try {
      const characterId = parseInt(req.params.characterId);
      const character = await storage.getCharacter(characterId);
      
      if (!character) {
        return res.status(404).send('Character not found');
      }
      
      // Only allow DMs (admin) to add items
      if (req.user!.id !== 2) {
        return res.status(403).send('Only DMs can add items to characters');
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
        acquiredFrom,
        acquiredAt: new Date().toISOString()
      });
      
      res.status(201).json(characterItem);
    } catch (error) {
      console.error('Error adding item to character:', error);
      res.status(500).send('Error adding item to character');
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
      
      // Only character owner or admin can view currency
      if (character.userId !== req.user!.id && req.user!.id !== 2) {
        return res.status(403).send('Not authorized to view this character');
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
  
  // Update character's currency (for DMs only)
  app.post('/api/characters/:characterId/currency', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send('Unauthorized');
    
    try {
      const characterId = parseInt(req.params.characterId);
      const character = await storage.getCharacter(characterId);
      
      if (!character) {
        return res.status(404).send('Character not found');
      }
      
      // Only allow DMs (admin) to add currency
      if (req.user!.id !== 2) {
        return res.status(403).send('Only DMs can add currency to characters');
      }
      
      const { gold = 0, silver = 0, copper = 0, reason = "dm_reward" } = req.body;
      
      // Calculate total change in copper for the transaction log
      const copperValue = (gold * 10000) + (silver * 100) + copper;
      
      // Update character currency
      const updatedCharacter = await storage.updateCharacterCurrency(characterId, {
        goldCoins: (character.goldCoins || 0) + gold,
        silverCoins: (character.silverCoins || 0) + silver,
        copperCoins: (character.copperCoins || 0) + copper
      });
      
      // Log the transaction
      await storage.addCurrencyTransaction({
        characterId,
        amount: copperValue,
        reason,
        referenceType: "dm_reward",
        createdAt: new Date().toISOString()
      });
      
      res.json({
        goldCoins: updatedCharacter.goldCoins || 0,
        silverCoins: updatedCharacter.silverCoins || 0,
        copperCoins: updatedCharacter.copperCoins || 0
      });
    } catch (error) {
      console.error('Error updating character currency:', error);
      res.status(500).send('Error updating character currency');
    }
  });
  
  // Get character's currency transaction history
  app.get('/api/characters/:characterId/currency/history', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send('Unauthorized');
    
    try {
      const characterId = parseInt(req.params.characterId);
      const character = await storage.getCharacter(characterId);
      
      if (!character) {
        return res.status(404).send('Character not found');
      }
      
      // Only character owner or admin can view currency history
      if (character.userId !== req.user!.id && req.user!.id !== 2) {
        return res.status(403).send('Not authorized to view this character');
      }
      
      const transactions = await storage.getCharacterCurrencyTransactions(characterId);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching currency history:', error);
      res.status(500).send('Error fetching currency history');
    }
  });
}