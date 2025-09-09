import { describe, it, expect } from 'vitest';
import { sanitizeKeywords } from './stringUtils';

describe('sanitizeKeywords - Security Tests', () => {
  describe('HTML injection prevention', () => {
    it('should remove simple HTML tags', () => {
      const input = '<script>alert("xss")</script>test';
      const result = sanitizeKeywords(input);
      expect(result).toBe('test');
    });

    it('should handle nested HTML tags that could bypass single-pass sanitization', () => {
      const input = '<<script>alert("xss")</script>';
      const result = sanitizeKeywords(input);
      expect(result).toBe('');
    });

    it('should handle malformed nested tags', () => {
      const input = '<scr<script>ipt>alert("xss")</script>';
      const result = sanitizeKeywords(input);
      expect(result).toBe('');
    });

    it('should handle multiple nested levels', () => {
      const input = '<<<script>alert("xss")</script>>';
      const result = sanitizeKeywords(input);
      expect(result).toBe('');
    });

    it('should handle HTML entity encoded tags', () => {
      const input = '&lt;script&gt;alert("xss")&lt;/script&gt;';
      const result = sanitizeKeywords(input);
      expect(result).toBe('');
    });

    it('should handle mixed HTML entities and tags', () => {
      const input = '<script&gt;alert("xss")&lt;/script>';
      const result = sanitizeKeywords(input);
      expect(result).toBe('');
    });

    it('should handle incomplete HTML entities', () => {
      const input = '&lt;script&gt;alert&amp;test';
      const result = sanitizeKeywords(input);
      expect(result).toBe('');
    });

    it('should handle various tag combinations', () => {
      const testCases = [
        '<img src=x onerror=alert(1)>',
        '<svg onload=alert(1)>',
        '<iframe src="javascript:alert(1)">',
        '<div onclick="alert(1)">',
        '<a href="javascript:alert(1)">',
      ];

      testCases.forEach(testCase => {
        const result = sanitizeKeywords(testCase);
        expect(result).not.toContain('<');
        expect(result).not.toContain('>');
      });
    });
  });

  describe('legitimate content preservation', () => {
    it('should preserve normal text content', () => {
      const input = 'This is normal text';
      const result = sanitizeKeywords(input);
      expect(result).toBe('This is normal text');
    });

    it('should preserve text with special characters but no HTML', () => {
      const input = 'Text with & ampersand, < less than, > greater than';
      const result = sanitizeKeywords(input);
      expect(result).toBe('Text with  ampersand,  less than,  greater than');
    });

    it('should handle empty input gracefully', () => {
      const result = sanitizeKeywords('');
      expect(result).toBe('');
    });

    it('should handle null/undefined input gracefully', () => {
      expect(sanitizeKeywords(null as any)).toBe('');
      expect(sanitizeKeywords(undefined as any)).toBe('');
    });

    it('should respect length limitation', () => {
      const longInput = 'a'.repeat(1000);
      const result = sanitizeKeywords(longInput);
      expect(result.length).toBeLessThanOrEqual(500);
    });
  });

  describe('multilingual content', () => {
    it('should handle multilingual content with language codes', () => {
      const input = 'Café résumé naïve';
      const result = sanitizeKeywords(input, 'fr');
      expect(result).toBe('Café résumé naïve');
    });

    it('should sanitize HTML in multilingual content', () => {
      const input = '<script>alert("xss")</script>Café résumé';
      const result = sanitizeKeywords(input, 'fr');
      expect(result).toBe('Café résumé');
    });
  });

  describe('edge case stress tests', () => {
    it('should handle deeply nested malicious patterns', () => {
      const input = Array(10).fill(0).reduce((acc) => `<div${acc}/div>`, 'script>alert(1)</script');
      const result = sanitizeKeywords(input);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should handle mixed attack vectors', () => {
      const input = '<scr&lt;script&gt;ipt>alert(&amp;quot;xss&amp;quot;)</script>';
      const result = sanitizeKeywords(input);
      expect(result).toBe('');
    });

    it('should terminate on infinite loop protection', () => {
      // This tests the loop protection mechanism
      const input = '<' + 'script>'.repeat(100);
      const result = sanitizeKeywords(input);
      expect(result).not.toContain('<script>');
    });
  });
});