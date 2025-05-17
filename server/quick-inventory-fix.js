// Quick inventory display fix
const express = require('express');
const router = express.Router();
const { pool } = require('./db');

// Helper function to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
};

// Get character inventory
router.get('/characters/:characterId/inventory', isAuthenticated, async (req, res) => {
  try {
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

// Get character currency
router.get('/characters/:characterId/currency', isAuthenticated, async (req, res) => {
  try {
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

// Get all items
router.get('/items', isAuthenticated, async (req, res) => {
  try {
    const itemsQuery = await pool.query('SELECT * FROM items');
    res.json(itemsQuery.rows);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Get specific item
router.get('/items/:id', isAuthenticated, async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const itemQuery = await pool.query('SELECT * FROM items WHERE id = $1', [itemId]);
    
    if (itemQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(itemQuery.rows[0]);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// Get currency transaction history
router.get('/characters/:characterId/currency/history', isAuthenticated, async (req, res) => {
  try {
    const characterId = parseInt(req.params.characterId);
    const userId = req.user.id;
    
    // Check if character belongs to user
    const characterQuery = await pool.query(
      'SELECT id FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
    );
    
    if (characterQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    // Get currency transactions
    const transactionsQuery = await pool.query(
      'SELECT * FROM currency_transactions WHERE character_id = $1 ORDER BY created_at',
      [characterId]
    );
    
    res.json(transactionsQuery.rows);
  } catch (error) {
    console.error('Error fetching currency transactions:', error);
    res.status(500).json({ error: 'Failed to fetch currency transactions' });
  }
});

module.exports = router;