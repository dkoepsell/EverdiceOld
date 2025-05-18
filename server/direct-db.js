// Direct database access functions that don't use Drizzle ORM
// to avoid schema compatibility issues between environments

const { pool } = require('./db');

// Get all sessions with only fields that exist in all environments
async function getSafeCampaignSessions(campaignId) {
  try {
    // Only query columns we know exist in all environments
    const result = await pool.query(`
      SELECT 
        id, 
        campaign_id as "campaignId", 
        session_number as "sessionNumber", 
        title, 
        narrative,
        location,
        session_xp_reward as "sessionXpReward",
        choices,
        is_completed as "isCompleted",
        completed_at as "completedAt",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM campaign_sessions
      WHERE campaign_id = $1
      ORDER BY session_number ASC
    `, [campaignId]);
    
    // Add default values for missing fields
    return result.rows.map(session => ({
      ...session,
      choices: session.choices || [],
      goldReward: 0, // Missing in deployed environment
      itemRewards: [], // Missing in deployed environment
      loreDiscovered: null, // Missing in deployed environment
      hasCombat: false, // Missing in deployed environment
      combatDetails: {} // Missing in deployed environment
    }));
  } catch (error) {
    console.error("Error in direct DB query for sessions:", error);
    return [];
  }
}

module.exports = {
  getSafeCampaignSessions
};