const express = require('express');
const router = express.Router();
const webhookService = require('../services/webhooks');
const verifyWebhookSignature = require('../middleware/webhook-verification');

// Square webhook endpoint with signature verification
router.post('/', verifyWebhookSignature, async (req, res) => {
  try {
    const events = req.body;

    // Process each webhook event asynchronously
    // Don't await - Square expects immediate 200 response
    events.forEach(event => {
      webhookService.processWebhookEvent(event)
        .catch(error => {
          console.error('Error processing webhook event:', error);
        });
    });

    // Always return 200 to acknowledge receipt
    res.status(200).send('Webhook processed');

  } catch (error) {
    console.error('Webhook processing error:', error);
    // Still return 200 to prevent Square from retrying
    res.status(200).send('Webhook received');
  }
});

module.exports = router;