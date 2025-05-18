import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Character } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Image, BookOpen, Shield, Dumbbell, TrendingUp } from "lucide-react";
import CharacterPortraitGenerator from "./CharacterPortraitGenerator";
import SavingThrows from "./SavingThrows";
import SkillProficiencies from "./SkillProficiencies";
import EncumbranceTracker from "./EncumbranceTracker";
import SpellSlotTracker from "./SpellSlotTracker";
import CharacterProgression from "./CharacterProgression";
import { useQuery } from "@tanstack/react-query";

interface CharacterSheetProps {
  character: Character;
}

export default function CharacterSheet({ character }: CharacterSheetProps) {
  const [activeTab, setActiveTab] = useState("main");
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Query to refresh character data when needed
  const { refetch: refreshCharacter } = useQuery<Character>({
    queryKey: [`/api/characters/${character.id}`],
    enabled: false // Only refetch when manually triggered
  });

  // Calculate ability modifiers
  const getModifier = (abilityScore: number) => {
    return Math.floor((abilityScore - 10) / 2);
  };

  // Format modifiers to include the sign
  const formatModifier = (modifier: number) => {
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  };
  
  // Toggle character sheet expanded/collapsed state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card className="bg-secondary-light rounded-lg shadow-xl overflow-hidden">
      <div className="bg-primary p-4 flex justify-between items-center">
        <h2 className="font-fantasy text-xl font-bold text-white">Character Sheet</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-white hover:bg-primary-dark"
          onClick={toggleExpanded}
          aria-label={isExpanded ? "Collapse character sheet" : "Expand character sheet"}
        >
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </Button>
      </div>
      
      {isExpanded ? (
        <div className="character-sheet p-6 scroll-container max-h-[700px] overflow-y-auto">
          {/* Character Basic Info */}
          <div className="mb-6 text-secondary border-b-2 border-primary pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-fantasy text-xl font-bold text-primary">{character.name}</h3>
              <span className="bg-primary text-white text-sm px-3 py-1 rounded-full">Level {character.level}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Race</p>
                <p className="font-medium text-secondary">{character.race}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Class</p>
                <p className="font-medium text-secondary">{character.class}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Background</p>
                <p className="font-medium text-secondary">{character.background || "None"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Alignment</p>
                <p className="font-medium text-secondary">{character.alignment || "None"}</p>
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="main" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="main">Abilities & Combat</TabsTrigger>
              <TabsTrigger value="skills">
                <div className="flex items-center">
                  <Dumbbell className="h-4 w-4 mr-1" />
                  Skills
                </div>
              </TabsTrigger>
              <TabsTrigger value="equipment">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-1" />
                  Equipment
                </div>
              </TabsTrigger>
              <TabsTrigger value="spells">
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-1" />
                  Spells
                </div>
              </TabsTrigger>
              <TabsTrigger value="portrait">
                <div className="flex items-center">
                  <Image className="h-4 w-4 mr-1" />
                  Portrait
                </div>
              </TabsTrigger>
              <TabsTrigger value="progression">
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Progression
                </div>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="main">
              {/* Abilities */}
              <div className="mb-6 text-secondary">
                <h3 className="font-fantasy text-lg font-bold mb-3 text-primary-light">Abilities</h3>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-parchment-dark rounded-lg p-3 text-center relative cursor-help">
                          <p className="text-xs text-gray-600">STR</p>
                          <p className="font-bold text-xl text-secondary">{character.strength}</p>
                          <p className="text-secondary text-sm">({formatModifier(getModifier(character.strength))})</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p className="text-sm">Strength measures your character's physical power and affects melee attacks.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-parchment-dark rounded-lg p-3 text-center relative cursor-help">
                          <p className="text-xs text-gray-600">DEX</p>
                          <p className="font-bold text-xl text-secondary">{character.dexterity}</p>
                          <p className="text-secondary text-sm">({formatModifier(getModifier(character.dexterity))})</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p className="text-sm">Dexterity determines agility, reflexes, and balance, affecting ranged attacks and AC.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-parchment-dark rounded-lg p-3 text-center relative cursor-help">
                          <p className="text-xs text-gray-600">CON</p>
                          <p className="font-bold text-xl text-secondary">{character.constitution}</p>
                          <p className="text-secondary text-sm">({formatModifier(getModifier(character.constitution))})</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p className="text-sm">Constitution represents health and stamina, affecting hit points.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-parchment-dark rounded-lg p-3 text-center relative cursor-help">
                          <p className="text-xs text-gray-600">INT</p>
                          <p className="font-bold text-xl text-secondary">{character.intelligence}</p>
                          <p className="text-secondary text-sm">({formatModifier(getModifier(character.intelligence))})</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">Intelligence measures reasoning and memory, useful for wizards and knowledge-based skills.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-parchment-dark rounded-lg p-3 text-center relative cursor-help">
                          <p className="text-xs text-gray-600">WIS</p>
                          <p className="font-bold text-xl text-secondary">{character.wisdom}</p>
                          <p className="text-secondary text-sm">({formatModifier(getModifier(character.wisdom))})</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">Wisdom reflects perception and insight, important for clerics and druids.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-parchment-dark rounded-lg p-3 text-center relative cursor-help">
                          <p className="text-xs text-gray-600">CHA</p>
                          <p className="font-bold text-xl text-secondary">{character.charisma}</p>
                          <p className="text-secondary text-sm">({formatModifier(getModifier(character.charisma))})</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm">Charisma measures force of personality, useful for bards, sorcerers, and social interaction.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              
              {/* Combat Stats */}
              <div className="text-secondary">
                <h3 className="font-fantasy text-lg font-bold mb-3 text-primary-light">Combat</h3>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-parchment-dark rounded-lg p-3 text-center border border-primary">
                    <p className="text-xs text-gray-600">Hit Points</p>
                    <p className="font-bold text-xl text-secondary">{character.hitPoints}/{character.maxHitPoints}</p>
                  </div>
                  
                  <div className="bg-parchment-dark rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-600">Armor Class</p>
                    <p className="font-bold text-xl text-secondary">{character.armorClass}</p>
                  </div>
                  
                  <div className="bg-parchment-dark rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-600">Initiative</p>
                    <p className="font-bold text-xl text-secondary">{formatModifier(getModifier(character.dexterity))}</p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="skills">
              {/* Skills and Saving Throws */}
              <div className="text-secondary">
                {/* Saving Throws */}
                <SavingThrows 
                  character={character} 
                  proficientSaves={
                    // Extract proficient saves from character.skills if they exist and start with "save:"
                    character.skills 
                      ? character.skills
                          .filter(skill => skill.toLowerCase().startsWith('save:'))
                          .map(skill => skill.substring(5).toLowerCase().trim())
                      : []
                  }
                />
                
                {/* D&D Skills with proficiencies */}
                <SkillProficiencies
                  character={character}
                  proficientSkills={
                    // Extract proficient skills from character.skills if they exist and don't start with "save:"
                    character.skills 
                      ? character.skills
                          .filter(skill => !skill.toLowerCase().startsWith('save:'))
                          .map(skill => skill.toLowerCase().trim())
                      : []
                  }
                  expertiseSkills={[]} // We can add expertise later
                />
                
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800">
                    <strong>Tip:</strong> Add skills to your character with the format "Persuasion" for regular proficiency.
                    Add saving throws with the format "Save: Dexterity" to mark proficiency in that saving throw.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="equipment">
              {/* Equipment */}
              <div className="text-secondary">
                <h3 className="font-fantasy text-lg font-bold mb-3 text-primary-light">Equipment</h3>
                <ul className="bg-parchment-dark rounded-lg p-4 space-y-2">
                  {character.equipment && character.equipment.length > 0 ? (
                    character.equipment.map((item, index) => (
                      <li key={index} className="flex justify-between items-center pb-2 border-b border-gray-300">
                        <span>{item}</span>
                        <span className="text-sm text-gray-600">Item</span>
                      </li>
                    ))
                  ) : (
                    <li className="py-4 text-center">
                      <p>No equipment added yet</p>
                    </li>
                  )}
                </ul>
                
                {/* Encumbrance tracker */}
                <div className="mt-4">
                  <EncumbranceTracker 
                    character={character}
                    equipmentItems={
                      // Parse equipment items into structured data with weights
                      // Format expected: "Longsword (3 lbs)" or similar
                      character.equipment ? character.equipment.map(item => {
                        const match = item.match(/(.+)\s*\((\d+\.?\d*)\s*lbs?\)/i);
                        if (match) {
                          return {
                            name: match[1].trim(),
                            weight: parseFloat(match[2]),
                            quantity: 1 // Default quantity
                          };
                        }
                        // If no weight specified, assume 1 lb
                        return { name: item, weight: 1, quantity: 1 };
                      }) : []
                    } 
                  />
                </div>
                
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800">
                    <strong>Tip:</strong> Add equipment weight by formatting items like "Longsword (4 lbs)" or "Backpack (2 lbs)".
                    The system will track your carrying capacity based on your Strength score.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="spells">
              {/* Spell Slots and Magic */}
              <div className="text-secondary">
                <SpellSlotTracker 
                  character={character}
                  usedSpellSlots={{
                    // For now, we'll just assume no spell slots are used
                    // In a full implementation, this would be stored in the database
                    1: 0,
                    2: 0,
                    3: 0,
                    4: 0,
                    5: 0,
                    6: 0,
                    7: 0,
                    8: 0,
                    9: 0
                  }}
                />
                
                {/* If character is not a spellcaster, show appropriate message */}
                {!['bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'warlock', 'wizard', 'artificer']
                  .includes(character.class.toLowerCase()) && (
                  <div className="bg-parchment-dark rounded-lg p-4 text-center">
                    <p className="text-lg font-medium mb-2">Not a Spellcaster</p>
                    <p className="text-sm text-gray-600">
                      Your character class ({character.class}) does not have spellcasting abilities.
                    </p>
                  </div>
                )}
                
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>D&D Spell Rules:</strong> Spell slots represent the number of spells you can cast before taking a rest.
                    Higher level spell slots are used for more powerful spells. Each class has a different spell slot progression.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="portrait">
              {/* Character Portrait Generator */}
              <CharacterPortraitGenerator character={character} />
            </TabsContent>
            
            <TabsContent value="progression">
              {/* Character Progression (XP & Milestone Leveling) */}
              <CharacterProgression 
                character={character} 
                refreshCharacter={refreshCharacter}
              />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="p-4 bg-parchment-light">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h3 className="font-fantasy text-lg font-bold text-primary">{character.name}</h3>
              <span className="text-sm text-gray-600">Level {character.level} {character.race} {character.class}</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-parchment-dark rounded-lg px-2 py-1 text-center">
                <p className="text-xs text-gray-600">HP</p>
                <p className="font-bold text-sm text-secondary">{character.hitPoints}/{character.maxHitPoints}</p>
              </div>
              <div className="bg-parchment-dark rounded-lg px-2 py-1 text-center">
                <p className="text-xs text-gray-600">AC</p>
                <p className="font-bold text-sm text-secondary">{character.armorClass}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}