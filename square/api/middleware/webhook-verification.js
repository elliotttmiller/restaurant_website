// Compatibility shim: some code expects a hyphenated filename ('webhook-verification').
// Re-export the canonical middleware implementation in this directory.
module.exports = require('./webhookVerification');
