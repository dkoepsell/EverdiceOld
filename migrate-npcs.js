// Migration script to create NPC tables
import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL must be set");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrateNpcs() {
  console.log('Starting NPC tables migration...');
  
  try {
    // Create npcs table
    console.log('Creating npcs table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS npcs (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        race TEXT NOT NULL,
        occupation TEXT NOT NULL,
        personality TEXT NOT NULL,
        appearance TEXT NOT NULL,
        motivation TEXT NOT NULL,
        is_companion BOOLEAN DEFAULT FALSE,
        companion_type TEXT,
        ai_personality TEXT,
        combat_abilities JSONB DEFAULT '[]',
        support_abilities JSONB DEFAULT '[]',
        utility_abilities JSONB DEFAULT '[]',
        social_abilities JSONB DEFAULT '[]',
        decision_making_rules JSONB DEFAULT '{}',
        level INTEGER DEFAULT 1,
        hit_points INTEGER,
        max_hit_points INTEGER,
        armor_class INTEGER,
        strength INTEGER,
        dexterity INTEGER,
        constitution INTEGER,
        intelligence INTEGER,
        wisdom INTEGER,
        charisma INTEGER,
        skills TEXT[],
        equipment TEXT[],
        portrait_url TEXT,
        is_public BOOLEAN DEFAULT FALSE,
        created_by INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT NOW(),
        updated_at TEXT
      )
    `);
    
    // Create campaign_npcs table
    console.log('Creating campaign_npcs table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS campaign_npcs (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER NOT NULL,
        npc_id INTEGER NOT NULL,
        role TEXT NOT NULL DEFAULT 'companion',
        turn_order INTEGER,
        is_active BOOLEAN DEFAULT TRUE,
        joined_at TEXT NOT NULL DEFAULT NOW(),
        last_active_at TEXT,
        custom_behavior_rules JSONB DEFAULT '{}',
        controlled_by INTEGER
      )
    `);
    
    console.log('NPC tables migration completed successfully');
  } catch (error) {
    console.error('Error creating NPC tables:', error);
    throw error;
  } finally {
    // Close pool
    await pool.end();
  }
}

migrateNpcs()
  .then(() => {
    console.log('NPC migration completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });