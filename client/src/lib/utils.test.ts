import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cn, createLogger, extractDomainFromUrl, extractTextAfterColon } from './utils';
import { calculateSEOScore } from '../../../shared/utils/seoUtils';

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('merges class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('handles conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional');
    });

    it('handles undefined and null values', () => {
      expect(cn('base', undefined, null, 'valid')).toBe('base valid');
    });

    it('handles arrays and objects', () => {
      expect(cn(['class1', 'class2'], { active: true, disabled: false }))
        .toBe('class1 class2 active');
    });
  });

  describe('createLogger', () => {
    beforeEach(() => {
      // Mock window.location to simulate development environment
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true
      });
    });

    it('creates a logger with namespace', () => {
      const logger = createLogger('test');
      expect(logger).toBeDefined();
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
    });

    it('logs with namespace prefix in development', () => {
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const logger = createLogger('test');
      
      logger.info('test info message');
      logger.debug('test debug message');
      logger.warn('test warn message');
      logger.error('test error message');
      
      expect(consoleInfoSpy).toHaveBeenCalledWith('test:', 'test info message');
      expect(consoleDebugSpy).toHaveBeenCalledWith('test:', 'test debug message');
      expect(consoleWarnSpy).toHaveBeenCalledWith('test:', 'test warn message');
      expect(consoleErrorSpy).toHaveBeenCalledWith('test:', 'test error message');
      
      consoleInfoSpy.mockRestore();
      consoleDebugSpy.mockRestore();
      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('suppresses debug and info logs in production', () => {
      // Mock production environment
      vi.stubEnv('NODE_ENV', 'production');
      
      // Mock import.meta.env for production 
      const originalEnv = import.meta.env;
      Object.defineProperty(import.meta, 'env', {
        value: {
          ...originalEnv,
          MODE: 'production',
          PROD: true,
          DEV: false
        },
        writable: true,
        configurable: true
      });
      
      Object.defineProperty(window, 'location', {
        value: { hostname: 'example.com' },
        writable: true
      });
      
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const logger = createLogger('test');
      
      logger.info('test info message');
      logger.debug('test debug message');
      logger.warn('test warn message');
      logger.error('test error message');
      
      // debug and info should not be called in production
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleDebugSpy).not.toHaveBeenCalled();
      
      // warn and error should still be called in production
      expect(consoleWarnSpy).toHaveBeenCalledWith('test:', 'test warn message');
      expect(consoleErrorSpy).toHaveBeenCalledWith('test:', 'test error message');
      
      consoleInfoSpy.mockRestore();
      consoleDebugSpy.mockRestore();
      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      
      // Restore original environment
      Object.defineProperty(import.meta, 'env', {
        value: originalEnv,
        writable: true,
        configurable: true
      });
    });

    it('handles multiple arguments', () => {
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      
      const logger = createLogger('test');
      logger.info('message', { data: 'test' }, 42);
      
      expect(consoleInfoSpy).toHaveBeenCalledWith('test:', 'message', { data: 'test' }, 42);
      
      consoleInfoSpy.mockRestore();
    });
  });

  describe('calculateSEOScore', () => {
    const createMockCheck = (passed: boolean, priority: 'high' | 'medium' | 'low') => ({
      title: `Test Check ${priority}`,
      description: `Test description for ${priority} priority check`,
      passed,
      priority
    });

    it('calculates score from analysis data', () => {
      const mockChecks = [
        createMockCheck(true, 'high'),
        createMockCheck(true, 'medium'),
        createMockCheck(true, 'low')
      ];

      const score = calculateSEOScore(mockChecks);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(typeof score).toBe('number');
    });

    it('handles missing data gracefully', () => {
      const mockChecks = [
        createMockCheck(true, 'high')
      ];

      const score = calculateSEOScore(mockChecks);
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('handles empty analysis', () => {
      const score = calculateSEOScore([]);
      expect(typeof score).toBe('number');
      expect(score).toBe(0);
    });

    it('calculates weighted scores correctly', () => {
      // All high priority checks passed should give 100%
      const allHighPassed = [
        createMockCheck(true, 'high'),
        createMockCheck(true, 'high')
      ];
      expect(calculateSEOScore(allHighPassed)).toBe(100);

      // Half high priority checks failed
      const halfHighFailed = [
        createMockCheck(true, 'high'),
        createMockCheck(false, 'high')
      ];
      expect(calculateSEOScore(halfHighFailed)).toBe(50);

      // Mix of priorities - should weight high priority more
      const mixedChecks = [
        createMockCheck(true, 'high'),    // weight 3, passed
        createMockCheck(false, 'medium'), // weight 2, failed
        createMockCheck(false, 'low')     // weight 1, failed
      ];
      // Total weight: 3 + 2 + 1 = 6
      // Passed weight: 3
      // Score: (3/6) * 100 = 50
      expect(calculateSEOScore(mixedChecks)).toBe(50);
    });

    it('handles all failed checks', () => {
      const allFailed = [
        createMockCheck(false, 'high'),
        createMockCheck(false, 'medium'),
        createMockCheck(false, 'low')
      ];
      expect(calculateSEOScore(allFailed)).toBe(0);
    });
  });

  describe('extractDomainFromUrl', () => {
    it('extracts domain from complete URL', () => {
      expect(extractDomainFromUrl('https://example.com/path')).toBe('example.com');
      expect(extractDomainFromUrl('http://subdomain.example.com')).toBe('subdomain.example.com');
    });

    it('handles URL without protocol', () => {
      expect(extractDomainFromUrl('example.com')).toBe('example.com');
      expect(extractDomainFromUrl('www.example.com/path')).toBe('www.example.com');
    });

    it('handles various URL formats', () => {
      // The function adds https:// protocol, so 'invalid-url' becomes a valid hostname
      expect(extractDomainFromUrl('invalid-url')).toBe('invalid-url');
      expect(extractDomainFromUrl('localhost')).toBe('localhost');
      expect(extractDomainFromUrl('192.168.1.1')).toBe('192.168.1.1');
    });

    it('handles empty string gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      expect(extractDomainFromUrl('')).toBe('');
      expect(consoleWarnSpy).toHaveBeenCalledWith('Invalid URL:', '');
      
      consoleWarnSpy.mockRestore();
    });

    it('handles malformed URLs that cause URL constructor to throw', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // These would cause URL constructor to throw even with protocol added
      expect(extractDomainFromUrl('://invalid')).toBe('');
      expect(extractDomainFromUrl('http://')).toBe('');
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('extractTextAfterColon', () => {
    it('extracts text after first colon', () => {
      expect(extractTextAfterColon('label: value')).toBe('value');
      expect(extractTextAfterColon('multiple: colons: here')).toBe('colons: here');
    });

    it('handles text without colon', () => {
      expect(extractTextAfterColon('no colon here')).toBe('no colon here');
    });

    it('handles empty and null values', () => {
      expect(extractTextAfterColon('')).toBe('');
      expect(extractTextAfterColon(null)).toBe('');
      expect(extractTextAfterColon(undefined)).toBe('');
    });

    it('trims whitespace', () => {
      expect(extractTextAfterColon('label:  value with spaces  ')).toBe('value with spaces');
      expect(extractTextAfterColon('   no colon but spaces   ')).toBe('no colon but spaces');
    });
  });
});
