# Production Deployment Guide

## ⚠️ IMPORTANT: Before Deployment

This project uses a **modular worker architecture** with separate components for SEO analysis, web scraping, AI recommendations, and validation. All modules are deployed together as a single Cloudflare Worker.

### 1. Set Production Secrets
```bash
# Set the OpenAI API key as a Cloudflare secret (more secure than environment variables)
npx wrangler secret put OPENAI_API_KEY --env production
# Enter your OpenAI API key when prompted

# Optionally set GPT recommendations flag
npx wrangler secret put USE_GPT_RECOMMENDATIONS --env production
# Enter "true" to enable AI features
```

### 2. Deploy Worker to Cloudflare
```bash
# Deploy the modular worker to production
pnpm deploy:worker
```

### 3. Build Webflow Extension
```bash
# Build the client and create bundle
pnpm build
```

### 4. Upload to Webflow
- The `bundle.zip` file will be created in the project root
- Upload this file to Webflow Developer Console

## Production Environment Details

- **Worker URL**: `https://seo-copilot-api-production.paul-130.workers.dev`
- **Production Name**: `seo-copilot-api-production`
- **Environment**: `production`

## Security Notes

- ✅ API key is stored as Cloudflare secret (encrypted)
- ✅ Environment files are in .gitignore
- ✅ No secrets in source code
- ✅ CORS configured for Webflow domains only

## Build Process Summary

1. `pnpm deploy:worker` → Deploys modular worker (all 4 components) to Cloudflare
2. `pnpm build` → Creates client build + Webflow bundle
3. Upload `bundle.zip` to Webflow

### Worker Architecture
The deployed worker includes:
- **SEO Analysis Module**: Core SEO checking logic
- **Web Scraper Module**: Page content extraction
- **AI Recommendations Module**: OpenAI integration
- **Validation Module**: Request sanitization and validation

## Troubleshooting

If deployment fails:
1. Check if you're logged into Wrangler: `pnpm wrangler whoami`
2. Verify secrets are set: `pnpm wrangler secret list --env production`
3. Check worker logs: `pnpm wrangler tail --env production`