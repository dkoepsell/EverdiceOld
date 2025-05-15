const { Pool } = require('pg');

// Create a pool with the connection string from environment variables
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  console.log('Starting database migration...');
  
  try {
    const client = await pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      // 1. Modify campaigns table - add turn-based columns
      console.log('Modifying campaigns table...');
      
      // Check if columns exist and add them if they don't
      const columns = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'campaigns'
      `);
      
      const existingColumns = columns.rows.map(row => row.column_name);
      
      if (!existingColumns.includes('current_turn_user_id')) {
        console.log('Adding current_turn_user_id column');
        await client.query(`ALTER TABLE campaigns ADD COLUMN current_turn_user_id INTEGER`);
      }
      
      if (!existingColumns.includes('is_turn_based')) {
        console.log('Adding is_turn_based column');
        await client.query(`ALTER TABLE campaigns ADD COLUMN is_turn_based BOOLEAN DEFAULT FALSE`);
      }
      
      if (!existingColumns.includes('turn_time_limit')) {
        console.log('Adding turn_time_limit column');
        await client.query(`ALTER TABLE campaigns ADD COLUMN turn_time_limit INTEGER`);
      }
      
      if (!existingColumns.includes('turn_started_at')) {
        console.log('Adding turn_started_at column');
        await client.query(`ALTER TABLE campaigns ADD COLUMN turn_started_at TEXT`);
      }
      
      // 2. Create campaign_participants table
      console.log('Creating campaign_participants table...');
      
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'campaign_participants'
        )
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log('Creating campaign_participants table');
        await client.query(`
          CREATE TABLE campaign_participants (
            id SERIAL PRIMARY KEY,
            campaign_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            character_id INTEGER NOT NULL,
            role TEXT NOT NULL DEFAULT 'player',
            turn_order INTEGER,
            is_active BOOLEAN DEFAULT TRUE,
            joined_at TEXT NOT NULL,
            last_active_at TEXT,
            FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
          )
        `);
      }
      
      // 3. Move existing characters from campaigns to participants table
      console.log('Migrating existing campaign characters to participant table...');
      
      // First, check if the characters column still exists in campaigns
      if (existingColumns.includes('characters')) {
        // Get all campaigns with characters
        const campaignsWithCharacters = await client.query(`
          SELECT id, user_id, characters 
          FROM campaigns 
          WHERE characters IS NOT NULL
        `);
        
        // For each campaign, add entries to the participants table
        for (const campaign of campaignsWithCharacters.rows) {
          if (campaign.characters && campaign.characters.length) {
            console.log(`Migrating ${campaign.characters.length} characters for campaign ${campaign.id}`);
            
            // For each character ID in the array
            for (let i = 0; i < campaign.characters.length; i++) {
              const characterId = campaign.characters[i];
              
              // Get the user_id for this character
              const characterResult = await client.query(
                'SELECT user_id FROM characters WHERE id = $1',
                [characterId]
              );
              
              if (characterResult.rows.length) {
                const userId = characterResult.rows[0].user_id;
                
                // Check if participant entry already exists
                const existingParticipant = await client.query(
                  'SELECT id FROM campaign_participants WHERE campaign_id = $1 AND user_id = $2',
                  [campaign.id, userId]
                );
                
                if (existingParticipant.rows.length === 0) {
                  // Add participant entry
                  await client.query(`
                    INSERT INTO campaign_participants 
                    (campaign_id, user_id, character_id, role, turn_order, joined_at)
                    VALUES ($1, $2, $3, $4, $5, $6)
                  `, [
                    campaign.id,
                    userId,
                    characterId,
                    userId === campaign.user_id ? 'dm' : 'player',
                    i + 1, // Use array index for turn order
                    new Date().toISOString()
                  ]);
                }
              }
            }
          }
        }
      }
      
      // Commit transaction
      await client.query('COMMIT');
      console.log('Migration completed successfully');
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Migration failed:', error);
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

migrate()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });