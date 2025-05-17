import { pool } from './server/db.js';
import { items } from './shared/schema.js';
import { drizzle } from 'drizzle-orm/neon-serverless';

// Sample D&D items to populate the database
const sampleItems = [
  {
    name: "Longsword",
    description: "A versatile one-handed slashing weapon. Can be wielded with two hands for additional damage.",
    type: "weapon",
    rarity: "common",
    value: 1500, // 15 gold
    properties: JSON.stringify({
      damage: "1d8 (1d10 two-handed)",
      damageType: "slashing",
      weight: "3 lb",
      properties: "Versatile"
    }),
    requiredLevel: 1,
    equipSlot: "mainHand",
    isConsumable: false,
    weight: 30, // 3 lb, stored in tenths of lb
    imageUrl: null
  },
  {
    name: "Leather Armor",
    description: "A set of light armor made from treated animal hide that provides basic protection.",
    type: "armor",
    rarity: "common",
    value: 1000, // 10 gold
    properties: JSON.stringify({
      armorClass: "11 + Dex modifier",
      stealthDisadvantage: false,
      weight: "10 lb",
      category: "Light Armor"
    }),
    requiredLevel: 1,
    equipSlot: "body",
    isConsumable: false,
    weight: 100, // 10 lb, stored in tenths of lb
    imageUrl: null
  },
  {
    name: "Healing Potion",
    description: "A red liquid that restores 2d4+2 hit points when consumed.",
    type: "potion",
    rarity: "common",
    value: 5000, // 50 gold
    properties: JSON.stringify({
      healing: "2d4+2",
      uses: 1
    }),
    requiredLevel: 1,
    equipSlot: null,
    isConsumable: true,
    weight: 5, // 0.5 lb, stored in tenths of lb
    imageUrl: null
  },
  {
    name: "Greater Healing Potion",
    description: "A deep red liquid that restores 4d4+4 hit points when consumed.",
    type: "potion",
    rarity: "uncommon",
    value: 10000, // 100 gold
    properties: JSON.stringify({
      healing: "4d4+4",
      uses: 1
    }),
    requiredLevel: 3,
    equipSlot: null,
    isConsumable: true,
    weight: 5, // 0.5 lb, stored in tenths of lb
    imageUrl: null
  },
  {
    name: "Adventurer's Pack",
    description: "A backpack containing essential adventuring gear.",
    type: "gear",
    rarity: "common",
    value: 1200, // 12 gold
    properties: JSON.stringify({
      contents: [
        "Backpack",
        "Bedroll",
        "Mess kit",
        "Tinderbox",
        "10 torches",
        "10 days of rations",
        "Waterskin",
        "50 feet of hempen rope"
      ]
    }),
    requiredLevel: 1,
    equipSlot: null,
    isConsumable: false,
    weight: 380, // 38 lb, stored in tenths of lb
    imageUrl: null
  },
  {
    name: "Rope, Hempen (50 feet)",
    description: "A sturdy rope made of hemp fiber. Has 2 hit points and can be burst with a DC 17 Strength check.",
    type: "gear",
    rarity: "common",
    value: 100, // 1 gold
    properties: JSON.stringify({
      length: "50 feet",
      strength: "DC 17 to break",
      hitPoints: 2
    }),
    requiredLevel: 1,
    equipSlot: null,
    isConsumable: false,
    weight: 100, // 10 lb, stored in tenths of lb
    imageUrl: null
  },
  {
    name: "Wand of Magic Missiles",
    description: "A wand that allows the wielder to cast Magic Missile without expending a spell slot.",
    type: "wand",
    rarity: "uncommon",
    value: 25000, // 250 gold
    properties: JSON.stringify({
      charges: 7,
      recharge: "1d6+1 charges at dawn",
      spell: "Magic Missile (1st level)",
      higherLevel: "Can expend additional charges to cast at higher levels"
    }),
    requiredLevel: 5,
    equipSlot: "offHand",
    isConsumable: false,
    weight: 10, // 1 lb, stored in tenths of lb
    imageUrl: null
  },
  {
    name: "Chain Mail",
    description: "Heavy armor made of interlocking metal rings. Offers good protection at the cost of stealth.",
    type: "armor",
    rarity: "uncommon",
    value: 7500, // 75 gold
    properties: JSON.stringify({
      armorClass: "16",
      stealthDisadvantage: true,
      strengthRequired: 13,
      weight: "55 lb",
      category: "Heavy Armor"
    }),
    requiredLevel: 1,
    equipSlot: "body",
    isConsumable: false,
    weight: 550, // 55 lb, stored in tenths of lb
    imageUrl: null
  },
  {
    name: "Shortbow",
    description: "A small bow optimized for use on foot or horseback.",
    type: "weapon",
    rarity: "common",
    value: 2500, // 25 gold
    properties: JSON.stringify({
      damage: "1d6",
      damageType: "piercing",
      range: "80/320",
      weight: "2 lb",
      properties: "Ammunition, Two-Handed"
    }),
    requiredLevel: 1,
    equipSlot: "mainHand",
    isConsumable: false,
    weight: 20, // 2 lb, stored in tenths of lb
    imageUrl: null
  },
  {
    name: "20 Arrows",
    description: "Arrows for a bow.",
    type: "gear",
    rarity: "common",
    value: 100, // 1 gold
    properties: JSON.stringify({
      quantity: 20,
      weight: "1 lb"
    }),
    requiredLevel: 1,
    equipSlot: null,
    isConsumable: true,
    weight: 10, // 1 lb, stored in tenths of lb
    imageUrl: null
  }
];

async function seedItems() {
  try {
    const db = drizzle(pool);
    
    console.log("Starting item seeding...");
    
    // Check if items already exist
    const existingItems = await db.select().from(items);
    
    if (existingItems.length > 0) {
      console.log(`Database already contains ${existingItems.length} items. Skipping seeding.`);
      return;
    }
    
    // Insert items
    for (const item of sampleItems) {
      await db.insert(items).values({
        ...item,
        createdAt: new Date().toISOString()
      });
      console.log(`Added item: ${item.name}`);
    }
    
    console.log("Item seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding items:", error);
  } finally {
    await pool.end();
  }
}

// Run the seeding function
seedItems();