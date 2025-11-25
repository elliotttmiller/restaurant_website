const express = require('express');
const router = express.Router();
const checkoutRoutes = require('./checkout');
const webhookRoutes = require('./webhooks');

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