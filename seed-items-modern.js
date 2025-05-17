// Modern ESM script to seed all characters with inventory and currency
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq } from 'drizzle-orm';
import ws from 'ws';

// Setup for Neon serverless
neonConfig.webSocketConstructor = ws;

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// Define the tables directly for simplicity
const charactersTable = { name: 'characters' };
const itemsTable = { name: 'items' };
const characterItemsTable = { name: 'character_items' };
const currencyTransactionsTable = { name: 'currency_transactions' };

async function seedItems() {
  try {
    console.log("Starting character inventory seeding...");
    
    // Fetch all characters
    const characters = await db.select().from(charactersTable);
    console.log(`Found ${characters.length} characters to seed with items`);
    
    // Fetch all items
    const items = await db.select().from(itemsTable);
    console.log(`Found ${items.length} available items`);
    
    if (items.length === 0) {
      console.error("No items found in the database. Please run the item seeding script first.");
      return;
    }
    
    // Group items by type
    const categorizedItems = {
      weapon: items.filter(i => i.type === 'weapon'),
      armor: items.filter(i => i.type === 'armor'),
      clothing: items.filter(i => i.type === 'clothing'),
      gear: items.filter(i => i.type === 'gear'),
      potion: items.filter(i => i.type === 'potion'),
      scroll: items.filter(i => i.type === 'scroll'),
      misc: items.filter(i => i.type === 'misc')
    };
    
    // Process each character
    for (const character of characters) {
      console.log(`Processing ${character.name} (ID: ${character.id})`);
      
      // Check if character already has items
      const existingItems = await db.select()
        .from(characterItemsTable)
        .where(eq(characterItemsTable.characterId, character.id));
      
      if (existingItems.length > 0) {
        console.log(`Character ${character.name} already has ${existingItems.length} items`);
        
        // If they have fewer than 5 items, let's add some more
        if (existingItems.length < 5) {
          console.log(`Adding more items since they only have ${existingItems.length} items`);
          await addItemsForCharacter(character, categorizedItems, 5 - existingItems.length);
        }
      } else {
        // Add a full set of items for a new character
        console.log(`Adding initial items for ${character.name}`);
        await addItemsForCharacter(character, categorizedItems, 8);
      }
      
      // Ensure character has currency
      await ensureCharacterCurrency(character);
    }
    
    console.log("Character inventory and currency seeding complete!");
  } catch (error) {
    console.error("Error seeding character items:", error);
  } finally {
    await pool.end();
  }
}

async function addItemsForCharacter(character, categorizedItems, itemCount) {
  const characterClass = character.class?.toLowerCase() || '';
  let itemsToAdd = [];
  
  // Add weapons based on class
  if (characterClass.includes('fighter') || characterClass.includes('barbarian') || characterClass.includes('paladin')) {
    // Melee characters get heavy weapons
    const meleeOptions = categorizedItems.weapon.filter(w => 
      w.name.toLowerCase().includes('sword') || 
      w.name.toLowerCase().includes('axe') || 
      w.name.toLowerCase().includes('hammer') ||
      w.name.toLowerCase().includes('mace')
    );
    
    if (meleeOptions.length > 0) {
      // Pick 1-2 random weapons
      const shuffled = [...meleeOptions].sort(() => 0.5 - Math.random());
      itemsToAdd.push(...shuffled.slice(0, Math.min(2, shuffled.length)));
    }
  } else if (characterClass.includes('ranger') || characterClass.includes('rogue')) {
    // Ranged/finesse characters
    const rangedOptions = categorizedItems.weapon.filter(w => 
      w.name.toLowerCase().includes('bow') || 
      w.name.toLowerCase().includes('dagger') ||
      w.name.toLowerCase().includes('short')
    );
    
    if (rangedOptions.length > 0) {
      const shuffled = [...rangedOptions].sort(() => 0.5 - Math.random());
      itemsToAdd.push(...shuffled.slice(0, Math.min(2, shuffled.length)));
    }
  } else if (characterClass.includes('wizard') || characterClass.includes('sorcerer') || characterClass.includes('warlock')) {
    // Magic users
    const magicOptions = categorizedItems.weapon.filter(w => 
      w.name.toLowerCase().includes('staff') || 
      w.name.toLowerCase().includes('wand') ||
      w.name.toLowerCase().includes('orb')
    );
    
    if (magicOptions.length > 0) {
      const shuffled = [...magicOptions].sort(() => 0.5 - Math.random());
      itemsToAdd.push(shuffled[0]);
      
      // Add scrolls for magic users
      if (categorizedItems.scroll.length > 0) {
        const shuffledScrolls = [...categorizedItems.scroll].sort(() => 0.5 - Math.random());
        itemsToAdd.push(...shuffledScrolls.slice(0, Math.min(2, shuffledScrolls.length)));
      }
    }
  }
  
  // Add armor based on class
  if (characterClass.includes('fighter') || characterClass.includes('paladin')) {
    // Heavy armor for fighter types
    const heavyOptions = categorizedItems.armor.filter(a => 
      a.name.toLowerCase().includes('plate') || 
      a.name.toLowerCase().includes('chain') ||
      a.name.toLowerCase().includes('shield')
    );
    
    if (heavyOptions.length > 0) {
      const shuffled = [...heavyOptions].sort(() => 0.5 - Math.random());
      itemsToAdd.push(shuffled[0]);
      
      // Add a shield if one is available
      const shield = heavyOptions.find(a => a.name.toLowerCase().includes('shield'));
      if (shield) itemsToAdd.push(shield);
    }
  } else if (characterClass.includes('ranger') || characterClass.includes('monk') || characterClass.includes('rogue')) {
    // Medium/light armor
    const lightOptions = categorizedItems.armor.filter(a => 
      a.name.toLowerCase().includes('leather') || 
      a.name.toLowerCase().includes('studded') ||
      a.name.toLowerCase().includes('hide')
    );
    
    if (lightOptions.length > 0) {
      const shuffled = [...lightOptions].sort(() => 0.5 - Math.random());
      itemsToAdd.push(shuffled[0]);
    }
  } else if (characterClass.includes('wizard') || characterClass.includes('sorcerer')) {
    // Cloth wearers
    const robeOptions = categorizedItems.armor.filter(a => 
      a.name.toLowerCase().includes('robe') || 
      a.name.toLowerCase().includes('cloth')
    );
    
    if (robeOptions.length > 0) {
      const shuffled = [...robeOptions].sort(() => 0.5 - Math.random());
      itemsToAdd.push(shuffled[0]);
    }
  }
  
  // Add clothing for all characters
  if (categorizedItems.clothing.length > 0) {
    const shuffled = [...categorizedItems.clothing].sort(() => 0.5 - Math.random());
    itemsToAdd.push(...shuffled.slice(0, Math.min(2, shuffled.length)));
  }
  
  // Add some basic gear for all characters
  if (categorizedItems.gear.length > 0) {
    const shuffled = [...categorizedItems.gear].sort(() => 0.5 - Math.random());
    itemsToAdd.push(...shuffled.slice(0, Math.min(3, shuffled.length)));
  }
  
  // Add potions
  if (categorizedItems.potion.length > 0) {
    const shuffled = [...categorizedItems.potion].sort(() => 0.5 - Math.random());
    itemsToAdd.push(...shuffled.slice(0, Math.min(2, shuffled.length)));
  }
  
  // Add misc items
  if (categorizedItems.misc.length > 0) {
    const shuffled = [...categorizedItems.misc].sort(() => 0.5 - Math.random());
    itemsToAdd.push(...shuffled.slice(0, Math.min(2, shuffled.length)));
  }
  
  // Remove duplicates and limit to requested item count
  itemsToAdd = Array.from(new Map(itemsToAdd.map(item => [item.id, item])).values())
    .slice(0, itemCount);
  
  console.log(`Adding ${itemsToAdd.length} items to ${character.name}'s inventory`);
  
  // Add each item to the character's inventory
  for (const item of itemsToAdd) {
    // Determine if it should be equipped
    const shouldEquip = ['weapon', 'armor'].includes(item.type);
    const quantity = ['potion', 'scroll', 'misc'].includes(item.type)
      ? Math.floor(Math.random() * 3) + 1  // 1-3 for consumables
      : 1;                                 // 1 for equipment
      
    await db.insert(characterItemsTable).values({
      characterId: character.id,
      itemId: item.id,
      quantity: quantity,
      isEquipped: shouldEquip,
      acquiredFrom: 'character_creation',
      notes: 'Initial character equipment',
      acquiredAt: new Date().toISOString()
    });
    
    console.log(`Added ${item.name} to ${character.name}'s inventory`);
  }
}

async function ensureCharacterCurrency(character) {
  // Skip if character already has significant currency
  if ((character.goldCoins > 0) || (character.silverCoins > 0) || (character.copperCoins > 10)) {
    console.log(`Character ${character.name} already has currency: ${character.goldCoins || 0}g, ${character.silverCoins || 0}s, ${character.copperCoins || 0}c`);
    return;
  }
  
  // Set currency based on level with some randomness
  const level = character.level || 1;
  const baseAmount = 15 + (level * 5);  // Base amount increases with level
  const randomFactor = Math.random() * 0.5 + 0.75;  // 75% to 125% of base
  
  const totalCopper = Math.floor(baseAmount * randomFactor * 100);
  
  // Convert to gold/silver/copper with proper denominations
  const goldAmount = Math.floor(totalCopper / 10000);
  const silverAmount = Math.floor((totalCopper % 10000) / 100);
  const copperAmount = totalCopper % 100;
  
  console.log(`Setting currency for ${character.name} (level ${level}): ${goldAmount}g, ${silverAmount}s, ${copperAmount}c`);
  
  // Update character currency
  await db.update(charactersTable)
    .set({
      goldCoins: goldAmount,
      silverCoins: silverAmount,
      copperCoins: copperAmount
    })
    .where(eq(charactersTable.id, character.id));
  
  // Record transaction in ledger
  await db.insert(currencyTransactionsTable).values({
    characterId: character.id,
    amount: totalCopper,
    reason: 'starting_funds',
    referenceType: 'character_creation',
    createdAt: new Date().toISOString()
  });
  
  console.log(`Updated ${character.name}'s currency to ${goldAmount}g, ${silverAmount}s, ${copperAmount}c`);
}

// Run the seed function
seedItems();