import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeSEO, fetchOAuthToken, collectPageAssets, fetchFromAPI, getApiUrl, getApiBaseUrl } from './api';
import type { AnalyzeSEORequest, SEOAnalysisResult } from '../../../shared/types';

// Mock the createLogger utility with prefix-aware behavior
const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

const mockAssetLogger = vi.hoisted(() => ({
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

const mockConsole = vi.hoisted(() => ({
  error: vi.fn(),
  warn: vi.fn(),
  log: vi.fn(),
}));

vi.mock('./utils', () => ({
  createLogger: vi.fn((prefix: string) => {
    if (prefix === '[SEO Assets]') return mockAssetLogger;
    return mockLogger;
  }),
}));

// Mock console methods
Object.defineProperty(global, 'console', {
  value: mockConsole,
  writable: true,
});

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock global webflow
const mockWebflow = {
  getCurrentPage: vi.fn(),
  setExtensionSize: vi.fn(),
  getSiteInfo: vi.fn(),
  getAllElements: vi.fn(),
  getPublishPath: vi.fn(),
  subscribe: vi.fn(),
};

const mockPage = {
  getOpenGraphImage: vi.fn(),
};

Object.defineProperty(global, 'webflow', {
  value: mockWebflow,
  writable: true,
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    hostname: 'localhost',
    href: 'http://localhost:3000/test-page'
  },
  writable: true,
});

describe('getApiBaseUrl function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear any existing import mock
    vi.unstubAllGlobals();
  });

  it('returns development URL in development mode', () => {
    // Mock import.meta.env.PROD as false and VITE_WORKER_URL for dev mode
    vi.stubEnv('PROD', false);
    vi.stubEnv('VITE_WORKER_URL', 'http://localhost:8787');
    
    // Mock window.webflow as undefined to prevent it from using production URL
    Object.defineProperty(global, 'webflow', {
      value: undefined,
      writable: true,
    });
    
    const result = getApiBaseUrl();
    expect(result).toBe('http://localhost:8787');
  });

  it('returns production URL in production mode', () => {
    // Mock import.meta.env.PROD as true and set production worker URL
    vi.stubEnv('PROD', true);
    vi.stubEnv('VITE_WORKER_URL', 'https://seo-copilot-api-production.paul-130.workers.dev');
    
    // Mock window.location to not be localhost for this test
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'webflow.com'
      },
      writable: true,
      configurable: true
    });
    
    const result = getApiBaseUrl();
    expect(result).toBe('https://seo-copilot-api-production.paul-130.workers.dev');
  });
});

describe('getWebflowPageData function edge cases', () => {
  it('handles webflow undefined scenario', async () => {
    Object.defineProperty(global, 'webflow', {
      value: undefined,
      writable: true,
    });

    const mockImg = {
      getAttribute: vi.fn((attr) => {
        if (attr === 'src') return 'https://example.com/test.jpg';
        if (attr === 'alt') return 'test image';
        return '';
      }),
    };
    
    document.querySelectorAll = vi.fn().mockImplementation((selector) => {
      if (selector === 'img') return [mockImg];
      if (selector === '*') return [];
      return [];
    });

    mockFetch.mockResolvedValue({
      ok: true,
      headers: {
        get: (header: string) => header === 'content-length' ? '1024' : null
      }
    });

    const assets = await collectPageAssets();
    
    expect(assets).toHaveLength(1);
    expect(assets[0]).toEqual({
      url: 'https://example.com/test.jpg',
      alt: 'test image',
      type: 'image',
      size: 1024  // The actual function does include size when fetch succeeds
    });
  });
});

describe('api.ts error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockConsole.error.mockReset();
    mockConsole.warn.mockReset();
    mockConsole.log.mockReset();
    
    // Reset webflow mock to working state
    mockWebflow.getCurrentPage.mockResolvedValue({
      getOpenGraphImage: () => Promise.resolve(null)
    });
    
    // Reset window.location to default
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'localhost',
        href: 'http://localhost:3000/test-page'
      },
      writable: true,
    });

    // Reset webflow to default mock
    Object.defineProperty(global, 'webflow', {
      value: mockWebflow,
      writable: true,
    });
  });

  describe('getApiUrl error handling', () => {
    it('handles missing WORKER_URL in development mode', () => {
      // Set up environment variables for development mode without WORKER_URL
      vi.stubEnv('MODE', 'development');
      vi.stubEnv('VITE_WORKER_URL', undefined); // Missing WORKER_URL
      vi.stubEnv('VITE_FORCE_LOCAL_DEV', undefined);

      const result = getApiUrl();
      
      // Should fall back to production when WORKER_URL is missing
      expect(result).toBe('https://seo-copilot-api-production.paul-130.workers.dev');
      expect(mockLogger.debug).toHaveBeenCalledWith('Using production API URL');
    });

    it('handles window.location access errors in local check', () => {
      // Mock window.location to throw an error
      Object.defineProperty(window, 'location', {
        get() {
          throw new Error('Location access denied');
        },
        configurable: true,
      });

      const result = getApiUrl();
      
      expect(result).toBe('https://seo-copilot-api-production.paul-130.workers.dev'); // Should fall back to production
    });

    it('handles production environment correctly', () => {
      // Set up environment variables for production mode
      vi.stubEnv('MODE', 'production');
      vi.stubEnv('VITE_FORCE_LOCAL_DEV', undefined);
      vi.stubEnv('VITE_WORKER_URL', undefined);

      const result = getApiUrl();
      
      expect(result).toBe('https://seo-copilot-api-production.paul-130.workers.dev');
      expect(mockLogger.debug).toHaveBeenCalledWith('Using production API URL');
    });
  });

  describe('analyzeSEO error handling', () => {
    const mockRequest: AnalyzeSEORequest = {
      keyphrase: 'test keyword',
      url: 'https://example.com',
      isHomePage: false,
      publishPath: '/test',
      debug: true
    };

    it('handles fetch errors with retry logic', async () => {
      // Mock setTimeout globally to avoid delays
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn((callback: any) => {
        // Execute callback immediately to skip delay
        if (typeof callback === 'function') {
          callback();
        }
        return 1 as any;
      }) as any;
      
      // Mock fetch to fail twice, then succeed
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Connection timeout'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ score: 85, checks: [] })
        });

      const result = await analyzeSEO(mockRequest);
      
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ score: 85, checks: [] });
      
      // Restore setTimeout
      global.setTimeout = originalSetTimeout;
    }, 15000);

    it('handles maximum retry attempts exceeded', async () => {
      // Mock fetch to always fail
      mockFetch.mockRejectedValue(new Error('Persistent network error'));

      // Mock setTimeout to avoid actual delays
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn((cb) => {
        cb();
        return 1 as any;
      }) as any;

      await expect(analyzeSEO(mockRequest)).rejects.toThrow('SEO Analysis failed: Persistent network error');
      
      // The actual implementation is "1 original + 2 retries = 3 attempts" but we also have collectPageAssets() call
      expect(mockFetch).toHaveBeenCalledTimes(4); // 1 for collectPageAssets + 3 for analyze attempts
      
      // Restore setTimeout
      global.setTimeout = originalSetTimeout;
    }, 10000);

    it('handles 404 response with specific error message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(analyzeSEO(mockRequest)).rejects.toThrow('API returned status code 404');
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        '[SEO Analyzer] API endpoint not found. Check if worker is running and the /api/analyze endpoint is defined.'
      );
    }, 10000);

    it('handles non-200 status codes', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      // Mock setTimeout to avoid actual delays
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn((cb) => {
        cb();
        return 1 as any;
      }) as any;

      await expect(analyzeSEO(mockRequest)).rejects.toThrow('API returned status code 500');
      
      // Restore setTimeout
      global.setTimeout = originalSetTimeout;
    }, 10000);

    it('handles response without status', async () => {
      mockFetch.mockResolvedValue(null);

      await expect(analyzeSEO(mockRequest)).rejects.toThrow('API returned status code unknown');
    }, 10000);

    it('handles JSON parsing errors', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      await expect(analyzeSEO(mockRequest)).rejects.toThrow('SEO Analysis failed: Invalid JSON');
    }, 10000);

    it('handles non-Error exceptions', async () => {
      mockFetch.mockRejectedValue('String error');

      // Mock setTimeout to avoid actual delays
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn((cb) => {
        cb();
        return 1 as any;
      }) as any;

      await expect(analyzeSEO(mockRequest)).rejects.toThrow('An unknown error occurred during SEO analysis.');
      
      // Restore setTimeout
      global.setTimeout = originalSetTimeout;
    }, 10000);
  });

  describe('fetchOAuthToken error handling', () => {
    it('handles non-200 response status', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      await expect(fetchOAuthToken('invalid-code')).rejects.toThrow('Failed to fetch OAuth token: Unauthorized');
    });

    it('handles JSON parsing errors', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Malformed JSON'))
      });

      await expect(fetchOAuthToken('valid-code')).rejects.toThrow('Malformed JSON');
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network connection failed'));

      await expect(fetchOAuthToken('valid-code')).rejects.toThrow('Network connection failed');
    });
  });

  describe('collectPageAssets error handling', () => {
    beforeEach(() => {
      // Mock DOM methods
      document.querySelectorAll = vi.fn();
      window.getComputedStyle = vi.fn();
    });

    it('handles webflow page data errors gracefully', async () => {
      mockWebflow.getCurrentPage.mockRejectedValue(new Error('Webflow API error'));
      document.querySelectorAll = vi.fn().mockReturnValue([]);

      const assets = await collectPageAssets();
      
      expect(mockAssetLogger.error).toHaveBeenCalledWith(
        'Error in getWebflowPageData: Error: Webflow API error'
      );
      expect(assets).toEqual([]);
    });

    it('handles missing img src attributes', async () => {
      const mockImg = {
        getAttribute: vi.fn((attr) => attr === 'src' ? null : ''),
      };
      
      document.querySelectorAll = vi.fn().mockImplementation((selector) => {
        if (selector === 'img') return [mockImg];
        if (selector === '*') return [];
        return [];
      });

      const assets = await collectPageAssets();
      
      expect(mockAssetLogger.info).toHaveBeenCalledWith('Skipping image with no src attribute');
      expect(assets).toEqual([]);
    });

    it('handles data URI images', async () => {
      const mockImg = {
        getAttribute: vi.fn((attr) => {
          if (attr === 'src') return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
          if (attr === 'alt') return 'test image';
          return '';
        }),
      };
      
      document.querySelectorAll = vi.fn().mockImplementation((selector) => {
        if (selector === 'img') return [mockImg];
        if (selector === '*') return [];
        return [];
      });

      const assets = await collectPageAssets();
      
      expect(mockAssetLogger.info).toHaveBeenCalledWith('Skipping data URI image');
      expect(assets).toEqual([]);
    });

    it('handles image size determination errors', async () => {
      // Prevent webflow from interfering with this test
      Object.defineProperty(global, 'webflow', {
        value: undefined,
        writable: true,
      });

      const mockImg = {
        getAttribute: vi.fn((attr) => {
          if (attr === 'src') return 'https://example.com/image.jpg';
          if (attr === 'alt') return 'test image';
          return '';
        }),
      };
      
      document.querySelectorAll = vi.fn().mockImplementation((selector) => {
        if (selector === 'img') return [mockImg];
        if (selector === '*') return [];
        return [];
      });

      // Mock fetch to fail for HEAD request
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      // Mock XHR to fail - the actual implementation doesn't log XHR failures
      // It only logs errors in the outermost catch block
      const failingXHR = {
        open: vi.fn(),
        send: vi.fn(function(this: any) {
          // Trigger onerror immediately to simulate XHR failure
          setTimeout(() => {
            if (this.onerror && typeof this.onerror === 'function') {
              this.onerror();
            }
          }, 0);
        }),
        setRequestHeader: vi.fn(),
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        status: 0,
        response: null,
        responseType: '',
      };
      
      global.XMLHttpRequest = vi.fn(() => failingXHR) as any;

      const assets = await collectPageAssets();
      
      expect(assets).toHaveLength(1);
      expect(assets[0]).toEqual({
        url: 'https://example.com/image.jpg',
        alt: 'test image',
        type: 'image'
      });
      
      // The actual implementation doesn't log individual XHR failures
      // It only logs "Could not determine size for" info message
      expect(mockAssetLogger.info).toHaveBeenCalledWith(
        'Could not determine size for https://example.com/image.jpg'
      );
      
      // No error should be logged for XHR failures since they're handled gracefully
      expect(mockAssetLogger.error).not.toHaveBeenCalledWith(
        expect.stringContaining('Error getting size for')
      );
    }, 10000);

    it('handles image size determination with exception in getImageSize', async () => {
      // Test the case where an actual error is thrown and logged
      Object.defineProperty(global, 'webflow', {
        value: undefined,
        writable: true,
      });

      const mockImg = {
        getAttribute: vi.fn((attr) => {
          if (attr === 'src') return 'https://example.com/image.jpg';
          if (attr === 'alt') return 'test image';
          return '';
        }),
      };
      
      document.querySelectorAll = vi.fn().mockImplementation((selector) => {
        if (selector === 'img') return [mockImg];
        if (selector === '*') return [];
        return [];
      });

      // Mock fetch to throw an error that will be caught by the outer try-catch
      mockFetch.mockImplementation(() => {
        throw new Error('Unexpected fetch error');
      });
      
      // Mock XHR constructor to throw an error
      global.XMLHttpRequest = vi.fn(() => {
        throw new Error('XHR construction failed');
      }) as any;

      const assets = await collectPageAssets();
      
      expect(assets).toHaveLength(1);
      expect(assets[0]).toEqual({
        url: 'https://example.com/image.jpg',
        alt: 'test image',
        type: 'image'
      });
      
      // Now the error should be logged because an exception was thrown
      expect(mockAssetLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error getting size for https://example.com/image.jpg')
      );
    }, 10000);
  });

  describe('fetchFromAPI error handling', () => {
    it('handles network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network connection failed'));

      await expect(fetchFromAPI('/test', { data: 'test' })).rejects.toThrow('Network connection failed');
      
      expect(mockLogger.error).toHaveBeenCalledWith('API fetch error: Network connection failed');
    });

    it('handles non-200 status with error text', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad request format')
      });

      await expect(fetchFromAPI('/test', { data: 'test' })).rejects.toThrow('API error: 400 Bad request format');
      
      expect(mockLogger.error).toHaveBeenCalledWith('API error (400): Bad request format');
    });

    it('handles JSON parsing errors in successful response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON response'))
      });

      await expect(fetchFromAPI('/test', { data: 'test' })).rejects.toThrow('Invalid JSON response');
    });

    it('handles non-Error exceptions', async () => {
      mockFetch.mockRejectedValue('String error message');

      await expect(fetchFromAPI('/test', { data: 'test' })).rejects.toThrow('String error message');
      
      expect(mockLogger.error).toHaveBeenCalledWith('API fetch error: String error message');
    });
  });

  describe('Image size determination edge cases', () => {
    it('handles XHR timeout scenarios', async () => {
      // Prevent webflow from interfering
      Object.defineProperty(global, 'webflow', {
        value: undefined,
        writable: true,
      });

      const mockImg = {
        getAttribute: vi.fn((attr) => {
          if (attr === 'src') return 'https://slow-server.com/image.jpg';
          if (attr === 'alt') return 'slow image';
          return '';
        }),
      };
      
      document.querySelectorAll = vi.fn().mockImplementation((selector) => {
        if (selector === 'img') return [mockImg];
        if (selector === '*') return [];
        return [];
      });

      // Mock fetch to fail for HEAD request
      mockFetch.mockRejectedValue(new Error('HEAD request failed'));

      // Mock XHR to simulate timeout (never call onload/onerror)
      const timeoutXHR = {
        open: vi.fn(),
        send: vi.fn(), // Don't trigger any callbacks to simulate timeout
        setRequestHeader: vi.fn(),
        onload: null,
        onerror: null,
        status: 200,
        response: { size: 1024 },
        responseType: '',
      };
      
      const MockXHRConstructor = vi.fn(() => timeoutXHR) as any;
      MockXHRConstructor.UNSENT = 0;
      MockXHRConstructor.OPENED = 1;
      MockXHRConstructor.HEADERS_RECEIVED = 2;
      MockXHRConstructor.LOADING = 3;
      MockXHRConstructor.DONE = 4;
      MockXHRConstructor.prototype = {};
      
      global.XMLHttpRequest = MockXHRConstructor;

      const assets = await collectPageAssets();
      
      expect(assets).toHaveLength(1);
      expect(assets[0].size).toBeUndefined();
      expect(mockAssetLogger.info).toHaveBeenCalledWith('Could not determine size for https://slow-server.com/image.jpg');
    }, 10000); // Increase timeout for this test

    it('handles invalid content-length headers', async () => {
      // Prevent webflow from interfering
      Object.defineProperty(global, 'webflow', {
        value: undefined,
        writable: true,
      });

      // Mock HEAD request to fail (invalid content-length)
      mockFetch.mockRejectedValueOnce(new Error('HEAD request failed'));

      const mockImg = {
        getAttribute: vi.fn((attr) => {
          if (attr === 'src') return 'https://example.com/image.jpg';
          if (attr === 'alt') return 'test image';
          return '';
        }),
      };
      
      document.querySelectorAll = vi.fn().mockImplementation((selector) => {
        if (selector === 'img') return [mockImg];
        if (selector === '*') return [];
        return [];
      });

      // Mock successful XHR fallback - properly mock the blob response
      const successXHR = {
        open: vi.fn(),
        send: vi.fn(function(this: any) {
          // Simulate successful response with proper blob mock
          this.status = 200;
          this.response = { size: 1024 }; // This is the blob mock
          if (this.onload && typeof this.onload === 'function') {
            this.onload();
          }
        }),
        setRequestHeader: vi.fn(),
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        status: 200,
        response: { size: 1024 }, // Blob-like object with size property
        responseType: 'blob',
      };

      const MockXHRConstructor = vi.fn(() => successXHR) as any;
      MockXHRConstructor.UNSENT = 0;
      MockXHRConstructor.OPENED = 1;
      MockXHRConstructor.HEADERS_RECEIVED = 2;
      MockXHRConstructor.LOADING = 3;
      MockXHRConstructor.DONE = 4;
      MockXHRConstructor.prototype = {};
      
      global.XMLHttpRequest = MockXHRConstructor;

      const assets = await collectPageAssets();
      
      expect(assets).toHaveLength(1);
      expect(assets[0].size).toBe(1024);
    });
  });
});
