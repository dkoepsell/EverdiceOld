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
    requiresDiceRoll?: boolean;
    diceType?: string;
    rollDC?: number;
    rollModifier?: number;
    rollPurpose?: string;
    successText?: string;
    failureText?: string;
  }>;
  sessionTitle: string;
  location: string;
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
    
    const data = await response.json();
    
    // Check if we got an error message from the server
    if (data.message && data.message.includes("Failed")) {
      throw new Error(data.message);
    }
    
    // Validate that we have the expected data structure
    if (!data.name || !data.race || !data.class) {
      console.warn("Received incomplete character data, using fallback");
      return getFallbackCharacter();
    }
    
    return data;
  } catch (error) {
    console.error("Error generating character suggestion:", error);
    // Return a fallback character instead of throwing an error
    return getFallbackCharacter();
  }
};

// Provide a complete fallback character when API fails
function getFallbackCharacter(): CharacterSuggestion {
  const characters: CharacterSuggestion[] = [
    {
      name: "Thorne Ironfist",
      race: "Dwarf",
      class: "Fighter",
      background: "Soldier",
      alignment: "Lawful Good",
      personality: "Brave, loyal, and occasionally stubborn. Values honor above all.",
      backstory: "Born to a clan of master smiths, Thorne chose to use weapons rather than forge them. After years in the mountain kingdom's elite guard, he now seeks glory beyond his homeland's borders."
    },
    {
      name: "Lyra Silverheart",
      race: "Half-Elf",
      class: "Ranger", 
      background: "Outlander",
      alignment: "Chaotic Good",
      personality: "Independent, resourceful, and protective of nature.",
      backstory: "Raised between two worlds, Lyra found solace in the wilderness. After her village was raided by orcs, she dedicated her life to protecting isolated communities from monstrous threats."
    },
    {
      name: "Grimshaw Thorngage",
      race: "Gnome",
      class: "Wizard",
      background: "Sage",
      alignment: "Neutral Good",
      personality: "Curious, eccentric, and brilliant, with a tendency to speak too quickly when excited.",
      backstory: "Once a junior librarian at a prestigious academy, Grimshaw left after an 'unauthorized experiment' damaged a historic collection. Now he tests his magical theories in the field, often with surprising results."
    }
  ];
  
  // Return a random character from our fallbacks
  return characters[Math.floor(Math.random() * characters.length)];
}

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
