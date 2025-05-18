import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Campaign, CampaignSession } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkle, Loader2 } from "lucide-react";

interface SimpleCampaignPanelProps {
  campaign: Campaign;
}

export default function SimpleCampaignPanel({ campaign }: SimpleCampaignPanelProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isAdvancingStory, setIsAdvancingStory] = useState(false);
  
  const isDM = campaign.userId === user?.id;
  
  // Campaign sessions - simple version
  const { 
    data: sessions = [], 
    isLoading: sessionsLoading,
    refetch: refetchSessions
  } = useQuery({
    queryKey: [`/api/campaigns/${campaign.id}/sessions`]
  });
  
  // Basic story advancement
  const advanceStory = useMutation({
    mutationFn: async (action: string) => {
      const response = await apiRequest("POST", `/api/campaigns/${campaign.id}/advance`, {
        action,
        sessionNumber: campaign.currentSession || 1
      });
      return response.json();
    },
    onSuccess: (data) => {
      refetchSessions();
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaign.id}`] });
      toast({
        title: "Story advanced",
        description: "The story has been advanced successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to advance story",
        description: "An error occurred while advancing the story. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold text-purple-800 mb-4">{campaign.title}</h2>
      <p className="mb-6 text-gray-600">{campaign.description}</p>
      
      {/* Debug Info */}
      <div className="p-3 bg-gray-100 rounded-md border border-gray-200 text-xs font-mono overflow-auto max-h-32 mb-4">
        <p>Campaign ID: {campaign.id}</p>
        <p>Sessions Array: {Array.isArray(sessions) ? 'Yes' : 'No'}</p>
        <p>Sessions Count: {Array.isArray(sessions) ? sessions.length : 'Not an array'}</p>
        <p>First Session: {Array.isArray(sessions) && sessions.length > 0 ? 
          `ID: ${sessions[0].id}, Session #: ${sessions[0].sessionNumber}` : 'None'}
        </p>
      </div>
      
      {sessionsLoading ? (
        <div className="mt-6">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-40 w-full mb-4" />
        </div>
      ) : Array.isArray(sessions) && sessions.length > 0 ? (
        <div>
          <h3 className="font-semibold mb-2">Latest Session:</h3>
          <div className="bg-amber-50 p-4 rounded-md border border-amber-100">
            {sessions[0].narrative ? (
              <p className="whitespace-pre-line">{sessions[0].narrative.substring(0, 300)}...</p>
            ) : (
              <p>Session content not available</p>
            )}
          </div>
          
          <Button 
            className="mt-4"
            onClick={() => refetchSessions()}
          >
            Refresh Sessions
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold">No Sessions Available</h3>
          <p className="text-muted-foreground">
            This campaign has no sessions yet. 
            {isDM ? " Start your adventure by creating the first session." : " Wait for the DM to begin the campaign."}
          </p>
          
          {/* Create session button for DM */}
          {isDM && (
            <Button 
              className="mt-4"
              onClick={() => {
                setIsAdvancingStory(true);
                advanceStory.mutate("begin the adventure", {
                  onSettled: () => {
                    setIsAdvancingStory(false);
                    setTimeout(() => {
                      refetchSessions();
                    }, 1000);
                  }
                });
              }}
              disabled={isAdvancingStory}
            >
              {isAdvancingStory ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Session...
                </>
              ) : (
                <>
                  <Sparkle className="h-4 w-4 mr-2" />
                  Create First Session
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}