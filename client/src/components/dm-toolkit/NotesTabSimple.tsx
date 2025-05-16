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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, RefreshCw, StickyNote } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Create note schema
const noteSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});

type DmNote = {
  id: number;
  campaignId: number;
  title: string;
  content: string;
  createdBy: number;
  createdAt: string;
};

type Campaign = {
  id: number;
  title: string;
};

export default function NotesTabSimple() {
  const { toast } = useToast();
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
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

  // Setup form for creating notes
  const form = useForm<z.infer<typeof noteSchema>>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: "",
      content: "",
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
        isPrivate: true,
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
      form.reset();
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

  // Handle form submission
  const onSubmit = (data: z.infer<typeof noteSchema>) => {
    createNoteMutation.mutate(data);
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
        </CardFooter>
      </Card>

      {/* Create Note Form */}
      {selectedCampaignId && (
        <Card>
          <CardHeader>
            <CardTitle>Create a Note</CardTitle>
            <CardDescription>Add a new DM note for your campaign</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
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
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Note content" 
                          className="min-h-[150px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit"
                  disabled={createNoteMutation.isPending}
                  className="w-full"
                >
                  {createNoteMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Note
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Notes List */}
      {selectedCampaignId && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mt-6">
            <h3 className="text-xl font-semibold">Your Notes</h3>
          </div>
          
          {isLoadingNotes ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Loading notes...</span>
            </div>
          ) : notes.length === 0 ? (
            <Card className="p-8 text-center">
              <StickyNote className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                You haven't created any notes for this campaign yet.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.map((note) => (
                <Card key={note.id} className="overflow-hidden border hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium">{note.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <p className="line-clamp-3 text-sm">{note.content}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}