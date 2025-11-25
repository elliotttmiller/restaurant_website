// Compatibility shim: re-export the original security middleware which lives at /square/middleware/security.js
const path = require('path');

try {
  const realPath = path.join(__dirname, '..', '..', '..', 'square', 'middleware', 'security.js');
  module.exports = require(realPath);
} catch (err) {
  // If the original module can't be found, export a no-op middleware to avoid crashing
  console.error('[compat] Failed to load root square middleware at ../square/middleware/security.js:', err.message);
  module.exports = function (app) {
    // no-op: keep application running
    if (app && app.use) {
      // express-style middleware fallback
      app.use(function (req, res, next) { next(); });
    }
    return function () {};
  };
}
