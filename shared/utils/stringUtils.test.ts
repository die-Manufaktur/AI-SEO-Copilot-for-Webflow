import { describe, it, expect } from 'vitest';
import { sanitizeKeywords, decodeHtmlEntities } from './stringUtils';

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

describe('decodeHtmlEntities - Security Tests', () => {
  describe('double-escaping prevention', () => {
    it('should handle &amp; replacement last to prevent double-unescaping', () => {
      // This tests the security fix: &amp; must be decoded last
      expect(decodeHtmlEntities('&amp;lt;script&amp;gt;')).toBe('&lt;script&gt;');
      expect(decodeHtmlEntities('&amp;quot;test&amp;quot;')).toBe('&quot;test&quot;');
      expect(decodeHtmlEntities('&amp;amp;')).toBe('&amp;');
    });

    it('should prevent creation of new entities during decoding', () => {
      // These inputs would create valid entities if &amp; was decoded first
      expect(decodeHtmlEntities('&amp;lt;')).toBe('&lt;');
      expect(decodeHtmlEntities('&amp;gt;')).toBe('&gt;');
      expect(decodeHtmlEntities('&amp;quot;')).toBe('&quot;');
      expect(decodeHtmlEntities('&amp;#39;')).toBe('&#39;');
    });

    it('should handle complex mixed entity patterns', () => {
      const input = '&amp;lt;div class=&amp;quot;test&amp;quot;&amp;gt;content&amp;lt;/div&amp;gt;';
      const expected = '&lt;div class=&quot;test&quot;&gt;content&lt;/div&gt;';
      expect(decodeHtmlEntities(input)).toBe(expected);
    });
  });

  describe('standard HTML entity decoding', () => {
    it('should decode common HTML entities correctly', () => {
      expect(decodeHtmlEntities('&lt;script&gt;')).toBe('<script>');
      expect(decodeHtmlEntities('&quot;hello&quot;')).toBe('"hello"');
      expect(decodeHtmlEntities('&#39;test&#39;')).toBe("'test'");
      expect(decodeHtmlEntities('&#x2F;path&#x3D;value')).toBe('/path=value');
    });

    it('should handle mixed entities in single string', () => {
      const input = '&lt;div class=&quot;test&quot;&gt;Hello &#39;world&#39;&lt;/div&gt;';
      const expected = '<div class="test">Hello \'world\'</div>';
      expect(decodeHtmlEntities(input)).toBe(expected);
    });

    it('should handle strings without entities unchanged', () => {
      expect(decodeHtmlEntities('normal text')).toBe('normal text');
      expect(decodeHtmlEntities('text with spaces')).toBe('text with spaces');
      expect(decodeHtmlEntities('')).toBe('');
    });
  });

  describe('edge cases', () => {
    it('should handle partial or malformed entities', () => {
      expect(decodeHtmlEntities('&amp without semicolon')).toBe('& without semicolon');
      expect(decodeHtmlEntities('&invalid;entity')).toBe('&invalid;entity');
      expect(decodeHtmlEntities('&amp;&amp;&amp;')).toBe('&&&');
    });

    it('should handle empty and null inputs', () => {
      expect(decodeHtmlEntities('')).toBe('');
      expect(() => decodeHtmlEntities(null as any)).not.toThrow();
      expect(() => decodeHtmlEntities(undefined as any)).not.toThrow();
    });
  });
});