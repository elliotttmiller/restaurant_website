const express = require('express');
const crypto = require('crypto');
const path = require('path');
let Client = null;
let Environment = null;
try {
  const sq = require('square');
  Client = sq.Client || sq.SquareClient || (sq.default && (sq.default.Client || sq.default.SquareClient));
  Environment = sq.Environment || sq.SquareEnvironment || (sq.default && (sq.default.Environment || sq.default.SquareEnvironment));
} catch (err) {
  console.warn('Square SDK not available in square_integration.js:', err && err.message);
}
require('dotenv').config();

const router = express.Router();

// tokens are persisted in sqlite via ./db

// Helper to create a Square client for a merchant if a merchant token exists
function getSquareClient(merchantId) {
  const envIsSandbox = (process.env.SQUARE_ENVIRONMENT || '').toLowerCase() === 'sandbox';
  const sdkEnv = Environment && envIsSandbox ? Environment.Sandbox : (Environment && Environment.Production ? Environment.Production : undefined);

  if (merchantId) {
    try {
      const db = require('./db');
      const row = db.getToken(merchantId);
      if (row && row.access_token) {
        return new Client({ environment: sdkEnv, accessToken: row.access_token });
      }
    } catch (err) {
      console.warn('Failed to load merchant token from db:', err && err.message);
    }
  }

  // Fallback to application sandbox token
  return new Client({
    environment: sdkEnv,
    accessToken: process.env.SQUARE_SANDBOX_ACCESS_TOKEN || process.env.SQUARE_ACCESS_TOKEN,
  });
}

// Endpoint to create a checkout/payment link
router.post('/checkout', async (req, res) => {
  try {
    const { merchantId, orderId, redirectUrl, lineItems } = req.body;
    const client = getSquareClient(merchantId);
    const paymentLinks = client.paymentLinksApi || client.checkoutApi || client.payment_link_api;

    const body = {
      idempotencyKey: crypto.randomUUID(),
      order: {
        locationId: process.env.SQUARE_LOCATION_ID,
        lineItems,
      },
      checkoutOptions: {}
    };
    if (redirectUrl) body.checkoutOptions.redirectUrl = redirectUrl;

    const response = await paymentLinks.createPaymentLink(body);

    res.json({ paymentLink: response.result.paymentLink.url, raw: response.result });
  } catch (error) {
    console.error('create checkout error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to create a payment (server-side)
router.post('/payment', async (req, res) => {
  try {
    const { merchantId, sourceId, amount, idempotencyKey } = req.body;
    const client = getSquareClient(merchantId);
    const paymentsApi = client.paymentsApi;

    const response = await paymentsApi.createPayment({
      idempotencyKey: idempotencyKey || crypto.randomUUID(),
      sourceId,
      amountMoney: {
        amount,
        currency: 'USD',
      },
    });

    res.json(response.result.payment);
  } catch (error) {
    console.error('create payment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mount OAuth router if present (router will be mounted by the main app)
try {
  const oauthRouter = require('./square_oauth');
  router.use('/oauth', oauthRouter);
} catch (err) {
  // noop - oauth routes optional
}

module.exports = router;