const { OpenAI } = require('openai');
const { pool } = require('./db');

// Initialize OpenAI client
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generates a new story session based on player action
 * @param {Object} options - Story generation options
 * @param {number} options.campaignId - Campaign ID
 * @param {string} options.action - Player action description
 * @param {Object} options.campaign - Campaign data
 * @param {Object} options.currentSession - Current session data
 * @param {Array} options.participants - Campaign participants
 * @param {Array} options.recentRolls - Recent dice rolls
 * @returns {Promise<Object>} - Generated story data
 */
async function generateStoryAdvancement(options) {
  const { 
    campaignId, 
    action, 
    campaign, 
    currentSession, 
    participants = [], 
    recentRolls = [], 
    narrativeStyle = "descriptive",
    difficulty = "Normal - Balanced Challenge",
    storyDirection = "balanced mix of combat, roleplay, and exploration",
    locationContext = ""
  } = options;
  
  console.log(`Generating story advancement for campaign ${campaignId} using action: ${action}`);
  
  // Format campaign context
  let campaignContext = `Campaign: ${campaign.title || "Unknown"}. ${campaign.description || ""}`;
  
  // Add character details
  if (participants && participants.length > 0) {
    campaignContext += " Characters in party: " + 
      participants.map(char => 
        `${char.characterName || "Unknown"} (Level ${char.characterLevel || 1} ${char.characterRace || "Human"} ${char.characterClass || "Fighter"})`
      ).join(", ");
  }
  
  // Format dice roll context if available
  let diceContext = "";
  const latestRoll = recentRolls[0];
  if (latestRoll) {
    diceContext = `
The player recently made a ${latestRoll.purpose || "dice"} roll:
- Rolled: ${latestRoll.diceType} (result: ${latestRoll.result})
- Total with modifier (${latestRoll.modifier || 0}): ${latestRoll.result + (latestRoll.modifier || 0)}
- Purpose: ${latestRoll.purpose || "Unknown"}
- ${latestRoll.result === 20 ? "CRITICAL SUCCESS!" : latestRoll.result === 1 ? "CRITICAL FAILURE!" : ""}

Make sure your narrative directly incorporates the outcome of this roll.
`;
  }
  
  // Format available choices from current session
  let choicesText = "";
  try {
    const choices = JSON.parse(currentSession.choices || "[]");
    if (choices && choices.length > 0) {
      choicesText = choices.map(c => 
        `- ${c.action}: ${c.description}${c.requiresDiceRoll ? ` (Requires ${c.diceType} roll, DC ${c.rollDC})` : ""}`
      ).join("\n");
    }
  } catch (error) {
    console.warn("Could not parse session choices:", error);
    choicesText = "No available choices";
  }
  
  // Build the detailed prompt for the AI
  const promptWithContext = `
You are an expert Dungeon Master for a D&D game with a ${narrativeStyle} storytelling style.
${campaignContext}
${locationContext}
Difficulty level: ${difficulty}
Story direction preference: ${storyDirection}

The current campaign session is #${currentSession.sessionNumber}: "${currentSession.title}" set in the location "${currentSession.location || 'Unknown'}".

The narrative so far:
${currentSession.narrative}

The available choices were:
${choicesText}

Based on the player's action: "${action}", generate the next part of the adventure. Include:
1. A descriptive narrative of what happens next (3-4 paragraphs)
2. A title for this scene/encounter
3. Four possible actions the player can take next, with at least 2 actions requiring dice rolls (skill checks, saving throws, or combat rolls)

IMPORTANT GAME MECHANICS:
1. COMBAT PROGRESSION - If the action was a combat roll:
   - Describe vivid combat with attacks, counterattacks, and tactical positioning
   - Include NPC reactions and support during combat
   - Show injuries, stamina loss, or other combat effects on both players and enemies
   - Indicate how close enemies are to defeat (e.g., "the goblin staggers, badly wounded")

2. REWARDS SYSTEM - After significant accomplishments, always include some form of reward:
   - After combat: Describe defeated enemies dropping weapons, armor, potions, or currency
   - After exploration: Describe discovery of hidden treasures, ancient artifacts, or magical items
   - After social encounters: Describe gaining valuable information, favors, or alliances
   - Include specific item names and basic properties for important finds

3. STORY COMPLETION - If the player resolves a major plot point:
   - Provide clear narrative closure to that part of the adventure
   - Indicate progress toward larger campaign goals 
   - Suggest new adventure hooks or paths forward
   - Consider awarding XP or level advancement for major accomplishments

If there are any companions traveling with the party, make sure they actively participate in the narrative. They should:
- Contribute meaningful dialogue and interactions
- Provide assistance during challenging situations based on their type
- Have distinct personalities that show through their actions and words
- Offer advice or suggestions related to their skills and knowledge

Return your response as a JSON object with these fields:
- narrative: The descriptive text of what happens next
- sessionTitle: A short, engaging title for this scene
- location: The current location or setting where this scene takes place
- rewards: An array of rewards the player earns from this action (leave empty if none apply):
  - Each reward should have:
    - type: "item" | "currency" | "experience"
    - name: Name of the item, type of currency, or "XP"
    - description: Brief description of the reward
    - value: Numerical value (amount of gold, XP points)
    - rarity: For items only - "common" | "uncommon" | "rare" | "very rare" | "legendary"
- choices: An array of 4 objects, each with:
  - action: A short description of a possible action
  - description: A brief explanation of what this action entails 
  - icon: A simple icon identifier (use: "search", "hand-sparkles", "running", "sword", or any basic icon name)
  - requiresDiceRoll: Boolean indicating if this action requires a dice roll
  - diceType: If requiresDiceRoll is true, include the type of dice to roll ("d20" for most skill checks and attacks, "d4", "d6", "d8", etc. for damage)
  - rollDC: If requiresDiceRoll is true, include the DC/difficulty (number to beat) for this roll
  - rollModifier: The modifier to add to the roll (based on character attributes, usually -2 to +5)
  - rollPurpose: A short explanation of what the roll is for (e.g., "Perception Check", "Athletics Check", "Attack Roll")
  - successText: Brief text to display on a successful roll
  - failureText: Brief text to display on a failed roll
${diceContext}
`;

  try {
    // Generate story continuation using OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [{ role: "user", content: promptWithContext }],
      response_format: { type: "json_object" },
      max_tokens: 2000,
      temperature: 0.8
    });

    const responseContent = response.choices[0]?.message?.content || "";
    console.log("OpenAI response received, length:", responseContent.length);
    
    // Parse and validate the response
    const storyData = JSON.parse(responseContent);
    
    if (!storyData.narrative || !storyData.sessionTitle || !storyData.location || !Array.isArray(storyData.choices)) {
      throw new Error("Invalid response structure");
    }
    
    // Ensure rewards is an array (even if empty)
    if (!storyData.rewards) {
      storyData.rewards = [];
    }
    
    console.log("Successfully parsed story response with session title:", storyData.sessionTitle);
    return storyData;
    
  } catch (error) {
    console.error("Error generating story advancement:", error);
    throw error;
  }
}

/**
 * Processes rewards from story advancement
 * @param {number} campaignId - Campaign ID
 * @param {Array} rewards - Rewards array
 * @param {Array} participants - Campaign participants
 */
async function processStoryRewards(campaignId, rewards, participants) {
  if (!rewards || !Array.isArray(rewards) || rewards.length === 0) {
    console.log("No rewards to process");
    return;
  }
  
  console.log(`Processing ${rewards.length} rewards for campaign ${campaignId}`);
  
  if (!participants || !Array.isArray(participants) || participants.length === 0) {
    console.log("No participants to receive rewards");
    return;
  }
  
  // Process rewards for each participant
  for (const participant of participants) {
    const characterId = participant.characterId;
    if (!characterId) continue;
    
    for (const reward of rewards) {
      try {
        if (reward.type === 'currency' && reward.value > 0) {
          // Add currency reward
          await pool.query(
            `INSERT INTO currency_transactions 
            (character_id, amount, transaction_type, description, created_at) 
            VALUES ($1, $2, $3, $4, NOW())`,
            [characterId, reward.value, 'reward', `Reward from adventure: ${reward.name}`]
          );
          console.log(`Added ${reward.value} currency to character ${characterId}`);
        } 
        else if (reward.type === 'item') {
          // Check if item exists first
          const existingItemResult = await pool.query(
            `SELECT id FROM items WHERE name = $1`, 
            [reward.name]
          );
          
          let itemId;
          if (existingItemResult.rows.length > 0) {
            itemId = existingItemResult.rows[0].id;
          } else {
            // Create the item if it doesn't exist
            const newItemResult = await pool.query(
              `INSERT INTO items (name, description, category, rarity, created_at) 
              VALUES ($1, $2, $3, $4, NOW()) RETURNING id`,
              [reward.name, reward.description, 'loot', reward.rarity || 'common']
            );
            itemId = newItemResult.rows[0].id;
          }
          
          // Add to character inventory
          await pool.query(
            `INSERT INTO character_items (character_id, item_id, quantity, created_at) 
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (character_id, item_id) 
            DO UPDATE SET quantity = character_items.quantity + $3`,
            [characterId, itemId, 1]
          );
          
          console.log(`Added item ${reward.name} to character ${characterId}`);
        }
        else if (reward.type === 'experience' && reward.value > 0) {
          // For now, just log XP rewards
          console.log(`Character ${characterId} would receive ${reward.value} XP`);
        }
      } catch (err) {
        console.error(`Failed to process reward for character ${characterId}:`, err);
      }
    }
  }
}

/**
 * Creates a new campaign session
 * @param {Object} sessionData - Session data
 * @returns {Promise<Object>} - Created session
 */
async function createCampaignSession(sessionData) {
  try {
    const result = await pool.query(
      `INSERT INTO campaign_sessions 
       (campaign_id, session_number, title, narrative, location, choices, created_at, updated_at, session_xp_reward) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), $7) 
       RETURNING *`,
      [
        sessionData.campaignId, 
        sessionData.sessionNumber, 
        sessionData.title, 
        sessionData.narrative, 
        sessionData.location, 
        JSON.stringify(sessionData.choices),
        sessionData.sessionXpReward || 100
      ]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error("Error creating campaign session:", error);
    throw error;
  }
}

/**
 * Updates a campaign's current session
 * @param {number} campaignId - Campaign ID
 * @param {number} sessionNumber - Session number
 * @returns {Promise<void>}
 */
async function updateCampaignCurrentSession(campaignId, sessionNumber) {
  try {
    await pool.query(
      `UPDATE campaigns SET current_session = $1, updated_at = NOW() WHERE id = $2`,
      [sessionNumber, campaignId]
    );
    
    console.log(`Updated campaign ${campaignId} to session ${sessionNumber}`);
  } catch (error) {
    console.error("Error updating campaign session:", error);
    throw error;
  }
}

module.exports = {
  generateStoryAdvancement,
  processStoryRewards,
  createCampaignSession,
  updateCampaignCurrentSession
};