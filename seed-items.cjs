// CommonJS version for seeding items and currency
const { Pool } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seedCharactersWithItems() {
  try {
    console.log("Starting character inventory seeding...");
    
    // Get all characters
    const charactersResult = await pool.query(`SELECT * FROM characters`);
    const characters = charactersResult.rows;
    console.log(`Found ${characters.length} characters to process`);
    
    // Get all items
    const itemsResult = await pool.query(`SELECT * FROM items`);
    const items = itemsResult.rows;
    console.log(`Found ${items.length} items available for inventory`);
    
    if (items.length === 0) {
      console.log("No items available in the database. Run seed-items.sql first.");
      return;
    }
    
    // Filter items by type
    const weapons = items.filter(item => item.type === 'weapon');
    const armor = items.filter(item => item.type === 'armor');
    const gear = items.filter(item => item.type === 'gear');
    const potions = items.filter(item => item.type === 'potion');
    
    console.log(`Found ${weapons.length} weapons, ${armor.length} armor, ${gear.length} gear, ${potions.length} potions`);
    
    // Process each character
    for (const character of characters) {
      console.log(`Processing character: ${character.name} (ID: ${character.id})`);
      
      // Check if character already has items
      const existingItemsResult = await pool.query(
        `SELECT COUNT(*) FROM character_items WHERE character_id = $1`, 
        [character.id]
      );
      
      const existingItemsCount = parseInt(existingItemsResult.rows[0].count);
      
      if (existingItemsCount > 0) {
        console.log(`Character ${character.name} already has ${existingItemsCount} items. Skipping inventory seeding.`);
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
        if (itemsToAdd.length === 0 && items.length > 0) {
          itemsToAdd = items.slice(0, Math.min(3, items.length));
        }
        
        console.log(`Adding ${itemsToAdd.length} items to ${character.name}'s inventory`);
        
        // Add items to character inventory
        for (const item of itemsToAdd) {
          const isEquippable = ['weapon', 'armor'].includes(item.type || '');
          
          await pool.query(`
            INSERT INTO character_items 
              (character_id, item_id, quantity, is_equipped, acquired_from, notes, acquired_at)
            VALUES 
              ($1, $2, $3, $4, $5, $6, $7)
          `, [
            character.id,
            item.id,
            1,
            isEquippable,
            'character_creation',
            'Initial character equipment',
            new Date().toISOString()
          ]);
          
          console.log(`Added ${item.name} to ${character.name}'s inventory`);
        }
      }
      
      // Check if character already has currency set
      if ((character.gold_coins !== null && character.gold_coins !== undefined) ||
          (character.silver_coins !== null && character.silver_coins !== undefined) ||
          (character.copper_coins !== null && character.copper_coins !== undefined)) {
        console.log(`Character ${character.name} already has some currency set. Skipping currency seeding.`);
      } else {
        // Set currency based on character level
        const level = character.level || 1;
        const goldAmount = 5 + (level * 3); // 5 gold + 3 per level
        const silverAmount = 8 + (level * 5); // 8 silver + 5 per level
        const copperAmount = 15 + (level * 10); // 15 copper + 10 per level
        
        console.log(`Setting currency for ${character.name} (level ${level}): ${goldAmount}g, ${silverAmount}s, ${copperAmount}c`);
        
        // Update character currency
        await pool.query(`
          UPDATE characters
          SET gold_coins = $1, silver_coins = $2, copper_coins = $3
          WHERE id = $4
        `, [goldAmount, silverAmount, copperAmount, character.id]);
        
        console.log(`Set ${character.name}'s currency to: ${goldAmount}g, ${silverAmount}s, ${copperAmount}c`);
        
        // Record currency transaction
        await pool.query(`
          INSERT INTO currency_transactions
            (character_id, amount, reason, reference_type, created_at)
          VALUES
            ($1, $2, $3, $4, $5)
        `, [
          character.id,
          (goldAmount * 10000) + (silverAmount * 100) + copperAmount,
          'starting_funds',
          'character_creation',
          new Date().toISOString()
        ]);
        
        console.log(`Recorded initial currency transaction for ${character.name}`);
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
seedCharactersWithItems();