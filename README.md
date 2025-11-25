# Responsive Restaurant Website
## [Watch it on youtube](https://youtu.be/5RIFrZEjURA)
### Responsive Restaurant Website

- Responsive Restaurant Website Design Using HTML CSS & JavaScript
- Contains animations when scrolling.
- Smooth scrolling in each section.
- Includes a dark & light theme.

## Square POS Integration — Complete Ecosystem

This restaurant website features a **complete, production-ready Square POS integration** following Square's official API/SDK best practices. The system includes:

- ✅ **Square Web Payments SDK** for in-page checkout (no redirects)
- ✅ **Orders API** for complete order management with real-time status
- ✅ **Payments API** for secure payment processing
- ✅ **Customers API** for customer profile management
- ✅ **Inventory API** for real-time availability checking
- ✅ **Catalog API** for menu synchronization

### Features

**Customer Experience:**
- Browse menu with real-time item availability
- Add items to cart with customization options
- In-page checkout with Square's secure payment form
- Real-time order status tracking
- Automatic customer profile management
- Receipt generation and email delivery

**Backend Integration:**
- Complete Square Orders API workflow (DRAFT → OPEN → COMPLETED)
- Secure payment processing with auto-capture
- Customer creation and lookup
- Inventory availability checking
- Order status webhooks support
- Demo mode for development without Square credentials

### Local Development Setup

Follow these steps to run the complete Square integration locally:

#### 1. Get Square Credentials

1. Sign up for a Square Developer account: https://developer.squareup.com/
2. Create a new application or select an existing one
3. Navigate to your application's credentials page
4. Copy your **Sandbox Application ID**, **Sandbox Access Token**, and **Location ID**

#### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your Square credentials
# For development, use sandbox credentials:
SQUARE_ENVIRONMENT=sandbox
SQUARE_SANDBOX_ACCESS_TOKEN=your_sandbox_access_token
SQUARE_SANDBOX_APP_ID=sandbox-sq0idb-your_app_id
SQUARE_SANDBOX_LOCATION_ID=your_location_id
```

#### 3. Install Dependencies and Start Server

Install Node dependencies and start the server from the repository root (where `package.json` lives):

```bash
# Install Node.js dependencies at the repo root
npm install

# Start the server (explicitly run server.js)
node server.js

# For development with auto-reload you can use nodemon if installed:
# npx nodemon server.js
```

The server will start on `http://localhost:3000` by default.

#### 4. Configure Client-Side

Add these configuration variables to your HTML before the Square scripts load (in `order.html` and `index.html`):

```html
<script>
  // Square configuration
  window.SQUARE_APP_ID = 'sandbox-sq0idb-your_app_id';
  window.SQUARE_LOCATION_ID = 'your_location_id';
  window.SQUARE_ENVIRONMENT = 'sandbox';
  window.SQUARE_API_BASE_URL = 'http://localhost:3000/api/square';
</script>
```

#### 5. Test the Integration

1. Open `order.html` in your browser
2. Add items to your cart
3. Click "Complete Order & Pay" to open the cart checkout
4. Fill in customer information (name and phone required)
5. Use Square test card: `4111 1111 1111 1111`
   - CVV: Any 3 digits
   - Expiration: Any future date
   - ZIP: Any 5 digits
6. Submit the order

### API Endpoints

The server exposes these Square-integrated endpoints:

**Order Management:**
- `POST /api/square/create-order` — Create a new order
- `GET /api/square/order-status/:orderId` — Get real-time order status
- `POST /api/square/update-order-status` — Update order fulfillment status

**Payment Processing:**
- `POST /api/square/process-payment` — Process payment with tokenized card

**Customer Management:**
- `POST /api/square/manage-customer` — Create or update customer profile

**Inventory & Catalog:**
- `POST /api/square/check-availability` — Check item availability
- `GET /api/square/sync-catalog` — Sync menu from Square Catalog

**Webhooks:**
- `POST /api/square/webhook` — Receive Square webhook events (with signature verification)

### Demo Mode

The system automatically runs in **demo mode** when Square credentials are not configured:
- All API endpoints simulate successful responses
- No actual API calls to Square
- Orders stored in local SQLite database
- Perfect for frontend development and testing

To enable demo mode, simply leave the Square credentials blank in your `.env` file or don't create one.

### Testing Cards

Use these Square test cards in sandbox mode:

**Successful Payment:**
- `4111 1111 1111 1111` (Visa)
- `5105 1051 0510 5100` (Mastercard)
- `3782 822463 10005` (Amex)

**Failed Payment:**
- `4000 0000 0000 0002` (Generic decline)

**All test cards:**
- CVV: Any 3-4 digits
- Expiration: Any future date
- ZIP: Any 5 digits

### Production Deployment

To deploy to production:

1. **Get Production Credentials:**
   - Switch your Square application to production mode
   - Copy production Access Token and Application ID

2. **Update Environment:**
   ```bash
   SQUARE_ENVIRONMENT=production
   SQUARE_ACCESS_TOKEN=your_production_access_token
   SQUARE_APP_ID=sq0idp-your_production_app_id
   SQUARE_LOCATION_ID=your_production_location_id
   ```

3. **Update Client Configuration:**
   ```html
   <script>
     window.SQUARE_APP_ID = 'sq0idp-your_production_app_id';
     window.SQUARE_LOCATION_ID = 'your_production_location_id';
     window.SQUARE_ENVIRONMENT = 'production';
     window.SQUARE_API_BASE_URL = 'https://yourdomain.com/api/square';
   </script>
   ```

4. **Update Square SDK URL:**
   In HTML files, change:
   ```html
   <!-- From -->
   <script src="https://sandbox.web.squarecdn.com/v1/square.js"></script>
   
   <!-- To -->
   <script src="https://web.squarecdn.com/v1/square.js"></script>
   ```

5. **Enable HTTPS:**
   - Square requires HTTPS for production
   - Use Let's Encrypt, Cloudflare, or your hosting provider's SSL

6. **Test with Real Card:**
   - Use a real card with a small amount ($1) first
   - Verify order appears in Square Dashboard
   - Verify payment is captured

### Security Best Practices

✅ **PCI Compliance:** Square handles all card data; never store card numbers
✅ **Environment Variables:** Never commit credentials to version control
✅ **HTTPS Only:** Always use SSL/TLS for production
✅ **Webhook Verification:** Signature verification included for webhook security
✅ **Server-Side Validation:** All payment processing on server
✅ **Idempotency Keys:** Prevent duplicate orders/payments

### Monitoring & Support

**Square Dashboard:**
- Monitor orders: https://squareup.com/dashboard/orders
- View payments: https://squareup.com/dashboard/sales
- Manage customers: https://squareup.com/dashboard/customers
- Analytics: https://squareup.com/dashboard/reports

**Developer Resources:**
- Square API Docs: https://developer.squareup.com/docs
- SDK Reference: https://developer.squareup.com/reference/square
- Developer Forums: https://developer.squareup.com/forums
- API Status: https://developer.squareup.com/status

**Support:**
- Square Developer Support: https://developer.squareup.com/support
- Square Community: https://developer.squareup.com/forums

### Architecture

```
┌─────────────────┐
│   Web Browser   │ ← Customer views menu, adds items to cart
└────────┬────────┘
         │
         ├─ Square Web Payments SDK (client-side)
         │  └─ Tokenizes card data securely
         │
         ▼
┌─────────────────┐
│  Node.js Server │ ← Express API with Square SDK
└────────┬────────┘
         │
         ├─ Square Orders API     (create/update orders)
         ├─ Square Payments API   (process payments)
         ├─ Square Customers API  (manage profiles)
         ├─ Square Inventory API  (check availability)
         └─ Square Catalog API    (sync menu)
         │
         ▼
┌─────────────────┐
│  Square APIs    │ ← Official Square backend
└─────────────────┘
```

### Troubleshooting

**Payment form not loading:**
- Check browser console for errors
- Verify Square SDK script is loading
- Confirm Application ID and Location ID are correct
- Check CORS configuration if using different domains

**Orders not creating:**
- Check server logs for errors
- Verify access token has `ORDERS_WRITE` permission
- Confirm location ID is correct
- Check item prices are in cents (Square requirement)

**Payments failing:**
- Verify payment amount matches order total
- Check access token has `PAYMENTS_WRITE` permission
- Review Square Dashboard for decline reasons
- Ensure order exists before processing payment

**Inventory errors:**
- Inventory tracking may not be enabled for all items
- Check catalog items have inventory enabled
- Non-critical: system continues without inventory check

### Documentation

For complete implementation details, see:
- **`SQUARE_INTEGRATION.md`** — Original integration guide
- **`SQUARE_ECOSYSTEM.md`** — Complete ecosystem blueprint
- **`PROJECT_SUMMARY.md`** — Project overview and status

---

- Developed first with the Mobile First methodology, then for desktop.
- Compatible with all mobile devices and with a beautiful and pleasant user interface.

💙 Join the channel to see more videos like this. [Bedimcode](https://www.youtube.com/@Bedimcode)

![preview img](/preview.png)
