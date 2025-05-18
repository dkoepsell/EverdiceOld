import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sword, Play, Pause, RotateCw, Plus, X, SkipForward } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Combatant {
  id: string;
  name: string;
  initiative: number;
  isPlayer: boolean;
  status?: string[];
}

export default function InitiativeTracker() {
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCombatant, setNewCombatant] = useState({
    name: '',
    initiative: 0,
    isPlayer: true
  });
  const [activeCombatantIndex, setActiveCombatantIndex] = useState<number | null>(null);
  const [combatActive, setCombatActive] = useState(false);

  // Sort combatants by initiative (highest first)
  const sortedCombatants = [...combatants].sort((a, b) => b.initiative - a.initiative);

  // Add a combatant to the tracker
  const addCombatant = () => {
    if (!newCombatant.name.trim()) return;
    
    setCombatants([
      ...combatants, 
      {
        id: Date.now().toString(),
        name: newCombatant.name,
        initiative: newCombatant.initiative,
        isPlayer: newCombatant.isPlayer,
        status: []
      }
    ]);
    
    setNewCombatant({
      name: '',
      initiative: 0,
      isPlayer: true
    });
    
    setShowAddDialog(false);
  };

  // Remove a combatant from the tracker
  const removeCombatant = (id: string) => {
    setCombatants(combatants.filter(c => c.id !== id));
    
    // If the active combatant is removed, update the active index
    if (activeCombatantIndex !== null) {
      const activeId = sortedCombatants[activeCombatantIndex].id;
      if (activeId === id) {
        setActiveCombatantIndex(null);
      }
    }
  };

  // Start combat - set the first combatant active
  const startCombat = () => {
    if (sortedCombatants.length === 0) return;
    
    setActiveCombatantIndex(0);
    setCombatActive(true);
  };

  // Reset combat tracker
  const resetCombat = () => {
    setActiveCombatantIndex(null);
    setCombatActive(false);
  };

  // Move to the next combatant in initiative order
  const nextTurn = () => {
    if (activeCombatantIndex === null) {
      setActiveCombatantIndex(0);
      return;
    }
    
    const nextIndex = (activeCombatantIndex + 1) % sortedCombatants.length;
    setActiveCombatantIndex(nextIndex);
  };

  // Toggle a status effect on a combatant
  const toggleStatus = (id: string, status: string) => {
    setCombatants(combatants.map(c => {
      if (c.id === id) {
        const currentStatuses = c.status || [];
        if (currentStatuses.includes(status)) {
          return {
            ...c,
            status: currentStatuses.filter(s => s !== status)
          };
        } else {
          return {
            ...c,
            status: [...currentStatuses, status]
          };
        }
      }
      return c;
    }));
  };

  // Roll initiative for all combatants randomly
  const rollInitiativeAll = () => {
    setCombatants(combatants.map(c => ({
      ...c,
      initiative: Math.floor(Math.random() * 20) + 1 // d20 roll
    })));
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="bg-primary text-white pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-white flex items-center">
            <Sword className="mr-2 h-5 w-5" />
            Initiative Tracker
          </CardTitle>
          
          <div className="flex space-x-2">
            {combatActive ? (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-primary-dark"
                onClick={() => setCombatActive(false)}
              >
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-primary-dark"
                onClick={startCombat}
                disabled={sortedCombatants.length === 0}
              >
                <Play className="h-4 w-4 mr-1" />
                Start
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-primary-dark"
              onClick={resetCombat}
            >
              <RotateCw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-primary-dark"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {sortedCombatants.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No combatants added yet.</p>
            <p className="text-sm mt-2">Click the "Add" button to add characters and monsters.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between mb-3">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs"
                onClick={rollInitiativeAll}
              >
                Roll Initiative for All
              </Button>
              
              {combatActive && (
                <Button 
                  size="sm" 
                  onClick={nextTurn}
                  className="bg-primary-light hover:bg-primary text-white"
                >
                  <SkipForward className="h-4 w-4 mr-1" />
                  Next Turn
                </Button>
              )}
            </div>
            
            {sortedCombatants.map((combatant, index) => (
              <div 
                key={combatant.id} 
                className={`p-3 rounded-lg border flex justify-between items-center ${
                  activeCombatantIndex === index ? 'bg-amber-100 border-amber-300' : 'bg-background border-border'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="font-mono font-bold text-lg w-8 text-center">
                    {combatant.initiative}
                  </div>
                  
                  <div>
                    <div className="font-medium flex items-center">
                      {combatant.name}
                      {combatant.isPlayer && (
                        <Badge className="ml-2 bg-blue-500">Player</Badge>
                      )}
                      {activeCombatantIndex === index && (
                        <Badge className="ml-2 bg-amber-500">Active</Badge>
                      )}
                    </div>
                    
                    {/* Status effects */}
                    {combatant.status && combatant.status.length > 0 && (
                      <div className="flex mt-1 gap-1 flex-wrap">
                        {combatant.status.map(status => (
                          <Badge 
                            key={status} 
                            variant="outline" 
                            className="text-xs bg-secondary-light"
                            onClick={() => toggleStatus(combatant.id, status)}
                          >
                            {status}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-1">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      // Add "Stunned" status as an example
                      toggleStatus(combatant.id, "Stunned");
                    }}
                  >
                    <span className="text-xs">+ Status</span>
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive/90"
                    onClick={() => removeCombatant(combatant.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {/* Add Combatant Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Combatant</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                placeholder="Character or monster name" 
                value={newCombatant.name}
                onChange={(e) => setNewCombatant({ ...newCombatant, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="initiative">Initiative</Label>
              <div className="flex space-x-2">
                <Input 
                  id="initiative" 
                  type="number" 
                  value={newCombatant.initiative}
                  onChange={(e) => setNewCombatant({ 
                    ...newCombatant, 
                    initiative: parseInt(e.target.value) || 0 
                  })}
                />
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    // Roll d20 for initiative
                    const roll = Math.floor(Math.random() * 20) + 1;
                    setNewCombatant({ ...newCombatant, initiative: roll });
                  }}
                >
                  Roll d20
                </Button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPlayer"
                checked={newCombatant.isPlayer}
                onChange={(e) => setNewCombatant({ ...newCombatant, isPlayer: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isPlayer">Is Player Character</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addCombatant}>
              Add Combatant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}