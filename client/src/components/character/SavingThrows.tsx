import React from 'react';
import { Character } from '@shared/schema';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldIcon, 
  ZapIcon,
  BrainIcon,
  HeartIcon, 
  EyeIcon,
  SpeakerIcon 
} from 'lucide-react';

interface SavingThrowsProps {
  character: Character;
  proficientSaves?: string[]; // Array of saving throws the character is proficient in
}

export default function SavingThrows({ character, proficientSaves = [] }: SavingThrowsProps) {
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

  // Calculate saving throw values
  const savingThrows = {
    strength: {
      name: "Strength",
      modifier: getModifier(character.strength),
      isProficient: proficientSaves.includes('strength'),
      icon: <ShieldIcon className="h-4 w-4" />,
    },
    dexterity: {
      name: "Dexterity",
      modifier: getModifier(character.dexterity),
      isProficient: proficientSaves.includes('dexterity'),
      icon: <ZapIcon className="h-4 w-4" />,
    },
    constitution: {
      name: "Constitution",
      modifier: getModifier(character.constitution),
      isProficient: proficientSaves.includes('constitution'),
      icon: <HeartIcon className="h-4 w-4" />,
    },
    intelligence: {
      name: "Intelligence",
      modifier: getModifier(character.intelligence),
      isProficient: proficientSaves.includes('intelligence'),
      icon: <BrainIcon className="h-4 w-4" />,
    },
    wisdom: {
      name: "Wisdom",
      modifier: getModifier(character.wisdom),
      isProficient: proficientSaves.includes('wisdom'),
      icon: <EyeIcon className="h-4 w-4" />,
    },
    charisma: {
      name: "Charisma",
      modifier: getModifier(character.charisma),
      isProficient: proficientSaves.includes('charisma'),
      icon: <SpeakerIcon className="h-4 w-4" />,
    }
  };

  return (
    <div className="saving-throws mb-6">
      <h3 className="font-fantasy text-lg font-bold mb-3 text-primary-light">Saving Throws</h3>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(savingThrows).map(([key, save]) => {
          const total = save.isProficient 
            ? save.modifier + proficiencyBonus
            : save.modifier;
            
          return (
            <div key={key} className="flex items-center p-2 bg-parchment-dark rounded-lg">
              <div className="mr-2 text-primary">
                {save.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{save.name}</p>
              </div>
              <div className="flex items-center">
                {save.isProficient && (
                  <Badge className="bg-primary-light mr-2 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                    P
                  </Badge>
                )}
                <span className={`font-bold ${total >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {formatModifier(total)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}