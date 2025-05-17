const express = require('express');
const bodyParser = require('body-parser');
const storyAdvancementRoute = require('./story-advancement-route');

// Export a function to set up the enhanced routes
module.exports = function setupEnhancedRoutes(app) {
  // Add the story-advancement routes
  app.use('/api/story', storyAdvancementRoute);
  
  // Add additional enhanced routes here in the future
};