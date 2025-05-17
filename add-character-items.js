// Script to add items and currency to characters
import { db } from './server/db.js';
import { characters, characterItems, currencyTransactions, items } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function addItemsToCharacters() {
  try {
    console.log("Starting character inventory and currency seeding...");
    
    // Get all characters
    const allCharacters = await db.select().from(characters);
    console.log(`Found ${allCharacters.length} characters to process`);
    
    if (allCharacters.length === 0) {
      console.log("No characters found to seed");
      return;
    }
    
    // Get all items
    const allItems = await db.select().from(items);
    console.log(`Found ${allItems.length} items available for inventory`);
    
    if (allItems.length === 0) {
      console.log("No items available in the database. Run seed-items.js first.");
      return;
    }
    
    // Filter items by type
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
          const meleeWeapons = weapons.filter(w => 
            w.name.toLowerCase().includes('sword') || 
            w.name.toLowerCase().includes('axe') || 
            w.name.toLowerCase().includes('hammer')
          );
          if (meleeWeapons.length > 0) {
            itemsToAdd.push(...meleeWeapons.slice(0, 2));
          }
        } else if (characterClass.includes('ranger') || characterClass.includes('rogue')) {
          // Ranged/finesse characters
          const rangedWeapons = weapons.filter(w => 
            w.name.toLowerCase().includes('bow') || 
            w.name.toLowerCase().includes('dagger')
          );
          if (rangedWeapons.length > 0) {
            itemsToAdd.push(...rangedWeapons.slice(0, 2));
          }
        } else if (characterClass.includes('wizard') || characterClass.includes('sorcerer') || characterClass.includes('warlock')) {
          // Magic users
          const staffs = weapons.filter(w => w.name.toLowerCase().includes('staff'));
          if (staffs.length > 0) {
            itemsToAdd.push(staffs[0]);
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
            itemsToAdd.push(heavyArmor[0]);
          }
        } else if (characterClass.includes('rogue') || characterClass.includes('ranger') || characterClass.includes('monk')) {
          // Light armor users
          const lightArmor = armor.filter(a => a.name.toLowerCase().includes('leather'));
          if (lightArmor.length > 0) {
            itemsToAdd.push(lightArmor[0]);
          }
        }
        
        // Add some basic gear for all characters
        if (gear.length > 0) {
          itemsToAdd.push(...gear.slice(0, Math.min(2, gear.length)));
        }
        
        // Add a potion
        if (potions.length > 0) {
          itemsToAdd.push(potions[0]);
        }
        
        // If no items were found based on class, add some generic starting equipment
        if (itemsToAdd.length === 0 && allItems.length > 0) {
          itemsToAdd = allItems.slice(0, Math.min(3, allItems.length));
        }
        
        // Add items to character inventory
        for (const item of itemsToAdd) {
          const isEquippable = ['weapon', 'armor'].includes(item.type || '');
          await db.insert(characterItems).values({
            characterId: character.id,
            itemId: item.id,
            quantity: 1,
            isEquipped: isEquippable, // Equip weapons and armor by default
            acquiredFrom: 'character_creation',
            notes: 'Initial character equipment',
            acquiredAt: new Date().toISOString()
          });
          
          console.log(`Added ${item.name} to ${character.name}'s inventory`);
        }
      }
      
      // Check if character already has currency set
      if ((character.goldCoins !== null && character.goldCoins !== undefined) ||
          (character.silverCoins !== null && character.silverCoins !== undefined) ||
          (character.copperCoins !== null && character.copperCoins !== undefined)) {
        console.log(`Character ${character.name} already has some currency set. Skipping currency seeding.`);
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
  }
}

// Run the script
addItemsToCharacters();