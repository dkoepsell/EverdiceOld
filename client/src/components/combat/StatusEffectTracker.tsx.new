import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

// D&D 5e status effects
type StatusEffect = {
  name: string;
  description: string;
  severity: 'positive' | 'minor' | 'major' | 'severe';
  color: string;
  icon?: string;
  duration?: number;
};

// Standard D&D 5e status effects
const DND_STATUS_EFFECTS: StatusEffect[] = [
  {
    name: "Blinded",
    description: "A blinded creature can't see and automatically fails any ability check that requires sight. Attack rolls against the creature have advantage, and the creature's attack rolls have disadvantage.",
    severity: "major",
    color: "bg-amber-100 text-amber-800 border-amber-300"
  },
  {
    name: "Charmed",
    description: "A charmed creature can't attack the charmer or target the charmer with harmful abilities or magical effects. The charmer has advantage on any ability check to interact socially with the creature.",
    severity: "major",
    color: "bg-pink-100 text-pink-800 border-pink-300"
  },
  {
    name: "Deafened",
    description: "A deafened creature can't hear and automatically fails any ability check that requires hearing.",
    severity: "minor",
    color: "bg-blue-100 text-blue-800 border-blue-300"
  },
  {
    name: "Frightened",
    description: "A frightened creature has disadvantage on ability checks and attack rolls while the source of its fear is within line of sight. The creature can't willingly move closer to the source of its fear.",
    severity: "major",
    color: "bg-purple-100 text-purple-800 border-purple-300"
  },
  {
    name: "Grappled",
    description: "A grappled creature's speed becomes 0, and it can't benefit from any bonus to its speed. The condition ends if the grappler is incapacitated. The condition also ends if an effect removes the grappled creature from the reach of the grappler or grappling effect.",
    severity: "minor",
    color: "bg-gray-100 text-gray-800 border-gray-300"
  },
  {
    name: "Incapacitated",
    description: "An incapacitated creature can't take actions or reactions.",
    severity: "major",
    color: "bg-orange-100 text-orange-800 border-orange-300"
  },
  {
    name: "Invisible",
    description: "An invisible creature is impossible to see without the aid of magic or a special sense. For the purpose of hiding, the creature is heavily obscured. The creature's location can be detected by any noise it makes or any tracks it leaves. Attack rolls against the creature have disadvantage, and the creature's attack rolls have advantage.",
    severity: "positive",
    color: "bg-sky-100 text-sky-800 border-sky-300"
  },
  {
    name: "Paralyzed",
    description: "A paralyzed creature is incapacitated and can't move or speak. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage. Any attack that hits the creature is a critical hit if the attacker is within 5 feet of the creature.",
    severity: "severe",
    color: "bg-indigo-100 text-indigo-800 border-indigo-300"
  },
  {
    name: "Petrified",
    description: "A petrified creature is transformed, along with any nonmagical object it is wearing or carrying, into a solid inanimate substance (usually stone). Its weight increases by a factor of ten, and it ceases aging. The creature is incapacitated, can't move or speak, and is unaware of its surroundings. Attack rolls against the creature have advantage. The creature automatically fails Strength and Dexterity saving throws. The creature has resistance to all damage. The creature is immune to poison and disease, although a poison or disease already in its system is suspended, not neutralized.",
    severity: "severe",
    color: "bg-stone-100 text-stone-800 border-stone-300"
  },
  {
    name: "Poisoned",
    description: "A poisoned creature has disadvantage on attack rolls and ability checks.",
    severity: "major",
    color: "bg-green-100 text-green-800 border-green-300"
  },
  {
    name: "Prone",
    description: "A prone creature's only movement option is to crawl, unless it stands up and thereby ends the condition. The creature has disadvantage on attack rolls. An attack roll against the creature has advantage if the attacker is within 5 feet of the creature. Otherwise, the attack roll has disadvantage.",
    severity: "minor",
    color: "bg-amber-100 text-amber-800 border-amber-300"
  },
  {
    name: "Restrained",
    description: "A restrained creature's speed becomes 0, and it can't benefit from any bonus to its speed. Attack rolls against the creature have advantage, and the creature's attack rolls have disadvantage. The creature has disadvantage on Dexterity saving throws.",
    severity: "major",
    color: "bg-orange-100 text-orange-800 border-orange-300"
  },
  {
    name: "Stunned",
    description: "A stunned creature is incapacitated, can't move, and can speak only falteringly. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage.",
    severity: "major",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300"
  },
  {
    name: "Unconscious",
    description: "An unconscious creature is incapacitated, can't move or speak, and is unaware of its surroundings. The creature drops whatever it's holding and falls prone. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage. Any attack that hits the creature is a critical hit if the attacker is within 5 feet of the creature.",
    severity: "severe",
    color: "bg-red-100 text-red-800 border-red-300"
  },
  {
    name: "Exhaustion",
    description: "Exhaustion is measured in six levels. Effects are cumulative. Level 1: Disadvantage on ability checks. Level 2: Speed halved. Level 3: Disadvantage on attack rolls and saving throws. Level 4: Hit point maximum halved. Level 5: Speed reduced to 0. Level 6: Death.",
    severity: "severe",
    color: "bg-rose-100 text-rose-800 border-rose-300"
  },
  {
    name: "Bane",
    description: "Target must roll a d4 and subtract the number rolled from attack rolls and saving throws.",
    severity: "major",
    color: "bg-violet-100 text-violet-800 border-violet-300"
  },
  {
    name: "Blessed",
    description: "Target can roll a d4 and add the number rolled to attack rolls and saving throws.",
    severity: "positive",
    color: "bg-emerald-100 text-emerald-800 border-emerald-300"
  },
  {
    name: "Hasted",
    description: "Speed doubled, +2 to AC, advantage on Dexterity saves, and an additional action on each turn.",
    severity: "positive",
    color: "bg-cyan-100 text-cyan-800 border-cyan-300"
  },
  {
    name: "Slowed",
    description: "Speed halved, -2 to AC and Dexterity saves, and can't use reactions or more than one action per turn.",
    severity: "major",
    color: "bg-zinc-100 text-zinc-800 border-zinc-300"
  }
];

interface StatusEffectTrackerProps {
  characterName?: string;
}

export default function StatusEffectTracker({ characterName = 'Character' }: StatusEffectTrackerProps) {
  const [activeEffects, setActiveEffects] = useState<Array<StatusEffect & { id: string; remainingRounds?: number }>>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [customEffect, setCustomEffect] = useState<{
    name: string;
    description: string;
    severity: string;
    duration: number;
  }>({
    name: '',
    description: '',
    severity: 'minor',
    duration: 1
  });
  const [selectedEffectName, setSelectedEffectName] = useState('');
  const [showEffectDetails, setShowEffectDetails] = useState<string | null>(null);

  const handleAddStandardEffect = () => {
    const effect = DND_STATUS_EFFECTS.find(e => e.name === selectedEffectName);
    if (!effect) return;
    
    const newEffect = {
      ...effect,
      id: Date.now().toString(),
      remainingRounds: customEffect.duration
    };
    
    setActiveEffects([...activeEffects, newEffect]);
    setShowAddDialog(false);
    setSelectedEffectName('');
  };
  
  const handleAddCustomEffect = () => {
    if (!customEffect.name) return;
    
    const severityValue = customEffect.severity as 'positive' | 'minor' | 'major' | 'severe';
    
    const newEffect = {
      ...customEffect,
      severity: severityValue,
      id: Date.now().toString(),
      color: getSeverityColor(severityValue),
      remainingRounds: customEffect.duration
    };
    
    setActiveEffects([...activeEffects, newEffect as any]);
    setShowAddDialog(false);
    setCustomEffect({
      name: '',
      description: '',
      severity: 'minor',
      duration: 1
    });
  };
  
  const removeEffect = (id: string) => {
    setActiveEffects(activeEffects.filter(effect => effect.id !== id));
  };
  
  const decrementRounds = (id: string) => {
    setActiveEffects(activeEffects.map(effect => {
      if (effect.id === id && effect.remainingRounds !== undefined) {
        const remainingRounds = Math.max(0, effect.remainingRounds - 1);
        return { ...effect, remainingRounds };
      }
      return effect;
    }));
  };
  
  const getSeverityColor = (severity: 'positive' | 'minor' | 'major' | 'severe') => {
    switch (severity) {
      case 'positive':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'minor':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'major':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'severe':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  const decrementAllRounds = () => {
    setActiveEffects(activeEffects.map(effect => {
      if (effect.remainingRounds !== undefined) {
        const remainingRounds = Math.max(0, effect.remainingRounds - 1);
        return { ...effect, remainingRounds };
      }
      return effect;
    }));
  };
  
  const clearExpiredEffects = () => {
    setActiveEffects(activeEffects.filter(effect => {
      return effect.remainingRounds === undefined || effect.remainingRounds > 0;
    }));
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="bg-primary text-white pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-white flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Status Effects {characterName ? `(${characterName})` : ''}
          </CardTitle>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-primary-dark"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Effect
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {activeEffects.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No active status effects</p>
            <p className="text-sm mt-2">Click "Add Effect" to apply status conditions</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={decrementAllRounds}
              >
                Next Turn
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={clearExpiredEffects}
              >
                Clear Expired
              </Button>
            </div>
            
            <div className="grid gap-2">
              {activeEffects.map(effect => (
                <div key={effect.id} className={`p-3 rounded-lg border ${effect.color} relative`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium flex items-center">
                        {effect.name}
                        {effect.remainingRounds !== undefined && (
                          <Badge 
                            variant="outline" 
                            className="ml-2 font-mono bg-white/50"
                          >
                            {effect.remainingRounds} {effect.remainingRounds === 1 ? 'round' : 'rounds'}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="mt-1 text-sm line-clamp-1">
                        {effect.description}
                      </div>
                    </div>
                    
                    <div className="flex space-x-1">
                      {effect.remainingRounds !== undefined && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 w-7 p-0"
                          onClick={() => decrementRounds(effect.id)}
                        >
                          -1
                        </Button>
                      )}
                      
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowEffectDetails(effect.id)}
                      >
                        ?
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-800"
                        onClick={() => removeEffect(effect.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800">
            <strong>D&D Combat Rules:</strong> Most status effects end after one minute (10 rounds) or when a saving throw is successful. Track the rounds remaining for timed effects, and remove effects when their conditions end.
          </p>
        </div>
      </CardContent>
      
      {/* Add Effect Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Status Effect</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Standard D&D Effects</Label>
              <Select 
                value={selectedEffectName} 
                onValueChange={setSelectedEffectName}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a standard effect" />
                </SelectTrigger>
                <SelectContent>
                  {DND_STATUS_EFFECTS.map(effect => (
                    <SelectItem key={effect.name} value={effect.name}>
                      {effect.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedEffectName && (
                <div className="mt-2 p-3 rounded-lg bg-gray-50 text-sm">
                  {DND_STATUS_EFFECTS.find(e => e.name === selectedEffectName)?.description}
                </div>
              )}
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t"></span>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-2 text-muted-foreground">
                  OR
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="custom-name">Custom Effect</Label>
              <Input 
                id="custom-name" 
                placeholder="Effect name" 
                value={customEffect.name}
                onChange={(e) => setCustomEffect({ ...customEffect, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="custom-description">Description</Label>
              <Input 
                id="custom-description" 
                placeholder="Effect description" 
                value={customEffect.description}
                onChange={(e) => setCustomEffect({ ...customEffect, description: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="custom-severity">Severity</Label>
              <Select 
                value={customEffect.severity} 
                onValueChange={(value) => setCustomEffect({ ...customEffect, severity: value })}
              >
                <SelectTrigger id="custom-severity">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">Positive (Buff)</SelectItem>
                  <SelectItem value="minor">Minor Negative</SelectItem>
                  <SelectItem value="major">Major Negative</SelectItem>
                  <SelectItem value="severe">Severe Negative</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (Rounds)</Label>
              <Input 
                id="duration" 
                type="number" 
                min="1"
                value={customEffect.duration}
                onChange={(e) => setCustomEffect({ 
                  ...customEffect, 
                  duration: parseInt(e.target.value) || 1 
                })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={selectedEffectName ? handleAddStandardEffect : handleAddCustomEffect}
              disabled={!selectedEffectName && !customEffect.name}
            >
              Add Effect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Effect Details Dialog */}
      {showEffectDetails && (
        <Dialog open={!!showEffectDetails} onOpenChange={() => setShowEffectDetails(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {activeEffects.find(e => e.id === showEffectDetails)?.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <p className="text-sm">
                {activeEffects.find(e => e.id === showEffectDetails)?.description}
              </p>
              
              {activeEffects.find(e => e.id === showEffectDetails)?.remainingRounds !== undefined && (
                <div className="mt-4 p-2 bg-gray-100 rounded-lg">
                  <p className="text-sm">
                    <strong>Duration:</strong> {activeEffects.find(e => e.id === showEffectDetails)?.remainingRounds} {
                      activeEffects.find(e => e.id === showEffectDetails)?.remainingRounds === 1 ? 'round' : 'rounds'
                    } remaining
                  </p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button onClick={() => setShowEffectDetails(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}