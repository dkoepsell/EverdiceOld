import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Edit, MoreHorizontal, Trash, RefreshCw, Eye, EyeOff, Search, Filter, StickyNote } from "lucide-react";
import { format } from "date-fns";

// Create note schema
const noteSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  isPrivate: z.boolean().default(true),
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.coerce.number().optional(),
});

type DmNote = {
  id: number;
  campaignId: number;
  title: string;
  content: string;
  isPrivate: boolean;
  relatedEntityType?: string;
  relatedEntityId?: number;
  createdBy: number;
  createdAt: string;
  updatedAt?: string;
};

type Campaign = {
  id: number;
  title: string;
};

type RelatedEntity = {
  id: number;
  name: string;
  type: string;
};

export default function NotesTab() {
  const { toast } = useToast();
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedNote, setSelectedNote] = useState<DmNote | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0); // Used to trigger refresh

  // Fetch campaigns
  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
    refetchOnWindowFocus: false,
  });

  // Fetch notes if a campaign is selected
  const { data: notes = [], isLoading: isLoadingNotes } = useQuery<DmNote[]>({
    queryKey: ["/api/campaigns", selectedCampaignId, "notes", refreshKey],
    enabled: !!selectedCampaignId,
    refetchOnWindowFocus: false,
  });

  // Filter notes based on search query
  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Setup form for creating notes
  const createForm = useForm<z.infer<typeof noteSchema>>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: "",
      content: "",
      isPrivate: true,
    },
  });

  // Setup form for editing notes
  const editForm = useForm<z.infer<typeof noteSchema>>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: "",
      content: "",
      isPrivate: true,
    },
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (data: z.infer<typeof noteSchema>) => {
      if (!selectedCampaignId) {
        throw new Error("No campaign selected");
      }
      const response = await apiRequest("POST", `/api/campaigns/${selectedCampaignId}/notes`, {
        ...data,
        campaignId: selectedCampaignId,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create note");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Note created!",
        description: "Your note has been created successfully.",
      });
      setShowCreateDialog(false);
      createForm.reset();
      setRefreshKey(prev => prev + 1); // Refresh the list
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async (data: z.infer<typeof noteSchema> & { id: number }) => {
      if (!selectedCampaignId) {
        throw new Error("No campaign selected");
      }
      const { id, ...noteData } = data;
      const response = await apiRequest("PATCH", `/api/campaigns/${selectedCampaignId}/notes/${id}`, noteData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update note");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Note updated!",
        description: "Your note has been updated successfully.",
      });
      setShowEditDialog(false);
      setSelectedNote(null);
      setRefreshKey(prev => prev + 1); // Refresh the list
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      if (!selectedCampaignId) {
        throw new Error("No campaign selected");
      }
      const response = await apiRequest("DELETE", `/api/campaigns/${selectedCampaignId}/notes/${noteId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete note");
      }
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Note deleted",
        description: "The note has been deleted.",
      });
      setRefreshKey(prev => prev + 1); // Refresh the list
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle create form submission
  const onCreateSubmit = (data: z.infer<typeof noteSchema>) => {
    createNoteMutation.mutate(data);
  };

  // Handle edit form submission
  const onEditSubmit = (data: z.infer<typeof noteSchema>) => {
    if (selectedNote) {
      updateNoteMutation.mutate({ ...data, id: selectedNote.id });
    }
  };

  // Handle edit note
  const handleEditNote = (note: DmNote) => {
    setSelectedNote(note);
    editForm.reset({
      title: note.title,
      content: note.content,
      isPrivate: note.isPrivate,
      relatedEntityType: note.relatedEntityType,
      relatedEntityId: note.relatedEntityId,
    });
    setShowEditDialog(true);
  };

  // Format the date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy h:mm a");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-fantasy font-semibold">Campaign Notes</h2>
          <p className="text-muted-foreground">Create and manage private DM notes for your campaigns</p>
        </div>
      </div>

      {/* Campaign Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Select a Campaign</CardTitle>
          <CardDescription>Choose a campaign to manage notes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Select
              value={selectedCampaignId?.toString() || ""}
              onValueChange={(value) => setSelectedCampaignId(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a campaign" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingCampaigns ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Loading campaigns...</span>
                  </div>
                ) : (
                  campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id.toString()}>
                      {campaign.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline"
            onClick={() => setRefreshKey(prev => prev + 1)}
            disabled={!selectedCampaignId}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => setShowCreateDialog(true)}
            disabled={!selectedCampaignId}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Note
          </Button>
        </CardFooter>
      </Card>

      {/* Notes List */}
      {selectedCampaignId && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mt-6">
            <h3 className="text-xl font-semibold">Campaign Notes</h3>
            
            {/* Search bar */}
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {isLoadingNotes ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Loading notes...</span>
            </div>
          ) : filteredNotes.length === 0 ? (
            <Card className="p-8 text-center">
              <StickyNote className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "No notes match your search query." : "You haven't created any notes for this campaign yet."}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Note
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map((note) => (
                <Card key={note.id} className="overflow-hidden border hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-lg font-medium">{note.title}</CardTitle>
                      <div className="flex items-center space-x-1">
                        {note.isPrivate ? (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <EyeOff className="h-3 w-3" /> Private
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Eye className="h-3 w-3" /> Shared
                          </Badge>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Manage Note</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleEditNote(note)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Note
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => deleteNoteMutation.mutate(note.id)}
                              className="text-red-500"
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Delete Note
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <CardDescription className="text-xs flex justify-between mt-1">
                      <span>Created: {formatDate(note.createdAt)}</span>
                      {note.updatedAt && <span>Updated: {formatDate(note.updatedAt)}</span>}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <p className="line-clamp-3 text-sm">{note.content}</p>
                    </div>
                    
                    {(note.relatedEntityType && note.relatedEntityId) && (
                      <div className="mt-3 text-xs text-muted-foreground">
                        <span className="font-medium">Related to: </span>
                        {note.relatedEntityType} #{note.relatedEntityId}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end pt-0">
                    <Button variant="ghost" size="sm" onClick={() => handleEditNote(note)}>
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Note Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Note</DialogTitle>
            <DialogDescription>
              Add a new note for your campaign
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Note title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Note content" 
                        className="min-h-[200px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="isPrivate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Private Note</FormLabel>
                      <FormDescription>
                        If enabled, this note will only be visible to you.
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
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="relatedEntityType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Entity Type (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          <SelectItem value="character">Character</SelectItem>
                          <SelectItem value="npc">NPC</SelectItem>
                          <SelectItem value="location">Location</SelectItem>
                          <SelectItem value="quest">Quest</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Link this note to a game entity
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="relatedEntityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entity ID (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="ID of the related entity" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createNoteMutation.isPending}
                >
                  {createNoteMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Note"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>
              Update your campaign note
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Note title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Note content" 
                        className="min-h-[200px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="isPrivate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Private Note</FormLabel>
                      <FormDescription>
                        If enabled, this note will only be visible to you.
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
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="relatedEntityType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Entity Type (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          <SelectItem value="character">Character</SelectItem>
                          <SelectItem value="npc">NPC</SelectItem>
                          <SelectItem value="location">Location</SelectItem>
                          <SelectItem value="quest">Quest</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Link this note to a game entity
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="relatedEntityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entity ID (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="ID of the related entity" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateNoteMutation.isPending}
                >
                  {updateNoteMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Note"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}