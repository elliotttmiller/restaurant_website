const { paymentsApi, ordersApi } = require('../config/client');
const db = require('../../lib/db');
const logger = require('../utils/helpers');

class WebhookService {
  async processWebhookEvent(event) {
    const { type, data } = event;
    
    logger.info('Processing webhook event', { type, id: data.id });

    try {
      switch (type) {
        case 'payment.created':
          await this.handlePaymentCreated(data);
          break;
        case 'payment.updated':
          await this.handlePaymentUpdated(data);
          break;
        case 'payment_link.created':
          await this.handlePaymentLinkCreated(data);
          break;
        case 'payment_link.updated':
          await this.handlePaymentLinkUpdated(data);
          break;
        case 'order.updated':
          await this.handleOrderUpdated(data);
          break;
        default:
          logger.info('Unhandled webhook event type', { type });
      }
    } catch (error) {
      logger.error('Error processing webhook event', error);
      throw error;
    }
  }

  async handlePaymentCreated(data) {
    const payment = data.object.payment;
    logger.info('Payment created', {
      paymentId: payment.id,
      status: payment.status,
      amount: payment.amountMoney.amount,
      orderId: payment.orderId
    });

    // Create payment record in our database
    try {
      await db.createPayment({
        order_id: null, // We'll update this when we find the order
        square_payment_id: payment.id,
        amount: payment.amountMoney.amount,
        currency: payment.amountMoney.currency,
        status: payment.status,
        payment_method: payment.cardDetails ? 'card' : 'unknown'
      });

      // Try to find and update the associated order
      if (payment.orderId) {
        const orderUpdated = await db.updateOrderBySquareOrderId(payment.orderId, {
          square_payment_id: payment.id,
          status: 'processing'
        });

        if (orderUpdated) {
          logger.info('Updated order with payment ID', {
            orderId: payment.orderId,
            paymentId: payment.id
          });
        }
      }
    } catch (error) {
      logger.error('Error creating payment record', error);
    }
  }

  async handlePaymentUpdated(data) {
    const payment = data.object.payment;
    logger.info('Payment updated', {
      paymentId: payment.id,
      status: payment.status,
      orderId: payment.orderId
    });

    // Update payment status in our database
    try {
      await db.updatePaymentStatus(payment.id, payment.status);
    } catch (error) {
      logger.error('Error updating payment status', error);
    }

    // Handle payment status changes
    if (payment.status === 'COMPLETED') {
      await this.handleSuccessfulPayment(payment);
    } else if (payment.status === 'FAILED') {
      await this.handleFailedPayment(payment);
    } else if (payment.status === 'CANCELED') {
      await this.handleCanceledPayment(payment);
    }
  }

  async handleSuccessfulPayment(payment) {
    logger.info('Payment completed successfully', {
      paymentId: payment.id,
      orderId: payment.orderId
    });

    // Update order status to paid
    try {
      if (payment.orderId) {
        const orderUpdated = await db.updateOrderBySquareOrderId(payment.orderId, {
          status: 'paid',
          square_payment_id: payment.id,
          paid_at: new Date().toISOString()
        });

        if (orderUpdated) {
          logger.info('Order marked as paid', {
            orderId: payment.orderId,
            paymentId: payment.id
          });

          // Here you could:
          // - Send confirmation email to customer
          // - Update inventory
          // - Notify kitchen/staff
          // - Trigger any post-payment workflows
        }
      }
    } catch (error) {
      logger.error('Error updating order to paid status', error);
    }
  }

  async handleFailedPayment(payment) {
    logger.warn('Payment failed', {
      paymentId: payment.id,
      orderId: payment.orderId
    });

    try {
      if (payment.orderId) {
        await db.updateOrderBySquareOrderId(payment.orderId, {
          status: 'payment_failed'
        });
      }
    } catch (error) {
      logger.error('Error updating order to failed status', error);
    }
  }

  async handleCanceledPayment(payment) {
    logger.info('Payment canceled', {
      paymentId: payment.id,
      orderId: payment.orderId
    });

    try {
      if (payment.orderId) {
        await db.updateOrderBySquareOrderId(payment.orderId, {
          status: 'canceled'
        });
      }
    } catch (error) {
      logger.error('Error updating order to canceled status', error);
    }
  }

  async handlePaymentLinkCreated(data) {
    const paymentLink = data.object.paymentLink;
    logger.info('Payment link created', {
      paymentLinkId: paymentLink.id,
      url: paymentLink.url,
      orderId: paymentLink.orderId
    });

    // Update order with payment link ID if we have a matching order
    try {
      if (paymentLink.orderId) {
        // This assumes you have a way to match Square order IDs to your internal orders
        // You might need to store the Square order ID when creating the checkout session
        const orderUpdated = await db.updateOrderBySquareOrderId(paymentLink.orderId, {
          square_payment_link_id: paymentLink.id
        });

        if (orderUpdated) {
          logger.info('Updated order with payment link ID', {
            orderId: paymentLink.orderId,
            paymentLinkId: paymentLink.id
          });
        }
      }
    } catch (error) {
      logger.error('Error updating order with payment link', error);
    }
  }

  async handlePaymentLinkUpdated(data) {
    const paymentLink = data.object.paymentLink;
    logger.info('Payment link updated', {
      paymentLinkId: paymentLink.id,
      version: paymentLink.version,
      status: paymentLink.status
    });
  }

  async handleOrderUpdated(data) {
    const order = data.object.order;
    logger.info('Square order updated', {
      orderId: order.id,
      state: order.state,
      version: order.version
    });

    // Sync order state with our database if needed
    // This might be useful if you want to track fulfillment status from Square
  }
}

module.exports = new WebhookService();