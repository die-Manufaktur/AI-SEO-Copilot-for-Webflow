/**
 * Tests for useAppliedRecommendations hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppliedRecommendations } from './useAppliedRecommendations';
import * as appliedRecommendationsStorage from '../utils/appliedRecommendationsStorage';

// Mock the applied recommendations storage
vi.mock('../utils/appliedRecommendationsStorage', () => ({
  loadAppliedRecommendationsForPage: vi.fn(),
  saveAppliedRecommendation: vi.fn(),
  isRecommendationApplied: vi.fn(),
  getAppliedRecommendation: vi.fn(),
  removeAppliedRecommendation: vi.fn(),
}));

const mockStorage = appliedRecommendationsStorage as any;

describe('useAppliedRecommendations', () => {
  const testPageId = 'page-123';
  const testCheckTitle = 'Keyphrase in H2 Headings';
  const testRecommendation = 'Optimized H2 Heading Text';

  const mockAppliedRecommendation = {
    checkTitle: testCheckTitle,
    appliedAt: Date.now(),
    recommendation: testRecommendation,
    pageId: testPageId,
    elementType: 'h2' as const,
    elementIndex: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage.loadAppliedRecommendationsForPage.mockReturnValue([]);
    mockStorage.isRecommendationApplied.mockReturnValue(false);
    mockStorage.getAppliedRecommendation.mockReturnValue(null);
  });

  describe('initialization', () => {
    it('should initialize with empty state when no pageId provided', () => {
      const { result } = renderHook(() => useAppliedRecommendations());

      expect(result.current.appliedRecommendations).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(mockStorage.loadAppliedRecommendationsForPage).not.toHaveBeenCalled();
    });

    it('should auto-load applied recommendations when pageId provided', () => {
      mockStorage.loadAppliedRecommendationsForPage.mockReturnValue([mockAppliedRecommendation]);

      const { result } = renderHook(() => 
        useAppliedRecommendations({ pageId: testPageId })
      );

      expect(result.current.appliedRecommendations).toEqual([mockAppliedRecommendation]);
      expect(mockStorage.loadAppliedRecommendationsForPage).toHaveBeenCalledWith(testPageId);
    });

    it('should not auto-load when autoLoad is false', () => {
      const { result } = renderHook(() => 
        useAppliedRecommendations({ pageId: testPageId, autoLoad: false })
      );

      expect(result.current.appliedRecommendations).toEqual([]);
      expect(mockStorage.loadAppliedRecommendationsForPage).not.toHaveBeenCalled();
    });
  });

  describe('isApplied', () => {
    it('should return false when no pageId', () => {
      const { result } = renderHook(() => useAppliedRecommendations());

      expect(result.current.isApplied(testCheckTitle)).toBe(false);
      expect(mockStorage.isRecommendationApplied).not.toHaveBeenCalled();
    });

    it('should check if recommendation is applied', () => {
      mockStorage.isRecommendationApplied.mockReturnValue(true);

      const { result } = renderHook(() => 
        useAppliedRecommendations({ pageId: testPageId })
      );

      expect(result.current.isApplied(testCheckTitle)).toBe(true);
      expect(mockStorage.isRecommendationApplied).toHaveBeenCalledWith(testPageId, testCheckTitle);
    });
  });

  describe('getApplied', () => {
    it('should return null when no pageId', () => {
      const { result } = renderHook(() => useAppliedRecommendations());

      expect(result.current.getApplied(testCheckTitle)).toBeNull();
      expect(mockStorage.getAppliedRecommendation).not.toHaveBeenCalled();
    });

    it('should get applied recommendation details', () => {
      mockStorage.getAppliedRecommendation.mockReturnValue(mockAppliedRecommendation);

      const { result } = renderHook(() => 
        useAppliedRecommendations({ pageId: testPageId })
      );

      expect(result.current.getApplied(testCheckTitle)).toEqual(mockAppliedRecommendation);
      expect(mockStorage.getAppliedRecommendation).toHaveBeenCalledWith(testPageId, testCheckTitle);
    });
  });

  describe('markAsApplied', () => {
    it('should not save when no pageId', () => {
      const { result } = renderHook(() => useAppliedRecommendations());

      act(() => {
        result.current.markAsApplied(testCheckTitle, testRecommendation);
      });

      expect(mockStorage.saveAppliedRecommendation).not.toHaveBeenCalled();
    });

    it('should save applied recommendation and refresh state', () => {
      const { result } = renderHook(() => 
        useAppliedRecommendations({ pageId: testPageId })
      );

      const options = { elementType: 'h2' as const, elementIndex: 1 };

      act(() => {
        result.current.markAsApplied(testCheckTitle, testRecommendation, options);
      });

      expect(mockStorage.saveAppliedRecommendation).toHaveBeenCalledWith(
        testPageId,
        testCheckTitle,
        testRecommendation,
        options
      );
      expect(mockStorage.loadAppliedRecommendationsForPage).toHaveBeenCalledWith(testPageId);
    });
  });

  describe('removeApplied', () => {
    it('should not remove when no pageId', () => {
      const { result } = renderHook(() => useAppliedRecommendations());

      act(() => {
        result.current.removeApplied(testCheckTitle);
      });

      expect(mockStorage.removeAppliedRecommendation).not.toHaveBeenCalled();
    });

    it('should remove applied recommendation and refresh state', () => {
      const { result } = renderHook(() => 
        useAppliedRecommendations({ pageId: testPageId })
      );

      act(() => {
        result.current.removeApplied(testCheckTitle);
      });

      expect(mockStorage.removeAppliedRecommendation).toHaveBeenCalledWith(testPageId, testCheckTitle);
      expect(mockStorage.loadAppliedRecommendationsForPage).toHaveBeenCalledWith(testPageId);
    });
  });

  describe('refreshAppliedRecommendations', () => {
    it('should reload applied recommendations from storage', () => {
      const { result } = renderHook(() => 
        useAppliedRecommendations({ pageId: testPageId })
      );

      vi.clearAllMocks();

      act(() => {
        result.current.refreshAppliedRecommendations();
      });

      expect(mockStorage.loadAppliedRecommendationsForPage).toHaveBeenCalledWith(testPageId);
    });
  });

  describe('clearAllApplied', () => {
    it('should not clear when no pageId', () => {
      const { result } = renderHook(() => useAppliedRecommendations());

      act(() => {
        result.current.clearAllApplied();
      });

      expect(mockStorage.removeAppliedRecommendation).not.toHaveBeenCalled();
    });

    it('should remove all applied recommendations for the page', () => {
      mockStorage.loadAppliedRecommendationsForPage.mockReturnValue([
        mockAppliedRecommendation,
        { ...mockAppliedRecommendation, checkTitle: 'Another Check' },
      ]);

      const { result } = renderHook(() => 
        useAppliedRecommendations({ pageId: testPageId })
      );

      act(() => {
        result.current.clearAllApplied();
      });

      expect(mockStorage.removeAppliedRecommendation).toHaveBeenCalledWith(testPageId, testCheckTitle);
      expect(mockStorage.removeAppliedRecommendation).toHaveBeenCalledWith(testPageId, 'Another Check');
    });
  });

  describe('loading state', () => {
    it('should set loading state during data load', () => {
      const { result } = renderHook(() => 
        useAppliedRecommendations({ pageId: testPageId })
      );

      // The loading should complete synchronously since we're using localStorage
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('pageId changes', () => {
    it('should reload data when pageId changes', () => {
      const { result, rerender } = renderHook(
        ({ pageId }) => useAppliedRecommendations({ pageId }),
        { initialProps: { pageId: testPageId } }
      );

      vi.clearAllMocks();

      rerender({ pageId: 'new-page-id' });

      expect(mockStorage.loadAppliedRecommendationsForPage).toHaveBeenCalledWith('new-page-id');
    });

    it('should clear data when pageId becomes undefined', () => {
      const { result, rerender } = renderHook(
        ({ pageId }) => useAppliedRecommendations({ pageId }),
        { initialProps: { pageId: testPageId } }
      );

      rerender({ pageId: undefined as any });

      expect(result.current.appliedRecommendations).toEqual([]);
    });
  });
});