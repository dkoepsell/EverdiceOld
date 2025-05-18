import React, { useState } from 'react';
import { Character } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Award, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  Info 
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// D&D 5e XP thresholds for each level
const XP_THRESHOLDS = [
  0,      // Level 1
  300,    // Level 2
  900,    // Level 3
  2700,   // Level 4
  6500,   // Level 5
  14000,  // Level 6
  23000,  // Level 7
  34000,  // Level 8
  48000,  // Level 9
  64000,  // Level 10
  85000,  // Level 11
  100000, // Level 12
  120000, // Level 13
  140000, // Level 14
  165000, // Level 15
  195000, // Level 16
  225000, // Level 17
  265000, // Level 18
  305000, // Level 19
  355000, // Level 20
];

// Typical XP awards by challenge rating
const XP_BY_CR = {
  '0': 10,
  '1/8': 25,
  '1/4': 50,
  '1/2': 100,
  '1': 200,
  '2': 450,
  '3': 700,
  '4': 1100,
  '5': 1800,
  '6': 2300,
  '7': 2900,
  '8': 3900,
  '9': 5000,
  '10': 5900,
  '11': 7200,
  '12': 8400,
  '13': 10000,
  '14': 11500,
  '15': 13000,
  '16': 15000,
  '17': 18000,
  '18': 20000,
  '19': 22000,
  '20': 25000,
  '21': 33000,
  '22': 41000,
  '23': 50000,
  '24': 62000,
  '25': 75000,
  '26': 90000,
  '27': 105000,
  '28': 120000,
  '29': 135000,
  '30': 155000,
};

// Define class features by level
// This is a simplified version - a real implementation would have much more detail
const CLASS_FEATURES: Record<string, Record<number, string[]>> = {
  barbarian: {
    1: ["Rage", "Unarmored Defense"],
    2: ["Reckless Attack", "Danger Sense"],
    3: ["Primal Path", "Path Feature"],
    4: ["Ability Score Improvement"],
    5: ["Extra Attack", "Fast Movement"],
    // ... more levels
  },
  bard: {
    1: ["Spellcasting", "Bardic Inspiration (d6)"],
    2: ["Jack of All Trades", "Song of Rest (d6)"],
    3: ["Bard College", "Expertise"],
    4: ["Ability Score Improvement"],
    5: ["Bardic Inspiration (d8)", "Font of Inspiration"],
    // ... more levels
  },
  cleric: {
    1: ["Spellcasting", "Divine Domain", "Domain Feature"],
    2: ["Channel Divinity (1/rest)", "Domain Feature"],
    3: ["2nd-level Spells"],
    4: ["Ability Score Improvement"],
    5: ["Destroy Undead (CR 1/2)"],
    // ... more levels
  },
  druid: {
    1: ["Druidic", "Spellcasting"],
    2: ["Wild Shape", "Druid Circle"],
    3: ["2nd-level Spells"],
    4: ["Ability Score Improvement", "Wild Shape Improvement"],
    5: ["3rd-level Spells"],
    // ... more levels
  },
  fighter: {
    1: ["Fighting Style", "Second Wind"],
    2: ["Action Surge (1 use)"],
    3: ["Martial Archetype"],
    4: ["Ability Score Improvement"],
    5: ["Extra Attack"],
    // ... more levels
  },
  monk: {
    1: ["Unarmored Defense", "Martial Arts"],
    2: ["Ki", "Unarmored Movement"],
    3: ["Monastic Tradition", "Deflect Missiles"],
    4: ["Ability Score Improvement", "Slow Fall"],
    5: ["Extra Attack", "Stunning Strike"],
    // ... more levels
  },
  paladin: {
    1: ["Divine Sense", "Lay on Hands"],
    2: ["Fighting Style", "Spellcasting", "Divine Smite"],
    3: ["Divine Health", "Sacred Oath"],
    4: ["Ability Score Improvement"],
    5: ["Extra Attack"],
    // ... more levels
  },
  ranger: {
    1: ["Favored Enemy", "Natural Explorer"],
    2: ["Fighting Style", "Spellcasting"],
    3: ["Ranger Conclave", "Primeval Awareness"],
    4: ["Ability Score Improvement"],
    5: ["Extra Attack"],
    // ... more levels
  },
  rogue: {
    1: ["Expertise", "Sneak Attack", "Thieves' Cant"],
    2: ["Cunning Action"],
    3: ["Roguish Archetype"],
    4: ["Ability Score Improvement"],
    5: ["Uncanny Dodge"],
    // ... more levels
  },
  sorcerer: {
    1: ["Spellcasting", "Sorcerous Origin"],
    2: ["Font of Magic"],
    3: ["Metamagic"],
    4: ["Ability Score Improvement"],
    5: ["3rd-level Spells"],
    // ... more levels
  },
  warlock: {
    1: ["Otherworldly Patron", "Pact Magic"],
    2: ["Eldritch Invocations"],
    3: ["Pact Boon"],
    4: ["Ability Score Improvement"],
    5: ["3rd-level Spells"],
    // ... more levels
  },
  wizard: {
    1: ["Spellcasting", "Arcane Recovery"],
    2: ["Arcane Tradition"],
    3: ["2nd-level Spells"],
    4: ["Ability Score Improvement"],
    5: ["3rd-level Spells"],
    // ... more levels
  },
};

interface CharacterProgressionProps {
  character: Character;
  refreshCharacter: () => void;
}

export default function CharacterProgression({ character, refreshCharacter }: CharacterProgressionProps) {
  const [activeTab, setActiveTab] = useState('xp');
  const [xpToAdd, setXpToAdd] = useState<number>(0);
  const [isEditingMilestone, setIsEditingMilestone] = useState(false);
  const [newLevel, setNewLevel] = useState<number>(character.level);
  
  const { toast } = useToast();

  // Calculate current level and progress to next level
  const currentLevel = character.level;
  const currentXP = character.experience || 0;
  const nextLevelXP = currentLevel < 20 ? XP_THRESHOLDS[currentLevel] : Infinity;
  const prevLevelXP = currentLevel > 1 ? XP_THRESHOLDS[currentLevel - 1] : 0;
  
  const xpToNextLevel = nextLevelXP - currentXP;
  const levelProgress = currentLevel < 20 
    ? Math.floor(((currentXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100)
    : 100;

  // Get current class features
  const classFeatures = CLASS_FEATURES[character.class.toLowerCase()] || {};
  const currentFeatures = classFeatures[currentLevel] || [];
  
  // Get upcoming features
  const upcomingFeatures = currentLevel < 20 
    ? classFeatures[currentLevel + 1] || [] 
    : [];

  // API mutations for updating character
  const addXPMutation = useMutation({
    mutationFn: async (xpAmount: number) => {
      const response = await apiRequest('POST', `/api/characters/${character.id}/xp`, { 
        amount: xpAmount 
      });
      return await response.json();
    },
    onSuccess: () => {
      setXpToAdd(0);
      queryClient.invalidateQueries({ queryKey: ['/api/characters'] });
      refreshCharacter();
      toast({
        title: 'XP Added',
        description: `Added ${xpToAdd} XP to ${character.name}`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to add XP: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  const updateMilestoneMutation = useMutation({
    mutationFn: async (level: number) => {
      const response = await apiRequest('POST', `/api/characters/${character.id}/milestone`, { 
        level 
      });
      return await response.json();
    },
    onSuccess: () => {
      setIsEditingMilestone(false);
      queryClient.invalidateQueries({ queryKey: ['/api/characters'] });
      refreshCharacter();
      toast({
        title: 'Level Updated',
        description: `${character.name} is now level ${newLevel}`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update level: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Handler for adding XP
  const handleAddXP = () => {
    if (xpToAdd > 0) {
      addXPMutation.mutate(xpToAdd);
    }
  };

  // Handler for milestone leveling
  const handleMilestoneLevel = () => {
    if (newLevel !== character.level && newLevel >= 1 && newLevel <= 20) {
      updateMilestoneMutation.mutate(newLevel);
    } else {
      setIsEditingMilestone(false);
    }
  };

  return (
    <Card>
      <CardHeader className="bg-primary text-white">
        <CardTitle className="flex items-center">
          <TrendingUp className="mr-2 h-5 w-5" />
          Character Progression
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="xp" className="flex-1">
              <Trophy className="mr-2 h-4 w-4" />
              XP Tracking
            </TabsTrigger>
            <TabsTrigger value="milestone" className="flex-1">
              <Calendar className="mr-2 h-4 w-4" />
              Milestone Leveling
            </TabsTrigger>
            <TabsTrigger value="features" className="flex-1">
              <Award className="mr-2 h-4 w-4" />
              Class Features
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="xp">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <div className="flex items-center">
                    <h3 className="font-bold">Current Level: {currentLevel}</h3>
                    {currentLevel < 20 && (
                      <span className="text-sm text-muted-foreground ml-2">
                        ({xpToNextLevel} XP to level {currentLevel + 1})
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-medium">Total XP: {currentXP}</span>
                  </div>
                </div>
                
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
                  <div 
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${levelProgress}%` }}
                  />
                </div>
                
                <div className="flex items-end gap-2 mt-4">
                  <div className="flex-1">
                    <Label htmlFor="xp-amount">Add XP</Label>
                    <Input
                      id="xp-amount"
                      type="number"
                      min="0"
                      max="100000"
                      value={xpToAdd}
                      onChange={(e) => setXpToAdd(parseInt(e.target.value) || 0)}
                      placeholder="XP Amount"
                    />
                  </div>
                  <Button 
                    onClick={handleAddXP}
                    disabled={xpToAdd <= 0 || addXPMutation.isPending}
                  >
                    {addXPMutation.isPending ? "Adding..." : "Add XP"}
                  </Button>
                </div>
                
                <div className="mt-4 text-sm">
                  <h4 className="font-semibold mb-2">Common XP Awards:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setXpToAdd(100)}
                    >
                      Easy Encounter (100 XP)
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setXpToAdd(200)}
                    >
                      Medium Encounter (200 XP)
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setXpToAdd(400)}
                    >
                      Hard Encounter (400 XP)
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setXpToAdd(50)}
                    >
                      Role-playing (50 XP)
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setXpToAdd(75)}
                    >
                      Quest Milestone (75 XP)
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setXpToAdd(150)}
                    >
                      Puzzle Solved (150 XP)
                    </Button>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
                    <div className="text-xs text-amber-800">
                      <p className="font-bold">D&D 5e XP Progression:</p>
                      <p>Characters gain levels based on XP thresholds. A level 1 character needs 300 XP to reach level 2, 
                      while reaching level 20 requires a total of 355,000 XP. XP is typically awarded for defeating 
                      monsters, completing quests, good roleplaying, and solving puzzles.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="milestone">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Milestone Leveling</h3>
                <div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-md">
                        <p>Milestone leveling ignores XP and grants levels when significant story events are completed. DMs decide when characters level up based on campaign progress.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              
              {isEditingMilestone ? (
                <div className="flex flex-col gap-4">
                  <div>
                    <Label htmlFor="milestone-level">Set Character Level</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="milestone-level"
                        type="number"
                        min="1"
                        max="20"
                        value={newLevel}
                        onChange={(e) => setNewLevel(parseInt(e.target.value) || character.level)}
                      />
                      <Button onClick={handleMilestoneLevel}>Save</Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditingMilestone(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center py-8 border rounded-md">
                    <div className="text-6xl font-fantasy text-primary mb-2">{character.level}</div>
                    <div className="text-sm text-muted-foreground">Current Level</div>
                  </div>
                  
                  <Button 
                    className="w-full"
                    onClick={() => {
                      setNewLevel(character.level);
                      setIsEditingMilestone(true);
                    }}
                  >
                    Update Level
                  </Button>
                  
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                      <div className="text-xs text-blue-800">
                        <p className="font-bold">About Milestone Leveling:</p>
                        <p>Instead of tracking XP, milestone leveling allows characters to level up when they reach significant 
                        story milestones or complete important objectives. This method focuses on story progression rather than 
                        combat encounters and is often preferred for narrative-focused campaigns.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="features">
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-lg mb-2">Class Features: {character.class}</h3>
                <div className="p-3 border rounded-md">
                  <h4 className="font-medium text-primary mb-2">Current Level {currentLevel} Features:</h4>
                  {currentFeatures.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {currentFeatures.map((feature, index) => (
                        <li key={index} className="text-sm">{feature}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No features information available for {character.class} at level {currentLevel}.</p>
                  )}
                </div>
                
                {currentLevel < 20 && (
                  <div className="p-3 border rounded-md mt-4 bg-gray-50">
                    <h4 className="font-medium text-muted-foreground mb-2">Next Level Features:</h4>
                    {upcomingFeatures.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {upcomingFeatures.map((feature, index) => (
                          <li key={index} className="text-sm text-muted-foreground">{feature}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No feature information available for level {currentLevel + 1}.</p>
                    )}
                  </div>
                )}
                
                {!classFeatures[currentLevel] && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
                      <p className="text-xs text-amber-800">
                        Our feature database for {character.class} is still being updated. 
                        Please refer to the Player's Handbook for complete information about 
                        your class features at this level.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}