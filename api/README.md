# API (non-Square)

This folder is intended for non-Square API endpoints and services.

Keep this directory minimal — use `square/` for all Square-specific integration code (routes, services, middleware, config).

Suggested uses for `api/`:
- Non-Square payment methods
- Order management endpoints (internal admin APIs)
- User account endpoints
- Any other non-payment API routes

If you don't need `api/` to contain server code (we run `server.js` at the repo root), this directory can remain a placeholder for future expansion.

Created automatically by the cleanup script.
