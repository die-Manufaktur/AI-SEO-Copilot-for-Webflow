/**
 * Utility for persisting advanced options per Webflow page
 */

import { sanitizeText } from '../../../shared/utils/stringUtils';

const STORAGE_KEY = 'webflow-seo-advanced-options';

// Sanitize secondary keywords for safe storage
function sanitizeSecondaryKeywords(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return sanitizeText(input)
    .replace(/<[^>]*>/g, '') // Remove any HTML tags
    .substring(0, 500) // Limit length
    .trim();
}

export interface AdvancedOptions {
  pageType: string;
  secondaryKeywords?: string; // Renamed from additionalContext for clarity  
  additionalContext?: string; // Deprecated: kept for backward compatibility
}

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
    
    const sanitizedPageType = options.pageType.trim();
    // Support both new and old property names for backward compatibility
    const contextToSanitize = options.secondaryKeywords || options.additionalContext || '';
    const sanitizedContext = sanitizeSecondaryKeywords(contextToSanitize);
    
    if (sanitizedPageType || sanitizedContext) {
      pageOptions[pageId] = {
        pageType: sanitizedPageType,
        secondaryKeywords: sanitizedContext,
        additionalContext: sanitizedContext // Keep for backward compatibility
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
    if (!stored) return { pageType: '', secondaryKeywords: '', additionalContext: '' };
    
    const pageOptions: PageAdvancedOptions = JSON.parse(stored);
    const options = pageOptions[pageId];
    
    if (!options) {
      return { pageType: '', secondaryKeywords: '', additionalContext: '' };
    }
    
    // Handle backward compatibility: if only additionalContext exists, use it for secondaryKeywords
    const secondaryKeywords = options.secondaryKeywords || options.additionalContext || '';
    
    return {
      pageType: options.pageType || '',
      secondaryKeywords,
      additionalContext: secondaryKeywords // Keep for backward compatibility
    };
  } catch (error) {
    console.warn('Failed to load advanced options from localStorage:', error);
    return { pageType: '', secondaryKeywords: '', additionalContext: '' };
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