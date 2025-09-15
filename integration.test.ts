import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scrapeWebPage } from './workers/modules/webScraper';
import { analyzeSEOElements } from './workers/modules/seoAnalysis';

// Mock fetch for integration tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock OpenAI
vi.mock('openai', () => ({
  default: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'SEO-optimized content with target keyword included naturally'
            }
          }]
        })
      }
    }
  }))
}));

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>Basic Page Title</title>
      <meta name="description" content="Basic page description">
      <link rel="canonical" href="https://example.com/test-page">
    </head>
    <body>
      <h1>Main Heading</h1>
      <p>First paragraph with some basic content.</p>
      <p>Second paragraph with more detailed information.</p>
      <img src="test-image.jpg" alt="Test image">
      <a href="https://example.com/internal-page">Internal Link</a>
      <a href="https://external-site.com">External Link</a>
    </body>
    </html>
  `;

  describe('Complete SEO Analysis Flow', () => {
    it('should scrape web page and perform SEO analysis', async () => {
      // Mock successful HTML fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => mockHtml
      });

      const mockEnv = {
        OPENAI_API_KEY: 'test-api-key',
        USE_GPT_RECOMMENDATIONS: 'true'
      };

      // Step 1: Scrape the web page
      const scrapedData = await scrapeWebPage('https://example.com/test-page', 'test keyword');

      // Verify scraping results
      expect(scrapedData.url).toBe('https://example.com/test-page');
      expect(scrapedData.title).toBe('Basic Page Title');
      expect(scrapedData.metaDescription).toBe('Basic page description');
      expect(scrapedData.headings).toHaveLength(1);
      expect(scrapedData.paragraphs).toHaveLength(2);
      expect(scrapedData.images).toHaveLength(1);
      expect(scrapedData.internalLinks).toHaveLength(1);
      expect(scrapedData.outboundLinks).toHaveLength(1);

      // Step 2: Perform SEO analysis on scraped data
      const analysisResult = await analyzeSEOElements(
        scrapedData,
        'test keyword',
        'https://example.com/test-page',
        false, // not homepage
        mockEnv,
        undefined, // no webflow page data
        undefined, // no page assets
        {
          pageType: 'Blog post',
          secondaryKeywords: 'SEO, content optimization',
          languageCode: 'en'
        }
      );

      // Verify analysis results structure
      expect(analysisResult.keyphrase).toBe('test keyword');
      expect(analysisResult.url).toBe('https://example.com/test-page');
      expect(analysisResult.isHomePage).toBe(false);
      expect(typeof analysisResult.score).toBe('number');
      expect(typeof analysisResult.totalChecks).toBe('number');
      expect(typeof analysisResult.passedChecks).toBe('number');
      expect(typeof analysisResult.failedChecks).toBe('number');
      expect(Array.isArray(analysisResult.checks)).toBe(true);
      expect(analysisResult.checks.length).toBeGreaterThan(0);

      // Verify that checks have required properties
      analysisResult.checks.forEach(check => {
        expect(check).toHaveProperty('title');
        expect(check).toHaveProperty('description');
        expect(check).toHaveProperty('passed');
        expect(check).toHaveProperty('priority');
        expect(['high', 'medium', 'low']).toContain(check.priority);
      });
    });

    it('should handle homepage-specific analysis', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => mockHtml
      });

      const mockEnv = {
        OPENAI_API_KEY: 'test-api-key',
        USE_GPT_RECOMMENDATIONS: 'true'
      };

      // Scrape and analyze as homepage
      const scrapedData = await scrapeWebPage('https://example.com', 'homepage keyword');
      
      const analysisResult = await analyzeSEOElements(
        scrapedData,
        'homepage keyword',
        'https://example.com',
        true, // is homepage
        mockEnv,
        undefined,
        undefined,
        {
          pageType: 'Homepage',
          secondaryKeywords: 'business, company',
          languageCode: 'en'
        }
      );

      expect(analysisResult.isHomePage).toBe(true);
      expect(analysisResult.keyphrase).toBe('homepage keyword');
      
      // Homepage should have different content length requirements
      const contentLengthCheck = analysisResult.checks.find(
        check => check.title === 'Content Length'
      );
      expect(contentLengthCheck).toBeDefined();
    });

    it('should handle multilingual SEO analysis', async () => {
      const frenchHtml = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <title>Titre de la page</title>
          <meta name="description" content="Description de la page">
        </head>
        <body>
          <h1>Titre principal</h1>
          <p>Premier paragraphe avec du contenu.</p>
        </body>
        </html>
      `;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => frenchHtml
      });

      const mockEnv = {
        OPENAI_API_KEY: 'test-api-key',
        USE_GPT_RECOMMENDATIONS: 'true'
      };

      const scrapedData = await scrapeWebPage('https://example.fr/test-page', 'mot-clé français');
      
      const analysisResult = await analyzeSEOElements(
        scrapedData,
        'mot-clé français',
        'https://example.fr/test-page',
        false,
        mockEnv,
        undefined,
        undefined,
        {
          pageType: 'Page de service',
          secondaryKeywords: 'SEO, optimisation',
          languageCode: 'fr'
        }
      );

      expect(analysisResult.keyphrase).toBe('mot-clé français');
      expect(analysisResult.checks).toBeDefined();
      expect(analysisResult.checks.length).toBeGreaterThan(0);
    });

    it('should handle SEO analysis without AI recommendations', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => mockHtml
      });

      const mockEnvNoAI = {
        USE_GPT_RECOMMENDATIONS: 'false'
      };

      const scrapedData = await scrapeWebPage('https://example.com/test-page', 'test keyword');
      
      const analysisResult = await analyzeSEOElements(
        scrapedData,
        'test keyword',
        'https://example.com/test-page',
        false,
        mockEnvNoAI
      );

      expect(analysisResult.keyphrase).toBe('test keyword');
      expect(analysisResult.checks).toBeDefined();
      expect(analysisResult.checks.length).toBeGreaterThan(0);

      // All checks should still be present, but without AI recommendations
      analysisResult.checks.forEach(check => {
        expect(check).toHaveProperty('title');
        expect(check).toHaveProperty('description');
        expect(check).toHaveProperty('passed');
        expect(check).toHaveProperty('priority');
      });
    });

    it('should handle errors gracefully in the complete flow', async () => {
      // Mock fetch failure
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        scrapeWebPage('https://example.com/test-page', 'test keyword')
      ).rejects.toThrow('Failed to analyze page: Network error');
    });

    it('should handle HTTP errors in web scraping', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(
        scrapeWebPage('https://example.com/missing-page', 'test keyword')
      ).rejects.toThrow('Failed to analyze page: Failed to fetch page: 404 Not Found');
    });
  });

  describe('Data Flow Integrity', () => {
    it('should maintain data consistency between scraping and analysis', async () => {
      const testUrl = 'https://example.com/consistency-test';
      const testKeyphrase = 'consistency test';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => mockHtml
      });

      const mockEnv = {
        OPENAI_API_KEY: 'test-api-key',
        USE_GPT_RECOMMENDATIONS: 'true'
      };

      // Scrape the page
      const scrapedData = await scrapeWebPage(testUrl, testKeyphrase);
      
      // Ensure scraped data structure is complete
      expect(scrapedData.url).toBe(testUrl);
      expect(scrapedData).toHaveProperty('title');
      expect(scrapedData).toHaveProperty('metaDescription');
      expect(scrapedData).toHaveProperty('headings');
      expect(scrapedData).toHaveProperty('paragraphs');
      expect(scrapedData).toHaveProperty('images');
      expect(scrapedData).toHaveProperty('internalLinks');
      expect(scrapedData).toHaveProperty('outboundLinks');
      expect(scrapedData).toHaveProperty('resources');
      expect(scrapedData).toHaveProperty('canonicalUrl');
      expect(scrapedData).toHaveProperty('metaKeywords');
      expect(scrapedData).toHaveProperty('ogImage');
      expect(scrapedData).toHaveProperty('content');
      expect(scrapedData).toHaveProperty('schemaMarkup');

      // Analyze with the scraped data
      const analysisResult = await analyzeSEOElements(
        scrapedData,
        testKeyphrase,
        testUrl,
        false,
        mockEnv
      );

      // Verify that analysis used the correct input data
      expect(analysisResult.keyphrase).toBe(testKeyphrase);
      expect(analysisResult.url).toBe(testUrl);
      
      // Verify that analysis results reference the scraped content
      const titleCheck = analysisResult.checks.find(check => 
        check.title.includes('Title')
      );
      expect(titleCheck).toBeDefined();

      const metaDescCheck = analysisResult.checks.find(check => 
        check.title.includes('Meta Description')
      );
      expect(metaDescCheck).toBeDefined();
    });
  });
});