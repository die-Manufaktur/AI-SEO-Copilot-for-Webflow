import { describe, it, expect } from 'vitest';
import { calculateSEOScore, shouldShowCopyButton } from './seoUtils';
import type { SEOCheck } from '../types';

describe('seoUtils', () => {
  describe('calculateSEOScore', () => {
    it('should return 0 for empty array', () => {
      expect(calculateSEOScore([])).toBe(0);
    });

    it('should return 0 for null or undefined input', () => {
      expect(calculateSEOScore(null as any)).toBe(0);
      expect(calculateSEOScore(undefined as any)).toBe(0);
    });

    it('should calculate 100% score when all checks pass', () => {
      const checks: SEOCheck[] = [
        { title: 'Check 1', description: 'Test', passed: true, priority: 'high' },
        { title: 'Check 2', description: 'Test', passed: true, priority: 'medium' },
        { title: 'Check 3', description: 'Test', passed: true, priority: 'low' }
      ];
      
      expect(calculateSEOScore(checks)).toBe(100);
    });

    it('should calculate 0% score when no checks pass', () => {
      const checks: SEOCheck[] = [
        { title: 'Check 1', description: 'Test', passed: false, priority: 'high' },
        { title: 'Check 2', description: 'Test', passed: false, priority: 'medium' },
        { title: 'Check 3', description: 'Test', passed: false, priority: 'low' }
      ];
      
      expect(calculateSEOScore(checks)).toBe(0);
    });

    it('should weight high priority checks more heavily', () => {
      const checksWithHighPriority: SEOCheck[] = [
        { title: 'High Check', description: 'Test', passed: true, priority: 'high' },
        { title: 'Low Check', description: 'Test', passed: false, priority: 'low' }
      ];
      
      const checksWithLowPriority: SEOCheck[] = [
        { title: 'High Check', description: 'Test', passed: false, priority: 'high' },
        { title: 'Low Check', description: 'Test', passed: true, priority: 'low' }
      ];
      
      const scoreHigh = calculateSEOScore(checksWithHighPriority);
      const scoreLow = calculateSEOScore(checksWithLowPriority);
      
      // High priority passing should result in higher score than low priority passing
      expect(scoreHigh).toBeGreaterThan(scoreLow);
    });

    it('should handle mixed priority levels correctly', () => {
      const checks: SEOCheck[] = [
        { title: 'High 1', description: 'Test', passed: true, priority: 'high' },   // 3 points
        { title: 'High 2', description: 'Test', passed: false, priority: 'high' },  // 0 points
        { title: 'Medium 1', description: 'Test', passed: true, priority: 'medium' }, // 2 points
        { title: 'Low 1', description: 'Test', passed: true, priority: 'low' }      // 1 point
      ];
      
      // Earned: 3 + 2 + 1 = 6 points
      // Total possible: 3 + 3 + 2 + 1 = 9 points
      // Score: (6/9) * 100 = 66.67 -> 67 (rounded)
      expect(calculateSEOScore(checks)).toBe(67);
    });

    it('should use medium weight as default for invalid priority', () => {
      const checks: SEOCheck[] = [
        { title: 'Valid', description: 'Test', passed: true, priority: 'high' },
        { title: 'Invalid', description: 'Test', passed: true, priority: 'invalid' as any }
      ];
      
      // Should not throw error and should use medium weight (2) for invalid priority
      const score = calculateSEOScore(checks);
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should calculate correct score with only high priority checks', () => {
      const checks: SEOCheck[] = [
        { title: 'High 1', description: 'Test', passed: true, priority: 'high' },
        { title: 'High 2', description: 'Test', passed: true, priority: 'high' },
        { title: 'High 3', description: 'Test', passed: false, priority: 'high' }
      ];
      
      // Earned: 3 + 3 = 6 points
      // Total possible: 3 + 3 + 3 = 9 points
      // Score: (6/9) * 100 = 66.67 -> 67 (rounded)
      expect(calculateSEOScore(checks)).toBe(67);
    });

    it('should calculate correct score with only medium priority checks', () => {
      const checks: SEOCheck[] = [
        { title: 'Medium 1', description: 'Test', passed: true, priority: 'medium' },
        { title: 'Medium 2', description: 'Test', passed: false, priority: 'medium' }
      ];
      
      // Earned: 2 points
      // Total possible: 2 + 2 = 4 points
      // Score: (2/4) * 100 = 50
      expect(calculateSEOScore(checks)).toBe(50);
    });

    it('should calculate correct score with only low priority checks', () => {
      const checks: SEOCheck[] = [
        { title: 'Low 1', description: 'Test', passed: true, priority: 'low' },
        { title: 'Low 2', description: 'Test', passed: true, priority: 'low' },
        { title: 'Low 3', description: 'Test', passed: true, priority: 'low' },
        { title: 'Low 4', description: 'Test', passed: false, priority: 'low' }
      ];
      
      // Earned: 1 + 1 + 1 = 3 points
      // Total possible: 1 + 1 + 1 + 1 = 4 points
      // Score: (3/4) * 100 = 75
      expect(calculateSEOScore(checks)).toBe(75);
    });

    it('should handle single check correctly', () => {
      const passedCheck: SEOCheck[] = [
        { title: 'Single', description: 'Test', passed: true, priority: 'high' }
      ];
      
      const failedCheck: SEOCheck[] = [
        { title: 'Single', description: 'Test', passed: false, priority: 'high' }
      ];
      
      expect(calculateSEOScore(passedCheck)).toBe(100);
      expect(calculateSEOScore(failedCheck)).toBe(0);
    });

    it('should round scores correctly', () => {
      // Create a scenario that results in a decimal score
      const checks: SEOCheck[] = [
        { title: 'Check 1', description: 'Test', passed: true, priority: 'high' },   // 3 points
        { title: 'Check 2', description: 'Test', passed: false, priority: 'medium' }, // 0 points
        { title: 'Check 3', description: 'Test', passed: false, priority: 'low' }     // 0 points
      ];
      
      // Earned: 3 points
      // Total possible: 3 + 2 + 1 = 6 points
      // Score: (3/6) * 100 = 50 (exactly)
      expect(calculateSEOScore(checks)).toBe(50);
    });

    it('should handle large numbers of checks', () => {
      const checks: SEOCheck[] = [];
      
      // Create 100 checks, half passing
      for (let i = 0; i < 100; i++) {
        checks.push({
          title: `Check ${i}`,
          description: 'Test',
          passed: i < 50, // First 50 pass
          priority: i < 33 ? 'high' : i < 66 ? 'medium' : 'low'
        });
      }
      
      const score = calculateSEOScore(checks);
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('shouldShowCopyButton', () => {
    it('should return true for keyphrase-related checks', () => {
      const keyphraseChecks = [
        "Keyphrase in Title",
        "Keyphrase in Meta Description",
        "Keyphrase in H1 Heading",
        "Keyphrase in H2 Headings", 
        "Keyphrase in Introduction",
        "Keyphrase in URL"
      ];
      
      keyphraseChecks.forEach(check => {
        expect(shouldShowCopyButton(check)).toBe(true);
      });
    });

    it('should return false for non-keyphrase checks', () => {
      const nonKeyphraseChecks = [
        "Title Length",
        "Meta Description Length",
        "Content Length",
        "Internal Links",
        "External Links",
        "Image Alt Text",
        "Heading Structure",
        "Page Speed",
        "Mobile Friendly",
        "HTTPS Usage",
        "Schema Markup",
        "Open Graph Tags"
      ];
      
      nonKeyphraseChecks.forEach(check => {
        expect(shouldShowCopyButton(check)).toBe(false);
      });
    });

    it('should be case sensitive', () => {
      expect(shouldShowCopyButton("keyphrase in title")).toBe(false);
      expect(shouldShowCopyButton("KEYPHRASE IN TITLE")).toBe(false);
      expect(shouldShowCopyButton("Keyphrase in Title")).toBe(true);
    });

    it('should handle empty string', () => {
      expect(shouldShowCopyButton("")).toBe(false);
    });

    it('should handle partial matches', () => {
      expect(shouldShowCopyButton("Keyphrase in")).toBe(false);
      expect(shouldShowCopyButton("in Title")).toBe(false);
      expect(shouldShowCopyButton("Keyphrase in Title Tag")).toBe(false);
    });

    it('should handle whitespace variations', () => {
      expect(shouldShowCopyButton(" Keyphrase in Title")).toBe(false);
      expect(shouldShowCopyButton("Keyphrase in Title ")).toBe(false);
      expect(shouldShowCopyButton("Keyphrase  in  Title")).toBe(false);
    });

    it('should return false for null or undefined input', () => {
      expect(shouldShowCopyButton(null as any)).toBe(false);
      expect(shouldShowCopyButton(undefined as any)).toBe(false);
    });

    it('should handle all exact matches correctly', () => {
      // Test each exact string individually to ensure precision
      expect(shouldShowCopyButton("Keyphrase in Title")).toBe(true);
      expect(shouldShowCopyButton("Keyphrase in Meta Description")).toBe(true);
      expect(shouldShowCopyButton("Keyphrase in H1 Heading")).toBe(true);
      expect(shouldShowCopyButton("Keyphrase in H2 Headings")).toBe(true);
      expect(shouldShowCopyButton("Keyphrase in Introduction")).toBe(true);
      expect(shouldShowCopyButton("Keyphrase in URL")).toBe(true);
    });

    it('should handle similar but different strings', () => {
      expect(shouldShowCopyButton("Keyphrase in H1")).toBe(false);
      expect(shouldShowCopyButton("Keyphrase in H2")).toBe(false);
      expect(shouldShowCopyButton("Keyphrase in Meta")).toBe(false);
      expect(shouldShowCopyButton("Title")).toBe(false);
      expect(shouldShowCopyButton("Meta Description")).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should work with real-world SEO check data', () => {
      const realWorldChecks: SEOCheck[] = [
        // Title checks (high priority)
        { title: 'Title Length', description: 'Title should be 50-60 characters', passed: true, priority: 'high' },
        { title: 'Keyphrase in Title', description: 'Title should contain target keyphrase', passed: false, priority: 'high' },
        
        // Meta description checks (high priority)
        { title: 'Meta Description Length', description: 'Meta description should be 150-160 characters', passed: true, priority: 'high' },
        { title: 'Keyphrase in Meta Description', description: 'Meta description should contain keyphrase', passed: true, priority: 'high' },
        
        // Content checks (medium priority)
        { title: 'Content Length', description: 'Content should be at least 300 words', passed: true, priority: 'medium' },
        { title: 'Keyphrase in H1 Heading', description: 'H1 should contain keyphrase', passed: false, priority: 'medium' },
        
        // Technical checks (low priority)
        { title: 'Image Alt Text', description: 'Images should have alt text', passed: true, priority: 'low' },
        { title: 'Internal Links', description: 'Page should have internal links', passed: true, priority: 'low' }
      ];
      
      const score = calculateSEOScore(realWorldChecks);
      
      // Verify score is reasonable
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(100);
      
      // Verify copy button logic for keyphrase checks
      expect(shouldShowCopyButton('Keyphrase in Title')).toBe(true);
      expect(shouldShowCopyButton('Keyphrase in Meta Description')).toBe(true);
      expect(shouldShowCopyButton('Keyphrase in H1 Heading')).toBe(true);
      expect(shouldShowCopyButton('Title Length')).toBe(false);
      expect(shouldShowCopyButton('Content Length')).toBe(false);
      expect(shouldShowCopyButton('Image Alt Text')).toBe(false);
    });

    it('should handle edge case combinations', () => {
      // Test with all invalid priorities
      const invalidPriorityChecks: SEOCheck[] = [
        { title: 'Check 1', description: 'Test', passed: true, priority: 'invalid' as any },
        { title: 'Check 2', description: 'Test', passed: false, priority: 'another-invalid' as any }
      ];
      
      // Should not crash and should return reasonable score
      const score = calculateSEOScore(invalidPriorityChecks);
      expect(typeof score).toBe('number');
      expect(score).toBe(50); // 1 out of 2 should pass with medium weight default
    });
  });
});