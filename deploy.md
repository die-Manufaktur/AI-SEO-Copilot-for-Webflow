# Production Deployment Guide

## ⚠️ IMPORTANT: Before Deployment

### 1. Set Production API Key as Secret
```bash
# Set the OpenAI API key as a Cloudflare secret (more secure than environment variables)
npx wrangler secret put OPENAI_API_KEY --env production
# Enter your OpenAI API key when prompted
```

### 2. Deploy Worker to Cloudflare
```bash
# Deploy the worker to production
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

1. `pnpm deploy:worker` → Deploys worker to Cloudflare
2. `pnpm build` → Creates client build + Webflow bundle
3. Upload `bundle.zip` to Webflow

## Troubleshooting

If deployment fails:
1. Check if you're logged into Wrangler: `pnpm wrangler whoami`
2. Verify secrets are set: `pnpm wrangler secret list --env production`
3. Check worker logs: `pnpm wrangler tail --env production`