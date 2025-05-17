import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ChevronRight, Coins, ShieldCheck, ShoppingCart, Package, Shield, Sword, Potion, Wand } from 'lucide-react';

// Item type interface
interface Item {
  id: number;
  name: string;
  description: string;
  type: string;
  rarity: string;
  value: number;
  properties: any;
  requiredLevel: number;
  equipSlot: string | null;
  isConsumable: boolean;
  weight: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string | null;
}

// Character item interface
interface CharacterItem {
  id: number;
  characterId: number;
  itemId: number;
  quantity: number;
  isEquipped: boolean;
  notes: string | null;
  acquiredAt: string;
  acquiredFrom: string | null;
  updatedAt: string | null;
}

// Combined interface for display
interface InventoryItem {
  characterItem: CharacterItem;
  item: Item;
}

// Currency interface
interface Currency {
  gold: number;
  silver: number;
  copper: number;
}

// Transaction interface
interface Transaction {
  id: number;
  characterId: number;
  amount: number;
  reason: string;
  referenceId: number | null;
  referenceType: string | null;
  createdAt: string;
}

// Type mapping for item icons
const getItemIcon = (type: string) => {
  switch (type) {
    case 'weapon':
      return <Sword className="mr-2 h-4 w-4" />;
    case 'armor':
      return <Shield className="mr-2 h-4 w-4" />;
    case 'potion':
      return <Potion className="mr-2 h-4 w-4" />;
    case 'wand':
      return <Wand className="mr-2 h-4 w-4" />;
    default:
      return <Package className="mr-2 h-4 w-4" />;
  }
};

// Rarity color mapping
const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'common':
      return 'bg-slate-500';
    case 'uncommon':
      return 'bg-green-500';
    case 'rare':
      return 'bg-blue-500';
    case 'very_rare':
      return 'bg-purple-500';
    case 'legendary':
      return 'bg-orange-500';
    default:
      return 'bg-slate-500';
  }
};

const InventoryTab = ({ characterId }: { characterId: number }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<string>('all');
  
  // Query character inventory
  const { 
    data: inventory, 
    isLoading: isLoadingInventory,
    refetch: refetchInventory
  } = useQuery<InventoryItem[]>({
    queryKey: [`/api/characters/${characterId}/inventory`],
    enabled: !!characterId && !!user
  });
  
  // Query character currency
  const { 
    data: currency, 
    isLoading: isLoadingCurrency,
    refetch: refetchCurrency
  } = useQuery<Currency>({
    queryKey: [`/api/characters/${characterId}/currency`],
    enabled: !!characterId && !!user
  });
  
  // Query currency transaction history
  const { 
    data: transactions, 
    isLoading: isLoadingTransactions 
  } = useQuery<Transaction[]>({
    queryKey: [`/api/characters/${characterId}/currency/history`],
    enabled: !!characterId && !!user
  });
  
  // Query all available items (for adding to inventory)
  const { 
    data: availableItems, 
    isLoading: isLoadingItems 
  } = useQuery<Item[]>({
    queryKey: ['/api/items'],
    enabled: !!user
  });
  
  // Equip/unequip item mutation
  const toggleEquipMutation = useMutation({
    mutationFn: async ({ itemId, isEquipped }: { itemId: number, isEquipped: boolean }) => {
      const res = await apiRequest('PATCH', `/api/characters/${characterId}/inventory/${itemId}`, {
        isEquipped
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${characterId}/inventory`] });
      toast({
        title: "Item updated",
        description: `Item has been ${selectedItem?.characterItem.isEquipped ? 'unequipped' : 'equipped'}.`,
      });
      setItemDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating item",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Add item to inventory mutation
  const addItemMutation = useMutation({
    mutationFn: async ({ itemId, quantity, notes }: { itemId: number, quantity: number, notes?: string }) => {
      const res = await apiRequest('POST', `/api/characters/${characterId}/inventory`, {
        itemId,
        quantity,
        notes
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${characterId}/inventory`] });
      toast({
        title: "Item added",
        description: "Item has been added to inventory.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding item",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Remove item from inventory mutation
  const removeItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      await apiRequest('DELETE', `/api/characters/${characterId}/inventory/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${characterId}/inventory`] });
      toast({
        title: "Item removed",
        description: "Item has been removed from inventory.",
      });
      setItemDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error removing item",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update currency mutation
  const updateCurrencyMutation = useMutation({
    mutationFn: async ({ goldDelta, silverDelta, copperDelta, reason }: 
      { goldDelta: number, silverDelta: number, copperDelta: number, reason: string }) => {
      const res = await apiRequest('POST', `/api/characters/${characterId}/currency`, {
        goldDelta,
        silverDelta,
        copperDelta,
        reason
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${characterId}/currency`] });
      queryClient.invalidateQueries({ queryKey: [`/api/characters/${characterId}/currency/history`] });
      toast({
        title: "Currency updated",
        description: "Currency has been updated.",
      });
      setTransactionDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating currency",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Filter inventory based on selected tab
  const filteredInventory = inventory ? inventory.filter(item => {
    if (filterTab === 'all') return true;
    if (filterTab === 'equipped') return item.characterItem.isEquipped;
    return item.item.type === filterTab;
  }) : [];
  
  // Get human-readable transaction amount
  const formatTransactionAmount = (amount: number) => {
    const gold = Math.floor(amount / 10000);
    const silver = Math.floor((amount % 10000) / 100);
    const copper = amount % 100;
    
    let result = '';
    if (gold) result += `${gold}g `;
    if (silver) result += `${silver}s `;
    if (copper) result += `${copper}c`;
    
    return result.trim();
  };
  
  // Item Add Dialog component
  const ItemAddDialog = () => {
    const [newItemId, setNewItemId] = useState<string>('');
    const [quantity, setQuantity] = useState<number>(1);
    
    const handleAddItem = () => {
      if (!newItemId) {
        toast({
          title: "Error",
          description: "Please select an item to add.",
          variant: "destructive",
        });
        return;
      }
      
      addItemMutation.mutate({
        itemId: parseInt(newItemId),
        quantity
      });
    };
    
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add New Item
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Item to Inventory</DialogTitle>
            <DialogDescription>
              Select an item to add to your character's inventory.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="item">Item</Label>
              <Select
                value={newItemId}
                onValueChange={setNewItemId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingItems ? (
                    <SelectItem value="loading" disabled>Loading items...</SelectItem>
                  ) : (
                    availableItems?.map(item => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.name} ({item.type}, {item.rarity})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={handleAddItem} disabled={!newItemId || addItemMutation.isPending}>
              {addItemMutation.isPending ? 'Adding...' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  // Currency Transaction Dialog
  const CurrencyTransactionDialog = () => {
    const [goldAmount, setGoldAmount] = useState<number>(0);
    const [silverAmount, setSilverAmount] = useState<number>(0);
    const [copperAmount, setCopperAmount] = useState<number>(0);
    const [reason, setReason] = useState<string>('');
    const [transactionType, setTransactionType] = useState<string>('add');
    
    const handleTransaction = () => {
      if (goldAmount === 0 && silverAmount === 0 && copperAmount === 0) {
        toast({
          title: "Error",
          description: "Please enter an amount.",
          variant: "destructive",
        });
        return;
      }
      
      if (!reason) {
        toast({
          title: "Error",
          description: "Please enter a reason for the transaction.",
          variant: "destructive",
        });
        return;
      }
      
      // Convert to delta values based on transaction type
      const goldDelta = transactionType === 'add' ? goldAmount : -goldAmount;
      const silverDelta = transactionType === 'add' ? silverAmount : -silverAmount;
      const copperDelta = transactionType === 'add' ? copperAmount : -copperAmount;
      
      updateCurrencyMutation.mutate({
        goldDelta,
        silverDelta,
        copperDelta,
        reason
      });
    };
    
    return (
      <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{transactionType === 'add' ? 'Add' : 'Spend'} Currency</DialogTitle>
            <DialogDescription>
              {transactionType === 'add' 
                ? 'Add currency to your character.' 
                : 'Spend currency from your character.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex space-x-4">
              <Button 
                variant={transactionType === 'add' ? 'default' : 'outline'} 
                onClick={() => setTransactionType('add')}
                className="flex-1"
              >
                Add Currency
              </Button>
              <Button 
                variant={transactionType === 'spend' ? 'default' : 'outline'} 
                onClick={() => setTransactionType('spend')}
                className="flex-1"
              >
                Spend Currency
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gold">Gold</Label>
                <Input
                  id="gold"
                  type="number"
                  min="0"
                  value={goldAmount}
                  onChange={e => setGoldAmount(parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="silver">Silver</Label>
                <Input
                  id="silver"
                  type="number"
                  min="0"
                  value={silverAmount}
                  onChange={e => setSilverAmount(parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="copper">Copper</Label>
                <Input
                  id="copper"
                  type="number"
                  min="0"
                  value={copperAmount}
                  onChange={e => setCopperAmount(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                placeholder="e.g., Quest reward, Item purchase, etc."
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={handleTransaction} disabled={updateCurrencyMutation.isPending}>
              {updateCurrencyMutation.isPending ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Currency Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-bold">Character Currency</CardTitle>
            <Button
              variant="outline"
              onClick={() => setTransactionDialogOpen(true)}
              className="h-8 px-2 lg:px-3"
            >
              <Coins className="mr-2 h-4 w-4" />
              Manage Currency
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingCurrency ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          ) : currency ? (
            <div className="flex justify-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">{currency.gold}</div>
                <div className="text-sm text-muted-foreground">Gold</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400">{currency.silver}</div>
                <div className="text-sm text-muted-foreground">Silver</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{currency.copper}</div>
                <div className="text-sm text-muted-foreground">Copper</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-2 text-muted-foreground">No currency data available</div>
          )}
        </CardContent>
      </Card>
      
      {/* Inventory Tabs */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-bold">Inventory</CardTitle>
            <ItemAddDialog />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="all" value={filterTab} onValueChange={setFilterTab}>
            <div className="px-4">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="equipped">Equipped</TabsTrigger>
                <TabsTrigger value="weapon">Weapons</TabsTrigger>
                <TabsTrigger value="armor">Armor</TabsTrigger>
                <TabsTrigger value="potion">Potions</TabsTrigger>
                <TabsTrigger value="gear">Gear</TabsTrigger>
              </TabsList>
            </div>
            
            <Separator />
            
            <TabsContent value={filterTab} className="pt-0">
              {isLoadingInventory ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : filteredInventory.length > 0 ? (
                <ScrollArea className="h-[350px] p-4">
                  <div className="space-y-2">
                    {filteredInventory.map((inventoryItem) => (
                      <div
                        key={inventoryItem.characterItem.id}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer"
                        onClick={() => {
                          setSelectedItem(inventoryItem);
                          setItemDialogOpen(true);
                        }}
                      >
                        <div className="flex items-center">
                          {getItemIcon(inventoryItem.item.type)}
                          <div>
                            <div className="font-medium">
                              {inventoryItem.item.name}
                              {inventoryItem.characterItem.isEquipped && (
                                <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">
                                  <ShieldCheck className="mr-1 h-3 w-3" /> Equipped
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center">
                              <Badge variant="secondary" className={`mr-2 ${getRarityColor(inventoryItem.item.rarity)} text-white hover:${getRarityColor(inventoryItem.item.rarity)}`}>
                                {inventoryItem.item.rarity}
                              </Badge>
                              {inventoryItem.characterItem.quantity > 1 && (
                                <span>Qty: {inventoryItem.characterItem.quantity}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  {filterTab === 'all' 
                    ? 'No items in inventory' 
                    : `No ${filterTab === 'equipped' ? 'equipped items' : filterTab + ' items'} in inventory`}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Transaction History Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingTransactions ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          ) : transactions && transactions.length > 0 ? (
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center p-2 rounded-md hover:bg-accent">
                    <div>
                      <div className="font-medium">{transaction.reason}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant={transaction.amount >= 0 ? 'success' : 'destructive'}>
                      {transaction.amount >= 0 ? '+' : '-'} {formatTransactionAmount(Math.abs(transaction.amount))}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-2 text-muted-foreground">No transaction history available</div>
          )}
        </CardContent>
      </Card>
      
      {/* Item Detail Dialog */}
      {selectedItem && (
        <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                {getItemIcon(selectedItem.item.type)}
                {selectedItem.item.name}
                {selectedItem.characterItem.isEquipped && (
                  <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">
                    <ShieldCheck className="mr-1 h-3 w-3" /> Equipped
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                <Badge className={`${getRarityColor(selectedItem.item.rarity)} text-white`}>
                  {selectedItem.item.rarity}
                </Badge>
                {selectedItem.item.requiredLevel > 1 && (
                  <Badge variant="outline" className="ml-2">
                    Required Level: {selectedItem.item.requiredLevel}
                  </Badge>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Description</h4>
                <p className="text-sm text-muted-foreground">{selectedItem.item.description}</p>
              </div>
              
              {selectedItem.item.properties && (
                <div>
                  <h4 className="font-medium">Properties</h4>
                  <div className="text-sm text-muted-foreground">
                    {Object.entries(selectedItem.item.properties).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium">{key}:</span> {value as string}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Type:</span> {selectedItem.item.type}
                </div>
                {selectedItem.item.equipSlot && (
                  <div>
                    <span className="font-medium">Equip Slot:</span> {selectedItem.item.equipSlot}
                  </div>
                )}
                <div>
                  <span className="font-medium">Value:</span> {Math.floor(selectedItem.item.value / 10000)}g {Math.floor((selectedItem.item.value % 10000) / 100)}s {selectedItem.item.value % 100}c
                </div>
                <div>
                  <span className="font-medium">Weight:</span> {selectedItem.item.weight / 10} lb
                </div>
                <div>
                  <span className="font-medium">Quantity:</span> {selectedItem.characterItem.quantity}
                </div>
                {selectedItem.characterItem.acquiredFrom && (
                  <div>
                    <span className="font-medium">Source:</span> {selectedItem.characterItem.acquiredFrom}
                  </div>
                )}
              </div>
              
              {selectedItem.characterItem.notes && (
                <div>
                  <h4 className="font-medium">Notes</h4>
                  <p className="text-sm text-muted-foreground">{selectedItem.characterItem.notes}</p>
                </div>
              )}
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
              {selectedItem.item.equipSlot && (
                <Button
                  variant="outline"
                  onClick={() => toggleEquipMutation.mutate({
                    itemId: selectedItem.characterItem.id,
                    isEquipped: !selectedItem.characterItem.isEquipped
                  })}
                  disabled={toggleEquipMutation.isPending}
                >
                  {toggleEquipMutation.isPending
                    ? 'Processing...'
                    : selectedItem.characterItem.isEquipped ? 'Unequip' : 'Equip'}
                </Button>
              )}
              
              <Button
                variant="destructive"
                onClick={() => removeItemMutation.mutate(selectedItem.characterItem.id)}
                disabled={removeItemMutation.isPending}
              >
                {removeItemMutation.isPending ? 'Removing...' : 'Remove'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Currency Transaction Dialog */}
      <CurrencyTransactionDialog />
    </div>
  );
};

export default InventoryTab;