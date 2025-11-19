import { describe, it, expect } from 'vitest';
import { 
  createInsertionRequest, 
  canApplyRecommendation, 
  getApplyDescription,
  type RecommendationContext 
} from './insertionHelpers';

describe('insertionHelpers', () => {
  describe('createInsertionRequest - Title checks', () => {
    it('should create page_title request for "Keyphrase in Title" check', () => {
      const context: RecommendationContext = {
        checkTitle: 'Keyphrase in Title',
        recommendation: 'New SEO-Optimized Title',
        pageId: 'test-page-id'
      };
      
      const request = createInsertionRequest(context);
      
      expect(request).not.toBeNull();
      expect(request?.type).toBe('page_title');
      expect(request?.value).toBe('New SEO-Optimized Title');
      expect(request?.pageId).toBe('test-page-id');
    });

    it('should handle various title check formats', () => {
      const titleChecks = [
        'Keyphrase in Title',
        'Title Tag',
        'Page Title',
        'SEO Title',
        'Title'
      ];
      
      titleChecks.forEach(checkTitle => {
        const request = createInsertionRequest({
          checkTitle,
          recommendation: 'Test Title',
          pageId: 'test-id'
        });
        
        expect(request?.type).toBe('page_title');
      });
    });

    it('should return null for non-insertable checks', () => {
      const nonInsertableChecks = [
        'Content Length',
        'Keyphrase Density',
        'Image Alt Attributes',
        'Internal Links'
      ];
      
      nonInsertableChecks.forEach(checkTitle => {
        const request = createInsertionRequest({
          checkTitle,
          recommendation: 'Test Content',
          pageId: 'test-id'
        });
        
        expect(request).toBeNull();
      });
    });
  });

  describe('canApplyRecommendation - Title checks', () => {
    it('should return true for "Keyphrase in Title"', () => {
      expect(canApplyRecommendation('Keyphrase in Title')).toBe(true);
    });

    it('should return true for existing meta description check', () => {
      expect(canApplyRecommendation('Keyphrase in Meta Description')).toBe(true);
    });

    it('should return false for non-insertable checks', () => {
      expect(canApplyRecommendation('Content Length')).toBe(false);
      expect(canApplyRecommendation('Keyphrase Density')).toBe(false);
    });
  });

  describe('getApplyDescription - Title checks', () => {
    it('should return correct description for title checks', () => {
      expect(getApplyDescription('Keyphrase in Title')).toBe('Apply as page title');
      expect(getApplyDescription('Title Tag')).toBe('Apply as page title');
      expect(getApplyDescription('Page Title')).toBe('Apply as page title');
    });

    it('should return correct description for meta description checks', () => {
      expect(getApplyDescription('Keyphrase in Meta Description')).toBe('Apply as meta description');
    });
  });

  describe('createInsertionRequest - URL checks', () => {
    it('should create page_slug request for "Keyphrase in URL" check', () => {
      const context: RecommendationContext = {
        checkTitle: 'Keyphrase in URL',
        recommendation: 'optimized-url-slug',
        pageId: 'test-page-id'
      };
      
      const request = createInsertionRequest(context);
      
      expect(request).not.toBeNull();
      expect(request?.type).toBe('page_slug');
      expect(request?.value).toBe('optimized-url-slug');
      expect(request?.pageId).toBe('test-page-id');
    });

    it('should handle various URL check formats', () => {
      const urlChecks = [
        'Keyphrase in URL',
        'URL Slug',
        'Page URL',
        'SEO URL'
      ];
      
      urlChecks.forEach(checkTitle => {
        const request = createInsertionRequest({
          checkTitle,
          recommendation: 'test-slug',
          pageId: 'test-id'
        });
        
        expect(request?.type).toBe('page_slug');
      });
    });
  });

  describe('canApplyRecommendation - URL checks', () => {
    it('should return true for "Keyphrase in URL"', () => {
      expect(canApplyRecommendation('Keyphrase in URL')).toBe(true);
    });
  });

  describe('getApplyDescription - URL checks', () => {
    it('should return correct description for URL checks', () => {
      expect(getApplyDescription('Keyphrase in URL')).toBe('Apply as page URL slug');
      expect(getApplyDescription('URL Slug')).toBe('Apply as page URL slug');
    });
  });

  describe('createInsertionRequest - Schema checks', () => {
    it('should create custom_code request for schema markup', () => {
      const context: RecommendationContext = {
        checkTitle: 'Schema Markup',
        recommendation: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article"
        }),
        pageId: 'test-page-id'
      };
      
      const request = createInsertionRequest(context);
      
      expect(request).not.toBeNull();
      expect(request?.type).toBe('custom_code');
      expect(request?.value).toContain('@context');
      expect(request?.location).toBe('head');
    });

    it('should handle various schema check formats', () => {
      const schemaChecks = [
        'Schema Markup',
        'Structured Data',
        'JSON-LD Schema',
        'Schema.org'
      ];
      
      schemaChecks.forEach(checkTitle => {
        const request = createInsertionRequest({
          checkTitle,
          recommendation: '{"@type":"Thing"}',
          pageId: 'test-id'
        });
        
        expect(request?.type).toBe('custom_code');
        expect(request?.location).toBe('head');
      });
    });
  });

  describe('canApplyRecommendation - Schema checks', () => {
    it('should return true for schema-related checks', () => {
      expect(canApplyRecommendation('Schema Markup')).toBe(true);
      expect(canApplyRecommendation('Structured Data')).toBe(true);
    });
  });

  describe('getApplyDescription - Schema checks', () => {
    it('should return correct description for schema checks', () => {
      expect(getApplyDescription('Schema Markup')).toBe('Apply schema to page head');
      expect(getApplyDescription('Structured Data')).toBe('Apply schema to page head');
    });
  });
});