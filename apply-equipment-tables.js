import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function applyEquipmentTables() {
  console.log('Starting to apply equipment and reward tables...');

  try {
    // Check if items table exists
    const checkItems = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'items'
      );
    `);
    
    if (!checkItems[0].exists) {
      console.log('Creating items table...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS items (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          item_type TEXT NOT NULL,
          rarity TEXT NOT NULL DEFAULT 'common',
          slot TEXT NOT NULL,
          weight INTEGER NOT NULL DEFAULT 0,
          value INTEGER NOT NULL DEFAULT 0,
          is_stackable BOOLEAN NOT NULL DEFAULT FALSE,
          is_consumable BOOLEAN NOT NULL DEFAULT FALSE,
          requires_attunement BOOLEAN NOT NULL DEFAULT FALSE,
          properties JSONB NOT NULL DEFAULT '{}',
          created_at TEXT NOT NULL,
          updated_at TEXT,
          created_by INTEGER,
          is_system_item BOOLEAN NOT NULL DEFAULT TRUE
        );
      `);
      console.log('Items table created successfully');
    } else {
      console.log('Items table already exists');
    }

    // Check if character_items table exists
    const checkCharacterItems = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'character_items'
      );
    `);
    
    if (!checkCharacterItems[0].exists) {
      console.log('Creating character_items table...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS character_items (
          id SERIAL PRIMARY KEY,
          character_id INTEGER NOT NULL,
          item_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          is_equipped BOOLEAN NOT NULL DEFAULT FALSE,
          is_attuned BOOLEAN NOT NULL DEFAULT FALSE,
          custom_name TEXT,
          custom_description TEXT,
          custom_properties JSONB DEFAULT '{}',
          acquired_at TEXT NOT NULL,
          notes TEXT
        );
      `);
      console.log('Character items table created successfully');
    } else {
      console.log('Character items table already exists');
    }

    // Check if campaign_rewards table exists
    const checkCampaignRewards = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'campaign_rewards'
      );
    `);
    
    if (!checkCampaignRewards[0].exists) {
      console.log('Creating campaign_rewards table...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS campaign_rewards (
          id SERIAL PRIMARY KEY,
          campaign_id INTEGER NOT NULL,
          session_id INTEGER,
          item_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          is_awarded BOOLEAN NOT NULL DEFAULT FALSE,
          awarded_at TEXT,
          award_method TEXT,
          location TEXT,
          created_at TEXT NOT NULL
        );
      `);
      console.log('Campaign rewards table created successfully');
    } else {
      console.log('Campaign rewards table already exists');
    }

    console.log('All equipment and reward tables created successfully');
  } catch (error) {
    console.error('Error setting up equipment tables:', error);
  } finally {
    process.exit(0);
  }
}

applyEquipmentTables();