import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeSEO, getApiBaseUrl, getApiUrl, collectPageAssets, fetchFromAPI } from './api';
import type { AnalyzeSEORequest, SEOAnalysisResult } from '../../../shared/types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock XMLHttpRequest for image size detection
const mockXHR = {
  open: vi.fn(),
  send: vi.fn(),
  setRequestHeader: vi.fn(),
  onload: null as (() => void) | null,
  onerror: null as (() => void) | null,
  status: 200,
  response: { size: 1024 },
  responseType: ''
};

global.XMLHttpRequest = vi.fn(() => mockXHR) as any;

// Mock window.webflow with proper structure
const mockWebflow = {
  getCurrentPage: vi.fn()
};

// Make webflow globally available but undefined by default
Object.defineProperty(global, 'webflow', {
  value: undefined,
  writable: true,
  configurable: true
});

// Mock document methods for DOM testing
Object.defineProperty(document, 'querySelectorAll', {
  value: vi.fn(),
  writable: true
});

Object.defineProperty(window, 'getComputedStyle', {
  value: vi.fn().mockReturnValue({
    backgroundImage: 'none'
  }),
  writable: true
});

describe('API Functions', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    vi.clearAllMocks();
    
    // Reset location mock
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'localhost',
        href: 'http://localhost:3000'
      },
      writable: true
    });

    // Reset webflow to undefined by default
    Object.defineProperty(global, 'webflow', {
      value: undefined,
      writable: true,
      configurable: true
    });
  });

  describe('getApiBaseUrl', () => {
    it('returns correct API base URL', () => {
      const url = getApiBaseUrl();
      expect(url).toBeDefined();
      expect(typeof url).toBe('string');
      expect(url).toMatch(/^https?:\/\//);
    });
  });

  describe('getApiUrl', () => {
    it('returns development URL for localhost', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true
      });
      
      const url = getApiUrl();
      expect(url).toBe('http://localhost:8787');
    });

    it('returns production URL for Webflow environment', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'webflow.com' },
        writable: true
      });
      
      Object.defineProperty(global, 'webflow', {
        value: mockWebflow,
        writable: true,
        configurable: true
      });
      
      const url = getApiUrl();
      expect(url).toBe('https://seo-copilot-api-production.paul-130.workers.dev');
    });

    it('falls back to production URL', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'example.com' },
        writable: true
      });
      
      Object.defineProperty(global, 'webflow', {
        value: undefined,
        writable: true,
        configurable: true
      });
      
      const url = getApiUrl();
      expect(url).toBe('https://seo-copilot-api-production.paul-130.workers.dev');
    });
  });

  describe('analyzeSEO', () => {
    const mockRequest: AnalyzeSEORequest = {
      keyphrase: 'test keyword',
      url: 'https://example.com',
      isHomePage: false,
      publishPath: '/test',
      webflowPageData: { title: 'Test Page',
        metaDescription: 'This is a test page.'
       },
      debug: true
    };

    const mockResponse: SEOAnalysisResult = {
      checks: [
        { 
          title: 'Page Title', 
          description: 'Title analysis', 
          passed: true, 
          priority: 'high',
          recommendation: 'Your page title is well optimized for SEO',
          introPhrase: 'Page title optimization'
        },
        { 
          title: 'Meta Description', 
          description: 'Description analysis', 
          passed: true, 
          priority: 'high',
          recommendation: 'Meta description length and content are appropriate',
          introPhrase: 'Meta description check'
        },
        { 
          title: 'Headings Structure', 
          description: 'Headings analysis', 
          passed: true, 
          priority: 'medium',
          recommendation: 'Heading structure follows SEO best practices',
          introPhrase: 'Heading hierarchy analysis'
        },
        { 
          title: 'Image Optimization', 
          description: 'Images analysis', 
          passed: true, 
          priority: 'medium',
          recommendation: 'Most images are properly optimized',
          introPhrase: 'Image optimization check',
          imageData: [
            {
              url: 'https://example.com/image1.jpg',
              name: 'hero-image.jpg',
              shortName: 'hero-image',
              size: 150000,
              mimeType: 'image/jpeg',
              alt: 'Hero image for homepage'
            },
            {
              url: 'https://example.com/image2.png',
              name: 'feature-graphic.png',
              shortName: 'feature-graphic',
              size: 89000,
              mimeType: 'image/png',
              alt: 'Feature graphic'
            }
          ]
        },
        { 
          title: 'Performance', 
          description: 'Performance analysis', 
          passed: false, 
          priority: 'low',
          recommendation: 'Consider optimizing page load speed and reducing image sizes',
          introPhrase: 'Performance optimization'
        }
      ],
      passedChecks: 4,
      failedChecks: 1,
      totalChecks: 5,
      url: 'https://example.com',
      keyphrase: 'test keyword',
      isHomePage: false,
      score: 80,
      ogData: {
        title: 'Test Page Title',
        description: 'Test page description',
        image: 'https://example.com/og-image.jpg',
        imageWidth: '1200',
        imageHeight: '630'
      },
      timestamp: new Date().toISOString(),
      apiDataUsed: true
    };

    beforeEach(() => {
      // Mock document.querySelectorAll to return empty arrays
      vi.mocked(document.querySelectorAll).mockReturnValue([] as any);
    });

    it('successfully analyzes page SEO', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await analyzeSEO(mockRequest);
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8787/api/analyze',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            keyphrase: 'test keyword',
            url: 'https://example.com',
            isHomePage: false,
            publishPath: '/test',
            webflowPageData: { 
              title: 'Test Page',
              metaDescription: 'This is a test page.'
            },
            pageAssets: [],
            debug: true
          })
        })
      );
      
      expect(result).toEqual(mockResponse);
    });

    it('handles API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error'
      });

      await expect(analyzeSEO(mockRequest)).rejects.toThrow('API returned status code 500');
    });

    it('handles network errors with retries', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(analyzeSEO(mockRequest)).rejects.toThrow('SEO Analysis failed: Network error');
      
      // Should retry 3 times total (initial + 2 retries)
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('handles 404 errors specifically', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      await expect(analyzeSEO(mockRequest)).rejects.toThrow('API returned status code 404');
    });

    it('retries on fetch failure and succeeds on retry', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        });

      const result = await analyzeSEO(mockRequest);
      
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('collectPageAssets', () => {
    beforeEach(() => {
      // Reset DOM mocks
      vi.mocked(document.querySelectorAll).mockImplementation((selector) => {
        if (selector === 'img') {
          return [
            {
              getAttribute: vi.fn((attr) => {
                if (attr === 'src') return 'https://example.com/image1.jpg';
                if (attr === 'alt') return 'Test Image';
                return null;
              })
            },
            {
              getAttribute: vi.fn((attr) => {
                if (attr === 'src') return 'data:image/png;base64,abc';
                if (attr === 'alt') return 'Data URI Image';
                return null;
              })
            }
          ] as any;
        }
        if (selector === '*') {
          return [] as any;
        }
        return [] as any;
      });

      // Reset XHR mock and ensure it responds immediately with correct structure
      mockXHR.onload = null;
      mockXHR.onerror = null;
      mockXHR.send = vi.fn(() => {
        // Simulate immediate successful response with size data
        setTimeout(() => {
          if (mockXHR.onload) {
            // Mock the actual XHR response structure
            mockXHR.response = new Blob(['test'], { type: 'image/jpeg' });
            Object.defineProperty(mockXHR.response, 'size', { value: 1024 });
            mockXHR.status = 200;
            mockXHR.onload();
          }
        }, 0);
      });

      // Reset webflow mock
      mockWebflow.getCurrentPage.mockClear();
    });

    it('collects standard img elements', async () => {
      // Ensure webflow is undefined to avoid OG image inclusion
      Object.defineProperty(global, 'webflow', {
        value: undefined,
        writable: true,
        configurable: true
      });
      
      const assets = await collectPageAssets();
      
      expect(assets).toHaveLength(1); // Should skip data URI
      expect(assets[0]).toMatchObject({
        url: 'https://example.com/image1.jpg',
        alt: 'Test Image',
        type: 'image'
      });
    });

    it('skips data URI images', async () => {
      // Ensure webflow is undefined to avoid OG image inclusion
      Object.defineProperty(global, 'webflow', {
        value: undefined,
        writable: true,
        configurable: true
      });
      
      const assets = await collectPageAssets();
      
      // Should not include the data URI image
      expect(assets.every(asset => !asset.url.startsWith('data:'))).toBe(true);
    });

    it('handles Webflow page data', async () => {
      // Mock the exact Webflow API flow that the real function uses
      const mockPage = {
        getOpenGraphImage: vi.fn().mockResolvedValue('https://example.com/og-image.jpg')
      };
      mockWebflow.getCurrentPage.mockResolvedValueOnce(mockPage);

      // Set webflow globally for this test
      Object.defineProperty(global, 'webflow', {
        value: mockWebflow,
        writable: true,
        configurable: true
      });

      const assets = await collectPageAssets();
      
      // Should include OG image from Webflow (plus the regular image = 2 total)
      expect(assets.some(asset => asset.url === 'https://example.com/og-image.jpg')).toBe(true);
      
      // Verify the Webflow API was called correctly
      expect(mockWebflow.getCurrentPage).toHaveBeenCalled();
      expect(mockPage.getOpenGraphImage).toHaveBeenCalled();
    });

    it('handles errors in Webflow page data gracefully', async () => {
      mockWebflow.getCurrentPage.mockRejectedValueOnce(new Error('Webflow error'));

      // Set webflow globally but make it error
      Object.defineProperty(global, 'webflow', {
        value: mockWebflow,
        writable: true,
        configurable: true
      });

      const assets = await collectPageAssets();
      
      // Should still return other assets even if Webflow fails
      expect(Array.isArray(assets)).toBe(true);
      // Should still have the regular img element
      expect(assets.some(asset => asset.url === 'https://example.com/image1.jpg')).toBe(true);
    });

    it('deduplicates assets with same URL', async () => {
      // Ensure webflow is undefined to avoid OG image inclusion
      Object.defineProperty(global, 'webflow', {
        value: undefined,
        writable: true,
        configurable: true
      });
      
      vi.mocked(document.querySelectorAll).mockImplementation((selector) => {
        if (selector === 'img') {
          return [
            {
              getAttribute: vi.fn((attr) => {
                if (attr === 'src') return 'https://example.com/same-image.jpg';
                if (attr === 'alt') return 'Image 1';
                return null;
              })
            },
            {
              getAttribute: vi.fn((attr) => {
                if (attr === 'src') return 'https://example.com/same-image.jpg';
                if (attr === 'alt') return 'Image 2';
                return null;
              })
            }
          ] as any;
        }
        return [] as any;
      });

      const assets = await collectPageAssets();
      
      // Should only have one asset despite duplicate URLs
      expect(assets).toHaveLength(1);
      expect(assets[0].url).toBe('https://example.com/same-image.jpg');
    });

    it('handles XHR errors gracefully', async () => {
      // Ensure webflow is undefined to avoid OG image inclusion
      Object.defineProperty(global, 'webflow', {
        value: undefined,
        writable: true,
        configurable: true
      });
      
      // Mock XHR to fail
      mockXHR.send = vi.fn(() => {
        setTimeout(() => {
          if (mockXHR.onerror) {
            mockXHR.onerror();
          }
        }, 0);
      });

      const assets = await collectPageAssets();
      
      // Should still return assets even if size detection fails
      expect(Array.isArray(assets)).toBe(true);
      expect(assets.some(asset => asset.url === 'https://example.com/image1.jpg')).toBe(true);
    });

    it('includes size information when available', async () => {
      // Ensure webflow is undefined to avoid OG image inclusion
      Object.defineProperty(global, 'webflow', {
        value: undefined,
        writable: true,
        configurable: true
      });
      
      const assets = await collectPageAssets();
      
      // Should have size information from XHR mock
      expect(assets[0]).toHaveProperty('size');
      expect(assets[0].size).toBe(1024);
    });

    it('handles Webflow OG image with size information', async () => {
      // Mock the exact Webflow API flow
      const mockPage = {
        getOpenGraphImage: vi.fn().mockResolvedValue('https://example.com/og-image.jpg')
      };
      mockWebflow.getCurrentPage.mockResolvedValueOnce(mockPage);

      // Set webflow globally for this test
      Object.defineProperty(global, 'webflow', {
        value: mockWebflow,
        writable: true,
        configurable: true
      });

      const assets = await collectPageAssets();
      
      // Find the OG image asset
      const ogAsset = assets.find(asset => asset.url === 'https://example.com/og-image.jpg');
      expect(ogAsset).toBeDefined();
      expect(ogAsset?.type).toBe('image');
      expect(ogAsset?.source).toBe('webflow-meta');
      expect(ogAsset?.alt).toBe('OG Image');
    });
  });

  describe('fetchFromAPI', () => {
    const mockData = { test: 'data' };
    const mockResponse = { result: 'success' };

    it('successfully makes API call', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const result = await fetchFromAPI('/test-endpoint', mockData);
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8787/test-endpoint',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(mockData)
        })
      );
      
      expect(result).toEqual(mockResponse);
    });

    it('handles API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request'
      });

      await expect(fetchFromAPI('/test-endpoint', mockData))
        .rejects.toThrow('API error: 400 Bad Request');
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'));

      await expect(fetchFromAPI('/test-endpoint', mockData))
        .rejects.toThrow('Network failure');
    });

    it('uses default worker URL when environment variable not available', async () => {
      // The function uses a hardcoded fallback, not environment variables
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await fetchFromAPI('/test-endpoint', mockData);
      
      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8787/test-endpoint',
        expect.any(Object)
      );
    });
  });
});
