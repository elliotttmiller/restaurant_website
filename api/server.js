// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Simplified for development
}));

app.use(cors());
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(morgan('combined'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Environment configuration
const isSandbox = (process.env.SQUARE_ENVIRONMENT || 'sandbox').toLowerCase() === 'sandbox';
const PORT = process.env.PORT || 3000;

console.log(`🚀 Starting Restaurant Square Integration`);
console.log(`📍 Environment: ${isSandbox ? 'SANDBOX (Development)' : 'PRODUCTION'}`);
console.log(`🌐 Base URL: ${process.env.BASE_URL || 'http://localhost:3000'}`);

// Square integration routes
try {
  const squareIntegration = require('./square_integration');
  app.use('/api/square', squareIntegration);
  console.log('✅ Square integration routes mounted at /api/square');
} catch (err) {
  console.error('❌ Failed to load Square integration routes:', err.message);
}

// Health check
app.get('/api/health', (req, res) => {
  const db = require('./db');
  const dbHealth = db.healthCheck ? db.healthCheck() : { status: 'UNKNOWN' };
  
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: isSandbox ? 'sandbox' : 'production',
    database: dbHealth,
    square: {
      configured: !!(process.env.SQUARE_ACCESS_TOKEN || process.env.SQUARE_SANDBOX_ACCESS_TOKEN),
      environment: process.env.SQUARE_ENVIRONMENT || 'sandbox',
      locationId: process.env.SQUARE_LOCATION_ID ? `${process.env.SQUARE_LOCATION_ID.substring(0, 8)}...` : 'Not set'
    }
  });
});

// Frontend configuration
app.get('/api/config', (req, res) => {
  const config = {
    square: {
      applicationId: isSandbox ? process.env.SQUARE_SANDBOX_APP_ID : process.env.SQUARE_APP_ID,
      locationId: isSandbox ? process.env.SQUARE_SANDBOX_LOCATION_ID : process.env.SQUARE_LOCATION_ID,
      environment: isSandbox ? 'sandbox' : 'production'
    },
    api: {
      baseUrl: '/api/square',
      endpoints: {
        checkout: '/create-checkout',
        orderStatus: '/order-status',
        health: '/health'
      }
    },
    restaurant: {
      name: process.env.RESTAURANT_NAME || 'Your Restaurant',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@yourrestaurant.com'
    }
  };

  // Remove null values
  Object.keys(config.square).forEach(key => {
    if (!config.square[key]) delete config.square[key];
  });

  res.json(config);
});

// Frontend routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/order', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'order.html'));
});

app.get('/order-status', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'order-status.html'));
});

app.get('/order-confirmed', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'order-confirmed.html'));
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    availableRoutes: [
      'GET  /api/health',
      'GET  /api/config', 
      'POST /api/square/create-checkout',
      'GET  /api/square/order-status/:orderId',
      'GET  /api/square/orders',
      'GET  /',
      'GET  /order',
      'GET  /order-status',
      'GET  /order-confirmed'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Server startup
app.listen(PORT, () => {
  console.log(`🍽️  Restaurant website running on port ${PORT}`);
  console.log(`💳 Square integration: ${isSandbox ? 'SANDBOX MODE' : 'PRODUCTION MODE'}`);
  console.log(`📋 API endpoints available at http://localhost:${PORT}/api/square`);
  console.log(`🔄 Health check: http://localhost:${PORT}/api/health`);
  console.log(`⚙️  Configuration: http://localhost:${PORT}/api/config`);
  
  if (isSandbox) {
    console.log('\n🔧 SANDBOX DEVELOPMENT MODE');
    console.log('   Use Square Sandbox test cards:');
    console.log('   - Successful: 4111 1111 1111 1111');
    console.log('   - Failed: 4000 0000 0000 0002');
  }
});

module.exports = app;