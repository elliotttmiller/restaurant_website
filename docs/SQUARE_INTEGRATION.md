# Square POS Integration Guide for The Bear Trap

This document provides instructions for configuring and deploying the Square online ordering system for The Bear Trap restaurant website.

## Overview

The website now includes a production-ready Square Web Payments SDK integration that enables customers to:
- Browse the menu and add items to cart
- Customize their orders
- Enter contact information
- Process payments securely through Square
- Receive order confirmations

## Prerequisites

1. **Square Account**: You need an active Square account with:
   - A verified business
   - A location set up
   - The ability to process online payments

2. **Square Developer Account**: Access to Square Developer Dashboard at https://developer.squareup.com/

3. **Server Backend**: A server to handle payment processing (required for production)

## Configuration Steps

### 1. Get Square Credentials

1. Log in to your [Square Developer Dashboard](https://developer.squareup.com/apps)
2. Create a new application or select an existing one
3. Note down these credentials:
   - **Sandbox Application ID**: For testing (starts with `sandbox-sq0idb-`)
   - **Production Application ID**: For live payments (starts with `sq0idp-`)
   - **Location ID**: Your business location ID

### 2. Update Configuration

Edit `/assets/js/square-payment.js` and update the `SQUARE_CONFIG` object:

```javascript
const SQUARE_CONFIG = {
  // Replace with your actual Square Application ID
  applicationId: 'YOUR_APPLICATION_ID_HERE',
  
  // Replace with your actual Location ID
  locationId: 'YOUR_LOCATION_ID_HERE',
  
  // Use 'sandbox' for testing, 'production' for live payments
  environment: 'sandbox' // Change to 'production' when ready to go live
};
```

### 3. Set Up Server-Side API

The Square integration requires a server-side component to securely process payments. You need to create two API endpoints:

#### POST `/api/square/create-order`
Creates an order in Square's system.

**Request Body:**
```json
{
  "items": [
    {
      "name": "Burger",
      "quantity": 1,
      "price": 12.50,
      "customizations": "No onions, extra cheese"
    }
  ],
  "customerName": "John Doe",
  "customerPhone": "(320) 555-1212",
  "customerEmail": "john@example.com",
  "pickupTime": "ASAP",
  "note": "Extra napkins please"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "BT-1234567890-ABC123"
}
```

#### POST `/api/square/process-payment`
Processes the payment using Square's Payments API.

**Request Body:**
```json
{
  "sourceId": "cnon:card-nonce-ok",
  "amount": 1350,
  "currency": "USD",
  "orderId": "BT-1234567890-ABC123",
  "customerName": "John Doe",
  "customerPhone": "(320) 555-1212",
  "items": [...],
  "note": "Online order"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "BT-1234567890-ABC123",
  "paymentId": "payment_abc123",
  "receiptUrl": "https://squareup.com/receipt/..."
}
```

### 4. Server Implementation Example (Node.js)

```javascript
const express = require('express');
const { Client, Environment } = require('square');

const app = express();
app.use(express.json());

// Initialize Square client
const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Sandbox // Use Environment.Production for live
});

// Create Order endpoint
app.post('/api/square/create-order', async (req, res) => {
  try {
    const { items, customerName, customerPhone, pickupTime } = req.body;
    
    // Convert items to Square line items format
    const lineItems = items.map(item => ({
      name: item.name,
      quantity: item.quantity.toString(),
      basePriceMoney: {
        amount: Math.round(item.price * 100), // Convert to cents
        currency: 'USD'
      }
    }));

    // Create order in Square
    const { result } = await client.ordersApi.createOrder({
      order: {
        locationId: process.env.SQUARE_LOCATION_ID,
        lineItems,
        customerId: customerPhone, // Or look up customer by phone
        fulfillments: [{
          type: 'PICKUP',
          state: 'PROPOSED',
          pickupDetails: {
            recipient: { displayName: customerName },
            pickupAt: pickupTime === 'ASAP' ? undefined : pickupTime
          }
        }]
      },
      idempotencyKey: `${Date.now()}-${Math.random()}`
    });

    res.json({
      success: true,
      orderId: result.order.id
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Process Payment endpoint
app.post('/api/square/process-payment', async (req, res) => {
  try {
    const { sourceId, amount, orderId, customerName } = req.body;

    // Create payment
    const { result } = await client.paymentsApi.createPayment({
      sourceId,
      amountMoney: {
        amount,
        currency: 'USD'
      },
      orderId,
      locationId: process.env.SQUARE_LOCATION_ID,
      buyerEmailAddress: req.body.customerEmail,
      note: req.body.note,
      idempotencyKey: `${Date.now()}-${Math.random()}`
    });

    res.json({
      success: true,
      orderId,
      paymentId: result.payment.id,
      receiptUrl: result.payment.receiptUrl
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### 5. Environment Variables

Create a `.env` file for your server:

```
SQUARE_ACCESS_TOKEN=your_square_access_token_here
SQUARE_LOCATION_ID=your_location_id_here
SQUARE_ENVIRONMENT=sandbox
```

## Testing

### Sandbox Mode Testing

1. Use the sandbox Application ID in the configuration
2. Set `environment: 'sandbox'` in square-payment.js
3. Use Square's test card numbers:
   - Success: `4111 1111 1111 1111`
   - Decline: `4000 0000 0000 0002`
   - CVV: Any 3 digits
   - Expiration: Any future date

### Testing Checklist

- [ ] Cart functionality (add/remove items)
- [ ] Order customization
- [ ] Contact form validation
- [ ] Payment form loads correctly
- [ ] Test card processes successfully
- [ ] Order confirmation displays
- [ ] Error messages display correctly
- [ ] Mobile responsive design
- [ ] Cart persists across page reloads

## Going Live

1. **Switch to Production**:
   - Update `applicationId` with production app ID
   - Change `environment` to `'production'`
   - Update server to use production Square environment
   - Use production Square access token

2. **Update Square SDK URL**:
   In all HTML files, change:
   ```html
   <script src="https://web.squarecdn.com/v1/square.js"></script>
   ```

3. **SSL Certificate**: Ensure your website has a valid SSL certificate (HTTPS)

4. **PCI Compliance**: Square handles PCI compliance for card data. Ensure your server follows security best practices.

5. **Test in Production**: Use a real card with a small amount to verify everything works

## Security Best Practices

1. **Never expose Square Access Token** in client-side code
2. **Always validate** order data on the server before processing
3. **Use HTTPS** for all transactions
4. **Implement rate limiting** on payment endpoints
5. **Log all transactions** for auditing
6. **Set up webhook handlers** for order status updates

## Troubleshooting

### Payment Form Not Loading
- Check browser console for errors
- Verify Square SDK script is loading
- Confirm Application ID and Location ID are correct
- Check network tab for blocked requests

### Payment Fails
- Verify server endpoints are accessible
- Check server logs for errors
- Ensure Square access token is valid
- Verify location is set up for online payments

### Orders Not Creating
- Check Square dashboard for API errors
- Verify location ID matches your Square account
- Ensure line items are properly formatted
- Check server has proper Square SDK version

## Support

- **Square Developer Documentation**: https://developer.squareup.com/docs
- **Square Developer Support**: https://developer.squareup.com/support
- **Square Community**: https://developer.squareup.com/forums

## Additional Features

Consider implementing these enhancements:
- Order history for returning customers
- Tipping options
- Scheduled pickup times
- Delivery option
- Loyalty points integration
- Gift card support
- Order status notifications via SMS
- Email receipts

## Files Modified

- `/order.html` - Added Square SDK and payment form
- `/index.html` - Added Square SDK for cart functionality
- `/assets/js/square-payment.js` - New file with Square integration
- `/assets/js/order.js` - Updated checkout flow
- `/assets/css/styles.css` - Added payment form styles
- `/SQUARE_INTEGRATION.md` - This documentation

## Demo Mode

When Square credentials are not configured, the system will operate in demo mode:
- Payment form will not initialize
- Orders can still be placed without payment
- A message will inform users to call for payment

This allows you to test the ordering flow before Square is fully configured.
