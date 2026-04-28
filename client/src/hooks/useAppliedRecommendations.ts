/**
 * Hook for managing applied recommendations state
 * Provides utilities for tracking which recommendations have been applied
 */

import { useState, useCallback, useEffect } from 'react';
import {
  loadAppliedRecommendationsForPage,
  saveAppliedRecommendation,
  isRecommendationApplied,
  getAppliedRecommendation,
  removeAppliedRecommendation,
  type AppliedRecommendation,
} from '../utils/appliedRecommendationsStorage';

export interface UseAppliedRecommendationsOptions {
  pageId?: string;
  autoLoad?: boolean;
}

export interface UseAppliedRecommendationsReturn {
  appliedRecommendations: AppliedRecommendation[];
  isLoading: boolean;
  
  // Check functions
  isApplied: (checkTitle: string) => boolean;
  getApplied: (checkTitle: string) => AppliedRecommendation | null;
  
  // Mutation functions
  markAsApplied: (
    checkTitle: string,
    recommendation: string,
    options?: {
      elementType?: AppliedRecommendation['elementType'];
      elementIndex?: number;
      elementId?: string;
    }
  ) => void;
  removeApplied: (checkTitle: string) => void;
  
  // Utility functions
  refreshAppliedRecommendations: () => void;
  clearAllApplied: () => void;
}

/**
 * Hook for managing applied recommendations state
 */
export function useAppliedRecommendations(
  options: UseAppliedRecommendationsOptions = {}
): UseAppliedRecommendationsReturn {
  const { pageId, autoLoad = true } = options;
  
  const [appliedRecommendations, setAppliedRecommendations] = useState<AppliedRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load applied recommendations for the current page
  const loadAppliedRecommendations = useCallback(() => {
    if (!pageId) {
      setAppliedRecommendations([]);
      return;
    }

    setIsLoading(true);
    try {
      const recommendations = loadAppliedRecommendationsForPage(pageId);
      setAppliedRecommendations(recommendations);
    } finally {
      setIsLoading(false);
    }
  }, [pageId]);

  // Auto-load on mount and when pageId changes
  useEffect(() => {
    if (autoLoad) {
      loadAppliedRecommendations();
    }
  }, [autoLoad, loadAppliedRecommendations]);

  // Check if a recommendation is applied
  const isApplied = useCallback((checkTitle: string): boolean => {
    if (!pageId) return false;
    return isRecommendationApplied(pageId, checkTitle);
  }, [pageId]);

  // Get applied recommendation details
  const getApplied = useCallback((checkTitle: string): AppliedRecommendation | null => {
    if (!pageId) return null;
    return getAppliedRecommendation(pageId, checkTitle);
  }, [pageId]);

  // Mark a recommendation as applied
  const markAsApplied = useCallback((
    checkTitle: string,
    recommendation: string,
    options?: {
      elementType?: AppliedRecommendation['elementType'];
      elementIndex?: number;
      elementId?: string;
    }
  ) => {
    if (!pageId) return;

    saveAppliedRecommendation(pageId, checkTitle, recommendation, options);
    
    // Refresh the local state
    loadAppliedRecommendations();
  }, [pageId, loadAppliedRecommendations]);

  // Remove an applied recommendation
  const removeApplied = useCallback((checkTitle: string) => {
    if (!pageId) return;

    removeAppliedRecommendation(pageId, checkTitle);
    
    // Refresh the local state
    loadAppliedRecommendations();
  }, [pageId, loadAppliedRecommendations]);

  // Refresh applied recommendations from storage
  const refreshAppliedRecommendations = useCallback(() => {
    loadAppliedRecommendations();
  }, [loadAppliedRecommendations]);

  // Clear all applied recommendations for the current page
  const clearAllApplied = useCallback(() => {
    if (!pageId) return;

    appliedRecommendations.forEach(rec => {
      removeAppliedRecommendation(pageId, rec.checkTitle);
    });
    
    // Refresh the local state
    loadAppliedRecommendations();
  }, [pageId, appliedRecommendations, loadAppliedRecommendations]);

  return {
    appliedRecommendations,
    isLoading,
    isApplied,
    getApplied,
    markAsApplied,
    removeApplied,
    refreshAppliedRecommendations,
    clearAllApplied,
  };
}