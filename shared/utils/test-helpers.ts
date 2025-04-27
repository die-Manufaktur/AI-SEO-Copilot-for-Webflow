import type { SEOCheck } from '../types';

export const createMockSEOCheck = (
  overrides: Partial<SEOCheck> = {}
): SEOCheck => ({
  title: 'Mock SEO Check',
  description: 'A mock SEO check for testing',
  priority: 'medium',
  passed: true,
  ...overrides
});