// Demo Node/Express server for Square integration
// Production-pluggable: reads env, uses Square SDK when credentials are present,
// otherwise runs in demo mode. Do not use this as-is in critical production without further hardening.

const path = require('path');
// Load .env: prefer CWD (useful when running from repo root), otherwise fall back
// to the project root (one level up from api/) so running from api/ still picks up root .env
const dotenv = require('dotenv');
let envLoad = dotenv.config();
if (envLoad.error) {
  const parentEnvPath = path.resolve(__dirname, '..', '.env');
  envLoad = dotenv.config({ path: parentEnvPath });
  if (!envLoad.error) console.log('Loaded .env from', parentEnvPath);
}
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const crypto = require('crypto');
const fs = require('fs');
const db = require('./db');

// Try to require the Square SDK. Support both CommonJS and default exports.
let Client = null;
let Environment = null;
try {
  const squarePkg = require('square');
  // package may export { Client, Environment } or default: { Client, Environment }
  // SDK package loaded
  // The SDK may expose different names depending on package version: prefer common variants.
  Client = squarePkg.Client || squarePkg.SquareClient || squarePkg.Square || (squarePkg.default && (squarePkg.default.Client || squarePkg.default.SquareClient || squarePkg.default.Square)) || null;
  Environment = squarePkg.Environment || squarePkg.SquareEnvironment || (squarePkg.default && (squarePkg.default.Environment || squarePkg.default.SquareEnvironment)) || null;
} catch (err) {
  // SDK not installed or failed to load; we'll detect and run in demo mode.
  console.warn('Failed to require square SDK:', err && err.message);
  Client = null;
  Environment = null;
}

const app = express();
app.use(helmet());
app.use(cors());
// Capture raw body for webhook signature verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(morgan('tiny'));

const PORT = process.env.PORT || 3000;

// Determine which token to use. Prefer production vars, but if running in sandbox
// use sandbox-prefixed vars. This lets developers keep sandbox creds separate.
const envIsSandbox = (process.env.SQUARE_ENVIRONMENT || '').toLowerCase() === 'sandbox';

const accessToken = process.env.SQUARE_ACCESS_TOKEN || (envIsSandbox ? process.env.SQUARE_SANDBOX_ACCESS_TOKEN : undefined);
const webhookSigKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || (envIsSandbox ? process.env.SQUARE_SANDBOX_WEBHOOK_SECRET : undefined);

// Detection state
if (!accessToken) console.log('No access token found in environment.');

const DEMO_MODE = !accessToken || !Client;

let squareClient = null;
if (!DEMO_MODE) {
  // If the SDK's Environment value is available, pick Sandbox or Production accordingly.
  const sdkEnv = (Environment && Environment.Sandbox && envIsSandbox) ? Environment.Sandbox : (Environment && Environment.Production ? Environment.Production : undefined);
  squareClient = new Client({
    accessToken,
    environment: sdkEnv
  });
  console.log('Square Client initialized.');
} else {
  console.log('Running in DEMO MODE. No Square access token or SDK detected.');
}

// Minimal in-memory idempotency store for demo purposes.
const idempotencyStore = new Map();

function generateIdempotencyKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function transformItemsToLineItems(items = []) {
  return items.map(item => ({
    name: item.name || 'Item',
    quantity: (item.quantity || 1).toString(),
    basePriceMoney: {
      amount: Math.round((item.price || 0) * 100),
      currency: 'USD'
    }
  }));
}

// Simple file-backed order and event persistence for dev (orders.json, events.json)
const ORDERS_FILE = path.join(__dirname, 'orders.json');
const EVENTS_FILE = path.join(__dirname, 'events.json');

// Persistence via sqlite (db.js)
function persistOrderRecord(order) {
  db.createOrder({ orderId: order.orderId, items: order.items, status: order.status || 'PENDING', createdAt: order.createdAt });
}

function updateOrderStatus(orderId, status, meta = {}) {
  return db.updateOrderStatus(orderId, status, meta);
}

// Mount integration router (checkout/payment endpoints)
try {
  const integrationRouter = require('./square_integration');
  app.use('/api/square', integrationRouter);
  console.log('Mounted /api/square integration router');
} catch (err) {
  console.warn('square_integration router not available:', err && err.message);
}

// Health
app.get('/api/health', (req, res) => res.json({ ok: true, demo: DEMO_MODE }));

// Provide a friendly root route for browsers visiting http://localhost:3000/
app.get('/', (req, res) => {
  return res.redirect('/api/health');
});

// Create Order
app.post('/api/square/create-order', async (req, res) => {
  try {
    const { items, customerName, customerPhone, customerEmail, pickupTime, note } = req.body || {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'items is required and must be a non-empty array' });
    }

    const lineItems = transformItemsToLineItems(items);
    const idempotencyKey = generateIdempotencyKey();

    if (DEMO_MODE) {
      // Simulate an order creation
      const fakeOrderId = `DEMO-${Date.now()}`;
      idempotencyStore.set(idempotencyKey, { orderId: fakeOrderId });
        // persist demo order record
        persistOrderRecord({ orderId: fakeOrderId, items: lineItems, status: 'PENDING', createdAt: new Date().toISOString() });
        return res.json({ success: true, orderId: fakeOrderId, idempotencyKey, demo: true });
    }

    // Production path using Square
    const requestBody = {
      order: {
        locationId: process.env.SQUARE_LOCATION_ID,
        lineItems,
        fulfillments: [
          {
            type: 'PICKUP',
            state: 'PROPOSED',
            pickupDetails: {
              recipient: { displayName: customerName },
              pickupAt: pickupTime === 'ASAP' ? undefined : pickupTime
            }
          }
        ]
      },
      idempotencyKey
    };

    const { result } = await squareClient.ordersApi.createOrder(requestBody);
    const orderId = result && result.order && result.order.id;
    idempotencyStore.set(idempotencyKey, { orderId });
    // persist created order
    persistOrderRecord({ orderId, items: lineItems, status: 'PENDING', createdAt: new Date().toISOString() });
    return res.json({ success: true, orderId, idempotencyKey });
  } catch (error) {
    console.error('Order creation error:', error);
    return res.status(500).json({ success: false, error: error.message || 'unknown error' });
  }
});

// Process Payment
app.post('/api/square/process-payment', async (req, res) => {
  try {
    const { sourceId, amount, currency = 'USD', orderId, customerEmail, note } = req.body || {};

    if (!sourceId || !amount || !orderId) {
      return res.status(400).json({ success: false, error: 'sourceId, amount and orderId are required' });
    }

    const idempotencyKey = generateIdempotencyKey();

    if (DEMO_MODE) {
      // Simulate successful payment
      const fakePaymentId = `DEMO-PAY-${Date.now()}`;
      return res.json({ success: true, orderId, paymentId: fakePaymentId, receiptUrl: null, demo: true });
    }

    const paymentBody = {
      sourceId,
      idempotencyKey,
      amountMoney: {
        amount: Number(amount),
        currency
      },
      orderId,
      locationId: process.env.SQUARE_LOCATION_ID,
      buyerEmailAddress: customerEmail,
      note
    };

    const { result } = await squareClient.paymentsApi.createPayment(paymentBody);
    const payment = result && result.payment;
    return res.json({ success: true, orderId, paymentId: payment && payment.id, receiptUrl: payment && payment.receiptUrl });
  } catch (error) {
    console.error('Payment processing error:', error);
    return res.status(500).json({ success: false, error: error.message || 'unknown error' });
  }
});

// Webhook skeleton (signature verification if key provided)
app.post('/api/square/webhook', (req, res) => {
  const sigKey = webhookSigKey;
  const sig256 = req.get('x-square-hmacsha256-signature');
  const sigLegacy = req.get('x-square-signature');

  // If a signature key is configured, validate the incoming webhook signature.
  if (sigKey) {
    if (!sig256 && !sigLegacy) {
      console.warn('Webhook received without signature header while verification is enabled');
      return res.status(400).json({ success: false, error: 'missing signature header' });
    }

    try {
      // Use raw body for HMAC computation
      const raw = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
      const rawLen = raw.length;

      // Prefer the explicit HMAC-SHA256 header if present; otherwise fall back to legacy header.
      if (sig256) {
        const incoming = sig256.trim();
        const hmac = crypto.createHmac('sha256', sigKey).update(raw).digest('base64');
        const expectedLen = Buffer.from(hmac, 'utf8').length;
        if (process.env.WEBHOOK_DEBUG === 'true') {
          console.log(`Webhook debug: using hmac-sha256 header incomingLen=${incoming.length} rawLen=${rawLen} expectedLen=${expectedLen}`);
        }

        const incomingBuf = Buffer.from(incoming, 'utf8');
        const expectedBuf = Buffer.from(hmac, 'utf8');
        if (incomingBuf.length === expectedBuf.length && crypto.timingSafeEqual(incomingBuf, expectedBuf)) {
          console.log('Webhook signature verified (sha256)');
        } else {
          // Try alternate signing variant: notificationUrl + rawBody (some Square variants use this)
          const notificationUrl = process.env.SQUARE_WEBHOOK_NOTIFICATION_URL || (process.env.SQUARE_API_BASE_URL ? (process.env.SQUARE_API_BASE_URL.replace(/\/$/, '') + '/webhook') : undefined);
          if (notificationUrl) {
            const altPayload = Buffer.concat([Buffer.from(notificationUrl, 'utf8'), raw]);
            const altHmac = crypto.createHmac('sha256', sigKey).update(altPayload).digest('base64');
            const altBuf = Buffer.from(altHmac, 'utf8');
            if (process.env.WEBHOOK_DEBUG === 'true') {
              console.log(`Webhook debug: sha256 mismatch, attempting notificationUrl+rawBody fallback; notificationUrlLen=${notificationUrl.length} altExpectedLen=${altBuf.length}`);
            }
            if (incomingBuf.length === altBuf.length && crypto.timingSafeEqual(incomingBuf, altBuf)) {
              console.log('Webhook signature verified (sha256 with notificationUrl prefix)');
            } else {
              console.warn('Invalid webhook signature (mismatch)');
              return res.status(400).json({ success: false, error: 'invalid signature' });
            }
          } else {
            console.warn('Invalid webhook signature (mismatch)');
            return res.status(400).json({ success: false, error: 'invalid signature' });
          }
        }
      } else if (sigLegacy) {
        // Legacy header uses HMAC-SHA1 (historical). Compute SHA1 and compare.
        const incoming = sigLegacy.trim();
        const hmac = crypto.createHmac('sha1', sigKey).update(raw).digest('base64');
        const expectedLen = Buffer.from(hmac, 'utf8').length;
        if (process.env.WEBHOOK_DEBUG === 'true') {
          console.log(`Webhook debug: using legacy header incomingLen=${incoming.length} rawLen=${rawLen} expectedLen=${expectedLen}`);
        }

        const incomingBuf = Buffer.from(incoming, 'utf8');
        const expectedBuf = Buffer.from(hmac, 'utf8');
        if (incomingBuf.length !== expectedBuf.length) {
          console.warn('Invalid webhook signature (length mismatch)');
          return res.status(400).json({ success: false, error: 'invalid signature' });
        }
        if (!crypto.timingSafeEqual(incomingBuf, expectedBuf)) {
          console.warn('Invalid webhook signature (mismatch)');
          return res.status(400).json({ success: false, error: 'invalid signature' });
        }
        console.log('Webhook signature verified (sha1 legacy)');
      } else {
        console.warn('No recognizable signature header present');
        return res.status(400).json({ success: false, error: 'missing signature header' });
      }
    } catch (err) {
      console.error('Error verifying webhook signature:', err);
      return res.status(500).json({ success: false, error: 'signature verification failed' });
    }
  } else {
    console.log('Webhook received (no signature verification configured)');
  }

    // At this point the webhook is accepted. Parse event and persist/update orders.
    try {
      const event = req.body || {};
      const eventId = event.id || `evt_${Date.now()}`;
      db.insertEvent({ id: eventId, type: event.type || 'unknown', payload: event, receivedAt: new Date().toISOString() });

      // handle payment events
      if ((event.type || '').startsWith('payment')) {
        // normalize to payment object
        let payment = null;
        if (event.data && event.data.object && event.data.object.payment) payment = event.data.object.payment;
        else if (event.data && event.data.payment) payment = event.data.payment;
        else if (event.data) payment = event.data;

        if (payment) {
          const orderId = payment.order_id || payment.orderId || (Array.isArray(payment.order_ids) && payment.order_ids[0]) || (payment.order && payment.order.id) || null;
          const status = (payment.status || '').toUpperCase();
          const paidStatuses = ['COMPLETED', 'CAPTURED', 'PAID', 'APPROVED'];
          if (orderId) {
            if (paidStatuses.includes(status)) {
              updateOrderStatus(orderId, 'PAID', { paymentId: payment.id, rawStatus: status });
              console.log(`Order ${orderId} marked as PAID (payment ${payment.id})`);
            } else {
              updateOrderStatus(orderId, status || 'PENDING', { paymentId: payment.id });
              console.log(`Order ${orderId} updated with status ${status}`);
            }
          } else {
            console.log('Payment event received but no order ID found in payload');
          }
        }
      }
    } catch (err) {
      console.error('Error handling webhook event:', err);
    }

    // Acknowledge receipt
    res.status(200).json({ success: true });
});

app.listen(PORT, () => console.log(`Square demo server listening on http://localhost:${PORT} (demo=${DEMO_MODE})`));

module.exports = app;
