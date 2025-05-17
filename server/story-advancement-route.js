import express from 'express';
import { pool } from './db.js';
import * as storyGenerator from './story-generator.js';

const router = express.Router();

// Advanced story progression route
router.post('/advance', async (req, res) => {
  try {
    const { campaignId, action } = req.body;
    
    if (!campaignId || !action) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: campaignId and action" 
      });
    }
    
    console.log(`[Enhanced Story API] Advancing story for campaign ${campaignId} with action: ${action}`);
    
    // Get campaign and current session data
    const campaignResult = await pool.query(
      `SELECT * FROM campaigns WHERE id = $1`,
      [campaignId]
    );
    
    if (campaignResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Campaign not found" 
      });
    }
    
    const campaign = campaignResult.rows[0];
    
    // Get the most recent session for this campaign
    const sessionsResult = await pool.query(
      `SELECT * FROM campaign_sessions WHERE campaign_id = $1 ORDER BY session_number DESC LIMIT 1`,
      [campaignId]
    );
    
    if (sessionsResult.rows.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "Campaign has no sessions to continue from" 
      });
    }
    
    const currentSession = sessionsResult.rows[0];
    
    // Get campaign participants
    const participantsResult = await pool.query(
      `SELECT 
         cp.*, c.name as character_name, c.race as character_race, 
         c.class as character_class, c.level as character_level 
       FROM campaign_participants cp
       JOIN characters c ON cp.character_id = c.id
       WHERE cp.campaign_id = $1`,
      [campaignId]
    );
    
    const participants = participantsResult.rows;
    
    // Get recent dice rolls
    const diceResult = await pool.query(
      `SELECT * FROM dice_rolls ORDER BY created_at DESC LIMIT 5`
    );
    
    const recentRolls = diceResult.rows;
    
    // Generate the story continuation
    const storyData = await storyGenerator.generateStoryAdvancement({
      campaignId,
      action,
      campaign,
      currentSession,
      participants,
      recentRolls
    });
    
    // Calculate the new session number 
    const sessionNumber = currentSession.session_number + 1;
    
    // Process any rewards from the story
    await storyGenerator.processStoryRewards(
      campaignId,
      storyData.rewards,
      participants
    );
    
    // Create the new campaign session
    const sessionData = {
      campaignId,
      sessionNumber,
      title: storyData.sessionTitle,
      narrative: storyData.narrative,
      location: storyData.location,
      choices: storyData.choices,
      sessionXpReward: 100 + (sessionNumber * 25)
    };
    
    // Create the session in the database
    const session = await storyGenerator.createCampaignSession(sessionData);
    
    // Update the campaign's current session
    await storyGenerator.updateCampaignCurrentSession(campaignId, sessionNumber);
    
    // Return success response with all the data the client needs
    res.status(201).json({
      success: true,
      session,
      campaignId: parseInt(campaignId),
      newSessionNumber: sessionNumber
    });
    
  } catch (error) {
    console.error("[Enhanced Story API] Error advancing story:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to advance story",
      error: error.message
    });
  }
});

export default router;