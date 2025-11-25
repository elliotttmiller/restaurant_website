class Logger {
  static info(message, meta = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] ${message}`, meta);
  }

  static error(message, error = {}) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${message}`, {
      error: error && error.message ? error.message : error,
      stack: error && error.stack ? error.stack : undefined,
      ...error
    });
  }

  static warn(message, meta = {}) {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] ${message}`, meta);
  }

  static debug(message, meta = {}) {
    if (process.env.WEBHOOK_DEBUG === 'true') {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [DEBUG] ${message}`, meta);
    }
  }
}

function formatAmount(amount) {
  return {
    amount: Math.round((amount || 0) * 100), // Convert to cents
    currency: 'USD'
  };
}

function generateIdempotencyKey() {
  return `idemp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getEnvironmentInfo() {
  const env = process.env.SQUARE_ENVIRONMENT || process.env.SQUARE_ENV || 'sandbox';
  return {
    isProduction: env === 'production',
    environment: env,
    baseUrl: process.env.SQUARE_API_BASE_URL || 'http://localhost:3000'
  };
}

module.exports = Logger;
module.exports.formatAmount = formatAmount;
module.exports.generateIdempotencyKey = generateIdempotencyKey;
module.exports.getEnvironmentInfo = getEnvironmentInfo;