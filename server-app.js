// Simple server for demonstrating the D&D inventory system
const express = require('express');
const { Pool } = require('@neondatabase/serverless');
const app = express();
const port = 3000;

app.use(express.json());

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Routes
app.get('/', (req, res) => {
  res.send('D&D Inventory System API is running');
});

// Get all items
app.get('/api/items', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).send('Error fetching items');
  }
});

// Get character inventory
app.get('/api/characters/:id/inventory', async (req, res) => {
  try {
    const characterId = parseInt(req.params.id);
    
    // Get character items with item details
    const query = `
      SELECT ci.*, i.name, i.description, i.type, i.rarity, i.value, i.properties
      FROM character_items ci
      JOIN items i ON ci.item_id = i.id
      WHERE ci.character_id = $1
    `;
    
    const result = await pool.query(query, [characterId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching character inventory:', error);
    res.status(500).send('Error fetching character inventory');
  }
});

// Get character currency
app.get('/api/characters/:id/currency', async (req, res) => {
  try {
    const characterId = parseInt(req.params.id);
    
    const query = `
      SELECT gold_coins, silver_coins, copper_coins
      FROM characters
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [characterId]);
    
    if (result.rows.length === 0) {
      return res.status(404).send('Character not found');
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching character currency:', error);
    res.status(500).send('Error fetching character currency');
  }
});

// Add item to character (simulating a DM reward)
app.post('/api/characters/:id/inventory', async (req, res) => {
  try {
    const characterId = parseInt(req.params.id);
    const { itemId, quantity = 1, notes = 'DM reward', isEquipped = false } = req.body;
    
    // Add item to character inventory
    const query = `
      INSERT INTO character_items 
      (character_id, item_id, quantity, is_equipped, acquired_from, notes, acquired_at)
      VALUES ($1, $2, $3, $4, 'dm_reward', $5, NOW())
      RETURNING *
    `;
    
    const result = await pool.query(query, [characterId, itemId, quantity, isEquipped, notes]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding item to character:', error);
    res.status(500).send('Error adding item to character');
  }
});

// Add currency to character (simulating a treasure reward)
app.post('/api/characters/:id/currency', async (req, res) => {
  try {
    const characterId = parseInt(req.params.id);
    const { gold = 0, silver = 0, copper = 0, reason = 'treasure_reward' } = req.body;
    
    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get current currency
      const currencyQuery = `
        SELECT gold_coins, silver_coins, copper_coins
        FROM characters
        WHERE id = $1
      `;
      
      const currencyResult = await client.query(currencyQuery, [characterId]);
      
      if (currencyResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).send('Character not found');
      }
      
      const character = currencyResult.rows[0];
      
      // Update currency
      const updateQuery = `
        UPDATE characters
        SET 
          gold_coins = $1,
          silver_coins = $2,
          copper_coins = $3
        WHERE id = $4
        RETURNING gold_coins, silver_coins, copper_coins
      `;
      
      const newGold = (character.gold_coins || 0) + gold;
      const newSilver = (character.silver_coins || 0) + silver;
      const newCopper = (character.copper_coins || 0) + copper;
      
      const updateResult = await client.query(updateQuery, [newGold, newSilver, newCopper, characterId]);
      
      // Log transaction
      const totalCopper = (gold * 10000) + (silver * 100) + copper;
      
      const logQuery = `
        INSERT INTO currency_transactions
        (character_id, amount, reason, reference_type, created_at)
        VALUES ($1, $2, $3, $4, NOW())
      `;
      
      await client.query(logQuery, [characterId, totalCopper, reason, 'reward']);
      
      await client.query('COMMIT');
      
      res.json(updateResult.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating character currency:', error);
    res.status(500).send('Error updating character currency');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`D&D Inventory API running on port ${port}`);
});