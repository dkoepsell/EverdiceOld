import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Campaign, CampaignSession } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { generateStory, StoryRequest } from "@/lib/openai";
import { DiceType, DiceRoll, DiceRollResult, rollDice, clientRollDice } from "@/lib/dice";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
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
import { Search, Sparkle, ArrowRight, Settings, Save, Map, MapPin, Clock, ChevronDown, ChevronUp, Dices, Users } from "lucide-react";
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

interface CampaignPanelProps {
  campaign: Campaign;
}

export default function CampaignPanel({ campaign }: CampaignPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [customAction, setCustomAction] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [narrativeStyle, setNarrativeStyle] = useState(campaign.narrativeStyle);
  const [storyDirection, setStoryDirection] = useState("balanced");
  
  // Character selection states
  const [showCharacterSelectionDialog, setShowCharacterSelectionDialog] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);
  const [isJoiningCampaign, setIsJoiningCampaign] = useState(false);
  
  // Track expanded journey log entries
  const [expandedSessions, setExpandedSessions] = useState<number[]>([]);
  
  // Multi-user campaign states
  const [isTurnBased, setIsTurnBased] = useState(campaign.isTurnBased || false);
  
  // Dice roll states
  const [showDiceRollDialog, setShowDiceRollDialog] = useState(false);
  const [currentDiceRoll, setCurrentDiceRoll] = useState<{
    action: string;
    diceType: DiceType;
    rollDC: number;
    rollModifier: number;
    rollPurpose: string;
    successText: string;
    failureText: string;
  } | null>(null);
  const [diceResult, setDiceResult] = useState<DiceRollResult | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  
  // Toggle journey log entry expansion
  const toggleSessionExpanded = (sessionId: number) => {
    if (expandedSessions.includes(sessionId)) {
      setExpandedSessions(expandedSessions.filter(id => id !== sessionId));
    } else {
      setExpandedSessions([...expandedSessions, sessionId]);
    }
  };
  
  // Check if current user is the DM of this campaign
  const isDM = campaign.userId === user?.id;
  
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
      const res = await apiRequest('PATCH', `/api/campaigns/${campaign.id}`, updates);
      return await res.json();
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
        description: "You have successfully joined the campaign."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to join campaign",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Fetch campaign participants
  const { data: participants } = useQuery({
    queryKey: [`/api/campaigns/${campaign.id}/participants`],
    enabled: !!campaign.id
  });
  
  // Fetch user's characters for selection
  const { data: userCharacters } = useQuery({
    queryKey: ['/api/characters'],
    enabled: showCharacterSelectionDialog
  });
  
  // Fetch all campaign sessions 
  const { data: campaignSessions, isLoading: isLoadingSessions } = useQuery<CampaignSession[]>({
    queryKey: [`/api/campaigns/${campaign.id}/sessions`],
  });
  
  // Check if current user is already a participant
  const userParticipant = useMemo(() => {
    if (!user || !participants || !Array.isArray(participants)) return null;
    return participants.find(p => p.userId === user.id);
  }, [user, participants]);
  
  // Auto-show character selection dialog if needed
  useEffect(() => {
    // If user is not a participant and not the DM, show character selection
    if (user && user.id !== campaign.userId && !userParticipant && !showCharacterSelectionDialog) {
      setShowCharacterSelectionDialog(true);
    }
  }, [user, campaign.userId, userParticipant, showCharacterSelectionDialog]);
  
  // Find the current session by session number
  const currentSession = useMemo(() => {
    if (!campaignSessions || !campaign.currentSession) return null;
    // Make sure campaignSessions is an array and not just the campaign object
    if (!Array.isArray(campaignSessions)) return null;
    return campaignSessions.find(session => session.sessionNumber === campaign.currentSession);
  }, [campaignSessions, campaign.currentSession]);
  
  const isLoadingSession = isLoadingSessions || !currentSession;
  
  // Debug logging
  useEffect(() => {
    // Use a direct fetch to debug API response
    fetch(`/api/campaigns/${campaign.id}/sessions`)
      .then(res => res.json())
      .then(data => {
        console.log("Direct API response for sessions:", data);
      })
      .catch(err => {
        console.error("Error fetching sessions:", err);
      });
      
    console.log("Current session data:", currentSession);
    console.log("Campaign sessions state:", campaignSessions);
    console.log("Campaign object:", campaign);
    if (campaign && campaign.currentSession) {
      console.log(`Trying to fetch session #${campaign.currentSession}`);
    }
  }, [campaign.id, campaignSessions, currentSession, campaign]);

  // Mutation to generate a new story segment or advance the current one
  const advanceStory = useMutation({
    mutationFn: async (action: string) => {
      setIsGenerating(true);
      const storyRequest: StoryRequest = {
        campaignId: campaign.id,
        prompt: action,
        narrativeStyle,
        difficulty: campaign.difficulty,
        storyDirection,
        currentLocation: currentSession?.location || undefined,
      };
      
      const response = await apiRequest(
        "POST",
        "/api/campaigns/advance-story",
        storyRequest
      );
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/campaigns', campaign.id, 'sessions'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/campaigns'] 
      });
      
      toast({
        title: "Story Advanced",
        description: "The campaign has progressed to the next scene.",
      });
      
      setCustomAction("");
      setIsGenerating(false);
    },
    onError: (error: any) => {
      console.error("Story advancement error:", error);
      
      let errorMessage = "Failed to advance the story. Please try again.";
      if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      toast({
        title: "Story Advancement Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      setIsGenerating(false);
    },
  });

  const handleActionClick = (choice: any) => {
    console.log("Action clicked:", choice);
    
    // Check if this action requires a dice roll
    if (choice.requiresDiceRoll) {
      // Convert diceType to a valid DiceType if needed
      let diceType = choice.diceType as DiceType;
      if (!diceType || !["d4", "d6", "d8", "d10", "d12", "d20", "d100"].includes(diceType)) {
        diceType = "d20"; // Default to d20 if invalid dice type
        console.warn("Invalid dice type provided, defaulting to d20");
      }
      
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
      advanceStory.mutate(choice.action);
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
        modifier: currentDiceRoll.rollModifier,
        purpose: `${currentDiceRoll.rollPurpose} for "${currentDiceRoll.action}"`,
        characterId: null // Get character ID from campaign participants if needed
      };
      
      // Get the dice roll result (using client-side roll for immediate feedback)
      const result = clientRollDice(diceRoll);
      
      // Save the result to the server with the same values for consistency
      try {
        // Create a roll record with the result included for storage
        const rollRecord = {
          ...diceRoll,
          result: result.total, // Add the result field required by the schema
          userId: user?.id || 1, // Use actual user ID if available
          createdAt: new Date().toISOString()
        };
        
        // Send asynchronously to server for history
        fetch('/api/dice/roll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rollRecord)
        })
        .then(() => {
          // Invalidate dice roll history to refresh
          queryClient.invalidateQueries({ queryKey: ['/api/dice/history'] });
        })
        .catch(err => {
          console.error("Failed to save roll to history:", err);
        });
      } catch (err) {
        console.error("Error saving dice roll:", err);
      }
      
      setDiceResult(result);
      
      // Check if the roll succeeded
      const succeeded = result.total >= currentDiceRoll.rollDC;
      
      // Append the dice roll outcome to the action text
      const actionWithResult = `${currentDiceRoll.action} - ${succeeded ? 
        `${currentDiceRoll.successText} (Rolled ${result.total} vs DC ${currentDiceRoll.rollDC})` : 
        `${currentDiceRoll.failureText} (Rolled ${result.total} vs DC ${currentDiceRoll.rollDC})`}`;
      
      // Give players time to see the dice roll result
      setTimeout(() => {
        // Advance the story with the enhanced action text
        advanceStory.mutate(actionWithResult);
        setShowDiceRollDialog(false);
        setCurrentDiceRoll(null);
        setDiceResult(null);
        setIsRolling(false);
      }, 2000);
    } catch (error) {
      setIsRolling(false);
      toast({
        title: "Dice Roll Failed",
        description: "There was an error rolling the dice. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCustomAction = () => {
    if (customAction.trim()) {
      advanceStory.mutate(customAction);
    } else {
      toast({
        title: "Empty Action",
        description: "Please enter an action to continue the story.",
        variant: "destructive",
      });
    }
  };

  // Default data if no session is loaded yet
  const defaultNarrative = "Your journey begins in the town of Greystone, a small settlement nestled between rolling hills and dense forests. The air is crisp with the scent of pine and woodsmoke, and the town square bustles with activity as merchants hawk their wares.";
  
  const defaultChoices = [
    { action: "Visit the local tavern", description: "Seek information or employment", icon: "search" },
    { action: "Approach the town's elder", description: "Learn more about the region", icon: "hand-sparkles" },
    { action: "Seek out the local guild", description: "Find official work and opportunities", icon: "users" },
    { action: "Head directly to the wilderness", description: "Look for danger and treasure", icon: "mountain" }
  ];

  return (
    <div>
      {/* Dice Roll Dialog */}
      <Dialog open={showDiceRollDialog} onOpenChange={setShowDiceRollDialog}>
        <DialogContent className="bg-parchment-dark border-2 border-primary max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-fantasy text-primary text-center">
              {currentDiceRoll?.rollPurpose || "Dice Roll"}
            </DialogTitle>
            <DialogDescription className="text-center text-secondary">
              {currentDiceRoll?.action}
              {currentDiceRoll && (
                <div className="my-2">
                  Rolling a {currentDiceRoll.diceType} 
                  {currentDiceRoll.rollModifier !== 0 && 
                    ` with ${currentDiceRoll.rollModifier > 0 ? '+' : ''}${currentDiceRoll.rollModifier} modifier`}. 
                  Need to beat DC {currentDiceRoll.rollDC}.
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center p-4">
            {diceResult ? (
              <div className="text-center">
                <div className="text-4xl font-bold font-fantasy mb-2">
                  {diceResult.total}
                </div>
                <div className="text-sm text-gray-600">
                  {diceResult.rolls.join(' + ')}
                  {diceResult.modifier !== 0 && 
                    ` ${diceResult.modifier > 0 ? '+' : ''}${diceResult.modifier}`}
                </div>
                
                {currentDiceRoll && (
                  <div className={`mt-4 font-bold text-lg ${diceResult.total >= (currentDiceRoll?.rollDC || 0) ? 'text-green-600' : 'text-red-600'}`}>
                    {diceResult.total >= (currentDiceRoll?.rollDC || 0) ? (
                      <span>{currentDiceRoll.successText || "Success!"}</span>
                    ) : (
                      <span>{currentDiceRoll.failureText || "Failure!"}</span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <div className="h-20 flex items-center justify-center">
                  <Button 
                    className="px-8 py-6 text-lg bg-gradient-to-br from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800 font-fantasy"
                    disabled={isRolling}
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
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Character Selection Dialog */}
      <Dialog open={showCharacterSelectionDialog} onOpenChange={setShowCharacterSelectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select a Character</DialogTitle>
            <DialogDescription>
              Choose a character to join this campaign
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {userCharacters && Array.isArray(userCharacters) && userCharacters.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {userCharacters.map((character) => (
                  <div 
                    key={character.id}
                    className={`relative p-3 border rounded-lg cursor-pointer ${
                      selectedCharacterId === character.id ? 'border-primary bg-primary/10' : 'border-border'
                    }`}
                    onClick={() => setSelectedCharacterId(character.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-secondary-light rounded-full w-10 h-10 flex items-center justify-center">
                        {character.class.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-medium">{character.name}</h4>
                        <p className="text-sm text-gray-500">
                          Level {character.level} {character.race} {character.class}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-2">No characters available</p>
                <p className="text-sm text-gray-500">
                  You need to create a character first
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              onClick={() => setShowCharacterSelectionDialog(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={() => joinCampaignMutation.mutate()}
              disabled={!selectedCharacterId || joinCampaignMutation.isPending}
            >
              {joinCampaignMutation.isPending ? "Joining..." : "Join Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Card className="border-2 border-accent-light bg-parchment drop-shadow-lg">
        <CardContent className="p-0">
          <Tabs defaultValue="narrative" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-secondary-light rounded-none">
              <TabsTrigger value="narrative" className="text-sm sm:text-base">Narrative</TabsTrigger>
              <TabsTrigger value="journey-log" className="text-sm sm:text-base">Journey Log</TabsTrigger>
              <TabsTrigger value="party" className="text-sm sm:text-base">Party</TabsTrigger>
              <TabsTrigger value="settings" className="text-sm sm:text-base">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="narrative" className="p-4 sm:p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold font-fantasy text-primary">
                    {campaign.title}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {campaign.difficulty} Difficulty • {campaign.narrativeStyle} Style
                  </p>
                </div>
                
                {isLoadingSession ? (
                  <div className="space-y-4">
                    <Skeleton className="h-40 w-full" />
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative p-4 bg-parchment-light border border-amber-200 rounded-md">
                      <p className="text-lg leading-relaxed whitespace-pre-line">
                        {currentSession?.narrative || defaultNarrative}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-primary-dark">What will you do?</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(currentSession?.choices ? JSON.parse(String(currentSession.choices)) : defaultChoices).map((choice: any, index: number) => (
                          <Button 
                            key={index}
                            variant="outline"
                            className={`h-auto py-3 px-4 justify-start text-left border border-amber-200 bg-parchment-light hover:bg-amber-50 transition-all ${
                              choice.requiresDiceRoll ? 'hover:border-secondary hover:text-secondary' : 'hover:border-primary hover:text-primary'
                            }`}
                            onClick={() => handleActionClick(choice)}
                            disabled={advanceStory.isPending || isGenerating}
                          >
                            <div className="flex items-start gap-3">
                              {choice.requiresDiceRoll ? (
                                <Dices className="h-5 w-5 flex-shrink-0 mt-0.5 text-secondary" />
                              ) : (
                                <Sparkle className="h-5 w-5 flex-shrink-0 mt-0.5 text-primary" />
                              )}
                              <div>
                                <div className="font-medium mb-1">{choice.action}</div>
                                {choice.description && (
                                  <div className="text-sm text-gray-500">{choice.description}</div>
                                )}
                                {choice.requiresDiceRoll && (
                                  <div className="text-xs text-secondary mt-1">
                                    Requires {choice.diceType || "d20"} roll 
                                    {choice.rollDC && ` (DC ${choice.rollDC})`}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Button>
                        ))}
                        
                        <div className="sm:col-span-2 mt-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter a custom action..."
                              value={customAction}
                              onChange={(e) => setCustomAction(e.target.value)}
                              className="bg-parchment-light"
                            />
                            <Button 
                              onClick={handleCustomAction} 
                              disabled={advanceStory.isPending || isGenerating || !customAction.trim()}
                              className="whitespace-nowrap"
                            >
                              {advanceStory.isPending || isGenerating ? "Processing..." : "Take Action"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="journey-log" className="p-4">
              <div className="space-y-4">
                <h2 className="text-xl font-bold font-fantasy text-primary">Journey Log</h2>
                
                {!campaignSessions || campaignSessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No journey entries yet. Begin your adventure to record your story.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Array.isArray(campaignSessions) && campaignSessions
                      .sort((a, b) => b.sessionNumber - a.sessionNumber)
                      .map((session) => (
                        <Collapsible
                          key={session.id}
                          open={expandedSessions.includes(session.id)}
                          onOpenChange={() => toggleSessionExpanded(session.id)}
                          className="border border-amber-200 rounded-md overflow-hidden"
                        >
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-parchment-light hover:bg-amber-50 text-left">
                            <div>
                              <span className="font-medium">Session {session.sessionNumber}: {session.title}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {session.isCompleted && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Completed</span>
                              )}
                              {session.sessionNumber === campaign.currentSession && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Current</span>
                              )}
                              {expandedSessions.includes(session.id) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="p-3 bg-parchment border-t border-amber-200">
                            <p className="whitespace-pre-line mb-3">{session.narrative}</p>
                            {session.location && (
                              <div className="flex items-center text-sm text-gray-600 mb-2">
                                <MapPin className="h-4 w-4 mr-1" />
                                <span>{session.location}</span>
                              </div>
                            )}
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="party" className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold font-fantasy text-primary">Party Members</h2>
                  
                  {isDM && (
                    <div className="flex items-center space-x-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="turnBased"
                              checked={isTurnBased}
                              onChange={(e) => handleToggleTurnBased(e.target.checked)}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="turnBased" className="text-sm cursor-pointer">
                              Turn-based Mode
                            </label>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Enable turn-based gameplay for this campaign</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>
                
                <CampaignParticipants campaignId={campaign.id} isDM={isDM} />
                
                {isTurnBased && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Turn Management</h3>
                    <TurnManager 
                      campaignId={campaign.id} 
                      currentTurnUserId={campaign.currentTurnUserId} 
                      isDM={isDM}
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
                    <label className="text-sm font-medium">Narrative Style</label>
                    <Select value={narrativeStyle} onValueChange={setNarrativeStyle}>
                      <SelectTrigger className="w-[180px] bg-parchment-dark">
                        <SelectValue placeholder="Narrative style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Descriptive">Descriptive</SelectItem>
                        <SelectItem value="Humorous">Humorous</SelectItem>
                        <SelectItem value="Dark">Dark</SelectItem>
                        <SelectItem value="Mysterious">Mysterious</SelectItem>
                        <SelectItem value="Epic">Epic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Direction:</span>
                    <Select value={storyDirection} onValueChange={setStoryDirection}>
                      <SelectTrigger className="w-[180px] bg-parchment-dark">
                        <SelectValue placeholder="Story direction" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="combat-focused">Combat-focused</SelectItem>
                        <SelectItem value="puzzle-focused">Puzzle-focused</SelectItem>
                        <SelectItem value="roleplay-focused">Roleplay-focused</SelectItem>
                        <SelectItem value="exploration-focused">Exploration-focused</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}