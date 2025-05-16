import { Pool } from '@neondatabase/serverless';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

// Use the DATABASE_URL environment variable
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString: dbUrl });

async function migrateCampaigns() {
  console.log('Starting campaigns migration...');
  
  try {
    // Add deployment columns to campaigns table
    await pool.query(`
      ALTER TABLE IF EXISTS campaigns
      ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS published_at TEXT,
      ADD COLUMN IF NOT EXISTS deployment_code TEXT,
      ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS max_players INTEGER DEFAULT 6
    `);
    
    console.log('Successfully added campaign deployment columns');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    console.log('Migration complete, closing pool');
    await pool.end();
  }
}

migrateCampaigns()
  .then(() => {
    console.log('Campaigns migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Campaigns migration failed:', error);
    process.exit(1);
  });