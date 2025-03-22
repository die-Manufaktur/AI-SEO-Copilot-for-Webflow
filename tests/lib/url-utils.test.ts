import { describe, it, expect } from 'vitest';

// These are the utility functions we want to test, 
// you might need to extract these from your code
const combineUrlAndSlug = (baseUrl: string, slug: string | null): string => {
  if (slug === null || slug === undefined) return baseUrl;
  
  // Remove trailing slash from URL if present
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  
  // Add the slug with leading slash
  return `${cleanBaseUrl}/${slug}`;
};

const ensureHttps = (url: string): string => {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  } else if (url.startsWith('http://')) {
    return url.replace(/^http:/, 'https:');
  }
  return url;
};

describe('URL Utility Functions', () => {
  describe('combineUrlAndSlug', () => {
    it('should correctly combine URL and slug', () => {
      expect(combineUrlAndSlug('https://example.com', 'about')).toBe('https://example.com/about');
    });

    it('should handle URLs with trailing slashes', () => {
      expect(combineUrlAndSlug('https://example.com/', 'about')).toBe('https://example.com/about');
    });

    it('should return just the URL if slug is null', () => {
      expect(combineUrlAndSlug('https://example.com', null)).toBe('https://example.com');
    });

    it('should handle empty slugs', () => {
      expect(combineUrlAndSlug('https://example.com', '')).toBe('https://example.com/');
    });
  });

  describe('ensureHttps', () => {
    it('should add https:// to URLs without protocol', () => {
      expect(ensureHttps('example.com')).toBe('https://example.com');
    });

    it('should convert http:// to https://', () => {
      expect(ensureHttps('http://example.com')).toBe('https://example.com');
    });

    it('should leave https:// URLs unchanged', () => {
      expect(ensureHttps('https://example.com')).toBe('https://example.com');
    });
  });
});
