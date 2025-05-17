// Script to add items and currency to all characters
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq } from 'drizzle-orm';
import ws from 'ws';

// Setup for Neon serverless
neonConfig.webSocketConstructor = ws;

// Initialize database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// Define tables for direct reference
const charactersTable = { name: 'characters' };
const itemsTable = { name: 'items' };
const characterItemsTable = { name: 'character_items' };
const currencyTransactionsTable = { name: 'currency_transactions' };

async function seedCharacterInventory() {
  try {
    console.log("Starting character inventory and currency seeding...");
    
    // Get all characters
    const allCharacters = await db.select().from(charactersTable);
    console.log(`Found ${allCharacters.length} characters to process`);
    
    // Get all items
    const allItems = await db.select().from(itemsTable);
    console.log(`Found ${allItems.length} items available for inventory`);
    
    // Filter items by type
    const weapons = allItems.filter(item => item.type === 'weapon');
    const armor = allItems.filter(item => item.type === 'armor');
    const gear = allItems.filter(item => item.type === 'gear');
    const clothing = allItems.filter(item => item.type === 'clothing');
    const potions = allItems.filter(item => item.type === 'potion');
    const scrolls = allItems.filter(item => item.type === 'scroll');
    const misc = allItems.filter(item => item.type === 'misc');
    
    // Process each character
    for (const character of allCharacters) {
      console.log(`Processing character: ${character.name} (ID: ${character.id})`);
      
      // Check if character already has items
      const existingItems = await db.select()
        .from(characterItemsTable)
        .where(eq(characterItemsTable.characterId, character.id));
      
      if (existingItems.length > 0) {
        console.log(`Character ${character.name} already has ${existingItems.length} items. Skipping inventory seeding.`);
      } else {
        // Add class-appropriate items
        const characterClass = character.class?.toLowerCase() || '';
        let itemsToAdd = [];
        
        // Add weapons based on class
        if (characterClass.includes('fighter') || characterClass.includes('barbarian') || characterClass.includes('paladin')) {
          // Melee combat characters - add 2 random weapons
          const meleeWeapons = weapons.filter(w => 
            w.name.toLowerCase().includes('sword') || 
            w.name.toLowerCase().includes('axe') || 
            w.name.toLowerCase().includes('hammer')
          );
          if (meleeWeapons.length > 0) {
            // Add 2 random melee weapons
            const shuffled = [...meleeWeapons].sort(() => 0.5 - Math.random());
            itemsToAdd.push(...shuffled.slice(0, Math.min(2, shuffled.length)));
          }
        } else if (characterClass.includes('ranger') || characterClass.includes('rogue')) {
          // Ranged/finesse characters
          const rangedWeapons = weapons.filter(w => 
            w.name.toLowerCase().includes('bow') || 
            w.name.toLowerCase().includes('dagger') ||
            w.name.toLowerCase().includes('short')
          );
          if (rangedWeapons.length > 0) {
            const shuffled = [...rangedWeapons].sort(() => 0.5 - Math.random());
            itemsToAdd.push(...shuffled.slice(0, Math.min(2, shuffled.length)));
          }
        } else if (characterClass.includes('wizard') || characterClass.includes('sorcerer') || characterClass.includes('warlock')) {
          // Magic users
          const magicItems = weapons.filter(w => 
            w.name.toLowerCase().includes('staff') || 
            w.name.toLowerCase().includes('wand')
          );
          if (magicItems.length > 0) {
            const shuffled = [...magicItems].sort(() => 0.5 - Math.random());
            itemsToAdd.push(shuffled[0]);
          }
          
          // Add scrolls for magic users
          if (scrolls.length > 0) {
            const shuffled = [...scrolls].sort(() => 0.5 - Math.random());
            itemsToAdd.push(...shuffled.slice(0, Math.min(2, shuffled.length)));
          }
        }
        
        // Add armor based on class
        if (characterClass.includes('fighter') || characterClass.includes('paladin')) {
          // Heavy armor users
          const heavyArmor = armor.filter(a => 
            a.name.toLowerCase().includes('chain') || 
            a.name.toLowerCase().includes('plate')
          );
          if (heavyArmor.length > 0) {
            const shuffled = [...heavyArmor].sort(() => 0.5 - Math.random());
            itemsToAdd.push(shuffled[0]);
          }
        } else if (characterClass.includes('rogue') || characterClass.includes('ranger') || characterClass.includes('monk')) {
          // Light armor users
          const lightArmor = armor.filter(a => 
            a.name.toLowerCase().includes('leather') ||
            a.name.toLowerCase().includes('hide')
          );
          if (lightArmor.length > 0) {
            const shuffled = [...lightArmor].sort(() => 0.5 - Math.random());
            itemsToAdd.push(shuffled[0]);
          }
        } else if (characterClass.includes('wizard') || characterClass.includes('sorcerer')) {
          // Cloth wearers
          const robes = armor.filter(a => 
            a.name.toLowerCase().includes('robe') ||
            a.name.toLowerCase().includes('cloth')
          );
          if (robes.length > 0) {
            const shuffled = [...robes].sort(() => 0.5 - Math.random());
            itemsToAdd.push(shuffled[0]);
          }
        }
        
        // Add clothing for all characters
        if (clothing.length > 0) {
          const shuffled = [...clothing].sort(() => 0.5 - Math.random());
          itemsToAdd.push(...shuffled.slice(0, Math.min(2, shuffled.length)));
        }
        
        // Add some basic gear for all characters
        if (gear.length > 0) {
          const shuffled = [...gear].sort(() => 0.5 - Math.random());
          itemsToAdd.push(...shuffled.slice(0, Math.min(3, shuffled.length)));
        }
        
        // Add potions
        if (potions.length > 0) {
          const shuffled = [...potions].sort(() => 0.5 - Math.random());
          itemsToAdd.push(...shuffled.slice(0, Math.min(2, shuffled.length)));
        }
        
        // Add misc items
        if (misc.length > 0) {
          const shuffled = [...misc].sort(() => 0.5 - Math.random());
          itemsToAdd.push(...shuffled.slice(0, Math.min(2, shuffled.length)));
        }
        
        // If no items were found based on class, add some generic starting equipment
        if (itemsToAdd.length === 0 && allItems.length > 0) {
          const shuffled = [...allItems].sort(() => 0.5 - Math.random());
          itemsToAdd = shuffled.slice(0, Math.min(5, shuffled.length));
        }
        
        // Remove duplicates by ID
        itemsToAdd = Array.from(new Map(itemsToAdd.map(item => [item.id, item])).values());
        
        console.log(`Adding ${itemsToAdd.length} items to ${character.name}'s inventory`);
        
        // Add items to character inventory
        for (const item of itemsToAdd) {
          // Determine if item should be equipped by default
          const shouldEquip = ['weapon', 'armor'].includes(item.type) && 
                             // Only equip the first item of each type
                             !itemsToAdd.filter(i => i.type === item.type && i.id < item.id).length > 0;
          
          await db.insert(characterItemsTable).values({
            characterId: character.id,
            itemId: item.id,
            quantity: ['potion', 'scroll', 'misc'].includes(item.type) ? Math.floor(Math.random() * 3) + 1 : 1,
            isEquipped: shouldEquip,
            acquiredFrom: 'character_creation',
            notes: 'Standard starting equipment',
            acquiredAt: new Date().toISOString()
          });
          
          console.log(`Added ${item.name} to ${character.name}'s inventory`);
        }
      }
      
      // Update character currency
      const level = character.level || 1;
      
      // Set currency based on level and add some randomness
      const baseCurrency = 15 + (level * 5); // Base amount scales with level
      const randomFactor = Math.random() * 0.5 + 0.75; // 75% to 125% of base amount
      
      const totalCopper = Math.floor(baseCurrency * randomFactor * 100);
      
      // Convert to gold/silver/copper denominations
      const goldAmount = Math.floor(totalCopper / 100 / 100);
      const silverAmount = Math.floor((totalCopper - (goldAmount * 100 * 100)) / 100);
      const copperAmount = totalCopper - (goldAmount * 100 * 100) - (silverAmount * 100);
      
      console.log(`Setting currency for ${character.name} (level ${level}): ${goldAmount}g, ${silverAmount}s, ${copperAmount}c`);
      
      // Update character currency
      await db.update(charactersTable)
        .set({
          goldCoins: goldAmount,
          silverCoins: silverAmount,
          copperCoins: copperAmount
        })
        .where(eq(charactersTable.id, character.id));
      
      console.log(`Set ${character.name}'s currency to: ${goldAmount}g, ${silverAmount}s, ${copperAmount}c`);
      
      // Record currency transaction
      await db.insert(currencyTransactionsTable).values({
        characterId: character.id,
        amount: (goldAmount * 10000) + (silverAmount * 100) + copperAmount,
        reason: 'starting_funds',
        referenceType: 'character_creation',
        createdAt: new Date().toISOString()
      });
      
      console.log(`Recorded initial currency transaction for ${character.name}`);
    }
    
    console.log("Character inventory and currency seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding character inventory:", error);
  } finally {
    await pool.end();
  }
}

// Run the seeding function
seedCharacterInventory();