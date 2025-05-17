// Simple test script to verify character API endpoints
import express from 'express';
import session from 'express-session';
import { Pool } from '@neondatabase/serverless';
import bodyParser from 'body-parser';

// Create test app
const app = express();
app.use(bodyParser.json());

// Set up session middleware
app.use(session({
  secret: 'test-session-secret',
  resave: false,
  saveUninitialized: false
}));

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Helper function for testing
app.get('/api/test/login/:userId', (req, res) => {
  // This is only for testing - simulates login
  req.session.passport = { user: parseInt(req.params.userId) };
  req.session.save(() => {
    res.json({ success: true, userId: req.params.userId });
  });
});

// Get all characters for a user (simplified)
app.get('/api/test/characters', async (req, res) => {
  try {
    // Get user ID from session
    const userId = req.session.passport?.user;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not logged in' });
    }
    
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

// Character inventory
app.get('/api/test/characters/:id/inventory', async (req, res) => {
  try {
    const characterId = parseInt(req.params.id);
    const userId = req.session.passport?.user;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not logged in' });
    }
    
    // Verify character belongs to user
    const character = await pool.query(
      'SELECT * FROM characters WHERE id = $1 AND user_id = $2',
      [characterId, userId]
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

// Start the test server
const port = 3001;
app.listen(port, () => {
  console.log(`Test server running on port ${port}`);
  console.log('To test:');
  console.log(`1. Log in: http://localhost:${port}/api/test/login/2`);
  console.log(`2. Get characters: http://localhost:${port}/api/test/characters`);
  console.log(`3. Get inventory: http://localhost:${port}/api/test/characters/1/inventory`);
});