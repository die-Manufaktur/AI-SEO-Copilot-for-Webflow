# Architecture Map

## System Overview

AI SEO Copilot is a **Webflow Designer Extension** that provides comprehensive SEO analysis with AI-powered recommendations. The app runs as an extension inside the Webflow Designer interface.

```
┌─────────────────────────────────────────────────────────────────┐
│                    WEBFLOW DESIGNER                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              AI SEO COPILOT EXTENSION                    │    │
│  │  ┌─────────────────┐    ┌─────────────────────────────┐ │    │
│  │  │  React Client   │───▶│  Cloudflare Worker API      │ │    │
│  │  │  (localhost:    │    │  (localhost:8787)           │ │    │
│  │  │   1337/5173)    │◀───│                             │ │    │
│  │  └─────────────────┘    └─────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
                    ┌─────────────────┐
                    │  Target Website │
                    │  (for scraping) │
                    └─────────────────┘
```

## Component Architecture

### 1. Frontend (React Client)

**Location**: `client/`

```
client/
├── src/
│   ├── main.tsx                    # App entry point
│   ├── App.tsx                     # Root component with providers
│   ├── pages/
│   │   ├── Home.tsx                # Main SEO analysis UI (75KB)
│   │   └── OAuthCallback.tsx       # OAuth flow handler
│   ├── components/
│   │   ├── ui/                     # Radix UI components (60+ files)
│   │   ├── Onboarding.tsx          # First-time user experience
│   │   ├── HelpSystem.tsx          # Help/guidance system
│   │   ├── Footer.tsx              # Extension footer
│   │   └── WebflowAppWrapper.tsx   # Webflow context provider
│   ├── contexts/
│   │   ├── AuthContext.tsx         # Authentication state
│   │   ├── HelpContext.tsx         # Help system state
│   │   └── InsertionContext.tsx    # Content insertion state
│   ├── lib/
│   │   ├── api.ts                  # Backend API client
│   │   ├── webflowDesignerApi.ts   # Webflow Designer API
│   │   ├── webflowDataApi.ts       # Webflow Data API
│   │   ├── contentIntelligence.ts  # Content analysis
│   │   └── queryClient.ts          # React Query config
│   ├── services/
│   │   ├── aiRecommendations.ts    # Client-side AI fallbacks
│   │   ├── analytics.ts            # Usage analytics
│   │   ├── rollbackService.ts      # Change rollback
│   │   └── impactAnalysis.ts       # SEO impact tracking
│   └── hooks/                      # Custom React hooks
```

**Technology Stack**:
- React 19 with TypeScript
- Vite for build/dev
- Tailwind CSS v4
- Radix UI primitives
- React Query for server state
- wouter for routing

### 2. Backend (Cloudflare Worker)

**Location**: `workers/`

```
workers/
├── index.ts                    # Hono app entry point
├── middleware/
│   └── cors.ts                 # CORS configuration
└── modules/
    ├── seoAnalysis.ts          # 18 SEO checks (850 lines)
    ├── aiRecommendations.ts    # AI/fallback recommendations
    ├── webScraper.ts           # URL content scraping
    ├── oauthProxy.ts           # OAuth token proxy
    └── validation.ts           # Request validation
```

**API Endpoints**:

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/analyze` | POST | Main SEO analysis | No |
| `/health` | GET | Health check | No |
| `/oauth/token` | POST | Exchange auth code | No |
| `/oauth/refresh` | POST | Refresh token | No |
| `/oauth/user` | GET | Get user info | Yes (token) |
| `/test-keywords` | GET | Debug endpoint | No |

### 3. Shared Code

**Location**: `shared/`

```
shared/
├── types/
│   ├── index.ts            # Main TypeScript interfaces
│   └── language.ts         # Multilingual support types
└── utils/
    ├── seoUtils.ts         # SEO helper functions
    ├── stringUtils.ts      # Text processing
    ├── schemaRecommendations.ts  # Schema.org helpers
    ├── schemaPopulation.ts       # Dynamic schema generation
    ├── urlUtils.ts         # URL parsing utilities
    ├── fileUtils.ts        # File handling
    └── formatUtils.ts      # Formatting helpers
```

## Data Flow

### SEO Analysis Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   User      │     │  React       │     │  Cloudflare     │
│   Input     │────▶│  Client      │────▶│  Worker         │
│  (keyphrase,│     │              │     │                 │
│   URL)      │     │              │     │                 │
└─────────────┘     └──────────────┘     └────────┬────────┘
                                                   │
                                                   ▼
                    ┌──────────────┐     ┌─────────────────┐
                    │  SEO Results │◀────│  Web Scraper    │
                    │  + AI Recs   │     │  + Analysis     │
                    └──────────────┘     └─────────────────┘
```

### Component Communication

```
┌─────────────────────────────────────────────────────────────┐
│                       App.tsx                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ QueryClient │  │ AuthContext │  │ InsertionContext    │  │
│  │  Provider   │  │  Provider   │  │    Provider         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│           │              │                    │              │
│           └──────────────┼────────────────────┘              │
│                          ▼                                   │
│                   ┌─────────────┐                           │
│                   │  Home.tsx   │                           │
│                   │  (Main UI)  │                           │
│                   └─────────────┘                           │
│                          │                                   │
│         ┌────────────────┼────────────────┐                 │
│         ▼                ▼                ▼                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────────┐        │
│  │ SEO Checks │  │ Language   │  │ Schema Display │        │
│  │ Display    │  │ Selector   │  │                │        │
│  └────────────┘  └────────────┘  └────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## SEO Checks (18 Total)

| # | Check Name | Priority | AI Recommendation |
|---|-----------|----------|-------------------|
| 1 | Keyphrase in Title | High | Yes (copyable) |
| 2 | Keyphrase in Meta Description | High | Yes (copyable) |
| 3 | Keyphrase in URL | Medium | Yes (copyable) |
| 4 | Content Length | High | No |
| 5 | Keyphrase Density | Medium | No |
| 6 | Keyphrase in Introduction | Medium | Yes (copyable) |
| 7 | Keyphrase in H1 Heading | High | Yes (copyable) |
| 8 | Keyphrase in H2 Headings | Medium | Yes (copyable) |
| 9 | Image Alt Attributes | Low | Yes (advice) |
| 10 | Internal Links | Medium | Yes (advice) |
| 11 | Outbound Links | Low | Yes (advice) |
| 12 | Next-Gen Image Formats | Low | No |
| 13 | OG Image | Medium | No |
| 14 | OG Title and Description | Medium | No |
| 15 | Heading Hierarchy | High | No |
| 16 | Code Minification | Low | No |
| 17 | Schema Markup | Medium | No |
| 18 | Image File Size | Medium | No |

## Dependency Graph

### External Dependencies

```
┌─────────────────────────────────────────────────────────┐
│                    AI SEO Copilot                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  OPTIONAL EXTERNAL SERVICES:                             │
│  ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │ OpenAI API      │    │ Webflow Data API            │ │
│  │ (AI features)   │    │ (Extended metadata access)  │ │
│  │ [OPTIONAL]      │    │ [OPTIONAL]                  │ │
│  └─────────────────┘    └─────────────────────────────┘ │
│                                                          │
│  REQUIRED RUNTIME:                                       │
│  ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │ Webflow         │    │ Cloudflare Workers          │ │
│  │ Designer        │    │ (or local wrangler)         │ │
│  │ [REQUIRED]      │    │ [REQUIRED]                  │ │
│  └─────────────────┘    └─────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Package Dependencies (Key)

**Frontend**:
- `react` ^19.1.1
- `@tanstack/react-query` ^5.87.1
- `@radix-ui/*` (UI primitives)
- `tailwindcss` ^4.1.11
- `hono` ^4.9.7 (shared with worker)

**Backend**:
- `hono` ^4.9.7
- `openai` ^5.19.1 (optional)
- `cheerio` ^1.1.2

## Environment Configuration

### Development

```
VITE_WORKER_URL=http://localhost:8787
VITE_FORCE_LOCAL_DEV=true
NODE_ENV=development
```

### Production

```
VITE_WORKER_URL=https://your-worker.workers.dev
NODE_ENV=production
# Optional: OPENAI_API_KEY (set via wrangler secret)
```

## Build Outputs

```
dist/                    # Vite build output
├── index.html          # SPA entry
├── assets/             # JS/CSS bundles
└── ...

bundle.zip              # Webflow extension package
```

## Multilingual Support

Supported languages for AI recommendations:
- English (en) - Default
- French (fr)
- German (de)
- Spanish (es)
- Italian (it)
- Japanese (ja)
- Portuguese (pt)
- Dutch (nl)
- Polish (pl)

Language detection order:
1. User's manual selection (saved per site)
2. HTML `lang` attribute of target page
3. Browser language settings
4. Default to English
