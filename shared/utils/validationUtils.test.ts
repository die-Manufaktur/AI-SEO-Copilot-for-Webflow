import { describe, it, expect } from 'vitest';
import {
  validateUrl,
  validateKeyphrase,
  validateSecondaryKeywords
} from './validationUtils';

describe('validationUtils', () => {
  describe('validateUrl', () => {
    it('should validate correct HTTP URLs', () => {
      expect(validateUrl('http://example.com')).toBe(true);
      expect(validateUrl('http://www.example.com')).toBe(true);
      expect(validateUrl('http://example.com/path')).toBe(true);
      expect(validateUrl('http://example.com:8080')).toBe(true);
    });

    it('should validate correct HTTPS URLs', () => {
      expect(validateUrl('https://example.com')).toBe(true);
      expect(validateUrl('https://www.example.com')).toBe(true);
      expect(validateUrl('https://example.com/path?query=1')).toBe(true);
      expect(validateUrl('https://subdomain.example.com')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(validateUrl('not-a-url')).toBe(false);
      expect(validateUrl('ftp://example.com')).toBe(false);
      expect(validateUrl('mailto:test@example.com')).toBe(false);
      expect(validateUrl('')).toBe(false);
      expect(validateUrl('javascript:void(0)')).toBe(false);
    });

    it('should reject URLs without protocol', () => {
      expect(validateUrl('example.com')).toBe(false);
      expect(validateUrl('www.example.com')).toBe(false);
    });

    it('should handle malformed URLs gracefully', () => {
      expect(validateUrl('http://')).toBe(false);
      expect(validateUrl('https://')).toBe(false);
      expect(validateUrl('http://.')).toBe(false);
      expect(validateUrl('http://...')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validateUrl(null as any)).toBe(false);
      expect(validateUrl(undefined as any)).toBe(false);
      expect(validateUrl(123 as any)).toBe(false);
    });
  });

  describe('validateKeyphrase', () => {
    it('should validate reasonable keyphrases', () => {
      expect(validateKeyphrase('SEO')).toBe(true);
      expect(validateKeyphrase('SEO optimization')).toBe(true);
      expect(validateKeyphrase('web development services')).toBe(true);
      expect(validateKeyphrase('digital marketing strategy')).toBe(true);
    });

    it('should reject empty or whitespace-only keyphrases', () => {
      expect(validateKeyphrase('')).toBe(false);
      expect(validateKeyphrase('   ')).toBe(false);
      expect(validateKeyphrase('\t\n')).toBe(false);
    });

    it('should reject extremely long keyphrases', () => {
      const longKeyphrase = 'a'.repeat(201); // > 200 characters
      expect(validateKeyphrase(longKeyphrase)).toBe(false);
    });

    it('should accept keyphrases at boundary lengths', () => {
      const maxKeyphrase = 'a'.repeat(200); // exactly 200 chars
      expect(validateKeyphrase(maxKeyphrase)).toBe(true);
    });

    it('should handle special characters appropriately', () => {
      expect(validateKeyphrase('e-commerce')).toBe(true);
      expect(validateKeyphrase('React.js')).toBe(true);
      expect(validateKeyphrase('C++')).toBe(true);
      expect(validateKeyphrase('SEO & marketing')).toBe(true);
    });

    it('should handle edge cases', () => {
      expect(validateKeyphrase(null as any)).toBe(false);
      expect(validateKeyphrase(undefined as any)).toBe(false);
      expect(validateKeyphrase(123 as any)).toBe(false);
    });
  });

  describe('validateSecondaryKeywords', () => {
    it('should return undefined for empty input', () => {
      expect(validateSecondaryKeywords('')).toBe(undefined);
      expect(validateSecondaryKeywords('   ')).toBe(undefined);
      expect(validateSecondaryKeywords(null as any)).toBe(undefined);
      expect(validateSecondaryKeywords(undefined)).toBe(undefined);
    });

    it('should validate single keywords', () => {
      expect(validateSecondaryKeywords('SEO')).toBe('SEO');
      expect(validateSecondaryKeywords('marketing')).toBe('marketing');
    });

    it('should validate multiple comma-separated keywords', () => {
      expect(validateSecondaryKeywords('SEO, marketing, optimization')).toBe('SEO, marketing, optimization');
    });

    it('should clean up extra whitespace', () => {
      expect(validateSecondaryKeywords('  SEO  ,  marketing  ,  optimization  ')).toBe('SEO, marketing, optimization');
    });

    it('should filter out empty keywords', () => {
      expect(validateSecondaryKeywords('SEO,  ,  marketing,  ,  optimization')).toBe('SEO, marketing, optimization');
    });

    it('should limit to 10 keywords', () => {
      const manyKeywords = Array.from({ length: 12 }, (_, i) => `keyword${i + 1}`).join(', ');
      const result = validateSecondaryKeywords(manyKeywords);
      const keywordCount = result?.split(', ').length || 0;
      expect(keywordCount).toBe(10);
    });

    it('should filter out keywords longer than 100 characters', () => {
      const longKeyword = 'a'.repeat(101);
      const result = validateSecondaryKeywords(`SEO, ${longKeyword}, marketing`);
      expect(result).toBe('SEO, marketing');
    });

    it('should handle mixed valid and invalid keywords', () => {
      expect(validateSecondaryKeywords('SEO, , marketing, optimization')).toBe('SEO, marketing, optimization');
    });

    it('should handle non-string input', () => {
      expect(validateSecondaryKeywords(123 as any)).toBe(undefined);
      expect(validateSecondaryKeywords({} as any)).toBe(undefined);
      expect(validateSecondaryKeywords([] as any)).toBe(undefined);
    });
  });
});