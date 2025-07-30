/**
 * Represents the result of a single SEO check.
 */
export interface SEOCheck {
  title: string;
  description: string;
  passed: boolean;
  priority: 'high' | 'medium' | 'low';
  recommendation?: string;
  introPhrase?: string;
  matchedKeyword?: string; // Which keyword was found (primary or secondary)
  imageData?: Array<{
    url: string;
    name: string;
    shortName: string;
    size?: number;
    mimeType?: string;
    alt?: string;
  }>;
}

/**
 * Type for Open Graph metadata
 */
export interface OGMetadata {
  title: string;
  description: string;
  image: string;
  imageWidth: string;
  imageHeight: string;
}

/**
 * Type for JS/CSS resources
 */
export interface Resource {
  url: string;
}

/**
 * Type for Schema Markup detection results
 */
export interface SchemaMarkupResult {
  hasSchema: boolean;
  schemaTypes: string[];
  schemaCount: number;
}

/**
 * Webflow Page Data fetched from Designer API
 */
export interface WebflowPageData {
  title: string;
  metaDescription: string;
  canonicalUrl?: string;
  openGraphImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  usesTitleAsOpenGraphTitle?: boolean;
  usesDescriptionAsOpenGraphDescription?: boolean;
  designerImages?: Array<{ url: string }>;
}

/**
 * Scraped data from webpage
 */
export interface ScrapedPageData {
  url: string;
  title: string;
  metaDescription: string;
  headings: Array<{
    level: number;
    text: string;
  }>;
  paragraphs: string[];
  images: Array<{
    src: string;
    alt: string;
    size?: number;
  }>;
  internalLinks: string[];
  outboundLinks: string[];
  resources: {
    js: Resource[];
    css: Resource[];
  };
  canonicalUrl: string;
  metaKeywords: string;
  ogImage: string;
  content: string;
  schemaMarkup: SchemaMarkupResult;
}

/**
 * SEO Analysis Result
 */
export interface SEOAnalysisResult {
  keyphrase: string;
  url: string;
  isHomePage: boolean;
  score: number;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  checks: SEOCheck[];
  ogData?: {
    title: string;
    description: string;
    image: string;
    imageWidth: string;
    imageHeight: string;
  };
  timestamp?: string;
  apiDataUsed?: boolean;
}

/**
 * Webflow Domain Info
 */
export interface WebflowDomain {
  id: string;
  name: string;
  host: string;
  publicUrl: string;
  publishedOn: string;
}

/**
 * Webflow Site Info
 */
export interface WebflowSiteInfo {
  id?: string;
  siteName: string;
  siteUrl?: string;
  domains?: WebflowDomain[];
}

/**
 * Schema recommendation for a specific page type
 */
export interface SchemaRecommendation {
  name: string;
  description: string;
  documentationUrl: string;
  googleSupport: 'yes' | 'no' | 'partial';
  googleSupportNote?: string;
  jsonLdCode: string;
  isRequired: boolean; // true for main schemas, false for optional
}

/**
 * Page type with associated schema recommendations
 */
export interface PageTypeSchema {
  pageType: string;
  schemas: SchemaRecommendation[];
}

/**
 * Worker environment configuration
 */
export interface WorkerEnvironment {
  OPENAI_API_KEY: string;
  USE_GPT_RECOMMENDATIONS?: string;
  ALLOWED_ORIGINS?: string;
}

/**
 * Advanced options for SEO analysis and AI recommendations
 */
export interface AdvancedOptions {
  pageType?: string;
  secondaryKeywords?: string; // Secondary keywords (comma-separated)
}

/**
 * Asset interface for SEO analysis (images, etc.)
 */
export interface Asset {
  url: string;
  alt: string;
  type: string;
  size?: number;
  mimeType?: string;
  source?: string;
}

/**
 * Page keywords storage interface
 */
export interface PageKeywords {
  [pageId: string]: string;
}

/**
 * Request payload for the analyze endpoint
 */
export interface AnalyzeSEORequest {
  keyphrase: string;
  url: string;
  isHomePage?: boolean;
  webflowPageData?: WebflowPageData;
  pageAssets?: Asset[];
  siteInfo?: WebflowSiteInfo;
  publishPath?: string;
  debug?: boolean;
  advancedOptions?: AdvancedOptions;
}