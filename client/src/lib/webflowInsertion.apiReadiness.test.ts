/**
 * Integration tests for Webflow Designer API readiness and fallback mechanisms
 * Tests the TDD fix for API loading issues
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebflowInsertion } from './webflowInsertion';
import { WebflowDataAPI } from './webflowDataApi';
import type { WebflowInsertionRequest } from '../types/webflow-data-api';

// Mock WebflowDataAPI
const mockWebflowDataAPI = {
  getConfig: vi.fn().mockReturnValue({}),
  getAuthHeaders: vi.fn().mockReturnValue({}),
  updatePage: vi.fn().mockResolvedValue({ id: 'test-page', title: 'Updated Title' }),
  getRateLimitInfo: vi.fn().mockReturnValue({ remainingRequests: 100, resetTime: Date.now() }),
} as any;

describe('WebflowInsertion API Readiness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset window.webflow
    delete (global as any).window;
  });

  describe('API Loading Scenarios', () => {
    it('should wait for Designer API to become ready and then succeed', async () => {
      // Setup: API becomes ready after a delay
      let apiReady = false;
      const mockSetPageSetting = vi.fn().mockResolvedValue(undefined);
      
      (global as any).window = {
        webflow: {
          get getPage() {
            return apiReady ? vi.fn().mockReturnValue({ id: 'test-page' }) : undefined;
          },
          setPageSetting: mockSetPageSetting,
        },
      };

      const insertion = new WebflowInsertion(mockWebflowDataAPI);
      
      const request: WebflowInsertionRequest = {
        type: 'page_title',
        pageId: 'test-page',
        value: 'New Title',
      };

      // Start the operation - it should wait for API to be ready
      const operationPromise = insertion.apply(request);

      // Simulate API becoming ready after a delay
      setTimeout(() => {
        apiReady = true;
      }, 200);

      const result = await operationPromise;
      
      expect(result.success).toBe(true);
      expect(mockSetPageSetting).toHaveBeenCalledWith('title', 'New Title');
    });

    it('should fall back to REST API when Designer API times out', async () => {
      // Setup: Designer API never becomes ready
      (global as any).window = {
        webflow: {
          setPageSetting: vi.fn(),
          // getPage is never available
        },
      };

      const insertion = new WebflowInsertion(mockWebflowDataAPI);
      
      const request: WebflowInsertionRequest = {
        type: 'page_title',
        pageId: 'test-page',
        value: 'New Title',
      };

      const result = await insertion.apply(request);
      
      // Should succeed using REST API fallback
      expect(result.success).toBe(true);
      expect(mockWebflowDataAPI.updatePage).toHaveBeenCalledWith('test-page', {
        title: 'New Title'
      });
    });

    it('should handle batch operations with API loading delays', async () => {
      // Setup: API becomes ready during batch processing
      let callCount = 0;
      const mockSetPageSetting = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          throw new Error('API not ready');
        }
        return Promise.resolve();
      });

      (global as any).window = {
        webflow: {
          getPage: vi.fn().mockReturnValue({ id: 'test-page' }),
          setPageSetting: mockSetPageSetting,
        },
      };

      const insertion = new WebflowInsertion(mockWebflowDataAPI);
      
      const batchRequest = {
        operations: [
          {
            type: 'page_title' as const,
            pageId: 'test-page',
            value: 'Title 1',
          },
          {
            type: 'meta_description' as const,
            pageId: 'test-page',
            value: 'Description 1',
          },
        ],
        rollbackEnabled: false,
      };

      const result = await insertion.applyBatch(batchRequest);
      
      expect(result.success).toBe(true);
      expect(result.succeeded).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('should gracefully handle Designer API unavailable during batch operations', async () => {
      // Setup: No Designer API available
      (global as any).window = {};

      const insertion = new WebflowInsertion(mockWebflowDataAPI);
      
      const batchRequest = {
        operations: [
          {
            type: 'page_title' as const,
            pageId: 'test-page',
            value: 'Title 1',
          },
          {
            type: 'meta_description' as const,
            pageId: 'test-page',
            value: 'Description 1',
          },
        ],
        rollbackEnabled: false,
      };

      const result = await insertion.applyBatch(batchRequest);
      
      // Should succeed using REST API
      expect(result.success).toBe(true);
      expect(result.succeeded).toBe(2);
      expect(result.failed).toBe(0);
      
      // Verify REST API was used
      expect(mockWebflowDataAPI.updatePage).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Recovery', () => {
    it('should retry Designer API operations that fail due to loading issues', async () => {
      let attempts = 0;
      const mockSetPageSetting = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('API not ready');
        }
        return Promise.resolve();
      });

      (global as any).window = {
        webflow: {
          getPage: vi.fn().mockReturnValue({ id: 'test-page' }),
          setPageSetting: mockSetPageSetting,
        },
      };

      const insertion = new WebflowInsertion(mockWebflowDataAPI);
      
      const request: WebflowInsertionRequest = {
        type: 'page_title',
        pageId: 'test-page',
        value: 'New Title',
      };

      const result = await insertion.apply(request);
      
      expect(result.success).toBe(true);
      expect(attempts).toBe(3);
    });

    it('should fall back to REST API when Designer API consistently fails', async () => {
      const mockSetPageSetting = vi.fn().mockRejectedValue(new Error('Designer API failed'));

      (global as any).window = {
        webflow: {
          getPage: vi.fn().mockReturnValue({ id: 'test-page' }),
          setPageSetting: mockSetPageSetting,
        },
      };

      const insertion = new WebflowInsertion(mockWebflowDataAPI);
      
      const request: WebflowInsertionRequest = {
        type: 'page_title',
        pageId: 'test-page',
        value: 'New Title',
      };

      const result = await insertion.apply(request);
      
      // Should succeed using REST API fallback
      expect(result.success).toBe(true);
      expect(mockWebflowDataAPI.updatePage).toHaveBeenCalledWith('test-page', {
        title: 'New Title'
      });
    });
  });
});