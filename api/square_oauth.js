const express = require('express');
const db = require('./db');
const crypto = require('crypto');
const { Client, Environment } = require('square');
require('dotenv').config();

const router = express.Router();
// token persistence is handled by api/db.js

// Build the Square OAuth authorization URL and redirect the merchant
router.get('/authorize', (req, res) => {
  const clientId = process.env.SQUARE_SANDBOX_APP_ID || process.env.SQUARE_APP_ID;
  const redirectUri = process.env.SQUARE_OAUTH_REDIRECT_URL;
  const scopes = (req.query.scopes || 'PAYMENTS_READ PAYMENTS_WRITE ORDERS_READ ORDERS_WRITE').split(' ').join('%20');
  const state = req.query.state || crypto.randomUUID();

  if (!clientId || !redirectUri) {
    return res.status(500).send('OAuth not configured (missing client id or redirect url)');
  }

  const authorizeUrl = `https://connect.squareupsandbox.com/oauth2/authorize?client_id=${encodeURIComponent(clientId)}&scope=${scopes}&session=false&state=${encodeURIComponent(state)}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  res.redirect(authorizeUrl);
});

// Callback to receive an authorization code and exchange for tokens
router.get('/callback', async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;
  const error = req.query.error;

  if (error) {
    return res.status(400).send(`OAuth error: ${error}`);
  }

  if (!code) {
    return res.status(400).send('Missing code parameter');
  }

  const client = new Client({
    environment: Environment.Sandbox,
    accessToken: process.env.SQUARE_SANDBOX_ACCESS_TOKEN, // app token for exchange
  });

  try {
    const oauthResponse = await client.oAuthApi.obtainToken({
      clientId: process.env.SQUARE_SANDBOX_APP_ID,
      clientSecret: process.env.SQUARE_SANDBOX_OAUTH_CLIENT_SECRET,
      code,
      grantType: 'authorization_code',
    });

    const result = oauthResponse.result || {};
    const merchantId = result.merchantId || result.merchant_id || (result.tenant_id ? result.tenant_id : null);

    if (!merchantId) {
      // store under a generated key if no merchant id provided
      const key = crypto.randomUUID();
      db.storeToken(key, result.access_token || result.accessToken || '', result.scope || '');
      return res.status(200).send(`OAuth tokens saved under key: ${key}`);
    }

    db.storeToken(merchantId, result.access_token || result.accessToken || '', result.scope || '');

    // Redirect to a success page or show token info for debugging
    res.status(200).send(`OAuth completed for merchant ${merchantId}. You can close this window.`);
  } catch (err) {
    console.error('OAuth token exchange failed', err);
    res.status(500).send('OAuth token exchange failed');
  }
});

// Simple route to list stored tokens (for dev only!)
router.get('/tokens', (req, res) => {
  const tokens = db.listTokens();
  res.json(tokens);
});

module.exports = router;
