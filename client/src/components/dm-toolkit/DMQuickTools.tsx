import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dices,
  Sparkles,
  Cloud,
  Music,
  Zap,
  Volume2,
  Skull,
  Footprints,
  Sword,
  PanelRight,
  Wand2,
  Volume
} from 'lucide-react';

interface DMQuickToolsProps {
  campaignId: number;
  isSessionActive: boolean;
}

// Types for dice rolling
type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

interface DiceRoll {
  diceType: DiceType;
  count: number;
  modifier?: number;
  purpose?: string;
}

interface DiceRollResult {
  rolls: number[];
  total: number;
  diceType: DiceType;
  modifier?: number;
  purpose?: string;
}

// Types for encounter generation
interface EncounterOptions {
  difficulty: 'easy' | 'medium' | 'hard' | 'deadly';
  environment: string;
  playerLevel: number;
  playerCount: number;
}

export default function DMQuickTools({ campaignId, isSessionActive }: DMQuickToolsProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dice');
  
  // Dice rolling state
  const [diceType, setDiceType] = useState<DiceType>('d20');
  const [diceCount, setDiceCount] = useState<number>(1);
  const [diceModifier, setDiceModifier] = useState<number>(0);
  const [dicePurpose, setDicePurpose] = useState<string>('');
  const [diceResults, setDiceResults] = useState<DiceRollResult | null>(null);
  
  // Quick encounter state
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'deadly'>('medium');
  const [environment, setEnvironment] = useState<string>('forest');
  const [playerLevel, setPlayerLevel] = useState<number>(1);
  const [playerCount, setPlayerCount] = useState<number>(4);
  
  // Ambiance state
  const [ambiance, setAmbiance] = useState<string>('');
  const [volume, setVolume] = useState<number>(50);
  
  // Dice roll mutation
  const rollDiceMutation = useMutation({
    mutationFn: async (diceRoll: DiceRoll) => {
      const res = await apiRequest('POST', `/api/dice/roll/dm`, {
        ...diceRoll,
        campaignId
      });
      return await res.json();
    },
    onSuccess: (data: DiceRollResult) => {
      setDiceResults(data);
      
      // Announce dice roll to players if in active session
      if (isSessionActive) {
        announceDiceRollMutation.mutate({
          diceRoll: data,
          isPrivate: false
        });
      }
      
      toast({
        title: `Dice Roll: ${data.total}`,
        description: `Rolled ${diceCount}${diceType}${diceModifier > 0 ? '+' + diceModifier : diceModifier < 0 ? diceModifier : ''}`
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Dice roll failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Announce dice roll mutation
  const announceDiceRollMutation = useMutation({
    mutationFn: async ({ diceRoll, isPrivate }: { diceRoll: DiceRollResult, isPrivate: boolean }) => {
      const res = await apiRequest('POST', `/api/campaigns/${campaignId}/announce-roll`, {
        diceRoll,
        isPrivate
      });
      return await res.json();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to announce roll',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Generate encounter mutation
  const generateEncounterMutation = useMutation({
    mutationFn: async (options: EncounterOptions) => {
      const res = await apiRequest('POST', `/api/campaigns/${campaignId}/generate-encounter`, options);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Encounter generated',
        description: `A ${difficulty} encounter has been created`
      });
      
      // If session is active, announce the encounter
      if (isSessionActive) {
        announceEncounterMutation.mutate(data);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to generate encounter',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Announce encounter mutation
  const announceEncounterMutation = useMutation({
    mutationFn: async (encounter: any) => {
      const res = await apiRequest('POST', `/api/campaigns/${campaignId}/announce-encounter`, {
        encounter
      });
      return await res.json();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to announce encounter',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Set ambiance mutation
  const setAmbianceMutation = useMutation({
    mutationFn: async ({ ambiance, volume }: { ambiance: string, volume: number }) => {
      const res = await apiRequest('POST', `/api/campaigns/${campaignId}/set-ambiance`, {
        ambiance,
        volume
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Ambiance set',
        description: `Set ambiance to "${ambiance}"`
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to set ambiance',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleDiceRoll = () => {
    if (diceCount < 1 || diceCount > 100) {
      toast({
        title: 'Invalid dice count',
        description: 'Please enter a number between 1 and 100',
        variant: 'destructive'
      });
      return;
    }
    
    rollDiceMutation.mutate({
      diceType,
      count: diceCount,
      modifier: diceModifier,
      purpose: dicePurpose || undefined
    });
  };
  
  const handleQuickRoll = (type: DiceType, count: number = 1, modifier: number = 0) => {
    rollDiceMutation.mutate({
      diceType: type,
      count,
      modifier,
      purpose: 'Quick roll'
    });
  };
  
  const handleGenerateEncounter = () => {
    generateEncounterMutation.mutate({
      difficulty,
      environment,
      playerLevel,
      playerCount
    });
  };
  
  const handleSetAmbiance = () => {
    if (!ambiance.trim()) {
      toast({
        title: 'Ambiance required',
        description: 'Please enter an ambiance description',
        variant: 'destructive'
      });
      return;
    }
    
    setAmbianceMutation.mutate({
      ambiance,
      volume
    });
  };
  
  return (
    <div className="space-y-4">
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Wand2 className="h-5 w-5 mr-2 text-primary" />
            DM Quick Tools
          </CardTitle>
          <CardDescription>
            Essential tools for running your live campaign session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="dice" className="text-xs md:text-sm">
                <Dices className="h-4 w-4 mr-2" />
                Dice
              </TabsTrigger>
              <TabsTrigger value="encounters" className="text-xs md:text-sm">
                <Skull className="h-4 w-4 mr-2" />
                Encounters
              </TabsTrigger>
              <TabsTrigger value="ambiance" className="text-xs md:text-sm">
                <Volume className="h-4 w-4 mr-2" />
                Ambiance
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="dice" className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  <Button 
                    variant="outline" 
                    className="h-12 font-bold" 
                    onClick={() => handleQuickRoll('d4')}
                  >
                    d4
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-12 font-bold" 
                    onClick={() => handleQuickRoll('d6')}
                  >
                    d6
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-12 font-bold" 
                    onClick={() => handleQuickRoll('d8')}
                  >
                    d8
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-12 font-bold" 
                    onClick={() => handleQuickRoll('d10')}
                  >
                    d10
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-12 font-bold" 
                    onClick={() => handleQuickRoll('d12')}
                  >
                    d12
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-12 font-bold" 
                    onClick={() => handleQuickRoll('d20')}
                  >
                    d20
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-12 font-bold" 
                    onClick={() => handleQuickRoll('d100')}
                  >
                    d100
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-12 font-bold" 
                    onClick={() => handleQuickRoll('d20', 2)}
                  >
                    2d20
                  </Button>
                </div>
                
                <div className="space-y-3 pt-2 border-t">
                  <h3 className="font-semibold">Custom Roll</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dice-type">Dice Type</Label>
                      <Select 
                        value={diceType} 
                        onValueChange={(value) => setDiceType(value as DiceType)}
                      >
                        <SelectTrigger id="dice-type">
                          <SelectValue placeholder="Select dice" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="d4">d4</SelectItem>
                          <SelectItem value="d6">d6</SelectItem>
                          <SelectItem value="d8">d8</SelectItem>
                          <SelectItem value="d10">d10</SelectItem>
                          <SelectItem value="d12">d12</SelectItem>
                          <SelectItem value="d20">d20</SelectItem>
                          <SelectItem value="d100">d100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dice-count">Number of Dice</Label>
                      <Input 
                        id="dice-count"
                        type="number"
                        min={1}
                        max={100}
                        value={diceCount}
                        onChange={(e) => setDiceCount(parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dice-modifier">Modifier</Label>
                      <Input 
                        id="dice-modifier"
                        type="number"
                        value={diceModifier}
                        onChange={(e) => setDiceModifier(parseInt(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dice-purpose">Purpose (Optional)</Label>
                      <Input 
                        id="dice-purpose"
                        placeholder="e.g. Stealth check"
                        value={dicePurpose}
                        onChange={(e) => setDicePurpose(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={handleDiceRoll}
                    disabled={rollDiceMutation.isPending}
                  >
                    <Dices className="h-4 w-4 mr-2" />
                    Roll Dice
                  </Button>
                </div>
                
                {diceResults && (
                  <div className="p-4 border rounded-md bg-secondary/10">
                    <h4 className="font-semibold flex items-center mb-2">
                      <Sparkles className="h-4 w-4 mr-2 text-primary" />
                      Result: <span className="ml-2 text-lg">{diceResults.total}</span>
                    </h4>
                    
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="text-muted-foreground">Dice:</span>{" "}
                        {diceResults.count || diceCount}
                        {diceResults.diceType}
                        {diceResults.modifier ? (diceResults.modifier > 0 ? "+" + diceResults.modifier : diceResults.modifier) : ""}
                      </p>
                      
                      <p>
                        <span className="text-muted-foreground">Rolls:</span>{" "}
                        {diceResults.rolls.join(", ")}
                      </p>
                      
                      {diceResults.purpose && (
                        <p>
                          <span className="text-muted-foreground">Purpose:</span>{" "}
                          {diceResults.purpose}
                        </p>
                      )}
                    </div>
                    
                    {isSessionActive && (
                      <div className="mt-3 pt-3 border-t flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => announceDiceRollMutation.mutate({
                            diceRoll: diceResults,
                            isPrivate: false
                          })}
                          disabled={announceDiceRollMutation.isPending}
                        >
                          <PanelRight className="h-3.5 w-3.5 mr-1.5" />
                          Share with Players
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="encounters" className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="encounter-difficulty">Difficulty</Label>
                    <Select 
                      value={difficulty} 
                      onValueChange={(value) => setDifficulty(value as 'easy' | 'medium' | 'hard' | 'deadly')}
                    >
                      <SelectTrigger id="encounter-difficulty">
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                        <SelectItem value="deadly">Deadly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="encounter-environment">Environment</Label>
                    <Select 
                      value={environment} 
                      onValueChange={setEnvironment}
                    >
                      <SelectTrigger id="encounter-environment">
                        <SelectValue placeholder="Select environment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="forest">Forest</SelectItem>
                        <SelectItem value="mountain">Mountain</SelectItem>
                        <SelectItem value="desert">Desert</SelectItem>
                        <SelectItem value="swamp">Swamp</SelectItem>
                        <SelectItem value="dungeon">Dungeon</SelectItem>
                        <SelectItem value="city">City</SelectItem>
                        <SelectItem value="coastal">Coastal</SelectItem>
                        <SelectItem value="underground">Underground</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="player-level">Average Player Level</Label>
                    <Input 
                      id="player-level"
                      type="number"
                      min={1}
                      max={20}
                      value={playerLevel}
                      onChange={(e) => setPlayerLevel(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="player-count">Number of Players</Label>
                    <Input 
                      id="player-count"
                      type="number"
                      min={1}
                      max={10}
                      value={playerCount}
                      onChange={(e) => setPlayerCount(parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={handleGenerateEncounter}
                  disabled={generateEncounterMutation.isPending}
                >
                  <Footprints className="h-4 w-4 mr-2" />
                  Generate Random Encounter
                </Button>
                
                <div className="p-3 border rounded-md bg-secondary/10 text-sm">
                  <p className="flex items-start">
                    <Zap className="h-4 w-4 mr-2 mt-0.5 text-yellow-500 shrink-0" />
                    Encounter generation uses the OpenAI API to create a balanced and thematic encounter
                    based on your parameters. The results will be sent directly to you, and you can
                    choose to share them with your players during the session.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="ambiance" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ambiance-description">Ambiance Description</Label>
                  <Select 
                    value={ambiance} 
                    onValueChange={setAmbiance}
                  >
                    <SelectTrigger id="ambiance-description">
                      <SelectValue placeholder="Select ambiance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tavern">Tavern</SelectItem>
                      <SelectItem value="forest">Forest</SelectItem>
                      <SelectItem value="dungeon">Dungeon</SelectItem>
                      <SelectItem value="cave">Cave</SelectItem>
                      <SelectItem value="city">City</SelectItem>
                      <SelectItem value="ocean">Ocean</SelectItem>
                      <SelectItem value="battle">Battle</SelectItem>
                      <SelectItem value="rain">Rain</SelectItem>
                      <SelectItem value="thunderstorm">Thunderstorm</SelectItem>
                      <SelectItem value="spooky">Spooky</SelectItem>
                      <SelectItem value="marketplace">Marketplace</SelectItem>
                      <SelectItem value="campfire">Campfire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="ambiance-volume">Volume: {volume}%</Label>
                  </div>
                  <Input 
                    id="ambiance-volume"
                    type="range"
                    min={0}
                    max={100}
                    value={volume}
                    onChange={(e) => setVolume(parseInt(e.target.value))}
                    className="cursor-pointer"
                  />
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={handleSetAmbiance}
                  disabled={setAmbianceMutation.isPending || !isSessionActive}
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  Set Ambiance
                </Button>
                
                {!isSessionActive && (
                  <div className="p-3 border border-yellow-200 bg-yellow-50 rounded-md flex items-start gap-2">
                    <Cloud className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-800">
                      Start a live session to enable ambiance settings for your players
                    </p>
                  </div>
                )}
                
                <div className="p-3 border rounded-md bg-secondary/10 text-sm">
                  <p className="flex items-start">
                    <Music className="h-4 w-4 mr-2 mt-0.5 text-primary shrink-0" />
                    Ambiance settings will provide background sounds and music to enhance
                    your players' immersion. For the best experience, encourage players to
                    enable audio in their browser settings.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}