import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  detectSiteLanguage, 
  getDefaultLanguage, 
  getLanguageByCode, 
  isLanguageSupported,
  getSupportedLanguageCodes,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE_CODE 
} from './language';

describe('Language Detection', () => {
  // Store original values to restore after tests
  const originalDocument = global.document;
  const originalNavigator = global.navigator;

  beforeEach(() => {
    // Reset document and navigator for each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original globals
    global.document = originalDocument;
    global.navigator = originalNavigator;
  });

  describe('detectSiteLanguage', () => {
    it('should detect language from document.documentElement.lang', () => {
      // Mock document with German language
      global.document = {
        documentElement: {
          lang: 'de-DE'
        }
      } as any;

      const result = detectSiteLanguage();
      expect(result).toBe('de');
    });

    it('should detect language from document.documentElement.lang with just language code', () => {
      // Mock document with French language
      global.document = {
        documentElement: {
          lang: 'fr'
        }
      } as any;

      const result = detectSiteLanguage();
      expect(result).toBe('fr');
    });

    it('should fall back to navigator.language when document.lang is not supported', () => {
      // Mock document with unsupported language and navigator with supported language
      global.document = {
        documentElement: {
          lang: 'zh-CN' // Chinese not in SUPPORTED_LANGUAGES
        }
      } as any;

      global.navigator = {
        language: 'es-ES' // Spanish is supported
      } as any;

      const result = detectSiteLanguage();
      expect(result).toBe('es');
    });

    it('should fall back to navigator.language when document.lang is empty', () => {
      // Mock document with empty lang and navigator with supported language
      global.document = {
        documentElement: {
          lang: ''
        }
      } as any;

      global.navigator = {
        language: 'ja-JP' // Japanese is supported
      } as any;

      const result = detectSiteLanguage();
      expect(result).toBe('ja');
    });

    it('should fall back to DEFAULT_LANGUAGE_CODE when both document and navigator are unsupported', () => {
      // Mock both with unsupported languages
      global.document = {
        documentElement: {
          lang: 'zh-CN' // Chinese not supported
        }
      } as any;

      global.navigator = {
        language: 'ko-KR' // Korean not supported
      } as any;

      const result = detectSiteLanguage();
      expect(result).toBe(DEFAULT_LANGUAGE_CODE);
    });

    it('should fall back to DEFAULT_LANGUAGE_CODE when document and navigator are undefined', () => {
      // Mock undefined globals
      global.document = undefined as any;
      global.navigator = undefined as any;

      const result = detectSiteLanguage();
      expect(result).toBe(DEFAULT_LANGUAGE_CODE);
    });

    it('should handle document without lang attribute', () => {
      // Mock document without lang attribute
      global.document = {
        documentElement: {}
      } as any;

      global.navigator = {
        language: 'pt-BR'
      } as any;

      const result = detectSiteLanguage();
      expect(result).toBe('pt');
    });
  });

  describe('getDefaultLanguage with site detection', () => {
    it('should return detected language instead of hardcoded default', () => {
      // Mock document with Spanish
      global.document = {
        documentElement: {
          lang: 'es-ES'
        }
      } as any;

      const result = getDefaultLanguage();
      expect(result.code).toBe('es');
      expect(result.nativeName).toBe('Español');
    });

    it('should return first supported language if detection fails', () => {
      // Mock with unsupported language
      global.document = {
        documentElement: {
          lang: 'xyz'
        }
      } as any;

      global.navigator = {
        language: 'abc'
      } as any;

      const result = getDefaultLanguage();
      expect(result).toBe(SUPPORTED_LANGUAGES[0]);
    });

    it('should handle missing globals gracefully', () => {
      global.document = undefined as any;
      global.navigator = undefined as any;

      const result = getDefaultLanguage();
      expect(result.code).toBe(DEFAULT_LANGUAGE_CODE);
    });
  });

  describe('language code extraction', () => {
    it('should extract base language code from locale codes', () => {
      global.document = {
        documentElement: {
          lang: 'it-IT'
        }
      } as any;

      const result = detectSiteLanguage();
      expect(result).toBe('it');
    });

    it('should handle complex locale codes', () => {
      global.navigator = {
        language: 'nl-BE-x-informal'
      } as any;

      global.document = {
        documentElement: {
          lang: ''
        }
      } as any;

      const result = detectSiteLanguage();
      expect(result).toBe('nl');
    });
  });

  describe('getLanguageByCode', () => {
    it('should return language object for valid codes', () => {
      const english = getLanguageByCode('en');
      expect(english).toBeDefined();
      expect(english?.code).toBe('en');
      expect(english?.name).toBe('English');
      expect(english?.nativeName).toBe('English');
      expect(english?.flag).toBe('🇺🇸');

      const french = getLanguageByCode('fr');
      expect(french).toBeDefined();
      expect(french?.code).toBe('fr');
      expect(french?.name).toBe('French');
      expect(french?.nativeName).toBe('Français');
      expect(french?.flag).toBe('🇫🇷');
    });

    it('should return undefined for invalid codes', () => {
      expect(getLanguageByCode('invalid')).toBeUndefined();
      expect(getLanguageByCode('')).toBeUndefined();
      expect(getLanguageByCode('xyz')).toBeUndefined();
    });

    it('should handle all supported languages', () => {
      SUPPORTED_LANGUAGES.forEach(lang => {
        const result = getLanguageByCode(lang.code);
        expect(result).toBeDefined();
        expect(result).toEqual(lang);
      });
    });
  });

  describe('isLanguageSupported', () => {
    it('should return true for all supported language codes', () => {
      expect(isLanguageSupported('en')).toBe(true);
      expect(isLanguageSupported('fr')).toBe(true);
      expect(isLanguageSupported('de')).toBe(true);
      expect(isLanguageSupported('es')).toBe(true);
      expect(isLanguageSupported('it')).toBe(true);
      expect(isLanguageSupported('ja')).toBe(true);
      expect(isLanguageSupported('pt')).toBe(true);
      expect(isLanguageSupported('nl')).toBe(true);
      expect(isLanguageSupported('pl')).toBe(true);
    });

    it('should return false for unsupported language codes', () => {
      expect(isLanguageSupported('zh')).toBe(false);
      expect(isLanguageSupported('ko')).toBe(false);
      expect(isLanguageSupported('ru')).toBe(false);
      expect(isLanguageSupported('ar')).toBe(false);
      expect(isLanguageSupported('')).toBe(false);
      expect(isLanguageSupported('invalid')).toBe(false);
    });
  });

  describe('getSupportedLanguageCodes', () => {
    it('should return array of all supported language codes', () => {
      const codes = getSupportedLanguageCodes();
      expect(codes).toBeInstanceOf(Array);
      expect(codes).toHaveLength(9);
      expect(codes).toEqual(['en', 'fr', 'de', 'es', 'it', 'ja', 'pt', 'nl', 'pl']);
    });

    it('should return only 2-letter language codes', () => {
      const codes = getSupportedLanguageCodes();
      codes.forEach(code => {
        expect(typeof code).toBe('string');
        expect(code).toHaveLength(2);
        expect(code).toMatch(/^[a-z]{2}$/);
      });
    });
  });

  describe('SUPPORTED_LANGUAGES constant', () => {
    it('should have correct structure for all languages', () => {
      expect(SUPPORTED_LANGUAGES).toHaveLength(9);
      
      SUPPORTED_LANGUAGES.forEach(lang => {
        expect(lang).toHaveProperty('code');
        expect(lang).toHaveProperty('name');
        expect(lang).toHaveProperty('nativeName');
        expect(lang).toHaveProperty('flag');
        
        expect(typeof lang.code).toBe('string');
        expect(typeof lang.name).toBe('string');
        expect(typeof lang.nativeName).toBe('string');
        expect(typeof lang.flag).toBe('string');
        
        expect(lang.code).toHaveLength(2);
        expect(lang.flag).toMatch(/[\u{1F1E6}-\u{1F1FF}]{2}/u); // Unicode flag pattern
      });
    });

    it('should have correct language data', () => {
      const expectedLanguages = [
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

      expect(SUPPORTED_LANGUAGES).toEqual(expectedLanguages);
    });
  });

  describe('DEFAULT_LANGUAGE_CODE constant', () => {
    it('should be English', () => {
      expect(DEFAULT_LANGUAGE_CODE).toBe('en');
    });

    it('should be a supported language', () => {
      expect(isLanguageSupported(DEFAULT_LANGUAGE_CODE)).toBe(true);
    });
  });
});