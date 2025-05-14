import { useState } from "react";
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
import { Search, Sparkle, ArrowRight, Settings, Save } from "lucide-react";

interface CampaignPanelProps {
  campaign: Campaign;
}

export default function CampaignPanel({ campaign }: CampaignPanelProps) {
  const [customAction, setCustomAction] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [narrativeStyle, setNarrativeStyle] = useState(campaign.narrativeStyle);
  const [storyDirection, setStoryDirection] = useState("balanced");
  
  const { toast } = useToast();
  
  const { data: currentSession, isLoading: isLoadingSession } = useQuery<CampaignSession>({
    queryKey: ['/api/campaigns', campaign.id, 'sessions', campaign.currentSession],
  });

  const advanceStory = useMutation({
    mutationFn: async (action: string) => {
      const storyRequest: StoryRequest = {
        campaignId: campaign.id,
        prompt: action,
        narrativeStyle,
        difficulty: campaign.difficulty,
        storyDirection,
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
  const defaultNarrative = "You are about to embark on a grand adventure. What would you like to do?";
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
      
      <div className="p-6 bg-parchment character-sheet">
        <div className="flex justify-between items-end mb-2">
          <div>
            <h3 className="font-fantasy text-2xl font-bold text-primary">{campaign.title}</h3>
            <p className="text-sm text-gray-600 mb-4">
              Session {campaign.currentSession} - {currentSession?.title || "The Beginning"}
            </p>
          </div>
        </div>
        
        {/* Narrative Content */}
        {isLoadingSession ? (
          <div className="bg-parchment-dark border border-gray-300 rounded-lg p-4 mb-6 h-60">
            <Skeleton className="h-full w-full" />
          </div>
        ) : (
          <div className="bg-parchment-dark border border-gray-300 rounded-lg p-4 mb-6 max-h-80 overflow-y-auto scroll-container text-secondary">
            <p className="mb-3 whitespace-pre-line">
              {currentSession?.narrative || defaultNarrative}
            </p>
            
            <p className="font-bold">What do you do?</p>
          </div>
        )}
        
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
