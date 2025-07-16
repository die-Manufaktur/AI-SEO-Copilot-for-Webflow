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
 * Request payload for the analyze endpoint
 */
export interface AnalyzeSEORequest {
  keyphrase: string;
  url: string;
  isHomePage?: boolean;
  webflowPageData?: WebflowPageData;
  pageAssets?: Array<{ url: string; alt: string; type: string; size?: number; mimeType?: string }>;
  siteInfo?: WebflowSiteInfo;
  publishPath?: string;
  debug?: boolean;
  advancedOptions?: {
    pageType?: string;
    secondaryKeywords?: string; // Secondary keywords (comma-separated)
  };
}