// Inventory routes for character items and currency
import express from 'express';
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { characters, characterItems, items, currencyTransactions } from "@shared/schema";

const router = express.Router();

// Helper function to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
};

// Helper function to verify character ownership
const verifyCharacterOwnership = async (req, res, next) => {
  try {
    const characterId = parseInt(req.params.characterId);
    const userId = req.user.id;

    const character = await db.select()
      .from(characters)
      .where(and(
        eq(characters.id, characterId),
        eq(characters.userId, userId)
      ));

    if (character.length === 0) {
      return res.status(404).json({ error: 'Character not found or unauthorized access' });
    }

    req.character = character[0];
    next();
  } catch (error) {
    console.error('Error verifying character ownership:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all available items
router.get('/items', isAuthenticated, async (req, res) => {
  try {
    const allItems = await db.select().from(items);
    res.json(allItems);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Get specific item details
router.get('/items/:id', isAuthenticated, async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const item = await db.select().from(items).where(eq(items.id, itemId));
    
    if (item.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(item[0]);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// Get character inventory
router.get('/characters/:characterId/inventory', isAuthenticated, verifyCharacterOwnership, async (req, res) => {
  try {
    const characterId = parseInt(req.params.characterId);
    
    // Get all character items with detailed item information
    const inventory = await db.select({
      characterItem: characterItems,
      item: items
    })
    .from(characterItems)
    .innerJoin(items, eq(characterItems.itemId, items.id))
    .where(eq(characterItems.characterId, characterId));
    
    res.json(inventory);
  } catch (error) {
    console.error('Error fetching character inventory:', error);
    res.status(500).json({ error: 'Failed to fetch character inventory' });
  }
});

// Add item to character inventory
router.post('/characters/:characterId/inventory', isAuthenticated, verifyCharacterOwnership, async (req, res) => {
  try {
    const characterId = parseInt(req.params.characterId);
    const { itemId, quantity = 1, notes } = req.body;
    
    if (!itemId) {
      return res.status(400).json({ error: 'Item ID is required' });
    }
    
    // Check if item exists
    const itemExists = await db.select().from(items).where(eq(items.id, itemId));
    if (itemExists.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Add item to character inventory
    const [newCharacterItem] = await db.insert(characterItems)
      .values({
        characterId,
        itemId,
        quantity,
        notes,
        acquiredAt: new Date().toISOString(),
        acquiredFrom: 'manual_addition' // Indicate this was manually added
      })
      .returning();
    
    res.status(201).json(newCharacterItem);
  } catch (error) {
    console.error('Error adding item to inventory:', error);
    res.status(500).json({ error: 'Failed to add item to inventory' });
  }
});

// Get character currency
router.get('/characters/:characterId/currency', isAuthenticated, verifyCharacterOwnership, async (req, res) => {
  try {
    const characterId = parseInt(req.params.characterId);
    
    // Get character's currency from characters table
    const character = await db.select({
      goldCoins: characters.goldCoins,
      silverCoins: characters.silverCoins,
      copperCoins: characters.copperCoins
    })
    .from(characters)
    .where(eq(characters.id, characterId));
    
    if (character.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    res.json({
      gold: character[0].goldCoins || 0,
      silver: character[0].silverCoins || 0,
      copper: character[0].copperCoins || 0
    });
  } catch (error) {
    console.error('Error fetching character currency:', error);
    res.status(500).json({ error: 'Failed to fetch character currency' });
  }
});

// Update character currency
router.post('/characters/:characterId/currency', isAuthenticated, verifyCharacterOwnership, async (req, res) => {
  try {
    const characterId = parseInt(req.params.characterId);
    const { goldDelta = 0, silverDelta = 0, copperDelta = 0, reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: 'Reason for currency change is required' });
    }
    
    // Get current currency values
    const character = await db.select({
      id: characters.id,
      goldCoins: characters.goldCoins,
      silverCoins: characters.silverCoins,
      copperCoins: characters.copperCoins
    })
    .from(characters)
    .where(eq(characters.id, characterId));
    
    if (character.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    const { goldCoins, silverCoins, copperCoins } = character[0];
    
    // Calculate new values
    const newGold = Math.max(0, (goldCoins || 0) + goldDelta);
    const newSilver = Math.max(0, (silverCoins || 0) + silverDelta);
    const newCopper = Math.max(0, (copperCoins || 0) + copperDelta);
    
    // Update character currency
    const [updatedCharacter] = await db
      .update(characters)
      .set({
        goldCoins: newGold,
        silverCoins: newSilver,
        copperCoins: newCopper,
        updatedAt: new Date().toISOString()
      })
      .where(eq(characters.id, characterId))
      .returning();
    
    // Add transaction record
    const totalDelta = goldDelta * 10000 + silverDelta * 100 + copperDelta;
    await db.insert(currencyTransactions)
      .values({
        characterId,
        amount: totalDelta,
        reason,
        createdAt: new Date().toISOString()
      });
    
    res.json({
      gold: updatedCharacter.goldCoins,
      silver: updatedCharacter.silverCoins,
      copper: updatedCharacter.copperCoins
    });
  } catch (error) {
    console.error('Error updating character currency:', error);
    res.status(500).json({ error: 'Failed to update character currency' });
  }
});

// Get currency transaction history
router.get('/characters/:characterId/currency/history', isAuthenticated, verifyCharacterOwnership, async (req, res) => {
  try {
    const characterId = parseInt(req.params.characterId);
    
    // Get currency transaction history
    const transactions = await db.select()
      .from(currencyTransactions)
      .where(eq(currencyTransactions.characterId, characterId))
      .orderBy(currencyTransactions.createdAt);
    
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching currency transactions:', error);
    res.status(500).json({ error: 'Failed to fetch currency transactions' });
  }
});

module.exports = router;