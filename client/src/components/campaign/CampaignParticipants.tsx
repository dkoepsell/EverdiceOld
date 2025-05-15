import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronsUpDown, Shield, User, UserPlus, X } from 'lucide-react';
import { Character, User as UserType } from '@shared/schema';

interface CampaignParticipant {
  id: number;
  campaignId: number;
  userId: number;
  characterId: number;
  role: string;
  turnOrder: number | null;
  isActive: boolean;
  joinedAt: string;
  lastActiveAt: string | null;
  username: string;
  displayName: string | null;
  character: Character;
}

interface CampaignParticipantsProps {
  campaignId: number;
  isDM: boolean;
}

export default function CampaignParticipants({ campaignId, isDM }: CampaignParticipantsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);

  // Fetch participants
  const { data: participants, isLoading } = useQuery({
    queryKey: [`/api/campaigns/${campaignId}/participants`],
    enabled: !!campaignId
  });

  // Fetch all users
  const { data: users } = useQuery<UserType[]>({
    queryKey: ['/api/users'],
    enabled: isDM && isInviteDialogOpen
  });

  // Fetch characters for selected user
  const { data: userCharacters } = useQuery<Character[]>({
    queryKey: ['/api/characters', selectedUserId],
    enabled: !!selectedUserId && isInviteDialogOpen
  });

  // Add participant mutation
  const addParticipantMutation = useMutation({
    mutationFn: async (data: { userId: number; characterId: number; role: string }) => {
      const res = await apiRequest(
        'POST', 
        `/api/campaigns/${campaignId}/participants`, 
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/participants`] });
      setIsInviteDialogOpen(false);
      toast({
        title: 'Participant added',
        description: 'The user has been added to the campaign'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add participant',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Remove participant mutation
  const removeParticipantMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest(
        'DELETE', 
        `/api/campaigns/${campaignId}/participants/${userId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/participants`] });
      toast({
        title: 'Participant removed',
        description: 'The user has been removed from the campaign'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to remove participant',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleAddParticipant = () => {
    if (!selectedUserId || !selectedCharacterId) {
      toast({
        title: 'Missing information',
        description: 'Please select a user and character',
        variant: 'destructive'
      });
      return;
    }

    addParticipantMutation.mutate({
      userId: selectedUserId,
      characterId: selectedCharacterId,
      role: 'player'
    });
  };

  const handleRemoveParticipant = (userId: number) => {
    if (confirm('Are you sure you want to remove this participant?')) {
      removeParticipantMutation.mutate(userId);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading participants...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Campaign Participants</h3>
        {isDM && (
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Participant</DialogTitle>
                <DialogDescription>
                  Invite a user to join your campaign with a character.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="user" className="text-sm font-medium">User</label>
                  <Select 
                    onValueChange={(value) => setSelectedUserId(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map(user => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.displayName || user.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="character" className="text-sm font-medium">Character</label>
                  <Select
                    onValueChange={(value) => setSelectedCharacterId(Number(value))}
                    disabled={!selectedUserId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!selectedUserId ? "Select user first" : "Select character"} />
                    </SelectTrigger>
                    <SelectContent>
                      {userCharacters?.map(character => (
                        <SelectItem key={character.id} value={character.id.toString()}>
                          {character.name} ({character.race} {character.class})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  onClick={handleAddParticipant} 
                  disabled={!selectedUserId || !selectedCharacterId || addParticipantMutation.isPending}
                >
                  {addParticipantMutation.isPending ? 'Adding...' : 'Add to Campaign'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {participants?.map((participant: CampaignParticipant) => (
          <Card key={participant.id} className={participant.isActive ? "" : "opacity-60"}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <Avatar>
                    <AvatarFallback>
                      {participant.displayName?.[0] || participant.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-sm font-semibold text-foreground">{participant.displayName || participant.username}</CardTitle>
                    <CardDescription className="text-xs">
                      {participant.role === 'dm' ? (
                        <Badge variant="secondary" className="mr-1 font-medium">
                          <Shield className="h-3 w-3 mr-1" /> DM
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="mr-1 font-medium text-foreground/90">
                          <User className="h-3 w-3 mr-1" /> Player
                        </Badge>
                      )}
                      {participant.turnOrder && (
                        <Badge variant="outline" className="font-medium text-foreground/90">
                          <ChevronsUpDown className="h-3 w-3 mr-1" />
                          Turn {participant.turnOrder}
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                </div>
                
                {(isDM || user?.id === participant.userId) && participant.role !== 'dm' && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => handleRemoveParticipant(participant.userId)}
                          disabled={removeParticipantMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Remove participant</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="text-sm">
                <p className="font-semibold text-foreground">{participant.character.name}</p>
                <p className="text-foreground/80 text-xs">
                  Level {participant.character.level} {participant.character.race} {participant.character.class}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {participants?.length === 0 && (
        <div className="text-center p-8 border-2 border-dashed rounded-lg">
          <p className="text-foreground font-medium mb-2">No participants in this campaign yet.</p>
          {isDM && <p className="text-foreground/80">Use the Invite button to add players.</p>}
        </div>
      )}
    </div>
  );
}