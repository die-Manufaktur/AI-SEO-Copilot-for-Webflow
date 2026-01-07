# Playbook - Local Development & Production Guide

## Quick Start (Zero Secrets)

This app runs **fully without any API keys or secrets**. AI recommendations use intelligent rule-based fallbacks.

### Prerequisites

- Node.js 18+
- pnpm 10+ (`npm install -g pnpm`)
- Webflow account (for testing in Designer)

### 1. Clone & Setup

```bash
# Clone repository
git clone https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow.git
cd AI-SEO-Copilot-for-Webflow

# Install dependencies
pnpm install

# Copy environment file (no secrets needed!)
cp .env.example .env
```

### 2. Start Development

```bash
# Start all services (Frontend + Extension Server + Worker)
pnpm dev
```

This starts three services concurrently:
- **Vite dev server**: http://localhost:5173 (React client)
- **Webflow extension server**: http://localhost:1337
- **Cloudflare Worker**: http://localhost:8787 (API backend)

### 3. Test in Webflow Designer

1. Open any project in Webflow Designer
2. Go to **Apps** panel (left sidebar)
3. Click **Add App** → **Development**
4. Enter URL: `http://localhost:1337`
5. Click **Add Development App**
6. Launch the extension and start analyzing!

## Run Commands Reference

### Development

```bash
# Full development stack
pnpm dev

# TypeScript type checking
pnpm check

# Run tests with coverage
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui
```

### Testing

```bash
# Unit tests
pnpm test:unit

# Integration tests
pnpm test:integration

# E2E tests (Playwright)
pnpm test:e2e

# E2E with visible browser
pnpm test:e2e:headed

# Coverage report
pnpm test:coverage
```

### Build

```bash
# Build for production
pnpm build

# Output:
# - dist/ folder (Vite build)
# - bundle.zip (Webflow extension package)
```

### Deployment (Maintainer Only)

```bash
# Deploy to staging
pnpm deploy:staging

# Deploy to production
pnpm deploy:production

# Deploy worker only
pnpm deploy:worker
```

## API Testing

### Health Check

```bash
curl http://localhost:8787/health
# Response: {"status":"ok"}
```

### SEO Analysis

```bash
curl -X POST http://localhost:8787/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "keyphrase": "web development",
    "url": "https://example.com",
    "isHomePage": false
  }'
```

### Expected Response Structure

```json
{
  "keyphrase": "web development",
  "url": "https://example.com",
  "isHomePage": false,
  "score": 72,
  "totalChecks": 18,
  "passedChecks": 13,
  "failedChecks": 5,
  "checks": [
    {
      "title": "Keyphrase in Title",
      "description": "...",
      "passed": true,
      "priority": "high",
      "recommendation": "..."
    }
  ]
}
```

## Optional: Enable OpenAI (For Enhanced AI)

If you want GPT-powered recommendations instead of rule-based:

```bash
# Edit .env file
OPENAI_API_KEY=sk-your-api-key-here
USE_GPT_RECOMMENDATIONS=true
```

The app works identically without this - you'll just get template-based recommendations instead of AI-generated ones.

## Optional: Enable Webflow Data API

For extended Webflow integration:

1. Create a Webflow App at https://webflow.com/dashboard/develop
2. Get Client ID and Secret
3. Add to `.env`:
   ```
   WEBFLOW_CLIENT_ID=your_client_id
   WEBFLOW_CLIENT_SECRET=your_secret
   ```

## Troubleshooting

### Port Already in Use

```bash
# Find and kill processes on ports
lsof -i :5173 -i :1337 -i :8787
kill -9 <PID>

# Or use the kill script (Windows)
pnpm kill-dev
```

### Worker Not Starting

```bash
# Check wrangler is installed
npx wrangler --version

# Start worker manually
npx wrangler dev ./workers/index.ts --port 8787
```

### CORS Errors

Ensure your `.env` has:
```
ALLOWED_ORIGINS=https://webflow.com,https://*.webflow-ext.com,https://*.webflow.io,http://localhost:5173,http://localhost:1337
```

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

## File Structure Quick Reference

```
.
├── client/src/           # React frontend
│   ├── pages/Home.tsx    # Main UI (75KB)
│   ├── lib/api.ts        # Backend API client
│   └── components/       # UI components
├── workers/              # Cloudflare Worker
│   ├── index.ts          # API entry point
│   └── modules/          # Business logic
├── shared/               # Shared types/utils
├── docs/                 # Documentation
│   ├── ArchitectureMap.md
│   ├── WireUpReport.md
│   └── Playbook.md
└── .env.example          # Environment template
```

## CI/CD

GitHub Actions workflow runs on every push:
- Install dependencies
- Type checking
- Unit tests
- Integration tests
- Build verification

See `.github/workflows/` for configuration.
