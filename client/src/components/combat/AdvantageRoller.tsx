import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dices, ArrowUp, ArrowDown, RotateCw } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function AdvantageRoller() {
  const { toast } = useToast();
  const [result, setResult] = useState<{
    firstRoll: number | null;
    secondRoll: number | null;
    finalResult: number | null;
    modifier: number;
    advantage: 'normal' | 'advantage' | 'disadvantage';
  }>({
    firstRoll: null,
    secondRoll: null,
    finalResult: null,
    modifier: 0,
    advantage: 'normal'
  });
  
  const [diceType, setDiceType] = useState('d20');
  const [isRolling, setIsRolling] = useState(false);
  const [purpose, setPurpose] = useState('');
  
  const diceTypes = [
    { value: 'd4', label: 'D4' },
    { value: 'd6', label: 'D6' },
    { value: 'd8', label: 'D8' },
    { value: 'd10', label: 'D10' },
    { value: 'd12', label: 'D12' },
    { value: 'd20', label: 'D20' },
    { value: 'd100', label: 'D100' }
  ];
  
  // Map dice type to max value
  const diceValues = {
    'd4': 4,
    'd6': 6,
    'd8': 8,
    'd10': 10,
    'd12': 12,
    'd20': 20,
    'd100': 100
  };
  
  // Calculate the appropriate animation duration based on dice type
  const getAnimationDuration = () => {
    switch (diceType) {
      case 'd4':
        return 800;
      case 'd6':
      case 'd8':
        return 1000;
      case 'd10':
      case 'd12':
        return 1200;
      case 'd20':
        return 1400;
      case 'd100':
        return 1600;
      default:
        return 1000;
    }
  };
  
  const rollDice = async (rollType: 'normal' | 'advantage' | 'disadvantage' = 'normal') => {
    setIsRolling(true);
    setResult({
      ...result,
      firstRoll: null,
      secondRoll: null,
      finalResult: null,
      advantage: rollType
    });
    
    // Simulate rolling animation
    const animationDuration = getAnimationDuration();
    const maxValue = diceValues[diceType as keyof typeof diceValues];
    
    // Client-side animation of dice rolling
    const animateRoll = (duration: number) => {
      const startTime = Date.now();
      const endTime = startTime + duration;
      
      const updateRoll = () => {
        if (Date.now() < endTime) {
          const firstRoll = Math.floor(Math.random() * maxValue) + 1;
          const secondRoll = rollType !== 'normal' 
            ? Math.floor(Math.random() * maxValue) + 1
            : null;
            
          setResult(prev => ({
            ...prev,
            firstRoll,
            secondRoll
          }));
          
          requestAnimationFrame(updateRoll);
        }
      };
      
      updateRoll();
    };
    
    animateRoll(animationDuration);
    
    try {
      // Make the actual server-side roll
      const count = 1; // We'll always roll just one die for this
      const type = diceType.replace('d', '');
      const modifier = result.modifier;
      
      const response = await apiRequest('POST', '/api/dice/roll', {
        diceType: type,
        count,
        modifier,
        purpose: purpose || `${rollType} roll`,
        rollType
      });
      
      const data = await response.json();
      
      // After animation completes, set the actual result
      setTimeout(() => {
        const actualFirstRoll = data.rolls[0];
        const actualSecondRoll = data.rolls[1] || null;
        
        let finalResult;
        if (rollType === 'advantage') {
          finalResult = Math.max(actualFirstRoll, actualSecondRoll || 0);
        } else if (rollType === 'disadvantage') {
          finalResult = Math.min(actualFirstRoll, actualSecondRoll || Number.MAX_VALUE);
        } else {
          finalResult = actualFirstRoll;
        }
        
        // Add modifier to final result
        finalResult += modifier;
        
        setResult({
          firstRoll: actualFirstRoll,
          secondRoll: actualSecondRoll,
          finalResult,
          modifier,
          advantage: rollType
        });
        
        setIsRolling(false);
        
        // Show toast notification with result
        toast({
          title: `${rollType.charAt(0).toUpperCase() + rollType.slice(1)} Roll`,
          description: `You rolled a ${finalResult} ${purpose ? `for ${purpose}` : ''}`,
        });
      }, animationDuration);
      
    } catch (error) {
      console.error('Error rolling dice:', error);
      setIsRolling(false);
      
      // Fallback to client-side roll if server fails
      const roll1 = Math.floor(Math.random() * maxValue) + 1;
      const roll2 = rollType !== 'normal' ? Math.floor(Math.random() * maxValue) + 1 : null;
      
      let finalResult;
      if (rollType === 'advantage') {
        finalResult = Math.max(roll1, roll2 || 0);
      } else if (rollType === 'disadvantage') {
        finalResult = Math.min(roll1, roll2 || Number.MAX_VALUE);
      } else {
        finalResult = roll1;
      }
      
      // Add modifier
      finalResult += result.modifier;
      
      setResult({
        firstRoll: roll1,
        secondRoll: roll2,
        finalResult,
        modifier: result.modifier,
        advantage: rollType
      });
      
      toast({
        title: 'Local Roll (Server Error)',
        description: `You rolled a ${finalResult} ${purpose ? `for ${purpose}` : ''}`,
        variant: 'destructive'
      });
    }
  };
  
  const resetRoll = () => {
    setResult({
      firstRoll: null,
      secondRoll: null,
      finalResult: null,
      modifier: 0,
      advantage: 'normal'
    });
    setPurpose('');
  };
  
  // Helper function to determine if a roll is critical (for d20 only)
  const isCritical = (roll: number | null) => {
    return diceType === 'd20' && roll === 20;
  };
  
  // Helper function to determine if a roll is a critical failure (for d20 only)
  const isCriticalFailure = (roll: number | null) => {
    return diceType === 'd20' && roll === 1;
  };
  
  return (
    <Card className="shadow-md">
      <CardHeader className="bg-primary text-white pb-3">
        <CardTitle className="text-white flex items-center">
          <Dices className="mr-2 h-5 w-5" />
          Advantage/Disadvantage Roller
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4">
        <Tabs defaultValue="dice" className="w-full">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="dice" className="flex-1">Roll Dice</TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dice">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center"
                  onClick={() => rollDice('normal')}
                  disabled={isRolling}
                >
                  <Dices className="h-6 w-6 mb-1" />
                  <span>Normal Roll</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center bg-green-50 hover:bg-green-100 border-green-200"
                  onClick={() => rollDice('advantage')}
                  disabled={isRolling}
                >
                  <ArrowUp className="h-6 w-6 mb-1 text-green-600" />
                  <span className="text-green-700">Advantage</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center bg-red-50 hover:bg-red-100 border-red-200"
                  onClick={() => rollDice('disadvantage')}
                  disabled={isRolling}
                >
                  <ArrowDown className="h-6 w-6 mb-1 text-red-600" />
                  <span className="text-red-700">Disadvantage</span>
                </Button>
              </div>
              
              <div className="pt-4">
                <div className="bg-parchment-dark rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-fantasy text-lg">Roll Result</h3>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetRoll}
                      disabled={isRolling}
                    >
                      <RotateCw className="h-4 w-4 mr-1" />
                      Reset
                    </Button>
                  </div>
                  
                  {isRolling ? (
                    <div className="text-center py-4">
                      <div className="animate-bounce text-4xl font-mono mb-2">
                        ?
                      </div>
                      <p className="text-sm text-gray-600">Rolling dice...</p>
                    </div>
                  ) : (
                    <div>
                      {result.finalResult !== null ? (
                        <div className="text-center p-2">
                          <div className="text-4xl font-mono font-bold mb-2">
                            {result.finalResult}
                          </div>
                          
                          {result.advantage !== 'normal' && (
                            <div className="grid grid-cols-2 gap-2 mt-2 text-center">
                              <div className={`p-2 rounded-lg ${
                                isCritical(result.firstRoll) 
                                  ? 'bg-green-100 text-green-800' 
                                  : isCriticalFailure(result.firstRoll)
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100'
                              }`}>
                                <div className="text-sm font-medium">First Roll</div>
                                <div className="text-xl font-mono">
                                  {result.firstRoll}
                                  {result.modifier !== 0 && (
                                    <span className="text-sm text-gray-500">
                                      {result.modifier > 0 ? ' + ' : ' - '}
                                      {Math.abs(result.modifier)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className={`p-2 rounded-lg ${
                                isCritical(result.secondRoll) 
                                  ? 'bg-green-100 text-green-800' 
                                  : isCriticalFailure(result.secondRoll)
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100'
                              }`}>
                                <div className="text-sm font-medium">Second Roll</div>
                                <div className="text-xl font-mono">
                                  {result.secondRoll}
                                  {result.modifier !== 0 && (
                                    <span className="text-sm text-gray-500">
                                      {result.modifier > 0 ? ' + ' : ' - '}
                                      {Math.abs(result.modifier)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-3 text-sm text-gray-600">
                            {result.advantage === 'normal' ? (
                              <span>Normal Roll: {diceType} {result.modifier !== 0 ? (result.modifier > 0 ? `+ ${result.modifier}` : `- ${Math.abs(result.modifier)}`) : ''}</span>
                            ) : result.advantage === 'advantage' ? (
                              <span>Advantage: Roll 2{diceType}, take higher{result.modifier !== 0 ? (result.modifier > 0 ? ` + ${result.modifier}` : ` - ${Math.abs(result.modifier)}`) : ''}</span>
                            ) : (
                              <span>Disadvantage: Roll 2{diceType}, take lower{result.modifier !== 0 ? (result.modifier > 0 ? ` + ${result.modifier}` : ` - ${Math.abs(result.modifier)}`) : ''}</span>
                            )}
                          </div>
                          
                          {purpose && (
                            <div className="mt-1 text-sm font-medium">
                              Purpose: {purpose}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <p>Click a button above to roll</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="settings">
            <div className="space-y-4">
              <div>
                <Label htmlFor="dice-type">Dice Type</Label>
                <Select 
                  value={diceType} 
                  onValueChange={setDiceType}
                  disabled={isRolling}
                >
                  <SelectTrigger id="dice-type">
                    <SelectValue placeholder="Select Dice Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {diceTypes.map(dice => (
                      <SelectItem key={dice.value} value={dice.value}>
                        {dice.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="modifier">Modifier</Label>
                <Input
                  id="modifier"
                  type="number"
                  value={result.modifier}
                  onChange={(e) => setResult({ ...result, modifier: parseInt(e.target.value) || 0 })}
                  disabled={isRolling}
                />
              </div>
              
              <div>
                <Label htmlFor="purpose">Roll Purpose (optional)</Label>
                <Input
                  id="purpose"
                  placeholder="e.g. Attack, Saving Throw, Skill Check"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  disabled={isRolling}
                />
              </div>
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>D&D Rules:</strong> Advantage means you roll twice and take the higher result. Disadvantage means you roll twice and take the lower result. These mechanics apply to attack rolls, ability checks, and saving throws.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}