import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Campaign, insertCampaignSchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
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
import { AlertCircle, Book, Plus, Scroll } from "lucide-react";

// Extended schema with validation rules
const createCampaignSchema = insertCampaignSchema.extend({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  difficulty: z.string().min(1, "Please select a difficulty"),
  narrativeStyle: z.string().min(1, "Please select a narrative style"),
});

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

  const createCampaign = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest("POST", "/api/campaigns", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      toast({
        title: "Campaign Created",
        description: "Your campaign has been successfully created.",
      });
      form.reset();
    },
    onError: (error) => {
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
