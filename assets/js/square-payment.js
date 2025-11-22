/**
 * Square Web Payments SDK Integration for The Bear Trap
 * Production-ready Square payment processing for online ordering
 * 
 * This module handles:
 * - Square payment form initialization
 * - Card tokenization
 * - Payment processing
 * - Order submission to Square
 */

(function() {
  'use strict';

  // Square configuration
  // NOTE: In production, these should be loaded from environment variables or a secure config
  // Never commit real credentials to version control
  const SQUARE_CONFIG = {
    // Get credentials from environment or config file
    // In a production setup, use a server-side endpoint to fetch these securely
    applicationId: window.SQUARE_APP_ID || 'sandbox-sq0idb-YOUR_APP_ID_HERE',
    locationId: window.SQUARE_LOCATION_ID || 'YOUR_LOCATION_ID_HERE',
    environment: window.SQUARE_ENVIRONMENT || 'sandbox' // 'sandbox' or 'production'
  };

  // API endpoint configuration - customize for your deployment
  const API_BASE_URL = window.SQUARE_API_BASE_URL || '/api/square';

  let payments;
  let card;

  /**
   * Initialize Square Web Payments SDK
   */
  async function initializeSquarePayments() {
    if (!window.Square) {
      console.error('Square.js failed to load properly');
      return false;
    }

    try {
      payments = window.Square.payments(
        SQUARE_CONFIG.applicationId,
        SQUARE_CONFIG.locationId
      );
      return true;
    } catch (error) {
      console.error('Failed to initialize Square Payments:', error);
      return false;
    }
  }

  /**
   * Initialize card payment method
   */
  async function initializeCard() {
    try {
      card = await payments.card();
      await card.attach('#card-container');
      return card;
    } catch (error) {
      console.error('Failed to initialize card payment method:', error);
      throw error;
    }
  }

  /**
   * Tokenize card information
   */
  async function tokenizeCard() {
    if (!card) {
      throw new Error('Card payment method not initialized');
    }

    try {
      const result = await card.tokenize();
      if (result.status === 'OK') {
        return result.token;
      } else {
        let errorMessage = 'Tokenization failed';
        if (result.errors) {
          errorMessage = result.errors.map(error => error.message).join(', ');
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Tokenization error:', error);
      throw error;
    }
  }

  /**
   * Process payment with Square
   * @param {string} sourceId - Payment token from Square
   * @param {object} orderData - Order details including items and customer info
   */
  async function processPayment(sourceId, orderData) {
    try {
      // In a production environment, this would be a server-side API call
      // The server would use the Square API to create a payment
      const response = await fetch(`${API_BASE_URL}/process-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceId,
          amount: orderData.totalCents,
          currency: 'USD',
          orderId: orderData.orderId,
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          items: orderData.items,
          note: orderData.note || 'Online order from The Bear Trap'
        })
      });

      if (!response.ok) {
        throw new Error('Payment processing failed');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Payment processing error:', error);
      throw error;
    }
  }

  /**
   * Create Square order
   * @param {object} orderData - Order details
   */
  async function createSquareOrder(orderData) {
    try {
      // In production, this would call your server-side API
      // which would use Square Orders API to create an order
      const response = await fetch(`${API_BASE_URL}/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: orderData.items,
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          pickupTime: orderData.pickupTime || 'ASAP',
          note: orderData.note || ''
        })
      });

      if (!response.ok) {
        throw new Error('Order creation failed');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Order creation error:', error);
      throw error;
    }
  }

  /**
   * Handle the complete checkout process
   * @param {object} cartData - Cart items and totals
   * @param {object} customerData - Customer information
   */
  async function handleCheckout(cartData, customerData) {
    try {
      // Step 1: Tokenize the card
      const cardToken = await tokenizeCard();

      // Step 2: Prepare order data
      const orderData = {
        orderId: generateOrderId(),
        items: cartData.items,
        subtotal: cartData.subtotal,
        tax: cartData.tax,
        total: cartData.total,
        totalCents: Math.round(cartData.total * 100), // Convert to cents
        customerName: customerData.name,
        customerPhone: customerData.phone,
        pickupTime: customerData.pickupTime || 'ASAP',
        note: customerData.note || ''
      };

      // Step 3: Create order in Square
      const order = await createSquareOrder(orderData);

      // Step 4: Process payment
      const payment = await processPayment(cardToken, {
        ...orderData,
        orderId: order.orderId || orderData.orderId
      });

      return {
        success: true,
        orderId: payment.orderId || order.orderId,
        payment: payment
      };
    } catch (error) {
      console.error('Checkout error:', error);
      throw error;
    }
  }

  /**
   * Generate unique order ID
   */
  function generateOrderId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `BT-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Show payment status message
   */
  function showPaymentMessage(message, type = 'info') {
    const messageEl = document.getElementById('payment-message');
    if (messageEl) {
      messageEl.textContent = message;
      messageEl.className = `payment-message payment-message--${type}`;
      messageEl.style.display = 'block';

      // Auto-hide success messages after 5 seconds
      if (type === 'success') {
        setTimeout(() => {
          messageEl.style.display = 'none';
        }, 5000);
      }
    }
  }

  /**
   * Initialize Square payment integration
   * This function should be called after DOM is loaded
   */
  async function initialize() {
    // Check if we're on the order page
    if (!document.getElementById('card-container')) {
      return; // Not on order page, skip initialization
    }

    try {
      const initialized = await initializeSquarePayments();
      if (!initialized) {
        showPaymentMessage('Payment system initialization failed. Please refresh the page or contact us.', 'error');
        return;
      }

      // Initialize card payment method
      await initializeCard();
      
      console.log('Square payment integration initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Square payments:', error);
      showPaymentMessage('Payment system is currently unavailable. Please call us to place your order.', 'error');
    }
  }

  // Expose public API
  window.SquarePayment = {
    initialize,
    handleCheckout,
    tokenizeCard,
    processPayment,
    createSquareOrder,
    showPaymentMessage
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

})();
