# AI SEO Copilot for Webflow

An advanced SEO analysis tool that performs 18 comprehensive checks with AI-powered recommendations for Webflow sites. Features multilingual AI recommendations in 9 languages with automatic site language detection.

## Quick Links
- [Full Documentation](https://ai-seo-copilot.gitbook.io/ai-seo-copilot)
- [Feature Requests](https://aiseocopilot.featurebase.app)
- [Roadmap](https://aiseocopilot.featurebase.app/roadmap)

## Features

- **🔍 Comprehensive SEO Analysis**: 18 different SEO checks covering all critical aspects
- **🤖 AI-Powered Recommendations**: OpenAI-powered suggestions for improvements
- **🌐 Multilingual Support**: AI recommendations in 9 languages with automatic site language detection
- **💾 Keyword Persistence**: Automatically saves keywords per page for seamless workflow
- **📊 Visual Progress Tracking**: Real-time SEO score calculation and progress indicators
- **🎯 Page-Specific Analysis**: Tailored analysis for homepage vs. other pages
- **🖼️ Image Optimization**: Alt text, size, and format recommendations
- **📱 Modern UI**: Clean, responsive interface with status indicators
- **⚡ Fast Performance**: Optimized for quick analysis and feedback

### SEO Checks Include:
- Title Tag Optimization
- Meta Description Analysis
- Content Structure Verification
- Keyword Density Analysis
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
- **Intelligent Schema Recommendations**: AI-powered schema markup generation with dynamic site data population

## Multilingual AI Recommendations

The extension provides AI-powered SEO recommendations in **9 languages** with intelligent site language detection:

### Supported Languages
- 🇺🇸 **English** - English
- 🇫🇷 **French** - Français
- 🇩🇪 **German** - Deutsch
- 🇪🇸 **Spanish** - Español
- 🇮🇹 **Italian** - Italiano
- 🇯🇵 **Japanese** - 日本語
- 🇵🇹 **Portuguese** - Português
- 🇳🇱 **Dutch** - Nederlands
- 🇵🇱 **Polish** - Polski

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
5. The dropdown clearly shows which language is the detected default with "(default)" indicator

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
   Create a `.env` file in the root directory with the following variables:
   
   **Required for AI features:**
   - `OPENAI_API_KEY`: Your OpenAI API key for AI recommendations
   - `USE_GPT_RECOMMENDATIONS`: Set to "true" to enable AI features
   
   **Required for development:**
   - `VITE_WORKER_URL`: Set to "http://localhost:8787" for local development
   - `VITE_FORCE_LOCAL_DEV`: Set to "true" to ensure local development mode

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

### Directory Structure
```
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Client utilities
│   │   └── utils/         # Client-specific utilities
│   │       └── languageStorage.ts # Site-specific language preferences
├── workers/               # Cloudflare Worker backend
│   ├── modules/           # Modular worker components
│   │   ├── seoAnalysis.ts    # SEO analysis logic
│   │   ├── webScraper.ts     # Web scraping functionality
│   │   ├── aiRecommendations.ts # Multilingual OpenAI integration
│   │   └── validation.ts     # Request validation
│   └── index.ts           # Main worker entry point
├── shared/                # Shared types and utilities
│   ├── types/             # TypeScript type definitions
│   │   ├── language.ts    # Multilingual support & language detection
│   │   └── index.ts       # Main type definitions
│   └── utils/             # Shared utilities & intelligent schema population
└── public/                # Built extension assets (generated)
```

### Key Components

#### 1. **React Client App** (`client/`)
- **Framework**: React 19 with TypeScript, Vite build system
- **UI**: Tailwind CSS v4 + Radix UI components
- **State Management**: React Query for server state
- **Entry Point**: `client/src/main.tsx`

#### 2. **Cloudflare Worker API** (`workers/`)
- **Runtime**: Cloudflare Workers with Hono framework
- **Architecture**: Modular design with focused components
- **Purpose**: Web scraping, SEO analysis, OpenAI integration
- **API Endpoints**:
  - `POST /api/analyze` - Main SEO analysis endpoint
  - `GET /health` - Health check

#### 3. **Shared Types & Utils** (`shared/`)
- **Types**: Centralized TypeScript interfaces
- **Utils**: Shared utilities for string processing, SEO logic, and intelligent schema population

### Development Workflow

The modular architecture enables:
- **Independent development** of frontend and backend
- **Type safety** across all boundaries
- **Easy testing** with focused modules
- **Scalable deployment** with separate services

## Building for Production

⚠️ **Important**: Only deploy to production when explicitly requested by the project maintainer.

```bash
# Build the extension bundle
pnpm build

# Deploy Cloudflare Worker (maintainer only)
pnpm deploy:worker
```

The build process creates a `bundle.zip` file ready for Webflow extension submission.

## Testing

```bash
pnpm test           # Run tests with coverage
pnpm test:watch     # Run tests in watch mode
pnpm test:ui        # Run tests with UI
pnpm check          # TypeScript type checking
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