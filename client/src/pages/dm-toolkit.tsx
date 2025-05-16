import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, BookOpen, Brain, Dice5, Heart, Loader2, Plus, Shield, Skull, Target, Users, Wand2 } from "lucide-react";

export default function DMToolkit() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("companions");
  
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
          <p className="text-muted-foreground">Tools and resources for creating and managing D&D campaigns</p>
        </div>
      </div>
      
      <Tabs defaultValue="companions" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 w-full">
          <TabsTrigger value="companions" className="font-medium">
            Companions
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="companions" className="space-y-4">
          <CompanionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CompanionsTab() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCompanion, setSelectedCompanion] = useState(null);
  const [activeTab, setActiveTab] = useState("stock-companions"); // "my-companions" or "stock-companions"
  const [showAddToCampaignDialog, setShowAddToCampaignDialog] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [selectedRole, setSelectedRole] = useState("companion");
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch user's companions from API
  const { data: companions = [], isLoading: isLoadingCompanions } = useQuery({
    queryKey: ["/api/npcs/companions"],
    refetchOnWindowFocus: false,
  });
  
  // Fetch stock companions from API
  const { data: stockCompanions = [], isLoading: isLoadingStockCompanions } = useQuery({
    queryKey: ["/api/npcs/stock-companions"],
    refetchOnWindowFocus: false,
  });
  
  // Fetch user's campaigns for the "add to campaign" dialog
  const { data: campaigns = [] } = useQuery({
    queryKey: ["/api/campaigns"],
    refetchOnWindowFocus: false,
    enabled: showAddToCampaignDialog, // Only fetch when dialog is open
  });
  
  // Mutation for creating a new companion
  const createCompanionMutation = useMutation({
    mutationFn: async (companionData) => {
      const response = await apiRequest("POST", "/api/npcs", {
        ...companionData,
        isCompanion: true,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create companion");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Companion created",
        description: "Your companion has been created and can now be added to campaigns.",
      });
      setShowCreateForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/npcs/companions"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to create companion",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleCreateCompanion = (companionData) => {
    createCompanionMutation.mutate(companionData);
  };
  
  // Mutation for adding NPC to campaign
  const addToCampaignMutation = useMutation({
    mutationFn: async ({ campaignId, npcId, role }) => {
      const response = await apiRequest("POST", `/api/campaigns/${campaignId}/npcs`, {
        npcId,
        role,
        isActive: true
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add companion to campaign");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Companion added",
        description: selectedCompanion ? `${selectedCompanion.name} has been added to the campaign.` : "Companion added to campaign",
      });
      
      setShowAddToCampaignDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to add companion",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleAddToCampaign = () => {
    if (!selectedCampaignId) {
      toast({
        title: "Campaign required",
        description: "Please select a campaign",
        variant: "destructive",
      });
      return;
    }
    
    addToCampaignMutation.mutate({
      campaignId: parseInt(selectedCampaignId),
      npcId: selectedCompanion.id,
      role: selectedRole
    });
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-fantasy font-semibold">NPC Companions</h2>
          <p className="text-muted-foreground">Create NPCs that can join campaigns and assist players</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus size={16} className="mr-2" />
          Create Companion
        </Button>
      </div>
      
      {/* Tab selection for my companions vs stock companions */}
      <div className="border-b mb-4">
        <div className="flex">
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === "my-companions"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("my-companions")}
          >
            My Companions
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === "stock-companions"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("stock-companions")}
          >
            Ready-Made Companions
          </button>
        </div>
      </div>
      
      {activeTab === "stock-companions" ? (
        isLoadingStockCompanions ? (
          <div className="flex justify-center my-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : stockCompanions.length === 0 ? (
          <Card className="py-8">
            <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground/60" />
              <div>
                <h3 className="text-lg font-semibold">No stock companions available</h3>
                <p className="text-muted-foreground">There are currently no pre-made companions available.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div>
            <p className="text-muted-foreground mb-6">
              These ready-made companions can be added directly to your campaigns without needing to create them from scratch.
              Click on any companion to view details and add them to a campaign.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stockCompanions.map((companion) => (
                <Card 
                  key={companion.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow border-2 border-primary/10"
                  onClick={() => setSelectedCompanion(companion)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="font-fantasy">{companion.name}</CardTitle>
                      {companion.companionType && (
                        <Badge 
                          className={
                            companion.companionType === "combat" ? "bg-red-600" :
                            companion.companionType === "support" ? "bg-green-600" :
                            companion.companionType === "utility" ? "bg-blue-600" :
                            "bg-purple-600" // social
                          }
                        >
                          {companion.companionType === "combat" ? "Combat" :
                           companion.companionType === "support" ? "Support" :
                           companion.companionType === "utility" ? "Utility" : "Social"}
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{companion.race} • {companion.occupation}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm">
                        {companion.personality && companion.personality.length > 100 
                          ? companion.personality.substring(0, 100) + "..." 
                          : companion.personality}
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          <span>Level {companion.level || 1}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3 text-red-500" />
                          <span>HP {companion.hitPoints || 10}/{companion.maxHitPoints || 10}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          <span>AC {companion.armorClass || 10}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      ) : (
        isLoadingCompanions ? (
          <div className="flex justify-center my-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : companions.length === 0 ? (
          <Card className="py-8">
            <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
              <Users className="h-12 w-12 text-muted-foreground/60" />
              <div>
                <h3 className="text-lg font-semibold">No companions yet</h3>
                <p className="text-muted-foreground">Create your first companion to join your adventures!</p>
              </div>
              <Button onClick={() => setShowCreateForm(true)}>
                Create Companion
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companions.map((companion) => (
              <Card 
                key={companion.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="font-fantasy">{companion.name}</CardTitle>
                    {companion.companionType && (
                      <Badge 
                        className={
                          companion.companionType === "combat" ? "bg-red-600" :
                          companion.companionType === "support" ? "bg-green-600" :
                          companion.companionType === "utility" ? "bg-blue-600" :
                          "bg-purple-600" // social
                        }
                      >
                        {companion.companionType === "combat" ? "Combat" :
                        companion.companionType === "support" ? "Support" :
                        companion.companionType === "utility" ? "Utility" : "Social"}
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{companion.race} • {companion.occupation}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm">
                      {companion.personality && companion.personality.length > 100 
                        ? companion.personality.substring(0, 100) + "..." 
                        : companion.personality}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        <span>Level {companion.level || 1}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3 text-red-500" />
                        <span>HP {companion.hitPoints || 10}/{companion.maxHitPoints || 10}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        <span>AC {companion.armorClass || 10}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}
      
      {/* D&D Instruction Component */}
      <Card className="mt-8 border-primary/20 bg-secondary/10">
        <CardHeader>
          <CardTitle className="flex items-center text-primary">
            <BookOpen className="mr-2 h-5 w-5" />
            Using Companion NPCs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Companion NPCs can join your campaigns to assist players, taking turns in combat and providing valuable skills:
          </p>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
            <li>Combat companions excel at fighting and tanking damage</li>
            <li>Support companions provide healing and buffs to party members</li>
            <li>Utility companions offer practical skills like lockpicking or identifying items</li>
            <li>Social companions help with diplomacy and gathering information</li>
            <li>Add companions to any campaign from the Campaign Management page</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}