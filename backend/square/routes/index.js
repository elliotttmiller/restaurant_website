// Compatibility shim: re-export the root-level square routes
const path = require('path');

try {
  // Prefer the new location under square/api/routes
  const realPathApi = path.join(__dirname, '..', '..', '..', 'square', 'api', 'routes');
  module.exports = require(realPathApi);
} catch (errApi) {
  try {
    const realPath = path.join(__dirname, '..', '..', '..', 'square', 'routes');
    module.exports = require(realPath);
  } catch (err) {
    console.error('[compat] Failed to load root square routes:', err.message);
    const express = require('express');
    const router = express.Router();
    router.get('/health', (req, res) => res.json({ status: 'OK', service: 'Square API (shim)' }));
    module.exports = router;
  }
}
