import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowRightIcon, Clock, PlayIcon, StopCircleIcon, Crown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TurnManagerProps {
  campaignId: number;
  isTurnBased: boolean;
  isDM: boolean;
  onToggleTurnBased: (enabled: boolean) => void;
}

export default function TurnManager({ campaignId, isTurnBased, isDM, onToggleTurnBased }: TurnManagerProps) {
  const { toast } = useToast();
  const [turnTimeElapsed, setTurnTimeElapsed] = useState(0);
  const [turnTimerInterval, setTurnTimerInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Fetch current turn
  const { 
    data: turnInfo, 
    isLoading: isLoadingTurn,
    refetch: refetchTurn
  } = useQuery({
    queryKey: [`/api/campaigns/${campaignId}/turns/current`],
    enabled: !!campaignId && isTurnBased,
    refetchInterval: isTurnBased ? 10000 : false, // Refetch every 10 seconds when turn-based is active
  });
  
  // Start next turn mutation
  const startNextTurnMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        'POST', 
        `/api/campaigns/${campaignId}/turns/next`
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/turns/current`] });
      toast({
        title: 'Turn started',
        description: 'The next player\'s turn has begun'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to start next turn',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // End current turn mutation
  const endTurnMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        'POST', 
        `/api/campaigns/${campaignId}/turns/end`
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/turns/current`] });
      toast({
        title: 'Turn ended',
        description: 'The current turn has ended'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to end turn',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Setup websocket event handler for turn changes
  useEffect(() => {
    if (!isTurnBased) return;
    
    // Setup WebSocket connection for real-time updates
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle turn change events
        if (data.type === 'turn_change' && data.payload.campaignId === campaignId) {
          refetchTurn();
        }
        // Handle turn ended events
        else if (data.type === 'turn_ended' && data.payload.campaignId === campaignId) {
          refetchTurn();
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    return () => {
      socket.close();
    };
  }, [campaignId, isTurnBased, refetchTurn]);
  
  // Setup turn timer
  useEffect(() => {
    if (!isTurnBased || !turnInfo?.active || !turnInfo?.startedAt) {
      // Clear interval if turn based is disabled or no active turn
      if (turnTimerInterval) {
        clearInterval(turnTimerInterval);
        setTurnTimerInterval(null);
      }
      return;
    }
    
    // Calculate initial elapsed time
    const startedAt = new Date(turnInfo.startedAt).getTime();
    const initialElapsed = Math.floor((Date.now() - startedAt) / 1000);
    setTurnTimeElapsed(initialElapsed);
    
    // Setup interval to update elapsed time
    const interval = setInterval(() => {
      const newElapsed = Math.floor((Date.now() - startedAt) / 1000);
      setTurnTimeElapsed(newElapsed);
    }, 1000);
    
    setTurnTimerInterval(interval);
    
    return () => {
      clearInterval(interval);
    };
  }, [isTurnBased, turnInfo?.active, turnInfo?.startedAt]);
  
  const formatTurnTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const handleTurnToggle = (checked: boolean) => {
    onToggleTurnBased(checked);
  };
  
  if (!isTurnBased) {
    return (
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Turn Management</h3>
            <p className="text-sm text-muted-foreground">Enable turn-based play to coordinate player actions</p>
          </div>
          {isDM && (
            <div className="flex items-center space-x-2">
              <Switch id="turn-mode" onCheckedChange={handleTurnToggle} />
              <Label htmlFor="turn-mode">Enable Turn-Based Mode</Label>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Turn Management</h3>
          <p className="text-sm text-muted-foreground">Coordinate player actions with turn-based play</p>
        </div>
        {isDM && (
          <div className="flex items-center space-x-2">
            <Switch id="turn-mode" checked={true} onCheckedChange={handleTurnToggle} />
            <Label htmlFor="turn-mode">Turn-Based Mode</Label>
          </div>
        )}
      </div>
      
      {isLoadingTurn ? (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : turnInfo?.active ? (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">Current Turn</CardTitle>
              <Badge>
                <Clock className="h-3 w-3 mr-1" />
                {formatTurnTime(turnTimeElapsed)}
              </Badge>
            </div>
            <CardDescription>
              {turnInfo.startedAt && (
                <span>Started {formatDistanceToNow(new Date(turnInfo.startedAt), { addSuffix: true })}</span>
              )}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pb-2">
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarFallback>
                  {turnInfo.displayName?.[0] || turnInfo.username[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center">
                  <p className="font-medium">{turnInfo.displayName || turnInfo.username}</p>
                  {turnInfo.isCurrentUser && (
                    <Badge variant="secondary" className="ml-2">
                      <Crown className="h-3 w-3 mr-1" />
                      Your Turn
                    </Badge>
                  )}
                </div>
                
                {turnInfo.character && (
                  <p className="text-sm text-muted-foreground">
                    {turnInfo.character.name} - Level {turnInfo.character.level} {turnInfo.character.race} {turnInfo.character.class}
                  </p>
                )}
                
                <div className="mt-2">
                  <Progress value={Math.min(100, (turnTimeElapsed / (15 * 60)) * 100)} className="h-1.5" />
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="pt-2">
            {isDM && (
              <div className="flex space-x-2 w-full">
                <Button 
                  variant="default" 
                  className="flex-1"
                  onClick={() => startNextTurnMutation.mutate()}
                  disabled={startNextTurnMutation.isPending}
                >
                  <ArrowRightIcon className="h-4 w-4 mr-2" />
                  Next Turn
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => endTurnMutation.mutate()}
                  disabled={endTurnMutation.isPending}
                >
                  <StopCircleIcon className="h-4 w-4 mr-2" />
                  End Current Turn
                </Button>
              </div>
            )}
            
            {turnInfo.isCurrentUser && !isDM && (
              <Button 
                variant="default" 
                className="w-full"
                onClick={() => endTurnMutation.mutate()}
                disabled={endTurnMutation.isPending}
              >
                <ArrowRightIcon className="h-4 w-4 mr-2" />
                End My Turn
              </Button>
            )}
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No Active Turn</CardTitle>
            <CardDescription>
              {isDM ? "Start a player's turn to begin" : "Waiting for the DM to start a turn"}
            </CardDescription>
          </CardHeader>
          
          {isDM && (
            <CardFooter>
              <Button 
                variant="default" 
                className="w-full"
                onClick={() => startNextTurnMutation.mutate()}
                disabled={startNextTurnMutation.isPending}
              >
                <PlayIcon className="h-4 w-4 mr-2" />
                Start First Turn
              </Button>
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
}