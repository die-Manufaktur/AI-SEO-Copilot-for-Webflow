// Re-export all shared types - single source of truth
export type { 
  SEOCheck,
  OGMetadata, 
  SEOAnalysisResult,
  WebflowPageData,
  AnalyzeSEORequest,
  WebflowDomain,
  WebflowSiteInfo,
  ScrapedPageData
} from '../../../shared/types';

// Add any client-specific types here that don't make sense in the shared types
// (currently none needed)