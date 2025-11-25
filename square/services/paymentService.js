const { paymentsApi } = require('../config/client');
const logger = require('../utils/helpers');

class PaymentService {
  async getPayment(paymentId) {
    try {
      const response = await paymentsApi.getPayment(paymentId);
      return response.result.payment;
    } catch (error) {
      logger.error('Error retrieving payment', error);
      throw error;
    }
  }

  async listPayments(filter = {}) {
    try {
      const response = await paymentsApi.listPayments(
        filter.beginTime,
        filter.endTime,
        filter.sortOrder,
        filter.cursor,
        filter.locationId,
        filter.total,
        filter.last4,
        filter.cardBrand,
        filter.limit
      );
      return response.result.payments;
    } catch (error) {
      logger.error('Error listing payments', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();