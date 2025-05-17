import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Campaign, insertCampaignSchema } from "@shared/schema";
import { queryClient, apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CampaignPanel from "@/components/campaign/CampaignPanel";
import { AlertCircle, Book, Plus, Scroll, Wand2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

// Extended schema with validation rules
const createCampaignSchema = insertCampaignSchema.extend({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  difficulty: z.string().min(1, "Please select a difficulty"),
  narrativeStyle: z.string().min(1, "Please select a narrative style"),
});

// For AI campaign generation request
interface GenerateCampaignRequest {
  theme?: string;
  difficulty?: string;
  narrativeStyle?: string;
  numberOfSessions?: number;
}

type FormValues = z.infer<typeof createCampaignSchema>;

const difficulties = [
  "Easy - Beginner Friendly",
  "Normal - Balanced Challenge",
  "Hard - Deadly Encounters"
];

const narrativeStyles = [
  "Descriptive",
  "Dramatic",
  "Humorous",
  "Dark & Gritty",
  "Heroic Fantasy",
  "Mystery"
];

export default function Campaigns() {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [useAIGeneration, setUseAIGeneration] = useState(false);
  const [generatingCampaign, setGeneratingCampaign] = useState(false);
  const [campaignTheme, setCampaignTheme] = useState("");
  
  const { toast } = useToast();
  
  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ['/api/campaigns'],
    queryFn: getQueryFn({ on401: "throw" })
  });

  const { data: characters } = useQuery({
    queryKey: ['/api/characters'],
    queryFn: getQueryFn({ on401: "throw" })
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: {
      userId: 1, // Default to first user for demo
      title: "",
      description: "",
      difficulty: "",
      narrativeStyle: "",
      currentSession: 1,
      characters: [],
      createdAt: new Date().toISOString(),
    },
  });
  
  // Helper function to calculate default session count based on difficulty
  const calculateDefaultSessionCount = (difficulty: string): number => {
    if (difficulty.includes("Easy")) {
      return 20;
    } else if (difficulty.includes("Hard")) {
      return 50;
    } else {
      return 35; // Normal difficulty
    }
  };

  const generateAICampaign = async () => {
    try {
      setGeneratingCampaign(true);
      
      // Make sure we have the required difficulty and narrative style
      const difficulty = form.getValues().difficulty;
      const narrativeStyle = form.getValues().narrativeStyle;
      
      // If difficulty or narrative style aren't selected, set some defaults
      const campaignDifficulty = difficulty || "Normal - Balanced Challenge";
      const campaignNarrativeStyle = narrativeStyle || "Descriptive";
      
      // If they're not set, update the form
      if (!difficulty) {
        form.setValue("difficulty", campaignDifficulty);
      }
      
      if (!narrativeStyle) {
        form.setValue("narrativeStyle", campaignNarrativeStyle);
      }
      
      // Use direct fetch to have more control over the request
      const response = await fetch('/api/campaigns/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theme: campaignTheme || "Fantasy Adventure",
          difficulty: campaignDifficulty,
          narrativeStyle: campaignNarrativeStyle,
          numberOfSessions: calculateDefaultSessionCount(campaignDifficulty)
        }),
        credentials: 'include'
      });
      
      // Read the response text
      const responseText = await response.text();
      
      // Handle non-successful responses
      if (!response.ok) {
        let errorMessage = `Failed to generate campaign: ${response.status} ${response.statusText}`;
        try {
          // Try to parse as JSON if possible
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If it's not valid JSON, use the raw response text
          if (responseText) {
            errorMessage = responseText.substring(0, 100);
          }
        }
        throw new Error(errorMessage);
      }
      
      // Parse the response text, but handle potential parsing errors
      let generatedCampaign;
      try {
        generatedCampaign = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse campaign generation response as JSON:", parseError);
        
        // Use a default campaign if parsing fails
        generatedCampaign = {
          title: campaignTheme || "New Adventure",
          description: "A fantastic journey awaits brave adventurers willing to face the unknown.",
          difficulty: campaignDifficulty,
          narrativeStyle: campaignNarrativeStyle,
          startingLocation: "A small village on the edge of a mysterious forest",
          suggestedLevel: 1
        };
        
        toast({
          title: "Campaign Partially Generated",
          description: "There was an issue with the AI response, but we've created a basic campaign outline for you.",
        });
      }
      
      console.log("Generated campaign:", generatedCampaign);
      
      // Update the form with the generated campaign details (with fallbacks)
      form.setValue("title", generatedCampaign.title || campaignTheme || "New Adventure");
      form.setValue("description", generatedCampaign.description || "A fantastic journey awaits brave adventurers.");
      form.setValue("difficulty", generatedCampaign.difficulty || campaignDifficulty);
      form.setValue("narrativeStyle", generatedCampaign.narrativeStyle || campaignNarrativeStyle);
      
      // Set a default session count based on difficulty
      form.setValue("totalSessions", calculateDefaultSessionCount(generatedCampaign.difficulty || campaignDifficulty));
      
      toast({
        title: "Campaign Generated",
        description: "AI has created a new campaign concept! Review and submit to create it.",
      });
    } catch (error) {
      console.error("Error generating campaign:", error);
      toast({
        title: "Failed to Generate Campaign",
        description: error instanceof Error ? error.message : "An error occurred while generating the campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingCampaign(false);
    }
  };

  const createCampaign = useMutation({
    mutationFn: async (data: FormValues) => {
      // Enhanced campaign data with story arc progression
      const enhancedData = {
        ...data,
        // Make sure we have a valid total session count with defaults based on difficulty
        totalSessions: data.totalSessions || calculateDefaultSessionCount(data.difficulty || "Normal - Balanced Challenge"),
        // Default XP rewards scaling based on difficulty and total sessions
        xpReward: data.difficulty === "Hard - Significant Challenge" ? 250 : 
                 data.difficulty === "Easy - Lighter Challenge" ? 100 : 150,
        // Define story arc milestones for campaign progression
        storyArcs: [
          { milestone: 0.25, description: "Introduction arc completed", xpBonus: 200 },
          { milestone: 0.5, description: "Mid-campaign conflict escalation", xpBonus: 300 },
          { milestone: 0.75, description: "Final challenge approaches", xpBonus: 400 },
          { milestone: 1.0, description: "Campaign conclusion", xpBonus: 500 }
        ]
      };
      
      console.log("Creating enhanced campaign:", enhancedData);
      
      const response = await apiRequest("POST", "/api/campaigns", enhancedData);
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Campaign created successfully:", data);
      
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      toast({
        title: "Campaign Created",
        description: "Your campaign has been successfully created with a complete story arc and rewards system.",
      });
      form.reset();
      setUseAIGeneration(false);
      setCampaignTheme("");
    },
    onError: (error) => {
      console.error("Error creating campaign:", error);
      
      toast({
        title: "Error",
        description: "Failed to create campaign. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-fantasy font-bold mb-6">Campaign Management</h1>
      
      <Tabs defaultValue="list">
        <TabsList className="mb-6">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Book size={16} />
            My Campaigns
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus size={16} />
            Create New
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="list">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : campaigns && campaigns.length > 0 ? (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {campaigns.map((campaign) => (
                  <Card 
                    key={campaign.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedCampaign(campaign)}
                  >
                    <CardHeader className="bg-primary text-white pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="font-fantasy">{campaign.title}</CardTitle>
                        <span className="bg-primary-light text-white text-sm px-3 py-1 rounded-full">
                          Session {campaign.currentSession}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 bg-parchment character-sheet">
                      <p className="text-secondary mb-4">{campaign.description}</p>
                      
                      <div className="flex justify-between text-sm text-gray-600">
                        <div className="flex items-center">
                          <Scroll size={16} className="text-primary-light mr-1" />
                          <span>{campaign.narrativeStyle}</span>
                        </div>
                        <span>{campaign.difficulty}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {selectedCampaign && (
                <div className="mt-4">
                  <div className="flex justify-end mb-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedCampaign(null)}
                      className="text-sm"
                    >
                      Back to Campaign List
                    </Button>
                  </div>
                  <div className="h-[80vh] overflow-hidden">
                    <CampaignPanel campaign={selectedCampaign} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-secondary-light rounded-lg">
              <AlertCircle className="h-12 w-12 text-primary-light mx-auto mb-4" />
              <h3 className="text-xl font-fantasy font-bold mb-2">No Campaigns Found</h3>
              <p className="text-muted-foreground mb-6">You haven't created any campaigns yet.</p>
              <Button onClick={() => document.querySelector('[value="create"]')?.dispatchEvent(new Event('click'))}>
                Create Your First Campaign
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle className="font-fantasy">Create New Campaign</CardTitle>
              <CardDescription>
                Start a new adventure with AI-powered storytelling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <div className="mb-6 pb-4 border-b border-gray-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <FormLabel className="text-lg font-semibold !m-0">AI-Assisted Campaign Generation</FormLabel>
                    <Switch
                      checked={useAIGeneration}
                      onCheckedChange={setUseAIGeneration}
                      aria-label="Use AI to generate campaign"
                    />
                  </div>
                  
                  {useAIGeneration && (
                    <div className="bg-secondary-light p-4 rounded-lg mb-4 space-y-4">
                      <div className="flex items-center space-x-2">
                        <Wand2 className="h-5 w-5 text-primary-light" />
                        <p className="text-sm text-gray-700">
                          Let AI create a complete campaign concept for you. Provide an optional theme below.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="campaignTheme" className="text-sm font-medium">
                          Campaign Theme (Optional)
                        </label>
                        <Input
                          id="campaignTheme"
                          placeholder="e.g., Dragon hunt, Ancient ruins, Undead threat"
                          value={campaignTheme}
                          onChange={(e) => setCampaignTheme(e.target.value)}
                        />
                        <p className="text-xs text-gray-500">
                          First select difficulty and narrative style below, then click the 'Generate Campaign' button
                        </p>
                      </div>
                      
                      <Button 
                        type="button"
                        variant="outline"
                        className="w-full border-primary-light text-primary-light hover:bg-primary-light hover:text-white"
                        onClick={generateAICampaign}
                        disabled={generatingCampaign}
                      >
                        {generatingCampaign ? (
                          <>
                            <span className="animate-spin mr-2">⟳</span>
                            Generating Campaign...
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-4 w-4 mr-2" />
                            Generate Campaign
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
                
                <form onSubmit={form.handleSubmit((data) => createCampaign.mutate(data))} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter a memorable title" {...field} />
                        </FormControl>
                        <FormDescription>
                          This will be the name of your adventure
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your campaign setting and premise" 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          This will help the AI understand the type of adventure you want
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Difficulty</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select difficulty" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {difficulties.map(difficulty => (
                                <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="narrativeStyle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Narrative Style</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select style" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {narrativeStyles.map(style => (
                                <SelectItem key={style} value={style}>{style}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="characters"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Characters</FormLabel>
                        <div className="bg-parchment rounded-lg p-4 character-sheet">
                          {characters && characters.length > 0 ? (
                            <div className="space-y-2">
                              {characters.map((character) => (
                                <div key={character.id} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`character-${character.id}`}
                                    value={character.id}
                                    checked={field.value.includes(character.id)}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      const characterId = Number(e.target.value);
                                      if (checked) {
                                        field.onChange([...field.value, characterId]);
                                      } else {
                                        field.onChange(field.value.filter(id => id !== characterId));
                                      }
                                    }}
                                    className="rounded border-gray-400 text-primary focus:ring-primary-light"
                                  />
                                  <label
                                    htmlFor={`character-${character.id}`}
                                    className="text-secondary flex-1 cursor-pointer"
                                  >
                                    {character.name} - Level {character.level} {character.race} {character.class}
                                  </label>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-secondary mb-2">No characters available</p>
                              <p className="text-sm text-gray-600">
                                Create characters first before starting a campaign
                              </p>
                            </div>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-primary-light hover:bg-primary-dark"
                    disabled={createCampaign.isPending || !characters || characters.length === 0}
                  >
                    {createCampaign.isPending ? "Creating..." : "Create Campaign"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
