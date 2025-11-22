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
    appId: window.SQUARE_APP_ID || 'sandbox-sq0idb-YOUR_APP_ID_HERE',
    locationId: window.SQUARE_LOCATION_ID || 'YOUR_LOCATION_ID_HERE',
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
        throw new Error('Some items are no longer available. Please review your cart.');
      }

      // Step 2: Create or retrieve customer profile
      const customer = await manageCustomer(customerData);
      const customerId = customer?.customerId || null;

      // Step 3: Tokenize the card
      const cardToken = await tokenizeCard();

      // Step 4: Prepare order data with customer ID
      const orderData = {
        orderId: generateOrderId(),
        items: cartData.items,
        subtotal: cartData.subtotal,
        tax: cartData.tax,
        total: cartData.total,
        totalCents: Math.round(cartData.total * 100),
        customerName: customerData.name,
        customerPhone: customerData.phone,
        customerEmail: customerData.email,
        customerId: customerId,
        pickupTime: customerData.pickupTime || 'ASAP',
        note: customerData.note || ''
      };

      // Step 5: Create order in Square
      const order = await createSquareOrder(orderData);

      // Step 6: Process payment
      const payment = await processPayment(cardToken, {
        ...orderData,
        orderId: order.orderId || orderData.orderId
      });

      // Step 7: Send to printer (if hardware configured)
      try {
        await printOrderTicket(payment.orderId, 'kitchen');
      } catch (e) {
        // Printer not configured - continue without printing
        console.log('Printer not available:', e.message);
      }

      return {
        success: true,
        orderId: payment.orderId || order.orderId,
        customerId: customerId,
        payment: payment
      };
    } catch (error) {
      console.error('Ecosystem checkout error:', error);
      throw error;
    }
  }

  // Expose public API with ecosystem functions
  window.SquarePayment = {
    // Core payment functions
    initialize,
    handleCheckout,
    tokenizeCard,
    processPayment,
    createSquareOrder,
    showPaymentMessage,
    
    // Ecosystem extensions
    handleEcosystemCheckout,
    manageCustomer,
    checkInventoryAvailability,
    syncCatalog,
    updateOrderStatus,
    printOrderTicket,
    getPrinterStatus,
    
    // Configuration access
    getConfig: () => SQUARE_ECOSYSTEM
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

})();
