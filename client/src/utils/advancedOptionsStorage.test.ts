import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveAdvancedOptionsForPage,
  loadAdvancedOptionsForPage,
  clearAllAdvancedOptions,
  getAllStoredAdvancedOptions,
  type AdvancedOptions
} from './advancedOptionsStorage';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('advancedOptionsStorage', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('saveAdvancedOptionsForPage', () => {
    it('should save advanced options for a page', () => {
      const pageId = 'test-page';
      const options: AdvancedOptions = {
        pageType: 'Homepage',
        secondaryKeywords: 'Test context'
      };

      saveAdvancedOptionsForPage(pageId, options);

      const stored = JSON.parse(localStorageMock.getItem('webflow-seo-advanced-options') || '{}');
      expect(stored[pageId]).toEqual(options);
    });

    it('should trim whitespace from options', () => {
      const pageId = 'test-page';
      const options: AdvancedOptions = {
        pageType: '  Homepage  ',
        secondaryKeywords: '  Test context  '
      };

      saveAdvancedOptionsForPage(pageId, options);

      const stored = JSON.parse(localStorageMock.getItem('webflow-seo-advanced-options') || '{}');
      expect(stored[pageId]).toEqual({
        pageType: 'Homepage',
        secondaryKeywords: 'Test context'
      });
    });

    it('should remove page entry when both fields are empty', () => {
      const pageId = 'test-page';
      
      // First save some options
      saveAdvancedOptionsForPage(pageId, {
        pageType: 'Homepage',
        secondaryKeywords: 'Test context'
      });

      // Then save empty options
      saveAdvancedOptionsForPage(pageId, {
        pageType: '',
        secondaryKeywords: ''
      });

      const stored = JSON.parse(localStorageMock.getItem('webflow-seo-advanced-options') || '{}');
      expect(stored[pageId]).toBeUndefined();
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Mock localStorage setItem to throw an error
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = vi.fn(() => {
        throw new Error('LocalStorage error');
      });

      expect(() => {
        saveAdvancedOptionsForPage('test-page', {
          pageType: 'Homepage',
          secondaryKeywords: 'Test context'
        });
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to save advanced options to localStorage:', expect.any(Error));
      
      // Restore original implementation
      localStorageMock.setItem = originalSetItem;
      consoleSpy.mockRestore();
    });
  });

  describe('loadAdvancedOptionsForPage', () => {
    it('should load saved advanced options for a page', () => {
      const pageId = 'test-page';
      const options: AdvancedOptions = {
        pageType: 'Blog post',
        secondaryKeywords: 'Technology blog'
      };

      saveAdvancedOptionsForPage(pageId, options);
      const loaded = loadAdvancedOptionsForPage(pageId);

      expect(loaded).toEqual({
        pageType: 'Blog post',
        secondaryKeywords: 'Technology blog'
      });
    });


    it('should return empty options for non-existent page', () => {
      const loaded = loadAdvancedOptionsForPage('non-existent-page');

      expect(loaded).toEqual({
        pageType: '',
        secondaryKeywords: ''
      });
    });

    it('should return empty options when localStorage is empty', () => {
      const loaded = loadAdvancedOptionsForPage('test-page');

      expect(loaded).toEqual({
        pageType: '',
        secondaryKeywords: ''
      });
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Mock localStorage getItem to throw an error
      const originalGetItem = localStorageMock.getItem;
      localStorageMock.getItem = vi.fn(() => {
        throw new Error('LocalStorage error');
      });

      const loaded = loadAdvancedOptionsForPage('test-page');

      expect(loaded).toEqual({
        pageType: '',
        secondaryKeywords: ''
      });
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load advanced options from localStorage:', expect.any(Error));
      
      // Restore original implementation
      localStorageMock.getItem = originalGetItem;
      consoleSpy.mockRestore();
    });
  });

  describe('clearAllAdvancedOptions', () => {
    it('should remove all stored advanced options', () => {
      // Save some options first
      saveAdvancedOptionsForPage('page1', {
        pageType: 'Homepage',
        secondaryKeywords: 'Context 1'
      });
      saveAdvancedOptionsForPage('page2', {
        pageType: 'Blog post',
        secondaryKeywords: 'Context 2'
      });

      clearAllAdvancedOptions();

      expect(localStorageMock.getItem('webflow-seo-advanced-options')).toBeNull();
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Mock localStorage removeItem to throw an error
      const originalRemoveItem = localStorageMock.removeItem;
      localStorageMock.removeItem = vi.fn(() => {
        throw new Error('LocalStorage error');
      });

      expect(() => clearAllAdvancedOptions()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to clear advanced options from localStorage:', expect.any(Error));
      
      // Restore original implementation
      localStorageMock.removeItem = originalRemoveItem;
      consoleSpy.mockRestore();
    });
  });

  describe('getAllStoredAdvancedOptions', () => {
    it('should return all stored advanced options', () => {
      const options1: AdvancedOptions = {
        pageType: 'Homepage',
        secondaryKeywords: 'Context 1'
      };
      const options2: AdvancedOptions = {
        pageType: 'Product page',
        secondaryKeywords: 'Context 2'
      };

      saveAdvancedOptionsForPage('page1', options1);
      saveAdvancedOptionsForPage('page2', options2);

      const allOptions = getAllStoredAdvancedOptions();

      expect(allOptions).toEqual({
        page1: options1,
        page2: options2
      });
    });

    it('should return empty object when no options stored', () => {
      const allOptions = getAllStoredAdvancedOptions();
      expect(allOptions).toEqual({});
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Mock localStorage getItem to throw an error
      const originalGetItem = localStorageMock.getItem;
      localStorageMock.getItem = vi.fn(() => {
        throw new Error('LocalStorage error');
      });

      const allOptions = getAllStoredAdvancedOptions();

      expect(allOptions).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith('Failed to get all advanced options from localStorage:', expect.any(Error));
      
      // Restore original implementation
      localStorageMock.getItem = originalGetItem;
      consoleSpy.mockRestore();
    });
  });

  describe('page persistence scenarios', () => {
    it('should handle multiple pages with different options', () => {
      const homepageOptions: AdvancedOptions = {
        pageType: 'Homepage',
        secondaryKeywords: 'Main landing page for SaaS product'
      };
      const blogOptions: AdvancedOptions = {
        pageType: 'Blog post',
        secondaryKeywords: 'Technical content for developers'
      };
      const productOptions: AdvancedOptions = {
        pageType: 'Product page',
        secondaryKeywords: 'E-commerce product for outdoor gear'
      };

      saveAdvancedOptionsForPage('homepage', homepageOptions);
      saveAdvancedOptionsForPage('blog/tech-article', blogOptions);
      saveAdvancedOptionsForPage('products/hiking-boots', productOptions);

      expect(loadAdvancedOptionsForPage('homepage')).toEqual(homepageOptions);
      expect(loadAdvancedOptionsForPage('blog/tech-article')).toEqual(blogOptions);
      expect(loadAdvancedOptionsForPage('products/hiking-boots')).toEqual(productOptions);
    });

    it('should update existing page options', () => {
      const pageId = 'test-page';
      const initialOptions: AdvancedOptions = {
        pageType: 'Homepage',
        secondaryKeywords: 'Initial context'
      };
      const updatedOptions: AdvancedOptions = {
        pageType: 'Landing page',
        secondaryKeywords: 'Updated context with more details'
      };

      saveAdvancedOptionsForPage(pageId, initialOptions);
      expect(loadAdvancedOptionsForPage(pageId)).toEqual(initialOptions);

      saveAdvancedOptionsForPage(pageId, updatedOptions);
      expect(loadAdvancedOptionsForPage(pageId)).toEqual(updatedOptions);
    });
  });
});