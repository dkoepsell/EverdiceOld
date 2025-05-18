import React, { useState } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Define the rule types to categorize different parts of D&D
export type RuleType = 
  | "combat" 
  | "spellcasting" 
  | "ability" 
  | "movement" 
  | "condition" 
  | "action" 
  | "equipment"
  | "class"
  | "race"
  | "general";

// Interface for our rules reference data
export interface RuleReference {
  term: string;
  shortDescription: string;
  longDescription: string;
  type: RuleType;
  sourcebook?: string;
  page?: number;
  examples?: string[];
}

// Rules data map - stores all our D&D rule explanations
export const rulesData: Record<string, RuleReference> = {
  "advantage": {
    term: "Advantage",
    shortDescription: "Roll 2d20 and take the higher result",
    longDescription: "When you have advantage on an ability check, attack roll, or saving throw, you roll a second d20 and use the higher of the two rolls. This usually occurs when a favorable circumstance impacts the roll.",
    type: "general",
    sourcebook: "Player's Handbook",
    page: 173,
    examples: [
      "Attacking a prone target with a melee weapon",
      "Attacking an invisible target",
      "Using the Help action to assist an ally"
    ]
  },
  "disadvantage": {
    term: "Disadvantage",
    shortDescription: "Roll 2d20 and take the lower result",
    longDescription: "When you have disadvantage on an ability check, attack roll, or saving throw, you roll a second d20 and use the lower of the two rolls. This usually occurs when an unfavorable circumstance impacts the roll.",
    type: "general",
    sourcebook: "Player's Handbook",
    page: 173,
    examples: [
      "Attacking a target you can't see",
      "Making a Strength check while in difficult terrain",
      "Firing a ranged weapon at long range"
    ]
  },
  "attack-roll": {
    term: "Attack Roll",
    shortDescription: "d20 + attack bonus vs target's AC",
    longDescription: "When you make an attack, your attack roll determines whether the attack hits or misses. To make an attack roll, roll a d20 and add the appropriate modifiers. If the total equals or exceeds the target's Armor Class (AC), the attack hits.",
    type: "combat",
    sourcebook: "Player's Handbook",
    page: 194,
    examples: [
      "Melee Attack: d20 + Strength modifier + proficiency bonus (if proficient)",
      "Ranged Attack: d20 + Dexterity modifier + proficiency bonus (if proficient)",
      "Spell Attack: d20 + spellcasting ability modifier + proficiency bonus"
    ]
  },
  "opportunity-attack": {
    term: "Opportunity Attack",
    shortDescription: "Reaction attack when enemy leaves your reach",
    longDescription: "You can make an opportunity attack when a hostile creature that you can see moves out of your reach. To make the opportunity attack, you use your reaction to make one melee attack against the provoking creature.",
    type: "combat",
    sourcebook: "Player's Handbook",
    page: 195,
    examples: [
      "An enemy moves away from you without taking the Disengage action",
      "An enemy teleporting away does not trigger this",
      "You can only make one reaction per round"
    ]
  },
  "saving-throw": {
    term: "Saving Throw",
    shortDescription: "d20 + ability modifier to resist effects",
    longDescription: "A saving throw represents an attempt to resist a spell, trap, poison, disease, or similar threat. You don't normally decide to make a saving throw; you are forced to make one because your character or monster is at risk of harm.",
    type: "general",
    sourcebook: "Player's Handbook",
    page: 179,
    examples: [
      "Dexterity save to avoid a fireball spell",
      "Constitution save to resist poison",
      "Wisdom save to resist being charmed"
    ]
  },
  "critical-hit": {
    term: "Critical Hit",
    shortDescription: "Double damage dice on natural 20",
    longDescription: "When you score a critical hit, you get to roll extra dice for the attack's damage. Roll all of the attack's damage dice twice and add them together. Then add any relevant modifiers as normal.",
    type: "combat",
    sourcebook: "Player's Handbook",
    page: 196,
    examples: [
      "Rolling a natural 20 on an attack roll",
      "Some class features can expand the critical range",
      "Spell attacks can also score critical hits"
    ]
  },
  "concentration": {
    term: "Concentration",
    shortDescription: "Mental focus to maintain a spell effect",
    longDescription: "Some spells require you to maintain concentration to keep their magic active. If you lose concentration, such a spell ends. You lose concentration when you cast another concentration spell, take damage (requiring a Constitution saving throw), are incapacitated, or are killed.",
    type: "spellcasting",
    sourcebook: "Player's Handbook",
    page: 203,
    examples: [
      "Taking damage requires a Constitution save (DC 10 or half damage, whichever is higher)",
      "You can only concentrate on one spell at a time",
      "Being incapacitated breaks concentration automatically"
    ]
  },
  "difficult-terrain": {
    term: "Difficult Terrain",
    shortDescription: "Costs extra movement to traverse",
    longDescription: "Combat rarely takes place in bare rooms or on featureless plains. Moving through difficult terrain costs extra movement. Each foot of movement in difficult terrain costs 1 extra foot (2 feet total).",
    type: "movement",
    sourcebook: "Player's Handbook",
    page: 190,
    examples: [
      "Dense forests, deep snow, or rubble",
      "Moving 30 feet in difficult terrain would require 60 feet of movement",
      "Some abilities allow characters to ignore difficult terrain"
    ]
  },
  "prone": {
    term: "Prone",
    shortDescription: "Lying on the ground, limited movement",
    longDescription: "A prone creature's only movement option is to crawl, unless it stands up. The creature has disadvantage on attack rolls. Attack rolls against the creature have advantage if the attacker is within 5 feet of the creature. Otherwise, the attack roll has disadvantage.",
    type: "condition",
    sourcebook: "Player's Handbook",
    page: 292,
    examples: [
      "Standing up costs half your movement speed",
      "Melee attackers have advantage against prone targets",
      "Ranged attackers have disadvantage against prone targets"
    ]
  },
  "bonus-action": {
    term: "Bonus Action",
    shortDescription: "Extra, limited action on your turn",
    longDescription: "Various class features, spells, and other abilities let you take an additional action called a bonus action. You can take a bonus action only when a special ability, spell, or other feature states that you can do something as a bonus action.",
    type: "action",
    sourcebook: "Player's Handbook",
    page: 189,
    examples: [
      "Casting spells with a casting time of 1 bonus action",
      "Using the rogue's Cunning Action feature",
      "You can only take one bonus action per turn"
    ]
  },
  "reaction": {
    term: "Reaction",
    shortDescription: "Instant response to a trigger",
    longDescription: "A reaction is an instant response to a trigger of some kind. A reaction can be taken once per round, even when it's not your turn. When you take a reaction, you can't take another one until the start of your next turn.",
    type: "action",
    sourcebook: "Player's Handbook",
    page: 190,
    examples: [
      "Opportunity attacks",
      "The Shield spell",
      "Certain class features like a rogue's Uncanny Dodge"
    ]
  },
  "grappled": {
    term: "Grappled",
    shortDescription: "Held by another creature, speed becomes 0",
    longDescription: "A grappled creature's speed becomes 0, and it can't benefit from any bonus to its speed. The condition ends if the grappler is incapacitated or if the grappled creature is moved outside the grappler's reach.",
    type: "condition",
    sourcebook: "Player's Handbook",
    page: 290,
    examples: [
      "To grapple, make a Strength (Athletics) check contested by the target's Strength (Athletics) or Dexterity (Acrobatics)",
      "You can drag a grappled creature with you, but your speed is halved",
      "A grappled creature can attempt to escape on its turn"
    ]
  },
  "attunement": {
    term: "Attunement",
    shortDescription: "Special bond with a magic item",
    longDescription: "Some magic items require a creature to form a bond with them before their magical properties can be used. This bond is called attunement. Attuning to an item requires a short rest and handling or wearing the item. A creature can be attuned to no more than three magic items at a time.",
    type: "equipment",
    sourcebook: "Dungeon Master's Guide",
    page: 136,
    examples: [
      "Attuning to an item requires a short rest (at least 1 hour)",
      "You can attune to a maximum of 3 items",
      "Breaking attunement requires another short rest or being more than 100 feet away for 24 hours"
    ]
  },
  "spell-slot": {
    term: "Spell Slot",
    shortDescription: "Resource used to cast spells",
    longDescription: "When a character casts a spell, they expend a slot of that spell's level or higher. You regain all expended spell slots when you finish a long rest. Some class features or magic items can allow you to regain spent spell slots before completing a rest.",
    type: "spellcasting",
    sourcebook: "Player's Handbook",
    page: 201,
    examples: [
      "A 3rd-level wizard has four 1st-level slots and two 2nd-level slots",
      "Casting a 1st-level spell using a 2nd-level slot makes it more powerful",
      "Warlocks regain spell slots on a short rest instead of a long rest"
    ]
  },
  "cantrip": {
    term: "Cantrip",
    shortDescription: "Level 0 spell that doesn't use spell slots",
    longDescription: "A cantrip is a spell that can be cast at will, without using a spell slot and without being prepared in advance. Repeated practice has fixed the spell in the caster's mind and infused the caster with the magic needed to produce the effect over and over.",
    type: "spellcasting",
    sourcebook: "Player's Handbook",
    page: 201,
    examples: [
      "Fire Bolt, Mage Hand, and Minor Illusion are common cantrips",
      "Cantrips often scale with character level",
      "Unlike regular spells, cantrips can be cast an unlimited number of times"
    ]
  },
  "ritual-casting": {
    term: "Ritual Casting",
    shortDescription: "Cast certain spells without using spell slots",
    longDescription: "Certain spells have a special tag: ritual. Such a spell can be cast following the normal rules for spellcasting, or the spell can be cast as a ritual. The ritual version of a spell takes 10 minutes longer to cast than normal but doesn't expend a spell slot.",
    type: "spellcasting",
    sourcebook: "Player's Handbook",
    page: 202,
    examples: [
      "Detect Magic and Identify are common ritual spells",
      "Ritual casting adds 10 minutes to the casting time",
      "Some classes must have the spell prepared to cast it as a ritual, while others don't"
    ]
  },
  "short-rest": {
    term: "Short Rest",
    shortDescription: "1+ hour break to recover resources",
    longDescription: "A short rest is a period of downtime, at least 1 hour long, during which a character does nothing more strenuous than eating, drinking, reading, and tending to wounds. A character can spend one or more Hit Dice at the end of a short rest to recover hit points.",
    type: "general",
    sourcebook: "Player's Handbook",
    page: 186,
    examples: [
      "Characters can spend Hit Dice to heal during a short rest",
      "Some class features recharge after a short rest",
      "You can take multiple short rests per day"
    ]
  },
  "long-rest": {
    term: "Long Rest",
    shortDescription: "8+ hour extended rest that fully rejuvenates",
    longDescription: "A long rest is a period of extended downtime, at least 8 hours long, during which a character sleeps for at least 6 hours and performs no more than 2 hours of light activity. A character regains all lost hit points and half their total Hit Dice at the end of a long rest.",
    type: "general",
    sourcebook: "Player's Handbook",
    page: 186,
    examples: [
      "Most spellcasters regain all spell slots after a long rest",
      "You can only benefit from one long rest per 24 hours",
      "A long rest is interrupted by 1+ hours of strenuous activity"
    ]
  },
  "proficiency-bonus": {
    term: "Proficiency Bonus",
    shortDescription: "Bonus that reflects character experience",
    longDescription: "Your proficiency bonus applies to attack rolls with weapons you're proficient with, saving throws for abilities you're proficient in, and skill checks for skills you're proficient in. Your proficiency bonus increases as you gain levels.",
    type: "general",
    sourcebook: "Player's Handbook",
    page: 173,
    examples: [
      "Starts at +2 at level 1 and increases to +6 by level 17",
      "Added to checks using skills or tools you're proficient with",
      "Used to calculate spell save DCs for spellcasters"
    ]
  },
  "ability-check": {
    term: "Ability Check",
    shortDescription: "d20 + ability modifier to attempt a task",
    longDescription: "An ability check tests a character's or monster's innate talent and training in an effort to overcome a challenge. The DM calls for an ability check when a character or monster attempts an action that has a chance of failure.",
    type: "ability",
    sourcebook: "Player's Handbook",
    page: 174,
    examples: [
      "Strength check to force open a stuck door",
      "Dexterity check to move quietly past guards",
      "Intelligence check to recall information about a monster"
    ]
  },
  "flanking": {
    term: "Flanking",
    shortDescription: "Tactical advantage when creatures surround an enemy",
    longDescription: "When a creature and at least one of its allies are adjacent to an enemy and on opposite sides of the enemy's space, they are flanking that enemy. A flanking attacker has advantage on melee attack rolls against that enemy. (Note: This is an optional rule in D&D 5e)",
    type: "combat",
    sourcebook: "Dungeon Master's Guide",
    page: 251,
    examples: [
      "Two characters on opposite sides of an enemy",
      "Provides advantage on melee attack rolls",
      "This is an optional rule that your DM may or may not use"
    ]
  },
  "death-saving-throw": {
    term: "Death Saving Throw",
    shortDescription: "Rolls to determine if a character survives",
    longDescription: "When you start your turn with 0 hit points, you must make a death saving throw. Roll a d20. If the roll is 10 or higher, you succeed. Otherwise, you fail. On your third success, you become stable. On your third failure, you die. Rolling a 1 counts as two failures. Rolling a 20 means you regain 1 hit point.",
    type: "combat",
    sourcebook: "Player's Handbook",
    page: 197,
    examples: [
      "Need three successes to stabilize",
      "Three failures means death",
      "Taking any damage while at 0 hit points counts as one failure"
    ]
  }
};

// Component for highlighting and explaining D&D terms
export function RulesReference({
  term,
  children,
  className = ""
}: {
  term: string;
  children: React.ReactNode;
  className?: string;
}) {
  // Find the rule information in our data
  const ruleInfo = rulesData[term.toLowerCase()];
  
  // If we don't have information about this term, just render the children
  if (!ruleInfo) {
    return <span className={className}>{children}</span>;
  }

  // Map rule types to badge colors
  const typeColors: Record<RuleType, string> = {
    combat: "bg-red-100 text-red-800",
    spellcasting: "bg-purple-100 text-purple-800",
    ability: "bg-green-100 text-green-800",
    movement: "bg-blue-100 text-blue-800",
    condition: "bg-orange-100 text-orange-800",
    action: "bg-yellow-100 text-yellow-800",
    equipment: "bg-gray-100 text-gray-800",
    class: "bg-indigo-100 text-indigo-800",
    race: "bg-pink-100 text-pink-800",
    general: "bg-sky-100 text-sky-800"
  };

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <span className={`border-b border-dotted border-primary cursor-help ${className}`}>
          {children}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 bg-card p-4 shadow-lg rounded-lg">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">{ruleInfo.term}</h3>
            <Badge className={typeColors[ruleInfo.type]}>
              {ruleInfo.type.charAt(0).toUpperCase() + ruleInfo.type.slice(1)}
            </Badge>
          </div>
          
          <p className="text-sm font-medium">{ruleInfo.shortDescription}</p>
          <p className="text-sm text-muted-foreground">{ruleInfo.longDescription}</p>
          
          {ruleInfo.examples && ruleInfo.examples.length > 0 && (
            <div className="pt-1">
              <h4 className="text-xs font-semibold mb-1">Examples:</h4>
              <ul className="text-xs text-muted-foreground list-disc list-inside">
                {ruleInfo.examples.map((example, i) => (
                  <li key={i}>{example}</li>
                ))}
              </ul>
            </div>
          )}
          
          {ruleInfo.sourcebook && (
            <div className="text-xs text-muted-foreground pt-2 italic">
              Source: {ruleInfo.sourcebook}{ruleInfo.page ? `, p.${ruleInfo.page}` : ""}
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

// Simple component that just shows a rules info icon with hover card
export function RulesInfoBubble({
  term,
  className = ""
}: {
  term: string;
  className?: string;
}) {
  const ruleInfo = rulesData[term.toLowerCase()];
  
  if (!ruleInfo) return null;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <span className={`inline-flex cursor-help ${className}`}>
          <Info className="h-4 w-4 text-muted-foreground" />
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 bg-card p-4 shadow-lg rounded-lg">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">{ruleInfo.term}</h3>
            <Badge variant="outline">{ruleInfo.type}</Badge>
          </div>
          
          <p className="text-sm font-medium">{ruleInfo.shortDescription}</p>
          <p className="text-sm text-muted-foreground">{ruleInfo.longDescription}</p>
          
          {ruleInfo.examples && ruleInfo.examples.length > 0 && (
            <div className="pt-1">
              <h4 className="text-xs font-semibold mb-1">Examples:</h4>
              <ul className="text-xs text-muted-foreground list-disc list-inside">
                {ruleInfo.examples.map((example, i) => (
                  <li key={i}>{example}</li>
                ))}
              </ul>
            </div>
          )}
          
          {ruleInfo.sourcebook && (
            <div className="text-xs text-muted-foreground pt-2 italic">
              Source: {ruleInfo.sourcebook}{ruleInfo.page ? `, p.${ruleInfo.page}` : ""}
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}