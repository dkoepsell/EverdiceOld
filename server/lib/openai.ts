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
  startingLocation?: string;
  mainNPC?: string;
  mainQuest?: string;
  sideQuests?: string[];
  suggestedLevel?: number;
  totalSessions?: number;
}

export async function generateCampaign(req: CampaignGenerationRequest): Promise<CampaignGenerationResponse> {
  try {
    // Use a simpler prompt with fewer fields to increase reliability
    const prompt = `
Create a D&D campaign with the following parameters:
${req.theme ? `Theme: ${req.theme}` : 'Theme: Fantasy (create a suitable theme if none specified)'}
${req.difficulty ? `Difficulty: ${req.difficulty}` : 'Difficulty: Normal (balanced challenge)'}
${req.narrativeStyle ? `Narrative Style: ${req.narrativeStyle}` : 'Narrative Style: Descriptive'}
${req.numberOfSessions ? `Expected Number of Sessions: ${req.numberOfSessions}` : 'Expected Number of Sessions: 35'}

Please generate a D&D campaign in JSON format with the following fields:
{
  "title": "A compelling title for the campaign",
  "description": "A vivid description of the campaign in 2-3 sentences",
  "difficulty": "The difficulty level (match the input difficulty)",
  "narrativeStyle": "The narrative style (match the input style)",
  "totalSessions": "Recommended number of sessions (number between 20-50)"
}

Format your response ONLY as a valid JSON object with no additional text.
`;

    console.log("Sending prompt to OpenAI:", prompt);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 500, // Limit the response size to reduce errors
      });

      console.log("OpenAI response received");

      if (!response.choices || !response.choices[0] || !response.choices[0].message) {
        console.error("Invalid response structure from OpenAI");
        throw new Error("Invalid response from OpenAI API");
      }

      // Get the content of the response
      const responseContent = response.choices[0].message.content;
      console.log("Response content:", responseContent);

      if (!responseContent) {
        console.error("Empty response content from OpenAI");
        throw new Error("Empty response from OpenAI API");
      }

      // Parse the JSON response
      const campaignData = JSON.parse(responseContent);
      
      // Construct a campaign object with required fields
      const campaign: CampaignGenerationResponse = {
        title: campaignData.title || (req.theme ? `${req.theme} Adventure` : "New Adventure"),
        description: campaignData.description || "An exciting adventure awaits brave heroes in a world of mystery and danger.",
        difficulty: campaignData.difficulty || req.difficulty || "Normal - Balanced Challenge",
        narrativeStyle: campaignData.narrativeStyle || req.narrativeStyle || "Descriptive",
        totalSessions: campaignData.totalSessions ? parseInt(campaignData.totalSessions.toString()) : req.numberOfSessions || 35
      };

      return campaign;
    } catch (apiError) {
      console.error("Error calling OpenAI API:", apiError);
      
      // Custom campaign based on theme
      const themeTitle = req.theme ? `${req.theme}` : "Fantasy Adventure";
      return {
        title: `${themeTitle.charAt(0).toUpperCase() + themeTitle.slice(1)}`,
        description: `In this thrilling ${req.difficulty?.toLowerCase() || 'balanced'} campaign, heroes will embark on a journey through a ${req.theme?.toLowerCase() || 'mysterious'} world filled with danger and adventure. Brave warriors must overcome great challenges and uncover ancient secrets to save the realm.`,
        difficulty: req.difficulty || "Normal - Balanced Challenge",
        narrativeStyle: req.narrativeStyle || "Descriptive",
        totalSessions: req.numberOfSessions || 35
      };
    }
  } catch (error) {
    console.error("Unexpected error in generateCampaign:", error);
    
    // Final fallback
    return {
      title: req.theme ? `${req.theme} Adventure` : "The Forgotten Realms",
      description: "A heroic adventure in a fantasy world full of mystery and danger. Brave adventurers must face ancient threats and uncover forgotten secrets.",
      difficulty: req.difficulty || "Normal - Balanced Challenge",
      narrativeStyle: req.narrativeStyle || "Descriptive",
      totalSessions: req.numberOfSessions || 35
    };
  }
}