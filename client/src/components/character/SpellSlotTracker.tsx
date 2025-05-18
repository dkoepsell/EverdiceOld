import React from 'react';
import { Character } from '@shared/schema';
import { Checkbox } from '@/components/ui/checkbox';

interface SpellSlotTrackerProps {
  character: Character;
  usedSpellSlots?: {[key: number]: number}; // Object with spell level as key and used slots as value
}

export default function SpellSlotTracker({ 
  character, 
  usedSpellSlots = {} 
}: SpellSlotTrackerProps) {
  // D&D 5e spell slot tables by class and level
  const getSpellSlots = (characterClass: string, level: number) => {
    // Only spellcasting classes
    const spellcastingClasses = [
      'bard', 'cleric', 'druid', 'paladin', 'ranger', 
      'sorcerer', 'warlock', 'wizard', 'artificer'
    ];
    
    if (!spellcastingClasses.includes(characterClass.toLowerCase())) {
      return null;
    }
    
    // Warlock has a unique spell slot progression
    if (characterClass.toLowerCase() === 'warlock') {
      return getWarlockSpellSlots(level);
    }
    
    // Half-casters (Paladin, Ranger) progress at half rate
    const halfCasters = ['paladin', 'ranger', 'artificer'];
    if (halfCasters.includes(characterClass.toLowerCase())) {
      // Half casters round up when determining spell slots
      level = Math.ceil(level / 2);
      if (level < 1) level = 1;
    }
    
    // Table of spell slots by class level (adjusted for full casters)
    return getFullCasterSpellSlots(level);
  };
  
  // Full caster spell slot table
  const getFullCasterSpellSlots = (level: number) => {
    const spellSlotsByLevel = {
      1: { 1: 2 },
      2: { 1: 3 },
      3: { 1: 4, 2: 2 },
      4: { 1: 4, 2: 3 },
      5: { 1: 4, 2: 3, 3: 2 },
      6: { 1: 4, 2: 3, 3: 3 },
      7: { 1: 4, 2: 3, 3: 3, 4: 1 },
      8: { 1: 4, 2: 3, 3: 3, 4: 2 },
      9: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
      10: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
      11: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
      12: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
      13: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
      14: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
      15: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
      16: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
      17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 },
      18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 },
      19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1 },
      20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 }
    };
    
    return spellSlotsByLevel[level as keyof typeof spellSlotsByLevel] || { 1: 0 };
  };
  
  // Warlock spell slot table
  const getWarlockSpellSlots = (level: number) => {
    const warlockSlots = {
      1: { slots: 1, level: 1 },
      2: { slots: 2, level: 1 },
      3: { slots: 2, level: 2 },
      4: { slots: 2, level: 2 },
      5: { slots: 2, level: 3 },
      6: { slots: 2, level: 3 },
      7: { slots: 2, level: 4 },
      8: { slots: 2, level: 4 },
      9: { slots: 2, level: 5 },
      10: { slots: 2, level: 5 },
      11: { slots: 3, level: 5 },
      12: { slots: 3, level: 5 },
      13: { slots: 3, level: 5 },
      14: { slots: 3, level: 5 },
      15: { slots: 3, level: 5 },
      16: { slots: 3, level: 5 },
      17: { slots: 4, level: 5 },
      18: { slots: 4, level: 5 },
      19: { slots: 4, level: 5 },
      20: { slots: 4, level: 5 }
    };
    
    const slotInfo = warlockSlots[level as keyof typeof warlockSlots];
    if (!slotInfo) return { 1: 0 };
    
    // Warlocks have slots of the same level, so we return it in a different format
    return { [slotInfo.level]: slotInfo.slots };
  };

  // Get character's available spell slots
  const spellSlots = getSpellSlots(character.class, character.level);
  
  // If character doesn't have spell slots, don't render component
  if (!spellSlots) {
    return null;
  }
  
  // If character is a warlock, render warlock-specific spell slot tracker
  const isWarlock = character.class.toLowerCase() === 'warlock';
  
  return (
    <div className="spell-slot-tracker mb-6">
      <h3 className="font-fantasy text-lg font-bold mb-3 text-primary-light">Spell Slots</h3>
      <div className="bg-parchment-dark rounded-lg p-3">
        {isWarlock ? (
          // Warlock spell slot display (all same level)
          Object.entries(spellSlots).map(([level, slots]) => {
            const used = usedSpellSlots[parseInt(level)] || 0;
            const available = Math.max(0, slots - used);
            
            return (
              <div key={level} className="mb-2 last:mb-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">Level {level}</span>
                  <span className="text-sm">{available}/{slots} Slots</span>
                </div>
                <div className="flex space-x-1">
                  {Array.from({ length: slots }).map((_, i) => (
                    <Checkbox
                      key={i}
                      checked={i >= available}
                      className="rounded-sm h-5 w-5 data-[state=checked]:bg-primary-light"
                      disabled
                    />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          // Standard spell slot display for other casters
          <div className="grid gap-2">
            {Object.entries(spellSlots).map(([level, slots]) => {
              const used = usedSpellSlots[parseInt(level)] || 0;
              const available = Math.max(0, slots - used);
              
              return (
                <div key={level} className="mb-2 last:mb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">Level {level}</span>
                    <span className="text-sm">{available}/{slots} Slots</span>
                  </div>
                  <div className="flex space-x-1">
                    {Array.from({ length: slots }).map((_, i) => (
                      <Checkbox
                        key={i}
                        checked={i >= available}
                        className="rounded-sm h-5 w-5 data-[state=checked]:bg-primary-light"
                        disabled
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Note for higher level characters */}
        {character.level >= 20 && (
          <div className="text-xs text-gray-600 mt-3 italic">
            *Regain all expended spell slots when you finish a long rest.
          </div>
        )}
      </div>
    </div>
  );
}