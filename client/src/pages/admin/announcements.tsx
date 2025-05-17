import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "wouter";

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
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Loader2, CheckCircle, XCircle, Flag, AlertTriangle, 
  MessageSquare, Trash2, Eye, Filter 
} from "lucide-react";

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
  flaggedBy?: number[];
  moderationNotes?: string | null;
  moderatedBy?: number | null;
  moderatedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

// Moderation form schema
const moderationSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  notes: z.string().optional(),
});

type ModerationValues = z.infer<typeof moderationSchema>;

export default function AdminAnnouncementsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [navigate] = useNavigate();
  const [selectedTab, setSelectedTab] = useState("pending");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [moderationDialogOpen, setModerationDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Check if user is an admin
  const isAdmin = user?.id === 1; // Simple check for admin - adjust as needed

  // Redirect non-admins
  if (!isAdmin && user !== null) {
    navigate("/");
  }

  // Query for fetching pending announcements
  const { data: pendingAnnouncements, isLoading: pendingLoading } = useQuery<Announcement[]>({
    queryKey: ['/api/admin/announcements/pending'],
    queryFn: async () => {
      const res = await fetch('/api/admin/announcements/pending');
      if (!res.ok) throw new Error('Failed to fetch pending announcements');
      return res.json();
    },
    enabled: !!isAdmin,
  });

  // Query for fetching flagged announcements
  const { data: flaggedAnnouncements, isLoading: flaggedLoading } = useQuery<Announcement[]>({
    queryKey: ['/api/admin/announcements/flagged'],
    queryFn: async () => {
      const res = await fetch('/api/admin/announcements/flagged');
      if (!res.ok) throw new Error('Failed to fetch flagged announcements');
      return res.json();
    },
    enabled: !!isAdmin,
  });

  // Query for all announcements
  const { data: allAnnouncements, isLoading: allLoading } = useQuery<Announcement[]>({
    queryKey: ['/api/announcements/all'],
    queryFn: async () => {
      const res = await fetch('/api/announcements/all');
      if (!res.ok) throw new Error('Failed to fetch all announcements');
      return res.json();
    },
    enabled: !!isAdmin,
  });

  // Mutation for moderating announcements
  const moderateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: ModerationValues;
    }) => {
      const res = await apiRequest(
        'POST',
        `/api/admin/announcements/${id}/moderate`,
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate all announcement queries
      queryClient.invalidateQueries({ queryKey: ['/api/admin/announcements/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/announcements/flagged'] });
      queryClient.invalidateQueries({ queryKey: ['/api/announcements/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      
      toast({
        title: "Announcement Moderated",
        description: "The announcement has been successfully moderated.",
      });
      setModerationDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting announcements
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/admin/announcements/${id}`);
    },
    onSuccess: () => {
      // Invalidate all announcement queries
      queryClient.invalidateQueries({ queryKey: ['/api/admin/announcements/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/announcements/flagged'] });
      queryClient.invalidateQueries({ queryKey: ['/api/announcements/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      
      toast({
        title: "Announcement Deleted",
        description: "The announcement has been permanently removed.",
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

  // Form for moderating announcements
  const form = useForm<ModerationValues>({
    resolver: zodResolver(moderationSchema),
    defaultValues: {
      status: "approved",
      notes: "",
    },
  });

  // Handle moderation submit
  const onModerate = (data: ModerationValues) => {
    if (selectedAnnouncement) {
      moderateMutation.mutate({
        id: selectedAnnouncement.id,
        data,
      });
    }
  };

  // Handle opening the moderation dialog
  const handleModerate = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    // Reset form with defaults
    form.reset({
      status: "approved",
      notes: "",
    });
    setModerationDialogOpen(true);
  };

  // Handle viewing announcement details
  const handleView = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setViewDialogOpen(true);
  };

  // Handle deleting an announcement
  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to permanently delete this announcement?")) {
      deleteMutation.mutate(id);
    }
  };

  // Get the right announcements based on the selected tab
  const getAnnouncementsForTab = () => {
    switch (selectedTab) {
      case "pending":
        return pendingAnnouncements || [];
      case "flagged":
        return flaggedAnnouncements || [];
      case "all":
        return allAnnouncements || [];
      default:
        return [];
    }
  };

  // Loading state for the current tab
  const isCurrentTabLoading = () => {
    switch (selectedTab) {
      case "pending":
        return pendingLoading;
      case "flagged":
        return flaggedLoading;
      case "all":
        return allLoading;
      default:
        return false;
    }
  };

  // Format date for display
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="container py-8 mx-auto">
      {!user ? (
        <div className="flex justify-center items-center h-[70vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !isAdmin ? (
        <Alert variant="destructive">
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to access this page.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Announcement Moderation</h1>
              <p className="text-muted-foreground">
                Review, approve, or reject community announcements
              </p>
            </div>
            <Button variant="outline" asChild>
              <a href="/announcements">View Public Announcements</a>
            </Button>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="gap-2">
                <Filter size={16} />
                Pending Review
              </TabsTrigger>
              <TabsTrigger value="flagged" className="gap-2">
                <Flag size={16} />
                Flagged Content
              </TabsTrigger>
              <TabsTrigger value="all">All Announcements</TabsTrigger>
            </TabsList>
          </Tabs>

          {isCurrentTabLoading() ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : getAnnouncementsForTab().length === 0 ? (
            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No {selectedTab === "pending" ? "pending" : selectedTab === "flagged" ? "flagged" : ""} announcements found.
              </AlertDescription>
            </Alert>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedTab === "pending"
                    ? "Pending Announcements"
                    : selectedTab === "flagged"
                    ? "Flagged Announcements"
                    : "All Announcements"}
                </CardTitle>
                <CardDescription>
                  {selectedTab === "pending"
                    ? "Review and approve new announcements before they appear publicly"
                    : selectedTab === "flagged"
                    ? "Review announcements that users have flagged as inappropriate"
                    : "Complete list of all announcements in the system"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Flags</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getAnnouncementsForTab().map((announcement) => (
                      <TableRow key={announcement.id}>
                        <TableCell className="font-medium">
                          {announcement.title}
                        </TableCell>
                        <TableCell>
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
                          >
                            {announcement.type === "looking_for_players"
                              ? "Looking for Players"
                              : announcement.type === "looking_for_dm"
                              ? "Looking for DM"
                              : announcement.type === "campaign_announcement"
                              ? "Campaign"
                              : "General"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              announcement.status === "approved"
                                ? "success"
                                : announcement.status === "rejected"
                                ? "destructive"
                                : "default"
                            }
                          >
                            {announcement.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {announcement.flagCount > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {announcement.flagCount}
                            </span>
                          ) : (
                            "0"
                          )}
                        </TableCell>
                        <TableCell>{formatDate(announcement.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleView(announcement)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleModerate(announcement)}
                            >
                              {announcement.status === "pending" ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <MessageSquare className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDelete(announcement.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Moderation Dialog */}
          <Dialog open={moderationDialogOpen} onOpenChange={setModerationDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Moderate Announcement</DialogTitle>
                <DialogDescription>
                  Review and moderate this announcement. Approved announcements will be visible to users.
                </DialogDescription>
              </DialogHeader>
              {selectedAnnouncement && (
                <>
                  <div className="border rounded-lg p-4 mb-4">
                    <h3 className="font-semibold mb-2">{selectedAnnouncement.title}</h3>
                    <Badge className="mb-2">{selectedAnnouncement.type}</Badge>
                    <p className="whitespace-pre-line text-sm mb-2">{selectedAnnouncement.content}</p>
                    <div className="text-xs text-muted-foreground">
                      Posted: {formatDate(selectedAnnouncement.createdAt)}
                    </div>
                  </div>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onModerate)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Decision</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select moderation action" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="approved">Approve</SelectItem>
                                <SelectItem value="rejected">Reject</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Approve to make the announcement public or reject to hide it
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Moderation Notes</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Add notes about why this announcement was approved or rejected (optional)"
                              />
                            </FormControl>
                            <FormDescription>
                              These notes are for administrator reference only
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button
                          type="submit"
                          disabled={moderateMutation.isPending}
                        >
                          {moderateMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Save Decision
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </>
              )}
            </DialogContent>
          </Dialog>

          {/* View Dialog */}
          <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Announcement Details</DialogTitle>
              </DialogHeader>
              {selectedAnnouncement && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{selectedAnnouncement.title}</h3>
                    <Badge className="mb-4">{selectedAnnouncement.type}</Badge>
                    <div className="border rounded-lg p-4 mb-4 whitespace-pre-line">
                      {selectedAnnouncement.content}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold">Status</p>
                      <Badge
                        variant={
                          selectedAnnouncement.status === "approved"
                            ? "success"
                            : selectedAnnouncement.status === "rejected"
                            ? "destructive"
                            : "default"
                        }
                      >
                        {selectedAnnouncement.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="font-semibold">Flag Count</p>
                      <p>{selectedAnnouncement.flagCount || 0}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Created At</p>
                      <p>{formatDate(selectedAnnouncement.createdAt)}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Last Updated</p>
                      <p>{formatDate(selectedAnnouncement.updatedAt)}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Last Moderated</p>
                      <p>{formatDate(selectedAnnouncement.moderatedAt)}</p>
                    </div>
                    <div>
                      <p className="font-semibold">User ID</p>
                      <p>{selectedAnnouncement.userId}</p>
                    </div>
                  </div>

                  {selectedAnnouncement.moderationNotes && (
                    <div className="mt-4">
                      <p className="font-semibold">Moderation Notes</p>
                      <div className="border rounded-lg p-3 bg-muted mt-1">
                        {selectedAnnouncement.moderationNotes}
                      </div>
                    </div>
                  )}

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setViewDialogOpen(false);
                        handleModerate(selectedAnnouncement);
                      }}
                    >
                      Moderate
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setViewDialogOpen(false);
                        handleDelete(selectedAnnouncement.id);
                      }}
                    >
                      Delete
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}