const { Client, Environment } = (() => {
  try {
    const sq = require('square');
    // Support multiple export shapes
    const C = sq.Client || sq.SquareClient || (sq.default && (sq.default.Client || sq.default.SquareClient)) || sq.Client;
    const E = sq.Environment || sq.SquareEnvironment || (sq.default && (sq.default.Environment || sq.default.SquareEnvironment));
    return { Client: C, Environment: E };
  } catch (err) {
    return { Client: null, Environment: null };
  }
})();

class SquareConfig {
  constructor() {
    this.environment = process.env.SQUARE_ENVIRONMENT || 'sandbox';
    this.isProduction = this.environment === 'production';

    // Use primary variable names (explicit). Prefer sandbox tokens for local development.
    this.accessToken = process.env.SQUARE_ACCESS_TOKEN || process.env.SQUARE_SANDBOX_ACCESS_TOKEN || null;
    this.applicationId = process.env.SQUARE_APP_ID || process.env.SQUARE_SANDBOX_APP_ID || null;
    this.locationId = process.env.SQUARE_LOCATION_ID || process.env.SQUARE_SANDBOX_LOCATION_ID || null;

    this.webhookSignatureKey = this.isProduction
      ? (process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || process.env.SQUARE_SANDBOX_WEBHOOK_SECRET)
      : (process.env.SQUARE_SANDBOX_WEBHOOK_SECRET || process.env.SQUARE_WEBHOOK_SIGNATURE_KEY);

    this.baseUrl = process.env.SQUARE_API_BASE_URL || 'http://localhost:3000';

    this.validateConfig();
    this.logConfiguration();
  }

  validateConfig() {
    const missing = [];
    if (!this.accessToken) missing.push('SQUARE_ACCESS_TOKEN or SQUARE_SANDBOX_ACCESS_TOKEN');
    if (!this.applicationId) missing.push('SQUARE_APP_ID or SQUARE_SANDBOX_APP_ID');
    if (!this.locationId) missing.push('SQUARE_LOCATION_ID or SQUARE_SANDBOX_LOCATION_ID');
    if (missing.length) {
      console.warn('⚠️  Missing Square configuration:', missing);
      console.log('🔧 Current environment:', this.environment);
      console.log('💡 Get credentials from: https://developer.squareup.com/apps');
    }
  }

  logConfiguration() {
    console.log(`🏪 Square Configuration:\n  Environment: ${this.environment} ${this.isProduction ? '🚀' : '🧪'}\n  Application ID: ${this.applicationId ? '✓ Set' : '✗ Missing'}\n  Location ID: ${this.locationId ? '✓ Set' : '✗ Missing'}\n  Access Token: ${this.accessToken ? '✓ Set' : '✗ Missing'}\n  Base URL: ${this.baseUrl}`);
  }

  getClient() {
    if (!Client) return null;
    const sdkEnv = Environment ? (this.isProduction ? Environment.Production : Environment.Sandbox) : undefined;
    const opts = {};
    if (sdkEnv) opts.environment = sdkEnv;
    if (this.accessToken) opts.accessToken = this.accessToken;
    return new Client(opts);
  }

  getConfig() {
    return {
      isProduction: this.isProduction,
      environment: this.environment,
      applicationId: this.applicationId,
      locationId: this.locationId,
      webhookSignatureKey: this.webhookSignatureKey,
      baseUrl: this.baseUrl,
    };
  }
}

const cfg = new SquareConfig();
const client = cfg.getClient();

// The official Square Node SDK exposes resource accessors as properties on the
// client (e.g. client.checkout.paymentLinks, client.payments, client.orders).
// Older code expected fields like `checkoutApi`/`paymentsApi`. Normalize a
// compatible shape so existing services continue to work across SDK versions.
const checkoutApi = client
  ? ( (client.checkout && (client.checkout.paymentLinks || client.checkout)) 
      || client.checkoutApi
      || client.paymentLinksApi
      || null )
  : null;
const paymentsApi = client ? (client.payments || client.paymentsApi || null) : null;
const ordersApi = client ? (client.orders || client.ordersApi || null) : null;
const locationsApi = client ? (client.locations || client.locationsApi || null) : null;

module.exports = {
  client,
  config: cfg.getConfig(),
  checkoutApi,
  paymentsApi,
  ordersApi,
  locationsApi,
};