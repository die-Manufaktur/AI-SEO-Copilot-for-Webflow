export interface SEOCheck {
  title: string;
  description: string;
  passed: boolean;
  recommendation?: string;
  priority: 'high' | 'medium' | 'low'; // Added priority field
}

export interface SEOAnalysisResult {
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

export interface AnalyzeRequest {
  url: string;
  keyphrase: string;
}