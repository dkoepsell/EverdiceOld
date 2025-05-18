import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Sparkles, Trash2 } from "lucide-react";
import { DmActionHelp } from "@/components/ui/help-bubble";
import { toast } from "@/hooks/use-toast";

interface ItemTemplate {
  id: number;
  name: string;
  description: string;
  itemType: string;
  rarity: string;
  properties: Record<string, any>;
}

interface CampaignReward {
  id: number;
  campaignId: number;
  sessionId: number | null;
  itemId: number;
  createdAt: string;
  isAwarded: boolean;
  awardedAt: string | null;
}

export function LootGenerator({ campaignId }: { campaignId: number }) {
  const queryClient = useQueryClient();
  const [difficulty, setDifficulty] = useState<string>("easy");
  const [customLoot, setCustomLoot] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [sessionId, setSessionId] = useState<number | null>(null);

  // Query available sessions for this campaign
  const { data: sessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: [`/api/campaigns/${campaignId}/sessions`],
    enabled: !!campaignId,
  });

  // Query system items
  const { data: systemItems, isLoading: isLoadingItems } = useQuery({
    queryKey: [`/api/items/system`],
  });

  // Query existing campaign rewards
  const { data: campaignRewards, isLoading: isLoadingRewards } = useQuery({
    queryKey: [`/api/campaigns/${campaignId}/rewards`],
    enabled: !!campaignId,
  });

  // Mutation to generate random loot
  const generateLootMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/campaigns/${campaignId}/generate-loot`, {
        difficulty,
        sessionId,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/rewards`] });
      toast({
        title: "Loot Generated",
        description: "Random loot has been added to the campaign rewards.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate loot",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to add specific loot
  const addLootMutation = useMutation({
    mutationFn: async () => {
      if (!selectedItemId) throw new Error("No item selected");
      const res = await apiRequest("POST", `/api/campaigns/${campaignId}/rewards`, {
        itemId: selectedItemId,
        sessionId,
        quantity,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/rewards`] });
      setSelectedItemId(null);
      setQuantity(1);
      toast({
        title: "Loot Added",
        description: "Item has been added to campaign rewards.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add loot",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to remove loot
  const removeLootMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      const res = await apiRequest("DELETE", `/api/campaigns/${campaignId}/rewards/${rewardId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/rewards`] });
      toast({
        title: "Loot Removed",
        description: "Item has been removed from campaign rewards.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove loot",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to award loot to players
  const awardLootMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      const res = await apiRequest("POST", `/api/campaigns/${campaignId}/rewards/${rewardId}/award`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/rewards`] });
      toast({
        title: "Loot Awarded",
        description: "The item has been made available to players in this campaign.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to award loot",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper to get item details
  const getItemById = (itemId: number): ItemTemplate | undefined => {
    return systemItems?.find((item: ItemTemplate) => item.id === itemId);
  };

  // Helper to get session name
  const getSessionName = (sessionId: number): string => {
    const session = sessions?.find((s: any) => s.id === sessionId);
    return session ? session.title : "Unknown Session";
  };

  // Helper to format rarity to a color
  const getRarityColor = (rarity: string): string => {
    switch (rarity.toLowerCase()) {
      case "common": return "bg-gray-200 text-gray-800";
      case "uncommon": return "bg-green-200 text-green-800";
      case "rare": return "bg-blue-200 text-blue-800";
      case "very rare": return "bg-purple-200 text-purple-800";
      case "legendary": return "bg-orange-200 text-orange-800";
      case "artifact": return "bg-red-200 text-red-800";
      default: return "bg-gray-200 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Campaign Rewards</h2>
        <div className="flex items-center space-x-2">
          <DmActionHelp
            title="Campaign Rewards System"
            description="Add special items, equipment, and treasures for your players to discover."
            tips={[
              "Random generation creates level-appropriate loot based on difficulty",
              "Custom loot lets you select specific items to reward your players",
              "Items can be tied to specific sessions or kept as general campaign rewards",
              "Award items to make them available to players in their inventory"
            ]}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Rewards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Button 
                variant={!customLoot ? "default" : "outline"} 
                onClick={() => setCustomLoot(false)}
              >
                Random Generation
              </Button>
              <Button 
                variant={customLoot ? "default" : "outline"} 
                onClick={() => setCustomLoot(true)}
              >
                Custom Selection
              </Button>
            </div>

            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="session">Reward Location (Optional)</Label>
                  <Select 
                    value={sessionId ? String(sessionId) : ""} 
                    onValueChange={(value) => setSessionId(value ? Number(value) : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Campaign-wide reward" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Campaign-wide reward</SelectItem>
                      {sessions?.map((session: any) => (
                        <SelectItem key={session.id} value={String(session.id)}>
                          Session {session.sessionNumber}: {session.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {!customLoot ? (
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Loot Difficulty</Label>
                    <Select 
                      value={difficulty} 
                      onValueChange={setDifficulty}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy (Common items)</SelectItem>
                        <SelectItem value="medium">Medium (Mix of common/uncommon)</SelectItem>
                        <SelectItem value="hard">Hard (Uncommon/rare items)</SelectItem>
                        <SelectItem value="legendary">Legendary (Rare/very rare items)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="item">Select Item</Label>
                    <Select 
                      value={selectedItemId ? String(selectedItemId) : ""} 
                      onValueChange={(value) => setSelectedItemId(Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an item" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {systemItems?.map((item: ItemTemplate) => (
                          <SelectItem key={item.id} value={String(item.id)}>
                            {item.name} ({item.rarity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {customLoot && selectedItemId && (
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    max={100}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                </div>
              )}

              {customLoot && selectedItemId && (
                <div className="p-4 border rounded-md bg-muted/30">
                  <h4 className="font-semibold mb-2">{getItemById(selectedItemId)?.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {getItemById(selectedItemId)?.description}
                  </p>
                  <div className="flex space-x-2">
                    <Badge className={getRarityColor(getItemById(selectedItemId)?.rarity || "common")}>
                      {getItemById(selectedItemId)?.rarity}
                    </Badge>
                    <Badge variant="outline">{getItemById(selectedItemId)?.itemType}</Badge>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  disabled={
                    (customLoot && !selectedItemId) ||
                    generateLootMutation.isPending ||
                    addLootMutation.isPending
                  }
                  onClick={() => {
                    if (customLoot) {
                      addLootMutation.mutate();
                    } else {
                      generateLootMutation.mutate();
                    }
                  }}
                >
                  {(generateLootMutation.isPending || addLootMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {customLoot ? 'Add Selected Reward' : 'Generate Random Rewards'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Reward Items</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingRewards ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !campaignRewards || campaignRewards.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <p>No rewards have been added to this campaign yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {campaignRewards.map((reward: CampaignReward) => {
                const item = getItemById(reward.itemId);
                if (!item) return null;

                return (
                  <div key={reward.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <div className="flex items-center text-sm text-muted-foreground space-x-2">
                          <Badge className={getRarityColor(item.rarity)}>{item.rarity}</Badge>
                          <Badge variant="outline">{item.itemType}</Badge>
                          {reward.sessionId && (
                            <span>• Session: {getSessionName(reward.sessionId)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!reward.isAwarded ? (
                        <Button
                          size="sm"
                          onClick={() => awardLootMutation.mutate(reward.id)}
                          disabled={awardLootMutation.isPending}
                        >
                          {awardLootMutation.isPending && (
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          )}
                          Award to Players
                        </Button>
                      ) : (
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          Awarded
                        </Badge>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeLootMutation.mutate(reward.id)}
                        disabled={removeLootMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}