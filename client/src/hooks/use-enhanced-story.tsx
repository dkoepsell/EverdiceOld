import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

/**
 * Custom hook to use the enhanced story generation API
 * @returns Methods to work with enhanced story API
 */
export function useEnhancedStory() {
  // Mutation for advancing the story with better narrative continuity
  const advanceStory = useMutation({
    mutationFn: async (actionDescription: string) => {
      const campaignId = localStorage.getItem("currentCampaignId");
      if (!campaignId) {
        throw new Error("No active campaign selected");
      }
      
      const res = await apiRequest(
        "POST", 
        "/api/story/advance", 
        {
          campaignId: parseInt(campaignId),
          action: actionDescription
        }
      );
      
      const data = await res.json();
      return data;
    }
  });
  
  return {
    advanceStory
  };
}