import { storage } from "../storage";
import { CampaignSession } from "@shared/schema";

// Helper function to award rewards to characters after completing a session
export async function awardSessionRewards(characterId: number, session: CampaignSession): Promise<void> {
  try {
    const character = await storage.getCharacter(characterId);
    if (!character) {
      console.error(`Character ${characterId} not found for awarding rewards`);
      return;
    }
    
    // 1. Award XP if defined in the session
    if (session.sessionXpReward) {
      // Update character XP and potentially level
      await storage.updateCharacter(characterId, {
        experience: (character.experience || 0) + session.sessionXpReward
      });
      console.log(`Awarded ${session.sessionXpReward} XP to character ${character.name}`);
    }
    
    // 2. Award currency based on session difficulty and character level
    const level = character.level || 1;
    
    // Calculate reward based on level and randomness
    const goldReward = Math.floor(5 + (level * 2) + (Math.random() * level * 3));
    const silverReward = Math.floor(10 + (level * 3) + (Math.random() * level * 5));
    const copperReward = Math.floor(15 + (level * 5) + (Math.random() * level * 10));
    
    // Award currency
    await storage.updateCharacter(characterId, {
      goldCoins: (character.goldCoins || 0) + goldReward,
      silverCoins: (character.silverCoins || 0) + silverReward,
      copperCoins: (character.copperCoins || 0) + copperReward
    });
    
    // Record currency transaction
    await storage.addCurrencyTransaction({
      characterId,
      amount: (goldReward * 10000) + (silverReward * 100) + copperReward,
      reason: 'quest_reward',
      referenceId: session.id,
      referenceType: 'campaign_session'
    });
    
    console.log(`Awarded currency to ${character.name}: ${goldReward}g, ${silverReward}s, ${copperReward}c`);
    
    // 3. Potentially award an item (30% chance)
    if (Math.random() < 0.3) {
      try {
        // Get all items appropriate for the character's level
        const allItems = await storage.getAllItems();
        const appropriateItems = allItems.filter(item => {
          const requiredLevel = item.requiredLevel || 1;
          return requiredLevel <= level + 2; // Allow items up to 2 levels higher
        });
        
        if (appropriateItems.length > 0) {
          // Choose a random item, with rarer items having a lower chance
          let itemPool = [...appropriateItems];
          if (Math.random() < 0.7) {
            // 70% chance to only get common items
            itemPool = itemPool.filter(item => item.rarity === 'common');
          } else if (Math.random() < 0.8) {
            // 80% of the remaining 30% (24% overall) to get uncommon or common
            itemPool = itemPool.filter(item => ['common', 'uncommon'].includes(item.rarity));
          }
          // Remaining 6% chance to get any rarity
          
          if (itemPool.length === 0) {
            itemPool = appropriateItems; // Fallback to all appropriate items
          }
          
          const randomItem = itemPool[Math.floor(Math.random() * itemPool.length)];
          
          // Add item to character inventory
          await storage.addItemToCharacter({
            characterId,
            itemId: randomItem.id,
            quantity: 1,
            acquiredFrom: 'quest_reward',
            notes: `Reward from completing "${session.title}"`,
            acquiredAt: new Date().toISOString()
          });
          
          console.log(`Awarded item "${randomItem.name}" to character ${character.name}`);
        }
      } catch (itemError) {
        console.error(`Error awarding item to character ${characterId}:`, itemError);
      }
    }
  } catch (error) {
    console.error(`Error in awardSessionRewards for character ${characterId}:`, error);
    throw error;
  }
}