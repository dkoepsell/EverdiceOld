const fs = require('fs');
const path = require('path');
const { pool } = require('../server/db');

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

runMigration().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});