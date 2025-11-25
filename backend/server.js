// Load environment variables early (from .env)
try {
  require('dotenv').config();
} catch (e) {
  // dotenv is optional in some deploys; if missing, process.env will be used as-is
}

// Provide simple fallbacks so sandbox tokens propagate to the primary names
if (!process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_SANDBOX_ACCESS_TOKEN) {
  process.env.SQUARE_ACCESS_TOKEN = process.env.SQUARE_SANDBOX_ACCESS_TOKEN;
}
if (!process.env.SQUARE_APP_ID && process.env.SQUARE_SANDBOX_APP_ID) {
  process.env.SQUARE_APP_ID = process.env.SQUARE_SANDBOX_APP_ID;
}
if (!process.env.SQUARE_LOCATION_ID && process.env.SQUARE_SANDBOX_LOCATION_ID) {
  process.env.SQUARE_LOCATION_ID = process.env.SQUARE_SANDBOX_LOCATION_ID;
}

const express = require('express');
const app = express();

// Square security middleware
// The middleware module exports a function expecting the Express `app` so call it here.
const security = require('./square/middleware/security');
if (typeof security === 'function') {
  // If it is the form (app) => { ... } invoke it to register middleware
  security(app);
} else {
  // Fallback: if the module exported a middleware function (req,res,next), mount it
  app.use(security);
}

// Body parsing
app.use(express.json());

// Square routes
app.use('/square', require('./square/routes'));

// Your existing routes
app.use(express.static('public'));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});