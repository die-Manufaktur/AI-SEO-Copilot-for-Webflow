# SEO Copilot Development Guide

## Prerequisites
- Node.js (v20 or higher)
- pnpm (v8 or higher)
- Cloudflare account (for Worker deployment)

## First Time Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/PMDevSolutions/seo-copilot
   cd seo-copilot
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Configure environment:
   ```bash
   cp .env.example .env
   ```
   Required variables:
   - `VITE_WEBFLOW_API_KEY`: Webflow API key
   - `VITE_WEBFLOW_SITE_ID`: Your site ID
   - `VITE_WEBFLOW_CLIENT_ID`: Your client ID
   - `USE_GPT_RECOMMENDATIONS`: Set to "true"

4. Login to Cloudflare:
   ```bash
   pnpm wrangler login
   ```

## Development Mode

Start the development environment:
```bash
pnpm start-dev
```

This launches:
- Webflow extension on http://localhost:1337
- Vite dev server on http://localhost:5173
- Cloudflare Worker on http://127.0.0.1:8787

### Development Workflow
1. Make changes to React components in `/client`
2. Update worker code in `/workers` if needed
3. Test changes in the Webflow Designer
4. Run type checks: `pnpm check`

## Project Structure
```
/
├── client/           # React application
│   ├── src/          # Source code
│   └── public/       # Static assets
├── workers/          # Cloudflare Workers
├── public/           # Built files
└── dist/            # Production build
```

## Troubleshooting

### API Endpoints Not Found
1. Check Cloudflare Worker:
   ```bash
   pnpm dev:worker
   ```
2. Verify environment variables in `.env`
3. Ensure ports 1337, 5173, and 8787 are available

### Build Issues
1. Clear build cache:
   ```bash
   rm -rf dist/ public/
   pnpm clean
   ```
2. Rebuild:
   ```bash
   pnpm build:all
   ```

### TypeScript Errors
1. Run type check:
   ```bash
   pnpm check
   ```
2. Update types if needed:
   ```bash
   pnpm install @webflow/designer-extension-typings@latest
   ```

## Deployment

1. Build the project:
   ```bash
   pnpm build:all
   ```

2. Deploy to Webflow:
   ```bash
   pnpm webflow extension push
   ```

3. Verify deployment in Webflow Designer

## Additional Resources
- [Full Documentation](https://ai-seo-copilot.gitbook.io/ai-seo-copilot)
- [Webflow Designer API Docs](https://developers.webflow.com/designer/docs)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
