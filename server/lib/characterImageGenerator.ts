import OpenAI from "openai";
import { ImagesResponse } from "openai/resources";

// This function generates character portraits using OpenAI's DALL-E
export async function generateCharacterPortrait(characterDescription: {
  name: string;
  race: string;
  class: string;
  background?: string;
  appearance?: string;
}): Promise<{ url: string }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured");
  }

  const { name, race, class: characterClass, background, appearance } = characterDescription;
  
  // Create a detailed prompt for the image generation
  const prompt = createImagePrompt(name, race, characterClass, background, appearance);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    console.log(`Generating character portrait with prompt: ${prompt}`);
    
    const response: ImagesResponse = await openai.images.generate({
      model: "dall-e-3", // the newest OpenAI image model
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "vivid",
    });

    const imageData = response.data[0];
    if (!imageData || !imageData.url) {
      throw new Error("No image data returned from OpenAI");
    }
    return { url: imageData.url };
  } catch (error: any) {
    console.error("Error generating character portrait:", error.message);
    throw new Error(`Failed to generate character portrait: ${error.message}`);
  }
}

// Helper function to create a detailed prompt for DALL-E
function createImagePrompt(
  name: string,
  race: string,
  characterClass: string,
  background?: string,
  appearance?: string
): string {
  // Base prompt with high-quality fantasy art direction
  let prompt = `Create a high-quality fantasy character portrait of ${name}, a ${race} ${characterClass}`;

  // Add background context if available
  if (background) {
    prompt += ` with a background as a ${background}`;
  }

  // Add appearance details if available
  if (appearance) {
    prompt += `. ${appearance}`;
  }

  // Add artistic style direction
  prompt += `. The style should be detailed fantasy art, with dramatic lighting and a heroic pose. Focus on the character's face and upper body, with appropriate attire and equipment for their class. Make the character look distinctive and memorable.`;

  return prompt;
}

// Generate a background story for the character
export async function generateCharacterBackground(characterInfo: {
  name: string;
  race: string;
  class: string;
  background?: string;
}): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured");
  }

  const { name, race, class: characterClass, background } = characterInfo;
  
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `Create a brief but compelling background story (maximum 3 paragraphs) for ${name}, a ${race} ${characterClass}${background ? ` with a background as a ${background}` : ''}.
  Focus on their motivations, a key event from their past, and what drives them to adventure.
  Make the character interesting with a mix of strengths and flaws.
  Keep the tone consistent with traditional fantasy RPG lore.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
    });

    return completion.choices[0].message.content || 
      "Unable to generate character background at this time.";
  } catch (error: any) {
    console.error("Error generating character background:", error.message);
    throw new Error(`Failed to generate character background: ${error.message}`);
  }
}