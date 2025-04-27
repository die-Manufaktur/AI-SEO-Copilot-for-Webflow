import { describe, it, expect } from 'vitest';
import { calculateSEOScore } from './seoUtils';
import type { SEOCheck } from '../types';
import { createMockSEOCheck } from './test-helpers';

describe('calculateSEOScore', () => {
  it('should return 0 for empty or null checks array', () => {
    expect(calculateSEOScore([])).toBe(0);
    expect(calculateSEOScore(null as unknown as SEOCheck[])).toBe(0);
  });

  it('should calculate score based on priority weights', () => {
    const checks: SEOCheck[] = [
      createMockSEOCheck({ title: 'Test High', priority: 'high' }),
      createMockSEOCheck({ title: 'Test Medium', priority: 'medium' }),
      createMockSEOCheck({ title: 'Test Low', priority: 'low' }),
    ];
    
    // All passed, so should be 100%
    expect(calculateSEOScore(checks)).toBe(100);
  });

  it('should calculate partial scores correctly', () => {
    const checks: SEOCheck[] = [
      createMockSEOCheck({ title: 'Test High', priority: 'high' }),
      createMockSEOCheck({ 
        title: 'Test Medium', 
        priority: 'medium', 
        passed: false, 
        recommendation: 'Fix this issue' 
      }),
      createMockSEOCheck({ title: 'Test Low', priority: 'low' }),
    ];
    
    // 3 (high) + 1 (low) out of 3 (high) + 2 (medium) + 1 (low) = 4/6 = 67%
    expect(calculateSEOScore(checks)).toBe(67);
  });

  it('should handle invalid priority by using medium as default', () => {
    const checks: SEOCheck[] = [
      createMockSEOCheck({ 
        title: 'Test Invalid', 
        priority: 'invalid' as any 
      }),
    ];
    
    // Should use medium (2) as default weight
    expect(calculateSEOScore(checks)).toBe(100);
  });

  it('should round scores to nearest integer', () => {
    const checks: SEOCheck[] = [
      createMockSEOCheck({ 
        title: 'Test High', 
        description: 'High priority check 1', 
        priority: 'high' 
      }),
      createMockSEOCheck({ 
        title: 'Test High 2', 
        description: 'High priority check 2', 
        priority: 'high', 
        passed: false, 
        recommendation: 'Fix this issue' 
      }),
      createMockSEOCheck({ 
        title: 'Test Medium', 
        description: 'Medium priority check', 
        priority: 'medium' 
      }),
    ];
    
    // 3 (high) + 2 (medium) out of 3 + 3 + 2 = 5/8 = 62.5%, rounded to 63%
    expect(calculateSEOScore(checks)).toBe(63);
  });

  it('should prevent division by zero', () => {
    // This is an edge case that shouldn't happen in practice but is handled in the code
    const checks: SEOCheck[] = [
      {} as unknown as SEOCheck
    ];
    
    expect(calculateSEOScore(checks)).toBe(0);
  });
});