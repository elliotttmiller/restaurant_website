const { checkoutApi, config } = require('../config/client');
// Use the square helpers logger (moved during restructure)
const logger = require('../utils/squareHelpers');

class CheckoutService {
  constructor() {
    this.environment = (config && config.environment) || 'sandbox';
    this.baseUrl = ((config && config.baseUrl) || 'http://localhost:3000').replace(/\/api\/square\/?$/, '');
  }

  async createCheckoutSession(checkoutData) {
    try {
      const { order, redirectUrl, idempotencyKey } = checkoutData;

      const finalRedirect = redirectUrl || `${this.baseUrl}/order-confirmation.html`;

      logger.info('Creating Square checkout session', {
        environment: this.environment,
        locationId: (config && config.locationId) || process.env.SQUARE_LOCATION_ID,
        orderId: order && order.id,
      });

      if (!checkoutApi) throw new Error('Square checkoutApi not configured');

      const supportEmail = process.env.SUPPORT_EMAIL || process.env.FROM_EMAIL;

      const checkoutOptions = {
        allowedPaymentMethods: ['CARD', 'CASH_APP', 'SQUARE_PAY'],
        redirectUrl: finalRedirect,
      };
      if (supportEmail) checkoutOptions.merchantSupportEmail = supportEmail;

      const reqBody = {
        idempotencyKey: idempotencyKey || `ik_${Date.now()}`,
        description: `Order ${order && order.id ? `#${order.id}` : ''}`,
        prePopulatedData: {
          buyerEmail: order && order.customerEmail,
          buyerPhoneNumber: order && order.customerPhone,
        },
        checkoutOptions,
        order: {
          locationId: (config && config.locationId) || process.env.SQUARE_LOCATION_ID,
          lineItems: this.formatLineItems((order && (order.items || order.lineItems)) || []),
          referenceId: order && order.id ? order.id.toString() : `order-${Date.now()}`,
        },
      };

      // Sanity-check amounts: ensure amounts are BigInt (SDK expects bigint).
      try {
        if (reqBody.order && Array.isArray(reqBody.order.lineItems)) {
          reqBody.order.lineItems.forEach((li, idx) => {
            const amt = li && li.basePriceMoney && li.basePriceMoney.amount;
            logger.info('Line item amount type', { index: idx, value: amt, type: typeof amt });
            // If amount is not a bigint, fail early with a helpful message
            if (typeof amt !== 'bigint') {
              throw new Error(`Line item ${idx} amount must be a BigInt (cents). Got type=${typeof amt} value=${String(amt)}`);
            }
          });
        }
      } catch (e) {
        logger.error('Checkout creation validation failed', { error: e && e.message });
        throw e;
      }

      // Support multiple SDK shapes: older code expected createPaymentLink,
      // newer SDK exposes a paymentLinks client with `create`.
      let sdkResponse;
      if (typeof checkoutApi.createPaymentLink === 'function') {
        sdkResponse = await checkoutApi.createPaymentLink(reqBody);
      } else if (typeof checkoutApi.create === 'function') {
        // e.g. PaymentLinksClient.create
        sdkResponse = await checkoutApi.create(reqBody);
      } else if (checkoutApi.paymentLinks && typeof checkoutApi.paymentLinks.create === 'function') {
        sdkResponse = await checkoutApi.paymentLinks.create(reqBody);
      } else {
        throw new Error('Square checkoutApi does not expose a create method');
      }

      // Normalize paymentLink extraction for different SDK return shapes
      let paymentLink = null;
      if (sdkResponse) {
        if (sdkResponse.result && sdkResponse.result.paymentLink) paymentLink = sdkResponse.result.paymentLink;
        else if (sdkResponse.data && (sdkResponse.data.paymentLink || sdkResponse.data.payment_link)) paymentLink = sdkResponse.data.paymentLink || sdkResponse.data.payment_link;
        else if (sdkResponse.paymentLink) paymentLink = sdkResponse.paymentLink;
      }

      logger.info('Square checkout session created', {
        paymentLinkId: paymentLink && (paymentLink.id || paymentLink.payment_link_id),
        orderId: paymentLink && (paymentLink.orderId || paymentLink.order_id),
      });

      return {
        paymentLinkId: paymentLink && (paymentLink.id || paymentLink.payment_link_id),
        url: paymentLink && (paymentLink.url || paymentLink.uri),
        orderId: paymentLink && (paymentLink.orderId || paymentLink.order_id),
        environment: this.environment,
      };

    } catch (error) {
      logger.error('Square checkout creation failed', { error: error && error.message });
      throw error;
    }
  }

  formatLineItems(items) {
    return items.map(item => {
      // Square SDK expects amount to be a bigint (cents). Convert safely.
      const rawAmount = Math.round((item.price || item.amount || 0) * 100);
      let amountVal;
      try {
        // Use BigInt for the SDK shape
        amountVal = BigInt(rawAmount);
      } catch (e) {
        // Fallback: if BigInt is not available for some reason, fall back to Number but log a warning
        amountVal = rawAmount;
      }

      return {
        name: item.name || item.title || 'Item',
        quantity: (item.quantity || 1).toString(),
        basePriceMoney: {
          amount: amountVal,
          currency: (item.currency || 'USD')
        },
        note: item.note || undefined,
      };
    });
  }

  async retrieveCheckout(paymentLinkId) {
    try {
      if (!checkoutApi) throw new Error('Square checkoutApi not configured');
      const response = await checkoutApi.retrievePaymentLink(paymentLinkId);
      return response && response.result && response.result.paymentLink;
    } catch (error) {
      logger.error('Error retrieving checkout', { paymentLinkId, error: error && error.message });
      throw error;
    }
  }
}

module.exports = new CheckoutService();