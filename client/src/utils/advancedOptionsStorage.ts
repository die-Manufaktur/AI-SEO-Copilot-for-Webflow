/**
 * Utility for persisting advanced options per Webflow page
 */

import { sanitizeKeywords } from '../../../shared/utils/stringUtils';
import { AdvancedOptions } from '../../../shared/types/index';

// Re-export for local usage
export type { AdvancedOptions };

const STORAGE_KEY = 'webflow-seo-advanced-options';

// Client-specific storage interface
interface PageAdvancedOptions {
  [pageId: string]: AdvancedOptions;
}

/**
 * Save advanced options for a specific page
 */
export function saveAdvancedOptionsForPage(pageId: string, options: AdvancedOptions): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const pageOptions: PageAdvancedOptions = stored ? JSON.parse(stored) : {};
    
    const sanitizedPageType = options.pageType?.trim() || '';
    const sanitizedContext = sanitizeKeywords(options.secondaryKeywords || '');
    
    if (sanitizedPageType || sanitizedContext) {
      pageOptions[pageId] = {
        pageType: sanitizedPageType,
        secondaryKeywords: sanitizedContext
      };
    } else {
      // Remove entry if both fields are empty
      delete pageOptions[pageId];
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pageOptions));
  } catch (error) {
    console.warn('Failed to save advanced options to localStorage:', error);
  }
}

/**
 * Load advanced options for a specific page
 */
export function loadAdvancedOptionsForPage(pageId: string): AdvancedOptions {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { pageType: '', secondaryKeywords: '' };
    
    const pageOptions: PageAdvancedOptions = JSON.parse(stored);
    const options = pageOptions[pageId];
    
    if (!options) {
      return { pageType: '', secondaryKeywords: '' };
    }
    
    return {
      pageType: options.pageType || '',
      secondaryKeywords: options.secondaryKeywords || ''
    };
  } catch (error) {
    console.warn('Failed to load advanced options from localStorage:', error);
    return { pageType: '', secondaryKeywords: '' };
  }
}

/**
 * Clear all stored advanced options
 */
export function clearAllAdvancedOptions(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear advanced options from localStorage:', error);
  }
}

/**
 * Get all stored page advanced options (for debugging/admin purposes)
 */
export function getAllStoredAdvancedOptions(): PageAdvancedOptions {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn('Failed to get all advanced options from localStorage:', error);
    return {};
  }
}