// Simple webhook tester for local development
// Usage: node webhook_tester.js [--useNotificationUrl]

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const PORT = process.env.PORT || 3000;
const WEBHOOK_PATH = '/api/square/webhook';
const URL_HOST = 'localhost';

const secret = process.env.SQUARE_SANDBOX_WEBHOOK_SECRET;
if (!secret) {
  console.error('Missing SQUARE_SANDBOX_WEBHOOK_SECRET in .env');
  process.exit(1);
}

const payload = JSON.stringify({
  merchant_id: 'TEST_MERCHANT',
  type: 'payment.created',
  data: { id: `TEST-${Date.now()}`, amount: 123 }
});

const useNotificationUrl = process.argv.includes('--useNotificationUrl');
let bodyBuf = Buffer.from(payload, 'utf8');
let signature;

if (useNotificationUrl) {
  // Compose notification URL: prefer explicit env var, otherwise assume ngrok base + /webhook
  const notificationUrl = process.env.SQUARE_WEBHOOK_NOTIFICATION_URL || (process.env.SQUARE_API_BASE_URL ? (process.env.SQUARE_API_BASE_URL.replace(/\/$/, '') + '/webhook') : `https://${URL_HOST}:${PORT}${WEBHOOK_PATH}`);
  const altPayload = Buffer.concat([Buffer.from(notificationUrl, 'utf8'), bodyBuf]);
  signature = crypto.createHmac('sha256', secret).update(altPayload).digest('base64');
  console.log('Using notificationUrl prefix for signature:', notificationUrl);
} else {
  signature = crypto.createHmac('sha256', secret).update(bodyBuf).digest('base64');
}

const options = {
  hostname: URL_HOST,
  port: PORT,
  path: WEBHOOK_PATH,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': bodyBuf.length,
    'x-square-hmacsha256-signature': signature
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Response status:', res.statusCode);
    console.log('Response body:', data);
  });
});

req.on('error', (err) => {
  console.error('Request error:', err);
});

req.write(bodyBuf);
req.end();
