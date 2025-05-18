import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Sword, 
  Dices, 
  AlertTriangle, 
  BookOpen, 
  HelpCircle, 
  Info 
} from 'lucide-react';
import InitiativeTracker from '@/components/combat/InitiativeTracker';
import AdvantageRoller from '@/components/combat/AdvantageRoller';
import StatusEffectTracker from '@/components/combat/StatusEffectTracker';
import { useQuery } from '@tanstack/react-query';
import type { Character } from '@shared/schema';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'wouter';
import { RulesReference, RulesInfoBubble } from '@/components/ui/rules-reference';

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
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-medium text-amber-800">D&D Combat Assistance</h2>
          <Link href="/rules-reference">
            <Button variant="ghost" size="sm" className="text-amber-700 flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>Full Rules Reference</span>
            </Button>
          </Link>
        </div>
        <p className="text-amber-700">
          These tools help you manage combat encounters in your D&D campaigns. 
          Track <RulesReference term="initiative">initiative</RulesReference> order, apply 
          <RulesReference term="prone">status effects</RulesReference>, and use 
          <RulesReference term="advantage">advantage</RulesReference>/<RulesReference term="disadvantage">disadvantage</RulesReference> 
          for dice rolls according to D&D 5e rules.
        </p>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-md flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" />
            Combat Basics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h3 className="font-semibold">Taking Your Turn</h3>
              <ul className="space-y-1 list-disc pl-5">
                <li>One <strong>action</strong> (Attack, Cast a Spell, Dash, etc.)</li>
                <li>One <RulesReference term="bonus-action">bonus action</RulesReference> (if available)</li>
                <li>Movement up to your speed</li>
                <li>One free <strong>object interaction</strong></li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">Making Attacks</h3>
              <ul className="space-y-1 list-disc pl-5">
                <li>Roll d20 + modifiers vs. target's AC</li>
                <li>Natural 20 = <RulesReference term="critical-hit">critical hit</RulesReference> (double damage dice)</li>
                <li>Can make one <RulesReference term="opportunity-attack">opportunity attack</RulesReference> per round</li>
                <li>Some conditions affect attack rolls</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">When Reduced to 0 HP</h3>
              <ul className="space-y-1 list-disc pl-5">
                <li>Make <RulesReference term="death-saving-throw">death saving throws</RulesReference> on your turn</li>
                <li>3 successes = stabilized</li>
                <li>3 failures = death</li>
                <li>Natural 20 = regain 1 hit point</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      
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
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading character data...</span>
              </div>
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