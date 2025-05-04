/**
 * Represents the result of a single SEO check.
 */
export interface SEOCheck {
  title: string;
  description: string;
  passed: boolean;
  recommendation?: string;
  priority: 'high' | 'medium' | 'low';
  imageData?: Array<{
    name: string;
    shortName: string;
    size: number;
    url: string;
    mimeType?: string;
    isOptimized?: boolean;
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
  content?: string;
  minified?: boolean;
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
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  usesTitleAsOGTitle: boolean;
  usesDescriptionAsOGDescription: boolean;
  designerImages?: Array<{ 
    url: string;
    alt?: string;
    width?: number;
    height?: number;
    id?: string;
  }>;
}

/**
 * Scraped data from webpage
 */
export interface ScrapedPageData {
  title: string;
  metaDescription: string;
  content: string;
  paragraphs: string[];
  headings: Array<{ level: number; text: string }>;
  images: Array<{ src: string; alt: string; size?: number }>;
  internalLinks: string[];
  outboundLinks: string[];
  url: string;
  resources: {
    js: Resource[];
    css: Resource[];
  };
  schemaMarkup: SchemaMarkupResult;
}

/**
 * SEO Analysis Result
 */
export interface SEOAnalysisResult {
  checks: SEOCheck[];
  passedChecks: number;
  failedChecks: number;
  url: string;
  score: number;
  ogData?: OGMetadata;
  timestamp: string;
  apiDataUsed: boolean;
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
  isHomePage: boolean;
  siteInfo: WebflowSiteInfo;
  publishPath: string;
  webflowPageData?: WebflowPageData;
  pageAssets?: Array<{ url: string, alt: string, type: string, size?: number, mimeType?: string }>;
  debug?: boolean;
}