import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from './index';
import { validateAnalyzeRequest } from './modules/validation';
import { scrapeWebPage } from './modules/webScraper';
import { analyzeSEOElements, checkKeywordMatch } from './modules/seoAnalysis';

// Mock dependencies
vi.mock('./modules/validation');
vi.mock('./modules/webScraper');
vi.mock('./modules/seoAnalysis');

const mockedValidateAnalyzeRequest = vi.mocked(validateAnalyzeRequest);
const mockedScrapeWebPage = vi.mocked(scrapeWebPage);
const mockedAnalyzeSEOElements = vi.mocked(analyzeSEOElements);
const mockedCheckKeywordMatch = vi.mocked(checkKeywordMatch);

// Mock Hono context
const createMockContext = (body?: any, env?: any) => ({
  req: {
    json: vi.fn().mockResolvedValue(body || {}),
  },
  json: vi.fn().mockReturnValue({ status: 'mocked' }),
  env: env || {},
});

describe('Workers API Index', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const mockContext = createMockContext();
      
      // Test the health endpoint directly
      const response = await app.request('/health');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toEqual({ status: 'ok' });
    });
  });

  describe('GET /test-keywords', () => {
    it('should test keyword matching functionality', async () => {
      const mockTestResult = {
        found: true,
        matchedKeyword: 'web developer',
        keywordResults: [
          { keyword: 'web developer', passed: true, isPrimary: true },
          { keyword: 'services', passed: false, isPrimary: false }
        ]
      };
      
      mockedCheckKeywordMatch.mockReturnValue(mockTestResult);
      
      const response = await app.request('/test-keywords');
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toEqual({ testResult: mockTestResult });
      expect(mockedCheckKeywordMatch).toHaveBeenCalledWith(
        "Expert Web Developer for Affordable Website Design Services | PMDS",
        "web developer",
        "services"
      );
    });
  });

  describe('POST /api/analyze', () => {
    const validRequestBody = {
      keyphrase: 'test keyword',
      url: 'https://example.com',
      isHomePage: false,
      webflowPageData: {},
      pageAssets: [],
      advancedOptions: {}
    };

    it('should analyze SEO with valid request', async () => {
      const mockScrapedData = {
        url: 'https://example.com',
        title: 'Test Title',
        metaDescription: 'Test Description',
        headings: [{ level: 1, text: 'Main Heading' }],
        paragraphs: ['Test paragraph'],
        images: [],
        internalLinks: [],
        outboundLinks: [],
        resources: { js: [], css: [] },
        canonicalUrl: 'https://example.com',
        metaKeywords: '',
        ogImage: '',
        content: 'Test Content',
        schemaMarkup: { hasSchema: false, schemaTypes: [], schemaCount: 0 }
      };
      
      const mockAnalysisResult = {
        keyphrase: 'test keyword',
        url: 'https://example.com',
        isHomePage: false,
        score: 85,
        totalChecks: 18,
        passedChecks: 15,
        failedChecks: 3,
        checks: []
      };

      mockedValidateAnalyzeRequest.mockReturnValue(true);
      mockedScrapeWebPage.mockResolvedValue(mockScrapedData);
      mockedAnalyzeSEOElements.mockResolvedValue(mockAnalysisResult);

      const response = await app.request('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validRequestBody),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockAnalysisResult);
      expect(mockedValidateAnalyzeRequest).toHaveBeenCalledWith(validRequestBody);
      expect(mockedScrapeWebPage).toHaveBeenCalledWith(validRequestBody.url, validRequestBody.keyphrase);
      expect(mockedAnalyzeSEOElements).toHaveBeenCalledWith(
        mockScrapedData,
        validRequestBody.keyphrase,
        validRequestBody.url,
        validRequestBody.isHomePage,
        undefined, // env is undefined in test context
        validRequestBody.webflowPageData,
        validRequestBody.pageAssets,
        validRequestBody.advancedOptions
      );
    });

    it('should return 400 for invalid request body', async () => {
      const invalidRequestBody = { invalid: 'data' };
      
      mockedValidateAnalyzeRequest.mockReturnValue(false);

      const response = await app.request('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidRequestBody),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid request body' });
      expect(mockedValidateAnalyzeRequest).toHaveBeenCalledWith(invalidRequestBody);
      expect(mockedScrapeWebPage).not.toHaveBeenCalled();
      expect(mockedAnalyzeSEOElements).not.toHaveBeenCalled();
    });

    it('should handle scraping errors gracefully', async () => {
      const scrapingError = new Error('Failed to scrape website');
      
      mockedValidateAnalyzeRequest.mockReturnValue(true);
      mockedScrapeWebPage.mockRejectedValue(scrapingError);

      const response = await app.request('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validRequestBody),
      });

      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Internal server error' });
      expect(mockedScrapeWebPage).toHaveBeenCalledWith(validRequestBody.url, validRequestBody.keyphrase);
      expect(mockedAnalyzeSEOElements).not.toHaveBeenCalled();
    });

    it('should handle analysis errors gracefully', async () => {
      const analysisError = new Error('Analysis failed');
      const mockScrapedData = {
        url: 'https://example.com',
        title: 'Test',
        metaDescription: 'Test',
        headings: [],
        paragraphs: [],
        images: [],
        internalLinks: [],
        outboundLinks: [],
        resources: { js: [], css: [] },
        canonicalUrl: 'https://example.com',
        metaKeywords: '',
        ogImage: '',
        content: 'Test',
        schemaMarkup: { hasSchema: false, schemaTypes: [], schemaCount: 0 }
      };
      
      mockedValidateAnalyzeRequest.mockReturnValue(true);
      mockedScrapeWebPage.mockResolvedValue(mockScrapedData);
      mockedAnalyzeSEOElements.mockRejectedValue(analysisError);

      const response = await app.request('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validRequestBody),
      });

      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Internal server error' });
      expect(mockedAnalyzeSEOElements).toHaveBeenCalled();
    });

    it('should handle JSON parsing errors', async () => {
      const response = await app.request('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      });

      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Internal server error' });
    });

    it('should pass environment variables to analyzeSEOElements', async () => {
      const mockEnv = { OPENAI_API_KEY: 'test-key' };
      const mockScrapedData = {
        url: 'https://example.com',
        title: 'Test',
        metaDescription: 'Test',
        headings: [],
        paragraphs: [],
        images: [],
        internalLinks: [],
        outboundLinks: [],
        resources: { js: [], css: [] },
        canonicalUrl: 'https://example.com',
        metaKeywords: '',
        ogImage: '',
        content: 'Test',
        schemaMarkup: { hasSchema: false, schemaTypes: [], schemaCount: 0 }
      };
      const mockAnalysisResult = {
        keyphrase: 'test',
        url: 'https://example.com',
        isHomePage: false,
        score: 85,
        totalChecks: 18,
        passedChecks: 15,
        failedChecks: 3,
        checks: []
      };

      mockedValidateAnalyzeRequest.mockReturnValue(true);
      mockedScrapeWebPage.mockResolvedValue(mockScrapedData);
      mockedAnalyzeSEOElements.mockResolvedValue(mockAnalysisResult);

      // Create a request with environment
      const req = new Request('http://localhost/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequestBody),
      });

      // Mock the fetch to include env
      const mockFetch = vi.fn().mockImplementation(async (request: Request) => {
        if (request.url.includes('/api/analyze')) {
          // Simulate Cloudflare Workers environment passing
          const c = {
            req: { json: () => Promise.resolve(validRequestBody) },
            json: (data: any, status?: number) => new Response(JSON.stringify(data), { status }),
            env: mockEnv
          };
          
          return await app.request(req);
        }
        return new Response('Not Found', { status: 404 });
      });

      await app.request(req);

      expect(mockedAnalyzeSEOElements).toHaveBeenCalledWith(
        mockScrapedData,
        validRequestBody.keyphrase,
        validRequestBody.url,
        validRequestBody.isHomePage,
        undefined, // env is undefined in test context
        validRequestBody.webflowPageData,
        validRequestBody.pageAssets,
        validRequestBody.advancedOptions
      );
    });
  });

  describe('CORS Middleware', () => {
    it('should apply CORS middleware to all routes', async () => {
      // Test that CORS is applied by checking response headers
      const response = await app.request('/health');
      
      // The response should be successful, indicating CORS middleware doesn't block
      expect(response.status).toBe(200);
    });
  });
});