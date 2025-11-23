# Square Integration Architecture

## Complete Order & Payment Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CUSTOMER EXPERIENCE                         │
│                                                                     │
│  1. Browse Menu → 2. Add to Cart → 3. Click Checkout →            │
│  4. Enter Info → 5. Enter Card → 6. Submit → 7. Confirmation      │
│                                                                     │
│  ✨ All happens on one page - NO redirects! ✨                     │
└─────────────────────────────────────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       CLIENT-SIDE (Browser)                         │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Square Web Payments SDK (square-payment.js)                 │   │
│  │                                                             │   │
│  │  • Loads Square card payment form                          │   │
│  │  • Tokenizes card data (PCI compliant)                     │   │
│  │  • Never exposes card numbers to your server               │   │
│  │  • Returns secure payment token                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                    │                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Checkout Handler (order.js)                                │   │
│  │                                                             │   │
│  │  • Validates customer information                          │   │
│  │  • Prepares cart items                                     │   │
│  │  • Calls Square Payment SDK                                │   │
│  │  • Sends data to server                                    │   │
│  │  • Displays success/error messages                         │   │
│  │  • Polls for order status updates                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    ▼
                          [HTTPS API Call]
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SERVER (Node.js/Express)                         │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ API Endpoints (server_example.js)                          │   │
│  │                                                             │   │
│  │  POST /api/square/create-order                             │   │
│  │  │  1. Validates cart items                                │   │
│  │  │  2. Creates/retrieves customer profile                  │   │
│  │  │  3. Creates order in Square (DRAFT state)               │   │
│  │  │  4. Returns order ID                                    │   │
│  │                                                             │   │
│  │  POST /api/square/process-payment                          │   │
│  │  │  1. Receives payment token from client                  │   │
│  │  │  2. Creates payment in Square                           │   │
│  │  │  3. Updates order state (DRAFT → OPEN)                  │   │
│  │  │  4. Returns receipt & confirmation                      │   │
│  │                                                             │   │
│  │  GET /api/square/order-status/:id                          │   │
│  │  │  1. Fetches current order from Square                   │   │
│  │  │  2. Returns status & fulfillment state                  │   │
│  │                                                             │   │
│  │  Other Endpoints:                                          │   │
│  │  • /manage-customer - Customer profiles                    │   │
│  │  • /check-availability - Inventory checks                  │   │
│  │  • /sync-catalog - Menu synchronization                    │   │
│  │  • /update-order-status - Staff fulfillment updates        │   │
│  │  • /webhook - Real-time event handling                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                    │                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Square Node.js SDK                                          │   │
│  │  • OrdersApi - Order management                            │   │
│  │  • PaymentsApi - Payment processing                        │   │
│  │  • CustomersApi - Customer profiles                        │   │
│  │  • InventoryApi - Stock checking                           │   │
│  │  • CatalogApi - Menu items                                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    ▼
                            [Square APIs]
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     SQUARE BACKEND (Cloud)                          │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Square Orders API                                           │   │
│  │  • Creates orders with line items                          │   │
│  │  • Manages fulfillment (pickup/delivery)                   │   │
│  │  • Tracks order lifecycle                                  │   │
│  │  • States: DRAFT → OPEN → COMPLETED                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Square Payments API                                         │   │
│  │  • Processes credit card payments                          │   │
│  │  • Links payments to orders                                │   │
│  │  • Handles captures and refunds                            │   │
│  │  • Generates receipts                                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Square Customers API                                        │   │
│  │  • Manages customer profiles                               │   │
│  │  • Stores contact information                              │   │
│  │  • Tracks order history                                    │   │
│  │  • Enables loyalty programs                                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Square Inventory API                                        │   │
│  │  • Tracks item availability                                │   │
│  │  • Real-time stock levels                                  │   │
│  │  • Prevents overselling                                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Square Catalog API                                          │   │
│  │  • Stores menu items                                       │   │
│  │  • Manages pricing                                         │   │
│  │  • Handles item variations                                 │   │
│  │  • Categories and modifiers                                │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    ▼
                           [Webhook Events]
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SQUARE DASHBOARD                               │
│                                                                     │
│  Restaurant staff can view:                                        │
│  • All orders (online + in-person)                                │
│  • Payment history                                                │
│  • Customer directory                                             │
│  • Inventory levels                                               │
│  • Sales analytics                                                │
│  • Update order status                                            │
│                                                                     │
│  🔗 https://squareup.com/dashboard                                │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow for a Complete Order

### Step-by-Step Process

```
1. Customer adds "Bare Bear Burger" to cart
   └─► Stored in browser localStorage

2. Customer clicks "Complete Order & Pay"
   └─► Opens cart drawer with checkout form

3. Customer enters contact info
   ├─► Name: "John Doe"
   ├─► Phone: "(320) 555-1234"
   └─► Email: "john@example.com"

4. Customer enters payment card
   └─► Square Web Payments SDK loads card form
       └─► Card data entered directly into Square's form
           └─► Card details NEVER touch your server

5. Customer clicks "Submit Order"
   └─► JavaScript: handleEcosystemCheckout() called
       │
       ├─► STEP 1: Check inventory
       │   └─► POST /api/square/check-availability
       │       └─► Square Inventory API checks stock
       │           └─► Returns available/unavailable items
       │
       ├─► STEP 2: Manage customer
       │   └─► POST /api/square/manage-customer
       │       └─► Square Customers API creates/retrieves profile
       │           └─► Returns customer ID
       │
       ├─► STEP 3: Create order
       │   └─► POST /api/square/create-order
       │       └─► Square Orders API creates order (DRAFT state)
       │           └─► Returns order ID
       │
       ├─► STEP 4: Tokenize card
       │   └─► Square Web Payments SDK tokenizes card
       │       └─► Returns secure payment token
       │           └─► Token sent to server (NOT card number)
       │
       ├─► STEP 5: Process payment
       │   └─► POST /api/square/process-payment
       │       └─► Square Payments API charges card
       │           └─► Order updated to OPEN state
       │               └─► Returns receipt URL
       │
       └─► STEP 6: Show confirmation
           └─► Display order ID, receipt, estimated time
               └─► Clear cart
                   └─► Start polling for status updates

6. Background: Status polling (every 30 seconds)
   └─► GET /api/square/order-status/:orderId
       └─► Square Orders API returns current state
           └─► Updates UI when order is ready
               └─► States: OPEN → PREPARED → COMPLETED

7. Restaurant staff updates order in Square Dashboard
   └─► Webhook sent to: POST /api/square/webhook
       └─► Server processes event
           └─► Updates local database
               └─► Customer notified via polling
```

## Security Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                              │
└─────────────────────────────────────────────────────────────────────┘

Layer 1: Client-Side Security
├─► Card data handled by Square SDK (PCI compliant)
├─► No card numbers stored in browser
├─► Token-based payment (not sensitive data)
└─► HTTPS required for all connections

Layer 2: Server-Side Security
├─► Environment variables for credentials
├─► No hardcoded secrets
├─► Input validation on all endpoints
├─► Idempotency keys prevent duplicate charges
└─► Error handling without data exposure

Layer 3: Square API Security
├─► OAuth 2.0 authentication
├─► API access tokens
├─► Location-based permissions
├─► Webhook signature verification
└─► PCI Level 1 compliance

Layer 4: Network Security
├─► HTTPS/TLS encryption
├─► Secure token transmission
├─► API rate limiting
└─► DDoS protection
```

## Development vs Production

```
┌─────────────────────────────────────────────────────────────────────┐
│                     DEVELOPMENT (Sandbox)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Environment: sandbox                                              │
│  Base URL: https://connect.squareupsandbox.com                    │
│  SDK URL: https://sandbox.web.squarecdn.com/v1/square.js         │
│                                                                     │
│  Test Cards: 4111 1111 1111 1111                                  │
│  No real money processed                                          │
│  Safe for testing                                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      PRODUCTION (Live)                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Environment: production                                           │
│  Base URL: https://connect.squareup.com                          │
│  SDK URL: https://web.squarecdn.com/v1/square.js                 │
│                                                                     │
│  Real Cards: Customer credit/debit cards                          │
│  Real money processed                                             │
│  HTTPS required                                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Order State Transitions

```
DRAFT         →    OPEN         →    COMPLETED
(Created)          (Paid)            (Fulfilled)
    ↓                ↓                   ↓
Payment          Kitchen            Customer
pending          preparing          picks up
    ↓                ↓                   ↓
Can modify       Cannot modify     Order closed
order            order             
```

## Component Interactions

```
order.html
    └─► Loads order.js
        └─► Calls SquarePayment.handleEcosystemCheckout()
            └─► Defined in square-payment.js
                └─► Uses Square Web Payments SDK
                    └─► Calls server APIs
                        └─► Uses Square Node.js SDK
                            └─► Connects to Square Cloud
```

## Files and Their Roles

```
📁 restaurant_website/
│
├─ 📄 order.html
│   └─► Customer-facing order page with cart modal
│
├─ 📁 assets/js/
│   ├─ 📄 order.js
│   │   └─► Cart management & checkout form handling
│   │
│   ├─ 📄 square-payment.js
│   │   └─► Square Web Payments SDK integration
│   │       └─► Payment tokenization & API calls
│   │
│   └─ 📄 main.js
│       └─► General site functionality
│
├─ 📁 api/
│   ├─ 📄 server_example.js
│   │   └─► Express server with all Square endpoints
│   │
│   ├─ 📄 square_integration.js
│   │   └─► Additional Square integration helpers
│   │
│   ├─ 📄 db.js
│   │   └─► SQLite database management
│   │
│   └─ 📄 package.json
│       └─► Dependencies (express, square, etc.)
│
├─ 📄 .env.example
│   └─► Configuration template
│
└─ 📄 IMPLEMENTATION_SUMMARY.md
    └─► This documentation
```
