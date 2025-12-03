Cloudflare Pages + Cloud Run deployment guide
=============================================

This document shows a minimal setup to deploy your `frontend/public` static site to Cloudflare Pages and deploy your Node backend (the Express app at `backend/server.js`) to Google Cloud Run. It also documents secrets and quick commands to run locally.

1) GitHub secrets required
-------------------------
- CF_API_TOKEN: Cloudflare API token with Pages write permissions.
- CF_ACCOUNT_ID: Cloudflare account id (find in Cloudflare dashboard).
- CF_PROJECT_NAME: (optional) Cloudflare Pages project name.
- GCP_PROJECT_ID: Google Cloud project id.
- GCP_SA_KEY: base64-encoded JSON service account key or raw JSON (store as secret). The key must have permissions to Cloud Build and Cloud Run.
- CLOUD_RUN_SERVICE: desired Cloud Run service name (e.g. restaurant-backend)
- CLOUD_RUN_REGION: e.g. us-central1

2) Frontend: Cloudflare Pages
-----------------------------
- The workflow `.github/workflows/pages-deploy.yml` is configured to deploy `frontend/public` on push to `main`.
- To use it, create a Cloudflare Pages project in the dashboard and generate a token, or simply configure the `CF_API_TOKEN` and `CF_ACCOUNT_ID` secrets in your repo settings.

Notes: Cloudflare Pages also supports direct GitHub integration (recommended) which will handle builds automatically. The action used in the workflow is a convenience fallback.

3) Backend: Cloud Run
---------------------
- The workflow `.github/workflows/cloud-run-deploy.yml` will build the Docker image (using `docker/Dockerfile`), push it to GCR, then deploy to Cloud Run.
- Ensure the service account for `GCP_SA_KEY` has `roles/run.admin`, `roles/storage.admin`, and `roles/cloudbuild.builds.editor` (or similar) and the project id is correct.

4) Local webhook and dev
------------------------
- We recommend using Cloudflare Tunnel (`cloudflared`) instead of ngrok for webhook testing in the Cloudflare architecture.
- Quick commands (after installing `cloudflared` and running `cloudflared login`):

  # create a named tunnel once
  cloudflared tunnel create my-backend-tunnel

  # map a DNS name (api.example.com) to the tunnel (requires Cloudflare account & zone)
  cloudflared tunnel route dns my-backend-tunnel api.example.com

  # run the tunnel and proxy to local backend (port 3000)
  cloudflared tunnel run my-backend-tunnel --url http://localhost:3000

5) Cloudflare TLS and origin
----------------------------
- Create an Origin Certificate in Cloudflare SSL/TLS → Origin Server and install it on your origin if you host it yourself. Set SSL/TLS mode to Full (strict).

6) Next steps / optional
------------------------
- Add a Cloudflare Worker to edge-cache HTML or implement fine-grained cache rules.
- Enable WAF, Rate Limiting, and Bot Management in the Cloudflare dashboard.

If you want, I can: (a) add the cloudflared integration to `start.py` (to replace ngrok), (b) create a GA-friendly Cloud Run service account policy snippet, or (c) convert the Pages workflow to a dashboard-backed Pages integration (instructions rather than action). Tell me which next.
