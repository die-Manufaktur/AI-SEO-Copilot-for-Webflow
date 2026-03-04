# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core
- `pnpm dev` - Start full dev environment (Vite + Webflow extension + Cloudflare Worker)
- `pnpm build` - Build production extension bundle
- `pnpm check` - TypeScript type checking
- `pnpm lint` - ESLint across client, shared, and workers

### Testing
- `pnpm test` - Run all tests with coverage
- `pnpm test:unit` - Unit tests only
- `pnpm test:watch` - Watch mode
- `pnpm test:ui` - Vitest UI
- `pnpm test:bundle` - Bundle validation tests
- `pnpm test:workers` - Worker-specific tests
- `pnpm test:e2e` - Playwright end-to-end tests
- `pnpm test:coverage` - Tests with HTML coverage report

### Deployment
- `pnpm deploy:worker` - Deploy Worker to production (maintainer only)
- `pnpm deploy:staging` - Deploy Worker to staging
- `pnpm deploy:production` - Full production deploy with validation checks
- `pnpm validate:config` / `pnpm validate:env` - Pre-deploy validation

### Release
- `pnpm release` - Semantic release
- `pnpm release:dry` - Dry-run release
- `pnpm commit` - Conventional commit via git-cz

### Worker Development
- `npx wrangler dev ./workers/index.ts --port 8787` - Run Worker locally
- `npx wrangler secret put OPENAI_API_KEY` - Set production secrets

## Architecture

**Webflow Designer Extension** for SEO analysis. Modular monorepo with three components:

1. **React Client** (`client/`) - Extension frontend (React 19 + TypeScript + Vite + Tailwind CSS v4 + Radix UI)
2. **Cloudflare Worker** (`workers/`) - Backend API (Hono framework) for scraping, SEO analysis, AI recommendations, OAuth
3. **Shared** (`shared/`) - Common TypeScript types and utilities

### Key File Paths

| Area | Path | Purpose |
|------|------|---------|
| **Entry points** | `client/src/main.tsx` | React app entry |
| | `workers/index.ts` | Worker entry |
| **Config** | `vite.config.ts` | Vite + Webflow compatibility |
| | `client/vitest.config.ts` | Test config (tests run from `client/`) |
| | `wrangler.toml` | Cloudflare Worker config |
| | `playwright.config.ts` | E2E test config |
| **Types** | `shared/types/index.ts` | Core TypeScript interfaces |
| | `shared/types/language.ts` | Multilingual support (9 languages) |
| **Worker modules** | `workers/modules/seoAnalysis.ts` | SEO analysis engine |
| | `workers/modules/aiRecommendations.ts` | Multilingual OpenAI integration |
| | `workers/modules/webScraper.ts` | Web scraping |
| | `workers/modules/oauthProxy.ts` | OAuth proxy |
| | `workers/modules/validation.ts` | Request validation |
| **Client core** | `client/src/lib/api.ts` | HTTP client for worker communication |
| | `client/src/lib/webflowDesignerApi.ts` | Webflow Designer API integration |
| | `client/src/lib/webflowInsertion.ts` | Element insertion into Webflow pages |
| | `client/src/lib/contentIntelligence.ts` | Content analysis utilities |
| **Utilities** | `client/src/utils/htmlSanitizer.ts` | HTML sanitization (entity decode order matters: `&amp;` must be last) |
| | `client/src/utils/languageStorage.ts` | Per-site language preference storage |
| | `client/src/utils/keywordStorage.ts` | Per-page keyword persistence |
| | `client/src/utils/insertionHelpers.ts` | Webflow element insertion helpers |
| **Other** | `docs/plans/` | Implementation plan documents |
| | `scripts/` | Build and validation utilities |
| | `tests/e2e/` | Playwright E2E test specs |

### Design System
Built on **Tailwind CSS v4** with CSS custom properties under `@layer base` in `client/src/index.css`:
- Design tokens (colors, spacing, typography, shadows) defined as CSS variables following Figma specs
- Component library in `client/src/components/ui/` (~35 components)
- Key business components: `category-card`, `editable-recommendation`, `H2SelectionList`, `ImageAltTextList`, `BatchApplyButton`, `ApplyButton`, `schema-display`, `language-selector`
- Design system validation: `client/src/styles/design-system.test.ts`

### Environment Variables
#### Development (.env)
- `OPENAI_API_KEY` - OpenAI API key
- `USE_GPT_RECOMMENDATIONS=true` - Enable AI features
- `VITE_WORKER_URL=http://localhost:8787` - Local worker URL
- `VITE_FORCE_LOCAL_DEV=true` - Force local dev mode

#### Worker API
- `POST /api/analyze` - Main SEO analysis
- `GET /health` - Health check
- CORS: Webflow domains + localhost

### Development Workflow
1. Extension loads in Webflow Designer from `http://localhost:1337`
2. React client communicates with local Worker on port 8787
3. Worker performs web scraping and OpenAI API calls
4. Results displayed in extension UI with interactive recommendations

## Key Business Logic
- **SEO Analysis**: 18 checks (title, meta, content structure, keywords, images, schema, links, etc.)
- **AI Recommendations**: OpenAI-powered suggestions in 9 languages with auto site-language detection
- **Editable Recommendations**: Inline editing before applying to page
- **Batch Apply**: Apply multiple AI suggestions to Webflow elements at once
- **H2 Generation**: Per-row regenerate icons + "Generate All" header button
- **Image Alt Text**: Per-image AI alt text generation and apply
- **Schema Generation**: AI-powered schema markup based on page type with dynamic site data
- **Keyword Persistence**: Auto-saves keywords per page
- **Multilingual**: 9 languages, auto-detection from `<html lang>`, per-site preferences (see `shared/types/language.ts`)
