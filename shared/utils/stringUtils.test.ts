import { describe, it, expect } from 'vitest';
import { sanitizeKeywords, decodeHtmlEntities, ensureAscii, sanitizeText } from './stringUtils';

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

describe('ensureAscii', () => {
  it('should replace smart quotes with straight quotes', () => {
    expect(ensureAscii('\u2018Hello World\u2019')).toBe("'Hello World'");
    expect(ensureAscii('\u201CTesting quotes\u201D')).toBe('"Testing quotes"');
  });

  it('should replace dashes with hyphens', () => {
    expect(ensureAscii('En–dash and Em—dash')).toBe('En-dash and Em-dash');
  });

  it('should replace ellipsis with three periods', () => {
    expect(ensureAscii('Loading…')).toBe('Loading...');
  });

  it('should replace non-breaking spaces with regular spaces', () => {
    expect(ensureAscii('Text\u00A0with\u00A0NBSP')).toBe('Text with NBSP');
  });

  it('should replace bullets with asterisks', () => {
    expect(ensureAscii('• Bullet point')).toBe('* Bullet point');
    expect(ensureAscii('‣ Another bullet')).toBe('* Another bullet');
    expect(ensureAscii('⁃ Third bullet')).toBe('* Third bullet');
  });

  it('should remove zero-width spaces and control characters', () => {
    expect(ensureAscii('Text\u200Bwith\u200Czero\u200Dwidth')).toBe('Textwithzerowidth');
    expect(ensureAscii('Soft\u00ADhyphen')).toBe('Softhyphen');
  });

  it('should remove non-ASCII characters', () => {
    expect(ensureAscii('Café')).toBe('Caf');
    expect(ensureAscii('naïve')).toBe('nave');
    expect(ensureAscii('résumé')).toBe('rsum');
  });

  it('should handle empty and null inputs', () => {
    expect(ensureAscii('')).toBe('');
    expect(ensureAscii(null as any)).toBe('');
    expect(ensureAscii(undefined as any)).toBe('');
  });

  it('should handle mixed Unicode characters', () => {
    expect(ensureAscii('Test • "smart quotes" – em—dash … ellipsis')).toBe('Test * "smart quotes" - em-dash ... ellipsis');
  });
});

describe('sanitizeText', () => {
  it('should decode HTML entities and apply ASCII conversion by default', () => {
    const input = '&lt;div&gt;"Smart quotes" – dash&lt;/div&gt;';
    const expected = '<div>"Smart quotes" - dash</div>';
    expect(sanitizeText(input)).toBe(expected);
  });

  it('should preserve Unicode for Japanese language', () => {
    const input = 'こんにちは世界';
    expect(sanitizeText(input, 'ja')).toBe('こんにちは世界');
  });

  it('should preserve Unicode for Chinese language', () => {
    const input = '你好世界';
    expect(sanitizeText(input, 'zh')).toBe('你好世界');
  });

  it('should preserve Unicode for Korean language', () => {
    const input = '안녕하세요';
    expect(sanitizeText(input, 'ko')).toBe('안녕하세요');
  });

  it('should preserve Unicode for Russian language', () => {
    const input = 'Привет мир';
    expect(sanitizeText(input, 'ru')).toBe('Привет мир');
  });

  it('should preserve Unicode for Arabic language', () => {
    const input = 'مرحبا بالعالم';
    expect(sanitizeText(input, 'ar')).toBe('مرحبا بالعالم');
  });

  it('should preserve Unicode with special preserve flag', () => {
    const input = 'Mixed 中文 and English';
    expect(sanitizeText(input, 'preserve-unicode')).toBe('Mixed 中文 and English');
  });

  it('should apply ASCII conversion for English', () => {
    const input = '"Smart quotes" and café';
    expect(sanitizeText(input, 'en')).toBe('"Smart quotes" and caf');
  });

  it('should apply ASCII conversion for unsupported languages', () => {
    const input = '"Smart quotes" and café';
    expect(sanitizeText(input, 'es')).toBe('"Smart quotes" and caf');
  });

  it('should remove control characters but preserve Unicode', () => {
    const input = 'こんにちは\u0000\u0008\u000B\u000C\u000E世界';
    expect(sanitizeText(input, 'ja')).toBe('こんにちは世界');
  });

  it('should remove zero-width spaces for Unicode languages', () => {
    const input = 'こんにちは\u200B\u200C\u200D世界';
    expect(sanitizeText(input, 'ja')).toBe('こんにちは世界');
  });

  it('should handle empty string', () => {
    expect(sanitizeText('')).toBe('');
    expect(sanitizeText('', 'ja')).toBe('');
  });

  it('should handle null and undefined inputs', () => {
    expect(sanitizeText(null as any)).toBe('');
    expect(sanitizeText(undefined as any)).toBe('');
  });

  it('should handle mixed HTML entities and Unicode', () => {
    const input = '&lt;div&gt;こんにちは&lt;/div&gt;';
    expect(sanitizeText(input, 'ja')).toBe('<div>こんにちは</div>');
    expect(sanitizeText(input, 'en')).toBe('<div></div>');
  });

  it('should replace smart quotes in Unicode-preserving mode', () => {
    const input = '\u2018日本語\u2019 and \u201CEnglish\u201D';
    expect(sanitizeText(input, 'ja')).toBe("'日本語' and \"English\"");
  });
});