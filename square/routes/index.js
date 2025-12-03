const express = require('express');
const router = express.Router();

// The project stores the concrete API routes under `square/api/routes`.
// Re-export those here so the main server can mount `/square` and reach
// endpoints like `/square/checkout/create` and `/square/webhooks`.
const checkoutRoutes = require('../api/routes/checkout');
const webhookRoutes = require('../api/routes/webhooks');

// Mount routes
router.use('/checkout', checkoutRoutes);
router.use('/webhooks', webhookRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Square API',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;