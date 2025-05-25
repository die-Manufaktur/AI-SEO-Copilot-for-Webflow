// Import the shared SEOCheck type
import type { SEOCheck } from '../../../shared/types';

interface SEOAnalysisResult {
  checks: SEOCheck[];
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

interface WebflowPageData {
  title: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  usesTitleAsOGTitle: boolean;
  usesDescriptionAsOGDescription: boolean;
}

// Only re-export shared types
export type { 
  SEOCheck,
  OGMetadata, 
  SEOAnalysisResult,
  WebflowPageData,
  AnalyzeSEORequest 
} from '../../../shared/types';

// Add any client-specific types here that don't make sense in the shared types
// No duplicate interface definitions