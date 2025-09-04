import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  detectSiteLanguage, 
  getDefaultLanguage, 
  getLanguageByCode, 
  isLanguageSupported,
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
});