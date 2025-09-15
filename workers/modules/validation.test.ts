import { describe, it, expect } from 'vitest';
import { validateAnalyzeRequest, createValidationError } from './validation';
import type { AnalyzeSEORequest } from '../../shared/types/index';

describe('validation', () => {
  describe('validateAnalyzeRequest', () => {
    const validRequest: AnalyzeSEORequest = {
      keyphrase: 'SEO optimization',
      url: 'https://example.com'
    };

    it('should validate a minimal valid request', () => {
      expect(validateAnalyzeRequest(validRequest)).toBe(true);
    });

    it('should reject null or undefined', () => {
      expect(validateAnalyzeRequest(null)).toBe(false);
      expect(validateAnalyzeRequest(undefined)).toBe(false);
    });

    it('should reject non-object values', () => {
      expect(validateAnalyzeRequest('string')).toBe(false);
      expect(validateAnalyzeRequest(123)).toBe(false);
      expect(validateAnalyzeRequest([])).toBe(false);
    });

    it('should reject requests without keyphrase', () => {
      expect(validateAnalyzeRequest({ url: 'https://example.com' })).toBe(false);
    });

    it('should reject requests with empty keyphrase', () => {
      expect(validateAnalyzeRequest({ 
        keyphrase: '', 
        url: 'https://example.com' 
      })).toBe(false);
    });

    it('should reject requests with non-string keyphrase', () => {
      expect(validateAnalyzeRequest({ 
        keyphrase: 123, 
        url: 'https://example.com' 
      })).toBe(false);
    });

    it('should reject requests without url', () => {
      expect(validateAnalyzeRequest({ keyphrase: 'SEO' })).toBe(false);
    });

    it('should reject requests with empty url', () => {
      expect(validateAnalyzeRequest({ 
        keyphrase: 'SEO', 
        url: '' 
      })).toBe(false);
    });

    it('should reject requests with non-string url', () => {
      expect(validateAnalyzeRequest({ 
        keyphrase: 'SEO', 
        url: 123 
      })).toBe(false);
    });

    it('should validate requests with valid isHomePage', () => {
      expect(validateAnalyzeRequest({
        ...validRequest,
        isHomePage: true
      })).toBe(true);

      expect(validateAnalyzeRequest({
        ...validRequest,
        isHomePage: false
      })).toBe(true);
    });

    it('should reject requests with invalid isHomePage', () => {
      expect(validateAnalyzeRequest({
        ...validRequest,
        isHomePage: 'true' as any
      })).toBe(false);
    });

    describe('advancedOptions validation', () => {
      it('should validate requests with valid advancedOptions', () => {
        expect(validateAnalyzeRequest({
          ...validRequest,
          advancedOptions: {
            pageType: 'article',
            secondaryKeywords: 'marketing, optimization'
          }
        })).toBe(true);
      });

      it('should reject non-object advancedOptions', () => {
        expect(validateAnalyzeRequest({
          ...validRequest,
          advancedOptions: 'string' as any
        })).toBe(false);
      });

      it('should reject invalid pageType', () => {
        expect(validateAnalyzeRequest({
          ...validRequest,
          advancedOptions: {
            pageType: 123 as any
          }
        })).toBe(false);
      });

      it('should reject invalid secondaryKeywords', () => {
        expect(validateAnalyzeRequest({
          ...validRequest,
          advancedOptions: {
            secondaryKeywords: 123 as any
          }
        })).toBe(false);
      });
    });

    describe('webflowPageData validation', () => {
      it('should validate requests with valid webflowPageData', () => {
        expect(validateAnalyzeRequest({
          ...validRequest,
          webflowPageData: {
            title: 'Page Title',
            metaDescription: 'Meta description',
            canonicalUrl: 'https://example.com/canonical',
            openGraphImage: 'https://example.com/image.jpg',
            usesTitleAsOpenGraphTitle: true,
            usesDescriptionAsOpenGraphDescription: false
          }
        })).toBe(true);
      });

      it('should reject non-object webflowPageData', () => {
        expect(validateAnalyzeRequest({
          ...validRequest,
          webflowPageData: 'string' as any
        })).toBe(false);
      });

      it('should reject invalid string fields', () => {
        const stringFields = ['title', 'metaDescription', 'canonicalUrl', 'openGraphImage'];
        
        for (const field of stringFields) {
          expect(validateAnalyzeRequest({
            ...validRequest,
            webflowPageData: {
              [field]: 123
            }
          })).toBe(false);
        }
      });

      it('should reject invalid boolean fields', () => {
        const booleanFields = ['usesTitleAsOpenGraphTitle', 'usesDescriptionAsOpenGraphDescription'];
        
        for (const field of booleanFields) {
          expect(validateAnalyzeRequest({
            ...validRequest,
            webflowPageData: {
              [field]: 'true'
            }
          })).toBe(false);
        }
      });

      it('should allow undefined optional fields', () => {
        expect(validateAnalyzeRequest({
          ...validRequest,
          webflowPageData: {
            title: 'Title',
            metaDescription: undefined,
            canonicalUrl: undefined
          }
        })).toBe(true);
      });
    });

    describe('pageAssets validation', () => {
      it('should validate requests with valid pageAssets', () => {
        expect(validateAnalyzeRequest({
          ...validRequest,
          pageAssets: [
            {
              url: 'https://example.com/image.jpg',
              alt: 'Image alt text',
              type: 'image',
              size: 1024,
              mimeType: 'image/jpeg'
            }
          ]
        })).toBe(true);
      });

      it('should reject non-array pageAssets', () => {
        expect(validateAnalyzeRequest({
          ...validRequest,
          pageAssets: 'string' as any
        })).toBe(false);
      });

      it('should reject invalid asset objects', () => {
        expect(validateAnalyzeRequest({
          ...validRequest,
          pageAssets: [null]
        })).toBe(false);

        expect(validateAnalyzeRequest({
          ...validRequest,
          pageAssets: ['string' as any]
        })).toBe(false);
      });

      it('should reject assets with invalid required fields', () => {
        // Missing url
        expect(validateAnalyzeRequest({
          ...validRequest,
          pageAssets: [{
            alt: 'Alt text',
            type: 'image'
          }]
        })).toBe(false);

        // Invalid url type
        expect(validateAnalyzeRequest({
          ...validRequest,
          pageAssets: [{
            url: 123,
            alt: 'Alt text',
            type: 'image'
          }]
        })).toBe(false);

        // Missing alt
        expect(validateAnalyzeRequest({
          ...validRequest,
          pageAssets: [{
            url: 'https://example.com/image.jpg',
            type: 'image'
          }]
        })).toBe(false);

        // Invalid alt type
        expect(validateAnalyzeRequest({
          ...validRequest,
          pageAssets: [{
            url: 'https://example.com/image.jpg',
            alt: 123,
            type: 'image'
          }]
        })).toBe(false);

        // Missing type
        expect(validateAnalyzeRequest({
          ...validRequest,
          pageAssets: [{
            url: 'https://example.com/image.jpg',
            alt: 'Alt text'
          }]
        })).toBe(false);

        // Invalid type type
        expect(validateAnalyzeRequest({
          ...validRequest,
          pageAssets: [{
            url: 'https://example.com/image.jpg',
            alt: 'Alt text',
            type: 123
          }]
        })).toBe(false);
      });

      it('should reject assets with invalid optional fields', () => {
        expect(validateAnalyzeRequest({
          ...validRequest,
          pageAssets: [{
            url: 'https://example.com/image.jpg',
            alt: 'Alt text',
            type: 'image',
            size: 'invalid' as any
          }]
        })).toBe(false);

        expect(validateAnalyzeRequest({
          ...validRequest,
          pageAssets: [{
            url: 'https://example.com/image.jpg',
            alt: 'Alt text',
            type: 'image',
            mimeType: 123 as any
          }]
        })).toBe(false);
      });

      it('should allow undefined optional fields in assets', () => {
        expect(validateAnalyzeRequest({
          ...validRequest,
          pageAssets: [{
            url: 'https://example.com/image.jpg',
            alt: 'Alt text',
            type: 'image',
            size: undefined,
            mimeType: undefined
          }]
        })).toBe(true);
      });
    });

    it('should validate complex valid requests', () => {
      const complexRequest: AnalyzeSEORequest = {
        keyphrase: 'SEO optimization',
        url: 'https://example.com/page',
        isHomePage: false,
        advancedOptions: {
          pageType: 'article',
          secondaryKeywords: 'marketing, content'
        },
        webflowPageData: {
          title: 'SEO Guide',
          metaDescription: 'Complete SEO optimization guide',
          canonicalUrl: 'https://example.com/seo-guide',
          openGraphImage: 'https://example.com/og-image.jpg',
          usesTitleAsOpenGraphTitle: true,
          usesDescriptionAsOpenGraphDescription: true
        },
        pageAssets: [
          {
            url: 'https://example.com/hero.jpg',
            alt: 'Hero image',
            type: 'image',
            size: 2048,
            mimeType: 'image/jpeg'
          },
          {
            url: 'https://example.com/icon.png',
            alt: 'Icon',
            type: 'image'
          }
        ]
      };

      expect(validateAnalyzeRequest(complexRequest)).toBe(true);
    });
  });

  describe('createValidationError', () => {
    it('should create error with message only', () => {
      const error = createValidationError('Invalid input');
      
      expect(error.error).toBe('Invalid input');
      expect(error.field).toBeUndefined();
      expect(error.timestamp).toBeDefined();
      expect(new Date(error.timestamp)).toBeInstanceOf(Date);
    });

    it('should create error with message and field', () => {
      const error = createValidationError('Field is required', 'keyphrase');
      
      expect(error.error).toBe('Field is required');
      expect(error.field).toBe('keyphrase');
      expect(error.timestamp).toBeDefined();
      expect(new Date(error.timestamp)).toBeInstanceOf(Date);
    });

    it('should generate valid ISO timestamp', () => {
      const error = createValidationError('Test error');
      const timestamp = new Date(error.timestamp);
      
      expect(timestamp.toISOString()).toBe(error.timestamp);
      expect(Math.abs(Date.now() - timestamp.getTime())).toBeLessThan(1000);
    });
  });
});