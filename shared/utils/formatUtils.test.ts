import { describe, it, expect } from 'vitest';
import { formatBytes, formatUrl, formatNumber } from './formatUtils';

describe('formatUtils', () => {
  describe('formatBytes', () => {
    it('should return "Unknown size" for undefined bytes', () => {
      expect(formatBytes()).toBe('Unknown size');
    });

    it('should return "Unknown size" for 0 bytes', () => {
      expect(formatBytes(0)).toBe('Unknown size');
    });

    it('should format bytes less than 1024', () => {
      expect(formatBytes(1)).toBe('1 bytes');
      expect(formatBytes(512)).toBe('512 bytes');
      expect(formatBytes(1023)).toBe('1023 bytes');
    });

    it('should format bytes as KB', () => {
      expect(formatBytes(1024)).toBe('1.0 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(2048)).toBe('2.0 KB');
      expect(formatBytes(1047552)).toBe('1023.0 KB'); // Just under 1 MB
    });

    it('should format bytes as MB', () => {
      expect(formatBytes(1048576)).toBe('1.0 MB');
      expect(formatBytes(1572864)).toBe('1.5 MB');
      expect(formatBytes(2097152)).toBe('2.0 MB');
      expect(formatBytes(10485760)).toBe('10.0 MB');
      expect(formatBytes(104857600)).toBe('100.0 MB');
    });

    it('should handle large numbers', () => {
      expect(formatBytes(1073741824)).toBe('1024.0 MB'); // 1 GB as MB
      expect(formatBytes(5368709120)).toBe('5120.0 MB'); // 5 GB as MB
    });

    it('should format with one decimal place', () => {
      expect(formatBytes(1234)).toBe('1.2 KB');
      expect(formatBytes(1566720)).toBe('1.5 MB');
      expect(formatBytes(1234567)).toBe('1.2 MB');
    });

    it('should handle edge cases', () => {
      expect(formatBytes(1025)).toBe('1.0 KB');
      expect(formatBytes(1048577)).toBe('1.0 MB');
    });
  });

  describe('formatUrl', () => {
    it('should return empty string for empty input', () => {
      expect(formatUrl('')).toBe('');
    });

    it('should remove http protocol', () => {
      expect(formatUrl('http://example.com')).toBe('example.com');
      expect(formatUrl('http://www.example.com')).toBe('www.example.com');
    });

    it('should remove https protocol', () => {
      expect(formatUrl('https://example.com')).toBe('example.com');
      expect(formatUrl('https://www.example.com')).toBe('www.example.com');
    });

    it('should remove trailing slash', () => {
      expect(formatUrl('https://example.com/')).toBe('example.com');
      expect(formatUrl('http://example.com/')).toBe('example.com');
      expect(formatUrl('example.com/')).toBe('example.com');
    });

    it('should remove both protocol and trailing slash', () => {
      expect(formatUrl('https://example.com/')).toBe('example.com');
      expect(formatUrl('http://www.example.com/')).toBe('www.example.com');
    });

    it('should preserve path and query parameters', () => {
      expect(formatUrl('https://example.com/path')).toBe('example.com/path');
      expect(formatUrl('https://example.com/path/')).toBe('example.com/path');
      expect(formatUrl('https://example.com/path?query=1')).toBe('example.com/path?query=1');
      expect(formatUrl('https://example.com/path/?query=1')).toBe('example.com/path?query=1');
    });

    it('should handle complex URLs', () => {
      expect(formatUrl('https://subdomain.example.com:8080/path/to/resource?param=value&other=123#anchor'))
        .toBe('subdomain.example.com:8080/path/to/resource?param=value&other=123#anchor');
    });

    it('should handle URLs without protocol', () => {
      expect(formatUrl('example.com')).toBe('example.com');
      expect(formatUrl('example.com/')).toBe('example.com');
      expect(formatUrl('www.example.com/path')).toBe('www.example.com/path');
    });

    it('should handle localhost URLs', () => {
      expect(formatUrl('http://localhost:3000')).toBe('localhost:3000');
      expect(formatUrl('https://localhost:8080/')).toBe('localhost:8080');
    });

    it('should handle IP addresses', () => {
      expect(formatUrl('http://192.168.1.1')).toBe('192.168.1.1');
      expect(formatUrl('https://127.0.0.1:8080/')).toBe('127.0.0.1:8080');
    });

    it('should handle edge cases', () => {
      expect(formatUrl('http://')).toBe('');
      expect(formatUrl('https://')).toBe('');
      expect(formatUrl('/')).toBe('');
    });
  });

  describe('formatNumber', () => {
    it('should format small numbers', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(1)).toBe('1');
      expect(formatNumber(42)).toBe('42');
      expect(formatNumber(999)).toBe('999');
    });

    it('should format numbers with thousands separators', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1234)).toBe('1,234');
      expect(formatNumber(12345)).toBe('12,345');
      expect(formatNumber(123456)).toBe('123,456');
    });

    it('should format large numbers', () => {
      expect(formatNumber(1000000)).toBe('1,000,000');
      expect(formatNumber(1234567)).toBe('1,234,567');
      expect(formatNumber(1234567890)).toBe('1,234,567,890');
    });

    it('should handle negative numbers', () => {
      expect(formatNumber(-1)).toBe('-1');
      expect(formatNumber(-1000)).toBe('-1,000');
      expect(formatNumber(-1234567)).toBe('-1,234,567');
    });

    it('should handle decimal numbers', () => {
      expect(formatNumber(1234.56)).toBe('1,234.56');
      expect(formatNumber(1000000.789)).toBe('1,000,000.789');
      expect(formatNumber(-1234.56)).toBe('-1,234.56');
    });

    it('should handle floating point edge cases', () => {
      expect(formatNumber(0.1)).toBe('0.1');
      expect(formatNumber(0.123456789)).toBe('0.123456789');
      expect(formatNumber(1000.1)).toBe('1,000.1');
    });

    it('should handle very large numbers', () => {
      expect(formatNumber(Number.MAX_SAFE_INTEGER)).toBe('9,007,199,254,740,991');
    });

    it('should handle very small numbers', () => {
      expect(formatNumber(Number.MIN_SAFE_INTEGER)).toBe('-9,007,199,254,740,991');
    });

    it('should handle zero variations', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(-0)).toBe('0');
      expect(formatNumber(0.0)).toBe('0');
    });
  });

  describe('integration tests', () => {
    it('should work together for file size and URL formatting', () => {
      const fileSize = 1536; // bytes
      const fileUrl = 'https://example.com/uploads/file.pdf/';
      
      expect(formatBytes(fileSize)).toBe('1.5 KB');
      expect(formatUrl(fileUrl)).toBe('example.com/uploads/file.pdf');
    });

    it('should handle analytics data formatting', () => {
      const visitors = 1234567;
      const pageViews = 9876543;
      
      expect(formatNumber(visitors)).toBe('1,234,567');
      expect(formatNumber(pageViews)).toBe('9,876,543');
    });

    it('should format SEO-related data', () => {
      const imageSize = 2097152; // 2 MB
      const canonicalUrl = 'https://www.example.com/seo-page/';
      const searchVolume = 45000;
      
      expect(formatBytes(imageSize)).toBe('2.0 MB');
      expect(formatUrl(canonicalUrl)).toBe('www.example.com/seo-page');
      expect(formatNumber(searchVolume)).toBe('45,000');
    });
  });
});