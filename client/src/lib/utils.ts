import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Calculate ability modifier from ability score
export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

// Format ability modifier with + or - sign
export function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

// Generate random dice roll
export function rollDice(sides: number, quantity: number = 1, modifier: number = 0): {
  rolls: number[];
  total: number;
} {
  const rolls: number[] = [];
  
  for (let i = 0; i < quantity; i++) {
    rolls.push(Math.floor(Math.random() * sides) + 1);
  }
  
  const total = rolls.reduce((sum, roll) => sum + roll, 0) + modifier;
  
  return {
    rolls,
    total
  };
}

// D&D specific dice types
export const diceTypes = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"];

// Parse dice notation (e.g., "2d6+3")
export function parseDiceNotation(notation: string): { quantity: number; sides: number; modifier: number } {
  const regex = /(\d+)d(\d+)(?:([+-])(\d+))?/;
  const match = notation.match(regex);
  
  if (!match) {
    throw new Error("Invalid dice notation format");
  }
  
  const quantity = parseInt(match[1], 10);
  const sides = parseInt(match[2], 10);
  const modSign = match[3] || "+";
  const modValue = match[4] ? parseInt(match[4], 10) : 0;
  const modifier = modSign === "+" ? modValue : -modValue;
  
  return { quantity, sides, modifier };
}

// D&D character races
export const characterRaces = [
  "Human",
  "Elf (High)",
  "Elf (Wood)",
  "Elf (Drow)",
  "Dwarf (Hill)",
  "Dwarf (Mountain)",
  "Halfling (Lightfoot)",
  "Halfling (Stout)",
  "Gnome (Forest)",
  "Gnome (Rock)",
  "Half-Elf",
  "Half-Orc",
  "Tiefling",
  "Dragonborn"
];

// D&D character classes
export const characterClasses = [
  "Barbarian",
  "Bard",
  "Cleric",
  "Druid",
  "Fighter",
  "Monk",
  "Paladin",
  "Ranger",
  "Rogue",
  "Sorcerer",
  "Warlock",
  "Wizard"
];

// D&D backgrounds
export const characterBackgrounds = [
  "Acolyte",
  "Charlatan",
  "Criminal",
  "Entertainer",
  "Folk Hero",
  "Guild Artisan",
  "Hermit",
  "Noble",
  "Outlander",
  "Sage",
  "Sailor",
  "Soldier",
  "Urchin"
];

// D&D alignments
export const characterAlignments = [
  "Lawful Good",
  "Neutral Good",
  "Chaotic Good",
  "Lawful Neutral",
  "True Neutral",
  "Chaotic Neutral",
  "Lawful Evil",
  "Neutral Evil",
  "Chaotic Evil"
];

// Get default skills based on character class
export function getDefaultSkills(characterClass: string): string[] {
  const skillsByClass: Record<string, string[]> = {
    Barbarian: ["Athletics", "Intimidation", "Nature", "Perception", "Survival"],
    Bard: ["Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception", "History", "Insight", "Intimidation", "Investigation", "Medicine", "Nature", "Perception", "Performance", "Persuasion", "Religion", "Sleight of Hand", "Stealth", "Survival"],
    Cleric: ["History", "Insight", "Medicine", "Persuasion", "Religion"],
    Druid: ["Arcana", "Animal Handling", "Insight", "Medicine", "Nature", "Perception", "Religion", "Survival"],
    Fighter: ["Acrobatics", "Animal Handling", "Athletics", "History", "Insight", "Intimidation", "Perception", "Survival"],
    Monk: ["Acrobatics", "Athletics", "History", "Insight", "Religion", "Stealth"],
    Paladin: ["Athletics", "Insight", "Intimidation", "Medicine", "Persuasion", "Religion"],
    Ranger: ["Animal Handling", "Athletics", "Insight", "Investigation", "Nature", "Perception", "Stealth", "Survival"],
    Rogue: ["Acrobatics", "Athletics", "Deception", "Insight", "Intimidation", "Investigation", "Perception", "Performance", "Persuasion", "Sleight of Hand", "Stealth"],
    Sorcerer: ["Arcana", "Deception", "Insight", "Intimidation", "Persuasion", "Religion"],
    Warlock: ["Arcana", "Deception", "History", "Intimidation", "Investigation", "Nature", "Religion"],
    Wizard: ["Arcana", "History", "Insight", "Investigation", "Medicine", "Religion"]
  };
  
  return skillsByClass[characterClass] || [];
}
