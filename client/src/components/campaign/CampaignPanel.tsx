import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Campaign, CampaignSession } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { generateStory, StoryRequest } from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Sparkle, ArrowRight, Settings, Save, Map, MapPin, Clock, ChevronDown, ChevronUp } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface CampaignPanelProps {
  campaign: Campaign;
}

export default function CampaignPanel({ campaign }: CampaignPanelProps) {
  const [customAction, setCustomAction] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [narrativeStyle, setNarrativeStyle] = useState(campaign.narrativeStyle);
  const [storyDirection, setStoryDirection] = useState("balanced");
  
  const { toast } = useToast();
  
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

  const advanceStory = useMutation({
    mutationFn: async (action: string) => {
      // Include current location for geographical consistency
      let currentLocation = "";
      if (currentSession?.location) {
        currentLocation = currentSession.location;
      } else if (campaignSessions && campaignSessions.length > 0) {
        // Find the last session with a location
        for (let i = campaignSessions.length - 1; i >= 0; i--) {
          if (campaignSessions[i].location) {
            currentLocation = campaignSessions[i].location;
            break;
          }
        }
      }
      
      const storyRequest: StoryRequest = {
        campaignId: campaign.id,
        prompt: action,
        narrativeStyle,
        difficulty: campaign.difficulty,
        storyDirection,
        currentLocation
      };
      
      setIsGenerating(true);
      const storyResponse = await generateStory(storyRequest);
      
      // Save the new session to the server
      const response = await apiRequest(
        "POST", 
        `/api/campaigns/${campaign.id}/sessions`,
        {
          campaignId: campaign.id,
          sessionNumber: campaign.currentSession + 1,
          title: storyResponse.sessionTitle,
          narrative: storyResponse.narrative,
          location: storyResponse.location,
          choices: storyResponse.choices,
          createdAt: new Date().toISOString(),
        }
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
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to advance the story. Please try again.",
        variant: "destructive",
      });
      setIsGenerating(false);
    },
  });

  const handleActionClick = (action: string) => {
    advanceStory.mutate(action);
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
  // Default content if no session data is available
  const defaultNarrative = "You are about to embark on a grand adventure. What would you like to do?";
  const defaultLocation = "Starting Point";
  const defaultChoices = [
    { action: "Explore the nearby town", description: "Learn about the local area and find quests", icon: "map" },
    { action: "Visit the tavern", description: "Meet potential allies and gather rumors", icon: "beer" },
    { action: "Seek out the local guild", description: "Find official work and opportunities", icon: "users" },
    { action: "Head directly to the wilderness", description: "Look for danger and treasure", icon: "mountain" }
  ];

  return (
    <Card className="bg-secondary-light rounded-lg shadow-xl overflow-hidden mb-8">
      <div className="bg-primary p-4 flex justify-between items-center">
        <h2 className="font-fantasy text-xl font-bold text-white">Current Adventure</h2>
        <div className="flex space-x-2">
          <Button variant="ghost" className="bg-primary-light hover:bg-primary-dark px-3 py-1 rounded text-sm text-white transition">
            <Settings className="h-4 w-4 mr-1" /> Settings
          </Button>
          <Button className="bg-gold hover:bg-gold-dark px-3 py-1 rounded text-sm text-primary font-medium transition">
            <Save className="h-4 w-4 mr-1" /> Save
          </Button>
        </div>
      </div>
      
      <div className="p-4 bg-parchment character-sheet">
        <h3 className="font-fantasy text-2xl font-bold text-primary mb-4">{campaign.title}</h3>
        <p className="text-sm text-gray-600 mb-4">
          Session {campaign.currentSession} - {currentSession?.title || "The Beginning"}
        </p>
        
        <Tabs defaultValue="current" className="mb-6">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="current" className="font-fantasy">Current Scene</TabsTrigger>
            <TabsTrigger value="journey" className="font-fantasy">Journey Log</TabsTrigger>
          </TabsList>
          
          <TabsContent value="current">
            {/* Current Narrative Content */}
            {isLoadingSession ? (
              <div className="bg-parchment-dark border border-gray-300 rounded-lg p-4 mb-6 min-h-[300px]">
                <Skeleton className="h-[40vh] w-full" />
              </div>
            ) : (
              <div className="bg-parchment-dark border border-gray-300 rounded-lg p-4 mb-6 min-h-[300px] max-h-[60vh] overflow-y-auto scroll-container text-secondary">
                <div className="flex items-center text-primary mb-3 text-sm">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="font-bold">{currentSession?.location || defaultLocation}</span>
                </div>
                <p className="mb-3 whitespace-pre-line">
                  {currentSession?.narrative || defaultNarrative}
                </p>
                
                <p className="font-bold">What do you do?</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="journey">
            {/* Journey History */}
            {isLoadingSessions ? (
              <div className="bg-parchment-dark border border-gray-300 rounded-lg p-4 min-h-[300px]">
                <Skeleton className="h-[40vh] w-full" />
              </div>
            ) : (
              <div className="bg-parchment-dark border border-gray-300 rounded-lg p-4 min-h-[300px] max-h-[60vh] overflow-y-auto scroll-container text-secondary">
                {campaignSessions && campaignSessions.length > 0 ? (
                  <div className="space-y-6">
                    {campaignSessions.map((session) => (
                      <div key={session.id} className="border-b border-gray-300 pb-4 last:border-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-fantasy text-primary text-lg">{session.title}</h4>
                            <div className="flex text-gray-600 text-sm space-x-3">
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>Session {session.sessionNumber}</span>
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                <span>{session.location || defaultLocation}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className="whitespace-pre-line text-sm">
                          {session.narrative}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500">No sessions recorded yet in this campaign.</p>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Player Actions */}
        <div className="mb-6">
          <h4 className="font-fantasy text-lg font-bold mb-3 text-primary-light">Your Actions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {(currentSession?.choices || defaultChoices).map((choice, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline"
                    className="bg-parchment-dark hover:bg-primary hover:text-white text-left text-secondary p-3 rounded-lg transition relative w-full justify-start"
                    onClick={() => handleActionClick(choice.action)}
                    disabled={isGenerating || advanceStory.isPending}
                  >
                    <div className="flex items-center">
                      {choice.icon === "search" && <Search className="text-primary-light mr-2 h-5 w-5" />}
                      {choice.icon === "hand-sparkles" && <Sparkle className="text-primary-light mr-2 h-5 w-5" />}
                      {!["search", "hand-sparkles"].includes(choice.icon) && (
                        <ArrowRight className="text-primary-light mr-2 h-5 w-5" />
                      )}
                      <span>{choice.action}</span>
                    </div>
                  </Button>
                </TooltipTrigger>
                {choice.description && (
                  <TooltipContent side="top">
                    <p>{choice.description}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </div>
          
          <div className="flex items-center space-x-2 text-secondary">
            <span className="font-medium">Custom action:</span>
            <Input 
              type="text" 
              className="flex-grow bg-parchment-dark border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" 
              placeholder="Describe what you want to do..."
              value={customAction}
              onChange={(e) => setCustomAction(e.target.value)}
              disabled={isGenerating || advanceStory.isPending}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isGenerating && !advanceStory.isPending) {
                  handleCustomAction();
                }
              }}
            />
            <Button 
              className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition"
              onClick={handleCustomAction}
              disabled={isGenerating || advanceStory.isPending}
            >
              {isGenerating || advanceStory.isPending ? "Generating..." : "Submit"}
            </Button>
          </div>
        </div>
        
        {/* AI Storyteller Tools */}
        <div className="bg-secondary-light text-white rounded-lg p-4">
          <h4 className="font-fantasy text-lg font-bold mb-3">AI Storyteller Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Narrative Style</label>
              <Select 
                value={narrativeStyle} 
                onValueChange={setNarrativeStyle}
                disabled={isGenerating || advanceStory.isPending}
              >
                <SelectTrigger className="w-full bg-secondary border border-gray-700 rounded-lg">
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Descriptive">Descriptive</SelectItem>
                  <SelectItem value="Dramatic">Dramatic</SelectItem>
                  <SelectItem value="Humorous">Humorous</SelectItem>
                  <SelectItem value="Dark & Gritty">Dark & Gritty</SelectItem>
                  <SelectItem value="Heroic Fantasy">Heroic Fantasy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Campaign Difficulty</label>
              <div className="w-full bg-secondary border border-gray-700 rounded-lg px-3 py-2">
                {campaign.difficulty}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Story Direction</label>
              <div className="flex space-x-2">
                <Button 
                  className={`${storyDirection === 'combat' ? 'bg-primary' : 'bg-primary-light'} hover:bg-primary text-white px-3 py-1 rounded-lg text-sm transition flex-grow`}
                  onClick={() => setStoryDirection('combat')}
                  disabled={isGenerating || advanceStory.isPending}
                >
                  More Combat
                </Button>
                <Button 
                  className={`${storyDirection === 'puzzles' ? 'bg-primary' : 'bg-primary-light'} hover:bg-primary text-white px-3 py-1 rounded-lg text-sm transition flex-grow`}
                  onClick={() => setStoryDirection('puzzles')}
                  disabled={isGenerating || advanceStory.isPending}
                >
                  More Puzzles
                </Button>
                <Button 
                  className={`${storyDirection === 'roleplay' ? 'bg-primary' : 'bg-primary-light'} hover:bg-primary text-white px-3 py-1 rounded-lg text-sm transition flex-grow`}
                  onClick={() => setStoryDirection('roleplay')}
                  disabled={isGenerating || advanceStory.isPending}
                >
                  More Roleplay
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
