/**
 * Represents the result of a single SEO check.
 */
export interface SEOCheck {
  title: string;
  description: string;
  passed: boolean;
  recommendation?: string;
  priority: 'high' | 'medium' | 'low';
}