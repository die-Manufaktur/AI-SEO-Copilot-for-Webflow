# CLAUDE.md 

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `pnpm dev` - Start full development environment (Vite + Webflow extension + Cloudflare Worker)
- `pnpm build` - Build production extension bundle  
- `pnpm check` - TypeScript type checking
- `pnpm test` - Run all tests with coverage
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:ui` - Run tests with Vitest UI
- `pnpm deploy:worker` - Deploy Cloudflare Worker to production (maintainer only)

### Worker Development
- `npx wrangler dev ./workers/index.ts --port 8787` - Run Cloudflare Worker locally
- `npx wrangler secret put OPENAI_API_KEY` - Set production secrets

## Architecture Overview

This is a **Webflow Designer Extension** for SEO analysis with a **modular monorepo architecture**:

### Core Components
1. **React Client** (`client/`) - Webflow extension frontend
2. **Cloudflare Worker API** (`workers/`) - Backend for web scraping and OpenAI integration  
3. **Shared Types & Utils** (`shared/`) - Common TypeScript interfaces and utilities

### Key Architecture Patterns
- **Modular Workers**: Each worker module handles specific functionality (SEO analysis, AI recommendations, web scraping)
- **Type-Safe Boundaries**: Shared types ensure consistency between client and worker
- **Environment-Based Configuration**: Different configs for development vs production
- **Asset Bundling**: Custom Vite plugin handles Webflow-specific requirements

### Development Environment
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 + Radix UI
- **Backend**: Cloudflare Workers + Hono framework 
- **Testing**: Vitest with jsdom environment
- **Package Management**: pnpm with workspaces

### Important File Paths
- `client/src/main.tsx` - React app entry point
- `workers/index.ts` - Cloudflare Worker entry point
- `shared/types/index.ts` - TypeScript interfaces
- `vite.config.ts` - Vite configuration with Webflow compatibility
- `wrangler.toml` - Cloudflare Worker configuration

### Environment Variables
#### Development (.env)
- `OPENAI_API_KEY` - OpenAI API key for AI recommendations
- `USE_GPT_RECOMMENDATIONS=true` - Enable AI features  
- `VITE_WORKER_URL=http://localhost:8787` - Local worker URL
- `VITE_FORCE_LOCAL_DEV=true` - Force local development mode

#### Worker Configuration
- API endpoints: `/api/analyze` (main SEO analysis), `/health` (health check)
- CORS configured for Webflow domains and localhost

### Development Workflow
1. Extension loads in Webflow Designer from `http://localhost:1337`
2. React client communicates with local Cloudflare Worker on port 8787
3. Worker performs web scraping and OpenAI API calls
4. Results displayed in extension UI with interactive recommendations

### Key Business Logic
- **SEO Analysis**: 18 different SEO checks (title tags, meta descriptions, content structure, etc.)
- **AI Recommendations**: OpenAI-powered suggestions for improvements
- **Schema Generation**: Intelligent schema markup recommendations based on page type
- **Keyword Persistence**: Automatically saves keywords per page for workflow continuity