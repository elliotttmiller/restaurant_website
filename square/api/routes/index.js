const express = require('express');
const router = express.Router();

// Require existing route modules in this directory
let checkoutRoutes;
let webhookRoutes;
try {
  checkoutRoutes = require('./checkout');
} catch (e) {
  // fallback: empty router
  checkoutRoutes = express.Router();
}
try {
  webhookRoutes = require('./webhooks');
} catch (e) {
  webhookRoutes = express.Router();
}

router.use('/checkout', checkoutRoutes);
router.use('/webhooks', webhookRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Square API' });
});

module.exports = router;
