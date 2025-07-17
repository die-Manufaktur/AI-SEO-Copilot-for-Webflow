# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Development Server
```bash
pnpm dev
```
Starts the development environment with:
- Vite dev server on localhost:5173
- Webflow extension server on localhost:1337
- Cloudflare Worker on localhost:8787

### Testing
```bash
pnpm test           # Run tests with coverage
pnpm test:watch     # Run tests in watch mode
pnpm test:ui        # Run tests with UI
```

### Type Checking
```bash
pnpm check          # TypeScript type checking
```

### Building & Deployment
⚠️ **IMPORTANT**: Do not run build or deploy commands unless explicitly requested by the user.
Focus on development work only.

```bash
pnpm build          # Build for production (creates bundle.zip) - USER ONLY
pnpm deploy:worker  # Deploy Cloudflare Worker to production - USER ONLY
```

### Webflow Extension Commands
```bash
webflow extension serve    # Serve extension locally
webflow extension bundle   # Bundle extension for production
```

## Architecture Overview

This is a **Webflow Designer Extension** that provides AI-powered SEO analysis for Webflow sites. It consists of three main components:

### 1. React Client App (`client/src/`)
- **Framework**: React 19 with TypeScript, Vite build system
- **UI**: Tailwind CSS v4 + Radix UI components
- **State Management**: React Query for server state
- **Routing**: Wouter for client-side routing
- **Entry Point**: `client/src/main.tsx`
- **Main App**: `client/src/App.tsx`

### 2. Cloudflare Worker API (`workers/`)
- **Runtime**: Cloudflare Workers with Hono framework
- **Entry Point**: `workers/index.ts`
- **Purpose**: 
  - Web scraping and SEO analysis
  - OpenAI integration for AI recommendations
  - CORS handling for Webflow integration
- **API Endpoints**:
  - `POST /api/analyze` - Main SEO analysis endpoint
  - `GET /health` - Health check

### 3. Shared Types & Utils (`shared/`)
- **Types**: TypeScript interfaces in `shared/types/index.ts`
- **Utils**: Shared utilities for string/file processing and SEO logic

## Key Integrations

### Webflow Designer API
- Uses `@webflow/designer-extension-typings` for type safety
- Accesses page data, site info, and DOM elements
- Requires specific permissions defined in `webflow.json`

### OpenAI Integration
- Uses `gpt-3.5-turbo` for AI-powered SEO recommendations
- Includes prompt injection sanitization
- Handles rate limiting and retries

### SEO Analysis Engine
The app performs 18 different SEO checks:
- Title/meta description keyphrase analysis
- Content length and structure
- Image optimization (alt text, file size, formats)
- OpenGraph metadata
- Schema markup detection
- Code minification analysis
- Link analysis (internal/external)

#### Secondary Keywords Feature
The app supports secondary keywords functionality:
- **Background Processing**: Checks primary keyword first, then secondary keywords if primary fails
- **Pass-on-First-Match**: SEO checks pass as soon as any keyword (primary or secondary) is found
- **UI Behavior**: Users see simple pass/fail results without individual keyword breakdowns
- **Failure Messages**: Include "or any secondary keywords" to indicate broader keyword testing
- **Input Format**: Comma-separated secondary keywords (e.g., "website design, development services")

**Supported Checks**: Title, Meta Description, URL, Introduction, H1, H2 headings use secondary keywords

## Development Workflow

NO EMOJIS!!!

### File Structure
```
client/              # React frontend
├── src/
│   ├── components/  # React components
│   ├── pages/       # Page components  
│   ├── hooks/       # Custom React hooks
│   ├── lib/         # Client utilities
│   └── utils/       # Client-specific utilities
workers/             # Cloudflare Worker backend
shared/              # Shared types and utilities
public/              # Built assets (generated)
```

### Build Process
1. **Development**: `pnpm dev` runs all services concurrently
2. **Production**: `pnpm build` creates `bundle.zip` for Webflow
3. **Worker Deploy**: `npx wrangler deploy` for Cloudflare Workers

### Environment Variables
Create `.env` file with:
```
OPENAI_API_KEY=your_openai_key
USE_GPT_RECOMMENDATIONS=true
VITE_WORKER_URL=http://localhost:8787
VITE_FORCE_LOCAL_DEV=true
```

Production secrets via Wrangler:
```bash
npx wrangler secret put OPENAI_API_KEY
```

### ⚠️ **CRITICAL: Local Development Configuration**

**ISSUE**: The client app automatically routes API requests to production when it detects `window.webflow`, even in development.

**SOLUTION**: Always ensure `.env` contains:
```
VITE_FORCE_LOCAL_DEV=true
VITE_WORKER_URL=http://localhost:8787
```

**Symptoms of misconfiguration**:
- No worker logs in Wrangler terminal during API calls
- New worker features not appearing in client
- API requests going to `seo-copilot-api-production.paul-130.workers.dev` instead of `localhost:8787`

**To verify correct setup**:
1. Check that `pnpm dev` shows worker running on `http://127.0.0.1:8787`
2. Visit `http://localhost:8787/test-keywords` - should return JSON response
3. Worker logs should appear in terminal when analyzing pages
4. Browser Network tab should show requests to `localhost:8787/api/analyze`

If worker logs are missing, check `.env` file and restart dev server.

## Testing

- **Framework**: Vitest with React Testing Library
- **Environment**: jsdom for DOM simulation
- **Coverage**: Built-in coverage reporting
- **Setup**: `client/src/setupTests.ts`

## Important Notes

### Webflow Extension Requirements
- Extension must be bundled to `/public` directory
- Uses custom Vite plugin to handle `navigator.userAgent` compatibility
- Requires specific CORS configuration for Webflow domains

### Security Considerations
- All AI prompts are sanitized to prevent injection attacks
- Input validation on all API endpoints
- CORS restricted to Webflow domains

### Performance
- Uses manual code splitting for vendor chunks
- Image optimization analysis with size thresholds
- Cloudflare Workers for fast global edge performance

## Package Management
Always use `pnpm` as specified in `packageManager` field of package.json.