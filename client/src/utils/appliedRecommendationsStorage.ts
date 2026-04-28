/**
 * Applied Recommendations Storage
 * Tracks which SEO recommendations have been applied by users
 * Provides page-specific persistence for applied state
 */

export interface AppliedRecommendation {
  checkTitle: string;
  appliedAt: number;
  recommendation: string;
  pageId: string;
  elementType?: 'h1' | 'h2' | 'title' | 'meta_description' | 'custom_code';
  elementIndex?: number; // For H2s, which H2 was targeted
  elementId?: string; // Element ID if available
}

interface PageAppliedRecommendations {
  [pageId: string]: AppliedRecommendation[];
}

interface SiteAppliedRecommendations {
  [siteId: string]: PageAppliedRecommendations;
}

const STORAGE_KEY = 'webflow-seo-applied-recommendations';

/**
 * Get current site ID from window context (Webflow Designer)
 */
function getCurrentSiteId(): string {
  // Fallback for development/testing - always use default for now
  // In real Webflow context, this would be populated by the extension
  return 'default-site';
}

/**
 * Load all applied recommendations from localStorage
 */
function loadAllAppliedRecommendations(): SiteAppliedRecommendations {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    // Silently return empty object if localStorage fails
    return {};
  }
}

/**
 * Save all applied recommendations to localStorage
 */
function saveAllAppliedRecommendations(data: SiteAppliedRecommendations): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    // Silently fail if localStorage save fails
  }
}

/**
 * Load applied recommendations for a specific page
 */
export function loadAppliedRecommendationsForPage(pageId: string): AppliedRecommendation[] {
  const siteId = getCurrentSiteId();
  const allData = loadAllAppliedRecommendations();
  
  return allData[siteId]?.[pageId] || [];
}

/**
 * Save an applied recommendation for a specific page
 */
export function saveAppliedRecommendation(
  pageId: string,
  checkTitle: string,
  recommendation: string,
  options?: {
    elementType?: AppliedRecommendation['elementType'];
    elementIndex?: number;
    elementId?: string;
  }
): void {
  const siteId = getCurrentSiteId();
  const allData = loadAllAppliedRecommendations();
  
  // Initialize site and page data if needed
  if (!allData[siteId]) {
    allData[siteId] = {};
  }
  if (!allData[siteId][pageId]) {
    allData[siteId][pageId] = [];
  }
  
  const pageRecommendations = allData[siteId][pageId];
  
  // Remove any existing recommendation for the same check
  const existingIndex = pageRecommendations.findIndex(
    rec => rec.checkTitle === checkTitle
  );
  
  if (existingIndex >= 0) {
    pageRecommendations.splice(existingIndex, 1);
  }
  
  // Add the new applied recommendation
  const appliedRecommendation: AppliedRecommendation = {
    checkTitle,
    appliedAt: Date.now(),
    recommendation,
    pageId,
    ...options,
  };
  
  pageRecommendations.push(appliedRecommendation);
  
  // Save back to localStorage
  saveAllAppliedRecommendations(allData);
}

/**
 * Check if a specific recommendation has been applied
 */
export function isRecommendationApplied(pageId: string, checkTitle: string): boolean {
  const appliedRecommendations = loadAppliedRecommendationsForPage(pageId);
  return appliedRecommendations.some(rec => rec.checkTitle === checkTitle);
}

/**
 * Get applied recommendation details for a specific check
 */
export function getAppliedRecommendation(
  pageId: string, 
  checkTitle: string
): AppliedRecommendation | null {
  const appliedRecommendations = loadAppliedRecommendationsForPage(pageId);
  return appliedRecommendations.find(rec => rec.checkTitle === checkTitle) || null;
}

/**
 * Remove an applied recommendation (if user wants to "undo")
 */
export function removeAppliedRecommendation(pageId: string, checkTitle: string): void {
  const siteId = getCurrentSiteId();
  const allData = loadAllAppliedRecommendations();
  
  if (!allData[siteId]?.[pageId]) {
    return;
  }
  
  const pageRecommendations = allData[siteId][pageId];
  const filteredRecommendations = pageRecommendations.filter(
    rec => rec.checkTitle !== checkTitle
  );
  
  allData[siteId][pageId] = filteredRecommendations;
  
  // Clean up empty pages/sites
  if (filteredRecommendations.length === 0) {
    delete allData[siteId][pageId];
    
    if (Object.keys(allData[siteId]).length === 0) {
      delete allData[siteId];
    }
  }
  
  saveAllAppliedRecommendations(allData);
}

/**
 * Get statistics about applied recommendations for a page
 */
export function getAppliedRecommendationsStats(pageId: string): {
  total: number;
  byType: Record<string, number>;
  recent: AppliedRecommendation[];
} {
  const appliedRecommendations = loadAppliedRecommendationsForPage(pageId);
  
  const byType: Record<string, number> = {};
  appliedRecommendations.forEach(rec => {
    const type = rec.elementType || 'other';
    byType[type] = (byType[type] || 0) + 1;
  });
  
  const recent = appliedRecommendations
    .sort((a, b) => b.appliedAt - a.appliedAt)
    .slice(0, 5);
  
  return {
    total: appliedRecommendations.length,
    byType,
    recent,
  };
}

/**
 * Clean up old applied recommendations (older than specified days)
 */
export function cleanupOldAppliedRecommendations(olderThanDays: number = 30): void {
  const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
  const allData = loadAllAppliedRecommendations();
  
  let hasChanges = false;
  
  Object.keys(allData).forEach(siteId => {
    Object.keys(allData[siteId]).forEach(pageId => {
      const recommendations = allData[siteId][pageId];
      const filteredRecommendations = recommendations.filter(
        rec => rec.appliedAt > cutoffTime
      );
      
      if (filteredRecommendations.length !== recommendations.length) {
        allData[siteId][pageId] = filteredRecommendations;
        hasChanges = true;
        
        // Clean up empty pages
        if (filteredRecommendations.length === 0) {
          delete allData[siteId][pageId];
        }
      }
    });
    
    // Clean up empty sites
    if (Object.keys(allData[siteId]).length === 0) {
      delete allData[siteId];
      hasChanges = true;
    }
  });
  
  if (hasChanges) {
    saveAllAppliedRecommendations(allData);
  }
}