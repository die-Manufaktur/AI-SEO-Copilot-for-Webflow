import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  analyzerCheckPriorities,
  getSuccessMessage,
  checkKeywordMatch,
  checkUrlKeywordMatch,
  calculateCombinedKeyphraseDensity,
  analyzeMinification,
  calculateSEOScore,
} from './seoAnalysis';

// Mock the AI recommendations module
vi.mock('./aiRecommendations', () => ({
  getAIRecommendation: vi.fn()
}));

import { getAIRecommendation } from './aiRecommendations';

describe('seoAnalysis', () => {
  describe('calculateSEOScore', () => {
    it('should calculate correct SEO score from checks', () => {
      const checks = [
        { title: 'Check 1', description: 'Test', passed: true, priority: 'high' as const },
        { title: 'Check 2', description: 'Test', passed: false, priority: 'medium' as const },
        { title: 'Check 3', description: 'Test', passed: true, priority: 'low' as const },
        { title: 'Check 4', description: 'Test', passed: true, priority: 'high' as const },
      ];

      const score = calculateSEOScore(checks);
      expect(score).toBe(75); // 3 out of 4 checks passed = 75%
    });

    it('should return 100 when all checks pass', () => {
      const checks = [
        { title: 'Check 1', description: 'Test', passed: true, priority: 'high' as const },
        { title: 'Check 2', description: 'Test', passed: true, priority: 'medium' as const },
      ];

      const score = calculateSEOScore(checks);
      expect(score).toBe(100);
    });

    it('should return 0 when no checks pass', () => {
      const checks = [
        { title: 'Check 1', description: 'Test', passed: false, priority: 'high' as const },
        { title: 'Check 2', description: 'Test', passed: false, priority: 'medium' as const },
      ];

      const score = calculateSEOScore(checks);
      expect(score).toBe(0);
    });

    it('should handle empty checks array', () => {
      const score = calculateSEOScore([]);
      expect(score).toBe(0);
    });
  });

  describe('analyzerCheckPriorities', () => {
    it('should have all required SEO check priorities', () => {
      const expectedChecks = [
        'Keyphrase in Title',
        'Keyphrase in Meta Description',
        'Keyphrase in URL',
        'Content Length',
        'Keyphrase Density',
        'Keyphrase in Introduction',
        'Image Alt Attributes',
        'Internal Links',
        'Outbound Links',
        'Next-Gen Image Formats',
        'OG Image',
        'OG Title and Description',
        'Keyphrase in H1 Heading',
        'Keyphrase in H2 Headings',
        'Heading Hierarchy',
        'Code Minification',
        'Schema Markup',
        'Image File Size'
      ];

      expectedChecks.forEach(check => {
        expect(analyzerCheckPriorities[check]).toBeDefined();
        expect(['high', 'medium', 'low']).toContain(analyzerCheckPriorities[check]);
      });
    });

    it('should prioritize critical SEO checks as high', () => {
      expect(analyzerCheckPriorities['Keyphrase in Title']).toBe('high');
      expect(analyzerCheckPriorities['Keyphrase in Meta Description']).toBe('high');
      expect(analyzerCheckPriorities['Content Length']).toBe('high');
      expect(analyzerCheckPriorities['Keyphrase in H1 Heading']).toBe('high');
      expect(analyzerCheckPriorities['Heading Hierarchy']).toBe('high');
    });
  });

  describe('getSuccessMessage', () => {
    it('should return specific success messages for known check types', () => {
      expect(getSuccessMessage('Keyphrase in Title')).toBe('Great! Your title contains the keyphrase.');
      expect(getSuccessMessage('Keyphrase in Meta Description')).toBe('Excellent! Your meta description includes the keyphrase.');
      expect(getSuccessMessage('Content Length')).toBe('Well done! Your content meets the recommended length.');
    });

    it('should return generic message for unknown check types', () => {
      const unknownCheck = 'Unknown Check Type';
      expect(getSuccessMessage(unknownCheck)).toBe(`Check passed: ${unknownCheck}`);
    });
  });

  describe('checkKeywordMatch', () => {
    it('should find primary keyword in content', () => {
      const content = 'This is a test about SEO optimization techniques';
      const primaryKeyword = 'SEO optimization';
      
      const result = checkKeywordMatch(content, primaryKeyword);
      
      expect(result.found).toBe(true);
      expect(result.matchedKeyword).toBe(primaryKeyword);
      expect(result.keywordResults).toHaveLength(1);
      expect(result.keywordResults[0]).toEqual({
        keyword: primaryKeyword,
        passed: true,
        isPrimary: true
      });
    });

    it('should be case insensitive', () => {
      const content = 'CONTENT ABOUT seo optimization';
      const primaryKeyword = 'SEO Optimization';
      
      const result = checkKeywordMatch(content, primaryKeyword);
      
      expect(result.found).toBe(true);
      expect(result.matchedKeyword).toBe(primaryKeyword);
    });

    it('should check secondary keywords when primary fails', () => {
      const content = 'This article discusses web development and JavaScript frameworks';
      const primaryKeyword = 'Python programming';
      const secondaryKeywords = 'web development, React, JavaScript';
      
      const result = checkKeywordMatch(content, primaryKeyword, secondaryKeywords);
      
      expect(result.found).toBe(true);
      expect(result.matchedKeyword).toBe('web development');
      expect(result.keywordResults).toHaveLength(4); // 1 primary + 3 secondary
      
      // Primary should fail
      expect(result.keywordResults[0]).toEqual({
        keyword: primaryKeyword,
        passed: false,
        isPrimary: true
      });
      
      // First secondary should pass
      expect(result.keywordResults[1]).toEqual({
        keyword: 'web development',
        passed: true,
        isPrimary: false
      });
    });

    it('should return false when no keywords match', () => {
      const content = 'This is about cooking recipes';
      const primaryKeyword = 'machine learning';
      const secondaryKeywords = 'artificial intelligence, deep learning';
      
      const result = checkKeywordMatch(content, primaryKeyword, secondaryKeywords);
      
      expect(result.found).toBe(false);
      expect(result.matchedKeyword).toBeUndefined();
      expect(result.keywordResults.every(r => !r.passed)).toBe(true);
    });

    it('should handle empty or invalid inputs gracefully', () => {
      expect(checkKeywordMatch('', 'keyword')).toEqual({
        found: false,
        keywordResults: []
      });
      
      expect(checkKeywordMatch('content', '')).toEqual({
        found: false,
        keywordResults: []
      });
      
      expect(checkKeywordMatch('', '')).toEqual({
        found: false,
        keywordResults: []
      });
    });

    it('should handle secondary keywords with whitespace', () => {
      const content = 'Testing React applications with modern tools';
      const primaryKeyword = 'Vue.js';
      const secondaryKeywords = ' React , testing , modern tools ';
      
      const result = checkKeywordMatch(content, primaryKeyword, secondaryKeywords);
      
      expect(result.found).toBe(true);
      expect(result.keywordResults.filter(r => r.keyword.trim().length > 0)).toHaveLength(4);
    });
  });

  describe('checkUrlKeywordMatch', () => {
    it('should find keyword in URL path', () => {
      const url = 'https://example.com/seo-optimization-guide';
      const primaryKeyword = 'SEO optimization';
      
      const result = checkUrlKeywordMatch(url, primaryKeyword);
      
      expect(result.found).toBe(true);
      expect(result.matchedKeyword).toBe(primaryKeyword);
    });

    it('should normalize URL by removing protocol and domain', () => {
      const url = 'https://mywebsite.com/web-development-tutorial';
      const primaryKeyword = 'web development';
      
      const result = checkUrlKeywordMatch(url, primaryKeyword);
      
      expect(result.found).toBe(true);
    });

    it('should handle URL-encoded spaces', () => {
      const url = 'https://example.com/seo%20optimization%20tips';
      const primaryKeyword = 'seo optimization';
      
      const result = checkUrlKeywordMatch(url, primaryKeyword);
      
      expect(result.found).toBe(true);
    });

    it('should convert hyphens and underscores to spaces', () => {
      const url = 'https://example.com/web_development-guide';
      const primaryKeyword = 'web development guide';
      
      const result = checkUrlKeywordMatch(url, primaryKeyword);
      
      expect(result.found).toBe(true);
    });

    it('should check secondary keywords when primary fails', () => {
      const url = 'https://example.com/javascript-frameworks-comparison';
      const primaryKeyword = 'Python tutorials';
      const secondaryKeywords = 'JavaScript, React frameworks, Vue.js';
      
      const result = checkUrlKeywordMatch(url, primaryKeyword, secondaryKeywords);
      
      expect(result.found).toBe(true);
      expect(result.matchedKeyword).toBe('JavaScript');
    });

    it('should handle invalid URLs gracefully', () => {
      expect(checkUrlKeywordMatch('', 'keyword')).toEqual({
        found: false,
        keywordResults: []
      });
      
      expect(checkUrlKeywordMatch('https://example.com', '')).toEqual({
        found: false,
        keywordResults: []
      });
    });
  });

  describe('calculateCombinedKeyphraseDensity', () => {
    it('should calculate density for primary keyword only', () => {
      const content = 'SEO is important. SEO optimization helps websites. Good SEO practices matter.';
      const primaryKeyword = 'SEO';
      
      const density = calculateCombinedKeyphraseDensity(content, primaryKeyword);
      
      // 3 occurrences of "SEO" in ~11 words = ~27.27%
      expect(density).toBeCloseTo(27.27, 1);
    });

    it('should calculate density for primary and secondary keywords combined', () => {
      const content = 'SEO optimization and web development are crucial for websites. Good SEO and development practices matter.';
      const primaryKeyword = 'SEO';
      const secondaryKeywords = 'optimization, development';
      
      const density = calculateCombinedKeyphraseDensity(content, primaryKeyword, secondaryKeywords);
      
      // Should count: SEO (2), optimization (1), development (2) = 5 total
      // In ~15 words = ~33.33%
      expect(density).toBeGreaterThan(30);
    });

    it('should handle multi-word keywords correctly', () => {
      const content = 'Web development is fun. Web development requires practice. Modern web development uses frameworks.';
      const primaryKeyword = 'web development';
      
      const density = calculateCombinedKeyphraseDensity(content, primaryKeyword);
      
      // 3 occurrences of "web development" phrase
      expect(density).toBeGreaterThan(15);
    });

    it('should return 0 for empty content or keywords', () => {
      expect(calculateCombinedKeyphraseDensity('', 'keyword')).toBe(0);
      expect(calculateCombinedKeyphraseDensity('content', '')).toBe(0);
      expect(calculateCombinedKeyphraseDensity('', '')).toBe(0);
    });

    it('should be case insensitive', () => {
      const content = 'SEO OPTIMIZATION and seo practices';
      const primaryKeyword = 'SEO';
      const secondaryKeywords = 'optimization';
      
      const density = calculateCombinedKeyphraseDensity(content, primaryKeyword, secondaryKeywords);
      
      expect(density).toBeGreaterThan(0);
    });
  });

  describe('analyzeMinification', () => {
    it('should detect minified files by .min. pattern', () => {
      const jsFiles = [
        { url: 'https://example.com/app.min.js' },
        { url: 'https://example.com/bundle.min.js' }
      ];
      const cssFiles = [
        { url: 'https://example.com/styles.min.css' }
      ];
      
      const result = analyzeMinification(jsFiles, cssFiles);
      
      expect(result.passed).toBe(true);
      expect(result.jsMinified).toBe(2);
      expect(result.cssMinified).toBe(1);
      expect(result.totalJs).toBe(2);
      expect(result.totalCss).toBe(1);
    });

    it('should detect CDN auto-minification', () => {
      const jsFiles = [
        { url: 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.js' },
        { url: 'https://unpkg.com/react@17/umd/react.production.js' }
      ];
      const cssFiles = [
        { url: 'https://assets.webflow.com/css/webflow.css' }
      ];
      
      const result = analyzeMinification(jsFiles, cssFiles);
      
      expect(result.passed).toBe(true);
      expect(result.jsMinified).toBe(2);
      expect(result.cssMinified).toBe(1);
    });

    it('should detect build tool patterns', () => {
      const jsFiles = [
        { url: 'https://example.com/js/app.bundle.js' },
        { url: 'https://example.com/dist/main.chunk.js' }
      ];
      const cssFiles = [
        { url: 'https://example.com/build/styles.css?v=123' }
      ];
      
      const result = analyzeMinification(jsFiles, cssFiles);
      
      expect(result.passed).toBe(true);
      expect(result.jsMinified).toBe(2);
      expect(result.cssMinified).toBe(1);
    });

    it('should fail when files are not minified', () => {
      const jsFiles = [
        { url: 'https://example.com/app.js' },
        { url: 'https://example.com/script.js' }
      ];
      const cssFiles = [
        { url: 'https://example.com/styles.css' }
      ];
      
      const result = analyzeMinification(jsFiles, cssFiles);
      
      expect(result.passed).toBe(false);
      expect(result.jsMinified).toBe(0);
      expect(result.cssMinified).toBe(0);
    });

    it('should handle mixed minified and unminified files', () => {
      const jsFiles = [
        { url: 'https://example.com/app.min.js' }, // minified
        { url: 'https://example.com/script.js' }, // not minified
        { url: 'https://cdnjs.cloudflare.com/libs/lodash.js' } // CDN (minified)
      ];
      const cssFiles = [
        { url: 'https://example.com/styles.css' } // not minified
      ];
      
      const result = analyzeMinification(jsFiles, cssFiles);
      
      expect(result.jsMinified).toBe(2);
      expect(result.cssMinified).toBe(0);
      expect(result.totalJs).toBe(3);
      expect(result.totalCss).toBe(1);
      
      // Should fail since only 66.67% are minified (need 80% to pass)
      expect(result.passed).toBe(false);
    });

    it('should handle empty arrays', () => {
      const result = analyzeMinification([], []);
      
      expect(result.passed).toBe(true); // No files to check, so pass
      expect(result.jsMinified).toBe(0);
      expect(result.cssMinified).toBe(0);
      expect(result.totalJs).toBe(0);
      expect(result.totalCss).toBe(0);
    });

    it('should identify minified files by .min. pattern', () => {
      const jsFiles = [
        { url: 'https://example.com/script.min.js' },
        { url: 'https://example.com/app.js' }
      ];
      const cssFiles = [
        { url: 'https://example.com/styles.min.css' },
        { url: 'https://example.com/theme.css' }
      ];

      const result = analyzeMinification(jsFiles, cssFiles);

      expect(result.jsMinified).toBe(1);
      expect(result.cssMinified).toBe(1);
      expect(result.totalJs).toBe(2);
      expect(result.totalCss).toBe(2);
      expect(result.passed).toBe(false); // Only 50% minified, needs 80%
    });

    it('should recognize CDN URLs as minified', () => {
      const jsFiles = [
        { url: 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.js' },
        { url: 'https://unpkg.com/react@18/umd/react.production.js' },
        { url: 'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.js' }
      ];
      const cssFiles = [
        { url: 'https://assets.webflow.com/styles.css' },
        { url: 'https://global-uploads.webflow.com/theme.css' }
      ];

      const result = analyzeMinification(jsFiles, cssFiles);

      expect(result.jsMinified).toBe(3);
      expect(result.cssMinified).toBe(2);
      expect(result.passed).toBe(true); // 100% minified
    });

    it('should recognize build tool patterns', () => {
      const jsFiles = [
        { url: 'https://example.com/assets/app.bundle.js' },
        { url: 'https://example.com/dist/vendor.chunk.js' },
        { url: 'https://example.com/build/main.js' },
        { url: 'https://example.com/app.js?v=123456' }
      ];
      const cssFiles: Array<{ url: string }> = [];

      const result = analyzeMinification(jsFiles, cssFiles);

      expect(result.jsMinified).toBe(4);
      expect(result.passed).toBe(true);
    });

    it('should recognize hash-based filenames', () => {
      const jsFiles = [
        { url: 'https://example.com/app.a1b2c3d4.js' },
        { url: 'https://example.com/vendor.f5e6d7c8b9a0.js' }
      ];
      const cssFiles = [
        { url: 'https://example.com/styles.12345678.css' }
      ];

      const result = analyzeMinification(jsFiles, cssFiles);

      expect(result.jsMinified).toBe(2);
      expect(result.cssMinified).toBe(1);
      expect(result.passed).toBe(true);
    });

    it('should pass when 80% or more files are minified', () => {
      const jsFiles = [
        { url: 'https://example.com/app.min.js' },
        { url: 'https://example.com/vendor.min.js' },
        { url: 'https://example.com/utils.min.js' },
        { url: 'https://example.com/analytics.min.js' },
        { url: 'https://example.com/debug.js' } // Only 1 non-minified
      ];
      const cssFiles: Array<{ url: string }> = [];

      const result = analyzeMinification(jsFiles, cssFiles);

      expect(result.jsMinified).toBe(4);
      expect(result.totalJs).toBe(5);
      expect(result.passed).toBe(true); // 80% minified
    });

    it('should fail when less than 80% files are minified', () => {
      const jsFiles = [
        { url: 'https://example.com/app.min.js' },
        { url: 'https://example.com/vendor.min.js' },
        { url: 'https://example.com/utils.min.js' },
        { url: 'https://example.com/analytics.js' },
        { url: 'https://example.com/debug.js' } // 2 non-minified
      ];
      const cssFiles: Array<{ url: string }> = [];

      const result = analyzeMinification(jsFiles, cssFiles);

      expect(result.jsMinified).toBe(3);
      expect(result.totalJs).toBe(5);
      expect(result.passed).toBe(false); // Only 60% minified
    });

    it('should include details about minification status', () => {
      const jsFiles = [
        { url: 'https://example.com/app.min.js' },
        { url: 'https://example.com/vendor.js' }
      ];
      const cssFiles = [
        { url: 'https://example.com/styles.min.css' }
      ];

      const result = analyzeMinification(jsFiles, cssFiles);

      expect(result.details).toContain('JS files: 1/2 minified');
      expect(result.details).toContain('CSS files: 1/1 minified');
    });
  });

  describe('analyzeSEOElements', () => {
    let mockScrapedData: any;
    let mockWebflowData: any;
    let mockEnv: any;
    let mockAdvancedOptions: any;

    beforeEach(() => {
      vi.clearAllMocks();
      
      // Set up the AI recommendation mock to return a test value
      (getAIRecommendation as any).mockResolvedValue('Mocked AI recommendation');

      mockScrapedData = {
        title: 'Test Page Title',
        metaDescription: 'Test meta description with SEO content',
        content: 'This is a long content piece about SEO optimization techniques. It contains many words to test content length requirements. SEO is important for web visibility. The content discusses various SEO strategies and best practices for optimization. This ensures we meet the minimum word count for testing purposes.',
        headings: [
          { level: 1, text: 'Main SEO Heading' },
          { level: 2, text: 'Secondary SEO Topic' },
          { level: 2, text: 'Another H2 Heading' }
        ],
        paragraphs: ['First paragraph contains SEO keyphrase for testing', 'Second paragraph content'],
        images: [
          { src: 'https://example.com/image1.jpg', alt: 'Test image 1', size: 150000 },
          { src: 'https://example.com/image2.webp', alt: 'Test image 2', size: 200000 },
          { src: 'https://example.com/image3.jpg', alt: '', size: 600000 }
        ],
        internalLinks: ['https://example.com/page1', 'https://example.com/page2'],
        outboundLinks: ['https://external.com/resource'],
        ogImage: 'https://example.com/og-image.jpg',
        resources: {
          js: [
            { url: 'https://example.com/app.min.js' },
            { url: 'https://example.com/script.js' }
          ],
          css: [
            { url: 'https://example.com/styles.min.css' }
          ]
        },
        schemaMarkup: {
          hasSchema: true,
          schemaCount: 2,
          schemaTypes: ['Article', 'Organization']
        }
      };

      mockWebflowData = {
        title: 'Webflow API Title',
        metaDescription: 'Webflow API meta description',
        canonicalUrl: 'https://example.com/seo-page',
        ogTitle: 'OG Title',
        ogDescription: 'OG Description',
        openGraphImage: 'https://example.com/og.jpg'
      };

      mockEnv = {
        USE_GPT_RECOMMENDATIONS: 'false',
        OPENAI_API_KEY: undefined
      };

      mockAdvancedOptions = {
        secondaryKeywords: 'optimization, techniques, strategies'
      };
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should perform comprehensive SEO analysis', async () => {
      const { analyzeSEOElements } = await import('./seoAnalysis');
      
      const result = await analyzeSEOElements(
        mockScrapedData,
        'SEO',
        'https://example.com/test-page',
        false,
        mockEnv
      );

      expect(result.checks).toBeDefined();
      expect(result.checks.length).toBeGreaterThan(15); // Should have all 18 checks
      expect(result.passedChecks).toBeGreaterThan(0);
      expect(result.failedChecks).toBeGreaterThan(0);
      expect(result.totalChecks).toBe(result.checks.length);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.url).toBe('https://example.com/test-page');
      expect(result.keyphrase).toBe('SEO');
      expect(result.isHomePage).toBe(false);
    });

    it('should use different word count requirements for homepage vs regular page', async () => {
      const { analyzeSEOElements } = await import('./seoAnalysis');
      
      // Short content that meets homepage requirements (300 words) but not regular page (600 words)
      const shortContent = 'Short content word here test '.repeat(60); // ~300 words
      const shortScrapedData = {
        ...mockScrapedData,
        content: shortContent
      };

      // Test homepage
      const homepageResult = await analyzeSEOElements(
        shortScrapedData,
        'SEO',
        'https://example.com/',
        true, // isHomePage
        mockEnv
      );

      // Test regular page  
      const regularResult = await analyzeSEOElements(
        shortScrapedData,
        'SEO',
        'https://example.com/page',
        false, // not homepage
        mockEnv
      );

      const homepageContentCheck = homepageResult.checks.find(c => c.title === 'Content Length');
      const regularContentCheck = regularResult.checks.find(c => c.title === 'Content Length');

      expect(homepageContentCheck?.passed).toBe(true);
      expect(regularContentCheck?.passed).toBe(false);
    });

    it('should prefer Webflow API data when available', async () => {
      const { analyzeSEOElements } = await import('./seoAnalysis');
      
      const result = await analyzeSEOElements(
        mockScrapedData,
        'Webflow',
        'https://example.com/test',
        false,
        mockEnv,
        mockWebflowData
      );

      const titleCheck = result.checks.find(c => c.title === 'Keyphrase in Title');
      const metaCheck = result.checks.find(c => c.title === 'Keyphrase in Meta Description');

      // Should use Webflow API data, not scraped data
      expect(titleCheck?.description).not.toContain('Test Page Title');
      expect(metaCheck?.description).not.toContain('Test meta description');
    });

    it('should handle secondary keywords correctly', async () => {
      const { analyzeSEOElements } = await import('./seoAnalysis');
      
      const result = await analyzeSEOElements(
        mockScrapedData,
        'NonExistentKeyword', // Primary won't match
        'https://example.com/test',
        false,
        mockEnv,
        undefined,
        undefined,
        mockAdvancedOptions
      );

      const titleCheck = result.checks.find(c => c.title === 'Keyphrase in Title');
      const metaCheck = result.checks.find(c => c.title === 'Keyphrase in Meta Description');

      // Should find secondary keywords  
      expect(titleCheck?.passed).toBe(false); // Title doesn't contain any of the keywords
      expect(metaCheck?.passed).toBe(false); // Meta description doesn't contain the secondary keywords
    });

    it('should calculate keyphrase density correctly', async () => {
      const { analyzeSEOElements } = await import('./seoAnalysis');
      
      const result = await analyzeSEOElements(
        mockScrapedData,
        'SEO',
        'https://example.com/test',
        false,
        mockEnv
      );

      const densityCheck = result.checks.find(c => c.title === 'Keyphrase Density');
      expect(densityCheck).toBeDefined();
      expect(densityCheck?.passed).toBeDefined();
      // Description should contain either success message or density percentage
      expect(densityCheck?.description.length).toBeGreaterThan(0);
    });

    it('should detect images without alt text', async () => {
      const { analyzeSEOElements } = await import('./seoAnalysis');
      
      const result = await analyzeSEOElements(
        mockScrapedData,
        'SEO',
        'https://example.com/test',
        false,
        mockEnv
      );

      const imageAltCheck = result.checks.find(c => c.title === 'Image Alt Attributes');
      expect(imageAltCheck?.passed).toBe(false); // One image has no alt text
      expect(imageAltCheck?.imageData).toBeDefined();
      expect(imageAltCheck?.imageData?.length).toBe(1); // One image without alt
    });

    it('should analyze image formats for next-gen recommendations', async () => {
      const { analyzeSEOElements } = await import('./seoAnalysis');
      
      const result = await analyzeSEOElements(
        mockScrapedData,
        'SEO',
        'https://example.com/test',
        false,
        mockEnv
      );

      const nextGenCheck = result.checks.find(c => c.title === 'Next-Gen Image Formats');
      expect(nextGenCheck?.passed).toBe(false); // Only 1 of 3 images is WebP
      expect(nextGenCheck?.description).toContain('next-gen');
    });

    it('should check heading hierarchy', async () => {
      const { analyzeSEOElements } = await import('./seoAnalysis');
      
      const result = await analyzeSEOElements(
        mockScrapedData,
        'SEO',
        'https://example.com/test',
        false,
        mockEnv
      );

      const hierarchyCheck = result.checks.find(c => c.title === 'Heading Hierarchy');
      expect(hierarchyCheck?.passed).toBe(true); // H1 followed by H2s
    });

    it('should detect missing H1 in heading hierarchy', async () => {
      const { analyzeSEOElements } = await import('./seoAnalysis');
      
      const noH1Data = {
        ...mockScrapedData,
        headings: [
          { level: 2, text: 'H2 without H1' },
          { level: 3, text: 'H3 heading' }
        ]
      };

      const result = await analyzeSEOElements(
        noH1Data,
        'SEO',
        'https://example.com/test',
        false,
        mockEnv
      );

      const hierarchyCheck = result.checks.find(c => c.title === 'Heading Hierarchy');
      expect(hierarchyCheck?.passed).toBe(false);
      expect(hierarchyCheck?.description).toContain('Missing H1');
    });

    it('should analyze code minification', async () => {
      const { analyzeSEOElements } = await import('./seoAnalysis');
      
      const result = await analyzeSEOElements(
        mockScrapedData,
        'SEO',
        'https://example.com/test',
        false,
        mockEnv
      );

      const minificationCheck = result.checks.find(c => c.title === 'Code Minification');
      expect(minificationCheck?.passed).toBe(false); // Mixed minified/unminified files
    });

    it('should detect schema markup', async () => {
      const { analyzeSEOElements } = await import('./seoAnalysis');
      
      const result = await analyzeSEOElements(
        mockScrapedData,
        'SEO',
        'https://example.com/test',
        false,
        mockEnv
      );

      const schemaCheck = result.checks.find(c => c.title === 'Schema Markup');
      expect(schemaCheck?.passed).toBe(true);
      expect(schemaCheck?.description).toContain('2 schema markup');
      expect(schemaCheck?.description).toContain('Article, Organization');
    });

    it('should check image file sizes', async () => {
      const { analyzeSEOElements } = await import('./seoAnalysis');
      
      const result = await analyzeSEOElements(
        mockScrapedData,
        'SEO',
        'https://example.com/test',
        false,
        mockEnv
      );

      const imageSizeCheck = result.checks.find(c => c.title === 'Image File Size');
      expect(imageSizeCheck?.passed).toBe(false); // One image is 600KB (over 500KB limit)
    });

    it('should handle Open Graph image from multiple sources', async () => {
      const { analyzeSEOElements } = await import('./seoAnalysis');
      
      // Test with Webflow API data
      const webflowResult = await analyzeSEOElements(
        mockScrapedData,
        'SEO',
        'https://example.com/test',
        false,
        mockEnv,
        mockWebflowData
      );

      const ogImageCheck = webflowResult.checks.find(c => c.title === 'OG Image');
      expect(ogImageCheck?.passed).toBe(true);

      // Test with scraped data only
      const scrapedOnlyResult = await analyzeSEOElements(
        mockScrapedData,
        'SEO',
        'https://example.com/test',
        false,
        mockEnv
      );

      const ogImageCheck2 = scrapedOnlyResult.checks.find(c => c.title === 'OG Image');
      expect(ogImageCheck2?.passed).toBe(true);
    });

    it('should handle Open Graph title and description', async () => {
      const { analyzeSEOElements } = await import('./seoAnalysis');
      
      const result = await analyzeSEOElements(
        mockScrapedData,
        'SEO',
        'https://example.com/test',
        false,
        mockEnv,
        mockWebflowData
      );

      const ogTitleDescCheck = result.checks.find(c => c.title === 'OG Title and Description');
      expect(ogTitleDescCheck?.passed).toBe(true);
    });

    it('should handle URL keyword matching with canonical URLs', async () => {
      const { analyzeSEOElements } = await import('./seoAnalysis');
      
      const result = await analyzeSEOElements(
        mockScrapedData,
        'seo',
        'https://example.com/test-page',
        false,
        mockEnv,
        mockWebflowData
      );

      const urlCheck = result.checks.find(c => c.title === 'Keyphrase in URL');
      expect(urlCheck?.passed).toBe(true); // Uses canonical URL which contains "seo"
    });

    it('should handle empty or missing data gracefully', async () => {
      const { analyzeSEOElements } = await import('./seoAnalysis');
      
      const emptyScrapedData = {
        url: '',
        title: '',
        metaDescription: '',
        metaKeywords: '',
        canonicalUrl: '',
        content: '',
        headings: [],
        paragraphs: [],
        images: [],
        internalLinks: [],
        outboundLinks: [],
        ogImage: '',
        resources: { js: [], css: [] },
        schemaMarkup: { hasSchema: false, schemaCount: 0, schemaTypes: [] }
      };

      const result = await analyzeSEOElements(
        emptyScrapedData,
        'test',
        'https://example.com/test',
        false,
        mockEnv
      );

      expect(result.checks.length).toBeGreaterThan(0);
      expect(result.score).toBeGreaterThanOrEqual(0); // Some checks may pass even with empty data (e.g., no images = pass)
    });

    it('should include AI recommendations when enabled', async () => {
      const aiMockEnv = {
        USE_GPT_RECOMMENDATIONS: 'true',
        OPENAI_API_KEY: 'test-key'
      };

      const { analyzeSEOElements } = await import('./seoAnalysis');
      
      const result = await analyzeSEOElements(
        mockScrapedData,
        'NonExistentKeyword',
        'https://example.com/test',
        false,
        aiMockEnv,
        undefined,
        undefined,
        mockAdvancedOptions
      );

      // At least some failed checks should have AI recommendations
      const failedChecks = result.checks.filter(c => !c.passed);
      const checksWithRecommendations = failedChecks.filter(c => c.recommendation);
      
      expect(checksWithRecommendations.length).toBeGreaterThan(0);
    });

    it('should handle AI recommendation errors gracefully', async () => {
      // Mock AI function to throw error
      (getAIRecommendation as any).mockRejectedValue(new Error('AI API Error'));

      const aiMockEnv = {
        USE_GPT_RECOMMENDATIONS: 'true',
        OPENAI_API_KEY: 'test-key'
      };

      const { analyzeSEOElements } = await import('./seoAnalysis');
      
      const result = await analyzeSEOElements(
        mockScrapedData,
        'NonExistentKeyword',
        'https://example.com/test',
        false,
        aiMockEnv
      );

      // Should not crash, just not have recommendations
      expect(result.checks.length).toBeGreaterThan(0);
    });

    it('should calculate correct SEO scores', async () => {
      const { analyzeSEOElements } = await import('./seoAnalysis');
      
      const result = await analyzeSEOElements(
        mockScrapedData,
        'SEO',
        'https://example.com/test',
        false,
        mockEnv
      );

      expect(result.passedChecks + result.failedChecks).toBe(result.totalChecks);
      expect(result.score).toBe(Math.round((result.passedChecks / result.totalChecks) * 100));
    });
  });
});