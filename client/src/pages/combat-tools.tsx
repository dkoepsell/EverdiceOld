import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Sword, Dices, AlertTriangle } from 'lucide-react';
import InitiativeTracker from '@/components/combat/InitiativeTracker';
import AdvantageRoller from '@/components/combat/AdvantageRoller';
import StatusEffectTracker from '@/components/combat/StatusEffectTracker';
import { useQuery } from '@tanstack/react-query';
import type { Character } from '@shared/schema';
import LoadingPlaceholder from '@/components/ui/loading-placeholder';

export default function CombatToolsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = React.useState('initiative');
  
  // Fetch character data
  const { data: characters, isLoading: charactersLoading } = useQuery<Character[]>({
    queryKey: ['/api/characters'],
    enabled: !!user,
  });

  // Get the first character for now (in a real implementation, we would select the active character)
  const activeCharacter = characters && characters.length > 0 ? characters[0] : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Sword className="h-6 w-6 mr-2 text-primary" />
        <h1 className="text-3xl font-fantasy font-bold">Combat Tools</h1>
      </div>

      <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-lg">
        <h2 className="text-lg font-medium text-amber-800 mb-2">D&D Combat Assistance</h2>
        <p className="text-amber-700">
          These tools help you manage combat encounters in your D&D campaigns. 
          Track initiative order, apply status effects, and use advantage/disadvantage for dice rolls according to D&D 5e rules.
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8 grid w-full grid-cols-3">
          <TabsTrigger value="initiative" className="flex items-center gap-2">
            <Sword className="h-4 w-4" />
            Initiative Tracker
          </TabsTrigger>
          <TabsTrigger value="conditions" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Status Effects
          </TabsTrigger>
          <TabsTrigger value="advantage" className="flex items-center gap-2">
            <Dices className="h-4 w-4" />
            Advantage Roller
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="initiative">
          <div className="grid md:grid-cols-1 gap-6">
            <InitiativeTracker />
          </div>
        </TabsContent>
        
        <TabsContent value="conditions">
          <div className="grid md:grid-cols-1 gap-6">
            {charactersLoading ? (
              <LoadingPlaceholder />
            ) : (
              <StatusEffectTracker 
                characterName={activeCharacter?.name}
              />
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="advantage">
          <div className="grid md:grid-cols-1 gap-6">
            <AdvantageRoller />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}