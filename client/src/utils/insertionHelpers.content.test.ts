/**
 * Tests for Content Element Apply Functionality (H1, H2, Introduction)
 * NOTE: These features are DISABLED due to Webflow Designer API limitations (issue #504)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  createInsertionRequest, 
  canApplyRecommendation, 
  getApplyDescription,
  type RecommendationContext 
} from './insertionHelpers';
import type { WebflowInsertionRequest } from '../types/webflow-data-api';

describe('Content Element Apply Functionality - DISABLED', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('H1 Heading Apply Functionality', () => {
    const h1Context: RecommendationContext = {
      checkTitle: 'Keyphrase in H1 Heading',
      recommendation: 'Optimized H1 with keyphrase',
      pageId: 'page_123'
    };

    it('should NOT recognize H1 heading check as applicable (DISABLED)', () => {
      // H1 insertion is disabled due to Webflow Designer API limitations
      expect(canApplyRecommendation('Keyphrase in H1 Heading')).toBe(false);
    });

    it('should return null for h1_heading insertion request (DISABLED)', () => {
      // H1 insertion is disabled due to Webflow Designer API limitations
      const result = createInsertionRequest(h1Context);
      
      expect(result).toBeNull();
    });

    it('should provide fallback description for H1 (DISABLED)', () => {
      // H1 insertion is disabled, should return fallback description
      expect(getApplyDescription('Keyphrase in H1 Heading')).toBe('Apply content');
    });

    it('should return null for H1 context regardless of pageId (DISABLED)', () => {
      const contextWithoutPageId: RecommendationContext = {
        checkTitle: 'Keyphrase in H1 Heading',
        recommendation: 'Optimized H1 with keyphrase'
      };

      const result = createInsertionRequest(contextWithoutPageId);
      
      expect(result).toBeNull();
    });
  });

  describe('H2 Heading Apply Functionality', () => {
    const h2Context: RecommendationContext = {
      checkTitle: 'Keyphrase in H2 Headings',
      recommendation: 'Optimized first H2 with keyphrase',
      pageId: 'page_123'
    };

    it('should NOT recognize H2 heading check as applicable (DISABLED)', () => {
      // H2 insertion is disabled due to Webflow Designer API limitations
      expect(canApplyRecommendation('Keyphrase in H2 Headings')).toBe(false);
    });

    it('should return null for h2_heading insertion request (DISABLED)', () => {
      // H2 insertion is disabled due to Webflow Designer API limitations
      const result = createInsertionRequest(h2Context);
      
      expect(result).toBeNull();
    });

    it('should provide fallback description for H2 (DISABLED)', () => {
      // H2 insertion is disabled, should return fallback description
      expect(getApplyDescription('Keyphrase in H2 Headings')).toBe('Apply content');
    });

    it('should return null for H2 insertion regardless of configuration (DISABLED)', () => {
      const result = createInsertionRequest(h2Context);
      
      expect(result).toBeNull();
    });
  });

  describe('Introduction Paragraph Apply Functionality', () => {
    const introContext: RecommendationContext = {
      checkTitle: 'Keyphrase in Introduction',
      recommendation: 'Optimized introduction paragraph with keyphrase',
      pageId: 'page_123'
    };

    it('should NOT recognize introduction check as applicable (DISABLED)', () => {
      // Introduction insertion is disabled due to Webflow Designer API limitations
      expect(canApplyRecommendation('Keyphrase in Introduction')).toBe(false);
    });

    it('should return null for introduction insertion request (DISABLED)', () => {
      // Introduction insertion is disabled due to Webflow Designer API limitations
      const result = createInsertionRequest(introContext);
      
      expect(result).toBeNull();
    });

    it('should provide fallback description for introduction (DISABLED)', () => {
      // Introduction insertion is disabled, should return fallback description
      expect(getApplyDescription('Keyphrase in Introduction')).toBe('Apply content');
    });

    it('should return null for introduction context regardless of configuration (DISABLED)', () => {
      const contextWithSelector: RecommendationContext = {
        checkTitle: 'Keyphrase in Introduction',
        recommendation: 'Optimized introduction',
        pageId: 'page_123'
      };

      const result = createInsertionRequest(contextWithSelector);
      
      expect(result).toBeNull();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should return null for unsupported content check titles', () => {
      const unsupportedContext: RecommendationContext = {
        checkTitle: 'Unsupported Content Check',
        recommendation: 'Some recommendation'
      };

      expect(createInsertionRequest(unsupportedContext)).toBeNull();
      expect(canApplyRecommendation('Unsupported Content Check')).toBe(false);
    });

    it('should return null for disabled insertion types even with empty recommendations', () => {
      const emptyRecommendationContext: RecommendationContext = {
        checkTitle: 'Keyphrase in H1 Heading',
        recommendation: '',
        pageId: 'page_123'
      };

      const result = createInsertionRequest(emptyRecommendationContext);
      
      expect(result).toBeNull();
    });

    it('should handle case-insensitive check title matching for disabled types', () => {
      // All these should return false now since the types are disabled
      expect(canApplyRecommendation('KEYPHRASE IN H1 HEADING')).toBe(false);
      expect(canApplyRecommendation('keyphrase in h2 headings')).toBe(false);
      expect(canApplyRecommendation('Keyphrase In Introduction')).toBe(false);
    });

    it('should provide fallback description for unknown types', () => {
      expect(getApplyDescription('Unknown Check Type')).toBe('Apply content');
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain existing functionality for page title', () => {
      const titleContext: RecommendationContext = {
        checkTitle: 'Keyphrase in Title',
        recommendation: 'Optimized page title',
        pageId: 'page_123'
      };

      const result = createInsertionRequest(titleContext);
      
      expect(result).not.toBeNull();
      expect(result?.type).toBe('page_title');
    });

    it('should maintain existing functionality for meta description', () => {
      const metaContext: RecommendationContext = {
        checkTitle: 'Keyphrase in Meta Description',
        recommendation: 'Optimized meta description',
        pageId: 'page_123'
      };

      const result = createInsertionRequest(metaContext);
      
      expect(result).not.toBeNull();
      expect(result?.type).toBe('meta_description');
    });

    it('should maintain existing functionality for URL slug', () => {
      const urlContext: RecommendationContext = {
        checkTitle: 'Keyphrase in URL',
        recommendation: 'optimized-url-slug',
        pageId: 'page_123'
      };

      const result = createInsertionRequest(urlContext);
      
      expect(result).not.toBeNull();
      expect(result?.type).toBe('page_slug');
    });
  });
});