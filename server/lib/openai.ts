import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface CampaignGenerationRequest {
  theme?: string;
  difficulty?: string;
  narrativeStyle?: string;
  numberOfSessions?: number;
}

export interface CampaignGenerationResponse {
  title: string;
  description: string;
  difficulty: string;
  narrativeStyle: string;
  startingLocation: string;
  mainNPC: string;
  mainQuest: string;
  sideQuests: string[];
  suggestedLevel: number;
}

export async function generateCampaign(req: CampaignGenerationRequest): Promise<CampaignGenerationResponse> {
  try {
    const prompt = `
Create a D&D campaign with the following parameters:
${req.theme ? `Theme: ${req.theme}` : 'Theme: Fantasy (create a suitable theme if none specified)'}
${req.difficulty ? `Difficulty: ${req.difficulty}` : 'Difficulty: Normal (balanced challenge)'}
${req.narrativeStyle ? `Narrative Style: ${req.narrativeStyle}` : 'Narrative Style: Descriptive'}
${req.numberOfSessions ? `Expected Number of Sessions: ${req.numberOfSessions}` : 'Expected Number of Sessions: 5'}

Please generate a complete D&D campaign overview in JSON format with these fields:
- title: A catchy title for the campaign
- description: A compelling 3-4 sentence description that outlines the main themes and hooks
- difficulty: The campaign difficulty (Easy, Normal, Hard)
- narrativeStyle: The narrative style (Descriptive, Dramatic, Humorous, etc.)
- startingLocation: Where the adventure begins
- mainNPC: The key non-player character that drives the plot
- mainQuest: The primary objective of the campaign
- sideQuests: An array of 3 side quests that complement the main story
- suggestedLevel: Recommended starting character level (1-10)

Format the response as a valid JSON object without explanation.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    // Make sure we have a response and it's valid JSON
    if (!response.choices || !response.choices[0] || !response.choices[0].message || !response.choices[0].message.content) {
      throw new Error("Invalid response from OpenAI API");
    }

    const responseContent = response.choices[0].message.content;
    
    try {
      const result = JSON.parse(responseContent);
      
      // Validate the required fields
      if (!result.title || !result.description || !result.difficulty || !result.narrativeStyle) {
        throw new Error("Missing required fields in campaign generation response");
      }
      
      return result as CampaignGenerationResponse;
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      console.log("Raw response content:", responseContent);
      
      // Return a fallback campaign with default values
      return {
        title: req.theme ? `${req.theme} Adventure` : "The Forgotten Realms",
        description: "A heroic adventure in a fantasy world full of mystery and danger. Brave adventurers must face ancient threats and uncover forgotten secrets.",
        difficulty: req.difficulty || "Normal - Balanced Challenge",
        narrativeStyle: req.narrativeStyle || "Descriptive",
        startingLocation: "A small coastal village",
        mainNPC: "The village elder who calls for help",
        mainQuest: "Discover the source of a mysterious threat endangering the region",
        sideQuests: [
          "Rescue villagers captured by bandits",
          "Recover a lost family heirloom from a dangerous cave",
          "Negotiate peace between warring factions"
        ],
        suggestedLevel: 1
      };
    }
  } catch (error) {
    console.error("Error generating campaign with OpenAI:", error);
    
    // Return a fallback campaign instead of throwing an error
    return {
      title: req.theme ? `${req.theme} Adventure` : "The Forgotten Realms",
      description: "A heroic adventure in a fantasy world full of mystery and danger. Brave adventurers must face ancient threats and uncover forgotten secrets.",
      difficulty: req.difficulty || "Normal - Balanced Challenge",
      narrativeStyle: req.narrativeStyle || "Descriptive",
      startingLocation: "A small coastal village",
      mainNPC: "The village elder who calls for help",
      mainQuest: "Discover the source of a mysterious threat endangering the region",
      sideQuests: [
        "Rescue villagers captured by bandits",
        "Recover a lost family heirloom from a dangerous cave",
        "Negotiate peace between warring factions"
      ],
      suggestedLevel: 1
    };
  }
}