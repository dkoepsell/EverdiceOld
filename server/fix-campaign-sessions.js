// Direct database access for campaign sessions
// To fix the database schema incompatibility issues

const { pool } = require('./db');

// This function handles the direct database access
// and returns sessions with default values for missing fields
async function getSafeSessionsForCampaign(campaignId) {
  try {
    // Minimal query with only essential fields that exist in all environments
    const result = await pool.query(`
      SELECT 
        id, 
        campaign_id AS "campaignId", 
        session_number AS "sessionNumber", 
        title, 
        narrative
      FROM campaign_sessions
      WHERE campaign_id = $1
      ORDER BY session_number ASC
    `, [campaignId]);
    
    // Map the results with default values for all expected fields
    return result.rows.map(session => ({
      id: session.id,
      campaignId: session.campaignId,
      sessionNumber: session.sessionNumber,
      title: session.title,
      narrative: session.narrative,
      // Default values for fields that might not exist in all environments
      choices: [],
      isCompleted: false,
      completedAt: null,
      sessionXpReward: 0,
      goldReward: 0,
      itemRewards: [],
      loreDiscovered: null,
      hasCombat: false,
      combatDetails: {},
      location: null,
      createdAt: new Date().toISOString(),
      updatedAt: null
    }));
  } catch (error) {
    console.error("Error in getSafeSessionsForCampaign:", error);
    return []; // Return empty array on error
  }
}

module.exports = {
  getSafeSessionsForCampaign
};