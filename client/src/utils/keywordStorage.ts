/**
 * Utility for persisting keywords per Webflow page
 */
import { PageKeywords } from '../../../shared/types/index';

const STORAGE_KEY = 'webflow-seo-keywords';

/**
 * Generate a unique page identifier from Webflow page data
 * Now includes siteId to prevent cross-site data contamination
 */
export function generatePageId(publishPath: string | null, isHomepage: boolean, siteId?: string): string {
  const sitePrefix = siteId ? `${siteId}::` : '';
  
  if (isHomepage) {
    return `${sitePrefix}homepage`;
  }
  
  if (!publishPath) {
    return `${sitePrefix}unknown-page`;
  }
  
  // Clean the publish path to create a consistent ID
  const cleanPath = publishPath.replace(/^\/+|\/+$/g, '') || 'homepage';
  return `${sitePrefix}${cleanPath}`;
}

/**
 * Save keywords for a specific page
 */
export function saveKeywordsForPage(pageId: string, keywords: string): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const pageKeywords: PageKeywords = stored ? JSON.parse(stored) : {};
    
    if (keywords.trim()) {
      pageKeywords[pageId] = keywords.trim();
    } else {
      // Remove entry if keywords are empty
      delete pageKeywords[pageId];
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pageKeywords));
  } catch (error) {
    console.warn('Failed to save keywords to localStorage:', error);
  }
}

/**
 * Load keywords for a specific page
 */
export function loadKeywordsForPage(pageId: string): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return '';
    
    const pageKeywords: PageKeywords = JSON.parse(stored);
    return pageKeywords[pageId] || '';
  } catch (error) {
    console.warn('Failed to load keywords from localStorage:', error);
    return '';
  }
}

/**
 * Clear all stored keywords
 */
export function clearAllKeywords(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear keywords from localStorage:', error);
  }
}

/**
 * Get all stored page keywords (for debugging/admin purposes)
 */
export function getAllStoredKeywords(): PageKeywords {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn('Failed to get all keywords from localStorage:', error);
    return {};
  }
}