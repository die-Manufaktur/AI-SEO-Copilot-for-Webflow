/**
 * End-to-End Integration Tests for Content Element Apply Functionality
 * NOTE: Tests for H1, H2, and Introduction insertion types are SKIPPED
 * due to Webflow Designer API limitations (issue #504)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebflowInsertion } from './webflowInsertion';
import type { WebflowInsertionRequest } from '../types/webflow-data-api';

// Mock the WebflowDesignerExtensionAPI
const mockDesignerApi = {
  updateH1Heading: vi.fn(),
  updateH2Heading: vi.fn(),
  updateIntroductionParagraph: vi.fn(),
  updatePageTitle: vi.fn(),
  updatePageMetaDescription: vi.fn(),
  updatePageSlug: vi.fn(),
  addCustomCode: vi.fn(),
  updatePageSEO: vi.fn(),
  updateCMSField: vi.fn(),
};

// Mock WebflowDataAPI
const mockDataApi = {
  updatePage: vi.fn(),
  getPage: vi.fn(),
  updateCMSItem: vi.fn(),
  getCMSItem: vi.fn(),
};

// Mock WebflowAuth
const mockAuth = {
  getToken: vi.fn().mockResolvedValue('valid-token'),
  isAuthenticated: vi.fn().mockReturnValue(true),
};

// Mock window.webflow for Designer context detection
const mockWebflow = {
  getCurrentPage: vi.fn(),
  getAllElementsByTag: vi.fn(),
  getAllElementsByClass: vi.fn(),
};

Object.defineProperty(window, 'webflow', {
  value: mockWebflow,
  writable: true,
});

describe('Content Element Apply Functionality - Integration Tests', () => {
  let webflowInsertion: WebflowInsertion;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up successful mocks
    mockDesignerApi.updateH1Heading.mockResolvedValue(true);
    mockDesignerApi.updateH2Heading.mockResolvedValue(true);
    mockDesignerApi.updateIntroductionParagraph.mockResolvedValue(true);
    
    // Create WebflowInsertion instance with mocked dependencies
    webflowInsertion = new WebflowInsertion(mockDataApi as any);
    
    // Inject the mock designer API
    (webflowInsertion as any).designerApi = mockDesignerApi;
    (webflowInsertion as any).useDesignerAPI = true;
  });

  describe.skip('H1 Heading Apply Integration - DISABLED (issue #504)', () => {
    it('should successfully apply H1 heading changes via Designer API', async () => {
      const request = {
        type: 'h1_heading',
        pageId: 'page_123',
        value: 'Optimized H1 with SEO Keyphrase',
      } as any;

      const result = await webflowInsertion.apply(request as any);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        id: 'page_123',
        content: 'Optimized H1 with SEO Keyphrase',
        type: 'h1_heading',
      });
      expect(result.data?.modified).toBeDefined();
      expect(mockDesignerApi.updateH1Heading).toHaveBeenCalledWith(
        'page_123',
        'Optimized H1 with SEO Keyphrase'
      );
    });

    it('should handle H1 update failures gracefully', async () => {
      mockDesignerApi.updateH1Heading.mockResolvedValue(false);

      const request = {
        type: 'h1_heading',
        pageId: 'page_123',
        value: 'Failed H1 Update',
      };

      await expect(webflowInsertion.apply(request as any)).rejects.toThrow(
        'Designer API failed to update H1 heading'
      );
    });

    it('should fail when Designer API is not available for H1', async () => {
      // Simulate no Designer API available
      (webflowInsertion as any).useDesignerAPI = false;
      (webflowInsertion as any).designerApi = null;

      const request = {
        type: 'h1_heading',
        pageId: 'page_123',
        value: 'H1 without Designer API',
      };

      await expect(webflowInsertion.apply(request as any)).rejects.toThrow(
        'H1 heading updates require Designer Extension API'
      );
    });
  });

  describe.skip('H2 Heading Apply Integration - DISABLED (issue #504)', () => {
    it('should successfully apply H2 heading changes to first H2 by default', async () => {
      const request = {
        type: 'h2_heading',
        pageId: 'page_123',
        value: 'Optimized H2 with SEO Keyphrase',
      };

      const result = await webflowInsertion.apply(request as any);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        id: 'page_123',
        content: 'Optimized H2 with SEO Keyphrase',
        type: 'h2_heading',
        elementIndex: 0,
      });
      expect(mockDesignerApi.updateH2Heading).toHaveBeenCalledWith(
        'page_123',
        'Optimized H2 with SEO Keyphrase',
        0
      );
    });

    it('should apply H2 heading changes to specific index when provided', async () => {
      const request = {
        type: 'h2_heading',
        pageId: 'page_123',
        value: 'Second H2 Optimization',
        elementIndex: 1,
      };

      const result = await webflowInsertion.apply(request as any);

      expect(result.success).toBe(true);
      expect(result.data?.elementIndex).toBe(1);
      expect(mockDesignerApi.updateH2Heading).toHaveBeenCalledWith(
        'page_123',
        'Second H2 Optimization',
        1
      );
    });

    it('should handle H2 update failures gracefully', async () => {
      mockDesignerApi.updateH2Heading.mockResolvedValue(false);

      const request = {
        type: 'h2_heading',
        pageId: 'page_123',
        value: 'Failed H2 Update',
      };

      await expect(webflowInsertion.apply(request as any)).rejects.toThrow(
        'Designer API failed to update H2 heading'
      );
    });
  });

  describe.skip('Introduction Paragraph Apply Integration - DISABLED (issue #504)', () => {
    it('should successfully apply introduction paragraph changes', async () => {
      const request = {
        type: 'introduction',
        pageId: 'page_123',
        value: 'This optimized introduction paragraph includes the target keyphrase and provides compelling value for users while maintaining natural readability.',
      };

      const result = await webflowInsertion.apply(request as any);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        id: 'page_123',
        content: expect.stringContaining('optimized introduction paragraph'),
        type: 'introduction',
      });
      expect(mockDesignerApi.updateIntroductionParagraph).toHaveBeenCalledWith(
        'page_123',
        expect.stringContaining('optimized introduction paragraph')
      );
    });

    it('should handle introduction update failures gracefully', async () => {
      mockDesignerApi.updateIntroductionParagraph.mockResolvedValue(false);

      const request = {
        type: 'introduction',
        pageId: 'page_123',
        value: 'Failed Introduction Update',
      };

      await expect(webflowInsertion.apply(request as any)).rejects.toThrow(
        'Designer API failed to update introduction paragraph'
      );
    });

    it('should fail when Designer API is not available for introduction', async () => {
      // Simulate no Designer API available
      (webflowInsertion as any).useDesignerAPI = false;
      (webflowInsertion as any).designerApi = null;

      const request = {
        type: 'introduction',
        pageId: 'page_123',
        value: 'Introduction without Designer API',
      };

      await expect(webflowInsertion.apply(request as any)).rejects.toThrow(
        'Introduction paragraph updates require Designer Extension API'
      );
    });
  });

  describe.skip('Batch Apply Integration for Content Elements - DISABLED (issue #504)', () => {
    it('should successfully apply multiple content element changes in batch', async () => {
      const batchRequest = {
        operations: [
          {
            type: 'h1_heading',
            pageId: 'page_123',
            value: 'Optimized H1 Heading',
          },
          {
            type: 'h2_heading',
            pageId: 'page_123',
            value: 'Optimized H2 Heading',
            elementIndex: 0,
          },
          {
            type: 'introduction',
            pageId: 'page_123',
            value: 'Optimized introduction paragraph with keyphrase.',
          },
        ],
        rollbackEnabled: true,
      } as any;

      const result = await webflowInsertion.applyBatch(batchRequest);

      expect(result.success).toBe(true);
      expect(result.succeeded).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(3);

      // Verify all API calls were made
      expect(mockDesignerApi.updateH1Heading).toHaveBeenCalledWith(
        'page_123',
        'Optimized H1 Heading'
      );
      expect(mockDesignerApi.updateH2Heading).toHaveBeenCalledWith(
        'page_123',
        'Optimized H2 Heading',
        0
      );
      expect(mockDesignerApi.updateIntroductionParagraph).toHaveBeenCalledWith(
        'page_123',
        'Optimized introduction paragraph with keyphrase.'
      );
    });

    it('should handle mixed success/failure in batch operations', async () => {
      // Make H2 update fail
      mockDesignerApi.updateH2Heading.mockResolvedValue(false);

      const batchRequest = {
        operations: [
          {
            type: 'h1_heading',
            pageId: 'page_123',
            value: 'Successful H1',
          },
          {
            type: 'h2_heading',
            pageId: 'page_123',
            value: 'Failed H2',
          },
          {
            type: 'introduction',
            pageId: 'page_123',
            value: 'Successful Introduction',
          },
        ],
        rollbackEnabled: false,
      } as any;

      const result = await webflowInsertion.applyBatch(batchRequest);

      expect(result.success).toBe(false); // Overall failure due to one failed operation
      expect(result.succeeded).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.results).toHaveLength(3);

      // Check individual results
      expect(result.results[0].success).toBe(true); // H1 success
      expect(result.results[1].success).toBe(false); // H2 failure
      expect(result.results[2].success).toBe(true); // Introduction success
    });
  });

  describe('Content Element Type Validation', () => {
    it('should validate required fields for content element requests', async () => {
      const invalidRequest = {
        type: 'page_title', // Use a valid type instead of disabled h1_heading
        // Missing pageId and value
      } as any;

      await expect(webflowInsertion.apply(invalidRequest)).rejects.toThrow();
    });

    it('should handle unknown content element types', async () => {
      const invalidRequest = {
        type: 'unknown_element' as any,
        pageId: 'page_123',
        value: 'Some content',
      } as any;

      await expect(webflowInsertion.apply(invalidRequest)).rejects.toThrow(
        'Unknown insertion type: unknown_element'
      );
    });
  });

  describe('Permission and Context Validation', () => {
    it('should check permissions before applying content element changes', async () => {
      mockAuth.getToken.mockResolvedValue('read-only-token');

      const request = {
        type: 'page_title',
        pageId: 'page_123',
        value: 'Unauthorized Title Update',
      };

      await expect(webflowInsertion.apply(request as any)).rejects.toThrow(
        'Insufficient permissions'
      );
    });

    it('should fail gracefully when authentication is invalid', async () => {
      mockAuth.isAuthenticated.mockReturnValue(false);
      mockAuth.getToken.mockResolvedValue(null);

      const request = {
        type: 'page_title',
        pageId: 'page_123',
        value: 'Unauthenticated Title Update',
      };

      await expect(webflowInsertion.apply(request as any)).rejects.toThrow();
    });
  });
});