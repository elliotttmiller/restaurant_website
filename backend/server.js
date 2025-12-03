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
const path = require('path');
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
// Capture raw request body for webhook signature verification. The
// verification middleware uses `req.rawBody` when available to compute
// the HMAC exactly over the bytes Square signed. Keep this before any
// other JSON parsing or middleware that might consume the body.
app.use(express.json({
  verify: function (req, res, buf) {
    // store raw body buffer for later signature verification
    try { req.rawBody = Buffer.from(buf); } catch (e) { /* ignore */ }
  }
}));
  // Simple CORS for local development: allow frontend (possibly served from a different port)
  // to call the backend API. In production you should tighten this to the exact origin.
  app.use(function(req, res, next){
    res.header('Access-Control-Allow-Origin', process.env.CORS_ALLOW_ORIGIN || '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if(req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });

  // Square routes
app.use('/square', require('./square/routes'));

// Serve frontend static files from the workspace `frontend/public` directory so
// the API and site share the same origin during local development. This avoids
// the POST-to-static-server 501 issue when the site is served separately.
const FRONTEND_DIR = path.resolve(__dirname, '..', 'frontend', 'public');
app.use(express.static(FRONTEND_DIR));

// Your existing routes (API mounted earlier)

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});