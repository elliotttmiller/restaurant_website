# Responsive Restaurant Website
## [Watch it on youtube](https://youtu.be/5RIFrZEjURA)
### Responsive Restaurant Website

- Responsive Restaurant Website Design Using HTML CSS & JavaScript
- Contains animations when scrolling.
- Smooth scrolling in each section.
- Includes a dark & light theme.
## Square integration — Local sandbox demo

Follow these steps to run a local, production-pluggable demo of the Square integration. The demo server will use the official Square Node SDK when `SQUARE_ACCESS_TOKEN` is provided; otherwise it runs in a safe demo mode that simulates order/payment flows.

1. Copy `.env.example` to `.env` and fill in sandbox values (or leave blank to run in demo mode):

```powershell
cp .env.example .env
# then edit .env with your preferred editor
```

2. Install dependencies for the demo server and run it (PowerShell):

```powershell
cd api
npm install
npm run start
```

3. Configure client-side globals in your local HTML before the Square scripts load (for example in `order.html`):

```html
<script>
	window.SQUARE_APP_ID = 'sandbox-sq0idb-...';
	window.SQUARE_LOCATION_ID = 'LOCATION_ID';
	window.SQUARE_ENVIRONMENT = 'sandbox';
	window.SQUARE_API_BASE_URL = 'http://localhost:3000/api/square';
	// When testing without real Square credentials, the server will simulate responses.
</script>
```

4. Basic endpoints exposed by the demo server:

- `GET /api/health` — health and demo mode indicator
- `POST /api/square/create-order` — create an order (see `SQUARE_INTEGRATION.md` for payload)
- `POST /api/square/process-payment` — process a payment (see `SQUARE_INTEGRATION.md` for payload)
- `POST /api/square/webhook` — webhook skeleton (signature verification placeholder)

Notes:
- This demo server is intended to be production-pluggable: it reads environment variables and will use the real Square SDK when credentials are provided. However, before using in production, add hardening: HTTPS enforcement, webhook signature verification, persistent idempotency store, structured logging/monitoring, and a production database for orders.
- Do NOT commit `.env` with real credentials. Use your environment or secret store in CI/CD for production deployments.

- Developed first with the Mobile First methodology, then for desktop.
- Compatible with all mobile devices and with a beautiful and pleasant user interface.

💙 Join the channel to see more videos like this. [Bedimcode](https://www.youtube.com/@Bedimcode)

![preview img](/preview.png)
