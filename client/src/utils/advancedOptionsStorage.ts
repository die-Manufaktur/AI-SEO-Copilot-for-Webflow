/**
 * Utility for persisting advanced options per Webflow page
 */

const STORAGE_KEY = 'webflow-seo-advanced-options';

export interface AdvancedOptions {
  pageType: string;
  additionalContext: string;
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
    
    if (options.pageType.trim() || options.additionalContext.trim()) {
      pageOptions[pageId] = {
        pageType: options.pageType.trim(),
        additionalContext: options.additionalContext.trim()
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
    if (!stored) return { pageType: '', additionalContext: '' };
    
    const pageOptions: PageAdvancedOptions = JSON.parse(stored);
    return pageOptions[pageId] || { pageType: '', additionalContext: '' };
  } catch (error) {
    console.warn('Failed to load advanced options from localStorage:', error);
    return { pageType: '', additionalContext: '' };
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