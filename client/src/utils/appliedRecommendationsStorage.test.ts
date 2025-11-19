/**
 * Tests for Applied Recommendations Storage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadAppliedRecommendationsForPage,
  saveAppliedRecommendation,
  isRecommendationApplied,
  getAppliedRecommendation,
  removeAppliedRecommendation,
  getAppliedRecommendationsStats,
  cleanupOldAppliedRecommendations,
  type AppliedRecommendation,
} from './appliedRecommendationsStorage';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock Webflow context
const mockWebflowContext = {
  webflow: {
    getSiteInfo: vi.fn(),
  },
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

Object.defineProperty(window, 'webflow', {
  value: mockWebflowContext.webflow,
  configurable: true,
});

describe('Applied Recommendations Storage', () => {
  const testPageId = 'page-123';
  const testCheckTitle = 'Keyphrase in H2 Headings';
  const testRecommendation = 'Optimized H2 Heading Text';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    mockWebflowContext.webflow.getSiteInfo.mockReturnValue({ siteId: 'default-site' });
  });

  describe('loadAppliedRecommendationsForPage', () => {
    it('should return empty array when no data exists', () => {
      const result = loadAppliedRecommendationsForPage(testPageId);
      expect(result).toEqual([]);
    });

    it('should return recommendations for specific page', () => {
      const mockData = {
        'default-site': {
          [testPageId]: [
            {
              checkTitle: testCheckTitle,
              appliedAt: Date.now(),
              recommendation: testRecommendation,
              pageId: testPageId,
            },
          ],
        },
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));

      const result = loadAppliedRecommendationsForPage(testPageId);
      expect(result).toHaveLength(1);
      expect(result[0].checkTitle).toBe(testCheckTitle);
    });

    it('should handle localStorage parse errors gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');
      
      const result = loadAppliedRecommendationsForPage(testPageId);
      expect(result).toEqual([]);
    });
  });

  describe('saveAppliedRecommendation', () => {
    it('should save a new applied recommendation', () => {
      saveAppliedRecommendation(testPageId, testCheckTitle, testRecommendation, {
        elementType: 'h2',
        elementIndex: 0,
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'webflow-seo-applied-recommendations',
        expect.stringContaining(testCheckTitle)
      );
    });

    it('should replace existing recommendation for same check', () => {
      const existingData = {
        'default-site': {
          [testPageId]: [
            {
              checkTitle: testCheckTitle,
              appliedAt: 1000,
              recommendation: 'Old recommendation',
              pageId: testPageId,
            },
          ],
        },
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingData));

      saveAppliedRecommendation(testPageId, testCheckTitle, 'New recommendation');

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const savedData = JSON.parse(setItemCall[1]);
      const pageRecommendations = savedData['default-site'][testPageId];
      
      expect(pageRecommendations).toHaveLength(1);
      expect(pageRecommendations[0].recommendation).toBe('New recommendation');
    });

    it('should handle localStorage save errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      expect(() => {
        saveAppliedRecommendation(testPageId, testCheckTitle, testRecommendation);
      }).not.toThrow();
    });
  });

  describe('isRecommendationApplied', () => {
    it('should return false when no recommendations exist', () => {
      const result = isRecommendationApplied(testPageId, testCheckTitle);
      expect(result).toBe(false);
    });

    it('should return true when recommendation exists', () => {
      const mockData = {
        'default-site': {
          [testPageId]: [
            {
              checkTitle: testCheckTitle,
              appliedAt: Date.now(),
              recommendation: testRecommendation,
              pageId: testPageId,
            },
          ],
        },
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));

      const result = isRecommendationApplied(testPageId, testCheckTitle);
      expect(result).toBe(true);
    });
  });

  describe('getAppliedRecommendation', () => {
    it('should return null when recommendation not found', () => {
      const result = getAppliedRecommendation(testPageId, testCheckTitle);
      expect(result).toBeNull();
    });

    it('should return recommendation details when found', () => {
      const mockRecommendation: AppliedRecommendation = {
        checkTitle: testCheckTitle,
        appliedAt: 1234567890,
        recommendation: testRecommendation,
        pageId: testPageId,
        elementType: 'h2',
        elementIndex: 1,
      };

      const mockData = {
        'default-site': {
          [testPageId]: [mockRecommendation],
        },
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));

      const result = getAppliedRecommendation(testPageId, testCheckTitle);
      expect(result).toEqual(mockRecommendation);
    });
  });

  describe('removeAppliedRecommendation', () => {
    it('should remove specific recommendation', () => {
      const mockData = {
        'default-site': {
          [testPageId]: [
            {
              checkTitle: testCheckTitle,
              appliedAt: Date.now(),
              recommendation: testRecommendation,
              pageId: testPageId,
            },
            {
              checkTitle: 'Other Check',
              appliedAt: Date.now(),
              recommendation: 'Other recommendation',
              pageId: testPageId,
            },
          ],
        },
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));

      removeAppliedRecommendation(testPageId, testCheckTitle);

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const savedData = JSON.parse(setItemCall[1]);
      const pageRecommendations = savedData['default-site'][testPageId];
      
      expect(pageRecommendations).toHaveLength(1);
      expect(pageRecommendations[0].checkTitle).toBe('Other Check');
    });

    it('should clean up empty page data', () => {
      const mockData = {
        'default-site': {
          [testPageId]: [
            {
              checkTitle: testCheckTitle,
              appliedAt: Date.now(),
              recommendation: testRecommendation,
              pageId: testPageId,
            },
          ],
        },
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));

      removeAppliedRecommendation(testPageId, testCheckTitle);

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const savedData = JSON.parse(setItemCall[1]);
      
      expect(savedData['default-site']).toBeUndefined();
    });
  });

  describe('getAppliedRecommendationsStats', () => {
    it('should return correct statistics', () => {
      const now = Date.now();
      const mockData = {
        'default-site': {
          [testPageId]: [
            {
              checkTitle: 'H2 Check',
              appliedAt: now - 1000,
              recommendation: 'H2 rec',
              pageId: testPageId,
              elementType: 'h2' as const,
            },
            {
              checkTitle: 'Title Check',
              appliedAt: now - 2000,
              recommendation: 'Title rec',
              pageId: testPageId,
              elementType: 'title' as const,
            },
            {
              checkTitle: 'Another H2',
              appliedAt: now - 3000,
              recommendation: 'Another H2 rec',
              pageId: testPageId,
              elementType: 'h2' as const,
            },
          ],
        },
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));

      const stats = getAppliedRecommendationsStats(testPageId);
      
      expect(stats.total).toBe(3);
      expect(stats.byType.h2).toBe(2);
      expect(stats.byType.title).toBe(1);
      expect(stats.recent).toHaveLength(3);
      expect(stats.recent[0].checkTitle).toBe('H2 Check'); // Most recent
    });
  });

  describe('cleanupOldAppliedRecommendations', () => {
    it('should remove old recommendations', () => {
      const now = Date.now();
      const oldTime = now - (40 * 24 * 60 * 60 * 1000); // 40 days ago
      const recentTime = now - (10 * 24 * 60 * 60 * 1000); // 10 days ago

      const mockData = {
        'default-site': {
          [testPageId]: [
            {
              checkTitle: 'Old Check',
              appliedAt: oldTime,
              recommendation: 'Old rec',
              pageId: testPageId,
            },
            {
              checkTitle: 'Recent Check',
              appliedAt: recentTime,
              recommendation: 'Recent rec',
              pageId: testPageId,
            },
          ],
        },
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData));

      cleanupOldAppliedRecommendations(30); // 30 days cutoff

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const savedData = JSON.parse(setItemCall[1]);
      const pageRecommendations = savedData['default-site'][testPageId];
      
      expect(pageRecommendations).toHaveLength(1);
      expect(pageRecommendations[0].checkTitle).toBe('Recent Check');
    });
  });

  describe('Site ID handling', () => {
    it('should use default site ID when webflow context unavailable', () => {
      // Mock webflow context returning undefined
      mockWebflowContext.webflow.getSiteInfo.mockReturnValue(undefined);

      saveAppliedRecommendation(testPageId, testCheckTitle, testRecommendation);

      const setItemCall = localStorageMock.setItem.mock.calls[0];
      const savedData = JSON.parse(setItemCall[1]);
      
      expect(savedData['default-site']).toBeDefined();
      expect(savedData['default-site'][testPageId]).toBeDefined();
    });
  });
});