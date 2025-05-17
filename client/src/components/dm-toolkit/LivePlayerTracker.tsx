import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  User,
  MoreHorizontal, 
  Shield, 
  Users, 
  Heart, 
  Activity,
  Zap,
  Send,
  Crown,
  Clock,
  Loader2,
  BellRing,
  Skull,
  Eye,
  EyeOff,
  X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface LivePlayerTrackerProps {
  campaignId: number;
  isSessionActive: boolean;
}

interface PlayerStatus {
  id: number;
  userId: number;
  campaignId: number;
  characterId: number;
  role: string;
  isActive: boolean;
  isOnline: boolean;
  lastActiveAt: string | null;
  username: string;
  displayName: string | null;
  character: {
    id: number;
    name: string;
    race: string;
    class: string;
    level: number;
    maxHp: number;
    currentHp: number;
    portraitUrl: string | null;
    status: string[];
  };
  hasUnreadMessages: boolean;
  initiative: number | null;
}

export default function LivePlayerTracker({ campaignId, isSessionActive }: LivePlayerTrackerProps) {
  const { toast } = useToast();
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [hpValue, setHpValue] = useState<number>(0);
  const [statusValue, setStatusValue] = useState<string>('');
  const [messageText, setMessageText] = useState<string>('');
  const [initiativeValue, setInitiativeValue] = useState<number>(0);
  const [showOfflinePlayers, setShowOfflinePlayers] = useState<boolean>(true);
  const [isInitiativeActive, setIsInitiativeActive] = useState<boolean>(false);
  
  // Fetch active player statuses
  const { 
    data: playerStatuses = [], 
    isLoading,
    refetch: refetchPlayerStatuses
  } = useQuery<PlayerStatus[]>({
    queryKey: [`/api/campaigns/${campaignId}/player-status`],
    enabled: !!campaignId,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Filter players based on preferences
  const filteredPlayers = playerStatuses.filter(player => 
    showOfflinePlayers || player.isOnline
  );

  // Sort players by initiative if active, otherwise by online status and then username
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    if (isInitiativeActive && a.initiative !== null && b.initiative !== null) {
      return b.initiative - a.initiative;
    }
    if (a.isOnline !== b.isOnline) {
      return a.isOnline ? -1 : 1;
    }
    return (a.displayName || a.username).localeCompare(b.displayName || b.username);
  });

  // Check if initiative is active
  useEffect(() => {
    const hasInitiativeValues = playerStatuses.some(player => player.initiative !== null);
    setIsInitiativeActive(hasInitiativeValues);
  }, [playerStatuses]);

  // Update HP mutation
  const updateHpMutation = useMutation({
    mutationFn: async ({ userId, hp }: { userId: number; hp: number }) => {
      const res = await apiRequest(
        'POST', 
        `/api/campaigns/${campaignId}/player-status/${userId}/hp`,
        { hp }
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/player-status`] });
      toast({
        title: 'HP updated',
        description: 'Player HP has been updated'
      });
      setSelectedPlayerId(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update HP',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status, action }: { userId: number; status: string; action: 'add' | 'remove' }) => {
      const res = await apiRequest(
        'POST', 
        `/api/campaigns/${campaignId}/player-status/${userId}/status`,
        { status, action }
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/player-status`] });
      toast({
        title: 'Status updated',
        description: 'Player status has been updated'
      });
      setStatusValue('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update status',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Update initiative mutation
  const updateInitiativeMutation = useMutation({
    mutationFn: async ({ userId, initiative }: { userId: number; initiative: number }) => {
      const res = await apiRequest(
        'POST', 
        `/api/campaigns/${campaignId}/player-status/${userId}/initiative`,
        { initiative }
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/player-status`] });
      toast({
        title: 'Initiative updated',
        description: 'Player initiative has been updated'
      });
      setSelectedPlayerId(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update initiative',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Clear all initiatives mutation
  const clearInitiativeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        'POST', 
        `/api/campaigns/${campaignId}/clear-initiative`
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/player-status`] });
      toast({
        title: 'Initiative cleared',
        description: 'All initiative values have been cleared'
      });
      setIsInitiativeActive(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to clear initiative',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Send private message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ userId, message }: { userId: number; message: string }) => {
      const res = await apiRequest(
        'POST', 
        `/api/campaigns/${campaignId}/messages`,
        { userId, message }
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Message sent',
        description: 'Your message has been sent to the player'
      });
      setMessageText('');
      setSelectedPlayerId(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to send message',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Ping player mutation
  const pingPlayerMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest(
        'POST', 
        `/api/campaigns/${campaignId}/ping-player/${userId}`
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Player pinged',
        description: 'A notification has been sent to the player'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to ping player',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleUpdateHp = (userId: number) => {
    if (hpValue !== undefined) {
      updateHpMutation.mutate({ userId, hp: hpValue });
    }
  };

  const handleAddStatus = (userId: number) => {
    if (statusValue.trim()) {
      updateStatusMutation.mutate({ userId, status: statusValue, action: 'add' });
    }
  };

  const handleRemoveStatus = (userId: number, status: string) => {
    updateStatusMutation.mutate({ userId, status, action: 'remove' });
  };

  const handleUpdateInitiative = (userId: number) => {
    if (initiativeValue !== undefined) {
      updateInitiativeMutation.mutate({ userId, initiative: initiativeValue });
    }
  };

  const handleSendMessage = (userId: number) => {
    if (messageText.trim()) {
      sendMessageMutation.mutate({ userId, message: messageText });
    } else {
      toast({
        title: 'Message required',
        description: 'Please enter a message to send',
        variant: 'destructive'
      });
    }
  };

  const getHpPercentage = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    return Math.max(0, Math.min(100, percentage));
  };

  const getHpColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage <= 25) return "bg-red-500";
    if (percentage <= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
        <span>Loading player status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <Users className="h-5 w-5 mr-2 text-primary" />
          Player Status
        </h3>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowOfflinePlayers(!showOfflinePlayers)}
                >
                  {showOfflinePlayers ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {showOfflinePlayers ? "Hide offline players" : "Show offline players"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {isInitiativeActive && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => clearInitiativeMutation.mutate()}
                    disabled={clearInitiativeMutation.isPending}
                  >
                    <Clock className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Clear all initiative values
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => refetchPlayerStatuses()}
          >
            <Loader2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {sortedPlayers.length === 0 ? (
        <Card className="p-6">
          <div className="text-center">
            <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">No players have joined this campaign yet</p>
            <p className="text-sm text-muted-foreground">Invite players using the Invitations tab</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-4">
          {sortedPlayers.map((player) => (
            <Card 
              key={player.id} 
              className={player.isOnline ? "" : "opacity-60"}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <Avatar>
                      {player.character?.portraitUrl ? (
                        <AvatarImage src={player.character.portraitUrl} alt={player.character.name} />
                      ) : (
                        <AvatarFallback>
                          {player.displayName?.[0] || player.username[0]}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <div className="flex items-center">
                        <CardTitle className="text-sm font-semibold">
                          {player.displayName || player.username}
                        </CardTitle>
                        {player.hasUnreadMessages && (
                          <Badge variant="secondary" className="ml-2">
                            <BellRing className="h-3 w-3 mr-1" />
                            New
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs">
                        {player.role === 'dm' ? (
                          <Badge variant="secondary" className="mr-1 font-medium">
                            <Shield className="h-3 w-3 mr-1" /> DM
                          </Badge>
                        ) : (
                          <>
                            {player.character?.name} • Lvl {player.character?.level} {player.character?.race} {player.character?.class}
                          </>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {player.initiative !== null && (
                      <Badge className="bg-primary">
                        <Zap className="h-3 w-3 mr-1" />
                        {player.initiative}
                      </Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Player Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Heart className="h-4 w-4 mr-2" />
                              Update HP
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Update Character HP</DialogTitle>
                              <DialogDescription>
                                Change the hit points for {player.character?.name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Current HP</Label>
                                  <span className="font-medium">{player.character?.currentHp} / {player.character?.maxHp}</span>
                                </div>
                                <Progress 
                                  value={getHpPercentage(player.character?.currentHp, player.character?.maxHp)} 
                                  className="h-2"
                                  indicatorClassName={getHpColor(player.character?.currentHp, player.character?.maxHp)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="hp-value">New HP Value</Label>
                                <Input 
                                  id="hp-value"
                                  type="number"
                                  min={0}
                                  max={player.character?.maxHp}
                                  placeholder="Enter new HP value"
                                  onChange={(e) => setHpValue(parseInt(e.target.value))}
                                  defaultValue={player.character?.currentHp}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button 
                                onClick={() => handleUpdateHp(player.userId)}
                                disabled={updateHpMutation.isPending}
                              >
                                {updateHpMutation.isPending ? 'Updating...' : 'Update HP'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Activity className="h-4 w-4 mr-2" />
                              Add Status Effect
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Manage Status Effects</DialogTitle>
                              <DialogDescription>
                                Add or remove status effects for {player.character?.name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="status-value">New Status Effect</Label>
                                <div className="flex gap-2">
                                  <Input 
                                    id="status-value"
                                    placeholder="e.g., Poisoned, Stunned"
                                    value={statusValue}
                                    onChange={(e) => setStatusValue(e.target.value)}
                                  />
                                  <Button 
                                    onClick={() => handleAddStatus(player.userId)}
                                    disabled={updateStatusMutation.isPending || !statusValue.trim()}
                                  >
                                    Add
                                  </Button>
                                </div>
                              </div>
                              
                              {player.character?.status && player.character.status.length > 0 ? (
                                <div className="space-y-2">
                                  <Label>Current Status Effects</Label>
                                  <div className="flex flex-wrap gap-2">
                                    {player.character.status.map((status, index) => (
                                      <Badge 
                                        key={index} 
                                        variant="outline"
                                        className="flex items-center gap-1 pl-2"
                                      >
                                        {status}
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-4 w-4 ml-1 hover:bg-transparent"
                                          onClick={() => handleRemoveStatus(player.userId, status)}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">No active status effects</p>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Zap className="h-4 w-4 mr-2" />
                              Set Initiative
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Set Initiative Value</DialogTitle>
                              <DialogDescription>
                                Set the initiative order for {player.character?.name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="initiative-value">Initiative Value</Label>
                                <Input 
                                  id="initiative-value"
                                  type="number"
                                  min={0}
                                  max={30}
                                  placeholder="Enter initiative value"
                                  onChange={(e) => setInitiativeValue(parseInt(e.target.value))}
                                  defaultValue={player.initiative !== null ? player.initiative : ""}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button 
                                onClick={() => handleUpdateInitiative(player.userId)}
                                disabled={updateInitiativeMutation.isPending}
                              >
                                {updateInitiativeMutation.isPending ? 'Updating...' : 'Set Initiative'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Send className="h-4 w-4 mr-2" />
                              Send Private Message
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Send Private Message</DialogTitle>
                              <DialogDescription>
                                Send a private message to {player.displayName || player.username}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="message-text">Message</Label>
                                <Input 
                                  id="message-text"
                                  placeholder="Enter your message..."
                                  value={messageText}
                                  onChange={(e) => setMessageText(e.target.value)}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button 
                                onClick={() => handleSendMessage(player.userId)}
                                disabled={sendMessageMutation.isPending || !messageText.trim()}
                              >
                                {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        <DropdownMenuItem
                          onClick={() => pingPlayerMutation.mutate(player.userId)}
                          disabled={pingPlayerMutation.isPending || !player.isOnline}
                        >
                          <BellRing className="h-4 w-4 mr-2" />
                          Ping Player
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pb-2">
                {player.role !== 'dm' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">
                        <Heart className="h-3 w-3 inline mr-1 text-primary" />
                        HP: {player.character?.currentHp} / {player.character?.maxHp}
                      </Label>
                      {player.character?.currentHp === 0 && (
                        <Badge variant="destructive" className="text-xs">
                          <Skull className="h-3 w-3 mr-1" /> Down
                        </Badge>
                      )}
                    </div>
                    <Progress 
                      value={getHpPercentage(player.character?.currentHp, player.character?.maxHp)}
                      className="h-1.5"
                      indicatorClassName={getHpColor(player.character?.currentHp, player.character?.maxHp)}
                    />
                    
                    {player.character?.status && player.character.status.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {player.character.status.map((status, index) => (
                          <Badge 
                            key={index} 
                            variant="outline"
                            className="text-xs"
                          >
                            {status}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="pt-0">
                <div className="w-full flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <Badge 
                      variant={player.isOnline ? "secondary" : "outline"}
                      className={`text-xs ${player.isOnline ? "bg-green-100 text-green-800" : ""}`}
                    >
                      {player.isOnline ? "Online" : "Offline"}
                    </Badge>
                  </div>
                  {player.lastActiveAt && (
                    <span>
                      Active {formatDistanceToNow(new Date(player.lastActiveAt), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}