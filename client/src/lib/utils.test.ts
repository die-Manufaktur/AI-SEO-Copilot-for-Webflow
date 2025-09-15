import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cn, createLogger, extractDomainFromUrl, extractTextAfterColon } from './utils';

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

    it('handles empty inputs', () => {
      expect(cn()).toBe('');
      expect(cn('')).toBe('');
      expect(cn([])).toBe('');
      expect(cn({})).toBe('');
    });

    it('deduplicates and merges Tailwind classes', () => {
      // Test Tailwind class merging with conflicting utilities
      expect(cn('px-2 px-4')).toBe('px-4');
      expect(cn('text-sm text-lg')).toBe('text-lg');
      expect(cn('bg-red-500 bg-blue-500')).toBe('bg-blue-500');
    });

    it('handles complex nested combinations', () => {
      expect(cn(
        'base',
        ['array1', 'array2'],
        { conditional: true, hidden: false },
        null,
        undefined,
        'final'
      )).toBe('base array1 array2 conditional final');
    });

    it('handles numeric values', () => {
      expect(cn('base', 0, 1, 'valid')).toBe('base 1 valid');
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
      // Set up development environment like the other tests
      const originalEnv = import.meta.env;
      const originalNodeEnv = process.env.NODE_ENV;
      
      // Mock environment variables
      vi.stubEnv('NODE_ENV', 'development');
      Object.defineProperty(import.meta, 'env', {
        value: {
          ...originalEnv,
          MODE: 'development',
          PROD: false,
          DEV: true
        },
        writable: true,
        configurable: true
      });
      
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      
      const logger = createLogger('test');
      logger.info('message', { data: 'test' }, 42);
      
      expect(consoleInfoSpy).toHaveBeenCalledWith('test:', 'message', { data: 'test' }, 42);
      
      consoleInfoSpy.mockRestore();
      
      // Restore original environment
      vi.unstubAllEnvs();
      Object.defineProperty(import.meta, 'env', {
        value: originalEnv,
        writable: true,
        configurable: true
      });
    });

    it('handles empty namespace', () => {
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      
      const logger = createLogger('');
      logger.info('test message');
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(':', 'test message');
      
      consoleInfoSpy.mockRestore();
    });

    it('handles special characters in namespace', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const logger = createLogger('[API:v2.0]');
      logger.warn('test message');
      
      expect(consoleWarnSpy).toHaveBeenCalledWith('[API:v2.0]:', 'test message');
      
      consoleWarnSpy.mockRestore();
    });

    it('handles logger methods with no arguments', () => {
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const logger = createLogger('test');
      logger.info();
      logger.warn();
      
      expect(consoleInfoSpy).toHaveBeenCalledWith('test:');
      expect(consoleWarnSpy).toHaveBeenCalledWith('test:');
      
      consoleInfoSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('handles different production environment conditions', () => {
      // Test when NODE_ENV is production
      vi.stubEnv('NODE_ENV', 'production');
      
      const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const logger = createLogger('prod-test');
      logger.debug('should not appear');
      logger.error('should appear');
      
      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('prod-test:', 'should appear');
      
      consoleDebugSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      vi.unstubAllEnvs();
    });

    it('handles edge case when import.meta.env is undefined', () => {
      const originalEnv = import.meta.env;
      
      // Mock import.meta.env as undefined
      Object.defineProperty(import.meta, 'env', {
        value: undefined,
        writable: true,
        configurable: true
      });
      
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      
      const logger = createLogger('undefined-env');
      logger.info('test message');
      
      // When env is undefined, it should not be production, so info should be called
      expect(consoleInfoSpy).toHaveBeenCalledWith('undefined-env:', 'test message');
      
      consoleInfoSpy.mockRestore();
      
      // Restore original environment
      Object.defineProperty(import.meta, 'env', {
        value: originalEnv,
        writable: true,
        configurable: true
      });
    });

    it('logs objects and complex data types', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const logger = createLogger('complex-data');
      const complexData = { 
        user: { id: 1, name: 'test' }, 
        items: [1, 2, 3],
        metadata: new Date(),
        error: new Error('test error')
      };
      
      logger.error('Complex log', complexData, [1, 2, 3]);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('complex-data:', 'Complex log', complexData, [1, 2, 3]);
      
      consoleErrorSpy.mockRestore();
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

    it('handles URLs with ports and query parameters', () => {
      expect(extractDomainFromUrl('https://example.com:8080/path?query=value')).toBe('example.com:8080');
      expect(extractDomainFromUrl('http://localhost:3000')).toBe('localhost:3000');
    });

    it('handles international domain names', () => {
      // Note: URL constructor automatically converts international domains to punycode
      expect(extractDomainFromUrl('https://测试.中国')).toBe('xn--0zwm56d.xn--fiqs8s');
      expect(extractDomainFromUrl('https://xn--e1afmkfd.xn--p1ai')).toBe('xn--e1afmkfd.xn--p1ai'); // Valid punycode domain
    });

    it('handles edge case URLs with special characters', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Test various edge cases that might cause errors
      expect(extractDomainFromUrl('ftp://files.example.com')).toBe('files.example.com');
      expect(extractDomainFromUrl('https://user:pass@example.com')).toBe('example.com');
      expect(extractDomainFromUrl('about:blank')).toBe('');
      
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

    it('handles only colon character', () => {
      expect(extractTextAfterColon(':')).toBe('');
      expect(extractTextAfterColon(': ')).toBe('');
      expect(extractTextAfterColon('::')).toBe(':');
    });

    it('handles colon at the beginning', () => {
      expect(extractTextAfterColon(':value')).toBe('value');
      expect(extractTextAfterColon(': spaced value')).toBe('spaced value');
    });

    it('handles special characters and unicode', () => {
      expect(extractTextAfterColon('emoji: 🚀 rocket')).toBe('🚀 rocket');
      expect(extractTextAfterColon('unicode: 测试内容')).toBe('测试内容');
      expect(extractTextAfterColon('special: !@#$%^&*()')).toBe('!@#$%^&*()');
    });

    it('handles numbers and boolean-like values', () => {
      expect(extractTextAfterColon('count: 42')).toBe('42');
      expect(extractTextAfterColon('flag: true')).toBe('true');
      expect(extractTextAfterColon('decimal: 3.14159')).toBe('3.14159');
    });

    it('handles very long strings', () => {
      const longValue = 'a'.repeat(1000);
      expect(extractTextAfterColon(`key: ${longValue}`)).toBe(longValue);
    });

    it('handles non-string input edge cases', () => {
      // These test the type safety and null/undefined handling
      expect(extractTextAfterColon(null as any)).toBe('');
      expect(extractTextAfterColon(undefined as any)).toBe('');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles all utilities with extreme inputs', () => {
      // Test cn with maximum complexity
      const result = cn(
        'base-class',
        undefined,
        null,
        '',
        0,
        false,
        ['array1', 'array2', undefined],
        { active: true, disabled: false, hidden: null, visible: undefined },
        'final-class'
      );
      expect(result).toBe('base-class array1 array2 active final-class');
    });

    it('handles concurrent logger operations', () => {
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Create multiple loggers simultaneously
      const loggers = Array.from({ length: 5 }, (_, i) => createLogger(`concurrent-${i}`));
      
      // Log from all loggers simultaneously
      loggers.forEach((logger, i) => {
        logger.info(`Message from logger ${i}`);
        logger.error(`Error from logger ${i}`);
      });
      
      expect(consoleInfoSpy).toHaveBeenCalledTimes(5);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(5);
      
      consoleInfoSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('handles memory intensive operations', () => {
      // Test with large data structures
      const largeArray = Array.from({ length: 1000 }, (_, i) => `class-${i}`);
      const result = cn(...largeArray);
      expect(result).toContain('class-0');
      expect(result).toContain('class-999');
      expect(result.split(' ')).toHaveLength(1000);
    });
  });
});
