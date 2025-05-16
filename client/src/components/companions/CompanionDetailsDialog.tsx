import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Shield,
  Sword,
  Brain,
  Heart,
  ArrowLeft,
  Loader2,
  Plus,
  User,
  Calendar,
  Scroll
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface CompanionDetailsDialogProps {
  companion: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompanionDetailsDialog({
  companion,
  isOpen,
  onOpenChange,
}: CompanionDetailsDialogProps) {
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [selectedRole, setSelectedRole] = useState('companion');
  const { toast } = useToast();
  
  // Fetch campaigns for the dropdown
  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['/api/campaigns'],
    refetchOnWindowFocus: false,
    enabled: isOpen, // Only fetch when dialog is open
  });
  
  // Mutation to add NPC to campaign
  const addToCampaignMutation = useMutation({
    mutationFn: async (data: { campaignId: number; npcId: number; role: string }) => {
      const response = await apiRequest('POST', '/api/campaigns/npcs', data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add companion to campaign');
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: `${companion.name} has been added to the campaign.`,
      });
      
      // Reset selections and close dialog
      setSelectedCampaignId('');
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const handleAddToCampaign = () => {
    if (!selectedCampaignId) {
      toast({
        title: 'Error',
        description: 'Please select a campaign',
        variant: 'destructive',
      });
      return;
    }
    
    addToCampaignMutation.mutate({
      campaignId: parseInt(selectedCampaignId),
      npcId: companion.id,
      role: selectedRole,
    });
  };

  // Parse abilities from JSON strings if needed
  const getCombatAbilities = () => {
    if (!companion.combatAbilities) return [];
    if (typeof companion.combatAbilities === 'string') {
      try {
        return JSON.parse(companion.combatAbilities);
      } catch (e) {
        return [companion.combatAbilities];
      }
    }
    return companion.combatAbilities;
  };
  
  const getSupportAbilities = () => {
    if (!companion.supportAbilities) return [];
    if (typeof companion.supportAbilities === 'string') {
      try {
        return JSON.parse(companion.supportAbilities);
      } catch (e) {
        return [companion.supportAbilities];
      }
    }
    return companion.supportAbilities;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="font-fantasy text-xl">{companion.name}</span>
              {companion.companionType && (
                <Badge className={`ml-2 capitalize ${
                  companion.companionType === 'combat' ? 'bg-red-600' :
                  companion.companionType === 'support' ? 'bg-green-600' :
                  companion.companionType === 'utility' ? 'bg-blue-600' : 'bg-purple-600'
                }`}>
                  {companion.companionType}
                </Badge>
              )}
            </div>
            {companion.isStockCompanion && (
              <Badge variant="outline" className="ml-auto">Pre-made Companion</Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-sm pt-1">
            {companion.race} • {companion.occupation} • Level {companion.level || 1}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-secondary/20 p-3 rounded-md flex flex-col items-center">
              <div className="flex items-center text-primary mb-1">
                <Heart className="h-5 w-5 mr-1" />
                <span className="font-semibold">Hit Points</span>
              </div>
              <div className="text-lg font-bold">
                {companion.hitPoints || 10}/{companion.maxHitPoints || 10}
              </div>
            </div>
            
            <div className="bg-secondary/20 p-3 rounded-md flex flex-col items-center">
              <div className="flex items-center text-primary mb-1">
                <Shield className="h-5 w-5 mr-1" />
                <span className="font-semibold">Armor Class</span>
              </div>
              <div className="text-lg font-bold">
                {companion.armorClass || 10}
              </div>
            </div>
            
            <div className="bg-secondary/20 p-3 rounded-md flex flex-col items-center">
              <div className="flex items-center text-primary mb-1">
                <User className="h-5 w-5 mr-1" />
                <span className="font-semibold">Level</span>
              </div>
              <div className="text-lg font-bold">
                {companion.level || 1}
              </div>
            </div>
          </div>
          
          {/* Appearance and personality */}
          <div className="space-y-4">
            <div>
              <h3 className="text-md font-semibold">Appearance</h3>
              <p className="text-sm text-muted-foreground mt-1">{companion.appearance}</p>
            </div>
            
            <div>
              <h3 className="text-md font-semibold">Personality</h3>
              <p className="text-sm text-muted-foreground mt-1">{companion.personality}</p>
            </div>
            
            <div>
              <h3 className="text-md font-semibold">Motivation</h3>
              <p className="text-sm text-muted-foreground mt-1">{companion.motivation}</p>
            </div>
          </div>
          
          <Separator />
          
          {/* Ability scores */}
          <div>
            <h3 className="text-md font-semibold mb-2">Ability Scores</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              <div className="p-2 border rounded-md text-center">
                <div className="text-xs text-muted-foreground">STR</div>
                <div className="font-bold">{companion.strength || 10}</div>
              </div>
              <div className="p-2 border rounded-md text-center">
                <div className="text-xs text-muted-foreground">DEX</div>
                <div className="font-bold">{companion.dexterity || 10}</div>
              </div>
              <div className="p-2 border rounded-md text-center">
                <div className="text-xs text-muted-foreground">CON</div>
                <div className="font-bold">{companion.constitution || 10}</div>
              </div>
              <div className="p-2 border rounded-md text-center">
                <div className="text-xs text-muted-foreground">INT</div>
                <div className="font-bold">{companion.intelligence || 10}</div>
              </div>
              <div className="p-2 border rounded-md text-center">
                <div className="text-xs text-muted-foreground">WIS</div>
                <div className="font-bold">{companion.wisdom || 10}</div>
              </div>
              <div className="p-2 border rounded-md text-center">
                <div className="text-xs text-muted-foreground">CHA</div>
                <div className="font-bold">{companion.charisma || 10}</div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Abilities */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="combat">
              <AccordionTrigger className="flex items-center">
                <Sword className="h-4 w-4 mr-2" />
                Combat Abilities
              </AccordionTrigger>
              <AccordionContent>
                {getCombatAbilities().length > 0 ? (
                  <ul className="space-y-1 pl-6 list-disc text-sm">
                    {getCombatAbilities().map((ability: string, index: number) => (
                      <li key={index}>{ability}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No combat abilities listed</p>
                )}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="support">
              <AccordionTrigger className="flex items-center">
                <Heart className="h-4 w-4 mr-2" />
                Support Abilities
              </AccordionTrigger>
              <AccordionContent>
                {getSupportAbilities().length > 0 ? (
                  <ul className="space-y-1 pl-6 list-disc text-sm">
                    {getSupportAbilities().map((ability: string, index: number) => (
                      <li key={index}>{ability}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No support abilities listed</p>
                )}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="equipment">
              <AccordionTrigger className="flex items-center">
                <Scroll className="h-4 w-4 mr-2" />
                Equipment
              </AccordionTrigger>
              <AccordionContent>
                {Array.isArray(companion.equipment) && companion.equipment.length > 0 ? (
                  <ul className="space-y-1 pl-6 list-disc text-sm">
                    {companion.equipment.map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No equipment listed</p>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          {/* Add to campaign section */}
          <Separator />
          
          <div>
            <h3 className="text-md font-semibold mb-2">Add to Campaign</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="campaign">Select Campaign</Label>
                <Select
                  value={selectedCampaignId}
                  onValueChange={setSelectedCampaignId}
                >
                  <SelectTrigger id="campaign">
                    <SelectValue placeholder="Choose a campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((campaign: any) => (
                      <SelectItem key={campaign.id} value={campaign.id.toString()}>
                        {campaign.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="companion">Companion</SelectItem>
                    <SelectItem value="ally">Ally</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="enemy">Enemy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="secondary" 
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            onClick={handleAddToCampaign}
            disabled={addToCampaignMutation.isPending || !selectedCampaignId}
          >
            {addToCampaignMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add to Campaign
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}