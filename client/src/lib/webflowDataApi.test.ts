/**
 * TDD Tests for Webflow Data API Client
 * RED Phase: These tests should FAIL initially until implementation is complete
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebflowDataAPI } from './webflowDataApi';
import type { 
  WebflowDataApiConfig, 
  WebflowOAuthToken,
  WebflowPage,
  WebflowPageUpdateRequest,
  WebflowCMSCollection,
  WebflowCMSItem,
  WebflowCMSItemCreateRequest
} from '../types/webflow-data-api';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('WebflowDataAPI', () => {
  let dataApi: WebflowDataAPI;
  let mockToken: WebflowOAuthToken;
  
  const mockConfig: WebflowDataApiConfig = {
    baseUrl: 'https://api.webflow.com',
    timeout: 5000,
    retries: 3,
    retryDelay: 1000,
    rateLimitStrategy: 'queue',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockToken = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'sites:read sites:write cms:read cms:write pages:read pages:write',
      expires_at: Date.now() + 3600000,
    };

    // Set a default mock for fetch to avoid issues
    mockFetch.mockImplementation(() => Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      headers: new Headers({ 'x-ratelimit-remaining': '100' }),
    }));

    dataApi = new WebflowDataAPI(mockToken, mockConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultApi = new WebflowDataAPI(mockToken);
      const config = defaultApi.getConfig();
      
      expect(config.baseUrl).toBe('https://api.webflow.com');
      expect(config.timeout).toBe(10000);
      expect(config.retries).toBe(3);
      expect(config.rateLimitStrategy).toBe('queue');
    });

    it('should initialize with custom configuration', () => {
      const config = dataApi.getConfig();
      expect(config).toEqual(mockConfig);
    });

    it('should validate token on initialization', () => {
      expect(() => new WebflowDataAPI(null as any)).toThrow('Valid token is required');
      expect(() => new WebflowDataAPI({} as any)).toThrow('Valid token is required');
    });

    it('should set authorization header correctly', () => {
      const headers = dataApi.getAuthHeaders();
      expect(headers.Authorization).toBe(`Bearer ${mockToken.access_token}`);
    });
  });

  describe('HTTP Request Handling', () => {
    it('should make GET requests with proper headers', async () => {
      const mockResponse = { data: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: new Headers({ 'x-ratelimit-remaining': '100' }),
      });

      const result = await dataApi.get('/test-endpoint');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.webflow.com/test-endpoint',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken.access_token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should make POST requests with body', async () => {
      const mockResponse = { data: 'created' };
      const requestBody = { name: 'test' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: new Headers({ 'x-ratelimit-remaining': '100' }),
      });

      const result = await dataApi.post('/test-endpoint', requestBody);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.webflow.com/test-endpoint',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken.access_token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(requestBody),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should make PATCH requests with body', async () => {
      const mockResponse = { data: 'updated' };
      const requestBody = { name: 'updated' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        headers: new Headers({ 'x-ratelimit-remaining': '100' }),
      });

      const result = await dataApi.patch('/test-endpoint', requestBody);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.webflow.com/test-endpoint',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(requestBody),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should make DELETE requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers({ 'x-ratelimit-remaining': '100' }),
      });

      await dataApi.delete('/test-endpoint');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.webflow.com/test-endpoint',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({
          err: 'Not Found',
          code: 404,
          msg: 'Resource not found',
        }),
      });

      await expect(dataApi.get('/nonexistent')).rejects.toThrow('Not Found: Resource not found');
    });

    it('should handle validation errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({
          err: 'Validation Error',
          code: 400,
          msg: 'Invalid request data',
          details: { field: 'name', message: 'Name is required' },
        }),
      });

      await expect(dataApi.post('/test', {})).rejects.toThrow('Validation Error: Invalid request data');
    });

    it('should handle unauthorized errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({
          err: 'Unauthorized',
          code: 401,
          msg: 'Invalid or expired token',
        }),
      });

      await expect(dataApi.get('/test')).rejects.toThrow('Unauthorized: Invalid or expired token');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(dataApi.get('/test')).rejects.toThrow('Network error');
    });
  });

  describe('Rate Limiting', () => {
    it('should track rate limit information', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
        headers: new Headers({
          'x-ratelimit-remaining': '50',
          'x-ratelimit-limit': '100',
          'x-ratelimit-reset': '1640995200',
        }),
      });

      await dataApi.get('/test');

      const rateLimitInfo = dataApi.getRateLimitInfo();
      expect(rateLimitInfo.remaining).toBe(50);
      expect(rateLimitInfo.limit).toBe(100);
      expect(rateLimitInfo.resetTime).toBe(1640995200000); // Converted to milliseconds
    });

    it('should handle rate limit exceeded', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Headers({
          'x-ratelimit-remaining': '0',
          'retry-after': '60',
        }),
        json: () => Promise.resolve({
          err: 'Rate Limited',
          code: 429,
          msg: 'Too many requests',
        }),
      });

      await expect(dataApi.get('/test')).rejects.toThrow('Rate Limited: Too many requests');

      const rateLimitInfo = dataApi.getRateLimitInfo();
      expect(rateLimitInfo.remaining).toBe(0);
      expect(rateLimitInfo.retryAfter).toBe(60000); // Converted to milliseconds
    });

    it('should queue requests when rate limited', async () => {
      // Configure with queue strategy
      const queueApi = new WebflowDataAPI(mockToken, { 
        ...mockConfig, 
        rateLimitStrategy: 'queue' 
      });

      // First request succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'first' }),
        headers: new Headers({ 'x-ratelimit-remaining': '1' }),
      });

      // Second request is rate limited
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({
          'x-ratelimit-remaining': '0',
          'retry-after': '1',
        }),
        json: () => Promise.resolve({
          err: 'Rate Limited',
          code: 429,
          msg: 'Too many requests',
        }),
      });

      // Third request should be queued and executed after delay
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'queued' }),
        headers: new Headers({ 'x-ratelimit-remaining': '99' }),
      });

      const promise1 = queueApi.get('/test1');
      const promise2 = queueApi.get('/test2');

      const [result1] = await Promise.allSettled([promise1, promise2]);
      
      expect(result1.status).toBe('fulfilled');
      if (result1.status === 'fulfilled') {
        expect(result1.value).toEqual({ data: 'first' });
      }
    });
  });

  describe('Retry Logic', () => {
    it('should retry on network errors', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: 'success' }),
          headers: new Headers({ 'x-ratelimit-remaining': '100' }),
        });

      const result = await dataApi.get('/test');
      
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ data: 'success' });
    });

    it('should retry on 5xx server errors', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: () => Promise.resolve({ err: 'Server Error', code: 500, msg: 'Internal error' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: 'success' }),
          headers: new Headers({ 'x-ratelimit-remaining': '100' }),
        });

      const result = await dataApi.get('/test');
      
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ data: 'success' });
    });

    it('should not retry on 4xx client errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ err: 'Bad Request', code: 400, msg: 'Invalid data' }),
      });

      await expect(dataApi.get('/test')).rejects.toThrow('Bad Request: Invalid data');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should respect retry configuration', async () => {
      const limitedRetryApi = new WebflowDataAPI(mockToken, { 
        ...mockConfig, 
        retries: 1 
      });

      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      await expect(limitedRetryApi.get('/test')).rejects.toThrow('Network error');
      expect(mockFetch).toHaveBeenCalledTimes(2); // Original + 1 retry
    });

    it('should implement exponential backoff', async () => {
      const startTime = Date.now();
      
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: 'success' }),
          headers: new Headers({ 'x-ratelimit-remaining': '100' }),
        });

      await dataApi.get('/test');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should have some delay due to exponential backoff
      expect(duration).toBeGreaterThan(1000); // At least 1 second delay
    });
  });

  describe('Sites API', () => {
    it('should list sites', async () => {
      const mockSites = [
        { _id: 'site_1', name: 'Site 1', shortName: 'site-1' },
        { _id: 'site_2', name: 'Site 2', shortName: 'site-2' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ sites: mockSites }),
        headers: new Headers({ 'x-ratelimit-remaining': '100' }),
      });

      const result = await dataApi.listSites();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.webflow.com/sites',
        expect.objectContaining({ method: 'GET' })
      );
      expect(result.sites).toEqual(mockSites);
    });

    it('should get site details', async () => {
      const mockSite = {
        _id: 'site_123',
        name: 'Test Site',
        shortName: 'test-site',
        database: 'db_123',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSite),
        headers: new Headers({ 'x-ratelimit-remaining': '100' }),
      });

      const result = await dataApi.getSite('site_123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.webflow.com/sites/site_123',
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockSite);
    });
  });

  describe('Pages API', () => {
    const mockPage: WebflowPage = {
      _id: 'page_123',
      siteId: 'site_123',
      title: 'Test Page',
      slug: 'test-page',
      createdOn: '2024-01-01T00:00:00.000Z',
      lastUpdated: '2024-01-15T12:00:00.000Z',
      isHomePage: false,
      isFolderHomePage: false,
      archived: false,
      draft: false,
      seo: {
        title: 'Test Page SEO Title',
        description: 'Test page SEO description',
      },
      openGraph: {
        title: 'Test Page OG Title',
        description: 'Test page OG description',
      },
    };

    it('should list pages for a site', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ pages: [mockPage] }),
        headers: new Headers({ 'x-ratelimit-remaining': '100' }),
      });

      const result = await dataApi.listPages('site_123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.webflow.com/sites/site_123/pages',
        expect.objectContaining({ method: 'GET' })
      );
      expect(result.pages).toEqual([mockPage]);
    });

    it('should get page details', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPage),
        headers: new Headers({ 'x-ratelimit-remaining': '100' }),
      });

      const result = await dataApi.getPage('page_123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.webflow.com/pages/page_123',
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockPage);
    });

    it('should update page metadata', async () => {
      const updateRequest: WebflowPageUpdateRequest = {
        title: 'Updated Title',
        seo: {
          title: 'Updated SEO Title',
          description: 'Updated SEO Description',
        },
      };

      const updatedPage = {
        ...mockPage,
        ...updateRequest,
        lastUpdated: '2024-01-15T13:00:00.000Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updatedPage),
        headers: new Headers({ 'x-ratelimit-remaining': '100' }),
      });

      const result = await dataApi.updatePage('page_123', updateRequest);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.webflow.com/pages/page_123',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(updateRequest),
        })
      );
      expect(result).toEqual(updatedPage);
    });
  });

  describe('CMS API', () => {
    const mockCollection: WebflowCMSCollection = {
      _id: 'collection_123',
      lastUpdated: '2024-01-15T12:00:00.000Z',
      createdOn: '2024-01-01T00:00:00.000Z',
      name: 'Blog Posts',
      slug: 'blog-posts',
      singularName: 'Blog Post',
      fields: [
        {
          id: 'field_name',
          type: 'PlainText',
          slug: 'name',
          name: 'Name',
          required: true,
          editable: true,
        },
      ],
    };

    const mockCMSItem: WebflowCMSItem = {
      _id: 'item_123',
      lastUpdated: '2024-01-15T12:00:00.000Z',
      createdOn: '2024-01-10T00:00:00.000Z',
      isArchived: false,
      isDraft: false,
      fieldData: {
        name: 'Test Blog Post',
        slug: 'test-blog-post',
      },
    };

    it('should list collections for a site', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ collections: [mockCollection] }),
        headers: new Headers({ 'x-ratelimit-remaining': '100' }),
      });

      const result = await dataApi.listCollections('site_123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.webflow.com/sites/site_123/collections',
        expect.objectContaining({ method: 'GET' })
      );
      expect(result.collections).toEqual([mockCollection]);
    });

    it('should list items in a collection', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [mockCMSItem] }),
        headers: new Headers({ 'x-ratelimit-remaining': '100' }),
      });

      const result = await dataApi.listCollectionItems('collection_123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.webflow.com/collections/collection_123/items',
        expect.objectContaining({ method: 'GET' })
      );
      expect(result.items).toEqual([mockCMSItem]);
    });

    it('should create collection item', async () => {
      const createRequest: WebflowCMSItemCreateRequest = {
        fields: {
          name: 'New Blog Post',
          slug: 'new-blog-post',
        },
        isDraft: true,
      };

      const createdItem = {
        ...mockCMSItem,
        fieldData: createRequest.fields,
        isDraft: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(createdItem),
        headers: new Headers({ 'x-ratelimit-remaining': '100' }),
      });

      const result = await dataApi.createCollectionItem('collection_123', createRequest);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.webflow.com/collections/collection_123/items',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(createRequest),
        })
      );
      expect(result).toEqual(createdItem);
    });

    it('should update collection item', async () => {
      const updateRequest = {
        fields: {
          name: 'Updated Blog Post',
        },
      };

      const updatedItem = {
        ...mockCMSItem,
        fieldData: {
          ...mockCMSItem.fieldData,
          ...updateRequest.fields,
        },
        lastUpdated: '2024-01-15T13:00:00.000Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updatedItem),
        headers: new Headers({ 'x-ratelimit-remaining': '100' }),
      });

      const result = await dataApi.updateCollectionItem('collection_123', 'item_123', updateRequest);

      expect(mockFetch).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.webflow.com/collections/collection_123/items/item_123',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(updateRequest),
        })
      );
      expect(result).toEqual(updatedItem);
    });

    it('should delete collection item', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers({ 'x-ratelimit-remaining': '100' }),
      });

      await dataApi.deleteCollectionItem('collection_123', 'item_123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.webflow.com/collections/collection_123/items/item_123',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('Request Pagination', () => {
    it('should handle paginated responses', async () => {
      const mockItems = Array.from({ length: 50 }, (_, i) => ({
        _id: `item_${i}`,
        name: `Item ${i}`,
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          items: mockItems.slice(0, 25),
          count: 25,
          limit: 25,
          offset: 0,
          total: 50,
        }),
        headers: new Headers({ 'x-ratelimit-remaining': '100' }),
      });

      const result = await dataApi.listCollectionItems('collection_123', { limit: 25, offset: 0 });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.webflow.com/collections/collection_123/items?limit=25&offset=0',
        expect.objectContaining({ method: 'GET' })
      );

      expect(result.items).toHaveLength(25);
      expect(result.total).toBe(50);
      expect(result.count).toBe(25);
    });

    it('should build query strings correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
        headers: new Headers({ 'x-ratelimit-remaining': '100' }),
      });

      await dataApi.listCollectionItems('collection_123', {
        limit: 10,
        offset: 20,
        name: 'test',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.webflow.com/collections/collection_123/items?limit=10&offset=20&name=test',
        expect.any(Object)
      );
    });
  });

  describe('Token Management', () => {
    it('should update token', () => {
      const newToken: WebflowOAuthToken = {
        ...mockToken,
        access_token: 'new-access-token',
      };

      dataApi.updateToken(newToken);

      const headers = dataApi.getAuthHeaders();
      expect(headers.Authorization).toBe(`Bearer ${newToken.access_token}`);
    });

    it('should validate token before requests', async () => {
      const expiredToken: WebflowOAuthToken = {
        ...mockToken,
        expires_at: Date.now() - 1000, // Expired
      };

      const expiredApi = new WebflowDataAPI(expiredToken);

      await expect(expiredApi.get('/test')).rejects.toThrow('Access token has expired');
    });
  });

  describe('Request Timeout', () => {
    it('should timeout long requests', async () => {
      const timeoutApi = new WebflowDataAPI(mockToken, { 
        ...mockConfig, 
        timeout: 100 
      });

      mockFetch.mockImplementationOnce(
        (url, options) => new Promise((resolve, reject) => {
          const signal = options?.signal;
          if (signal) {
            signal.addEventListener('abort', () => {
              const error = new Error('The operation was aborted');
              error.name = 'AbortError';
              reject(error);
            });
          }
          // Simulate a request that takes longer than the timeout
          setTimeout(() => {
            resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve({ message: 'Mock response for external URL', url }),
            });
          }, 200);
        })
      );

      await expect(timeoutApi.get('/test')).rejects.toThrow('Request timeout');
    });

    it('should allow custom timeout per request', async () => {
      mockFetch.mockImplementationOnce(
        (url, options) => new Promise((resolve, reject) => {
          const signal = options?.signal;
          if (signal) {
            signal.addEventListener('abort', () => {
              const error = new Error('The operation was aborted');
              error.name = 'AbortError';
              reject(error);
            });
          }
          // Simulate a request that takes longer than the timeout
          setTimeout(() => {
            resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve({ message: 'Mock response for external URL', url }),
            });
          }, 200);
        })
      );

      await expect(
        dataApi.get('/test', { timeout: 100 })
      ).rejects.toThrow('Request timeout');
    });
  });
});