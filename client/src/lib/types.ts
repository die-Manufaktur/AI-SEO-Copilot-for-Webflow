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
}

export interface AnalyzeRequest {
  url: string;
  keyphrase: string;
}