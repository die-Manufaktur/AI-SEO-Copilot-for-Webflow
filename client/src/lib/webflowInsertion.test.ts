/**
 * TDD Tests for Webflow Insertion Logic
 * RED Phase: These tests should FAIL initially until implementation is complete
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebflowInsertion } from './webflowInsertion';
import { WebflowDataAPI } from './webflowDataApi';
import type {
  WebflowOAuthToken,
  WebflowInsertionRequest,
  WebflowInsertionResult,
  WebflowBatchInsertionRequest,
  WebflowBatchInsertionResult,
} from '../types/webflow-data-api';

// Mock WebflowDataAPI
vi.mock('./webflowDataApi');

describe('WebflowInsertion', () => {
  let insertion: WebflowInsertion;
  let mockDataApi: ReturnType<typeof vi.mocked<WebflowDataAPI>>;
  let mockToken: WebflowOAuthToken;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockToken = {
      access_token: 'test-token',
      refresh_token: 'test-refresh',
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'sites:write pages:write cms:write',
      expires_at: Date.now() + 3600000,
    };

    // Create a mock instance with all methods mocked
    mockDataApi = {
      updatePage: vi.fn(),
      updateCollectionItem: vi.fn(),
      getPage: vi.fn(),
      listCollections: vi.fn(),
      listCollectionItems: vi.fn(),
      getConfig: vi.fn().mockReturnValue({}),
      getAuthHeaders: vi.fn().mockReturnValue({ Authorization: 'Bearer test-token' }),
      getRateLimitInfo: vi.fn().mockReturnValue({
        remaining: 100,
        limit: 100,
        resetTime: Date.now() + 60000,
        retryAfter: 0,
      }),
    } as any;

    insertion = new WebflowInsertion(mockDataApi);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Single Insertion Operations', () => {
    it('should apply page title recommendation', async () => {
      const request: WebflowInsertionRequest = {
        type: 'page_title',
        pageId: 'page_123',
        value: 'New Optimized Title',
      };

      const updatedPage = {
        _id: 'page_123',
        title: 'New Optimized Title',
        lastUpdated: new Date().toISOString(),
      };

      mockDataApi.updatePage.mockResolvedValueOnce(updatedPage as any);

      const result = await insertion.apply(request);

      expect(mockDataApi.updatePage).toHaveBeenCalledWith('page_123', {
        title: 'New Optimized Title',
      });

      expect(result).toEqual({
        success: true,
        data: updatedPage,
      });
    });

    it('should apply meta description recommendation', async () => {
      const request: WebflowInsertionRequest = {
        type: 'meta_description',
        pageId: 'page_123',
        value: 'New SEO-optimized meta description for better visibility',
      };

      const updatedPage = {
        _id: 'page_123',
        seo: {
          title: 'Existing Title',
          description: 'New SEO-optimized meta description for better visibility',
        },
        lastUpdated: new Date().toISOString(),
      };

      mockDataApi.updatePage.mockResolvedValueOnce(updatedPage as any);

      const result = await insertion.apply(request);

      expect(mockDataApi.updatePage).toHaveBeenCalledWith('page_123', {
        seo: {
          description: 'New SEO-optimized meta description for better visibility',
        },
      });

      expect(result.success).toBe(true);
      expect(result.data.seo.description).toBe(request.value);
    });

    it('should apply page SEO data (title + description)', async () => {
      const request: WebflowInsertionRequest = {
        type: 'page_seo',
        pageId: 'page_123',
        value: {
          title: 'Optimized SEO Title',
          description: 'Optimized SEO description',
        },
      };

      const updatedPage = {
        _id: 'page_123',
        seo: {
          title: 'Optimized SEO Title',
          description: 'Optimized SEO description',
        },
        lastUpdated: new Date().toISOString(),
      };

      mockDataApi.updatePage.mockResolvedValueOnce(updatedPage as any);

      const result = await insertion.apply(request);

      expect(mockDataApi.updatePage).toHaveBeenCalledWith('page_123', {
        seo: request.value,
      });

      expect(result.success).toBe(true);
    });

    it('should apply CMS field recommendation', async () => {
      const request: WebflowInsertionRequest = {
        type: 'cms_field',
        cmsItemId: 'item_123',
        fieldId: 'field_name',
        value: 'Updated Blog Post Title',
      };

      const updatedItem = {
        _id: 'item_123',
        fieldData: {
          name: 'Updated Blog Post Title',
          slug: 'updated-blog-post-title',
        },
        lastUpdated: new Date().toISOString(),
      };

      // Setup mocks for collection ID resolution
      mockDataApi.listCollections.mockResolvedValueOnce({
        collections: [{ _id: 'collection_123', name: 'Blog Posts', slug: 'blog-posts' }],
      } as any);

      mockDataApi.listCollectionItems.mockResolvedValueOnce({
        items: [{ _id: 'item_123' }],
      } as any);

      mockDataApi.updateCollectionItem.mockResolvedValueOnce(updatedItem as any);

      const result = await insertion.apply(request);

      expect(mockDataApi.updateCollectionItem).toHaveBeenCalledWith(
        'collection_123', // Collection ID resolved from mocks
        'item_123',
        {
          fields: {
            [request.fieldId!]: request.value,
          },
        }
      );

      expect(result.success).toBe(true);
      expect(result.data.fieldData.name).toBe(request.value);
    });
  });

  describe('Validation', () => {
    it('should validate required fields for page operations', async () => {
      const invalidRequest: WebflowInsertionRequest = {
        type: 'page_title',
        // Missing pageId
        value: 'New Title',
      };

      const result = await insertion.apply(invalidRequest);
      
      expect(result.success).toBe(false);
      expect(result.error?.msg).toBe('Page ID is required for page operations');
    });

    it('should validate required fields for CMS operations', async () => {
      const invalidRequest: WebflowInsertionRequest = {
        type: 'cms_field',
        // Missing cmsItemId
        fieldId: 'field_name',
        value: 'New Value',
      };

      const result = await insertion.apply(invalidRequest);
      
      expect(result.success).toBe(false);
      expect(result.error?.msg).toBe('CMS Item ID and Field ID are required for CMS operations');
    });

    it('should validate value types', async () => {
      const request: WebflowInsertionRequest = {
        type: 'page_title',
        pageId: 'page_123',
        value: '', // Empty value
      };

      const result = await insertion.apply(request);
      
      expect(result.success).toBe(false);
      expect(result.error?.msg).toBe('Value cannot be empty');
    });

    it('should validate page SEO value structure', async () => {
      const request: WebflowInsertionRequest = {
        type: 'page_seo',
        pageId: 'page_123',
        value: 'Invalid value', // Should be an object
      };

      const result = await insertion.apply(request);
      
      expect(result.success).toBe(false);
      expect(result.error?.msg).toBe('Page SEO value must be an object with title and/or description');
    });

    it('should validate character limits', async () => {
      const request: WebflowInsertionRequest = {
        type: 'page_title',
        pageId: 'page_123',
        value: 'A'.repeat(501), // Exceeds 500 character limit
      };

      const result = await insertion.apply(request);
      
      expect(result.success).toBe(false);
      expect(result.error?.msg).toBe('Page title must be less than 500 characters');
    });
  });


  describe('Batch Operations', () => {
    it('should apply multiple recommendations in batch', async () => {
      const batchRequest: WebflowBatchInsertionRequest = {
        operations: [
          {
            type: 'page_title',
            pageId: 'page_123',
            value: 'New Title 1',
          },
          {
            type: 'meta_description',
            pageId: 'page_123',
            value: 'New Description 1',
          },
          {
            type: 'page_title',
            pageId: 'page_456',
            value: 'New Title 2',
          },
        ],
      };

      mockDataApi.updatePage
        .mockResolvedValueOnce({ _id: 'page_123', title: 'New Title 1' } as any)
        .mockResolvedValueOnce({ _id: 'page_123', seo: { description: 'New Description 1' } } as any)
        .mockResolvedValueOnce({ _id: 'page_456', title: 'New Title 2' } as any);

      const result = await insertion.applyBatch(batchRequest);

      expect(result.success).toBe(true);
      expect(result.succeeded).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(3);
      expect(result.results.every(r => r.success)).toBe(true);
    });

    it('should handle partial batch failures', async () => {
      const batchRequest: WebflowBatchInsertionRequest = {
        operations: [
          {
            type: 'page_title',
            pageId: 'page_123',
            value: 'New Title',
          },
          {
            type: 'page_title',
            pageId: 'page_404',
            value: 'Will Fail',
          },
          {
            type: 'page_title',
            pageId: 'page_789',
            value: 'Another Title',
          },
        ],
      };

      let callCount = 0;
      mockDataApi.updatePage.mockImplementation(async (pageId: string) => {
        callCount++;
        if (callCount === 1) {
          return { _id: 'page_123', title: 'New Title' } as any;
        } else if (callCount === 2) {
          throw new Error('Page not found');
        } else if (callCount === 3) {
          return { _id: 'page_789', title: 'Another Title' } as any;
        }
        throw new Error('Unexpected call');
      });

      const result = await insertion.applyBatch(batchRequest);

      expect(result.success).toBe(false); // Overall failure due to partial failures
      expect(result.succeeded).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.results[1].success).toBe(false);
      expect(result.results[1].error).toBeDefined();
    });

    it('should require confirmation for batch operations when specified', async () => {
      const batchRequest: WebflowBatchInsertionRequest = {
        operations: [
          {
            type: 'page_title',
            pageId: 'page_123',
            value: 'New Title',
          },
        ],
        confirmationRequired: true,
      };

      const confirmResult = await insertion.prepareBatchConfirmation(batchRequest);

      expect(confirmResult).toEqual({
        operations: batchRequest.operations,
        estimatedTime: expect.any(Number),
        affectedPages: ['page_123'],
        affectedCmsItems: [],
        requiresConfirmation: true,
      });
    });

    it('should support rollback for batch operations', async () => {
      const batchRequest: WebflowBatchInsertionRequest = {
        operations: [
          {
            type: 'page_title',
            pageId: 'page_123',
            value: 'New Title',
          },
        ],
        rollbackEnabled: true,
      };

      // Mock getting current state before changes
      mockDataApi.getPage.mockResolvedValueOnce({
        _id: 'page_123',
        title: 'Original Title',
      } as any);

      // Mock applying changes
      mockDataApi.updatePage.mockResolvedValueOnce({
        _id: 'page_123',
        title: 'New Title',
      } as any);

      const result = await insertion.applyBatch(batchRequest);

      expect(result.success).toBe(true);
      expect(result.rollbackId).toBeDefined();

      // Test rollback
      const rollbackResult = await insertion.rollback(result.rollbackId!);

      expect(rollbackResult.success).toBe(true);
      expect(mockDataApi.updatePage).toHaveBeenCalledWith('page_123', {
        title: 'Original Title',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const request: WebflowInsertionRequest = {
        type: 'page_title',
        pageId: 'page_123',
        value: 'New Title',
      };

      mockDataApi.updatePage.mockImplementation(async () => {
        throw new Error('API Error: Server error');
      });

      const result = await insertion.apply(request);

      expect(result).toEqual({
        success: false,
        error: {
          err: 'API Error',
          code: 500,
          msg: 'Server error',
        },
      });
    });

    it('should handle rate limiting errors', async () => {
      const request: WebflowInsertionRequest = {
        type: 'page_title',
        pageId: 'page_123',
        value: 'New Title',
      };

      const rateLimitError = new Error('Rate Limited: Too many requests');
      (rateLimitError as any).rateLimitInfo = {
        remaining: 0,
        limit: 100,
        resetTime: Date.now() + 60000,
        retryAfter: 60000,
      };

      mockDataApi.updatePage.mockImplementation(async () => {
        throw rateLimitError;
      });
      mockDataApi.getRateLimitInfo.mockReturnValue({
        remaining: 0,
        limit: 100,
        resetTime: Date.now() + 60000,
        retryAfter: 60000,
      });

      const result = await insertion.apply(request);

      expect(result.success).toBe(false);
      expect(result.rateLimitInfo).toBeDefined();
      expect(result.rateLimitInfo?.retryAfter).toBe(60000);
    });

    it('should validate permissions before applying', async () => {
      // Create a read-only mock API
      const readOnlyApi = {
        ...mockDataApi,
        getAuthHeaders: vi.fn().mockReturnValue({ Authorization: 'Bearer read-only-token' }),
      } as any;

      const readOnlyInsertion = new WebflowInsertion(readOnlyApi);

      const request: WebflowInsertionRequest = {
        type: 'page_title',
        pageId: 'page_123',
        value: 'New Title',
      };

      const result = await readOnlyInsertion.apply(request);
      
      expect(result.success).toBe(false);
      expect(result.error?.msg).toBe('pages:write scope required');
    });
  });

  describe('Progress Tracking', () => {
    it('should track progress for long operations', async () => {
      const progressCallback = vi.fn();
      
      const batchRequest: WebflowBatchInsertionRequest = {
        operations: [
          { type: 'page_title', pageId: 'page_1', value: 'Title 1' },
          { type: 'page_title', pageId: 'page_2', value: 'Title 2' },
          { type: 'page_title', pageId: 'page_3', value: 'Title 3' },
        ],
      };

      mockDataApi.updatePage.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({} as any), 100))
      );

      await insertion.applyBatch(batchRequest, progressCallback);

      expect(progressCallback).toHaveBeenCalledWith({
        current: 0,
        total: 3,
        percentage: 0,
        currentOperation: expect.any(Object),
      });

      expect(progressCallback).toHaveBeenCalledWith({
        current: 3,
        total: 3,
        percentage: 100,
        currentOperation: expect.any(Object),
      });
    });
  });

  describe('Collection ID Resolution', () => {
    it('should resolve collection ID for CMS items', async () => {
      const request: WebflowInsertionRequest = {
        type: 'cms_field',
        cmsItemId: 'item_123',
        fieldId: 'field_name',
        value: 'New Value',
      };

      // Mock collection listing
      mockDataApi.listCollections.mockResolvedValueOnce({
        collections: [
          {
            _id: 'collection_123',
            name: 'Blog Posts',
            slug: 'blog-posts',
          },
        ],
      } as any);

      // Mock item listing to find which collection contains the item
      mockDataApi.listCollectionItems.mockResolvedValueOnce({
        items: [{ _id: 'item_123' }],
      } as any);

      mockDataApi.updateCollectionItem.mockResolvedValueOnce({} as any);

      await insertion.apply(request);

      expect(mockDataApi.updateCollectionItem).toHaveBeenCalledWith(
        'collection_123',
        'item_123',
        expect.any(Object)
      );
    });

    it('should cache collection ID lookups', async () => {
      const request: WebflowInsertionRequest = {
        type: 'cms_field',
        cmsItemId: 'item_123',
        fieldId: 'field_name',
        value: 'New Value',
      };

      mockDataApi.listCollections.mockResolvedValueOnce({
        collections: [{ _id: 'collection_123' }],
      } as any);

      mockDataApi.listCollectionItems.mockResolvedValueOnce({
        items: [{ _id: 'item_123' }],
      } as any);

      mockDataApi.updateCollectionItem.mockResolvedValue({} as any);

      // Apply twice
      await insertion.apply(request);
      await insertion.apply(request);

      // Should only lookup collection once
      expect(mockDataApi.listCollections).toHaveBeenCalledTimes(1);
      expect(mockDataApi.listCollectionItems).toHaveBeenCalledTimes(1);
    });
  });
});