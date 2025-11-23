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

// Create Order - Complete implementation following Square's official Orders API
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
      persistOrderRecord({ orderId: fakeOrderId, items: lineItems, status: 'DRAFT', createdAt: new Date().toISOString() });
      return res.json({ 
        success: true, 
        orderId: fakeOrderId, 
        idempotencyKey, 
        demo: true,
        totalMoney: { amount: items.reduce((sum, i) => sum + (i.price * i.quantity * 100), 0), currency: 'USD' }
      });
    }

    // Production path using Square Orders API
    // Step 1: Create or retrieve customer (if phone provided)
    let customerId = null;
    if (customerPhone && squareClient.customersApi) {
      try {
        const customerSearch = await squareClient.customersApi.searchCustomers({
          query: {
            filter: {
              phoneNumber: {
                exact: customerPhone
              }
            }
          }
        });

        if (customerSearch.result.customers && customerSearch.result.customers.length > 0) {
          customerId = customerSearch.result.customers[0].id;
        } else if (customerName) {
          // Create new customer
          const nameParts = customerName.split(' ');
          const customerCreate = await squareClient.customersApi.createCustomer({
            givenName: nameParts[0],
            familyName: nameParts.slice(1).join(' ') || undefined,
            phoneNumber: customerPhone,
            emailAddress: customerEmail || undefined
          });
          customerId = customerCreate.result.customer.id;
        }
      } catch (custErr) {
        console.warn('Customer creation/lookup error:', custErr.message);
        // Continue without customer ID - non-critical
      }
    }

    // Step 2: Create order with complete details
    const requestBody = {
      order: {
        locationId: process.env.SQUARE_LOCATION_ID,
        lineItems,
        customerId: customerId || undefined,
        state: 'DRAFT', // DRAFT until payment completes
        fulfillments: [
          {
            type: 'PICKUP',
            state: 'PROPOSED',
            pickupDetails: {
              recipient: { 
                displayName: customerName || 'Customer',
                phoneNumber: customerPhone || undefined,
                emailAddress: customerEmail || undefined
              },
              pickupAt: (pickupTime && pickupTime !== 'ASAP') ? pickupTime : undefined,
              note: note || undefined,
              scheduleType: (pickupTime && pickupTime !== 'ASAP') ? 'SCHEDULED' : 'ASAP'
            }
          }
        ]
      },
      idempotencyKey
    };

    const { result } = await squareClient.ordersApi.createOrder(requestBody);
    const order = result.order;
    const orderId = order.id;
    
    idempotencyStore.set(idempotencyKey, { orderId });
    
    // Persist created order with full details
    persistOrderRecord({ 
      orderId, 
      items: lineItems, 
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      meta: {
        customerId,
        totalMoney: order.totalMoney,
        totalTaxMoney: order.totalTaxMoney,
        totalDiscountMoney: order.totalDiscountMoney,
        totalServiceChargeMoney: order.totalServiceChargeMoney
      }
    });
    
    return res.json({ 
      success: true, 
      orderId,
      customerId,
      idempotencyKey,
      totalMoney: order.totalMoney,
      totalTaxMoney: order.totalTaxMoney,
      totalDiscountMoney: order.totalDiscountMoney
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return res.status(500).json({ success: false, error: error.message || 'unknown error' });
  }
});

// Process Payment - Complete implementation following Square's official Payments API
app.post('/api/square/process-payment', async (req, res) => {
  try {
    const { sourceId, amount, currency = 'USD', orderId, customerEmail, customerName, note } = req.body || {};

    if (!sourceId || !amount || !orderId) {
      return res.status(400).json({ success: false, error: 'sourceId, amount and orderId are required' });
    }

    const idempotencyKey = generateIdempotencyKey();

    if (DEMO_MODE) {
      // Simulate successful payment
      const fakePaymentId = `DEMO-PAY-${Date.now()}`;
      updateOrderStatus(orderId, 'PAID', { paymentId: fakePaymentId });
      return res.json({ 
        success: true, 
        orderId, 
        paymentId: fakePaymentId, 
        receiptUrl: `https://squareup.com/receipt/preview/${fakePaymentId}`,
        status: 'COMPLETED',
        demo: true 
      });
    }

    // Production path using Square Payments API
    const paymentBody = {
      sourceId,
      idempotencyKey,
      amountMoney: {
        amount: Number(amount),
        currency
      },
      orderId,
      locationId: process.env.SQUARE_LOCATION_ID,
      buyerEmailAddress: customerEmail || undefined,
      note: note || `Online order from ${customerName || 'Customer'}`,
      autocomplete: true, // Auto-capture the payment
      referenceId: orderId // Link payment to order
    };

    // Create payment
    const { result } = await squareClient.paymentsApi.createPayment(paymentBody);
    const payment = result.payment;

    // Update order state to OPEN after successful payment
    try {
      const orderUpdate = await squareClient.ordersApi.updateOrder(orderId, {
        order: {
          locationId: process.env.SQUARE_LOCATION_ID,
          state: 'OPEN', // Mark order as open/active
          version: 1
        }
      });
      console.log(`Order ${orderId} updated to OPEN state`);
    } catch (updateErr) {
      console.warn('Order state update error:', updateErr.message);
      // Non-critical - payment succeeded
    }

    // Update local database
    updateOrderStatus(orderId, 'PAID', { 
      paymentId: payment.id,
      paymentStatus: payment.status,
      receiptUrl: payment.receiptUrl,
      receiptNumber: payment.receiptNumber
    });

    return res.json({ 
      success: true, 
      orderId, 
      paymentId: payment.id, 
      receiptUrl: payment.receiptUrl,
      receiptNumber: payment.receiptNumber,
      status: payment.status,
      totalMoney: payment.totalMoney,
      approvedMoney: payment.approvedMoney
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    
    // Update order status to failed
    if (orderId) {
      updateOrderStatus(orderId, 'PAYMENT_FAILED', { error: error.message });
    }
    
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'unknown error',
      errors: error.errors || []
    });
  }
});

// Get Order Status - Real-time order status tracking
app.get('/api/square/order-status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ success: false, error: 'orderId is required' });
    }

    if (DEMO_MODE) {
      // Return demo order status
      const localOrder = db.getOrder(orderId);
      return res.json({
        success: true,
        orderId,
        status: localOrder ? localOrder.status : 'PENDING',
        state: localOrder ? localOrder.status : 'PENDING',
        demo: true
      });
    }

    // Fetch order from Square
    const { result } = await squareClient.ordersApi.retrieveOrder(orderId);
    const order = result.order;

    // Update local database
    updateOrderStatus(orderId, order.state, {
      version: order.version,
      updatedAt: order.updatedAt,
      closedAt: order.closedAt
    });

    return res.json({
      success: true,
      orderId: order.id,
      status: order.state,
      state: order.state,
      fulfillments: order.fulfillments,
      totalMoney: order.totalMoney,
      version: order.version,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      closedAt: order.closedAt
    });
  } catch (error) {
    console.error('Order status retrieval error:', error);
    return res.status(500).json({ success: false, error: error.message || 'unknown error' });
  }
});

// Update Order Status - For staff/admin to update order fulfillment
app.post('/api/square/update-order-status', async (req, res) => {
  try {
    const { orderId, status, fulfillmentState } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({ success: false, error: 'orderId and status are required' });
    }

    if (DEMO_MODE) {
      updateOrderStatus(orderId, status);
      return res.json({ success: true, orderId, status, demo: true });
    }

    // Get current order version
    const { result: retrieveResult } = await squareClient.ordersApi.retrieveOrder(orderId);
    const currentOrder = retrieveResult.order;

    // Update order state
    const updateBody = {
      order: {
        locationId: process.env.SQUARE_LOCATION_ID,
        version: currentOrder.version,
        state: status
      }
    };

    // If fulfillment state is provided, update it
    if (fulfillmentState && currentOrder.fulfillments && currentOrder.fulfillments.length > 0) {
      updateBody.order.fulfillments = currentOrder.fulfillments.map(f => ({
        ...f,
        state: fulfillmentState
      }));
    }

    const { result } = await squareClient.ordersApi.updateOrder(orderId, updateBody);
    
    updateOrderStatus(orderId, status, { updatedAt: new Date().toISOString() });

    return res.json({
      success: true,
      orderId: result.order.id,
      status: result.order.state,
      version: result.order.version
    });
  } catch (error) {
    console.error('Order status update error:', error);
    return res.status(500).json({ success: false, error: error.message || 'unknown error' });
  }
});

// Manage Customer - Create or update customer profile
app.post('/api/square/manage-customer', async (req, res) => {
  try {
    const { phoneNumber, emailAddress, givenName, familyName, note } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'phoneNumber is required' });
    }

    if (DEMO_MODE) {
      return res.json({
        success: true,
        customerId: `DEMO-CUST-${Date.now()}`,
        demo: true
      });
    }

    // Search for existing customer by phone
    const searchResult = await squareClient.customersApi.searchCustomers({
      query: {
        filter: {
          phoneNumber: {
            exact: phoneNumber
          }
        }
      }
    });

    let customer;
    if (searchResult.result.customers && searchResult.result.customers.length > 0) {
      // Customer exists - update if needed
      customer = searchResult.result.customers[0];
      
      // Only update if new information provided
      if (emailAddress || givenName || familyName || note) {
        const updateResult = await squareClient.customersApi.updateCustomer(customer.id, {
          emailAddress: emailAddress || customer.emailAddress,
          givenName: givenName || customer.givenName,
          familyName: familyName || customer.familyName,
          note: note || customer.note
        });
        customer = updateResult.result.customer;
      }
    } else {
      // Create new customer
      const createResult = await squareClient.customersApi.createCustomer({
        givenName,
        familyName,
        phoneNumber,
        emailAddress,
        note
      });
      customer = createResult.result.customer;
    }

    return res.json({
      success: true,
      customerId: customer.id,
      givenName: customer.givenName,
      familyName: customer.familyName,
      emailAddress: customer.emailAddress,
      phoneNumber: customer.phoneNumber
    });
  } catch (error) {
    console.error('Customer management error:', error);
    return res.status(500).json({ success: false, error: error.message || 'unknown error' });
  }
});

// Check Inventory Availability
app.post('/api/square/check-availability', async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, error: 'items array is required' });
    }

    if (DEMO_MODE) {
      // Simulate all items available
      return res.json({
        success: true,
        available: true,
        items: [],
        demo: true
      });
    }

    const unavailableItems = [];

    // Check each item's inventory
    for (const item of items) {
      if (!item.catalogObjectId) continue;

      try {
        const inventoryResult = await squareClient.inventoryApi.retrieveInventoryCount(
          item.catalogObjectId,
          {
            locationIds: [process.env.SQUARE_LOCATION_ID]
          }
        );

        const counts = inventoryResult.result.counts || [];
        const availableQty = counts.reduce((sum, c) => sum + parseFloat(c.quantity || 0), 0);

        if (availableQty < (item.quantity || 1)) {
          unavailableItems.push({
            id: item.catalogObjectId,
            name: item.name,
            requested: item.quantity,
            available: availableQty
          });
        }
      } catch (invErr) {
        console.warn(`Inventory check failed for ${item.catalogObjectId}:`, invErr.message);
        // Assume available if inventory check fails (catalog item may not have inventory tracking)
      }
    }

    return res.json({
      success: true,
      available: unavailableItems.length === 0,
      items: unavailableItems
    });
  } catch (error) {
    console.error('Inventory check error:', error);
    return res.status(500).json({ success: false, error: error.message || 'unknown error' });
  }
});

// Sync Catalog - Retrieve menu items from Square
app.get('/api/square/sync-catalog', async (req, res) => {
  try {
    if (DEMO_MODE) {
      return res.json({
        success: true,
        itemCount: 0,
        items: [],
        demo: true
      });
    }

    // Retrieve all ITEM type catalog objects
    const catalogResult = await squareClient.catalogApi.listCatalog(
      undefined, // cursor
      'ITEM'     // types
    );

    const items = catalogResult.result.objects || [];
    const catalogItems = [];

    // Process each catalog item
    for (const item of items) {
      const itemData = item.itemData;
      if (!itemData) continue;

      const variations = itemData.variations || [];
      const firstVariation = variations[0];
      const price = firstVariation?.itemVariationData?.priceMoney?.amount || 0;

      catalogItems.push({
        id: item.id,
        name: itemData.name,
        description: itemData.description || '',
        categoryId: itemData.categoryId,
        variations: variations.map(v => ({
          id: v.id,
          name: v.itemVariationData?.name || '',
          price: v.itemVariationData?.priceMoney?.amount || 0,
          priceCurrency: v.itemVariationData?.priceMoney?.currency || 'USD'
        })),
        price: price / 100, // Convert cents to dollars
        available: !itemData.isArchived
      });
    }

    return res.json({
      success: true,
      itemCount: catalogItems.length,
      items: catalogItems
    });
  } catch (error) {
    console.error('Catalog sync error:', error);
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
