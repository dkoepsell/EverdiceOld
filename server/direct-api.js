// Direct API routes for character and inventory data
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

// Get all characters for the currently logged in user
router.get('/characters', isAuthenticated, async (req, res) => {
  try {
    const result = await db.select().from(characters).where(eq(characters.userId, req.user.id));
    res.json(result);
  } catch (error) {
    console.error('Error fetching characters:', error);
    res.status(500).json({ error: 'Failed to fetch characters' });
  }
});

// Get a specific character by ID
router.get('/characters/:id', isAuthenticated, async (req, res) => {
  try {
    const characterId = parseInt(req.params.id);
    const result = await db.select().from(characters)
      .where(and(
        eq(characters.id, characterId),
        eq(characters.userId, req.user.id)
      ));
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error('Error fetching character:', error);
    res.status(500).json({ error: 'Failed to fetch character' });
  }
});

// Get character inventory
router.get('/characters/:id/inventory', isAuthenticated, async (req, res) => {
  try {
    const characterId = parseInt(req.params.id);
    
    // First check if character belongs to user
    const character = await db.select().from(characters)
      .where(and(
        eq(characters.id, characterId),
        eq(characters.userId, req.user.id)
      ));
    
    if (character.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    // Get character items with full item details
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

// Get character currency
router.get('/characters/:id/currency', isAuthenticated, async (req, res) => {
  try {
    const characterId = parseInt(req.params.id);
    
    // Check if character belongs to user
    const character = await db.select({
      goldCoins: characters.goldCoins,
      silverCoins: characters.silverCoins,
      copperCoins: characters.copperCoins
    })
    .from(characters)
    .where(and(
      eq(characters.id, characterId),
      eq(characters.userId, req.user.id)
    ));
    
    if (character.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    // Format response to match the expected format
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

// Get currency transaction history
router.get('/characters/:id/currency/history', isAuthenticated, async (req, res) => {
  try {
    const characterId = parseInt(req.params.id);
    
    // Check if character belongs to user
    const character = await db.select().from(characters)
      .where(and(
        eq(characters.id, characterId),
        eq(characters.userId, req.user.id)
      ));
    
    if (character.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    // Get currency transactions
    const transactions = await db.select().from(currencyTransactions)
      .where(eq(currencyTransactions.characterId, characterId))
      .orderBy(currencyTransactions.createdAt);
    
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching currency transactions:', error);
    res.status(500).json({ error: 'Failed to fetch currency transactions' });
  }
});

// Get all items
router.get('/items', isAuthenticated, async (req, res) => {
  try {
    const allItems = await db.select().from(items);
    res.json(allItems);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Get specific item
router.get('/items/:id', isAuthenticated, async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const item = await db.select().from(items)
      .where(eq(items.id, itemId));
    
    if (item.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(item[0]);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

export default router;