// Migration script for the database schema changes
import { campaigns, campaignParticipants } from './shared/schema.js';
import { db } from './server/db.js';

async function applyMigrations() {
  console.log('Applying database migrations...');
  
  // Alter campaigns table to add turn-based columns
  try {
    console.log('Adding turn-based columns to campaigns table...');
    
    // Check if the current_turn_user_id column exists
    const hasCurrentTurnUserIdColumn = await db.execute(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'campaigns' AND column_name = 'current_turn_user_id'`
    );
    
    if (!hasCurrentTurnUserIdColumn.rowCount) {
      await db.execute(`ALTER TABLE campaigns ADD COLUMN current_turn_user_id INTEGER`);
      console.log('Added current_turn_user_id column');
    }
    
    // Check if the is_turn_based column exists
    const hasIsTurnBasedColumn = await db.execute(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'campaigns' AND column_name = 'is_turn_based'`
    );
    
    if (!hasIsTurnBasedColumn.rowCount) {
      await db.execute(`ALTER TABLE campaigns ADD COLUMN is_turn_based BOOLEAN DEFAULT FALSE`);
      console.log('Added is_turn_based column');
    }
    
    // Check if the turn_time_limit column exists
    const hasTurnTimeLimitColumn = await db.execute(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'campaigns' AND column_name = 'turn_time_limit'`
    );
    
    if (!hasTurnTimeLimitColumn.rowCount) {
      await db.execute(`ALTER TABLE campaigns ADD COLUMN turn_time_limit INTEGER`);
      console.log('Added turn_time_limit column');
    }
    
    // Check if the turn_started_at column exists
    const hasTurnStartedAtColumn = await db.execute(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = 'campaigns' AND column_name = 'turn_started_at'`
    );
    
    if (!hasTurnStartedAtColumn.rowCount) {
      await db.execute(`ALTER TABLE campaigns ADD COLUMN turn_started_at TEXT`);
      console.log('Added turn_started_at column');
    }
    
    // Create campaign_participants table if it doesn't exist
    console.log('Creating campaign_participants table...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS campaign_participants (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        character_id INTEGER NOT NULL,
        role TEXT NOT NULL DEFAULT 'player',
        turn_order INTEGER,
        is_active BOOLEAN DEFAULT TRUE,
        joined_at TEXT NOT NULL,
        last_active_at TEXT
      )
    `);
    
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error applying migrations:', error);
  }
}

applyMigrations()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });