import { describe, it, expect } from 'vitest';
import type { 
  SEOCheck,
  OGMetadata, 
  SEOAnalysisResult,
  WebflowPageData,
  AnalyzeSEORequest,
  WebflowDomain,
  WebflowSiteInfo,
  ScrapedPageData
} from './types';

describe('Types Module', () => {
  describe('Type exports', () => {
    it('should export SEOCheck type', () => {
      // Test that the type can be used for type checking
      const mockSEOCheck: SEOCheck = {
        title: 'Test Check',
        description: 'A test SEO check',
        passed: true,
        priority: 'high'
      };
      
      expect(mockSEOCheck.title).toBe('Test Check');
      expect(mockSEOCheck.passed).toBe(true);
      expect(mockSEOCheck.priority).toBe('high');
    });

    it('should export OGMetadata type', () => {
      const mockOGMetadata: OGMetadata = {
        title: 'Test Page',
        description: 'Test description',
        image: 'https://example.com/image.jpg',
        imageWidth: '1200',
        imageHeight: '630'
      };
      
      expect(mockOGMetadata.title).toBe('Test Page');
      expect(mockOGMetadata.image).toBe('https://example.com/image.jpg');
    });

    it('should export SEOAnalysisResult type', () => {
      const mockResult: SEOAnalysisResult = {
        keyphrase: 'test keyword',
        url: 'https://example.com',
        isHomePage: false,
        score: 85,
        totalChecks: 10,
        passedChecks: 8,
        failedChecks: 2,
        checks: [{
          title: 'Title Check',
          description: 'Check page title',
          passed: true,
          priority: 'high'
        }]
      };
      
      expect(mockResult.score).toBe(85);
      expect(mockResult.checks).toHaveLength(1);
    });

    it('should export WebflowPageData type', () => {
      const mockPageData: WebflowPageData = {
        title: 'Home Page',
        metaDescription: 'Welcome to our site',
        ogImage: 'https://example.com/og.jpg'
      };
      
      expect(mockPageData.title).toBe('Home Page');
      expect(mockPageData.metaDescription).toBe('Welcome to our site');
    });

    it('should export AnalyzeSEORequest type', () => {
      const mockRequest: AnalyzeSEORequest = {
        keyphrase: 'test keyword',
        url: 'https://example.com',
        isHomePage: false,
        advancedOptions: {
          pageType: 'service',
          secondaryKeywords: 'test, example',
          languageCode: 'en'
        }
      };
      
      expect(mockRequest.url).toBe('https://example.com');
      expect(mockRequest.keyphrase).toBe('test keyword');
      expect(mockRequest.advancedOptions?.secondaryKeywords).toBe('test, example');
    });

    it('should export WebflowDomain type', () => {
      const mockDomain: WebflowDomain = {
        id: 'domain-123',
        name: 'example.com',
        host: 'example.com',
        publicUrl: 'https://example.com',
        publishedOn: '2024-01-01T00:00:00Z'
      };
      
      expect(mockDomain.publicUrl).toBe('https://example.com');
      expect(mockDomain.name).toBe('example.com');
    });

    it('should export WebflowSiteInfo type', () => {
      const mockSiteInfo: WebflowSiteInfo = {
        siteName: 'Test Site',
        siteUrl: 'https://testsite.com',
        domains: [
          { 
            id: 'domain-1', 
            name: 'testsite.com', 
            host: 'testsite.com', 
            publicUrl: 'https://testsite.com', 
            publishedOn: '2024-01-01T00:00:00Z' 
          },
          { 
            id: 'domain-2', 
            name: 'testsite.webflow.io', 
            host: 'testsite.webflow.io', 
            publicUrl: 'https://testsite.webflow.io', 
            publishedOn: '2024-01-01T00:00:00Z' 
          }
        ]
      };
      
      expect(mockSiteInfo.siteName).toBe('Test Site');
      expect(mockSiteInfo.domains).toHaveLength(2);
    });

    it('should export ScrapedPageData type', () => {
      const mockScrapedData: ScrapedPageData = {
        url: 'https://example.com',
        title: 'Scraped Title',
        metaDescription: 'Scraped description',
        headings: [
          { level: 1, text: 'Main Heading' },
          { level: 2, text: 'Sub Heading' }
        ],
        paragraphs: ['First paragraph', 'Second paragraph'],
        images: [
          { src: 'https://example.com/image.jpg', alt: 'Test image' }
        ],
        internalLinks: ['https://example.com/about'],
        outboundLinks: ['https://external.com'],
        resources: {
          js: [{ url: 'https://example.com/script.js' }],
          css: [{ url: 'https://example.com/style.css' }]
        },
        canonicalUrl: 'https://example.com/canonical',
        metaKeywords: 'keyword1, keyword2',
        ogImage: 'https://example.com/og.jpg',
        content: 'Page content',
        schemaMarkup: {
          hasSchema: true,
          schemaTypes: ['WebPage'],
          schemaCount: 1
        }
      };
      
      expect(mockScrapedData.title).toBe('Scraped Title');
      expect(mockScrapedData.headings).toHaveLength(2);
      expect(mockScrapedData.paragraphs).toHaveLength(2);
    });
  });

  describe('Type compatibility', () => {
    it('should allow SEOCheck with all priority levels', () => {
      const highPriority: SEOCheck = {
        title: 'High Priority Check',
        description: 'Important check',
        passed: false,
        priority: 'high'
      };

      const mediumPriority: SEOCheck = {
        title: 'Medium Priority Check',
        description: 'Moderate check',
        passed: true,
        priority: 'medium'
      };

      const lowPriority: SEOCheck = {
        title: 'Low Priority Check',
        description: 'Minor check',
        passed: true,
        priority: 'low'
      };

      expect(highPriority.priority).toBe('high');
      expect(mediumPriority.priority).toBe('medium');
      expect(lowPriority.priority).toBe('low');
    });

    it('should allow optional fields in types', () => {
      // Test WebflowPageData with minimal required fields
      const minimalPageData: WebflowPageData = {
        title: 'Minimal Page',
        metaDescription: 'Minimal description'
      };
      
      expect(minimalPageData.title).toBe('Minimal Page');
      expect(minimalPageData.metaDescription).toBe('Minimal description');

      // Test with optional fields
      const fullPageData: WebflowPageData = {
        title: 'Full Page',
        metaDescription: 'Description',
        ogImage: 'image.jpg',
        openGraphImage: 'og-image.jpg'
      };
      
      expect(fullPageData.metaDescription).toBe('Description');
      expect(fullPageData.ogImage).toBe('image.jpg');
    });

    it('should handle empty arrays and objects', () => {
      const emptyAnalysis: SEOAnalysisResult = {
        keyphrase: '',
        url: 'https://example.com',
        isHomePage: false,
        score: 0,
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 0,
        checks: []
      };

      const emptyRequest: AnalyzeSEORequest = {
        keyphrase: '',
        url: 'https://example.com'
      };

      expect(emptyAnalysis.checks).toEqual([]);
      expect(emptyRequest.keyphrase).toBe('');
    });
  });

  describe('Type structure validation', () => {
    it('should enforce required fields in SEOCheck', () => {
      const validCheck: SEOCheck = {
        title: 'Required Title',
        description: 'Required Description', 
        passed: true,
        priority: 'medium'
      };

      // All required fields should be present
      expect(validCheck.title).toBeDefined();
      expect(validCheck.description).toBeDefined();
      expect(validCheck.passed).toBeDefined();
      expect(validCheck.priority).toBeDefined();
    });

    it('should handle complex nested structures', () => {
      const complexResult: SEOAnalysisResult = {
        keyphrase: 'test keyword',
        url: 'https://example.com',
        isHomePage: false,
        score: 75,
        totalChecks: 10,
        passedChecks: 7,
        failedChecks: 3,
        checks: [
          {
            title: 'Title Tag',
            description: 'Page has proper title',
            passed: true,
            priority: 'high'
          },
          {
            title: 'Meta Description',
            description: 'Page has meta description',
            passed: false,
            priority: 'medium'
          }
        ]
      };

      expect(complexResult.checks[0].passed).toBe(true);
      expect(complexResult.checks[1].passed).toBe(false);
      expect(complexResult.score).toBe(75);
    });
  });
});