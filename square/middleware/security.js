const helmet = require('helmet');

const securityMiddleware = (app) => {
  // Helmet with CSP that allows Square's domains
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'", 
          "https://js.squareupsandbox.com", 
          "https://js.squareup.com"
        ],
        styleSrc: [
          "'self'", 
          "'unsafe-inline'", 
          "https://fonts.googleapis.com"
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: [
          "'self'", 
          "https://connect.squareupsandbox.com", 
          "https://connect.squareup.com"
        ],
        frameSrc: [
          "'self'", 
          "https://sandbox.web.squarecdn.com", 
          "https://web.squarecdn.com"
        ]
      }
    }
  }));

  // Additional security headers
  app.use((req, res, next) => {
    res.removeHeader('X-Powered-By');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  });
};

module.exports = securityMiddleware;