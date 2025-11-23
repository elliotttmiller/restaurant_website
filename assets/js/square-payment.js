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

  // Square Ecosystem Configuration
  // Complete Square Plus Plan integration with all API endpoints
  // NOTE: In production, these should be loaded from environment variables or a secure config
  // Never commit real credentials to version control
  const SQUARE_ECOSYSTEM = window.SQUARE_ECOSYSTEM || {
    environment: 'sandbox', // 'sandbox' or 'production'
    // We'll populate these from the server-side sandbox env variables via
    // the public `/api/square/config` endpoint. Do NOT use production vars.
    appId: null,
    locationId: null,
    apiBase: window.SQUARE_API_BASE_URL || '/api/square',
    endpoints: {
      // Core ordering and payment
      orders: '/create-order',
      payments: '/process-payment',
      
      // Customer management
      customers: '/manage-customer',
      
      // Inventory and catalog
      inventory: '/check-availability',
      catalog: '/sync-catalog',
      
      // Order fulfillment
      orderStatus: '/update-order-status',
      
      // Future hardware support
      printers: '/print-order',
      reprintTicket: '/reprint-ticket',
      printerStatus: '/printer-status',
      
      // Employee management (for future POS integration)
      employees: '/employee-info',
      
      // Reporting and analytics
      reports: '/analytics'
    },
    
    // API scopes required for full ecosystem
    requiredScopes: [
      'ORDERS_WRITE',
      'PAYMENTS_WRITE',
      'CUSTOMERS_WRITE',
      'ITEMS_READ',
      'ITEMS_WRITE',
      'EMPLOYEES_READ',
      'MERCHANT_PROFILE_READ'
    ]
  };

  // Backwards compatibility - maintain existing config format
  const SQUARE_CONFIG = {
    applicationId: SQUARE_ECOSYSTEM.appId,
    locationId: SQUARE_ECOSYSTEM.locationId,
    environment: SQUARE_ECOSYSTEM.environment
  };

  // API endpoint configuration
  const API_BASE_URL = SQUARE_ECOSYSTEM.apiBase;

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
    // Fetch the sandbox-only public config from the server and use it to
    // initialize the client SDK. Use the short alias `/api/config` so that
    // callers don't need to know the internal API base path.
    try {
      const cfgResp = await fetch('/api/config');
      if (!cfgResp || !cfgResp.ok) {
        console.error('Failed to fetch Square config from server');
        return false;
      }

      const cfg = await cfgResp.json();
      if (!cfg || !cfg.applicationId) {
        console.error('Square config missing applicationId (sandbox app id)');
        return false;
      }

      // Apply sandbox config values
      SQUARE_CONFIG.applicationId = cfg.applicationId;
      SQUARE_CONFIG.locationId = cfg.locationId || SQUARE_CONFIG.locationId;
      SQUARE_ECOSYSTEM.environment = cfg.environment || SQUARE_ECOSYSTEM.environment;

      // Initialize payments using the sandbox app id and location id
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
   * @param {object} paymentData - Payment details including sourceId, amount, orderId
   */
  async function processPayment(paymentData) {
    try {
      const response = await fetch(`${API_BASE_URL}/process-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceId: paymentData.sourceId,
          amount: paymentData.amount,
          currency: paymentData.currency || 'USD',
          orderId: paymentData.orderId,
          customerName: paymentData.customerName,
          customerEmail: paymentData.customerEmail,
          note: paymentData.note || 'Online order from The Bear Trap'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment processing failed');
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
      const response = await fetch(`${API_BASE_URL}/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: orderData.items,
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          customerEmail: orderData.customerEmail,
          pickupTime: orderData.pickupTime || 'ASAP',
          note: orderData.note || ''
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Order creation failed');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Order creation error:', error);
      throw error;
    }
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

  // ============================================================
  // SQUARE ECOSYSTEM EXTENSIONS
  // Additional functions for complete POS integration
  // ============================================================

  /**
   * Customer Management - Create or retrieve customer profile
   * @param {object} customerData - Customer information
   */
  async function manageCustomer(customerData) {
    try {
      const response = await fetch(`${API_BASE_URL}${SQUARE_ECOSYSTEM.endpoints.customers}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: customerData.phone,
          emailAddress: customerData.email,
          givenName: customerData.name.split(' ')[0],
          familyName: customerData.name.split(' ').slice(1).join(' '),
          note: customerData.note || ''
        })
      });

      if (!response.ok) {
        throw new Error('Customer management failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Customer management error:', error);
      // Non-critical - continue without customer profile
      return null;
    }
  }

  /**
   * Check inventory availability before order placement
   * @param {array} items - Items to check
   */
  async function checkInventoryAvailability(items) {
    try {
      const response = await fetch(`${API_BASE_URL}${SQUARE_ECOSYSTEM.endpoints.inventory}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            catalogObjectId: item.id,
            quantity: item.quantity
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Inventory check failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Inventory check error:', error);
      // Non-critical - assume items are available
      return { available: true, items: [] };
    }
  }

  /**
   * Sync menu with Square Catalog API
   * This should be called periodically to update menu items, prices, and availability
   */
  async function syncCatalog() {
    try {
      const response = await fetch(`${API_BASE_URL}${SQUARE_ECOSYSTEM.endpoints.catalog}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Catalog sync failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Catalog sync error:', error);
      return null;
    }
  }

  /**
   * Update order status (for future staff dashboard integration)
   * @param {string} orderId - Square order ID
   * @param {string} status - New status (PROPOSED, RESERVED, PREPARED, COMPLETED, CANCELED)
   */
  async function updateOrderStatus(orderId, status) {
    try {
      const response = await fetch(`${API_BASE_URL}${SQUARE_ECOSYSTEM.endpoints.orderStatus}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          status
        })
      });

      if (!response.ok) {
        throw new Error('Order status update failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Order status update error:', error);
      throw error;
    }
  }

  /**
   * Print order ticket (for future printer integration)
   * @param {string} orderId - Square order ID
   * @param {string} printerType - 'kitchen' or 'bar'
   */
  async function printOrderTicket(orderId, printerType = 'kitchen') {
    try {
      const response = await fetch(`${API_BASE_URL}${SQUARE_ECOSYSTEM.endpoints.printers}/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          printerType
        })
      });

      if (!response.ok) {
        throw new Error('Print job failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Print error:', error);
      // Non-critical - order still processed
      return null;
    }
  }

  /**
   * Get printer status (for future hardware monitoring)
   */
  async function getPrinterStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}${SQUARE_ECOSYSTEM.endpoints.printerStatus}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Printer status check failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Printer status error:', error);
      return { status: 'unknown' };
    }
  }

  /**
   * Enhanced checkout with full ecosystem integration
   * @param {object} cartData - Cart items and totals
   * @param {object} customerData - Customer information
   */
  async function handleEcosystemCheckout(cartData, customerData) {
    try {
      // Step 1: Check inventory availability
      const inventoryCheck = await checkInventoryAvailability(cartData.items);
      if (!inventoryCheck.available) {
        const unavailableItems = inventoryCheck.items || [];
        const unavailableNames = unavailableItems
          .filter(i => i && i.name)
          .map(i => i.name)
          .join(', ');
        throw new Error(unavailableNames 
          ? `Some items are no longer available: ${unavailableNames}. Please review your cart.`
          : 'Some items are no longer available. Please review your cart.');
      }

      // Step 2: Create or retrieve customer profile
      const customer = await manageCustomer(customerData);
      const customerId = customer?.customerId || null;

      // Step 3: Create order in Square first (before payment)
      const orderData = {
        items: cartData.items,
        customerName: customerData.name,
        customerPhone: customerData.phone,
        customerEmail: customerData.email,
        pickupTime: customerData.pickupTime || 'ASAP',
        note: customerData.note || ''
      };

      const order = await createSquareOrder(orderData);
      if (!order.success || !order.orderId) {
        throw new Error('Failed to create order');
      }

      // Step 4: Tokenize the card using Square Web Payments SDK
      const cardToken = await tokenizeCard();

      // Step 5: Process payment with the tokenized card
      const paymentData = {
        sourceId: cardToken,
        amount: Math.round(cartData.total * 100), // Convert to cents
        currency: 'USD',
        orderId: order.orderId,
        customerName: customerData.name,
        customerEmail: customerData.email,
        note: `Online order for ${customerData.name}`
      };

      const payment = await processPayment(paymentData);

      if (!payment.success) {
        throw new Error(payment.error || 'Payment processing failed');
      }

      // Step 6: Send to printer (if hardware configured) - non-blocking
      try {
        await printOrderTicket(order.orderId, 'kitchen');
      } catch (e) {
        // Printer not configured - continue without printing
        console.log('Printer not available:', e.message);
      }

      return {
        success: true,
        orderId: order.orderId,
        customerId: customerId,
        payment: payment
      };
    } catch (error) {
      console.error('Ecosystem checkout error:', error);
      throw error;
    }
  }

  /**
   * Initialize card payment in the checkout modal
   */
  async function initializeCardPayment() {
    if (!payments) {
      console.error('Square Payments SDK not initialized');
      return;
    }

    try {
      // Create a card payment method and attach it to the checkout modal
      card = await payments.card();
      await card.attach('#checkout-card');

      // Card attached to modal; tokenization and payment are handled by
      // the higher-level ecosystem checkout flow (window.SquarePayment.handleEcosystemCheckout)
      // so we do not add a duplicate form submit listener here.
    } catch (error) {
      console.error('Failed to initialize card payment:', error);
    }
  }

    /**
     * Ensure Square payments and card are initialized and attached to the modal.
     * Safe to call repeatedly; returns once card is ready.
     */
    async function ensureCardAttached() {
      try {
        if (!payments) {
          const ok = await initializeSquarePayments();
          if (!ok) throw new Error('Failed to init Square payments');
        }

        // If card already initialized and attached, return quickly
        if (card) return card;

        // Attach card to the checkout modal container
        await initializeCardPayment();
        return card;
      } catch (err) {
        console.error('ensureCardAttached error:', err);
        throw err;
      }
    }

  // Expose public API with ecosystem functions
  window.SquarePayment = {
    // Core payment functions
    initialize,
    tokenizeCard,
    processPayment,
    createSquareOrder,
    showPaymentMessage,
    
    // Main checkout function (ecosystem-aware)
    handleEcosystemCheckout,
    
    // Additional ecosystem functions
    manageCustomer,
    checkInventoryAvailability,
    syncCatalog,
    updateOrderStatus,
    printOrderTicket,
    getPrinterStatus,
    
    // Configuration access
    getConfig: () => SQUARE_ECOSYSTEM,
    ensureCardAttached
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // Initialize Square Payments and card payment method for checkout modal
  initializeSquarePayments().then((success) => {
    if (success) {
      initializeCardPayment();
    }
  });
})();
