/**
 * Test for H2 Application Index Targeting Fix
 * 
 * This test ensures that H2 heading changes are applied to the correct
 * element based on the elementIndex in the request, not always the first one.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebflowInsertion } from './webflowInsertion';
import { WebflowDataAPI } from './webflowDataApi';
import type { WebflowInsertionRequest, WebflowOAuthToken } from '../types/webflow-data-api';

// Mock WebflowDataAPI
vi.mock('./webflowDataApi');

// Mock the WebflowDesignerAPI
const mockUpdateH2Heading = vi.fn();
const mockDesignerApi = {
  updateH2Heading: mockUpdateH2Heading,
  isReady: vi.fn().mockResolvedValue(true),
  waitForReady: vi.fn().mockResolvedValue(true),
} as any;

describe('WebflowInsertion - H2 Apply Index Targeting', () => {
  let webflowInsertion: WebflowInsertion;
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

    // Create a mock DataAPI instance with all required methods
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

    // Mock the WebflowDataAPI constructor
    vi.mocked(WebflowDataAPI).mockImplementation(() => mockDataApi);
    
    webflowInsertion = new WebflowInsertion(mockDataApi);
    
    // Manually set the designer API for testing
    (webflowInsertion as any).designerApi = mockDesignerApi;
    (webflowInsertion as any).useDesignerAPI = true;
  });

  it('should pass elementIndex to updateH2Heading when applying H2 changes', async () => {
    // Arrange: Mock successful H2 update
    mockUpdateH2Heading.mockResolvedValue(true);

    const request: WebflowInsertionRequest = {
      type: 'h2_heading',
      pageId: 'test-page-123',
      value: 'Updated H2 Content',
      elementIndex: 2, // Target the third H2 (index 2)
    };

    // Act: Apply the H2 heading change
    const result = await webflowInsertion.apply(request);

    // Assert: Verify the updateH2Heading was called with the correct index
    expect(mockUpdateH2Heading).toHaveBeenCalledWith(
      'test-page-123',
      'Updated H2 Content',
      2 // This is the critical assertion - index should be passed through
    );
    expect(result.success).toBe(true);
  });

  it('should default to index 0 when no elementIndex is provided', async () => {
    // Arrange: Mock successful H2 update
    mockUpdateH2Heading.mockResolvedValue(true);

    const request: WebflowInsertionRequest = {
      type: 'h2_heading',
      pageId: 'test-page-123',
      value: 'Updated H2 Content',
      // No elementIndex provided
    };

    // Act: Apply the H2 heading change
    const result = await webflowInsertion.apply(request);

    // Assert: Should default to index 0
    expect(mockUpdateH2Heading).toHaveBeenCalledWith(
      'test-page-123',
      'Updated H2 Content',
      0 // Default to first H2
    );
    expect(result.success).toBe(true);
  });

  it('should handle different H2 indices correctly', async () => {
    // Arrange: Mock successful H2 update
    mockUpdateH2Heading.mockResolvedValue(true);

    const testCases = [
      { elementIndex: 0, description: 'first H2' },
      { elementIndex: 1, description: 'second H2' },
      { elementIndex: 3, description: 'fourth H2' },
    ];

    for (const testCase of testCases) {
      // Reset mocks for each iteration
      mockUpdateH2Heading.mockClear();

      const request: WebflowInsertionRequest = {
        type: 'h2_heading',
        pageId: 'test-page-123',
        value: `Content for ${testCase.description}`,
        elementIndex: testCase.elementIndex,
      };

      // Act: Apply the H2 heading change
      const result = await webflowInsertion.apply(request);

      // Assert: Verify correct index is passed
      expect(mockUpdateH2Heading).toHaveBeenCalledWith(
        'test-page-123',
        `Content for ${testCase.description}`,
        testCase.elementIndex
      );
      expect(result.success).toBe(true);
    }
  });

  it('should handle invalid elementIndex gracefully', async () => {
    // Arrange: Mock updateH2Heading to throw error for invalid index
    mockUpdateH2Heading.mockRejectedValue(new Error('H2 element at index 999 not found'));

    const request: WebflowInsertionRequest = {
      type: 'h2_heading',
      pageId: 'test-page-123',
      value: 'Updated H2 Content',
      elementIndex: 999, // Invalid high index
    };

    // Act: Apply with invalid index
    const result = await webflowInsertion.apply(request);

    // Assert: Verify the index was passed correctly (that's what we're testing)
    expect(mockUpdateH2Heading).toHaveBeenCalledWith(
      'test-page-123',
      'Updated H2 Content',
      999
    );
    expect(result.success).toBe(false);
  });
});