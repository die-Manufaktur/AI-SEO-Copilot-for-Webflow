# SEO Copilot Development Guide

## Setup and Running the Project

### Prerequisites
- Node.js (v16 or higher)
- Yarn (v1.22 or higher)
- Cloudflare account (for Worker deployment)

### First Time Setup
1. Clone the repository
2. Install dependencies: `yarn install`
3. Login to Cloudflare: `npx wrangler login`

### Development Mode
To run both the Webflow app and the Cloudflare Worker locally:

```bash
yarn start-dev
```

This will start:
- Webflow app on http://localhost:1337
- Vite dev server on http://localhost:5173
- Cloudflare Worker on http://127.0.0.1:8787

### Troubleshooting
If you see errors about API endpoints not found:
1. Make sure the Cloudflare Worker is running (`yarn dev:worker`)
2. Check the console for the API base URL being used
3. Ensure all ports are available (1337, 5173, 8787)

## Structure
- `/client` - React application code
- `/workers` - Cloudflare Workers code (serverless backend)
- `/server` - Legacy server code (not used in production)

## Deployment
1. Build both the app and worker: `yarn build:all`
2. Deploy the extension through the Webflow CLI: `webflow extension push`
