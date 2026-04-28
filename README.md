# AI SEO Copilot for Webflow

An advanced SEO analysis tool that performs 18 comprehensive checks with AI-powered recommendations for Webflow sites. Features multilingual AI recommendations in 9 languages with automatic site language detection.

## Quick Links
- [Full Documentation](https://ai-seo-copilot.gitbook.io/ai-seo-copilot)
- [Feature Requests](https://aiseocopilot.featurebase.app)
- [Roadmap](https://aiseocopilot.featurebase.app/roadmap)

## Features

- **Comprehensive SEO Analysis**: 18 different SEO checks covering all critical aspects
- **AI-Powered Recommendations**: OpenAI-powered suggestions for improvements
- **Multilingual Support**: AI recommendations in 9 languages with automatic site language detection
- **Editable Recommendations**: Edit AI suggestions inline before applying them to your page
- **Batch Apply**: Apply multiple AI suggestions to Webflow elements at once
- **Image Alt Text Generation**: Per-image AI-generated alt text with one-click apply
- **H2 Heading Suggestions**: Per-heading AI suggestions with individual and batch regeneration
- **Schema Markup Generation**: AI-powered schema recommendations populated with live site data
- **Keyword Persistence**: Automatically saves keywords per page for seamless workflow
- **Visual Progress Tracking**: Real-time SEO score calculation and progress indicators
- **Page-Specific Analysis**: Tailored analysis for homepage vs. other pages

### SEO Checks Include
- Title Tag Optimization
- Meta Description Analysis
- Content Structure Verification
- Keyword Density Analysis
- Keyphrase in Introduction
- Image Alt Text Optimization
- OpenGraph Tags Validation
- Schema Markup Validation
- URL Optimization
- Content Length Analysis
- Heading Hierarchy Check
- Internal & Outbound Link Analysis
- Next-Gen Image Format Detection
- Code Minification Check
- Image File Size Optimization
- Intelligent Schema Recommendations

## Multilingual AI Recommendations

The extension provides AI-powered SEO recommendations in **9 languages** with intelligent site language detection:

### Supported Languages
| Language | Code | Native Name |
|----------|------|-------------|
| English | en | English |
| French | fr | Francais |
| German | de | Deutsch |
| Spanish | es | Espanol |
| Italian | it | Italiano |
| Japanese | ja | Japanese |
| Portuguese | pt | Portugues |
| Dutch | nl | Nederlands |
| Polish | pl | Polski |

### Smart Language Detection
- **Automatic Detection**: Detects your site's language from the `<html lang="...">` attribute
- **Browser Fallback**: Uses browser language settings if no site language is detected
- **Visual Indicator**: Shows which language is detected as the site default in the dropdown
- **Site-Specific Memory**: Remembers your language choice for each Webflow site
- **Manual Override**: Choose any language regardless of automatic detection

### How It Works
1. When you first use the extension on a site, it automatically detects the site's language
2. AI recommendations appear in the detected language by default
3. You can change the language anytime using the dropdown selector
4. Your language preference is saved per site and remembered for future sessions
5. The dropdown shows which language is the detected default with a "(default)" indicator

## Local Development Setup

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow.git
   cd AI-SEO-Copilot-for-Webflow
   ```

2. Install dependencies using pnpm:
   ```bash
   pnpm install
   ```

3. Configure environment:
   Create a `.env` file in the root directory:

   **Required for AI features:**
   - `OPENAI_API_KEY`: Your OpenAI API key for AI recommendations
   - `USE_GPT_RECOMMENDATIONS`: Set to `true` to enable AI features

   **Required for development:**
   - `VITE_WORKER_URL`: Set to `http://localhost:8787` for local development
   - `VITE_FORCE_LOCAL_DEV`: Set to `true` to ensure local development mode

4. Start development server:
   ```bash
   pnpm dev
   ```

   This starts three services concurrently:
   - **Vite dev server** on `http://localhost:5173` (React client)
   - **Webflow extension server** on `http://localhost:1337` (Extension host)
   - **Cloudflare Worker** on `http://localhost:8787` (API backend)

5. Access the app:
   - Add `http://localhost:1337` in Webflow Designer's Apps panel
   - Launch the extension from Webflow Designer

## Architecture

This project uses a **modular monorepo architecture** with three main components:

### Tech Stack
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 + Radix UI
- **Backend**: Cloudflare Workers + Hono framework
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Package Management**: pnpm
- **CI/CD**: GitHub Actions + semantic-release

### Design System
The UI is built on a **Figma-based design system** implemented with Tailwind CSS v4 and CSS custom properties:
- Design tokens (colors, spacing, typography, shadows) defined as CSS variables in `client/src/index.css`
- ~35 reusable components in `client/src/components/ui/`
- Design token consistency validated by automated tests

### Directory Structure
```
├── client/                    # React frontend application
│   ├── src/
│   │   ├── components/ui/     # ~35 reusable UI components
│   │   ├── pages/             # Home, OAuthCallback
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # API client, Webflow APIs, content intelligence
│   │   ├── utils/             # Storage, sanitization, insertion helpers
│   │   └── styles/            # Design system tests
│   └── vitest.config.ts       # Test configuration
├── workers/                   # Cloudflare Worker backend
│   ├── modules/
│   │   ├── seoAnalysis.ts     # SEO analysis engine
│   │   ├── aiRecommendations.ts  # Multilingual OpenAI integration
│   │   ├── webScraper.ts      # Web scraping
│   │   ├── oauthProxy.ts      # OAuth proxy
│   │   └── validation.ts      # Request validation
│   └── index.ts               # Worker entry point (Hono routes)
├── shared/                    # Shared types and utilities
│   ├── types/                 # TypeScript interfaces, language definitions
│   └── utils/                 # SEO utils, schema population, string utils
├── tests/e2e/                 # Playwright end-to-end tests
├── scripts/                   # Build and validation utilities
├── docs/plans/                # Implementation plan documents
└── public/                    # Built extension assets (generated)
```

### Key Components

#### React Client (`client/`)
- **Webflow Designer API**: Integration layer for reading/writing Webflow page elements
- **Content Intelligence**: Analyzes page content for SEO recommendations
- **Insertion Helpers**: Handles applying AI suggestions directly to Webflow elements
- **State Management**: React Query for server state, local storage for preferences

#### Cloudflare Worker (`workers/`)
- **SEO Analysis**: Performs 18 different checks against scraped page content
- **AI Recommendations**: Generates multilingual suggestions via OpenAI
- **Web Scraper**: Fetches and parses target page HTML
- **OAuth Proxy**: Handles Webflow OAuth authentication flow
- **API Endpoints**: `POST /api/analyze` (SEO analysis), `GET /health` (health check)

#### Shared (`shared/`)
- **Types**: Centralized TypeScript interfaces for client-worker communication
- **Utilities**: String processing, URL handling, schema population, SEO scoring

## Building for Production

> **Important**: Only deploy to production when explicitly requested by the project maintainer.

```bash
# Build the extension bundle
pnpm build

# Deploy Cloudflare Worker (maintainer only)
pnpm deploy:worker
```

The build process creates a `bundle.zip` file ready for Webflow extension submission.

## Testing

```bash
pnpm test              # Run all tests with coverage
pnpm test:unit         # Unit tests only
pnpm test:watch        # Watch mode
pnpm test:ui           # Vitest UI
pnpm test:bundle       # Bundle validation
pnpm test:workers      # Worker-specific tests
pnpm test:e2e          # Playwright E2E tests
pnpm test:coverage     # HTML coverage report
pnpm check             # TypeScript type checking
pnpm lint              # ESLint
```

## Environment Variables

### Development (.env)
```env
# AI Features
OPENAI_API_KEY=your_openai_key
USE_GPT_RECOMMENDATIONS=true

# Development Setup
VITE_WORKER_URL=http://localhost:8787
VITE_FORCE_LOCAL_DEV=true
```

### Production (Wrangler Secrets)
```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put USE_GPT_RECOMMENDATIONS
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

- **Issues**: [GitHub Issues](https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow/issues)
- **Feature Requests**: [Feature Board](https://aiseocopilot.featurebase.app)
- **Documentation**: [GitBook Documentation](https://ai-seo-copilot.gitbook.io/ai-seo-copilot)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
