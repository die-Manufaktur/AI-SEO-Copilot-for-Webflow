/**
 * Utility for persisting language preferences per Webflow site
 */

import { 
  Language, 
  getDefaultLanguage, 
  getLanguageByCode, 
  isLanguageSupported,
  detectSiteLanguage 
} from '../../../shared/types/language';

const STORAGE_KEY = 'webflow-seo-language-preferences';

// Client-specific storage interface
interface SiteLanguagePreferences {
  [siteId: string]: string; // siteId -> languageCode
}

/**
 * Save language preference for a specific site
 */
export function saveLanguageForSite(siteId: string, languageCode: string): void {
  try {
    // Validate language code
    if (!isLanguageSupported(languageCode)) {
      console.warn(`Unsupported language code: ${languageCode}. Using default language.`);
      languageCode = getDefaultLanguage().code;
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    const siteLanguages: SiteLanguagePreferences = stored ? JSON.parse(stored) : {};
    
    siteLanguages[siteId] = languageCode;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(siteLanguages));
  } catch (error) {
    console.warn('Failed to save language preference to localStorage:', error);
  }
}

/**
 * Load language preference for a specific site
 */
export function loadLanguageForSite(siteId: string): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // No stored preferences, use detected site language as default
      return getDefaultLanguage();
    }
    
    const siteLanguages: SiteLanguagePreferences = JSON.parse(stored);
    const languageCode = siteLanguages[siteId];
    
    if (!languageCode) {
      // No preference for this site, use detected site language as default
      return getDefaultLanguage();
    }
    
    const language = getLanguageByCode(languageCode);
    return language || getDefaultLanguage();
  } catch (error) {
    console.warn('Failed to load language preference from localStorage:', error);
    return getDefaultLanguage();
  }
}

/**
 * Get language code for a specific site
 */
export function getLanguageCodeForSite(siteId: string): string {
  return loadLanguageForSite(siteId).code;
}

/**
 * Clear language preference for a specific site
 */
export function clearLanguageForSite(siteId: string): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    
    const siteLanguages: SiteLanguagePreferences = JSON.parse(stored);
    delete siteLanguages[siteId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(siteLanguages));
  } catch (error) {
    console.warn('Failed to clear language preference from localStorage:', error);
  }
}

/**
 * Clear all stored language preferences
 */
export function clearAllLanguagePreferences(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear language preferences from localStorage:', error);
  }
}

/**
 * Get all stored site language preferences (for debugging/admin purposes)
 */
export function getAllStoredLanguagePreferences(): SiteLanguagePreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn('Failed to get all language preferences from localStorage:', error);
    return {};
  }
}