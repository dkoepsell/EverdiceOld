import type { Express, Request, Response } from "express";
import { Campaign } from "@shared/schema";
import { storage } from "./storage";

export function setupCampaignSettingsRoutes(app: Express) {
  // Update campaign settings
  app.patch('/api/campaigns/:campaignId', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: 'Not authenticated' });
    
    try {
      const campaignId = parseInt(req.params.campaignId);
      const campaign = await storage.getCampaign(campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }
      
      // Only campaign owner can change settings
      if (campaign.userId !== req.user!.id) {
        return res.status(403).json({ message: 'Only the campaign owner can change campaign settings' });
      }
      
      // Extract allowed updates from request body
      const allowedUpdates: Partial<Campaign> = {};
      
      // Settings that can be updated
      if (req.body.title !== undefined) allowedUpdates.title = req.body.title;
      if (req.body.description !== undefined) allowedUpdates.description = req.body.description;
      if (req.body.theme !== undefined) allowedUpdates.theme = req.body.theme;
      if (req.body.narrativeStyle !== undefined) allowedUpdates.narrativeStyle = req.body.narrativeStyle;
      if (req.body.difficulty !== undefined) allowedUpdates.difficulty = req.body.difficulty;
      if (req.body.totalSessions !== undefined) allowedUpdates.totalSessions = req.body.totalSessions;
      if (req.body.isTurnBased !== undefined) allowedUpdates.isTurnBased = req.body.isTurnBased;
      if (req.body.turnTimeLimit !== undefined) allowedUpdates.turnTimeLimit = req.body.turnTimeLimit;
      if (req.body.isPublished !== undefined) allowedUpdates.isPublished = req.body.isPublished;
      if (req.body.isPrivate !== undefined) allowedUpdates.isPrivate = req.body.isPrivate;
      if (req.body.maxPlayers !== undefined) allowedUpdates.maxPlayers = req.body.maxPlayers;
      
      // Update campaign settings
      const updatedCampaign = await storage.updateCampaign(campaignId, allowedUpdates);
      
      if (!updatedCampaign) {
        return res.status(500).json({ message: 'Failed to update campaign settings' });
      }
      
      // Special handling for turn-based mode changes
      if (req.body.isTurnBased === true && !campaign.isTurnBased) {
        // Start with the campaign owner's turn when enabling turn-based mode
        await storage.updateCampaign(campaignId, {
          currentTurnUserId: campaign.userId,
          turnStartedAt: new Date().toISOString()
        });
      }
      
      // If turning off turn-based mode, clear any active turns
      if (req.body.isTurnBased === false && campaign.isTurnBased) {
        await storage.updateCampaign(campaignId, {
          currentTurnUserId: null,
          turnStartedAt: null
        });
      }
      
      return res.status(200).json(updatedCampaign);
    } catch (error) {
      console.error('Failed to update campaign settings:', error);
      return res.status(500).json({ message: 'Failed to update campaign settings' });
    }
  });
}