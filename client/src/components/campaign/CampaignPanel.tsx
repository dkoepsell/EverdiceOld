import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Campaign, CampaignSession, Character } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { generateStory, StoryRequest } from "@/lib/openai";
import { DiceType, DiceRoll, DiceRollResult, rollDice, clientRollDice } from "@/lib/dice";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useEnhancedStory } from "@/hooks/use-enhanced-story";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Sparkle, ArrowRight, Settings, Save, Map, MapPin, Clock, ChevronDown, ChevronUp, Dices, Users, Share2, Loader2, Scroll } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import CampaignParticipants from "./CampaignParticipants";
import TurnManager from "./TurnManager";
import CampaignDeploymentTab from "./CampaignDeploymentTab";

interface CampaignPanelProps {
  campaign: Campaign;
}

function CampaignPanel({ campaign }: CampaignPanelProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const isDM = campaign.userId === user?.id;
  
  // Campaign sessions
  const { data: sessions = [], isLoading: sessionsLoading, isError: sessionsError } = useQuery<CampaignSession[]>({
    queryKey: [`/api/campaigns/${campaign.id}/sessions`],
    staleTime: 30000,
  });
  
  // User characters
  const { data: userCharacters = [], isLoading: charactersLoading } = useQuery<Character[]>({
    queryKey: ['/api/characters'],
    enabled: !!user,
  });
  
  // Campaign participants
  const { data: participants = [], isLoading: participantsLoading } = useQuery<any[]>({
    queryKey: [`/api/campaigns/${campaign.id}/participants`],
    enabled: !!campaign.id,
  });
  
  // Local state
  const [showChoiceDialog, setShowChoiceDialog] = useState(false);
  const [showDiceRollDialog, setShowDiceRollDialog] = useState(false);
  const [showCharacterSelectionDialog, setShowCharacterSelectionDialog] = useState(false);
  const [expandedSessions, setExpandedSessions] = useState<number[]>([]);
  const [selectedAction, setSelectedAction] = useState("");
  const [customAction, setCustomAction] = useState(""); // New state for custom action input
  const [searchQuery, setSearchQuery] = useState("");
  const [isRolling, setIsRolling] = useState(false);
  const [dice1Result, setDice1Result] = useState<number | null>(null);
  const [dice2Result, setDice2Result] = useState<number | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);
  const [diceRollResult, setDiceRollResult] = useState<DiceRollResult | null>(null);
  const [isAdvancingStory, setIsAdvancingStory] = useState(false);
  const [narrativeStyle, setNarrativeStyle] = useState(campaign.narrativeStyle);
  const [difficulty, setDifficulty] = useState(campaign.difficulty);
  const [totalSessions, setTotalSessions] = useState(campaign.totalSessions || 5);
  const [settingsChanged, setSettingsChanged] = useState(false);
  const [currentSession, setCurrentSession] = useState<CampaignSession | null>(null);
  const [isTurnBased, setIsTurnBased] = useState(campaign.isTurnBased || false);
  const [currentDiceRoll, setCurrentDiceRoll] = useState<{
    action: string;
    diceType: DiceType;
    rollDC: number;
    rollModifier: number;
    rollPurpose: string;
    successText: string;
    failureText: string;
  } | null>(null);
  
  // Find the user's participant record in this campaign
  const userParticipant = useMemo(() => {
    if (!participants || !user) return null;
    return participants.find((p: any) => p.userId === user.id);
  }, [participants, user]);
  
  // Check if settings are changed
  useEffect(() => {
    setSettingsChanged(
      narrativeStyle !== campaign.narrativeStyle ||
      difficulty !== campaign.difficulty ||
      totalSessions !== (campaign.totalSessions || 5)
    );
  }, [narrativeStyle, difficulty, totalSessions, campaign]);
  
  // Set the current session
  useEffect(() => {
    if (sessions && sessions.length > 0 && campaign) {
      console.log("Found sessions:", sessions);
      
      // First, sort sessions by session number in descending order
      // This ensures we default to the latest session if something goes wrong
      const sortedSessions = [...sessions].sort((a, b) => {
        const aNum = a.sessionNumber || a.session_number || 1;
        const bNum = b.sessionNumber || b.session_number || 1;
        return bNum - aNum; // Descending order (highest session number first)
      });
      
      // Get the latest session (highest session number)
      const latestSession = sortedSessions[0];
      console.log("Latest session:", latestSession);
      
      // Format the session data consistently
      const formattedSession = {
        ...latestSession,
        id: latestSession.id,
        campaignId: latestSession.campaignId || latestSession.campaign_id,
        sessionNumber: latestSession.sessionNumber || latestSession.session_number || 1,
        title: latestSession.title,
        description: latestSession.description || "Your adventure continues...",
        isCompleted: latestSession.isCompleted || latestSession.is_completed || false,
        status: latestSession.status || "pending",
        createdAt: latestSession.createdAt || latestSession.created_at,
        updatedAt: latestSession.updatedAt || latestSession.updated_at,
        // Parse the choices if they are stored as a JSON string
        choices: typeof latestSession.choices === 'string' 
          ? JSON.parse(latestSession.choices) 
          : latestSession.choices
      };
      
      // Set the current session to the latest one
      console.log("Setting current session to latest:", formattedSession);
      setCurrentSession(formattedSession);
    } else {
      console.log("No sessions found:", {sessions, campaign});
    }
  }, [sessions, campaign]);
  
  // Save settings mutation
  const handleSaveSettings = () => {
    // Make a minimal update with just the fields we want to change
    // First ensure totalSessions is a number, not a string
    const tsNumber = Number(totalSessions); 
    
    // Make sure it's a valid number
    const validTotalSessions = !isNaN(tsNumber) && tsNumber > 0 ? tsNumber : 5;
    
    // Create a simpler update object
    const updates = {
      difficulty: difficulty || "Normal",
      narrativeStyle: narrativeStyle || "Epic Fantasy",
      totalSessions: validTotalSessions
    };
    
    console.log("Updating campaign settings:", JSON.stringify(updates));
    
    fetch(`/api/campaigns/${campaign.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
      credentials: 'include'
    })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          console.error("Server response:", text);
          throw new Error(`Failed to update settings: ${response.status}`);
        });
      }
      return response.json();
    })
    .then(data => {
      console.log("Settings updated successfully:", data);
      toast({
        title: "Campaign updated",
        description: "The campaign settings have been updated."
      });
      // Manually refresh campaign data
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaign.id}`] });
    })
    .catch(err => {
      console.error("Error updating settings:", err);
      toast({
        title: "Update failed",
        description: err.message,
        variant: "destructive"
      });
    });
  };
  
  // Toggle journey log entry expansion
  const toggleSessionExpanded = (sessionId: number) => {
    if (expandedSessions.includes(sessionId)) {
      setExpandedSessions(expandedSessions.filter(id => id !== sessionId));
    } else {
      setExpandedSessions([...expandedSessions, sessionId]);
    }
  };
  
  // Toggle turn-based mode
  const handleToggleTurnBased = (enabled: boolean) => {
    setIsTurnBased(enabled);
    updateCampaignMutation.mutate({
      isTurnBased: enabled
    });
  };
  
  // Update campaign mutation
  const updateCampaignMutation = useMutation({
    mutationFn: async (updates: Partial<Campaign>) => {
      try {
        console.log("Sending campaign update:", JSON.stringify(updates));
        const res = await fetch(`/api/campaigns/${campaign.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(updates),
          credentials: 'include'
        });
        
        if (!res.ok) {
          const text = await res.text();
          console.error("Update failed:", res.status, text);
          throw new Error(`Failed to update campaign: ${res.status}`);
        }
        
        return await res.json();
      } catch (err) {
        console.error("Error in update mutation:", err);
        throw err;
      }
    },
    onSuccess: (updatedCampaign) => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaign.id}`] });
      toast({
        title: "Campaign updated",
        description: "The campaign settings have been updated."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Join campaign mutation
  const joinCampaignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCharacterId || !user) return null;
      
      const participantData = {
        userId: user.id,
        characterId: selectedCharacterId,
        role: campaign.userId === user.id ? 'dm' : 'player'
      };
      
      const res = await apiRequest('POST', `/api/campaigns/${campaign.id}/participants`, participantData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaign.id}/participants`] });
      setShowCharacterSelectionDialog(false);
      toast({
        title: "Joined campaign",
        description: "You have successfully joined this campaign."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to join",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Get the enhanced story generation hook
  const { advanceStory } = useEnhancedStory();
  
  // Create dice roll mutation
  const createDiceRollMutation = useMutation({
    mutationFn: async (diceRoll: DiceRoll) => {
      const response = await apiRequest('POST', `/api/dice/roll`, diceRoll);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: `${data.diceType} Roll Result: ${data.result}`,
        description: `Your dice roll for ${data.purpose} is recorded.`
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to record dice roll",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Filter sessions by search query
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim() || !sessions) return sessions;
    
    const query = searchQuery.toLowerCase();
    return sessions.filter(session => 
      session.title.toLowerCase().includes(query) || 
      session.narrative.toLowerCase().includes(query)
    );
  }, [sessions, searchQuery]);
  
  // Handle choice selection
  const handleChoiceSelection = (choice: any) => {
    setSelectedAction(choice.action);
    
    // Check if the choice requires a dice roll (handle both property naming conventions)
    if (choice.requiresRoll || choice.requiresDiceRoll) {
      // Set up the dice roll
      let diceType = choice.diceType as DiceType;
      console.log("Original dice type:", diceType);
      
      if (!diceType || !["d4", "d6", "d8", "d10", "d12", "d20", "d100"].includes(diceType)) {
        diceType = "d20"; // Default to d20 if invalid dice type
        console.warn("Invalid dice type provided, defaulting to d20");
      }
      
      console.log("Final dice type being used:", diceType);
      
      // Set up the dice roll with defaults for any missing values
      setCurrentDiceRoll({
        action: choice.action,
        diceType: diceType,
        rollDC: choice.rollDC || 10, // Default DC if none provided
        rollModifier: choice.rollModifier || 0,
        rollPurpose: choice.rollPurpose || "Skill Check",
        successText: choice.successText || "Success!",
        failureText: choice.failureText || "Failure!"
      });
      
      // Log for debugging
      console.log("Setting up dice roll:", {
        action: choice.action,
        diceType: diceType,
        rollDC: choice.rollDC || 10,
        rollModifier: choice.rollModifier || 0,
      });
      
      setShowDiceRollDialog(true);
    } else {
      // Just advance the story with this action
      setIsAdvancingStory(true);
      advanceStory.mutate(choice.action, {
        onSettled: () => {
          setIsAdvancingStory(false);
        }
      });
    }
  };
  
  const handleDiceRoll = async () => {
    if (!currentDiceRoll) return;
    
    try {
      setIsRolling(true);
      
      // Create the dice roll request
      const diceRoll: DiceRoll = {
        diceType: currentDiceRoll.diceType,
        count: 1, // Usually 1 for skill checks
        modifier: currentDiceRoll.rollModifier || 0,
        purpose: `${currentDiceRoll.rollPurpose || 'Skill Check'} for "${currentDiceRoll.action}"`,
        characterId: userParticipant?.characterId || null // Use character ID from campaign participant
      };
      
      console.log("Dice roll request:", diceRoll);
      
      // Show animation while we wait for server response
      setDiceRollResult({
        diceType: diceRoll.diceType,
        rolls: [0], // Placeholder 
        total: 0,
        modifier: diceRoll.modifier || 0,
        purpose: diceRoll.purpose || '',
        isCritical: false,
        isFumble: false
      });
      
      // Roll the dice on the server
      let result;
      try {
        console.log("Sending dice roll to server:", diceRoll);
        result = await rollDice(diceRoll);
        console.log("Server dice roll result:", result);
        
        if (!result || !result.rolls || !result.total) {
          throw new Error("Invalid dice roll result");
        }
        
        // Update the display with the actual result
        setDiceRollResult(result);
      } catch (error) {
        console.error("Error with server dice roll:", error);
        
        // If server roll fails, do a client-side fallback
        result = clientRollDice(diceRoll);
        setDiceRollResult(result);
        console.log("Using client fallback roll:", result);
      }
      
      // Wait for animation to play
      setTimeout(() => {
        setIsRolling(false);
        
        if (!currentDiceRoll) {
          console.error("Current dice roll is null");
          return;
        }
        
        // Check if the roll was successful
        const rollDC = currentDiceRoll.rollDC || 10;
        const success = result.total >= rollDC;
        
        console.log(`Roll total: ${result.total}, DC: ${rollDC}, Success: ${success}`);
        
        // Show loading state first
        setIsAdvancingStory(true);
        
        // Set a small delay to show the roll result before advancing
        setTimeout(() => {
          // Create a safer action description that avoids special characters
          const actionDescription = success 
            ? `${currentDiceRoll.action} - Success (${result.total} vs DC ${rollDC})`
            : `${currentDiceRoll.action} - Failure (${result.total} vs DC ${rollDC})`;
            
          console.log("Sending story advancement with action:", actionDescription);
          
          // First check if we have a valid campaign and session
          if (!campaign || !campaign.id || !currentSession || !currentSession.id) {
            console.error("Missing campaign or session data for story advancement");
            toast({
              title: "Error",
              description: "Could not advance story due to missing campaign data",
              variant: "destructive"
            });
            setIsAdvancingStory(false);
            setShowDiceRollDialog(false);
            setCurrentDiceRoll(null);
            return;
          }
          
          // Save campaign ID to localStorage for the enhanced story hook
          localStorage.setItem("currentCampaignId", campaign.id.toString());
            
          // Advance the story with the roll result using our enhanced story API
          advanceStory.mutate(
            {
              campaignId: campaign.id,
              actionDescription,
              narrativeStyle: campaign.narrativeStyle,
              difficulty: campaign.difficulty
            },
            {
              onSuccess: (data) => {
                console.log("Enhanced story advancement succeeded, response:", data);
                
                // Keep the loading state active briefly to show transition
                setTimeout(() => {
                  try {
                    // Check if we have the new response format with session and campaignId
                    if (data.session && data.campaignId) {
                      console.log(`Successfully created new session ${data.newSessionNumber} for campaign ${data.campaignId}`);
                      
                      // Force refresh all related data
                      queryClient.invalidateQueries();
                      
                      // Add the new session to the state immediately for faster feedback
                      if (sessions) {
                        const updatedSessions = [...sessions, data.session];
                        queryClient.setQueryData([`/api/campaigns/${campaign.id}/sessions`], updatedSessions);
                      }
                      
                      // Update the campaign object to reflect the new session number
                      const updatedCampaign = {
                        ...campaign,
                        currentSession: data.newSessionNumber
                      };
                      
                      // Update the campaign data in cache
                      queryClient.setQueryData(['/api/campaigns', campaign.id], updatedCampaign);
                      
                      // Set the current session directly rather than waiting for a refetch
                      setCurrentSession(data.session);
                      
                      toast({
                        title: "Story Advanced",
                        description: "The adventure continues with fresh content!",
                      });
                    } else {
                      // Fall back to page reload if response format is old
                      console.log("Using legacy response format, performing full page reload");
                      window.location.reload();
                    }
                  } catch (e) {
                    console.error("Error processing advanced story data:", e);
                    // If anything fails during processing, just reload the page
                    window.location.reload();
                  } finally {
                    // Always clean up UI state
                    setIsAdvancingStory(false);
                    setShowDiceRollDialog(false);
                    setCurrentDiceRoll(null);
                  }
                }, 2000); // Longer animation time to ensure API has time to complete
              },
              onError: (error) => {
                console.error("Story advancement failed:", error);
                setIsAdvancingStory(false);
                setShowDiceRollDialog(false);
                setCurrentDiceRoll(null);
                
                toast({
                  title: "Story Advancement Failed",
                  description: "Could not continue the story. Please try again.",
                  variant: "destructive"
                });
              }
            }
          );
        }, 1000);
      }, 1500);
      
    } catch (error) {
      console.error("Error with dice roll:", error);
      setIsRolling(false);
      toast({
        title: "Dice Roll Error",
        description: "There was a problem with your dice roll",
        variant: "destructive"
      });
      
      setShowDiceRollDialog(false);
      setCurrentDiceRoll(null);
    }
  };
  
  // Show join dialog if not already a participant
  const handleJoinCampaign = () => {
    if (!userParticipant && user) {
      setShowCharacterSelectionDialog(true);
    }
  };
  
  // If user is not yet a participant, show a join button
  const showJoinButton = !userParticipant && !participantsLoading && user && user.id !== campaign.userId;
  
  return (
    <div className="w-full">
      {/* Dice Roll Dialog */}
      <Dialog open={showDiceRollDialog} onOpenChange={setShowDiceRollDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Roll the Dice</DialogTitle>
            <DialogDescription>
              {currentDiceRoll?.rollPurpose} - DC {currentDiceRoll?.rollDC}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {diceRollResult ? (
              <div className="text-center space-y-4">
                <div className="text-4xl font-bold font-fantasy">
                  {diceRollResult.total >= (currentDiceRoll?.rollDC || 0) ? (
                    <span className="text-emerald-600">Success!</span>
                  ) : (
                    <span className="text-rose-600">Failure!</span>
                  )}
                </div>
                
                <div className="flex items-center justify-center space-x-2">
                  <div className="text-3xl font-bold bg-primary/20 p-3 rounded-lg w-16 h-16 flex items-center justify-center">
                    {diceRollResult.rolls[0]}
                  </div>
                  
                  {diceRollResult.rolls.length > 1 && (
                    <div className="text-3xl font-bold bg-primary/20 p-3 rounded-lg w-16 h-16 flex items-center justify-center">
                      {diceRollResult.rolls[1]}
                    </div>
                  )}
                  
                  {currentDiceRoll?.rollModifier !== 0 && (
                    <>
                      <span className="text-2xl">+</span>
                      <div className="text-xl font-bold bg-secondary/20 p-2 rounded-lg w-10 h-10 flex items-center justify-center">
                        {currentDiceRoll?.rollModifier}
                      </div>
                    </>
                  )}
                  
                  <span className="text-2xl">=</span>
                  <div className="text-3xl font-bold bg-accent/20 p-3 rounded-lg w-16 h-16 flex items-center justify-center">
                    {diceRollResult.total}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
                <div className="text-center mb-4">
                  <p className="font-medium">Rolling {currentDiceRoll?.diceType}{currentDiceRoll?.rollModifier ? ` with a ${currentDiceRoll.rollModifier >= 0 ? '+' : ''}${currentDiceRoll.rollModifier} modifier` : ''}</p>
                  <p className="text-sm text-muted-foreground mt-1">For: {currentDiceRoll?.action}</p>
                </div>
                
                <Button 
                  className="mt-4 w-40 h-12 text-lg"
                  onClick={handleDiceRoll}
                >
                  {isRolling ? (
                    <span className="flex items-center">
                      <Dices className="mr-2 h-6 w-6 animate-spin" />
                      Rolling...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Dices className="mr-2 h-6 w-6" />
                      Roll the Dice!
                    </span>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Character Selection Dialog */}
      <Dialog open={showCharacterSelectionDialog} onOpenChange={setShowCharacterSelectionDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Select a Character</DialogTitle>
            <DialogDescription className="text-foreground/80">
              Choose a character to join this campaign
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Debug information */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-muted p-2 rounded text-xs font-mono mb-4">
                <div>User ID: {user?.id}</div>
                <div>Characters found: {Array.isArray(userCharacters) ? userCharacters.length : 'not an array'}</div>
                <div>Selected Character: {selectedCharacterId}</div>
              </div>
            )}
            
            {userCharacters && Array.isArray(userCharacters) && userCharacters.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {userCharacters.map((character) => (
                  <div 
                    key={character.id}
                    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-primary ${
                      selectedCharacterId === character.id ? 'border-primary bg-primary/10' : 'border-border'
                    }`}
                    onClick={() => setSelectedCharacterId(character.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium">{character.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Level {character.level} {character.race} {character.class}
                        </p>
                      </div>
                      {selectedCharacterId === character.id && (
                        <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                          ✓
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">You need to create a character first</p>
                <Button asChild>
                  <a href="/characters">Create a Character</a>
                </Button>
              </div>
            )}
          </div>
          
          <DialogFooter className="gap-2 mt-2">
            <Button
              onClick={() => setShowCharacterSelectionDialog(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => joinCampaignMutation.mutate()}
              disabled={!selectedCharacterId || joinCampaignMutation.isPending}
              className="flex-1"
            >
              {joinCampaignMutation.isPending ? "Joining..." : "Join Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Card className="border-2 border-accent-light bg-parchment drop-shadow-lg">
        <CardContent className="p-0">
          <Tabs defaultValue="narrative" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-secondary-light rounded-none">
              <TabsTrigger value="narrative" className="text-xs sm:text-sm md:text-base">Narrative</TabsTrigger>
              <TabsTrigger value="journey-log" className="text-xs sm:text-sm md:text-base">Journey Log</TabsTrigger>
              <TabsTrigger value="party" className="text-xs sm:text-sm md:text-base">Party</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs sm:text-sm md:text-base">Settings</TabsTrigger>
              <TabsTrigger value="deploy" className="text-xs sm:text-sm md:text-base">
                <span className="flex items-center">
                  <Share2 className="h-3.5 w-3.5 mr-1 md:mr-2 hidden sm:inline-block" />
                  <span>Deploy</span>
                </span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="narrative" className="p-4 sm:p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold font-fantasy text-primary">
                    {campaign.title}
                  </h2>
                  <p className="text-muted-foreground">
                    {campaign.description}
                  </p>
                </div>
                
                {/* Current Session */}
                {currentSession ? (
                  <div className="mt-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold flex items-center text-black">
                        <Scroll className="h-5 w-5 mr-2 text-primary-foreground" />
                        Session {currentSession.sessionNumber || currentSession.session_number || 1}: {currentSession.title || "Whispers of the Watchtower"}
                      </h3>
                      
                      {/* Map link if available */}
                      {currentSession.location && (
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span className="hidden sm:inline">{currentSession.location}</span>
                        </Button>
                      )}
                    </div>
                    
                    {/* Campaign Progress Bar */}
                    <div className="mb-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-muted-foreground">Campaign Progress</span>
                        <span className="text-xs text-muted-foreground">
                          Session {currentSession.sessionNumber || currentSession.session_number || 1} of {campaign.totalSessions || 50}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"
                          style={{ 
                            width: `${Math.min(100, Math.max(5, ((currentSession.sessionNumber || currentSession.session_number || 1) / (campaign.totalSessions || 50)) * 100))}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="bg-parchment-light p-4 rounded-md border border-border shadow-inner">
                      {isAdvancingStory ? (
                        <div className="flex flex-col items-center justify-center py-10">
                          <div className="animate-spin h-12 w-12 rounded-full border-4 border-primary border-t-transparent"></div>
                          <p className="mt-4 text-center font-medium text-primary">
                            Adventure continues...
                          </p>
                        </div>
                      ) : (
                        <p className="whitespace-pre-line text-sm sm:text-base leading-relaxed text-black">
                          {currentSession.narrative || currentSession.description || "The waves crash against the jagged rocks of Blackstone Cove, their frothy crests illuminated by the argent light of a swollen moon that hangs low in the sky. Thorne Ironfist's boots crunch on the gritty sand as he strides forward, followed closely by Grimshaw the Guardian, his loyal half-orc companion whose heavy plate armor clinks with his every step. The air is thick with the scent of salt and moss, mingling with the faint aroma of burned ozone—a reminder of the arcane storm's lingering presence.\n\nBefore them, a path snakes up a steep incline toward the ancient ruins of an Aelorian Watchtower, its silhouette stark against the moonlit sky. The tower's weatherworn stones speak of ages past, and the characters can feel the weight of history as they approach this forgotten sentinel."}
                        </p>
                      )}
                    </div>
                    
                    {/* Story advancement actions - only shown when not advancing story */}
                    {!isAdvancingStory && (
                      <div className="mt-6">
                        <h4 className="font-semibold mb-3">What will you do?</h4>
                        
                        {/* Preset choice buttons */}
                        {currentSession.choices && Array.isArray(currentSession.choices) && currentSession.choices.length > 0 && (
                          <div className="grid grid-cols-1 gap-2 mb-4">
                            {currentSession.choices.map((choice: any, index: number) => (
                              <Button 
                                key={index}
                                variant="outline"
                                className="justify-start h-auto py-3 px-4 bg-primary/5 hover:bg-primary/10 border-primary/20 text-left text-black"
                                onClick={() => handleChoiceSelection(choice)}
                              >
                                <div className="flex items-start">
                                  <ArrowRight className="h-5 w-5 mr-2 mt-0.5 shrink-0" />
                                  <span className="text-black font-medium">
                                    {choice.action}
                                    {(choice.requiresRoll || choice.requiresDiceRoll) && (
                                      <span className="ml-2 text-xs bg-primary/20 text-primary/90 px-2 py-0.5 rounded font-bold">
                                        {choice.rollPurpose || "Skill Check"} ({choice.diceType || "d20"})
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </Button>
                            ))}
                          </div>
                        )}
                        
                        {/* Custom Action Input - Always available */}
                        <div className={currentSession.choices && Array.isArray(currentSession.choices) && currentSession.choices.length > 0 ? "pt-4 border-t border-gray-200" : ""}>
                          <h4 className="font-semibold text-sm mb-2">
                            {currentSession.choices && Array.isArray(currentSession.choices) && currentSession.choices.length > 0 
                              ? "Or enter a custom action:" 
                              : "Enter your action:"}
                          </h4>
                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (customAction.trim()) {
                                setIsAdvancingStory(true);
                                advanceStory.mutate(customAction, {
                                  onSettled: () => {
                                    setIsAdvancingStory(false);
                                    setCustomAction('');
                                  }
                                });
                              }
                            }}
                            className="flex gap-2"
                          >
                            <Input 
                              type="text" 
                              placeholder="Type your own action..." 
                              value={customAction}
                              onChange={(e) => setCustomAction(e.target.value)}
                              className="bg-white border-primary/20 text-black"
                            />
                            <Button 
                              type="submit" 
                              disabled={!customAction.trim() || isAdvancingStory}
                              className="shrink-0"
                            >
                              {isAdvancingStory ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Wait...
                                </>
                              ) : "Submit"}
                            </Button>
                          </form>
                        </div>
                      </div>
                    )}
                    
                    {/* Loading indicator when advancing story */}
                    {isAdvancingStory && (
                      <div className="mt-6 flex items-center justify-center py-8">
                        <div className="text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                          <p className="text-muted-foreground">The story is advancing...</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : sessionsLoading ? (
                  <div className="mt-6">
                    <Skeleton className="h-12 w-3/4 mb-4" />
                    <Skeleton className="h-40 w-full mb-4" />
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-semibold">No Sessions Available</h3>
                    <p className="text-muted-foreground">
                      This campaign has no sessions yet. 
                      {isDM ? " Start your adventure by creating the first session." : " Wait for the DM to begin the campaign."}
                    </p>
                    
                    {/* Show create session button for DM */}
                    {isDM && (
                      <Button className="mt-4">
                        <Sparkle className="h-4 w-4 mr-2" />
                        Create First Session
                      </Button>
                    )}
                  </div>
                )}
                
                {/* Join button (if not already a participant) */}
                {showJoinButton && (
                  <div className="mt-8">
                    <Button 
                      className="w-full sm:w-auto" 
                      size="lg"
                      onClick={handleJoinCampaign}
                    >
                      Join This Campaign
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="journey-log" className="p-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold font-fantasy text-primary">Journey Log</h2>
                  
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search journey log..."
                      className="pl-8 w-[200px] sm:w-[300px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Sessions list */}
                <div className="space-y-3 mt-6">
                  {sessionsLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : filteredSessions && filteredSessions.length > 0 ? (
                    filteredSessions.map((session) => (
                      <Collapsible
                        key={session.id}
                        open={expandedSessions.includes(session.id)}
                        onOpenChange={() => toggleSessionExpanded(session.id)}
                        className="border rounded-md"
                      >
                        <CollapsibleTrigger className="flex justify-between items-center w-full p-3 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center">
                            <Scroll className="h-5 w-5 mr-2 text-primary-foreground" />
                            <div className="text-left">
                              <div className="font-medium text-black">Session {session.sessionNumber}: {session.title}</div>
                              {session.location && (
                                <div className="text-sm text-muted-foreground flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {session.location}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {expandedSessions.includes(session.id) ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <div className="p-3 pt-0 border-t">
                            <div className="bg-parchment-light p-3 rounded-md text-sm whitespace-pre-line">
                              <p className="text-black">{session.narrative}</p>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No journey logs available</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="party" className="p-4">
              <div className="space-y-4">
                <h2 className="text-xl font-bold font-fantasy text-primary">Campaign Party</h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">Party Management</h3>
                      <p className="text-muted-foreground text-sm">Manage the players in this campaign</p>
                    </div>
                    
                    {/* DM only settings */}
                    {isDM && (
                      <div className="flex items-center space-x-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Switch
                                checked={isTurnBased}
                                onCheckedChange={handleToggleTurnBased}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Enable turn-based gameplay for this campaign</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                </div>
                
                <CampaignParticipants campaignId={campaign.id} isDM={isDM} />
                
                {isTurnBased && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Turn Management</h3>
                    <TurnManager 
                      campaignId={campaign.id}
                      isTurnBased={campaign.isTurnBased || false}
                      isDM={isDM}
                      onToggleTurnBased={(enabled) => {
                        updateCampaignMutation.mutate({ isTurnBased: enabled });
                      }}
                    />
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="p-4">
              <div className="space-y-4">
                <h2 className="text-xl font-bold font-fantasy text-primary">Campaign Settings</h2>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-black">Narrative Style</label>
                    <Select value={narrativeStyle} onValueChange={setNarrativeStyle}>
                      <SelectTrigger className="w-[180px] bg-parchment-dark text-black">
                        <SelectValue placeholder="Narrative style" />
                      </SelectTrigger>
                      <SelectContent className="bg-parchment-dark">
                        <SelectItem value="Descriptive">Descriptive</SelectItem>
                        <SelectItem value="Dramatic">Dramatic</SelectItem>
                        <SelectItem value="Conversational">Conversational</SelectItem>
                        <SelectItem value="Humorous">Humorous</SelectItem>
                        <SelectItem value="Dark">Dark</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-black">Difficulty</label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger className="w-[180px] bg-parchment-dark text-black">
                        <SelectValue placeholder="Difficulty" />
                      </SelectTrigger>
                      <SelectContent className="bg-parchment-dark">
                        <SelectItem value="Easy - Beginner Friendly">Easy - Beginner Friendly</SelectItem>
                        <SelectItem value="Normal - Balanced Challenge">Normal - Balanced Challenge</SelectItem>
                        <SelectItem value="Hard - Deadly Encounters">Hard - Deadly Encounters</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-black">Total Sessions</label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={totalSessions || 5}
                        onChange={(e) => setTotalSessions(Math.max(1, parseInt(e.target.value) || 5))}
                        className="w-[120px] bg-parchment-dark text-black"
                      />
                      <span className="text-xs text-muted-foreground">
                        (Current: Session {campaign.currentSession} of {totalSessions || 5})
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <Button 
                      onClick={handleSaveSettings}
                      disabled={!settingsChanged || updateCampaignMutation.isPending}
                    >
                      {updateCampaignMutation.isPending ? (
                        <span className="flex items-center">
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Save className="h-4 w-4 mr-2" />
                          Save Settings
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="deploy" className="p-4">
              <CampaignDeploymentTab campaign={campaign} isCreator={isDM} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default CampaignPanel;