import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Play, Pause, StopCircle, Send, Radio, Users, AlertTriangle, Bell, LayoutDashboard } from 'lucide-react';
import { format } from 'date-fns';

interface SessionControlPanelProps {
  campaignId: number;
}

type SessionStatus = 'idle' | 'active' | 'paused';

interface SessionState {
  id: number | null;
  status: SessionStatus;
  startedAt: string | null;
  pausedAt: string | null;
  endedAt: string | null;
  currentDescription: string;
  activePlayerCount: number;
}

export default function SessionControlPanel({ campaignId }: SessionControlPanelProps) {
  const { toast } = useToast();
  const [sessionTime, setSessionTime] = useState(0);
  const [sessionTimerInterval, setSessionTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [sessionDescription, setSessionDescription] = useState('');
  const [announcementText, setAnnouncementText] = useState('');
  const [activeTab, setActiveTab] = useState('controls');
  
  // Fetch current session state
  const { 
    data: sessionState = {
      id: null,
      status: 'idle' as SessionStatus,
      startedAt: null,
      pausedAt: null,
      endedAt: null,
      currentDescription: '',
      activePlayerCount: 0
    },
    isLoading: isLoadingSession,
    refetch: refetchSession
  } = useQuery<SessionState>({
    queryKey: [`/api/campaigns/${campaignId}/session-state`],
    enabled: !!campaignId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: async (description: string) => {
      const res = await apiRequest(
        'POST', 
        `/api/campaigns/${campaignId}/session/start`,
        { description }
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/session-state`] });
      toast({
        title: 'Session started',
        description: 'The session has been started successfully'
      });
      setSessionDescription('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to start session',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Pause session mutation
  const pauseSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        'POST', 
        `/api/campaigns/${campaignId}/session/pause`
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/session-state`] });
      toast({
        title: 'Session paused',
        description: 'The session has been paused'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to pause session',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Resume session mutation
  const resumeSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        'POST', 
        `/api/campaigns/${campaignId}/session/resume`
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/session-state`] });
      toast({
        title: 'Session resumed',
        description: 'The session has been resumed'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to resume session',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // End session mutation
  const endSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        'POST', 
        `/api/campaigns/${campaignId}/session/end`
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/session-state`] });
      toast({
        title: 'Session ended',
        description: 'The session has been ended'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to end session',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Send announcement mutation
  const sendAnnouncementMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest(
        'POST', 
        `/api/campaigns/${campaignId}/announcements`,
        { text }
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Announcement sent',
        description: 'Your announcement has been sent to all players'
      });
      setAnnouncementText('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to send announcement',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Update description mutation
  const updateDescriptionMutation = useMutation({
    mutationFn: async (description: string) => {
      const res = await apiRequest(
        'POST', 
        `/api/campaigns/${campaignId}/session/description`,
        { description }
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/session-state`] });
      toast({
        title: 'Scene updated',
        description: 'The scene description has been updated'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update scene',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Setup session timer
  useEffect(() => {
    if (sessionState.status !== 'active' || !sessionState.startedAt) {
      // Clear interval if session is not active
      if (sessionTimerInterval) {
        clearInterval(sessionTimerInterval);
        setSessionTimerInterval(null);
      }
      return;
    }
    
    // Calculate initial elapsed time
    const startedAt = new Date(sessionState.startedAt).getTime();
    const pausedTime = sessionState.pausedAt 
      ? (new Date(sessionState.pausedAt).getTime() - startedAt) / 1000 
      : 0;
    
    const initialElapsed = Math.floor((Date.now() - startedAt) / 1000) - pausedTime;
    setSessionTime(initialElapsed);
    
    // Setup interval to update elapsed time
    const interval = setInterval(() => {
      const newElapsed = Math.floor((Date.now() - startedAt) / 1000) - pausedTime;
      setSessionTime(newElapsed);
    }, 1000);
    
    setSessionTimerInterval(interval);
    
    return () => {
      clearInterval(interval);
    };
  }, [sessionState.status, sessionState.startedAt, sessionState.pausedAt]);
  
  // Format session time (HH:MM:SS)
  const formatSessionTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartSession = () => {
    if (sessionDescription.trim()) {
      startSessionMutation.mutate(sessionDescription);
    } else {
      toast({
        title: 'Description required',
        description: 'Please enter a session description to start',
        variant: 'destructive'
      });
    }
  };

  const handleSendAnnouncement = () => {
    if (announcementText.trim()) {
      sendAnnouncementMutation.mutate(announcementText);
    } else {
      toast({
        title: 'Announcement required',
        description: 'Please enter an announcement message',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateDescription = () => {
    if (sessionDescription.trim()) {
      updateDescriptionMutation.mutate(sessionDescription);
    } else {
      toast({
        title: 'Description required',
        description: 'Please enter a scene description',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold flex items-center">
              <LayoutDashboard className="h-5 w-5 mr-2 text-primary" />
              Session Control Panel
            </CardTitle>
            {sessionState.status !== 'idle' && (
              <Badge 
                variant={sessionState.status === 'active' ? "default" : "outline"}
                className={sessionState.status === 'active' ? "bg-green-500" : "text-yellow-500 border-yellow-500"}
              >
                <Clock className="h-3 w-3 mr-1" />
                {formatSessionTime(sessionTime)}
              </Badge>
            )}
          </div>
          <CardDescription>
            {sessionState.status === 'active' && sessionState.startedAt && (
              <>Session started {format(new Date(sessionState.startedAt), 'PP p')}</>
            )}
            {sessionState.status === 'paused' && sessionState.pausedAt && (
              <>Session paused at {format(new Date(sessionState.pausedAt), 'PP p')}</>
            )}
            {sessionState.status === 'idle' && (
              <>Start a new session to begin playing with your group</>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="space-y-4"
          >
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="controls">Controls</TabsTrigger>
              <TabsTrigger value="scene">Scene Description</TabsTrigger>
              <TabsTrigger value="announce">Announcements</TabsTrigger>
            </TabsList>

            <TabsContent value="controls" className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">Session Status</h3>
                  <p className="text-sm text-muted-foreground">
                    {sessionState.status === 'active' && "Session is currently active"}
                    {sessionState.status === 'paused' && "Session is currently paused"}
                    {sessionState.status === 'idle' && "No active session"}
                  </p>
                </div>
                <Badge>
                  <Users className="h-3 w-3 mr-1" />
                  {sessionState.activePlayerCount || 0} Active Players
                </Badge>
              </div>

              <div className="flex gap-2 pt-2">
                {sessionState.status === 'idle' && (
                  <Button 
                    className="flex-1"
                    onClick={() => setActiveTab('scene')}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start New Session
                  </Button>
                )}

                {sessionState.status === 'active' && (
                  <>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => pauseSessionMutation.mutate()}
                      disabled={pauseSessionMutation.isPending}
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pause Session
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          className="flex-1"
                        >
                          <StopCircle className="h-4 w-4 mr-2" />
                          End Session
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>End the current session?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will end the current session and notify all players. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => endSessionMutation.mutate()}
                            disabled={endSessionMutation.isPending}
                          >
                            End Session
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}

                {sessionState.status === 'paused' && (
                  <>
                    <Button 
                      className="flex-1"
                      onClick={() => resumeSessionMutation.mutate()}
                      disabled={resumeSessionMutation.isPending}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Resume Session
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          className="flex-1"
                        >
                          <StopCircle className="h-4 w-4 mr-2" />
                          End Session
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>End the current session?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will end the current session and notify all players. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => endSessionMutation.mutate()}
                            disabled={endSessionMutation.isPending}
                          >
                            End Session
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="scene" className="space-y-4">
              <div>
                <Label htmlFor="scene-description" className="font-semibold">
                  Scene Description
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  {sessionState.status === 'idle' 
                    ? "Describe the opening scene to start a new session"
                    : "Update the current scene description"}
                </p>
                <Textarea 
                  id="scene-description" 
                  placeholder="Describe what the players see, hear, and experience..."
                  value={sessionDescription}
                  onChange={(e) => setSessionDescription(e.target.value)}
                  className="h-32"
                />
              </div>

              {sessionState.status === 'idle' ? (
                <Button 
                  className="w-full"
                  onClick={handleStartSession}
                  disabled={startSessionMutation.isPending}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Session with This Scene
                </Button>
              ) : (
                <Button 
                  className="w-full"
                  onClick={handleUpdateDescription}
                  disabled={updateDescriptionMutation.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Update Scene Description
                </Button>
              )}

              {sessionState.currentDescription && (
                <div className="pt-4 border-t">
                  <h4 className="font-semibold text-sm mb-2">Current Scene</h4>
                  <div className="bg-muted rounded-md p-3 text-sm">
                    {sessionState.currentDescription}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="announce" className="space-y-4">
              <div>
                <Label htmlFor="announcement" className="font-semibold">
                  Send Announcement to All Players
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  This will send a notification to all connected players
                </p>
                <Textarea 
                  id="announcement" 
                  placeholder="Enter your announcement message..."
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  className="h-24"
                />
              </div>

              <Button 
                className="w-full"
                onClick={handleSendAnnouncement}
                disabled={sendAnnouncementMutation.isPending || sessionState.status === 'idle'}
              >
                <Broadcast className="h-4 w-4 mr-2" />
                Send Announcement
              </Button>
              
              {sessionState.status === 'idle' && (
                <div className="p-3 border border-yellow-200 bg-yellow-50 rounded-md flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    You must start a session before you can send announcements to players
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}