const crypto = require('crypto');
const logger = require('../utils/helpers');
const { config } = require('../config/client');

function verifyWebhookSignature(req, res, next) {
  // Skip verification in development/sandbox if no signature key set
  if (!config.webhookSignatureKey) {
    if (process.env.WEBHOOK_DEBUG === 'true') {
      console.log('🔓 Webhook verification skipped - no signature key set');
    }
    return next();
  }

  const signature = req.headers['x-square-hmacsha256-signature'] || req.headers['x-square-signature'];
  const notificationUrl = req.originalUrl || req.url;
  const body = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body || {});

  if (!signature) {
    logger.warn('Missing Square webhook signature');
    return res.status(401).json({ error: 'Missing webhook signature' });
  }

  // Official Square webhook verification: HMAC-SHA256 of notificationUrl + body
  const hmac = crypto.createHmac('sha256', config.webhookSignatureKey);
  hmac.update(notificationUrl + body);
  const hash = hmac.digest('base64');

  if (hash !== signature) {
    if (process.env.WEBHOOK_DEBUG === 'true') {
      console.log('❌ Webhook signature verification failed', {
        received: signature,
        computed: hash,
        url: notificationUrl
      });
    }
    logger.error('Webhook signature verification failed', { received: signature, computed: hash });
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  if (process.env.WEBHOOK_DEBUG === 'true') {
    console.log('✅ Webhook signature verified successfully');
  }
  logger.info('Webhook signature verified');
  next();
}

module.exports = verifyWebhookSignature;