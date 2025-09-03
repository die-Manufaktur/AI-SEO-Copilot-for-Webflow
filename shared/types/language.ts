/**
 * Language configuration for multilingual SEO suggestions
 * Supports AI-generated recommendations in multiple languages
 */

export interface Language {
  code: string;       // ISO language code: 'en', 'fr', 'de', etc.
  name: string;       // English name: 'English', 'French', 'German'
  nativeName: string; // Native name: 'English', 'Français', 'Deutsch'
  flag: string;       // Unicode flag emoji
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' }
];

export const DEFAULT_LANGUAGE_CODE = 'en';

/**
 * Get language by code
 */
export const getLanguageByCode = (code: string): Language | undefined => {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
};

/**
 * Get default language
 */
export const getDefaultLanguage = (): Language => {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === DEFAULT_LANGUAGE_CODE) || SUPPORTED_LANGUAGES[0];
};

/**
 * Check if language code is supported
 */
export const isLanguageSupported = (code: string): boolean => {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
};

/**
 * Get language codes as array
 */
export const getSupportedLanguageCodes = (): string[] => {
  return SUPPORTED_LANGUAGES.map(lang => lang.code);
};