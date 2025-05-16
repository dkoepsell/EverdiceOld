import { storage } from "../storage";
import { Campaign } from "@shared/schema";

/**
 * Generate a unique deployment code for a campaign
 * @returns A unique 8-character alphanumeric code
 */
export function generateDeploymentCode(): string {
  // Use characters that are unlikely to be confused with each other
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

/**
 * Publish a campaign making it available for other DMs to use as a template
 * @param campaignId The ID of the campaign to publish
 * @param userId The ID of the user publishing the campaign
 * @returns The updated campaign object
 */
export async function publishCampaign(campaignId: number, userId: number): Promise<Campaign> {
  const campaign = await storage.getCampaign(campaignId);
  
  if (!campaign) {
    throw new Error("Campaign not found");
  }
  
  if (campaign.userId !== userId) {
    throw new Error("Only the campaign creator can publish this campaign");
  }
  
  // Make sure the campaign has a deployment code
  let deploymentCode = campaign.deploymentCode;
  if (!deploymentCode) {
    deploymentCode = generateDeploymentCode();
  }
  
  // Update the campaign with published status
  const updatedCampaign = await storage.updateCampaign(campaignId, {
    isPublished: true,
    publishedAt: new Date().toISOString(),
    deploymentCode
  });
  
  return updatedCampaign;
}

/**
 * Unpublish a campaign, making it unavailable to other DMs
 * @param campaignId The ID of the campaign to unpublish
 * @param userId The ID of the user unpublishing the campaign
 * @returns The updated campaign object
 */
export async function unpublishCampaign(campaignId: number, userId: number): Promise<Campaign> {
  const campaign = await storage.getCampaign(campaignId);
  
  if (!campaign) {
    throw new Error("Campaign not found");
  }
  
  if (campaign.userId !== userId) {
    throw new Error("Only the campaign creator can unpublish this campaign");
  }
  
  // Update the campaign
  const updatedCampaign = await storage.updateCampaign(campaignId, {
    isPublished: false,
    publishedAt: null
  });
  
  return updatedCampaign;
}

/**
 * Update deployment settings for a campaign
 * @param campaignId The ID of the campaign to update
 * @param userId The ID of the user updating settings
 * @param settings Object containing settings to update
 * @returns The updated campaign object
 */
export async function updateDeploymentSettings(
  campaignId: number, 
  userId: number, 
  settings: { isPrivate?: boolean; maxPlayers?: number }
): Promise<Campaign> {
  const campaign = await storage.getCampaign(campaignId);
  
  if (!campaign) {
    throw new Error("Campaign not found");
  }
  
  if (campaign.userId !== userId) {
    throw new Error("Only the campaign creator can update deployment settings");
  }
  
  const updates: Record<string, any> = {};
  
  if (typeof settings.isPrivate === 'boolean') {
    updates.isPrivate = settings.isPrivate;
  }
  
  if (typeof settings.maxPlayers === 'number' && settings.maxPlayers >= 1 && settings.maxPlayers <= 10) {
    updates.maxPlayers = settings.maxPlayers;
  }
  
  if (Object.keys(updates).length === 0) {
    throw new Error("No valid settings provided");
  }
  
  // Update the campaign
  const updatedCampaign = await storage.updateCampaign(campaignId, updates);
  
  return updatedCampaign;
}

/**
 * Create a campaign from a published template
 * @param templateId The ID of the template campaign to clone
 * @param userId The ID of the user creating the campaign
 * @returns The newly created campaign
 */
export async function createCampaignFromTemplate(templateId: number, userId: number): Promise<Campaign> {
  const template = await storage.getCampaign(templateId);
  
  if (!template) {
    throw new Error("Template campaign not found");
  }
  
  if (!template.isPublished) {
    throw new Error("This campaign is not available as a template");
  }
  
  // Clone the campaign for the new user
  const newCampaign = await storage.createCampaign({
    userId,
    title: `${template.title} (from template)`,
    description: template.description,
    difficulty: template.difficulty,
    narrativeStyle: template.narrativeStyle,
    isTurnBased: template.isTurnBased,
    turnTimeLimit: template.turnTimeLimit,
    isArchived: false,
    isCompleted: false,
    xpReward: template.xpReward,
    createdAt: new Date().toISOString(),
  });
  
  // Clone the campaign sessions
  const sessions = await storage.getCampaignSessions(templateId);
  
  for (const session of sessions) {
    await storage.createCampaignSession({
      campaignId: newCampaign.id,
      sessionNumber: session.sessionNumber,
      title: session.title,
      narrative: session.narrative,
      location: session.location,
      choices: session.choices,
      sessionXpReward: session.sessionXpReward,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    });
  }
  
  return newCampaign;
}

/**
 * Find published campaigns that can be used as templates
 * @param showPrivate Whether to include private templates (requires valid code)
 * @param deploymentCode Optional code to access private templates
 * @returns Array of published campaign templates
 */
export async function getPublishedTemplates(showPrivate: boolean = false, deploymentCode?: string): Promise<Campaign[]> {
  const allCampaigns = await storage.getAllCampaigns();
  
  return allCampaigns.filter(campaign => {
    // Must be published
    if (!campaign.isPublished) return false;
    
    // Include public campaigns
    if (!campaign.isPrivate) return true;
    
    // Include private campaigns if viewing all or code matches
    if (showPrivate && deploymentCode && campaign.deploymentCode === deploymentCode) {
      return true;
    }
    
    return false;
  });
}