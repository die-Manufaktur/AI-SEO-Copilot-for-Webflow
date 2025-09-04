import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  loadLanguageForSite, 
  saveLanguageForSite, 
  getLanguageCodeForSite,
  clearLanguageForSite,
  clearAllLanguagePreferences,
  getAllStoredLanguagePreferences 
} from './languageStorage';
import * as languageModule from '../../../shared/types/language';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

global.localStorage = localStorageMock as any;

// Mock the language module to control detectSiteLanguage
vi.mock('../../../shared/types/language', async () => {
  const actual = await vi.importActual('../../../shared/types/language');
  return {
    ...actual,
    detectSiteLanguage: vi.fn(() => 'en'), // Default mock
    getDefaultLanguage: vi.fn(() => ({ code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' })),
  };
});

describe('Language Storage with Site Detection', () => {
  const mockSiteId = 'test-site-123';
  
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadLanguageForSite', () => {
    it('should return detected site language when no preferences stored', () => {
      // Mock Spanish detection
      vi.mocked(languageModule.detectSiteLanguage).mockReturnValue('es');
      vi.mocked(languageModule.getDefaultLanguage).mockReturnValue({
        code: 'es', 
        name: 'Spanish', 
        nativeName: 'Español', 
        flag: '🇪🇸'
      });

      localStorageMock.getItem.mockReturnValue(null);

      const result = loadLanguageForSite(mockSiteId);
      
      expect(result.code).toBe('es');
      expect(result.nativeName).toBe('Español');
      expect(languageModule.getDefaultLanguage).toHaveBeenCalled();
    });

    it('should return detected site language when no preference for specific site', () => {
      // Mock German detection
      vi.mocked(languageModule.detectSiteLanguage).mockReturnValue('de');
      vi.mocked(languageModule.getDefaultLanguage).mockReturnValue({
        code: 'de', 
        name: 'German', 
        nativeName: 'Deutsch', 
        flag: '🇩🇪'
      });

      // Mock existing preferences for other sites
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        'other-site': 'fr'
      }));

      const result = loadLanguageForSite(mockSiteId);
      
      expect(result.code).toBe('de');
      expect(languageModule.getDefaultLanguage).toHaveBeenCalled();
    });

    it('should return stored preference when available', () => {
      // Mock preferences with specific site
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        [mockSiteId]: 'fr'
      }));

      // Mock getLanguageByCode to return French
      vi.spyOn(languageModule, 'getLanguageByCode').mockReturnValue({
        code: 'fr',
        name: 'French',
        nativeName: 'Français',
        flag: '🇫🇷'
      });

      const result = loadLanguageForSite(mockSiteId);
      
      expect(result.code).toBe('fr');
      expect(result.nativeName).toBe('Français');
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock Italian detection for error case
      vi.mocked(languageModule.detectSiteLanguage).mockReturnValue('it');
      vi.mocked(languageModule.getDefaultLanguage).mockReturnValue({
        code: 'it', 
        name: 'Italian', 
        nativeName: 'Italiano', 
        flag: '🇮🇹'
      });

      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const result = loadLanguageForSite(mockSiteId);
      
      expect(result.code).toBe('it');
      expect(languageModule.getDefaultLanguage).toHaveBeenCalled();
    });
  });

  describe('saveLanguageForSite', () => {
    it('should save language preference correctly', () => {
      localStorageMock.getItem.mockReturnValue(null);

      saveLanguageForSite(mockSiteId, 'es');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'webflow-seo-language-preferences',
        JSON.stringify({ [mockSiteId]: 'es' })
      );
    });

    it('should handle unsupported language codes', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      // Mock getDefaultLanguage for fallback
      vi.mocked(languageModule.getDefaultLanguage).mockReturnValue({
        code: 'en', 
        name: 'English', 
        nativeName: 'English', 
        flag: '🇺🇸'
      });

      saveLanguageForSite(mockSiteId, 'xyz'); // Invalid code

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'webflow-seo-language-preferences',
        JSON.stringify({ [mockSiteId]: 'en' })
      );
    });
  });

  describe('getLanguageCodeForSite', () => {
    it('should return language code for site', () => {
      // Mock Japanese detection
      vi.mocked(languageModule.detectSiteLanguage).mockReturnValue('ja');
      vi.mocked(languageModule.getDefaultLanguage).mockReturnValue({
        code: 'ja', 
        name: 'Japanese', 
        nativeName: '日本語', 
        flag: '🇯🇵'
      });

      localStorageMock.getItem.mockReturnValue(null);

      const result = getLanguageCodeForSite(mockSiteId);
      
      expect(result).toBe('ja');
    });
  });

  describe('integration with site detection', () => {
    it('should prioritize saved preference over site detection', () => {
      // Mock Portuguese detection
      vi.mocked(languageModule.detectSiteLanguage).mockReturnValue('pt');
      
      // But have French saved for this site
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        [mockSiteId]: 'fr'
      }));

      vi.spyOn(languageModule, 'getLanguageByCode').mockReturnValue({
        code: 'fr',
        name: 'French',
        nativeName: 'Français',
        flag: '🇫🇷'
      });

      const result = loadLanguageForSite(mockSiteId);
      
      expect(result.code).toBe('fr'); // Saved preference wins
      expect(languageModule.detectSiteLanguage).not.toHaveBeenCalled();
    });

    it('should fall back to detection for new sites', () => {
      // Mock Dutch detection
      vi.mocked(languageModule.detectSiteLanguage).mockReturnValue('nl');
      vi.mocked(languageModule.getDefaultLanguage).mockReturnValue({
        code: 'nl', 
        name: 'Dutch', 
        nativeName: 'Nederlands', 
        flag: '🇳🇱'
      });

      // Have preferences for other sites but not this one
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        'other-site-1': 'es',
        'other-site-2': 'de'
      }));

      const result = loadLanguageForSite(mockSiteId);
      
      expect(result.code).toBe('nl'); // Site detection used
      expect(languageModule.getDefaultLanguage).toHaveBeenCalled();
    });
  });
});