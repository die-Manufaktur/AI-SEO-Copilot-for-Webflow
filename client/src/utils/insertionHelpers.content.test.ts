/**
 * Tests for Content Element Apply Functionality (H1, H2, Introduction)
 * NOTE: These features are now ENABLED with Webflow Designer API v2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  createInsertionRequest, 
  canApplyRecommendation, 
  getApplyDescription,
  type RecommendationContext 
} from './insertionHelpers';
import type { WebflowInsertionRequest } from '../types/webflow-data-api';

describe('Content Element Apply Functionality - ENABLED', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('H1 Heading Apply Functionality', () => {
    const h1Context: RecommendationContext = {
      checkTitle: 'Keyphrase in H1 Heading',
      recommendation: 'Optimized H1 with keyphrase',
      pageId: 'page_123'
    };

    it('should recognize H1 heading check as applicable (ENABLED)', () => {
      // H1 insertion is now enabled with Webflow Designer API v2
      expect(canApplyRecommendation('Keyphrase in H1 Heading')).toBe(true);
    });

    it('should create h1_heading insertion request (ENABLED)', () => {
      // H1 insertion is now enabled with Webflow Designer API v2
      const result = createInsertionRequest(h1Context);
      
      expect(result).not.toBeNull();
      expect(result?.type).toBe('h1_heading');
      expect(result?.value).toBe('Optimized H1 with keyphrase');
      expect(result?.pageId).toBe('page_123');
    });

    it('should provide specific description for H1 (ENABLED)', () => {
      // H1 insertion is now enabled, should return specific description
      expect(getApplyDescription('Keyphrase in H1 Heading')).toBe('Apply as H1 heading');
    });

    it('should create H1 request even without pageId (ENABLED)', () => {
      const contextWithoutPageId: RecommendationContext = {
        checkTitle: 'Keyphrase in H1 Heading',
        recommendation: 'Optimized H1 with keyphrase'
      };

      const result = createInsertionRequest(contextWithoutPageId);
      
      expect(result).not.toBeNull();
      expect(result?.type).toBe('h1_heading');
      expect(result?.value).toBe('Optimized H1 with keyphrase');
      expect(result?.pageId).toBeUndefined();
    });
  });

  describe('H2 Heading Apply Functionality', () => {
    const h2Context: RecommendationContext = {
      checkTitle: 'Keyphrase in H2 Headings',
      recommendation: 'Optimized first H2 with keyphrase',
      pageId: 'page_123'
    };

    it('should recognize H2 heading check as applicable (ENABLED)', () => {
      // H2 insertion is now enabled with Webflow Designer API v2
      expect(canApplyRecommendation('Keyphrase in H2 Headings')).toBe(true);
    });

    it('should create h2_heading insertion request (ENABLED)', () => {
      // H2 insertion is now enabled with Webflow Designer API v2
      const result = createInsertionRequest(h2Context);
      
      expect(result).not.toBeNull();
      expect(result?.type).toBe('h2_heading');
      expect(result?.value).toBe('Optimized first H2 with keyphrase');
      expect(result?.pageId).toBe('page_123');
    });

    it('should provide specific description for H2 (ENABLED)', () => {
      // H2 insertion is now enabled, should return specific description
      expect(getApplyDescription('Keyphrase in H2 Headings')).toBe('Apply as first H2 heading');
    });

    it('should create H2 insertion with proper configuration (ENABLED)', () => {
      const result = createInsertionRequest(h2Context);
      
      expect(result).not.toBeNull();
      expect(result?.type).toBe('h2_heading');
    });
  });

  describe('Introduction Paragraph Apply Functionality', () => {
    const introContext: RecommendationContext = {
      checkTitle: 'Keyphrase in Introduction',
      recommendation: 'Optimized introduction paragraph with keyphrase',
      pageId: 'page_123'
    };

    it('should recognize introduction check as NOT applicable (DISABLED)', () => {
      // Introduction insertion is disabled for 'Keyphrase in Introduction' check per user request
      expect(canApplyRecommendation('Keyphrase in Introduction')).toBe(false);
    });

    it('should NOT create introduction insertion request (DISABLED)', () => {
      // Introduction insertion is disabled for 'Keyphrase in Introduction' check per user request
      const result = createInsertionRequest(introContext);
      
      expect(result).toBeNull();
    });

    it('should provide no description for introduction (DISABLED)', () => {
      // Introduction insertion is disabled for 'Keyphrase in Introduction' check per user request
      expect(getApplyDescription('Keyphrase in Introduction')).toBe('This recommendation cannot be applied automatically');
    });

    it('should NOT create introduction context (DISABLED)', () => {
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

    it('should create insertion request even with empty recommendations', () => {
      const emptyRecommendationContext: RecommendationContext = {
        checkTitle: 'Keyphrase in H1 Heading',
        recommendation: '',
        pageId: 'page_123'
      };

      const result = createInsertionRequest(emptyRecommendationContext);
      
      expect(result).not.toBeNull();
      expect(result?.type).toBe('h1_heading');
      expect(result?.value).toBe('');
    });

    it('should handle case-insensitive check title matching for enabled types', () => {
      // All these should return true now since the types are enabled
      expect(canApplyRecommendation('KEYPHRASE IN H1 HEADING')).toBe(true);
      expect(canApplyRecommendation('keyphrase in h2 headings')).toBe(true);
      // 'Keyphrase In Introduction' should return false since it's specifically disabled
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