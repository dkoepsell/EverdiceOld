import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, BookOpen, Castle, Compass, Dice5, FileText, Flare, ListChecks, MoreHorizontal, Plus, Save, Scroll, Shield, Skull, Swords, User, Wand2 } from "lucide-react";

// Import zod and form components for form validation
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Define component for the main DM Toolkit page
export default function DMToolkit() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("adventure-templates");

  if (authLoading) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin mb-4 h-8 w-8 text-primary mx-auto">
            <Dice5 size={32} />
          </div>
          <p>Loading DM Toolkit...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <Shield className="h-12 w-12 text-primary-light mx-auto mb-4" />
          <h1 className="text-2xl font-fantasy font-bold mb-2">DM Access Required</h1>
          <p className="mb-6 text-muted-foreground">
            Please log in to access the Dungeon Master toolkit.
          </p>
          <Button asChild>
            <a href="/auth">Login or Register</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-fantasy font-bold">Dungeon Master Toolkit</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your adventures with powerful tools and templates
          </p>
        </div>
        <div className="flex mt-4 md:mt-0">
          <Button variant="outline" className="mr-2" asChild>
            <a href="/dnd-guide">
              <BookOpen size={16} className="mr-2" />
              D&D Guide
            </a>
          </Button>
          <Button>
            <Plus size={16} className="mr-2" />
            New Adventure
          </Button>
        </div>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="mb-8 flex flex-wrap">
          <TabsTrigger value="adventure-templates" className="flex items-center gap-2">
            <Scroll size={16} />
            Adventure Templates
          </TabsTrigger>
          <TabsTrigger value="encounters" className="flex items-center gap-2">
            <Swords size={16} />
            Encounter Builder
          </TabsTrigger>
          <TabsTrigger value="npcs" className="flex items-center gap-2">
            <User size={16} />
            NPCs
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2">
            <Compass size={16} />
            Locations
          </TabsTrigger>
          <TabsTrigger value="items" className="flex items-center gap-2">
            <Shield size={16} />
            Magic Items
          </TabsTrigger>
          <TabsTrigger value="quests" className="flex items-center gap-2">
            <ListChecks size={16} />
            Quests
          </TabsTrigger>
          <TabsTrigger value="learning" className="flex items-center gap-2">
            <BookOpen size={16} />
            Teaching Tools
          </TabsTrigger>
        </TabsList>

        <TabsContent value="adventure-templates" className="space-y-4">
          <AdventureTemplatesTab />
        </TabsContent>

        <TabsContent value="encounters" className="space-y-4">
          <EncounterBuilderTab />
        </TabsContent>

        <TabsContent value="npcs" className="space-y-4">
          <NPCsTab />
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <LocationsTab />
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <ItemsTab />
        </TabsContent>

        <TabsContent value="quests" className="space-y-4">
          <QuestsTab />
        </TabsContent>

        <TabsContent value="learning" className="space-y-4">
          <LearningToolsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Component for Adventure Templates tab
function AdventureTemplatesTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);

  // Mock templates for UI development - would be replaced by actual API call
  const templates = [
    {
      id: 1,
      title: "The Lost Mines of Phandelver",
      description: "A starter adventure for new players and DMs, featuring a mix of exploration, social interaction, and combat.",
      difficultyRange: "Easy to Medium",
      recommendedLevels: "1-5",
      tags: ["Beginner Friendly", "Exploration", "Dungeons"],
      isPublic: true,
      createdBy: user?.id || 1,
    },
    {
      id: 2,
      title: "Curse of Strahd",
      description: "A gothic horror adventure set in the misty realm of Barovia, ruled by the vampire Count Strahd von Zarovich.",
      difficultyRange: "Medium to Hard",
      recommendedLevels: "3-10",
      tags: ["Horror", "Roleplay Heavy", "Open World"],
      isPublic: true,
      createdBy: user?.id || 1,
    },
    {
      id: 3,
      title: "Tomb of Annihilation",
      description: "A deadly jungle expedition to find the source of a death curse affecting the world.",
      difficultyRange: "Hard",
      recommendedLevels: "5-10",
      tags: ["Hexcrawl", "Deadly", "Puzzles"],
      isPublic: true,
      createdBy: 2,
    },
  ];

  const handleCreateTemplate = (templateData) => {
    // This would be an API call in the finished product
    console.log("Creating new template:", templateData);
    toast({
      title: "Template Created",
      description: "Your adventure template has been saved successfully.",
    });
    setShowNewTemplateForm(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-fantasy font-semibold">Adventure Templates</h2>
        <Button onClick={() => setShowNewTemplateForm(true)}>
          <Plus size={16} className="mr-2" />
          Create Template
        </Button>
      </div>

      {showNewTemplateForm ? (
        <NewAdventureTemplateForm 
          onSave={handleCreateTemplate}
          onCancel={() => setShowNewTemplateForm(false)}
        />
      ) : selectedTemplate ? (
        <AdventureTemplateDetail 
          template={selectedTemplate}
          onBack={() => setSelectedTemplate(null)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card 
              key={template.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedTemplate(template)}
            >
              <CardHeader className="bg-primary/10 pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="font-fantasy">{template.title}</CardTitle>
                  <Badge variant="outline" className="bg-primary/20">
                    {template.difficultyRange}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  {template.description.length > 120
                    ? template.description.substring(0, 120) + "..."
                    : template.description}
                </p>
                <div className="flex justify-between text-sm">
                  <div>
                    <p className="text-muted-foreground">
                      Levels: {template.recommendedLevels}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{template.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* D&D Instruction Component: Adventure Structure Tips */}
      <Card className="mt-8 border-primary/20 bg-secondary/10">
        <CardHeader>
          <CardTitle className="flex items-center text-primary">
            <BookOpen className="mr-2 h-5 w-5" />
            DM Tip: Adventure Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>
              <strong>Adventure Structure:</strong> A well-designed adventure typically has three main components:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Beginning:</strong> Introduction, hooks, and initial challenges that draw players in.</li>
              <li><strong>Middle:</strong> Main conflicts, exploration, and discoveries that form the core experience.</li>
              <li><strong>End:</strong> Climactic encounters and resolutions that provide a satisfying conclusion.</li>
            </ul>
            <p className="mt-2">
              <strong>Player Agency:</strong> Always include multiple paths and solutions to challenges, allowing players to use their creativity.
            </p>
          </div>
        </CardContent>
        <CardFooter className="bg-secondary/5 border-t border-primary/10">
          <Button variant="link" className="text-primary p-0" asChild>
            <a href="/dnd-guide?section=dm-basics">Learn more about adventure design</a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Component for creating a new adventure template
function NewAdventureTemplateForm({ onSave, onCancel }) {
  const { user } = useAuth();

  // Define form schema with zod
  const formSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    difficultyRange: z.string().min(1, "Please select a difficulty range"),
    recommendedLevels: z.string().min(1, "Please specify recommended levels"),
    isPublic: z.boolean().default(true),
    tags: z.array(z.string()).optional(),
  });

  // Define form with react-hook-form and zod resolver
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      difficultyRange: "",
      recommendedLevels: "",
      isPublic: true,
      tags: [],
    },
  });

  // Handle form submission
  const onSubmit = (data) => {
    // Add createdBy and createdAt
    const templateData = {
      ...data,
      createdBy: user?.id || 1,
      createdAt: new Date().toISOString(),
    };
    
    onSave(templateData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-fantasy">Create New Adventure Template</CardTitle>
        <CardDescription>
          Design an adventure framework that you can reuse or share with other DMs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adventure Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter a title for your adventure" {...field} />
                  </FormControl>
                  <FormDescription>
                    Choose an evocative title that captures the theme
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
                      placeholder="Describe your adventure's premise, setting, and key themes" 
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    This helps other DMs understand what your adventure is about
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="difficultyRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty Range</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Easy">Easy</SelectItem>
                        <SelectItem value="Easy to Medium">Easy to Medium</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Medium to Hard">Medium to Hard</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                        <SelectItem value="Very Hard">Very Hard</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How challenging is this adventure for players?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="recommendedLevels"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recommended Levels</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level range" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1-4">Levels 1-4 (Tier 1)</SelectItem>
                        <SelectItem value="5-10">Levels 5-10 (Tier 2)</SelectItem>
                        <SelectItem value="11-16">Levels 11-16 (Tier 3)</SelectItem>
                        <SelectItem value="17-20">Levels 17-20 (Tier 4)</SelectItem>
                        <SelectItem value="1-10">Levels 1-10</SelectItem>
                        <SelectItem value="1-20">All Levels (1-20)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      What character levels is this adventure designed for?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Make Public</FormLabel>
                    <FormDescription>
                      Allow other DMs to see and use your adventure template
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-4 pt-4">
              <Button variant="outline" type="button" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Save Template
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// Component for viewing adventure template details
function AdventureTemplateDetail({ template, onBack }) {
  const [showDeployDialog, setShowDeployDialog] = useState(false);
  const { toast } = useToast();
  
  const handleDeployCampaign = () => {
    // This would be an API call in the full implementation
    toast({
      title: "Campaign Created",
      description: `Your adventure "${template.title}" has been deployed as a campaign.`,
    });
    setShowDeployDialog(false);
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" onClick={onBack}>
          Back to Templates
        </Button>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setShowDeployDialog(true)}>
            <Wand2 className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </div>
      </div>
      
      <Dialog open={showDeployDialog} onOpenChange={setShowDeployDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deploy Adventure Template</DialogTitle>
            <DialogDescription>
              Create a new campaign based on this adventure template. You'll be able to guide players through your custom adventure.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="font-medium">Adventure Template</h4>
              <div className="rounded-md bg-secondary/20 p-3">
                <div className="font-medium">{template.title}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {template.difficultyRange} • {template.recommendedLevels}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Campaign Type</h4>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-start space-x-3">
                  <div className="flex h-5 items-center">
                    <input
                      id="dm-guided"
                      type="radio"
                      name="campaign-type"
                      className="h-4 w-4 rounded-full"
                      defaultChecked
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="dm-guided" className="block text-sm font-medium">
                      DM-Guided Campaign
                    </label>
                    <p className="text-muted-foreground text-xs">
                      You'll direct the adventure as the DM, with control over the narrative and encounters.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex h-5 items-center">
                    <input
                      id="ai-assisted"
                      type="radio"
                      name="campaign-type"
                      className="h-4 w-4 rounded-full"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="ai-assisted" className="block text-sm font-medium">
                      AI-Assisted Campaign
                    </label>
                    <p className="text-muted-foreground text-xs">
                      The AI will help run the campaign based on your template, but you can intervene when needed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeployDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeployCampaign}>
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Card>
        <CardHeader className="bg-primary/10">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="font-fantasy text-2xl">{template.title}</CardTitle>
              <CardDescription className="mt-1">
                {template.tags.join(" • ")}
              </CardDescription>
            </div>
            <Badge className="text-sm">
              {template.difficultyRange}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6 pb-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="col-span-2">
              <h3 className="text-lg font-semibold mb-2">Adventure Overview</h3>
              <p className="text-muted-foreground">{template.description}</p>
            </div>
            <div className="bg-secondary/10 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recommended Levels:</span>
                  <span className="font-medium">{template.recommendedLevels}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Difficulty:</span>
                  <span className="font-medium">{template.difficultyRange}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Visibility:</span>
                  <span className="font-medium">{template.isPublic ? "Public" : "Private"}</span>
                </div>
              </div>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Adventure Structure</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Beginning</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Hook: The players discover an ancient map pointing to a forgotten temple.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Middle</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">The journey through dangerous wilderness and the initial exploration of the ruins.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Climax</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Final confrontation with the guardian of the temple and the discovery of its secrets.</p>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Key Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex">
                <div className="mr-3 text-primary">
                  <Compass size={20} />
                </div>
                <div>
                  <h4 className="font-medium">Exploration Focus</h4>
                  <p className="text-sm text-muted-foreground">Wilderness travel, dungeon delving, and discovery of secrets.</p>
                </div>
              </div>
              <div className="flex">
                <div className="mr-3 text-primary">
                  <Swords size={20} />
                </div>
                <div>
                  <h4 className="font-medium">Balanced Combat</h4>
                  <p className="text-sm text-muted-foreground">Mix of easy, medium, and hard encounters with varied enemies.</p>
                </div>
              </div>
              <div className="flex">
                <div className="mr-3 text-primary">
                  <User size={20} />
                </div>
                <div>
                  <h4 className="font-medium">NPC Interactions</h4>
                  <p className="text-sm text-muted-foreground">Several key NPCs who can become allies or adversaries.</p>
                </div>
              </div>
              <div className="flex">
                <div className="mr-3 text-primary">
                  <Shield size={20} />
                </div>
                <div>
                  <h4 className="font-medium">Rewarding Treasures</h4>
                  <p className="text-sm text-muted-foreground">Balanced treasure distribution including magical items.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mt-6 border-primary/20 bg-secondary/10">
        <CardHeader>
          <CardTitle className="flex items-center text-primary">
            <BookOpen className="mr-2 h-5 w-5" />
            DM Tip: Using This Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            This template can be customized to fit your world and players. Consider these tips:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Replace generic locations with specific places from your campaign world</li>
            <li>Adjust the difficulty of encounters based on your party's composition</li>
            <li>Add personal hooks tied to your characters' backstories</li>
            <li>Modify the treasure to suit your campaign's magic level</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// Component for Encounter Builder tab
function EncounterBuilderTab() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-fantasy font-semibold">Encounter Builder</h2>
        <Button>
          <Plus size={16} className="mr-2" />
          Create Encounter
        </Button>
      </div>
      
      {/* Placeholder content for Encounter Builder */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>New Encounter</CardTitle>
              <CardDescription>Build and balance combat encounters for your campaign</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="encounter-name">Encounter Name</Label>
                    <Input id="encounter-name" placeholder="Name your encounter" />
                  </div>
                  <div>
                    <Label htmlFor="environment">Environment</Label>
                    <Select>
                      <SelectTrigger id="environment">
                        <SelectValue placeholder="Select environment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="forest">Forest</SelectItem>
                        <SelectItem value="dungeon">Dungeon</SelectItem>
                        <SelectItem value="mountain">Mountain</SelectItem>
                        <SelectItem value="urban">Urban</SelectItem>
                        <SelectItem value="coastal">Coastal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="encounter-description">Description</Label>
                  <Textarea 
                    id="encounter-description" 
                    placeholder="Describe the encounter setup, area, and initial conditions"
                    rows={3}
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Monsters</Label>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Monster
                    </Button>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Monster</TableHead>
                        <TableHead>CR</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>XP</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Goblin</TableCell>
                        <TableCell>1/4</TableCell>
                        <TableCell>
                          <Input type="number" value="4" className="w-16" />
                        </TableCell>
                        <TableCell>200 XP</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Hobgoblin</TableCell>
                        <TableCell>1/2</TableCell>
                        <TableCell>
                          <Input type="number" value="2" className="w-16" />
                        </TableCell>
                        <TableCell>200 XP</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Bugbear</TableCell>
                        <TableCell>1</TableCell>
                        <TableCell>
                          <Input type="number" value="1" className="w-16" />
                        </TableCell>
                        <TableCell>200 XP</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline">Cancel</Button>
                  <Button>Save Encounter</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Encounter Difficulty</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Party Information</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span>Party Size:</span>
                      <span className="font-medium">4 players</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Level:</span>
                      <span className="font-medium">3</span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <Label>Encounter Analysis</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span>Total XP:</span>
                      <span className="font-medium">600 XP</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Adjusted XP:</span>
                      <span className="font-medium">900 XP</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Difficulty:</span>
                      <Badge className="bg-yellow-500/80">Medium</Badge>
                    </div>
                  </div>
                </div>
                
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader className="py-2 px-4">
                    <CardTitle className="text-sm font-medium">Difficulty Thresholds</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-4">
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>Easy:</span>
                        <span className="font-medium">300 XP</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Medium:</span>
                        <span className="font-medium">600 XP</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hard:</span>
                        <span className="font-medium">900 XP</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Deadly:</span>
                        <span className="font-medium">1,400 XP</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-4 border-primary/20 bg-secondary/10">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-primary text-sm">
                <BookOpen className="mr-2 h-4 w-4" />
                D&D Tip: Challenge Rating
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p>
                Challenge Rating (CR) represents how difficult a monster is for a party to defeat. 
                A party of 4 adventurers should find a monster with a CR equal to their level to be 
                a fair challenge.
              </p>
              <p className="mt-2">
                Remember that multiple monsters increase the difficulty significantly due to the 
                action economy advantage!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Components for other tabs (placeholders)
function NPCsTab() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [npcs, setNpcs] = useState([
    {
      id: 1,
      name: "Garrick Stormborn",
      race: "Human",
      occupation: "Tavern Owner",
      personality: "Boisterous and friendly, but harbors a dark secret",
      appearance: "Burly with a thick red beard, missing two fingers on his left hand",
      motivation: "To protect his family from his former criminal associates",
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      name: "Elyndra Moonshadow",
      race: "Elf",
      occupation: "Royal Advisor",
      personality: "Calculating, patient, and mysterious",
      appearance: "Silver hair, violet eyes, always dressed in midnight blue robes",
      motivation: "To restore her exiled family's honor and position",
      createdAt: new Date().toISOString()
    }
  ]);
  const [selectedNpc, setSelectedNpc] = useState(null);
  
  const handleCreateNpc = (npcData) => {
    const newNpc = {
      id: npcs.length + 1,
      ...npcData,
      createdAt: new Date().toISOString()
    };
    setNpcs([...npcs, newNpc]);
    setShowCreateForm(false);
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-fantasy font-semibold">NPC Creator</h2>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus size={16} className="mr-2" />
          Create NPC
        </Button>
      </div>
      
      {showCreateForm ? (
        <CreateNpcForm onSave={handleCreateNpc} onCancel={() => setShowCreateForm(false)} />
      ) : selectedNpc ? (
        <NpcDetail npc={selectedNpc} onBack={() => setSelectedNpc(null)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {npcs.map((npc) => (
            <Card 
              key={npc.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedNpc(npc)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="font-fantasy">{npc.name}</CardTitle>
                  <Badge variant="outline">{npc.race}</Badge>
                </div>
                <CardDescription>{npc.occupation}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm mb-3">
                  {npc.personality.length > 100
                    ? npc.personality.substring(0, 100) + "..."
                    : npc.personality}
                </p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <User className="h-3 w-3 mr-1" />
                  <span>Created {new Date(npc.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* D&D Instruction Component */}
      <Card className="mt-8 border-primary/20 bg-secondary/10">
        <CardHeader>
          <CardTitle className="flex items-center text-primary">
            <BookOpen className="mr-2 h-5 w-5" />
            DM Tip: Creating Memorable NPCs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Great NPCs have three key aspects:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Distinctive Feature:</strong> A physical trait, speech pattern, or mannerism that makes them instantly recognizable.</li>
            <li><strong>Clear Motivation:</strong> What drives this character? What do they want?</li>
            <li><strong>Connection to the World:</strong> How do they relate to the setting, the plot, or the player characters?</li>
          </ul>
          <p className="mt-2">
            Remember, NPCs exist to enhance the players' experience - make them memorable but don't let them steal the spotlight!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function CreateNpcForm({ onSave, onCancel }) {
  const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    race: z.string().min(1, "Please select a race"),
    occupation: z.string().min(1, "Occupation is required"),
    personality: z.string().min(10, "Personality must be at least 10 characters"),
    appearance: z.string().min(10, "Appearance must be at least 10 characters"),
    motivation: z.string().min(10, "Motivation must be at least 10 characters"),
    notes: z.string().optional(),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      race: "",
      occupation: "",
      personality: "",
      appearance: "",
      motivation: "",
      notes: "",
    },
  });

  const onSubmit = (data) => {
    onSave(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-fantasy">Create New NPC</CardTitle>
        <CardDescription>
          Design a non-player character for your campaign
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="NPC name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="race"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Race</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select race" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Human">Human</SelectItem>
                        <SelectItem value="Elf">Elf</SelectItem>
                        <SelectItem value="Dwarf">Dwarf</SelectItem>
                        <SelectItem value="Halfling">Halfling</SelectItem>
                        <SelectItem value="Gnome">Gnome</SelectItem>
                        <SelectItem value="Half-Elf">Half-Elf</SelectItem>
                        <SelectItem value="Half-Orc">Half-Orc</SelectItem>
                        <SelectItem value="Tiefling">Tiefling</SelectItem>
                        <SelectItem value="Dragonborn">Dragonborn</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="occupation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Occupation or Role</FormLabel>
                  <FormControl>
                    <Input placeholder="Merchant, Guard Captain, Court Wizard, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="personality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personality</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe this NPC's personality traits, quirks, and mannerisms" 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="appearance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Appearance</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe this NPC's physical appearance, clothing, and distinctive features" 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="motivation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivation</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What drives this NPC? What are their goals and desires?" 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes <span className="text-muted-foreground">(Optional)</span></FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional details, plot hooks, or secrets" 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">
                Save NPC
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function NpcDetail({ npc, onBack }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" onClick={onBack}>
          Back to NPCs
        </Button>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add to Campaign
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="bg-primary/10">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="font-fantasy text-2xl">{npc.name}</CardTitle>
              <CardDescription className="mt-1">
                {npc.race} • {npc.occupation}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Appearance</h3>
              <p className="text-muted-foreground">{npc.appearance}</p>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-2">Personality</h3>
              <p className="text-muted-foreground">{npc.personality}</p>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-2">Motivation</h3>
              <p className="text-muted-foreground">{npc.motivation}</p>
            </div>
            
            {npc.notes && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-medium mb-2">Additional Notes</h3>
                  <p className="text-muted-foreground">{npc.notes}</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="bg-secondary/5 border-t border-primary/10 flex justify-between">
          <div className="text-xs text-muted-foreground">
            Created on {new Date(npc.createdAt).toLocaleDateString()}
          </div>
          <Button variant="outline" size="sm">
            <Wand2 className="mr-2 h-3 w-3" />
            Generate Portrait
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function LocationsTab() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [locations, setLocations] = useState([
    {
      id: 1,
      name: "The Rusty Anchor Tavern",
      type: "Tavern",
      description: "A dimly lit dockside tavern with saltwater-stained wooden walls covered in fishing nets, harpoons, and other nautical curiosities. The air is thick with the smell of ale, pipe smoke, and salt.",
      features: "Hidden back room for secret meetings, Nautical artifacts, Private booths for discreet conversations, Rowdy bar games",
      inhabitants: "Ellicott (Gruff Dwarven barkeeper), Sailors from various ports, Local fishermen, Occasional mercenaries",
      secrets: "The basement contains a smuggler's tunnel that leads to a hidden cove outside town.",
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      name: "Crystalspire Tower",
      type: "Wizard Tower",
      description: "A slender tower of blue-white crystal that seems to glow from within, especially under moonlight. The structure defies conventional architecture, with sections that appear to float and spiral staircases that wrap around the outside.",
      features: "Observatory at the top, Magical library, Animated servants, Teleportation circles",
      inhabitants: "Archmage Valerian, Various apprentices, Bound elemental servants, Magical constructs",
      secrets: "The tower exists simultaneously in multiple planes of existence, and certain rooms can only be accessed under specific planar alignments.",
      createdAt: new Date().toISOString()
    }
  ]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  const handleCreateLocation = (locationData) => {
    const newLocation = {
      id: locations.length + 1,
      ...locationData,
      createdAt: new Date().toISOString()
    };
    setLocations([...locations, newLocation]);
    setShowCreateForm(false);
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-fantasy font-semibold">Locations</h2>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus size={16} className="mr-2" />
          Create Location
        </Button>
      </div>
      
      {showCreateForm ? (
        <CreateLocationForm onSave={handleCreateLocation} onCancel={() => setShowCreateForm(false)} />
      ) : selectedLocation ? (
        <LocationDetail location={selectedLocation} onBack={() => setSelectedLocation(null)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((location) => (
            <Card 
              key={location.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedLocation(location)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="font-fantasy">{location.name}</CardTitle>
                  <Badge variant="outline">{location.type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm mb-3">
                  {location.description.length > 100
                    ? location.description.substring(0, 100) + "..."
                    : location.description}
                </p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Castle className="h-3 w-3 mr-1" />
                  <span>Created {new Date(location.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* D&D Instruction Component */}
      <Card className="mt-8 border-primary/20 bg-secondary/10">
        <CardHeader>
          <CardTitle className="flex items-center text-primary">
            <BookOpen className="mr-2 h-5 w-5" />
            DM Tip: Creating Memorable Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Great locations bring your world to life and provide interesting settings for adventures:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Appeal to the Senses:</strong> Describe what players see, hear, smell, and feel when they enter a location.</li>
            <li><strong>Include Interesting NPCs:</strong> The inhabitants of a location often define its character.</li>
            <li><strong>Add Interactive Elements:</strong> Give players things they can engage with—switches, levers, items to examine.</li>
            <li><strong>Include Secrets:</strong> Hidden rooms, concealed passages, or buried history add depth to locations.</li>
          </ul>
          <p className="mt-2">
            A well-crafted location should serve a purpose in your campaign, whether as a hub for adventure, a source of information, or a dangerous challenge to overcome.
          </p>
        </CardContent>
        <CardFooter className="bg-secondary/5 border-t border-primary/10">
          <Button variant="link" className="text-primary p-0" asChild>
            <a href="/dnd-guide?section=adventuring">Learn more about creating locations</a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function CreateLocationForm({ onSave, onCancel }) {
  const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    type: z.string().min(1, "Please select a location type"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    features: z.string().min(5, "Features must be at least 5 characters"),
    inhabitants: z.string().optional(),
    secrets: z.string().optional(),
    notes: z.string().optional(),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "",
      description: "",
      features: "",
      inhabitants: "",
      secrets: "",
      notes: "",
    },
  });

  const onSubmit = (data) => {
    onSave(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-fantasy">Create New Location</CardTitle>
        <CardDescription>
          Design a location for your adventures
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Name</FormLabel>
                    <FormControl>
                      <Input placeholder="The name of your location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Tavern">Tavern or Inn</SelectItem>
                        <SelectItem value="Dungeon">Dungeon</SelectItem>
                        <SelectItem value="Town">Town or City</SelectItem>
                        <SelectItem value="Castle">Castle or Keep</SelectItem>
                        <SelectItem value="Temple">Temple or Shrine</SelectItem>
                        <SelectItem value="Forest">Forest or Wilderness</SelectItem>
                        <SelectItem value="Shop">Shop or Market</SelectItem>
                        <SelectItem value="Cave">Cave or Cavern</SelectItem>
                        <SelectItem value="Ruin">Ancient Ruins</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe what the location looks like, its atmosphere, and notable visual aspects" 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Focus on sensory details that make the location memorable
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="features"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notable Features</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="List significant features, structures, or objects in this location" 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Include elements players can interact with
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="inhabitants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inhabitants <span className="text-muted-foreground">(Optional)</span></FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe who or what lives in or frequents this location" 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="secrets"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secrets and Hidden Elements <span className="text-muted-foreground">(Optional)</span></FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Hidden passageways, concealed information, or mysterious aspects" 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes <span className="text-muted-foreground">(Optional)</span></FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional details or DM notes" 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">
                Save Location
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function LocationDetail({ location, onBack }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" onClick={onBack}>
          Back to Locations
        </Button>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add to Campaign
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="bg-primary/10">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="font-fantasy text-2xl">{location.name}</CardTitle>
              <CardDescription className="mt-1">
                {location.type}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Description</h3>
              <p className="text-muted-foreground">{location.description}</p>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-2">Notable Features</h3>
              <p className="text-muted-foreground">{location.features}</p>
            </div>
            
            {location.inhabitants && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-medium mb-2">Inhabitants</h3>
                  <p className="text-muted-foreground">{location.inhabitants}</p>
                </div>
              </>
            )}
            
            {location.secrets && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-medium mb-2">Secrets</h3>
                  <p className="text-muted-foreground">{location.secrets}</p>
                </div>
              </>
            )}
            
            {location.notes && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-medium mb-2">Additional Notes</h3>
                  <p className="text-muted-foreground">{location.notes}</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="bg-secondary/5 border-t border-primary/10 flex justify-between">
          <div className="text-xs text-muted-foreground">
            Created on {new Date(location.createdAt).toLocaleDateString()}
          </div>
          <Button variant="outline" size="sm">
            <Compass className="mr-2 h-3 w-3" />
            Generate Map
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function ItemsTab() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-fantasy font-semibold">Magic Items</h2>
        <Button>
          <Plus size={16} className="mr-2" />
          Create Magic Item
        </Button>
      </div>
      
      {/* Placeholder for Items tab */}
      <div className="bg-slate-100 rounded-lg p-8 text-center">
        <Shield className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Magic Item Creator Coming Soon</h3>
        <p className="text-muted-foreground">
          Create balanced and interesting magical items and treasures for your adventures.
        </p>
      </div>
    </div>
  );
}

function QuestsTab() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [quests, setQuests] = useState([
    {
      id: 1,
      title: "The Stolen Artifact",
      type: "Retrieval",
      difficultyLevel: "Medium",
      description: "A precious artifact has been stolen from the city museum by a notorious thieves' guild. The city watch has asked for help in retrieving it before it can be sold to a private collector.",
      objectives: "- Infiltrate the thieves' guild hideout\n- Recover the artifact without raising the alarm\n- Return the artifact to the museum curator",
      twists: "The artifact is cursed and has been slowly corrupting the guild leader's mind. The real threat is not the thieves but what the artifact might do if its power is unleashed.",
      rewards: "- 500 gold pieces\n- Reputation with the City Watch faction\n- A minor magical item from the museum's collection",
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      title: "The Haunted Lighthouse",
      type: "Investigation",
      difficultyLevel: "Hard",
      description: "Ships approaching the coastal town of Saltmarsh have been going missing. Locals blame the old lighthouse, which they say is haunted by vengeful spirits. The town council is offering a reward to anyone brave enough to investigate.",
      objectives: "- Investigate the lighthouse\n- Discover the cause of the hauntings\n- End the threat to the ships",
      twists: "The lighthouse isn't actually haunted—a group of wreckers are using illusion magic to lure ships onto the rocks. They've kidnapped the real lighthouse keeper and are holding them captive in a sea cave.",
      rewards: "- 800 gold pieces\n- Deed to a small property in Saltmarsh\n- A magical lantern that never runs out of oil",
      createdAt: new Date().toISOString()
    }
  ]);
  const [selectedQuest, setSelectedQuest] = useState(null);
  
  const handleCreateQuest = (questData) => {
    const newQuest = {
      id: quests.length + 1,
      ...questData,
      createdAt: new Date().toISOString()
    };
    setQuests([...quests, newQuest]);
    setShowCreateForm(false);
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-fantasy font-semibold">Quest Builder</h2>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus size={16} className="mr-2" />
          Create Quest
        </Button>
      </div>
      
      {showCreateForm ? (
        <CreateQuestForm onSave={handleCreateQuest} onCancel={() => setShowCreateForm(false)} />
      ) : selectedQuest ? (
        <QuestDetail quest={selectedQuest} onBack={() => setSelectedQuest(null)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quests.map((quest) => (
            <Card 
              key={quest.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedQuest(quest)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="font-fantasy">{quest.title}</CardTitle>
                  <Badge variant={quest.difficultyLevel === "Easy" ? "secondary" : 
                             quest.difficultyLevel === "Medium" ? "outline" : "destructive"}>
                    {quest.difficultyLevel}
                  </Badge>
                </div>
                <CardDescription>{quest.type}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm mb-3">
                  {quest.description.length > 100
                    ? quest.description.substring(0, 100) + "..."
                    : quest.description}
                </p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Scroll className="h-3 w-3 mr-1" />
                  <span>Created {new Date(quest.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* D&D Instruction Component */}
      <Card className="mt-8 border-primary/20 bg-secondary/10">
        <CardHeader>
          <CardTitle className="flex items-center text-primary">
            <BookOpen className="mr-2 h-5 w-5" />
            DM Tip: Quest Design
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Effective quests typically follow this structure:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Hook:</strong> What draws the players to the quest? Make it appealing or urgent.</li>
            <li><strong>Goal:</strong> What needs to be accomplished? Be clear but leave room for player creativity.</li>
            <li><strong>Complication:</strong> What unexpected twist makes the quest more interesting?</li>
            <li><strong>Resolution:</strong> How does success (or failure) impact the world and characters?</li>
          </ul>
          <p className="mt-2">
            The best quests offer multiple paths to success and meaningful choices with consequences.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function CreateQuestForm({ onSave, onCancel }) {
  const formSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    type: z.string().min(1, "Please select a quest type"),
    difficultyLevel: z.string().min(1, "Please select a difficulty level"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    objectives: z.string().min(10, "Objectives must be at least 10 characters"),
    twists: z.string().optional(),
    rewards: z.string().min(5, "Rewards must be at least 5 characters"),
    notes: z.string().optional(),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: "",
      difficultyLevel: "",
      description: "",
      objectives: "",
      twists: "",
      rewards: "",
      notes: "",
    },
  });

  const onSubmit = (data) => {
    onSave(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-fantasy">Create New Quest</CardTitle>
        <CardDescription>
          Design a quest for your players
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quest Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a memorable quest title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quest Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Retrieval">Retrieval</SelectItem>
                          <SelectItem value="Escort">Escort</SelectItem>
                          <SelectItem value="Rescue">Rescue</SelectItem>
                          <SelectItem value="Investigation">Investigation</SelectItem>
                          <SelectItem value="Elimination">Elimination</SelectItem>
                          <SelectItem value="Protection">Protection</SelectItem>
                          <SelectItem value="Exploration">Exploration</SelectItem>
                          <SelectItem value="Diplomacy">Diplomacy</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="difficultyLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Easy">Easy</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Hard">Hard</SelectItem>
                          <SelectItem value="Very Hard">Very Hard</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quest Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the quest background, context, and what players need to do" 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Provide the narrative hooks to engage players and set up the challenge
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="objectives"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quest Objectives</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="List the specific goals players need to accomplish (one per line)" 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Clear objectives help players understand what they need to accomplish
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="twists"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plot Twists <span className="text-muted-foreground">(Optional)</span></FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add unexpected developments, complications, or reveals" 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Good twists subvert expectations and add depth to your quest
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="rewards"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rewards</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="List the rewards for completing the quest (gold, items, reputation, etc.)" 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DM Notes <span className="text-muted-foreground">(Optional)</span></FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes, ideas, or reminders for you as the DM" 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">
                Save Quest
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function QuestDetail({ quest, onBack }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" onClick={onBack}>
          Back to Quests
        </Button>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add to Campaign
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="bg-primary/10">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="font-fantasy text-2xl">{quest.title}</CardTitle>
              <CardDescription className="mt-1">
                {quest.type} • {quest.difficultyLevel} Difficulty
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Description</h3>
              <p className="text-muted-foreground">{quest.description}</p>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-2">Objectives</h3>
              <div className="text-muted-foreground whitespace-pre-line">{quest.objectives}</div>
            </div>
            
            {quest.twists && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-medium mb-2">Plot Twists</h3>
                  <p className="text-muted-foreground">{quest.twists}</p>
                </div>
              </>
            )}
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-2">Rewards</h3>
              <div className="text-muted-foreground whitespace-pre-line">{quest.rewards}</div>
            </div>
            
            {quest.notes && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-medium mb-2">DM Notes</h3>
                  <p className="text-muted-foreground">{quest.notes}</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="bg-secondary/5 border-t border-primary/10 flex justify-between">
          <div className="text-xs text-muted-foreground">
            Created on {new Date(quest.createdAt).toLocaleDateString()}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

function LearningToolsTab() {
  const [selectedContent, setSelectedContent] = useState(null);
  
  // Mock learning content
  const learningContent = [
    {
      id: 1,
      title: "Character Creation Basics",
      category: "character_creation",
      content: "Character creation is the process of defining your player character (PC) in D&D. This involves choosing a race, class, background, and determining ability scores. Each choice contributes to your character's capabilities and role in the adventure.\n\nThe character sheet is the document that records all of your character's statistics, abilities, equipment, and other important information. Understanding how to read and update your character sheet is essential for playing D&D.",
      difficulty: "beginner",
      examples: [
        "Example: Creating a Human Fighter might involve choosing the Soldier background, prioritizing Strength and Constitution ability scores, and selecting equipment like a longsword, shield, and chain mail."
      ]
    },
    {
      id: 2,
      title: "Combat Basics",
      category: "combat",
      content: "Combat in D&D is turn-based and occurs in rounds. Each round, players and monsters take turns performing actions. Understanding initiative, actions, bonus actions, and movement is key to effective combat.\n\nOn your turn, you typically get one action (such as Attack, Cast a Spell, Dash, Disengage, etc.), movement up to your speed, and possibly a bonus action if a feature grants one.",
      difficulty: "beginner",
      examples: [
        "Example: A rogue might use their movement to position behind an enemy, their action to attack with a shortsword (potentially dealing Sneak Attack damage), and their bonus action to Disengage to move away safely."
      ]
    },
    {
      id: 3,
      title: "Spellcasting 101",
      category: "spells",
      content: "Spellcasting is a complex but rewarding system in D&D. Spellcasting classes like Wizards, Clerics, and Druids can cast powerful spells that can change the course of combat or solve problems creatively.\n\nSpells have components (verbal, somatic, material), casting times, durations, and ranges that determine how they function. Understanding spell slots and how they're expended and recovered is crucial for spellcasters.",
      difficulty: "intermediate",
      examples: [
        "Example: A 3rd-level Wizard has four 1st-level spell slots and two 2nd-level spell slots. They might cast Magic Missile using a 1st-level slot at the start of combat, then later cast it again using a 2nd-level slot for greater effect."
      ]
    }
  ];
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-fantasy font-semibold">Teaching Tools</h2>
        <Button>
          <Plus size={16} className="mr-2" />
          Create Learning Module
        </Button>
      </div>
      
      {selectedContent ? (
        <div>
          <Button 
            variant="outline" 
            onClick={() => setSelectedContent(null)}
            className="mb-4"
          >
            Back to Learning Modules
          </Button>
          
          <Card>
            <CardHeader className="bg-primary/10">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="font-fantasy text-2xl">{selectedContent.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {selectedContent.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} • {selectedContent.difficulty.replace(/\b\w/g, l => l.toUpperCase())} Level
                  </CardDescription>
                </div>
                <Badge className="text-sm">
                  D&D Fundamentals
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {selectedContent.content.split('\n\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
                
                {selectedContent.examples && selectedContent.examples.length > 0 && (
                  <div className="mt-4 p-4 bg-secondary/10 rounded-lg border border-primary/10">
                    <h3 className="font-semibold text-primary mb-2">Examples</h3>
                    <ul className="space-y-2">
                      {selectedContent.examples.map((example, index) => (
                        <li key={index}>{example}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {learningContent.map((content) => (
            <Card 
              key={content.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedContent(content)}
            >
              <CardHeader className="bg-primary/10 pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="font-fantasy">{content.title}</CardTitle>
                  <Badge variant="outline" className="bg-primary/20">
                    {content.difficulty.replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  {content.content.substring(0, 120)}...
                </p>
                <div className="flex justify-between items-center text-sm">
                  <Badge variant="secondary">
                    {content.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                  <span className="text-primary text-xs">Read more →</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <Card className="mt-8 border-primary/20 bg-secondary/10">
        <CardHeader>
          <CardTitle className="flex items-center text-primary">
            <BookOpen className="mr-2 h-5 w-5" />
            Using Learning Modules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Learning modules can be used in several ways to enhance your D&D experience:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>During Session Zero:</strong> Share relevant modules with new players to help them understand basic concepts.</li>
            <li><strong>As Reference Material:</strong> Keep modules handy during gameplay to quickly answer rules questions.</li>
            <li><strong>For Player Growth:</strong> Recommend specific modules to players who want to understand certain aspects of the game better.</li>
          </ul>
          <p className="mt-2">
            As a DM, you can also create custom learning modules tailored to your specific campaign or house rules.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}