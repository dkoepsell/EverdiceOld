import React from 'react';
import { Character } from '@shared/schema';
import { Badge } from '@/components/ui/badge';

interface SkillProficienciesProps {
  character: Character;
  proficientSkills?: string[]; // Array of skills the character is proficient in
  expertiseSkills?: string[]; // Array of skills the character has expertise in (double proficiency)
}

// D&D 5e skill list with associated ability scores
const DND_SKILLS = [
  { name: 'Acrobatics', ability: 'dexterity' },
  { name: 'Animal Handling', ability: 'wisdom' },
  { name: 'Arcana', ability: 'intelligence' },
  { name: 'Athletics', ability: 'strength' },
  { name: 'Deception', ability: 'charisma' },
  { name: 'History', ability: 'intelligence' },
  { name: 'Insight', ability: 'wisdom' },
  { name: 'Intimidation', ability: 'charisma' },
  { name: 'Investigation', ability: 'intelligence' },
  { name: 'Medicine', ability: 'wisdom' },
  { name: 'Nature', ability: 'intelligence' },
  { name: 'Perception', ability: 'wisdom' },
  { name: 'Performance', ability: 'charisma' },
  { name: 'Persuasion', ability: 'charisma' },
  { name: 'Religion', ability: 'intelligence' },
  { name: 'Sleight of Hand', ability: 'dexterity' },
  { name: 'Stealth', ability: 'dexterity' },
  { name: 'Survival', ability: 'wisdom' }
];

export default function SkillProficiencies({ 
  character, 
  proficientSkills = [], 
  expertiseSkills = [] 
}: SkillProficienciesProps) {
  // Calculate ability modifiers
  const getModifier = (abilityScore: number) => {
    return Math.floor((abilityScore - 10) / 2);
  };

  // Format modifiers to include the sign
  const formatModifier = (modifier: number) => {
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  };

  // Calculate proficiency bonus based on character level (D&D 5e rule)
  const getProficiencyBonus = (level: number) => {
    return Math.floor((level - 1) / 4) + 2;
  };

  const proficiencyBonus = getProficiencyBonus(character.level);

  // Get ability modifiers for the character
  const abilityModifiers = {
    strength: getModifier(character.strength),
    dexterity: getModifier(character.dexterity),
    constitution: getModifier(character.constitution),
    intelligence: getModifier(character.intelligence),
    wisdom: getModifier(character.wisdom),
    charisma: getModifier(character.charisma)
  };

  return (
    <div className="skill-proficiencies mb-6">
      <h3 className="font-fantasy text-lg font-bold mb-3 text-primary-light">Skills</h3>
      <div className="bg-parchment-dark rounded-lg p-3">
        <div className="grid gap-2">
          {DND_SKILLS.map(skill => {
            const isProficient = proficientSkills.includes(skill.name.toLowerCase());
            const hasExpertise = expertiseSkills.includes(skill.name.toLowerCase());
            const abilityMod = abilityModifiers[skill.ability as keyof typeof abilityModifiers];
            
            let totalBonus = abilityMod;
            if (isProficient) totalBonus += proficiencyBonus;
            if (hasExpertise) totalBonus += proficiencyBonus; // Expertise doubles proficiency bonus
            
            return (
              <div key={skill.name} className="flex items-center justify-between py-1 border-b border-gray-300 last:border-0">
                <div className="flex items-center">
                  {isProficient && (
                    <Badge className={`mr-2 h-5 w-5 p-0 flex items-center justify-center rounded-full ${hasExpertise ? 'bg-yellow-600' : 'bg-primary-light'}`}>
                      {hasExpertise ? 'E' : 'P'}
                    </Badge>
                  )}
                  <span className="text-sm font-medium">{skill.name}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-xs text-gray-600 mr-2">({skill.ability.substring(0, 3).toUpperCase()})</span>
                  <span className={`font-bold text-sm ${totalBonus >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {formatModifier(totalBonus)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}