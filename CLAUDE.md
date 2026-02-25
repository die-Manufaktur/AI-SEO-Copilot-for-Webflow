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

### Testing
- `pnpm test:unit` - Run unit tests only
- `pnpm test:bundle` - Run bundle validation tests
- `pnpm test:e2e` - Run Playwright end-to-end tests
- `pnpm test:coverage` - Run tests with HTML coverage report

### Deployment
- `pnpm deploy:worker` - Deploy Cloudflare Worker to production (maintainer only)
- `pnpm deploy:staging` - Deploy Worker to staging environment
- `pnpm deploy:production` - Full production deploy with validation checks

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
- **Package Management**: pnpm

### Important File Paths
- `client/src/main.tsx` - React app entry point
- `workers/index.ts` - Cloudflare Worker entry point
- `shared/types/index.ts` - TypeScript interfaces
- `vite.config.ts` - Vite configuration with Webflow compatibility
- `client/vitest.config.ts` - Test configuration (tests run from `client/`)
- `wrangler.toml` - Cloudflare Worker configuration
- `playwright.config.ts` - Playwright E2E test configuration
- `tests/e2e/` - Playwright end-to-end test specs
- `docs/plans/` - Implementation plan documents
- `scripts/` - Build and validation utilities

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

### Design System
The UI uses a design system built on CSS custom properties in `client/src/index.css`:
- **Design tokens**: Colors, spacing, typography, shadows defined as CSS variables
- **Component library**: Reusable components in `client/src/components/ui/`
  - `category-card.tsx` - Collapsible SEO category cards with score display
  - `circular-progress.tsx` - SVG circular progress indicator
  - `stats-summary.tsx` - Passed/to-improve statistics display
  - `header-controls.tsx` - Extension header with refresh/minimize/close controls
  - `dev-badge.tsx` - Development mode indicator
  - `BatchApplyButton.tsx` - Batch apply for AI recommendations
  - `H2SelectionList.tsx` - H2 heading element list with per-row Apply and Generate icon buttons
  - `editable-recommendation.tsx` - Inline editable recommendation with Apply/Regenerate icon buttons
- **Design system tests**: `client/src/styles/design-system.test.ts` validates token consistency

### Key Business Logic
- **SEO Analysis**: 18 different SEO checks (title tags, meta descriptions, content structure, etc.)
- **AI Recommendations**: OpenAI-powered suggestions for improvements in multiple languages
- **Editable Recommendations**: Users can edit AI-generated recommendations inline before copying
- **Batch Apply**: Apply multiple AI suggestions to Webflow elements at once
- **H2 Generate Buttons**: Per-row regenerate icons on H2 suggestions, plus a "Generate All" header button for batch regeneration
- **Schema Generation**: Intelligent schema markup recommendations based on page type
- **Keyword Persistence**: Automatically saves keywords per page for workflow continuity
- **Multilingual Support**: AI recommendations available in 9 languages with automatic site language detection

### Multilingual Features
The extension supports AI-generated SEO recommendations in multiple languages:

#### Supported Languages
- **English** (en) - English 🇺🇸
- **French** (fr) - Français 🇫🇷  
- **German** (de) - Deutsch 🇩🇪
- **Spanish** (es) - Español 🇪🇸
- **Italian** (it) - Italiano 🇮🇹
- **Japanese** (ja) - 日本語 🇯🇵
- **Portuguese** (pt) - Português 🇵🇹
- **Dutch** (nl) - Nederlands 🇳🇱
- **Polish** (pl) - Polski 🇵🇱

#### Language Detection & Selection
- **Automatic Detection**: Detects site language from `<html lang="...">` attribute or browser settings
- **Site-Specific Preferences**: Language preferences are saved per Webflow site
- **Default Indicator**: Language dropdown shows which language is detected as site default
- **Manual Override**: Users can choose any supported language regardless of detection
- **Persistent Settings**: Language choices are remembered across sessions per site

#### Implementation Files
- `shared/types/language.ts` - Language definitions and detection logic
- `client/src/components/ui/language-selector.tsx` - Language selection component
- `client/src/utils/languageStorage.ts` - Site-specific language preference storage
- `client/src/utils/htmlSanitizer.ts` - HTML sanitization for AI-generated content (entity decode order matters — `&amp;` must be last to prevent double-unescaping)
- `workers/modules/aiRecommendations.ts` - Multilingual AI recommendation generation
- `client/src/components/ui/editable-recommendation.tsx` - Inline editable recommendation component