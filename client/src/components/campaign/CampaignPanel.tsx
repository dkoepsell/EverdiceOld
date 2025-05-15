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
  const [customAction, setCustomAction] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [narrativeStyle, setNarrativeStyle] = useState(campaign.narrativeStyle);
  const [storyDirection, setStoryDirection] = useState("balanced");
  
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
  
  const { toast } = useToast();
  
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
  
  // Fetch all campaign sessions 
  const { data: campaignSessions, isLoading: isLoadingSessions } = useQuery<CampaignSession[]>({
    queryKey: [`/api/campaigns/${campaign.id}/sessions`],
  });
  
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
  }, [campaign.id]);

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
          userId: 1, // Default user
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
              <div className="h-32 w-32 flex items-center justify-center">
                <Dices className="h-20 w-20 text-primary-light animate-bounce" />
              </div>
            )}
          </div>
          
          <DialogFooter>
            {!diceResult ? (
              <Button 
                className="w-full bg-primary hover:bg-primary-dark text-white font-medium"
                onClick={handleDiceRoll}
                disabled={isRolling}
              >
                Roll the Dice!
              </Button>
            ) : (
              <Button 
                className="w-full bg-primary hover:bg-primary-dark text-white font-medium"
                onClick={() => {
                  if (!isRolling) {
                    setShowDiceRollDialog(false);
                  }
                }}
                disabled={isRolling}
              >
                {isRolling ? "Continuing..." : "Continue Story"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
        
      <Card className="bg-secondary-light rounded-lg shadow-xl overflow-hidden mb-8">
        <div className="p-4 bg-parchment character-sheet">
          <Tabs defaultValue="current">
            <div className="flex justify-between items-center mb-4">
              <TabsList className="bg-secondary/20">
                <TabsTrigger value="current" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  Current Quest
                </TabsTrigger>
                <TabsTrigger value="journey" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  Journey Log
                </TabsTrigger>
                <TabsTrigger value="party" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  Party
                </TabsTrigger>
              </TabsList>
              <div className="flex space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{currentSession?.location || 'Unknown Location'}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Current location</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>Session {campaign.currentSession || 1}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Current session</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            <TabsContent value="current" className="mt-0">
              <div className="mb-6">
                {isLoadingSession ? (
                  <Skeleton className="h-40 w-full rounded-lg bg-gray-200" />
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-lg leading-relaxed whitespace-pre-line">
                      {currentSession?.narrative || defaultNarrative}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                <h4 className="font-fantasy text-2xl sm:text-3xl font-bold text-primary text-center py-3">What will you do?</h4>
                {currentSession?.choices?.some((choice: any) => choice.requiresDiceRoll) && (
                  <div className="flex items-center justify-center sm:justify-start text-sm sm:text-base bg-primary/10 text-primary p-2 rounded-lg border border-primary/30 w-full sm:w-auto mb-2 sm:mb-0">
                    <Dices className="h-5 w-5 mr-2 flex-shrink-0 animate-pulse" />
                    <span className="font-bold">Dice roll opportunities available</span>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="journey" className="mt-0">
              <div className="mb-4">
                <h4 className="font-fantasy text-xl font-medium text-primary mb-3">Journey Log</h4>
                <div className="max-h-[40vh] overflow-y-auto pr-2">
                  {isLoadingSessions ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-lg bg-gray-200" />
                      ))}
                    </div>
                  ) : !campaignSessions || campaignSessions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No journey entries yet. Begin your adventure!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {campaignSessions
                        .slice()
                        .sort((a, b) => b.sessionNumber - a.sessionNumber)
                        .map((session) => (
                          <Collapsible 
                            key={session.id} 
                            className="p-3 border border-gray-200 rounded-lg bg-parchment-light"
                            open={expandedSessions.includes(session.id)}
                            onOpenChange={() => toggleSessionExpanded(session.id)}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <CollapsibleTrigger className="flex items-center w-full text-left">
                                <h5 className="font-fantasy text-lg text-primary">{session.title}</h5>
                                <div className="ml-auto flex items-center space-x-2">
                                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                    Session {session.sessionNumber}
                                  </span>
                                  {expandedSessions.includes(session.id) ? 
                                    <ChevronUp className="h-4 w-4 text-primary-light" /> : 
                                    <ChevronDown className="h-4 w-4 text-primary-light" />
                                  }
                                </div>
                              </CollapsibleTrigger>
                            </div>
                            
                            <div className="text-sm text-gray-600">
                              {!expandedSessions.includes(session.id) ? (
                                <p className="line-clamp-2">
                                  {session.narrative.substring(0, 150)}...
                                </p>
                              ) : (
                                <CollapsibleContent>
                                  <div className="whitespace-pre-line bg-parchment-dark p-3 rounded-md mb-3">
                                    {session.narrative}
                                  </div>
                                </CollapsibleContent>
                              )}
                            </div>
                            
                            <div className="mt-2 flex items-center text-xs text-gray-500">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span>{session.location || 'Unknown location'}</span>
                            </div>
                          </Collapsible>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="party" className="animate-in fade-in-50">
              <div className="space-y-6 p-4">
                <CampaignParticipants 
                  campaignId={campaign.id} 
                  isDM={isDM}
                />
                
                <TurnManager 
                  campaignId={campaign.id}
                  isTurnBased={isTurnBased}
                  isDM={isDM}
                  onToggleTurnBased={handleToggleTurnBased}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-6">
            {isLoadingSession ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg bg-gray-200" />
              ))
            ) : (
              (currentSession?.choices || defaultChoices).map((choice: any, index: number) => (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline"
                      className={`${choice.requiresDiceRoll ? 
                        'bg-parchment-dark border-2 border-primary hover:bg-primary-light' : 
                        'bg-parchment-dark hover:bg-primary'} 
                        hover:text-white text-left text-secondary p-3 sm:p-4 rounded-lg transition relative w-full justify-start min-h-[5rem] sm:min-h-[4.5rem]`}
                      onClick={() => handleActionClick(choice)}
                      disabled={isGenerating || advanceStory.isPending}
                    >
                      <div className="grid grid-cols-[auto_1fr] gap-2">
                        <div className="flex-shrink-0 pt-1">
                          {choice.icon === "search" && <Search className="text-primary-light min-w-[20px] mr-1 h-5 w-5" />}
                          {choice.icon === "hand-sparkles" && <Sparkle className="text-primary-light min-w-[20px] mr-1 h-5 w-5" />}
                          {choice.icon === "sword" && <Dices className="text-primary-light min-w-[20px] mr-1 h-5 w-5" />}
                          {!["search", "hand-sparkles", "sword"].includes(choice.icon) && (
                            <ArrowRight className="text-primary-light min-w-[20px] mr-1 h-5 w-5" />
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <div className={`${choice.requiresDiceRoll ? 'font-bold text-primary' : ''} text-sm sm:text-base break-words`} style={{ wordBreak: 'break-word', overflowWrap: 'break-word', hyphens: 'auto' }}>
                            {choice.action}
                          </div>
                          {choice.requiresDiceRoll && (
                            <div className="flex items-center mt-2 bg-primary/5 p-1 rounded border border-primary/20">
                              <Dices className="text-primary h-4 w-4 mr-1" />
                              <span className="text-xs sm:text-sm font-bold text-primary">
                                {choice.rollPurpose || 'Roll Check'} ({choice.diceType || 'd20'})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Button>
                  </TooltipTrigger>
                  {choice.description && (
                    <TooltipContent side="top">
                      <p>{choice.description}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              ))
            )}
          </div>
          
          <div className="text-secondary mt-8 mb-2">
            <label className="block font-serif font-bold text-xl text-primary mb-2">Custom action:</label>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full">
              <Input 
                type="text" 
                className="flex-grow bg-parchment-dark border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter your own action..." 
                value={customAction}
                onChange={(e) => setCustomAction(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && customAction.trim() && handleCustomAction()}
                disabled={isGenerating || advanceStory.isPending}
              />
              <Button 
                variant="default" 
                onClick={handleCustomAction}
                disabled={!customAction.trim() || isGenerating || advanceStory.isPending}
                className="bg-primary text-white hover:bg-primary-dark w-full sm:w-auto"
              >
                Submit
              </Button>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Story style:</span>
              <Select value={narrativeStyle} onValueChange={setNarrativeStyle}>
                <SelectTrigger className="w-[180px] bg-parchment-dark">
                  <SelectValue placeholder="Select style" />
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
      </Card>
    </div>
  );
}