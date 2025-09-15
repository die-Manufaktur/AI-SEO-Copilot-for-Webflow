import { describe, it, expect, vi } from 'vitest';
import { extractDomainFromUrl, extractTextAfterColon, normalizeUrl } from './urlUtils';

// Mock console.warn to avoid noise in test output
const mockConsoleWarn = vi.fn();
vi.stubGlobal('console', { ...console, warn: mockConsoleWarn });

describe('urlUtils', () => {
  describe('extractDomainFromUrl', () => {
    it('should extract domain from URL with https protocol', () => {
      const result = extractDomainFromUrl('https://example.com/path');
      expect(result).toBe('example.com');
    });

    it('should extract domain from URL with http protocol', () => {
      const result = extractDomainFromUrl('http://example.com/path');
      expect(result).toBe('example.com');
    });

    it('should extract domain from URL without protocol', () => {
      const result = extractDomainFromUrl('example.com/path');
      expect(result).toBe('example.com');
    });

    it('should extract domain from URL with subdomain', () => {
      const result = extractDomainFromUrl('https://www.example.com/path');
      expect(result).toBe('www.example.com');
    });

    it('should extract domain from URL with port', () => {
      const result = extractDomainFromUrl('https://example.com:8080/path');
      expect(result).toBe('example.com');
    });

    it('should extract domain from localhost URL', () => {
      const result = extractDomainFromUrl('http://localhost:3000/path');
      expect(result).toBe('localhost');
    });

    it('should extract domain from IP address', () => {
      const result = extractDomainFromUrl('http://192.168.1.1/path');
      expect(result).toBe('192.168.1.1');
    });

    it('should handle URL with query parameters', () => {
      const result = extractDomainFromUrl('https://example.com/path?query=value');
      expect(result).toBe('example.com');
    });

    it('should handle URL with hash fragment', () => {
      const result = extractDomainFromUrl('https://example.com/path#section');
      expect(result).toBe('example.com');
    });

    it('should return empty string for invalid URL', () => {
      mockConsoleWarn.mockClear();
      const result = extractDomainFromUrl('invalid-url');
      expect(result).toBe('');
      expect(mockConsoleWarn).toHaveBeenCalledWith('Invalid URL:', 'invalid-url');
    });

    it('should return empty string for empty URL', () => {
      mockConsoleWarn.mockClear();
      const result = extractDomainFromUrl('');
      expect(result).toBe('');
      expect(mockConsoleWarn).toHaveBeenCalledWith('Invalid URL:', '');
    });

    it('should handle URL with special characters', () => {
      const result = extractDomainFromUrl('https://example.com/path with spaces');
      expect(result).toBe('example.com');
    });

    it('should handle international domain names', () => {
      const result = extractDomainFromUrl('https://例え.テスト/path');
      expect(result).toBe('xn--r8jz45g.xn--zckzah');
    });
  });

  describe('extractTextAfterColon', () => {
    it('should extract text after first colon', () => {
      const result = extractTextAfterColon('prefix: content after colon');
      expect(result).toBe('content after colon');
    });

    it('should return original string if no colon found', () => {
      const result = extractTextAfterColon('no colon here');
      expect(result).toBe('no colon here');
    });

    it('should trim whitespace from extracted text', () => {
      const result = extractTextAfterColon('prefix:   spaced content   ');
      expect(result).toBe('spaced content');
    });

    it('should handle multiple colons by using first one', () => {
      const result = extractTextAfterColon('first:second:third');
      expect(result).toBe('second:third');
    });

    it('should handle empty string after colon', () => {
      const result = extractTextAfterColon('prefix:');
      expect(result).toBe('');
    });

    it('should handle colon at the beginning', () => {
      const result = extractTextAfterColon(':content');
      expect(result).toBe('content');
    });

    it('should return empty string for null input', () => {
      const result = extractTextAfterColon(null);
      expect(result).toBe('');
    });

    it('should return empty string for undefined input', () => {
      const result = extractTextAfterColon(undefined);
      expect(result).toBe('');
    });

    it('should return empty string for empty string input', () => {
      const result = extractTextAfterColon('');
      expect(result).toBe('');
    });

    it('should trim the original string if no colon found', () => {
      const result = extractTextAfterColon('  trimmed string  ');
      expect(result).toBe('trimmed string');
    });

    it('should handle only colon character', () => {
      const result = extractTextAfterColon(':');
      expect(result).toBe('');
    });

    it('should handle whitespace-only text after colon', () => {
      const result = extractTextAfterColon('prefix:   ');
      expect(result).toBe('');
    });
  });

  describe('normalizeUrl', () => {
    it('should normalize URL by removing trailing slash from path', () => {
      const result = normalizeUrl('https://example.com/path/');
      expect(result).toBe('https://example.com/path');
    });

    it('should preserve root path slash', () => {
      const result = normalizeUrl('https://example.com/');
      expect(result).toBe('https://example.com/');
    });

    it('should preserve query parameters', () => {
      const result = normalizeUrl('https://example.com/path/?query=value');
      expect(result).toBe('https://example.com/path?query=value');
    });

    it('should preserve hash fragment', () => {
      const result = normalizeUrl('https://example.com/path/#section');
      expect(result).toBe('https://example.com/path#section');
    });

    it('should handle URL with both query and hash', () => {
      const result = normalizeUrl('https://example.com/path/?query=value#section');
      expect(result).toBe('https://example.com/path?query=value#section');
    });

    it('should handle URL without trailing slash', () => {
      const result = normalizeUrl('https://example.com/path');
      expect(result).toBe('https://example.com/path');
    });

    it('should handle URL with port', () => {
      const result = normalizeUrl('https://example.com:8080/path/');
      expect(result).toBe('https://example.com:8080/path');
    });

    it('should handle http protocol', () => {
      const result = normalizeUrl('http://example.com/path/');
      expect(result).toBe('http://example.com/path');
    });

    it('should handle nested paths with trailing slash', () => {
      const result = normalizeUrl('https://example.com/path/subpath/');
      expect(result).toBe('https://example.com/path/subpath');
    });

    it('should handle empty string input', () => {
      const result = normalizeUrl('');
      expect(result).toBe('');
    });

    it('should handle invalid URL by returning original', () => {
      const result = normalizeUrl('invalid-url');
      expect(result).toBe('invalid-url');
    });

    it('should handle URL with multiple trailing slashes', () => {
      const result = normalizeUrl('https://example.com/path///');
      expect(result).toBe('https://example.com/path//');
    });

    it('should preserve subdomain', () => {
      const result = normalizeUrl('https://www.example.com/path/');
      expect(result).toBe('https://www.example.com/path');
    });

    it('should handle complex URL with all components', () => {
      const result = normalizeUrl('https://user:pass@www.example.com:8080/path/subpath/?query=value&other=test#section');
      expect(result).toBe('https://user:pass@www.example.com:8080/path/subpath?query=value&other=test#section');
    });

    it('should handle root path correctly', () => {
      const result = normalizeUrl('https://example.com');
      expect(result).toBe('https://example.com/');
    });

    it('should handle localhost URLs', () => {
      const result = normalizeUrl('http://localhost:3000/path/');
      expect(result).toBe('http://localhost:3000/path');
    });

    it('should handle file protocol URLs', () => {
      const result = normalizeUrl('file:///path/to/file/');
      expect(result).toBe('file:///path/to/file');
    });
  });
});