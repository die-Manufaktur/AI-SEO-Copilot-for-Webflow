// Import the shared SEOCheck type
import type { SEOCheck } from '../../../shared/types';

interface SEOAnalysisResult {
  checks: SEOCheck[]; // Uses the imported SEOCheck
  passedChecks: number;
  failedChecks: number;
  url: string;
  score: number;
  ogData?: {
    title: string;
    description: string;
    image: string;
    imageWidth: string;
    imageHeight: string;
  };
  timestamp: string;
  apiDataUsed: boolean;
}

// NEW: Data fetched directly from Webflow API
interface WebflowPageData {
  title: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  usesTitleAsOGTitle: boolean; // Added
  usesDescriptionAsOGDescription: boolean; // Added
  // Add other relevant fields if needed, e.g., search title/desc
}

// Re-export shared types for convenience in the client code
export type { 
  SEOCheck,
  OGMetadata, 
  SEOAnalysisResult,
  WebflowPageData,
  AnalyzeSEORequest 
} from '../../../shared/types';

// Add any client-specific types here that don't make sense in the shared types
export interface AnalyzeRequest {
  url: string;
  keyphrase: string;
}