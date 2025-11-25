const express = require('express');
const router = express.Router();
// Service lives at square/services/checkoutService.js (not under api/services)
const checkoutService = require('../../services/checkoutService');
const { v4: uuidv4 } = require('uuid');

// Create Square Payment Link (Official hosted checkout)
router.post('/create', async (req, res) => {
  try {
    const { order, redirectUrl } = req.body;

    if (!order || !redirectUrl) {
      return res.status(400).json({
        error: 'Order and redirectUrl are required'
      });
    }

    // Generate idempotency key as required by Square
    const idempotencyKey = uuidv4();

    const checkoutSession = await checkoutService.createCheckoutSession({
      order,
      redirectUrl,
      idempotencyKey
    });

    res.json({
      success: true,
      paymentLinkId: checkoutSession.paymentLinkId,
      checkoutUrl: checkoutSession.url,
      orderId: checkoutSession.orderId
    });

  } catch (error) {
    console.error('Checkout creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Retrieve checkout session status
router.get('/:paymentLinkId', async (req, res) => {
  try {
    const { paymentLinkId } = req.params;
    const checkout = await checkoutService.retrieveCheckout(paymentLinkId);
    
    res.json({
      success: true,
      checkout
    });
  } catch (error) {
    console.error('Error retrieving checkout:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;