import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { diceTypes, rollDice } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AnimatePresence, motion } from "framer-motion";

interface DiceRollResult {
  diceType: string;
  quantity: number;
  modifier: number;
  rolls: number[];
  total: number;
  rollType?: string;
}

export interface DiceRollerProps {
  characterId?: number;
  onRollComplete?: (result: DiceRollResult) => void;
}

export function DiceRoller({ characterId, onRollComplete }: DiceRollerProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedDice, setSelectedDice] = useState<string>("d20");
  const [modifier, setModifier] = useState<number>(0);
  const [rollHistory, setRollHistory] = useState<DiceRollResult[]>([]);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [currentRoll, setCurrentRoll] = useState<DiceRollResult | null>(null);
  const [rollType, setRollType] = useState<string>("");
  
  const diceRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Common roll types based on D&D mechanics
  const commonRolls = [
    { name: "Attack", notation: "d20+3", type: "attack" },
    { name: "Damage", notation: "1d8+3", type: "damage" },
    { name: "Skill Check", notation: "d20+5", type: "skill" },
    { name: "Saving Throw", notation: "d20+2", type: "save" }
  ];
  
  const handleDiceClick = (diceType: string) => {
    rollDiceWithAnimation(1, parseInt(diceType.substring(1)), 0, undefined);
  };
  
  const handleCustomRoll = () => {
    const sides = parseInt(selectedDice.substring(1));
    rollDiceWithAnimation(quantity, sides, modifier, rollType || undefined);
  };
  
  const handleCommonRoll = (notation: string, type: string) => {
    const parts = notation.split(/[d+]/);
    const quantity = parts[0] ? parseInt(parts[0]) : 1;
    const sides = parseInt(parts[1]);
    const modifier = parts[2] ? parseInt(parts[2]) : 0;
    
    rollDiceWithAnimation(quantity, sides, modifier, type);
  };
  
  const rollDiceWithAnimation = (quantity: number, sides: number, modifier: number, rollType?: string) => {
    setIsRolling(true);
    
    // Add rolling animation
    if (diceRef.current) {
      diceRef.current.classList.add("rolling");
    }
    
    // Generate actual dice roll result
    const result = rollDice(sides, quantity, modifier);
    
    // Create the roll result object
    const rollResult: DiceRollResult = {
      diceType: `d${sides}`,
      quantity,
      modifier,
      rolls: result.rolls,
      total: result.total,
      rollType
    };
    
    // Set current roll to animate
    setCurrentRoll(rollResult);
    
    // Save roll to database
    saveRollToDatabase(rollResult);
    
    // Remove animation class and update roll history after animation
    setTimeout(() => {
      if (diceRef.current) {
        diceRef.current.classList.remove("rolling");
      }
      
      setRollHistory(prev => [rollResult, ...prev.slice(0, 9)]);
      setIsRolling(false);
      
      if (onRollComplete) {
        onRollComplete(rollResult);
      }
    }, 1500);
  };
  
  const saveRollToDatabase = async (rollResult: DiceRollResult) => {
    try {
      await apiRequest("POST", "/api/dice-rolls", {
        diceType: rollResult.diceType,
        quantity: rollResult.quantity,
        modifier: rollResult.modifier,
        result: rollResult.total,
        rollType: rollResult.rollType,
        characterId
      });
    } catch (error) {
      toast({
        title: "Error saving roll",
        description: "There was a problem saving your dice roll.",
        variant: "destructive"
      });
    }
  };
  
  const formatRollLabel = (roll: DiceRollResult): string => {
    let notation = "";
    if (roll.quantity > 1) {
      notation += roll.quantity;
    }
    notation += roll.diceType;
    if (roll.modifier !== 0) {
      notation += roll.modifier > 0 ? `+${roll.modifier}` : roll.modifier;
    }
    return notation;
  };
  
  const isCritical = (roll: DiceRollResult): boolean => {
    return roll.diceType === "d20" && roll.rolls.includes(20);
  };
  
  const isCriticalFail = (roll: DiceRollResult): boolean => {
    return roll.diceType === "d20" && roll.rolls.includes(1);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="font-fantasy text-lg font-bold mb-3 text-white">Roll Dice</h3>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {diceTypes.slice(0, 6).map((diceType) => (
            <Button
              key={diceType}
              variant="secondary"
              className="bg-[hsl(var(--parchment))] hover:bg-[hsl(var(--parchment-dark))] text-primary p-3 rounded-lg text-center font-bold"
              onClick={() => handleDiceClick(diceType)}
            >
              {diceType}
            </Button>
          ))}
        </div>
        
        <Card className="bg-secondary mb-4">
          <CardContent className="pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-medium">Custom Roll</span>
              <Button
                size="sm"
                variant="ghost"
                className="text-[hsl(var(--gold))] hover:text-[hsl(var(--gold-dark))] transition text-sm"
                onClick={handleCustomRoll}
              >
                <i className="fas fa-dice mr-1"></i> Roll
              </Button>
            </div>
            <div className="flex space-x-2">
              <Input
                type="number"
                min={1}
                max={10}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="w-16 bg-secondary-light border border-gray-700 rounded-lg px-2 py-1 text-center text-white"
              />
              <Select value={selectedDice} onValueChange={setSelectedDice}>
                <SelectTrigger className="bg-secondary-light border border-gray-700 rounded-lg px-2 py-1 text-white">
                  <SelectValue placeholder="d20" />
                </SelectTrigger>
                <SelectContent>
                  {diceTypes.map((diceType) => (
                    <SelectItem key={diceType} value={diceType}>
                      {diceType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-white self-center">+</span>
              <Input
                type="number"
                value={modifier}
                onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
                className="w-16 bg-secondary-light border border-gray-700 rounded-lg px-2 py-1 text-center text-white"
              />
            </div>
            <Input
              className="mt-2 bg-secondary-light border border-gray-700"
              placeholder="Roll name (optional)"
              value={rollType}
              onChange={(e) => setRollType(e.target.value)}
            />
          </CardContent>
        </Card>
        
        <Card className="bg-secondary">
          <CardContent className="pt-4">
            <h4 className="text-white font-medium mb-2">Common Rolls</h4>
            <div className="grid grid-cols-2 gap-2">
              {commonRolls.map((roll) => (
                <Button
                  key={roll.type}
                  className="bg-primary-light hover:bg-primary text-white p-2 rounded-lg transition text-sm"
                  onClick={() => handleCommonRoll(roll.notation, roll.type)}
                >
                  {roll.name} ({roll.notation})
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <h3 className="font-fantasy text-lg font-bold mb-3 text-white">Results</h3>
        
        {/* 3D Dice Visualization */}
        <div className="dice-container relative h-40 flex items-center justify-center mb-4">
          <div
            ref={diceRef}
            className={`dice w-24 h-24 relative bg-[hsl(var(--parchment))] rounded-xl flex items-center justify-center ${
              currentRoll && isCritical(currentRoll) ? "bg-[hsl(var(--gold))]" : ""
            } ${
              currentRoll && isCriticalFail(currentRoll) ? "bg-red-600" : ""
            }`}
          >
            <span className="text-primary font-fantasy text-4xl font-bold">
              {currentRoll?.total || "-"}
            </span>
          </div>
        </div>
        
        {/* Roll History */}
        <Card className="bg-secondary">
          <CardHeader className="pb-0">
            <CardTitle className="text-white font-medium text-base">Roll History</CardTitle>
          </CardHeader>
          <CardContent className="max-h-48 overflow-y-auto scroll-container">
            <AnimatePresence>
              {rollHistory.length > 0 ? (
                <div className="space-y-2">
                  {rollHistory.map((roll, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex justify-between items-center border-b border-gray-700 pb-1 text-sm"
                    >
                      <div>
                        <span className="text-[hsl(var(--gold))]">{formatRollLabel(roll)}</span>
                        {roll.rollType && (
                          <span className="text-gray-400 ml-1">({roll.rollType})</span>
                        )}
                      </div>
                      <span className={`font-bold text-white ${
                        isCritical(roll) ? "text-[hsl(var(--gold))]" : ""
                      } ${
                        isCriticalFail(roll) ? "text-red-500" : ""
                      }`}>
                        {roll.total}
                        {isCritical(roll) && <span className="ml-1">(Critical!)</span>}
                        {isCriticalFail(roll) && <span className="ml-1">(Fail!)</span>}
                      </span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-center py-4">
                  No dice rolls yet. Roll some dice!
                </div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
