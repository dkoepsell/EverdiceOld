import { pool } from './server/db.js';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { characters, characterItems, currencyTransactions } from './shared/schema.js';
import { eq } from 'drizzle-orm';

// This script seeds all existing characters with inventory items and currency
async function seedCharacters() {
  try {
    const db = drizzle(pool);
    
    console.log("Starting character inventory and currency seeding...");
    
    // Get all characters
    const allCharacters = await db.select().from(characters);
    console.log(`Found ${allCharacters.length} characters to process`);
    
    if (allCharacters.length === 0) {
      console.log("No characters found to seed");
      return;
    }
    
    // Get all items
    const allItems = await db.query.items.findMany();
    console.log(`Found ${allItems.length} items available for inventory`);
    
    if (allItems.length === 0) {
      console.log("No items available in the database. Run seed-items.js first.");
      return;
    }
    
    // Filter items by type for different character classes
    const weapons = allItems.filter(item => item.type === 'weapon');
    const armor = allItems.filter(item => item.type === 'armor');
    const gear = allItems.filter(item => item.type === 'gear');
    const potions = allItems.filter(item => item.type === 'potion');
    
    // Process each character
    for (const character of allCharacters) {
      console.log(`Processing character: ${character.name} (ID: ${character.id})`);
      
      // Check if character already has items
      const existingItems = await db.select()
        .from(characterItems)
        .where(eq(characterItems.characterId, character.id));
      
      if (existingItems.length > 0) {
        console.log(`Character ${character.name} already has ${existingItems.length} items. Skipping inventory seeding.`);
      } else {
        // Add class-appropriate items
        const characterClass = character.class?.toLowerCase() || '';
        let itemsToAdd = [];
        
        // Add weapons based on class
        if (characterClass.includes('fighter') || characterClass.includes('barbarian') || characterClass.includes('paladin')) {
          // Melee combat characters
          itemsToAdd.push(...weapons.filter(w => 
            w.name.toLowerCase().includes('sword') || 
            w.name.toLowerCase().includes('axe') || 
            w.name.toLowerCase().includes('hammer')
          ).slice(0, 2));
        } else if (characterClass.includes('ranger') || characterClass.includes('rogue')) {
          // Ranged/finesse characters
          itemsToAdd.push(...weapons.filter(w => 
            w.name.toLowerCase().includes('bow') || 
            w.name.toLowerCase().includes('dagger')
          ).slice(0, 2));
        } else if (characterClass.includes('wizard') || characterClass.includes('sorcerer') || characterClass.includes('warlock')) {
          // Magic users
          const wandItem = allItems.find(i => i.type === 'wand');
          if (wandItem) itemsToAdd.push(wandItem);
        }
        
        // Add armor based on class
        if (characterClass.includes('fighter') || characterClass.includes('paladin')) {
          // Heavy armor users
          const heavyArmor = armor.find(a => a.name.toLowerCase().includes('chain') || a.name.toLowerCase().includes('plate'));
          if (heavyArmor) itemsToAdd.push(heavyArmor);
        } else if (characterClass.includes('rogue') || characterClass.includes('ranger') || characterClass.includes('monk')) {
          // Light armor users
          const lightArmor = armor.find(a => a.name.toLowerCase().includes('leather'));
          if (lightArmor) itemsToAdd.push(lightArmor);
        }
        
        // Add some basic gear for all characters
        if (gear.length > 0) {
          itemsToAdd.push(...gear.slice(0, 2));
        }
        
        // Add a potion
        if (potions.length > 0) {
          itemsToAdd.push(potions[0]);
        }
        
        // Add items to character inventory
        for (const item of itemsToAdd) {
          await db.insert(characterItems).values({
            characterId: character.id,
            itemId: item.id,
            quantity: 1,
            isEquipped: ['weapon', 'armor'].includes(item.type), // Equip weapons and armor by default
            acquiredFrom: 'character_creation',
            notes: 'Initial character equipment',
            acquiredAt: new Date().toISOString()
          });
          
          console.log(`Added ${item.name} to ${character.name}'s inventory`);
        }
      }
      
      // Check if character already has currency set
      if (character.goldCoins !== null && character.goldCoins !== undefined &&
          character.silverCoins !== null && character.silverCoins !== undefined &&
          character.copperCoins !== null && character.copperCoins !== undefined) {
        console.log(`Character ${character.name} already has currency set. Skipping currency seeding.`);
      } else {
        // Set currency based on character level
        const level = character.level || 1;
        const goldAmount = 5 + (level * 3); // 5 gold + 3 per level
        const silverAmount = 8 + (level * 5); // 8 silver + 5 per level
        const copperAmount = 15 + (level * 10); // 15 copper + 10 per level
        
        // Update character currency
        await db.update(characters)
          .set({
            goldCoins: goldAmount,
            silverCoins: silverAmount,
            copperCoins: copperAmount
          })
          .where(eq(characters.id, character.id));
        
        console.log(`Set ${character.name}'s currency to: ${goldAmount}g, ${silverAmount}s, ${copperAmount}c`);
        
        // Record currency transaction
        await db.insert(currencyTransactions).values({
          characterId: character.id,
          amount: (goldAmount * 10000) + (silverAmount * 100) + copperAmount,
          reason: 'starting_funds',
          referenceType: 'character_creation',
          createdAt: new Date().toISOString()
        });
      }
    }
    
    console.log("Character inventory and currency seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding characters:", error);
  } finally {
    await pool.end();
  }
}

// Run the seeding function
seedCharacters();