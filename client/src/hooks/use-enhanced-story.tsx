import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

/**
 * Custom hook to use the enhanced story generation API
 * @returns Methods to work with enhanced story API
 */
export function useEnhancedStory() {
  const queryClient = useQueryClient();

  // Mutation for advancing the story with better narrative continuity
  const advanceStory = useMutation({
    mutationFn: async ({ 
      campaignId, 
      actionDescription,
      narrativeStyle,
      difficulty 
    }: {
      campaignId: number;
      actionDescription: string;
      narrativeStyle?: string;
      difficulty?: string;
    }) => {
      const res = await apiRequest(
        "POST", 
        "/api/story/advance", 
        {
          campaignId,
          action: actionDescription,
          narrativeStyle,
          difficulty
        }
      );
      
      const data = await res.json();
      return data;
    },
    onSuccess: (data, variables) => {
      if (data.session && data.campaignId) {
        // Update sessions data in the cache
        queryClient.invalidateQueries({ 
          queryKey: [`/api/campaigns/${variables.campaignId}/sessions`] 
        });
        
        // Update campaign data
        queryClient.invalidateQueries({ 
          queryKey: ['/api/campaigns'] 
        });

        // Store the most recent session directly in cache for immediate display
        const sessionsQueryKey = [`/api/campaigns/${variables.campaignId}/sessions`];
        const sessions = queryClient.getQueryData(sessionsQueryKey);
        
        if (sessions) {
          const updatedSessions = [...(sessions as any[]), data.session];
          queryClient.setQueryData(sessionsQueryKey, updatedSessions);
        }
        
        // Update the campaign to reflect new session
        const campaignQueryKey = [`/api/campaigns/${variables.campaignId}`];
        const campaign = queryClient.getQueryData(campaignQueryKey);
        
        if (campaign) {
          const updatedCampaign = {
            ...(campaign as any),
            currentSession: data.newSessionNumber || data.session.sessionNumber
          };
          queryClient.setQueryData(campaignQueryKey, updatedCampaign);
        }
      }
    }
  });
  
  return {
    advanceStory
  };
}