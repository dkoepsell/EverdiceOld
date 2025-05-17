// Simple character inventory API routes
import express from 'express';
import { Pool } from '@neondatabase/serverless';

// Create router
const router = express.Router();

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Get all characters for a user
router.get('/characters', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get user ID from session
    const userId = req.user.id;
    
    // Get characters for this user
    const result = await pool.query(
      'SELECT * FROM characters WHERE user_id = $1',
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching characters:', error);
    res.status(500).json({ error: 'Failed to fetch characters' });
  }
});

// Get character inventory
router.get('/characters/:id/inventory', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const characterId = parseInt(req.params.id);
    
    // Verify character belongs to user
    const character = await pool.query(
      'SELECT * FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, req.user.id]
    );
    
    if (character.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    // Get character items with item details
    const inventory = await pool.query(`
      SELECT ci.*, i.name, i.description, i.type, i.rarity, i.value, i.properties
      FROM character_items ci
      JOIN items i ON ci.item_id = i.id
      WHERE ci.character_id = $1
    `, [characterId]);
    
    res.json(inventory.rows);
  } catch (error) {
    console.error('Error fetching character inventory:', error);
    res.status(500).json({ error: 'Failed to fetch character inventory' });
  }
});

// Get character currency
router.get('/characters/:id/currency', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const characterId = parseInt(req.params.id);
    
    // Verify character belongs to user
    const character = await pool.query(
      'SELECT gold_coins, silver_coins, copper_coins FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, req.user.id]
    );
    
    if (character.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    res.json(character.rows[0]);
  } catch (error) {
    console.error('Error fetching character currency:', error);
    res.status(500).json({ error: 'Failed to fetch character currency' });
  }
});

// Add a reward item to character inventory (for DM)
router.post('/characters/:id/rewards/item', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const characterId = parseInt(req.params.id);
    const { itemId, quantity = 1, source = 'dm_reward', notes = '' } = req.body;
    
    // Verify character exists
    const character = await pool.query(
      'SELECT * FROM characters WHERE id = $1',
      [characterId]
    );
    
    if (character.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    // Verify item exists
    const item = await pool.query(
      'SELECT * FROM items WHERE id = $1',
      [itemId]
    );
    
    if (item.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Add item to character inventory
    const result = await pool.query(`
      INSERT INTO character_items 
      (character_id, item_id, quantity, is_equipped, acquired_from, notes, acquired_at)
      VALUES ($1, $2, $3, false, $4, $5, NOW())
      RETURNING *
    `, [characterId, itemId, quantity, source, notes]);
    
    res.status(201).json({
      ...result.rows[0],
      item: item.rows[0]
    });
  } catch (error) {
    console.error('Error adding reward item:', error);
    res.status(500).json({ error: 'Failed to add reward item' });
  }
});

// Add currency reward to character
router.post('/characters/:id/rewards/currency', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const characterId = parseInt(req.params.id);
    const { gold = 0, silver = 0, copper = 0, source = 'dm_reward' } = req.body;
    
    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get current character currency
      const character = await client.query(
        'SELECT gold_coins, silver_coins, copper_coins FROM characters WHERE id = $1',
        [characterId]
      );
      
      if (character.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Character not found' });
      }
      
      const current = character.rows[0];
      
      // Update character currency
      const updated = await client.query(`
        UPDATE characters
        SET 
          gold_coins = $1,
          silver_coins = $2,
          copper_coins = $3
        WHERE id = $4
        RETURNING gold_coins, silver_coins, copper_coins
      `, [
        (current.gold_coins || 0) + gold,
        (current.silver_coins || 0) + silver,
        (current.copper_coins || 0) + copper,
        characterId
      ]);
      
      // Log currency transaction
      const totalCopperValue = (gold * 10000) + (silver * 100) + copper;
      
      await client.query(`
        INSERT INTO currency_transactions
        (character_id, amount, reason, reference_type, created_at)
        VALUES ($1, $2, $3, $4, NOW())
      `, [characterId, totalCopperValue, source, source]);
      
      await client.query('COMMIT');
      
      res.json(updated.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error adding currency reward:', error);
    res.status(500).json({ error: 'Failed to add currency reward' });
  }
});

export default router;