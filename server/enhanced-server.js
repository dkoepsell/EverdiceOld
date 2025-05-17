import express from 'express';
import storyAdvancementRoute from './story-advancement-route.js';

// Export a function to set up the enhanced routes
export default function setupEnhancedRoutes(app) {
  // Add the story-advancement routes
  app.use('/api/story', storyAdvancementRoute);
  
  // Add additional enhanced routes here in the future
};