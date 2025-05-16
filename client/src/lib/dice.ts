import { apiRequest } from "./queryClient";

export type DiceType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20" | "d100";

export interface DiceRoll {
  diceType: DiceType;
  count: number;
  modifier: number;
  purpose?: string;
  characterId?: number;
}

export interface DiceRollResult {
  diceType: DiceType;
  rolls: number[];
  total: number;
  modifier: number;
  purpose?: string;
  isCritical: boolean;
  isFumble: boolean;
}

export const rollDice = async (diceRoll: DiceRoll): Promise<DiceRollResult> => {
  try {
    const response = await apiRequest(
      "POST", 
      "/api/dice/roll",
      diceRoll
    );
    
    return await response.json();
  } catch (error) {
    console.error("Error rolling dice:", error);
    throw new Error("Failed to roll dice. Please try again.");
  }
};

// Client-side dice rolling utility (for instant feedback)
export const clientRollDice = (diceRoll: DiceRoll): DiceRollResult => {
  const { diceType, count, modifier, purpose, characterId } = diceRoll;
  
  // Get max value based on dice type
  let max = 20; // Default to d20
  if (diceType && diceType.startsWith('d')) {
    max = parseInt(diceType.substring(1));
    if (isNaN(max)) {
      console.warn(`Invalid dice type format: ${diceType}, defaulting to d20`);
      max = 20;
    }
  } else {
    console.warn(`Invalid dice type: ${diceType}, defaulting to d20`);
  }
  
  // Roll the dice the specified number of times
  console.log(`Rolling ${count}d${max} with modifier ${modifier}`);
  const rolls: number[] = [];
  for (let i = 0; i < count; i++) {
    const roll = Math.floor(Math.random() * max) + 1;
    console.log(`Roll ${i+1} result: ${roll}`);
    rolls.push(roll);
  }
  
  // Calculate total
  const rollSum = rolls.reduce((sum, roll) => sum + roll, 0);
  const total = rollSum + modifier;
  
  // Check for critical hit or fumble (only applies to d20)
  const isCritical = diceType === "d20" && rolls.some(roll => roll === 20);
  const isFumble = diceType === "d20" && rolls.some(roll => roll === 1);
  
  return {
    diceType,
    rolls,
    total,
    modifier,
    purpose,
    isCritical,
    isFumble
  };
};
