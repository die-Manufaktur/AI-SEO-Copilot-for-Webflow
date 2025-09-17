import { describe, it, expect } from 'vitest';
import type {
  SEOCheck,
  OGMetadata,
  Resource,
  SchemaMarkupResult,
  WebflowPageData,
  ScrapedPageData,
  SEOAnalysisResult,
  WebflowDomain,
  WebflowSiteInfo,
  SchemaRecommendation,
  PageTypeSchema,
  WorkerEnvironment,
  AdvancedOptions,
  Asset,
  PageKeywords,
  AnalyzeSEORequest,
} from './index';

// Type guard functions to validate interfaces at runtime
function isSEOCheck(obj: any): obj is SEOCheck {
  return (
    obj &&
    typeof obj.title === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.passed === 'boolean' &&
    ['high', 'medium', 'low'].includes(obj.priority)
  );
}

function isOGMetadata(obj: any): obj is OGMetadata {
  return (
    obj &&
    typeof obj.title === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.image === 'string' &&
    typeof obj.imageWidth === 'string' &&
    typeof obj.imageHeight === 'string'
  );
}

function isResource(obj: any): obj is Resource {
  return obj && typeof obj.url === 'string';
}

function isSchemaMarkupResult(obj: any): obj is SchemaMarkupResult {
  return (
    obj &&
    typeof obj.hasSchema === 'boolean' &&
    Array.isArray(obj.schemaTypes) &&
    typeof obj.schemaCount === 'number'
  );
}

function isWebflowPageData(obj: any): obj is WebflowPageData {
  return (
    obj &&
    typeof obj.title === 'string' &&
    typeof obj.metaDescription === 'string'
  );
}

function isScrapedPageData(obj: any): obj is ScrapedPageData {
  return (
    obj &&
    typeof obj.url === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.metaDescription === 'string' &&
    Array.isArray(obj.headings) &&
    Array.isArray(obj.paragraphs) &&
    Array.isArray(obj.images) &&
    Array.isArray(obj.internalLinks) &&
    Array.isArray(obj.outboundLinks) &&
    obj.resources &&
    Array.isArray(obj.resources.js) &&
    Array.isArray(obj.resources.css) &&
    typeof obj.canonicalUrl === 'string' &&
    typeof obj.content === 'string'
  );
}

function isSEOAnalysisResult(obj: any): obj is SEOAnalysisResult {
  return (
    obj &&
    typeof obj.keyphrase === 'string' &&
    typeof obj.url === 'string' &&
    typeof obj.isHomePage === 'boolean' &&
    typeof obj.score === 'number' &&
    typeof obj.totalChecks === 'number' &&
    typeof obj.passedChecks === 'number' &&
    typeof obj.failedChecks === 'number' &&
    Array.isArray(obj.checks)
  );
}

function isAdvancedOptions(obj: any): obj is AdvancedOptions {
  return obj === null || obj === undefined || typeof obj === 'object';
}

function isAnalyzeSEORequest(obj: any): obj is AnalyzeSEORequest {
  return (
    obj &&
    typeof obj.keyphrase === 'string' &&
    typeof obj.url === 'string'
  );
}

describe('Shared Types', () => {
  describe('SEOCheck Interface', () => {
    it('should validate a valid SEOCheck object', () => {
      const validSEOCheck: SEOCheck = {
        title: 'Title Tag Check',
        description: 'Checks if the page has a proper title tag',
        passed: true,
        priority: 'high',
        recommendation: 'Add a descriptive title tag',
        matchedKeyword: 'primary'
      };

      expect(isSEOCheck(validSEOCheck)).toBe(true);
    });

    it('should reject invalid SEOCheck objects', () => {
      const invalidSEOCheck = {
        title: 'Title',
        description: 123, // should be string
        passed: 'yes', // should be boolean
        priority: 'urgent' // should be 'high' | 'medium' | 'low'
      };

      expect(isSEOCheck(invalidSEOCheck)).toBe(false);
    });

    it('should handle optional properties in SEOCheck', () => {
      const minimalSEOCheck: SEOCheck = {
        title: 'Basic Check',
        description: 'Basic description',
        passed: false,
        priority: 'low'
      };

      expect(isSEOCheck(minimalSEOCheck)).toBe(true);
    });

    it('should validate SEOCheck with imageData', () => {
      const seoCheckWithImages: SEOCheck = {
        title: 'Image Check',
        description: 'Checks image optimization',
        passed: true,
        priority: 'medium',
        imageData: [
          {
            url: 'https://example.com/image.jpg',
            name: 'hero-image.jpg',
            shortName: 'hero-im...',
            size: 1024,
            mimeType: 'image/jpeg',
            alt: 'Hero image'
          }
        ]
      };

      expect(isSEOCheck(seoCheckWithImages)).toBe(true);
    });
  });

  describe('OGMetadata Interface', () => {
    it('should validate a valid OGMetadata object', () => {
      const validOGMetadata: OGMetadata = {
        title: 'Page Title',
        description: 'Page description',
        image: 'https://example.com/og-image.jpg',
        imageWidth: '1200',
        imageHeight: '630'
      };

      expect(isOGMetadata(validOGMetadata)).toBe(true);
    });

    it('should reject invalid OGMetadata objects', () => {
      const invalidOGMetadata = {
        title: 'Title',
        description: 'Description',
        image: 'image.jpg',
        imageWidth: 1200, // should be string
        imageHeight: 630  // should be string
      };

      expect(isOGMetadata(invalidOGMetadata)).toBe(false);
    });
  });

  describe('Resource Interface', () => {
    it('should validate a valid Resource object', () => {
      const validResource: Resource = {
        url: 'https://example.com/script.js'
      };

      expect(isResource(validResource)).toBe(true);
    });

    it('should reject invalid Resource objects', () => {
      const invalidResource = {
        url: 123 // should be string
      };

      expect(isResource(invalidResource)).toBe(false);
    });
  });

  describe('SchemaMarkupResult Interface', () => {
    it('should validate a valid SchemaMarkupResult object', () => {
      const validSchemaResult: SchemaMarkupResult = {
        hasSchema: true,
        schemaTypes: ['Organization', 'LocalBusiness'],
        schemaCount: 2
      };

      expect(isSchemaMarkupResult(validSchemaResult)).toBe(true);
    });

    it('should handle empty schema results', () => {
      const emptySchemaResult: SchemaMarkupResult = {
        hasSchema: false,
        schemaTypes: [],
        schemaCount: 0
      };

      expect(isSchemaMarkupResult(emptySchemaResult)).toBe(true);
    });
  });

  describe('WebflowPageData Interface', () => {
    it('should validate a valid WebflowPageData object', () => {
      const validPageData: WebflowPageData = {
        title: 'Page Title',
        metaDescription: 'Meta description',
        canonicalUrl: 'https://example.com/page',
        openGraphImage: 'https://example.com/og-image.jpg',
        ogTitle: 'OG Title',
        ogDescription: 'OG Description',
        usesTitleAsOpenGraphTitle: true,
        usesDescriptionAsOpenGraphDescription: false,
        designerImages: [
          { url: 'https://example.com/image1.jpg' },
          { url: 'https://example.com/image2.jpg' }
        ]
      };

      expect(isWebflowPageData(validPageData)).toBe(true);
    });

    it('should validate minimal WebflowPageData object', () => {
      const minimalPageData: WebflowPageData = {
        title: 'Title',
        metaDescription: 'Description'
      };

      expect(isWebflowPageData(minimalPageData)).toBe(true);
    });
  });

  describe('ScrapedPageData Interface', () => {
    it('should validate a valid ScrapedPageData object', () => {
      const validScrapedData: ScrapedPageData = {
        url: 'https://example.com',
        title: 'Page Title',
        metaDescription: 'Meta description',
        headings: [
          { level: 1, text: 'Main Heading' },
          { level: 2, text: 'Subheading' }
        ],
        paragraphs: ['First paragraph', 'Second paragraph'],
        images: [
          { src: 'https://example.com/image.jpg', alt: 'Image alt', size: 1024 }
        ],
        internalLinks: ['/page1', '/page2'],
        outboundLinks: ['https://external.com'],
        resources: {
          js: [{ url: 'https://example.com/script.js' }],
          css: [{ url: 'https://example.com/style.css' }]
        },
        canonicalUrl: 'https://example.com',
        metaKeywords: 'keyword1, keyword2',
        ogImage: 'https://example.com/og-image.jpg',
        content: 'Page content here',
        schemaMarkup: {
          hasSchema: true,
          schemaTypes: ['WebPage'],
          schemaCount: 1
        }
      };

      expect(isScrapedPageData(validScrapedData)).toBe(true);
    });
  });

  describe('SEOAnalysisResult Interface', () => {
    it('should validate a valid SEOAnalysisResult object', () => {
      const validAnalysisResult: SEOAnalysisResult = {
        keyphrase: 'test keyword',
        url: 'https://example.com',
        isHomePage: true,
        score: 85,
        totalChecks: 18,
        passedChecks: 15,
        failedChecks: 3,
        checks: [
          {
            title: 'Title Tag',
            description: 'Page has a title tag',
            passed: true,
            priority: 'high'
          }
        ],
        ogData: {
          title: 'OG Title',
          description: 'OG Description',
          image: 'https://example.com/og-image.jpg',
          imageWidth: '1200',
          imageHeight: '630'
        },
        timestamp: '2024-01-01T00:00:00Z',
        apiDataUsed: true
      };

      expect(isSEOAnalysisResult(validAnalysisResult)).toBe(true);
    });
  });

  describe('WebflowDomain Interface', () => {
    it('should create a valid WebflowDomain object', () => {
      const domain: WebflowDomain = {
        id: 'domain123',
        name: 'example.com',
        host: 'example.com',
        publicUrl: 'https://example.com',
        publishedOn: '2024-01-01T00:00:00Z'
      };

      expect(domain.id).toBe('domain123');
      expect(domain.name).toBe('example.com');
    });
  });

  describe('WebflowSiteInfo Interface', () => {
    it('should create a valid WebflowSiteInfo object', () => {
      const siteInfo: WebflowSiteInfo = {
        id: 'site123',
        siteName: 'My Website',
        siteUrl: 'https://mywebsite.com',
        domains: [
          {
            id: 'domain123',
            name: 'mywebsite.com',
            host: 'mywebsite.com',
            publicUrl: 'https://mywebsite.com',
            publishedOn: '2024-01-01T00:00:00Z'
          }
        ]
      };

      expect(siteInfo.siteName).toBe('My Website');
      expect(siteInfo.domains).toHaveLength(1);
    });
  });

  describe('SchemaRecommendation Interface', () => {
    it('should create a valid SchemaRecommendation object', () => {
      const schemaRec: SchemaRecommendation = {
        name: 'Organization',
        description: 'Represents an organization',
        documentationUrl: 'https://schema.org/Organization',
        googleSupport: 'yes',
        jsonLdCode: '{"@type": "Organization"}',
        isRequired: true
      };

      expect(schemaRec.googleSupport).toBe('yes');
      expect(schemaRec.isRequired).toBe(true);
    });
  });

  describe('PageTypeSchema Interface', () => {
    it('should create a valid PageTypeSchema object', () => {
      const pageTypeSchema: PageTypeSchema = {
        pageType: 'business',
        schemas: [
          {
            name: 'LocalBusiness',
            description: 'A local business',
            documentationUrl: 'https://schema.org/LocalBusiness',
            googleSupport: 'yes',
            jsonLdCode: '{"@type": "LocalBusiness"}',
            isRequired: true
          }
        ]
      };

      expect(pageTypeSchema.pageType).toBe('business');
      expect(pageTypeSchema.schemas).toHaveLength(1);
    });
  });

  describe('WorkerEnvironment Interface', () => {
    it('should create a valid WorkerEnvironment object', () => {
      const env: WorkerEnvironment = {
        OPENAI_API_KEY: 'sk-test-key',
        USE_GPT_RECOMMENDATIONS: 'true',
        ALLOWED_ORIGINS: 'https://example.com'
      };

      expect(env.OPENAI_API_KEY).toBe('sk-test-key');
      expect(env.USE_GPT_RECOMMENDATIONS).toBe('true');
    });

    it('should work with minimal WorkerEnvironment object', () => {
      const minimalEnv: WorkerEnvironment = {
        OPENAI_API_KEY: 'sk-key'
      };

      expect(minimalEnv.OPENAI_API_KEY).toBe('sk-key');
      expect(minimalEnv.USE_GPT_RECOMMENDATIONS).toBeUndefined();
    });
  });

  describe('AdvancedOptions Interface', () => {
    it('should validate a valid AdvancedOptions object', () => {
      const advancedOptions: AdvancedOptions = {
        pageType: 'business',
        secondaryKeywords: 'keyword1, keyword2, keyword3',
        languageCode: 'en'
      };

      expect(isAdvancedOptions(advancedOptions)).toBe(true);
      expect(advancedOptions.pageType).toBe('business');
    });

    it('should handle empty AdvancedOptions object', () => {
      const emptyOptions: AdvancedOptions = {};
      
      expect(isAdvancedOptions(emptyOptions)).toBe(true);
    });

    it('should handle undefined AdvancedOptions', () => {
      const undefinedOptions: AdvancedOptions | undefined = undefined;
      
      expect(isAdvancedOptions(undefinedOptions)).toBe(true);
    });
  });

  describe('Asset Interface', () => {
    it('should create a valid Asset object', () => {
      const asset: Asset = {
        url: 'https://example.com/image.jpg',
        alt: 'Example image',
        type: 'image',
        size: 2048,
        mimeType: 'image/jpeg',
        source: 'webflow'
      };

      expect(asset.url).toBe('https://example.com/image.jpg');
      expect(asset.alt).toBe('Example image');
      expect(asset.type).toBe('image');
    });

    it('should work with minimal Asset object', () => {
      const minimalAsset: Asset = {
        url: 'https://example.com/image.jpg',
        alt: 'Image',
        type: 'image'
      };

      expect(minimalAsset.size).toBeUndefined();
      expect(minimalAsset.mimeType).toBeUndefined();
    });
  });

  describe('PageKeywords Interface', () => {
    it('should create a valid PageKeywords object', () => {
      const pageKeywords: PageKeywords = {
        'page1': 'keyword1',
        'page2': 'keyword2, secondary keyword',
        'page3': 'another keyword'
      };

      expect(pageKeywords['page1']).toBe('keyword1');
      expect(pageKeywords['page2']).toBe('keyword2, secondary keyword');
      expect(Object.keys(pageKeywords)).toHaveLength(3);
    });

    it('should handle empty PageKeywords object', () => {
      const emptyKeywords: PageKeywords = {};
      
      expect(Object.keys(emptyKeywords)).toHaveLength(0);
    });
  });

  describe('AnalyzeSEORequest Interface', () => {
    it('should validate a valid AnalyzeSEORequest object', () => {
      const validRequest: AnalyzeSEORequest = {
        keyphrase: 'test keyword',
        url: 'https://example.com',
        isHomePage: true,
        webflowPageData: {
          title: 'Page Title',
          metaDescription: 'Description'
        },
        pageAssets: [
          {
            url: 'https://example.com/image.jpg',
            alt: 'Image',
            type: 'image'
          }
        ],
        siteInfo: {
          siteName: 'Test Site'
        },
        publishPath: '/test-page',
        debug: true,
        advancedOptions: {
          pageType: 'business',
          languageCode: 'en'
        }
      };

      expect(isAnalyzeSEORequest(validRequest)).toBe(true);
    });

    it('should validate minimal AnalyzeSEORequest object', () => {
      const minimalRequest: AnalyzeSEORequest = {
        keyphrase: 'keyword',
        url: 'https://example.com'
      };

      expect(isAnalyzeSEORequest(minimalRequest)).toBe(true);
    });

    it('should reject invalid AnalyzeSEORequest objects', () => {
      const invalidRequest = {
        keyphrase: 123, // should be string
        url: 'https://example.com'
      };

      expect(isAnalyzeSEORequest(invalidRequest)).toBe(false);
    });
  });

  describe('Type Consistency', () => {
    it('should maintain consistent priority values across interfaces', () => {
      const priorities: Array<SEOCheck['priority']> = ['high', 'medium', 'low'];
      
      priorities.forEach(priority => {
        const check: SEOCheck = {
          title: 'Test',
          description: 'Test',
          passed: true,
          priority: priority
        };
        
        expect(['high', 'medium', 'low']).toContain(check.priority);
      });
    });

    it('should maintain consistent google support values', () => {
      const supportValues: Array<SchemaRecommendation['googleSupport']> = ['yes', 'no', 'partial'];
      
      supportValues.forEach(support => {
        const schema: SchemaRecommendation = {
          name: 'Test',
          description: 'Test',
          documentationUrl: 'https://schema.org/Test',
          googleSupport: support,
          jsonLdCode: '{}',
          isRequired: false
        };
        
        expect(['yes', 'no', 'partial']).toContain(schema.googleSupport);
      });
    });
  });

  describe('Complex Object Validation', () => {
    it('should validate complex nested objects', () => {
      const complexAnalysisResult: SEOAnalysisResult = {
        keyphrase: 'complex test',
        url: 'https://complex-example.com',
        isHomePage: false,
        score: 75,
        totalChecks: 20,
        passedChecks: 15,
        failedChecks: 5,
        checks: [
          {
            title: 'Meta Description',
            description: 'Page has meta description',
            passed: true,
            priority: 'high',
            recommendation: 'Good meta description',
            matchedKeyword: 'primary',
            imageData: [
              {
                url: 'https://example.com/test-image.jpg',
                name: 'test-image.jpg',
                shortName: 'test-im...',
                size: 1500,
                mimeType: 'image/jpeg',
                alt: 'Test image'
              }
            ]
          }
        ],
        ogData: {
          title: 'Complex Test Page',
          description: 'A complex test page description',
          image: 'https://complex-example.com/og.jpg',
          imageWidth: '1200',
          imageHeight: '630'
        },
        timestamp: '2024-01-15T10:30:00Z',
        apiDataUsed: true
      };

      expect(isSEOAnalysisResult(complexAnalysisResult)).toBe(true);
      expect(complexAnalysisResult.checks[0].imageData).toHaveLength(1);
      expect(complexAnalysisResult.ogData?.title).toBe('Complex Test Page');
    });
  });
});