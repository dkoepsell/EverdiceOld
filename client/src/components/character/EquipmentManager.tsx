import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Character } from "@shared/schema";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Shield, Sword, ZoomIn, Package, Sparkles, X } from "lucide-react";
import { HelpBubble, DmActionHelp } from "@/components/ui/help-bubble";

// Define the combined type for items in character inventory
type InventoryItem = {
  id: number;
  characterId: number;
  itemId: number;
  quantity: number;
  isEquipped: boolean;
  isAttuned: boolean;
  customName: string | null;
  customDescription: string | null;
  customProperties: any;
  acquiredAt: string;
  notes: string | null;
  // Item properties
  name: string;
  description: string;
  itemType: string;
  rarity: string;
  slot: string;
  weight: number;
  value: number;
  isStackable: boolean;
  isConsumable: boolean;
  requiresAttunement: boolean;
  properties: any;
  isSystemItem: boolean;
};

// Define the item type for new items being added to inventory
type ItemTemplate = {
  id: number;
  name: string;
  description: string;
  itemType: string;
  rarity: string;
  slot: string;
  weight: number;
  value: number;
  isStackable: boolean;
  isConsumable: boolean;
  requiresAttunement: boolean;
  properties: any;
  isSystemItem: boolean;
};

type EquipmentManagerProps = {
  character: Character;
  refreshCharacter: () => void;
};

const getRarityClass = (rarity: string): string => {
  switch (rarity) {
    case "common":
      return "bg-gray-100 text-gray-800";
    case "uncommon":
      return "bg-green-100 text-green-800";
    case "rare":
      return "bg-blue-100 text-blue-800";
    case "very_rare":
      return "bg-purple-100 text-purple-800";
    case "legendary":
      return "bg-amber-100 text-amber-800";
    case "artifact":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const formatRarity = (rarity: string): string => {
  return rarity.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

const formatSlot = (slot: string): string => {
  return slot.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

const getItemTypeIcon = (itemType: string) => {
  switch (itemType) {
    case "weapon":
      return <Sword className="h-4 w-4 mr-1" />;
    case "armor":
    case "shield":
      return <Shield className="h-4 w-4 mr-1" />;
    default:
      return <Package className="h-4 w-4 mr-1" />;
  }
};

export function EquipmentManager({ character, refreshCharacter }: EquipmentManagerProps) {
  const queryClient = useQueryClient();
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [itemDetailsDialogOpen, setItemDetailsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [attunementError, setAttunementError] = useState<string | null>(null);

  // Fetch character's inventory
  const {
    data: inventory = [],
    isLoading: inventoryLoading,
    error: inventoryError,
  } = useQuery({
    queryKey: [`/api/characters/${character.id}/inventory`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/characters/${character.id}/inventory`);
      const data = await response.json();
      return data as InventoryItem[];
    },
  });

  // Fetch available items to add
  const {
    data: availableItems = [],
    isLoading: itemsLoading,
    error: itemsError,
  } = useQuery({
    queryKey: ["/api/items"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/items");
      const data = await response.json();
      return data as ItemTemplate[];
    },
  });

  // Mutation to add item to character inventory
  const addItemMutation = useMutation({
    mutationFn: async (data: {
      itemId: number;
      quantity: number;
      notes?: string;
    }) => {
      const response = await apiRequest(
        "POST",
        `/api/characters/${character.id}/inventory`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${character.id}/inventory`] });
      toast({
        title: "Item added",
        description: "The item has been added to your inventory.",
      });
      setAddItemDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add item",
        description: error.message || "An error occurred while adding the item.",
        variant: "destructive",
      });
    },
  });

  // Mutation to update character item (equip, attune, etc.)
  const updateItemMutation = useMutation({
    mutationFn: async ({
      itemId,
      updates,
    }: {
      itemId: number;
      updates: Partial<InventoryItem>;
    }) => {
      const response = await apiRequest(
        "PUT",
        `/api/characters/${character.id}/inventory/${itemId}`,
        updates
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${character.id}/inventory`] });
      setAttunementError(null);
      toast({
        title: "Item updated",
        description: "The item has been updated.",
      });
    },
    onError: (error: any) => {
      // Special handling for attunement limit errors
      if (error.message && error.message.includes("Cannot attune to more than 3 items")) {
        setAttunementError(error.message);
      } else {
        toast({
          title: "Failed to update item",
          description: error.message || "An error occurred while updating the item.",
          variant: "destructive",
        });
      }
    },
  });

  // Mutation to remove item from inventory
  const removeItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      await apiRequest(
        "DELETE",
        `/api/characters/${character.id}/inventory/${itemId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${character.id}/inventory`] });
      setItemDetailsDialogOpen(false);
      toast({
        title: "Item removed",
        description: "The item has been removed from your inventory.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove item",
        description: error.message || "An error occurred while removing the item.",
        variant: "destructive",
      });
    },
  });

  // Filter inventory by equipment slot/type
  const equippedItems = inventory.filter((item) => item.isEquipped);
  const weapons = inventory.filter((item) => item.itemType === "weapon");
  const armor = inventory.filter((item) => item.itemType === "armor" || item.itemType === "shield");
  const magicItems = inventory.filter((item) => 
    item.rarity !== "common" && 
    item.rarity !== "uncommon" &&
    !item.isConsumable
  );
  const consumables = inventory.filter((item) => item.isConsumable);
  const otherItems = inventory.filter(
    (item) => 
      !item.isEquipped && 
      item.itemType !== "weapon" && 
      item.itemType !== "armor" && 
      item.itemType !== "shield" &&
      !item.isConsumable &&
      item.rarity === "common" || item.rarity === "uncommon"
  );

  const getTotalWeight = () => {
    return inventory.reduce((total, item) => {
      return total + (item.weight * item.quantity);
    }, 0);
  };

  const getAttunedItemsCount = () => {
    return inventory.filter(item => item.isAttuned).length;
  };

  const handleEquipToggle = (item: InventoryItem) => {
    updateItemMutation.mutate({
      itemId: item.id,
      updates: { isEquipped: !item.isEquipped }
    });
  };

  const handleAttuneToggle = (item: InventoryItem) => {
    updateItemMutation.mutate({
      itemId: item.id,
      updates: { isAttuned: !item.isAttuned }
    });
  };

  const handleAddItem = (itemId: number) => {
    addItemMutation.mutate({
      itemId,
      quantity: 1,
    });
  };

  const handleRemoveItem = (itemId: number) => {
    removeItemMutation.mutate(itemId);
  };

  const handleViewItemDetails = (item: InventoryItem) => {
    setSelectedItem(item);
    setItemDetailsDialogOpen(true);
  };

  if (inventoryLoading || itemsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading equipment...</span>
      </div>
    );
  }

  if (inventoryError || itemsError) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <h3 className="text-red-800 font-medium">Error loading equipment</h3>
        <p className="text-red-600">
          {inventoryError?.message || itemsError?.message || "An unknown error occurred."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Equipment & Items</h2>
          <div className="flex gap-4 mt-2">
            <div className="text-sm">
              <span className="font-medium">Weight:</span>{" "}
              <span>{getTotalWeight()} lbs</span>
            </div>
            <div className="text-sm">
              <span className="font-medium">Attuned Items:</span>{" "}
              <span className={getAttunedItemsCount() >= 3 ? "text-red-500 font-bold" : ""}>
                {getAttunedItemsCount()}/3
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={addItemDialogOpen} onOpenChange={setAddItemDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Add Item</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Add Item to Inventory</DialogTitle>
                <DialogDescription>
                  Select an item to add to your character's inventory.
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="flex-grow">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-1">
                  {availableItems.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <CardHeader className="p-3 pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-md">{item.name}</CardTitle>
                          <Badge className={getRarityClass(item.rarity)}>
                            {formatRarity(item.rarity)}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs flex items-center">
                          {getItemTypeIcon(item.itemType)}
                          {item.itemType} • {formatSlot(item.slot)} • {item.weight} lbs
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <p className="text-xs mb-3 line-clamp-2">{item.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs">{item.value} gp</span>
                          <Button
                            size="sm"
                            onClick={() => handleAddItem(item.id)}
                            disabled={addItemMutation.isPending}
                          >
                            Add
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
              <DialogFooter className="mt-2">
                <Button variant="outline" onClick={() => setAddItemDialogOpen(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <DmActionHelp
            title="Equipment Information"
            description="Manage your character's equipment in this section."
            tips={[
              "Your carrying capacity is determined by your Strength score multiplied by 15 (in pounds).",
              "You can attune to a maximum of 3 magic items at once. Attunement typically requires a short rest (1 hour).",
              "While there's no hard limit on how many items you can equip, realistically you can only wear one set of armor, hold one or two weapons, etc."
            ]}
          />
        </div>
      </div>

      <Tabs defaultValue="equipped" className="w-full">
        <TabsList className="grid grid-cols-6 mb-4">
          <TabsTrigger value="equipped">Equipped</TabsTrigger>
          <TabsTrigger value="weapons">Weapons</TabsTrigger>
          <TabsTrigger value="armor">Armor</TabsTrigger>
          <TabsTrigger value="magic">Magic Items</TabsTrigger>
          <TabsTrigger value="consumables">Consumables</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>

        {/* Equipped Items Tab */}
        <TabsContent value="equipped" className="pt-2">
          {equippedItems.length === 0 ? (
            <div className="text-center py-8 bg-muted/50 rounded-md">
              <p className="text-muted-foreground">No items equipped</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {equippedItems.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  <CardHeader className="p-3 pb-1">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-md flex items-center">
                        {getItemTypeIcon(item.itemType)}
                        {item.name}
                        {item.isAttuned && (
                          <Sparkles className="h-4 w-4 ml-1 text-amber-500" />
                        )}
                      </CardTitle>
                      <Badge className={getRarityClass(item.rarity)}>
                        {formatRarity(item.rarity)}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {item.itemType} • {formatSlot(item.slot)} • {item.weight} lbs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-1">
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEquipToggle(item)}
                          disabled={updateItemMutation.isPending}
                        >
                          Unequip
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewItemDetails(item)}
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Weapons Tab */}
        <TabsContent value="weapons" className="pt-2">
          {weapons.length === 0 ? (
            <div className="text-center py-8 bg-muted/50 rounded-md">
              <p className="text-muted-foreground">No weapons in inventory</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {weapons.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  <CardHeader className="p-3 pb-1">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-md flex items-center">
                        <Sword className="h-4 w-4 mr-1" />
                        {item.name}
                        {item.isAttuned && (
                          <Sparkles className="h-4 w-4 ml-1 text-amber-500" />
                        )}
                      </CardTitle>
                      <Badge className={getRarityClass(item.rarity)}>
                        {formatRarity(item.rarity)}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {formatSlot(item.slot)} • {item.weight} lbs
                      {item.properties && item.properties.damage && (
                        <span> • Damage: {item.properties.damage}</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-1">
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={item.isEquipped ? "outline" : "default"}
                          onClick={() => handleEquipToggle(item)}
                          disabled={updateItemMutation.isPending}
                        >
                          {item.isEquipped ? "Unequip" : "Equip"}
                        </Button>
                        {item.requiresAttunement && (
                          <Button
                            size="sm"
                            variant={item.isAttuned ? "outline" : "secondary"}
                            onClick={() => handleAttuneToggle(item)}
                            disabled={
                              updateItemMutation.isPending ||
                              (!item.isAttuned && getAttunedItemsCount() >= 3)
                            }
                          >
                            {item.isAttuned ? "Unattune" : "Attune"}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewItemDetails(item)}
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Armor Tab */}
        <TabsContent value="armor" className="pt-2">
          {armor.length === 0 ? (
            <div className="text-center py-8 bg-muted/50 rounded-md">
              <p className="text-muted-foreground">No armor in inventory</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {armor.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  <CardHeader className="p-3 pb-1">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-md flex items-center">
                        <Shield className="h-4 w-4 mr-1" />
                        {item.name}
                        {item.isAttuned && (
                          <Sparkles className="h-4 w-4 ml-1 text-amber-500" />
                        )}
                      </CardTitle>
                      <Badge className={getRarityClass(item.rarity)}>
                        {formatRarity(item.rarity)}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {item.itemType} • {item.weight} lbs
                      {item.properties && item.properties.armorClass && (
                        <span> • AC: {item.properties.armorClass}</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-1">
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={item.isEquipped ? "outline" : "default"}
                          onClick={() => handleEquipToggle(item)}
                          disabled={updateItemMutation.isPending}
                        >
                          {item.isEquipped ? "Unequip" : "Equip"}
                        </Button>
                        {item.requiresAttunement && (
                          <Button
                            size="sm"
                            variant={item.isAttuned ? "outline" : "secondary"}
                            onClick={() => handleAttuneToggle(item)}
                            disabled={
                              updateItemMutation.isPending ||
                              (!item.isAttuned && getAttunedItemsCount() >= 3)
                            }
                          >
                            {item.isAttuned ? "Unattune" : "Attune"}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewItemDetails(item)}
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Magic Items Tab */}
        <TabsContent value="magic" className="pt-2">
          {magicItems.length === 0 ? (
            <div className="text-center py-8 bg-muted/50 rounded-md">
              <p className="text-muted-foreground">No magic items in inventory</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {magicItems.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  <CardHeader className="p-3 pb-1">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-md flex items-center">
                        {getItemTypeIcon(item.itemType)}
                        {item.name}
                        {item.isAttuned && (
                          <Sparkles className="h-4 w-4 ml-1 text-amber-500" />
                        )}
                      </CardTitle>
                      <Badge className={getRarityClass(item.rarity)}>
                        {formatRarity(item.rarity)}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {item.itemType} • {formatSlot(item.slot)} • {item.weight} lbs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-1">
                    <p className="text-xs line-clamp-2 mb-2">{item.description}</p>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={item.isEquipped ? "outline" : "default"}
                          onClick={() => handleEquipToggle(item)}
                          disabled={updateItemMutation.isPending}
                        >
                          {item.isEquipped ? "Unequip" : "Equip"}
                        </Button>
                        {item.requiresAttunement && (
                          <Button
                            size="sm"
                            variant={item.isAttuned ? "outline" : "secondary"}
                            onClick={() => handleAttuneToggle(item)}
                            disabled={
                              updateItemMutation.isPending ||
                              (!item.isAttuned && getAttunedItemsCount() >= 3)
                            }
                          >
                            {item.isAttuned ? "Unattune" : "Attune"}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewItemDetails(item)}
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Consumables Tab */}
        <TabsContent value="consumables" className="pt-2">
          {consumables.length === 0 ? (
            <div className="text-center py-8 bg-muted/50 rounded-md">
              <p className="text-muted-foreground">No consumables in inventory</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {consumables.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  <CardHeader className="p-3 pb-1">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-md flex items-center">
                        {getItemTypeIcon(item.itemType)}
                        {item.name} 
                        {item.quantity > 1 && (
                          <span className="ml-1 text-sm text-muted-foreground">
                            ({item.quantity})
                          </span>
                        )}
                      </CardTitle>
                      <Badge className={getRarityClass(item.rarity)}>
                        {formatRarity(item.rarity)}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {item.itemType} • {item.weight * item.quantity} lbs total
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-1">
                    <p className="text-xs line-clamp-2 mb-2">{item.description}</p>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            // Action to use consumable would go here
                            toast({
                              title: "Use Item",
                              description: `You would use ${item.name} here. This functionality is coming soon.`,
                            });
                          }}
                        >
                          Use
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewItemDetails(item)}
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Other Items Tab */}
        <TabsContent value="other" className="pt-2">
          {otherItems.length === 0 ? (
            <div className="text-center py-8 bg-muted/50 rounded-md">
              <p className="text-muted-foreground">No other items in inventory</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {otherItems.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  <CardHeader className="p-3 pb-1">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-md flex items-center">
                        {getItemTypeIcon(item.itemType)}
                        {item.name}
                        {item.quantity > 1 && (
                          <span className="ml-1 text-sm text-muted-foreground">
                            ({item.quantity})
                          </span>
                        )}
                      </CardTitle>
                      <Badge className={getRarityClass(item.rarity)}>
                        {formatRarity(item.rarity)}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {item.itemType} • {item.weight * item.quantity} lbs total
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-1">
                    <p className="text-xs line-clamp-2 mb-2">{item.description}</p>
                    <div className="flex justify-between items-center mt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewItemDetails(item)}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Item Details Dialog */}
      {selectedItem && (
        <Dialog open={itemDetailsDialogOpen} onOpenChange={setItemDetailsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex justify-between items-center">
                <DialogTitle className="text-xl flex items-center">
                  {getItemTypeIcon(selectedItem.itemType)}
                  {selectedItem.name}
                  {selectedItem.isAttuned && (
                    <Sparkles className="h-4 w-4 ml-1 text-amber-500" />
                  )}
                </DialogTitle>
                <Badge className={getRarityClass(selectedItem.rarity)}>
                  {formatRarity(selectedItem.rarity)}
                </Badge>
              </div>
              <DialogDescription>
                {selectedItem.itemType} • {formatSlot(selectedItem.slot)} • {selectedItem.weight} lbs
                {selectedItem.quantity > 1 && ` • Quantity: ${selectedItem.quantity}`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-md">
                <p>{selectedItem.description}</p>
              </div>

              {selectedItem.requiresAttunement && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="attunement"
                    checked={selectedItem.isAttuned}
                    onCheckedChange={() => handleAttuneToggle(selectedItem)}
                    disabled={
                      updateItemMutation.isPending ||
                      (!selectedItem.isAttuned && getAttunedItemsCount() >= 3)
                    }
                  />
                  <label
                    htmlFor="attunement"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Attuned
                  </label>
                </div>
              )}
              
              {attunementError && (
                <div className="text-red-500 text-sm">{attunementError}</div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="equipped"
                  checked={selectedItem.isEquipped}
                  onCheckedChange={() => handleEquipToggle(selectedItem)}
                  disabled={updateItemMutation.isPending}
                />
                <label
                  htmlFor="equipped"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Equipped
                </label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes about this item..."
                  value={selectedItem.notes || ""}
                  onChange={(e) => {
                    updateItemMutation.mutate({
                      itemId: selectedItem.id,
                      updates: { notes: e.target.value }
                    });
                  }}
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex justify-between">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveItem(selectedItem.id)}
                  disabled={removeItemMutation.isPending}
                >
                  {removeItemMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4 mr-1" />
                  )}
                  Remove from Inventory
                </Button>
                <Button onClick={() => setItemDetailsDialogOpen(false)}>Close</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}