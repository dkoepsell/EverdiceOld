import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  AlertTriangle, 
  ThumbsUp, 
  MessageSquare, 
  Users, 
  User,
  Flag
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Form,
  FormControl,
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Define the announcement type
type Announcement = {
  id: number;
  userId: number;
  title: string;
  content: string;
  type: string;
  expiresAt?: string | null;
  campaignId?: number | null;
  isActive: boolean;
  status: string;
  flagCount: number;
  createdAt: string;
  updatedAt?: string | null;
};

// Schema for creating announcements
const announcementSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  type: z.string(),
  campaignId: z.number().optional(),
  expiresAt: z.string().optional(),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");

  const isAdmin = user?.id === 2 || user?.username === "KoeppyLoco " || user?.username === "KoeppyLoco"; // Updated check for KoeppyLoco admin

  // Query for fetching announcements
  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ['/api/announcements'],
    queryFn: async () => {
      const res = await fetch('/api/announcements');
      if (!res.ok) throw new Error('Failed to fetch announcements');
      return res.json();
    },
  });

  // Mutation for creating announcements
  const createMutation = useMutation({
    mutationFn: async (data: AnnouncementFormValues) => {
      const res = await apiRequest('POST', '/api/announcements', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      toast({
        title: "Announcement Created",
        description: "Your announcement has been submitted for approval.",
      });
      setCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for flagging announcements
  const flagMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/announcements/${id}/flag`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      toast({
        title: "Announcement Flagged",
        description: "This announcement has been flagged for review by moderators.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form for creating announcements
  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: "",
      content: "",
      type: "general",
    },
  });

  const onSubmit = (data: AnnouncementFormValues) => {
    createMutation.mutate(data);
  };

  // Filter announcements by type
  const filteredAnnouncements = announcements?.filter(announcement => {
    if (selectedTab === "all") return true;
    return announcement.type === selectedTab;
  });

  return (
    <div className="container py-8 mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Community Announcements</h1>
          <p className="text-muted-foreground">
            Find other players, join campaigns, and connect with the D&D community
          </p>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <Button variant="outline" className="gap-2" asChild>
              <a href="/admin/announcements">
                <Flag className="h-4 w-4" />
                Moderate Announcements
              </a>
            </Button>
          )}
          {user && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>Create Announcement</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create Announcement</DialogTitle>
                  <DialogDescription>
                    Share opportunities or find players for your campaigns.
                    All announcements will be reviewed before appearing publicly.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter a title for your announcement" />
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
                          <FormLabel>Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select announcement type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="general">General Announcement</SelectItem>
                              <SelectItem value="looking_for_players">Looking for Players</SelectItem>
                              <SelectItem value="looking_for_dm">Looking for DM</SelectItem>
                              <SelectItem value="campaign_announcement">Campaign Announcement</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Describe your announcement in detail..."
                              className="min-h-[120px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={createMutation.isPending}
                      >
                        {createMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Submit Announcement
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="looking_for_players" className="gap-2">
            <Users size={16} />
            Looking for Players
          </TabsTrigger>
          <TabsTrigger value="looking_for_dm" className="gap-2">
            <User size={16} />
            Looking for DM
          </TabsTrigger>
          <TabsTrigger value="campaign_announcement" className="gap-2">
            <MessageSquare size={16} />
            Campaign Announcements
          </TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredAnnouncements?.length === 0 ? (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No announcements found. Be the first to create one!
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAnnouncements?.map((announcement) => (
            <Card key={announcement.id} className="h-full flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <Badge
                      variant={
                        announcement.type === "looking_for_players"
                          ? "secondary"
                          : announcement.type === "looking_for_dm"
                          ? "outline"
                          : announcement.type === "campaign_announcement"
                          ? "default"
                          : "destructive"
                      }
                      className="mb-2"
                    >
                      {announcement.type === "looking_for_players"
                        ? "Looking for Players"
                        : announcement.type === "looking_for_dm"
                        ? "Looking for DM"
                        : announcement.type === "campaign_announcement"
                        ? "Campaign Announcement"
                        : "General"}
                    </Badge>
                    <CardTitle className="text-xl">{announcement.title}</CardTitle>
                  </div>
                  {user && user.id !== announcement.userId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => flagMutation.mutate(announcement.id)}
                      disabled={flagMutation.isPending}
                      title="Flag inappropriate content"
                    >
                      <Flag className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <CardDescription>
                  Posted on {new Date(announcement.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="whitespace-pre-line">{announcement.content}</p>
              </CardContent>
              <CardFooter className="pt-2 border-t">
                <div className="flex items-center text-sm text-muted-foreground">
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  <span>Connect with other players</span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Admin gets link to moderation page */}
      {isAdmin && (
        <div className="mt-8 p-4 border rounded-md bg-muted">
          <h2 className="text-lg font-semibold mb-2">Administrator Actions</h2>
          <p className="text-sm text-muted-foreground mb-4">
            You have admin privileges to moderate community announcements.
          </p>
          <Button
            variant="outline"
            asChild
          >
            <a href="/admin/announcements">Go to Announcement Moderation</a>
          </Button>
        </div>
      )}
    </div>
  );
}