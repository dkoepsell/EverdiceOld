import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { clientRollDice, DiceRoll, DiceRollResult, DiceType } from "@/lib/dice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

const diceTypes: DiceType[] = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"];

export default function DiceRoller() {
  const [selectedDiceType, setSelectedDiceType] = useState<DiceType>("d20");
  const [diceCount, setDiceCount] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [purpose, setPurpose] = useState("");
  const [isRolling, setIsRolling] = useState(false);
  const [diceResult, setDiceResult] = useState<DiceRollResult | null>(null);
  const [rollHistory, setRollHistory] = useState<DiceRollResult[]>([]);
  
  const { toast } = useToast();
  
  const saveDiceRoll = useMutation({
    mutationFn: async (diceRoll: DiceRoll) => {
      const response = await apiRequest("POST", "/api/dice/roll", diceRoll);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/dice/history'] });
      setRollHistory(prev => [data, ...prev].slice(0, 10));
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save dice roll",
        variant: "destructive",
      });
    }
  });

  const handleRollDice = (diceType: DiceType = selectedDiceType) => {
    setIsRolling(true);
    
    // Show animation for 1.5 seconds
    setTimeout(() => {
      const diceRoll: DiceRoll = {
        diceType,
        count: diceCount,
        modifier,
        purpose: purpose || undefined,
      };
      
      // Roll dice client-side for instant feedback
      const result = clientRollDice(diceRoll);
      
      // Update UI with the result
      setDiceResult(result);
      
      // Add to local history first for immediate feedback
      setRollHistory(prev => [result, ...prev].slice(0, 10));
      
      // Save roll to server
      saveDiceRoll.mutate(diceRoll);
      
      // Animation complete
      setIsRolling(false);
      
      // Show toast for natural 20 or natural 1
      if (result.isCritical) {
        toast({
          title: "Critical Hit!",
          description: `You rolled a natural 20 on your ${diceType} roll!`,
          variant: "default",
        });
      } else if (result.isFumble) {
        toast({
          title: "Critical Fail!",
          description: `You rolled a natural 1 on your ${diceType} roll.`,
          variant: "destructive",
        });
      }
      
    }, 1500);
  };

  const handleQuickRoll = (
    diceType: DiceType, 
    count: number = 1, 
    modifier: number = 0, 
    purpose: string = ""
  ) => {
    setSelectedDiceType(diceType);
    setDiceCount(count);
    setModifier(modifier);
    setPurpose(purpose);
    handleRollDice(diceType);
  };

  return (
    <Card className="bg-secondary-light rounded-lg shadow-xl overflow-hidden">
      <CardHeader className="bg-primary">
        <CardTitle className="font-fantasy text-xl font-bold text-white">Dice Roller</CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dice Selection */}
        <div>
          <h3 className="font-fantasy text-lg font-bold mb-3 text-white">Roll Dice</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {diceTypes.map((diceType) => (
              <Button
                key={diceType}
                variant={selectedDiceType === diceType ? "default" : "outline"}
                className={`text-center font-bold ${
                  selectedDiceType === diceType 
                    ? "bg-primary-light hover:bg-primary-dark text-white" 
                    : "bg-parchment hover:bg-parchment-dark text-secondary"
                }`}
                onClick={() => setSelectedDiceType(diceType)}
              >
                {diceType}
              </Button>
            ))}
          </div>
          
          <div className="bg-secondary rounded-lg p-3 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-medium">Custom Roll</span>
              <Button 
                variant="ghost" 
                className="text-gold hover:text-gold-dark transition text-sm"
                onClick={() => handleRollDice()}
                disabled={isRolling}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"></path>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg> Roll
              </Button>
            </div>
            <div className="flex space-x-2 items-center">
              <Input
                type="number"
                min={1}
                max={10}
                value={diceCount}
                onChange={(e) => setDiceCount(parseInt(e.target.value) || 1)}
                className="w-16 bg-secondary-light border border-gray-700 rounded-lg px-2 py-1 text-center text-white"
              />
              <Select value={selectedDiceType} onValueChange={(value) => setSelectedDiceType(value as DiceType)}>
                <SelectTrigger className="bg-secondary-light border border-gray-700 rounded-lg text-white">
                  <SelectValue placeholder={selectedDiceType} />
                </SelectTrigger>
                <SelectContent>
                  {diceTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
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
            
            <div className="mt-3">
              <Input
                type="text"
                placeholder="Purpose (e.g. Attack Roll)"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full bg-secondary-light border border-gray-700 rounded-lg px-2 py-1 text-white"
              />
            </div>
          </div>
          
          <div className="bg-secondary rounded-lg p-3">
            <h4 className="text-white font-medium mb-2">Common Rolls</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                className="bg-primary-light hover:bg-primary text-white p-2 rounded-lg transition text-sm"
                onClick={() => handleQuickRoll("d20", 1, 3, "Attack Roll")}
              >
                Attack (d20+3)
              </Button>
              <Button 
                className="bg-primary-light hover:bg-primary text-white p-2 rounded-lg transition text-sm"
                onClick={() => handleQuickRoll("d8", 1, 3, "Damage")}
              >
                Damage (1d8+3)
              </Button>
              <Button 
                className="bg-primary-light hover:bg-primary text-white p-2 rounded-lg transition text-sm"
                onClick={() => handleQuickRoll("d20", 1, 5, "Skill Check")}
              >
                Skill Check (d20+5)
              </Button>
              <Button 
                className="bg-primary-light hover:bg-primary text-white p-2 rounded-lg transition text-sm"
                onClick={() => handleQuickRoll("d20", 1, 2, "Saving Throw")}
              >
                Saving Throw (d20+2)
              </Button>
            </div>
          </div>
        </div>
        
        {/* Dice Results */}
        <div>
          <h3 className="font-fantasy text-lg font-bold mb-3 text-white">Results</h3>
          
          {/* 3D Dice Visualization */}
          <div className="dice-container relative h-40 flex items-center justify-center mb-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={isRolling ? "rolling" : "result"}
                initial={{ scale: 0.8, rotateX: 0, rotateY: 0, rotateZ: 0 }}
                animate={
                  isRolling
                    ? {
                        scale: 1,
                        rotateX: [0, 180, 360, 540, 720],
                        rotateY: [0, 90, 180, 270, 360],
                        rotateZ: [0, 45, 90, 135, 180],
                        transition: { duration: 1.5, ease: "easeOut" }
                      }
                    : { scale: 1, rotateX: 0, rotateY: 0, rotateZ: 0 }
                }
                exit={{ scale: 0.8 }}
                className={`dice w-24 h-24 relative bg-parchment rounded-xl flex items-center justify-center 
                  ${diceResult?.isCritical ? "bg-gold" : ""}`}
              >
                <span className="text-primary font-fantasy text-4xl font-bold">
                  {diceResult ? diceResult.rolls[0] : "?"}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>
          
          {diceResult && (
            <div className="mb-4 text-center">
              <p className="text-white font-medium mb-1">
                {diceResult.rolls.length > 1 ? (
                  <>
                    {diceResult.count}{diceResult.diceType} + {diceResult.modifier} = {diceResult.total}
                  </>
                ) : (
                  <>
                    {diceResult.diceType} + {diceResult.modifier} = {diceResult.total}
                  </>
                )}
              </p>
              {diceResult.rolls.length > 1 && (
                <p className="text-gray-400 text-sm">
                  Rolls: [{diceResult.rolls.join(', ')}]
                </p>
              )}
              {diceResult.purpose && (
                <p className="text-gray-300 mt-1">
                  {diceResult.purpose}
                </p>
              )}
            </div>
          )}
          
          {/* Roll History */}
          <div className="bg-secondary rounded-lg p-3 max-h-40 overflow-y-auto scroll-container">
            <h4 className="text-white font-medium mb-2">Roll History</h4>
            {rollHistory.length > 0 ? (
              <div className="space-y-2">
                {rollHistory.map((roll, index) => (
                  <div key={index} className="flex justify-between items-center border-b border-gray-700 pb-1 text-sm">
                    <div>
                      <span className="text-gold">
                        {roll.count > 1 ? `${roll.count}${roll.diceType}` : roll.diceType}
                        {roll.modifier !== 0 && (
                          roll.modifier > 0 ? `+${roll.modifier}` : roll.modifier
                        )}
                      </span>
                      {roll.purpose && (
                        <span className="text-gray-400 ml-2">{roll.purpose}</span>
                      )}
                    </div>
                    <span className={`font-bold ${roll.isCritical ? "text-gold" : "text-white"}`}>
                      {roll.total}
                      {roll.isCritical && " (Critical!)"}
                      {roll.isFumble && " (Fumble!)"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-2">No roll history yet</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
