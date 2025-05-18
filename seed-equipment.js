// Equipment system seed script - populates the database with common D&D items
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// Create a database connection pool directly
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

// Common D&D 5e weapons
const weapons = [
  {
    name: "Shortsword",
    description: "A light one-handed slashing weapon favored by rogues and agile fighters.",
    itemType: "weapon",
    rarity: "common",
    slot: "main_hand",
    weight: 2,
    value: 10,
    isStackable: false,
    isConsumable: false,
    requiresAttunement: false,
    properties: JSON.stringify({
      damage: "1d6 piercing",
      properties: ["Finesse", "Light"],
      range: "Melee"
    }),
    isSystemItem: true
  },
  {
    name: "Longsword",
    description: "A versatile sword that can be used with one or two hands.",
    itemType: "weapon",
    rarity: "common",
    slot: "main_hand",
    weight: 3,
    value: 15,
    isStackable: false,
    isConsumable: false,
    requiresAttunement: false,
    properties: JSON.stringify({
      damage: "1d8 slashing (1d10 with two hands)",
      properties: ["Versatile"],
      range: "Melee"
    }),
    isSystemItem: true
  },
  {
    name: "Longbow",
    description: "A powerful bow that can strike targets at great range with deadly accuracy.",
    itemType: "weapon",
    rarity: "common",
    slot: "both_hands",
    weight: 2,
    value: 50,
    isStackable: false,
    isConsumable: false,
    requiresAttunement: false,
    properties: JSON.stringify({
      damage: "1d8 piercing",
      properties: ["Ammunition", "Heavy", "Two-Handed"],
      range: "150/600 ft"
    }),
    isSystemItem: true
  },
  {
    name: "Dagger",
    description: "A small knife that can be concealed easily and used for quick strikes.",
    itemType: "weapon",
    rarity: "common",
    slot: "main_hand",
    weight: 1,
    value: 2,
    isStackable: false,
    isConsumable: false,
    requiresAttunement: false,
    properties: JSON.stringify({
      damage: "1d4 piercing",
      properties: ["Finesse", "Light", "Thrown"],
      range: "Melee, 20/60 ft"
    }),
    isSystemItem: true
  }
];

// Common D&D 5e armor
const armor = [
  {
    name: "Leather Armor",
    description: "A supple suit of armor crafted from leather, offering basic protection without restricting movement.",
    itemType: "armor",
    rarity: "common",
    slot: "body",
    weight: 10,
    value: 10,
    isStackable: false,
    isConsumable: false,
    requiresAttunement: false,
    properties: JSON.stringify({
      armorClass: "11 + Dex modifier",
      category: "Light Armor",
      stealthDisadvantage: false
    }),
    isSystemItem: true
  },
  {
    name: "Chain Mail",
    description: "A suit of interconnected metal rings that provides solid protection at the cost of some mobility.",
    itemType: "armor",
    rarity: "common",
    slot: "body",
    weight: 55,
    value: 75,
    isStackable: false,
    isConsumable: false,
    requiresAttunement: false,
    properties: JSON.stringify({
      armorClass: "16",
      category: "Heavy Armor",
      stealthDisadvantage: true,
      strengthRequired: 13
    }),
    isSystemItem: true
  },
  {
    name: "Shield",
    description: "A wooden or metal shield carried in one hand, improving your defensive stance.",
    itemType: "shield",
    rarity: "common",
    slot: "off_hand",
    weight: 6,
    value: 10,
    isStackable: false,
    isConsumable: false,
    requiresAttunement: false,
    properties: JSON.stringify({
      armorClass: "+2",
      category: "Shield"
    }),
    isSystemItem: true
  }
];

// Common D&D 5e magic items
const magicItems = [
  {
    name: "Cloak of Elvenkind",
    description: "While you wear this cloak with its hood up, Wisdom (Perception) checks made to see you have disadvantage, and you have advantage on Dexterity (Stealth) checks made to hide, as the cloak's color shifts to camouflage you.",
    itemType: "wondrous",
    rarity: "uncommon",
    slot: "back",
    weight: 1,
    value: 250,
    isStackable: false,
    isConsumable: false,
    requiresAttunement: true,
    properties: JSON.stringify({
      benefit: "Advantage on Stealth checks, disadvantage on Perception checks to see you",
      attunement: "Requires attunement"
    }),
    isSystemItem: true
  },
  {
    name: "Ring of Protection",
    description: "You gain a +1 bonus to AC and saving throws while wearing this ring.",
    itemType: "ring",
    rarity: "rare",
    slot: "finger",
    weight: 1,
    value: 3500,
    isStackable: false,
    isConsumable: false,
    requiresAttunement: true,
    properties: JSON.stringify({
      benefit: "+1 to AC and all saving throws",
      attunement: "Requires attunement"
    }),
    isSystemItem: true
  },
  {
    name: "Wand of Magic Missiles",
    description: "This wand has 7 charges. While holding it, you can use an action to expend 1 or more charges to cast the Magic Missile spell. The wand regains 1d6+1 expended charges daily at dawn.",
    itemType: "wand",
    rarity: "uncommon",
    slot: "main_hand",
    weight: 1,
    value: 500,
    isStackable: false,
    isConsumable: false,
    requiresAttunement: false,
    properties: JSON.stringify({
      charges: 7,
      spell: "Magic Missile",
      recharge: "1d6+1 charges at dawn"
    }),
    isSystemItem: true
  },
  {
    name: "Flame Tongue Longsword",
    description: "You can use a bonus action to speak this magic sword's command word, causing flames to leap from the blade. While ablaze, the sword deals an extra 2d6 fire damage to any target it hits.",
    itemType: "weapon",
    rarity: "rare",
    slot: "main_hand",
    weight: 3,
    value: 5000,
    isStackable: false,
    isConsumable: false,
    requiresAttunement: true,
    properties: JSON.stringify({
      damage: "1d8 slashing + 2d6 fire (1d10 + 2d6 fire with two hands)",
      properties: ["Versatile", "Magical"],
      range: "Melee",
      attunement: "Requires attunement"
    }),
    isSystemItem: true
  }
];

// Common D&D 5e consumables
const consumables = [
  {
    name: "Potion of Healing",
    description: "You regain 2d4+2 hit points when you drink this potion. The potion's red liquid glimmers when agitated.",
    itemType: "potion",
    rarity: "common",
    slot: "none",
    weight: 0.5,
    value: 50,
    isStackable: true,
    isConsumable: true,
    requiresAttunement: false,
    properties: JSON.stringify({
      effect: "Heals 2d4+2 hit points",
      usageType: "Drink"
    }),
    isSystemItem: true
  },
  {
    name: "Potion of Greater Healing",
    description: "You regain 4d4+4 hit points when you drink this potion. The potion's red liquid glimmers when agitated.",
    itemType: "potion",
    rarity: "uncommon",
    slot: "none",
    weight: 0.5,
    value: 100,
    isStackable: true,
    isConsumable: true,
    requiresAttunement: false,
    properties: JSON.stringify({
      effect: "Heals 4d4+4 hit points",
      usageType: "Drink"
    }),
    isSystemItem: true
  },
  {
    name: "Scroll of Fireball",
    description: "A scroll containing the fireball spell. The scroll crumbles to dust once the spell is cast.",
    itemType: "scroll",
    rarity: "uncommon",
    slot: "none",
    weight: 0.1,
    value: 200,
    isStackable: true,
    isConsumable: true,
    requiresAttunement: false,
    properties: JSON.stringify({
      spellLevel: 3,
      spellName: "Fireball",
      spellcastingAbility: "Intelligence",
      usageType: "Read"
    }),
    isSystemItem: true
  }
];

// Common D&D 5e adventuring gear
const adventuringGear = [
  {
    name: "Backpack",
    description: "A sturdy leather backpack for carrying your adventuring supplies.",
    itemType: "gear",
    rarity: "common",
    slot: "none",
    weight: 5,
    value: 2,
    isStackable: false,
    isConsumable: false,
    requiresAttunement: false,
    properties: JSON.stringify({
      capacity: "30 pounds of gear"
    }),
    isSystemItem: true
  },
  {
    name: "Rope, Hempen (50 feet)",
    description: "Rope, whether made of hemp or silk, has 2 hit points and can be burst with a DC 17 Strength check.",
    itemType: "gear",
    rarity: "common",
    slot: "none",
    weight: 10,
    value: 1,
    isStackable: true,
    isConsumable: false,
    requiresAttunement: false,
    properties: JSON.stringify({
      hitPoints: 2,
      breakDC: 17
    }),
    isSystemItem: true
  },
  {
    name: "Tinderbox",
    description: "This small container holds flint, fire steel, and tinder used to kindle a fire.",
    itemType: "gear",
    rarity: "common",
    slot: "none",
    weight: 1,
    value: 0.5,
    isStackable: false,
    isConsumable: false,
    requiresAttunement: false,
    properties: JSON.stringify({
      usage: "Light a fire in 1 action (or 1 minute in unfavorable conditions)",
    }),
    isSystemItem: true
  }
];

// Combine all items
const allItems = [...weapons, ...armor, ...magicItems, ...consumables, ...adventuringGear];

async function seedEquipment() {
  console.log("Starting to seed equipment items...");
  
  try {
    // Check if items table exists, create if not
    await pool.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        item_type TEXT NOT NULL,
        rarity TEXT NOT NULL DEFAULT 'common',
        slot TEXT NOT NULL,
        weight INTEGER NOT NULL DEFAULT 0,
        value INTEGER NOT NULL DEFAULT 0,
        is_stackable BOOLEAN NOT NULL DEFAULT false,
        is_consumable BOOLEAN NOT NULL DEFAULT false,
        requires_attunement BOOLEAN NOT NULL DEFAULT false,
        properties JSONB NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL,
        updated_at TEXT,
        created_by INTEGER,
        is_system_item BOOLEAN NOT NULL DEFAULT true
      )
    `);
    
    // Check if character_items table exists, create if not
    await pool.query(`
      CREATE TABLE IF NOT EXISTS character_items (
        id SERIAL PRIMARY KEY,
        character_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        is_equipped BOOLEAN NOT NULL DEFAULT false,
        is_attuned BOOLEAN NOT NULL DEFAULT false,
        custom_name TEXT,
        custom_description TEXT,
        custom_properties JSONB,
        acquired_at TEXT NOT NULL,
        notes TEXT
      )
    `);
    
    // Check for existing items to avoid duplicates
    const existingItems = await pool.query(`SELECT name FROM items WHERE is_system_item = true`);
    const existingItemNames = existingItems.rows.map(row => row.name);
    
    console.log(`Found ${existingItemNames.length} existing system items.`);
    
    // Filter out items that already exist
    const newItems = allItems.filter(item => !existingItemNames.includes(item.name));
    
    console.log(`Adding ${newItems.length} new equipment items...`);
    
    // Insert new items
    for (const item of newItems) {
      await pool.query(`
        INSERT INTO items (
          name, description, item_type, rarity, slot, weight, value, 
          is_stackable, is_consumable, requires_attunement, properties,
          created_at, is_system_item
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        item.name,
        item.description,
        item.itemType,
        item.rarity,
        item.slot,
        item.weight,
        item.value,
        item.isStackable,
        item.isConsumable,
        item.requiresAttunement,
        item.properties,
        new Date().toISOString(),
        true
      ]);
      
      console.log(`Added: ${item.name}`);
    }
    
    console.log("Equipment seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding equipment:", error);
  } finally {
    await pool.end();
  }
}

// Run the seed function
seedEquipment().catch(console.error);