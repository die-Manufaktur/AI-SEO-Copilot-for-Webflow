import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  generatePageId, 
  saveKeywordsForPage, 
  loadKeywordsForPage, 
  clearAllKeywords, 
  getAllStoredKeywords 
} from './keywordStorage';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('keywordStorage', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  describe('generatePageId', () => {
    it('returns "homepage" for homepage regardless of path', () => {
      expect(generatePageId('/', true)).toBe('homepage');
      expect(generatePageId('/index', true)).toBe('homepage');
      expect(generatePageId(null, true)).toBe('homepage');
    });

    it('cleans and returns path for non-homepage pages', () => {
      expect(generatePageId('/about-us', false)).toBe('about-us');
      expect(generatePageId('/products/category', false)).toBe('products/category');
      expect(generatePageId('///contact///', false)).toBe('contact');
    });

    it('handles null path for non-homepage', () => {
      expect(generatePageId(null, false)).toBe('unknown-page');
    });

    it('handles empty path', () => {
      expect(generatePageId('', false)).toBe('unknown-page');
      expect(generatePageId('/', false)).toBe('homepage');
    });

    it('includes siteId prefix when provided', () => {
      expect(generatePageId('/', true, 'site123')).toBe('site123::homepage');
      expect(generatePageId('/about', false, 'site123')).toBe('site123::about');
      expect(generatePageId(null, false, 'site123')).toBe('site123::unknown-page');
    });

    it('works without siteId for backward compatibility', () => {
      expect(generatePageId('/', true, undefined)).toBe('homepage');
      expect(generatePageId('/about', false, undefined)).toBe('about');
      expect(generatePageId(null, false, undefined)).toBe('unknown-page');
    });
  });

  describe('saveKeywordsForPage', () => {
    it('saves keywords to localStorage', () => {
      const mockStorage = { 'other-page': 'existing keywords' };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStorage));

      saveKeywordsForPage('test-page', 'test keywords');

      expect(localStorageMock.getItem).toHaveBeenCalledWith('webflow-seo-keywords');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'webflow-seo-keywords',
        JSON.stringify({
          'other-page': 'existing keywords',
          'test-page': 'test keywords'
        })
      );
    });

    it('creates new storage when none exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      saveKeywordsForPage('new-page', 'new keywords');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'webflow-seo-keywords',
        JSON.stringify({ 'new-page': 'new keywords' })
      );
    });

    it('trims whitespace from keywords', () => {
      localStorageMock.getItem.mockReturnValue('{}');

      saveKeywordsForPage('test-page', '  spaced keywords  ');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'webflow-seo-keywords',
        JSON.stringify({ 'test-page': 'spaced keywords' })
      );
    });

    it('removes entry when keywords are empty', () => {
      const mockStorage = { 
        'keep-page': 'keep these',
        'remove-page': 'remove these'
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStorage));

      saveKeywordsForPage('remove-page', '');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'webflow-seo-keywords',
        JSON.stringify({ 'keep-page': 'keep these' })
      );
    });

    it('handles localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Should not throw
      expect(() => saveKeywordsForPage('test', 'keywords')).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to save keywords to localStorage:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('loadKeywordsForPage', () => {
    it('loads keywords from localStorage', () => {
      const mockStorage = { 'test-page': 'stored keywords' };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStorage));

      const result = loadKeywordsForPage('test-page');

      expect(result).toBe('stored keywords');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('webflow-seo-keywords');
    });

    it('returns empty string when no storage exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = loadKeywordsForPage('test-page');

      expect(result).toBe('');
    });

    it('returns empty string when page not found', () => {
      const mockStorage = { 'other-page': 'other keywords' };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStorage));

      const result = loadKeywordsForPage('test-page');

      expect(result).toBe('');
    });

    it('handles localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = loadKeywordsForPage('test-page');

      expect(result).toBe('');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load keywords from localStorage:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('handles invalid JSON gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = loadKeywordsForPage('test-page');

      expect(result).toBe('');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load keywords from localStorage:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('clearAllKeywords', () => {
    it('removes the storage key from localStorage', () => {
      clearAllKeywords();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('webflow-seo-keywords');
    });

    it('handles localStorage errors gracefully', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Should not throw
      expect(() => clearAllKeywords()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to clear keywords from localStorage:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('getAllStoredKeywords', () => {
    it('returns all stored keywords', () => {
      const mockStorage = { 
        'page1': 'keywords1',
        'page2': 'keywords2'
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStorage));

      const result = getAllStoredKeywords();

      expect(result).toEqual(mockStorage);
    });

    it('returns empty object when no storage exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = getAllStoredKeywords();

      expect(result).toEqual({});
    });

    it('handles localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = getAllStoredKeywords();

      expect(result).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get all keywords from localStorage:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});