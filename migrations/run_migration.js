import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('Running migration...');
  
  try {
    const sqlPath = path.join(__dirname, 'add_invitations_and_notes.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Connect to the database
    const client = await pool.connect();
    
    try {
      // Execute the SQL script
      await client.query(sql);
      console.log('Migration completed successfully');
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();