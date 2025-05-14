import { apiRequest } from "./queryClient";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

export interface StoryRequest {
  campaignId?: number;
  prompt: string;
  narrativeStyle?: string;
  difficulty?: string;
  storyDirection?: string;
  currentLocation?: string;
}

export interface StoryResponse {
  narrative: string;
  choices: Array<{
    action: string;
    description: string;
    icon: string;
  }>;
  sessionTitle: string;
}

export const generateStory = async (storyRequest: StoryRequest): Promise<StoryResponse> => {
  try {
    const response = await apiRequest(
      "POST",
      "/api/openai/generate-story",
      storyRequest
    );
    
    return await response.json();
  } catch (error) {
    console.error("Error generating story:", error);
    throw new Error("Failed to generate story. Please try again.");
  }
};

export interface CharacterSuggestion {
  name: string;
  race: string;
  class: string;
  background: string;
  alignment: string;
  personality: string;
  backstory: string;
}

export const generateCharacterSuggestion = async (
  prompt: string
): Promise<CharacterSuggestion> => {
  try {
    const response = await apiRequest(
      "POST",
      "/api/openai/generate-character",
      { prompt }
    );
    
    return await response.json();
  } catch (error) {
    console.error("Error generating character suggestion:", error);
    throw new Error("Failed to generate character suggestion. Please try again.");
  }
};

export interface RuleExplanation {
  title: string;
  explanation: string;
  examples: string[];
}

export const explainRule = async (
  ruleTopic: string
): Promise<RuleExplanation> => {
  try {
    const response = await apiRequest(
      "POST",
      "/api/openai/explain-rule",
      { ruleTopic }
    );
    
    return await response.json();
  } catch (error) {
    console.error("Error explaining rule:", error);
    throw new Error("Failed to explain the rule. Please try again.");
  }
};
