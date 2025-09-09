import { describe, it, expect, vi } from 'vitest';
import { corsMiddleware } from './cors';

// Mock Hono's cors function
vi.mock('hono/cors', () => ({
  cors: vi.fn((config) => {
    // Return a middleware-like function that we can inspect
    return {
      config,
      // Simulate middleware behavior
      handle: (origin: string) => config.origin(origin)
    };
  })
}));

describe('corsMiddleware - Security Tests', () => {
  describe('wildcard pattern backslash escaping', () => {
    it('should properly escape backslashes in wildcard patterns', () => {
      const middleware = corsMiddleware({
        allowedOrigins: ['api\\*.example.com', 'test\\domain*.org']
      });
      
      // Access the origin function from the mocked cors config
      const originHandler = (middleware as any).config.origin;
      
      // Test that patterns with backslashes are handled correctly
      // The backslash should be escaped and not interfere with regex
      expect(originHandler('api\\test.example.com')).toBe('api\\test.example.com');
      expect(originHandler('api.test.example.com')).toBeNull();
      expect(originHandler('test\\domaintest.org')).toBe('test\\domaintest.org');
    });

    it('should handle multiple backslashes correctly', () => {
      const middleware = corsMiddleware({
        allowedOrigins: ['*.example\\\\test.com']
      });
      
      const originHandler = (middleware as any).config.origin;
      
      // Should match domains with literal backslashes
      expect(originHandler('sub.example\\\\test.com')).toBe('sub.example\\\\test.com');
      expect(originHandler('sub.exampletest.com')).toBeNull();
    });

    it('should handle mixed special characters with backslashes', () => {
      const middleware = corsMiddleware({
        allowedOrigins: ['api\\.*.example\\.com']
      });
      
      const originHandler = (middleware as any).config.origin;
      
      // Should properly escape both backslashes and dots
      expect(originHandler('api\\.test.example\\.com')).toBe('api\\.test.example\\.com');
      expect(originHandler('api.test.example.com')).toBeNull();
    });
  });

  describe('standard wildcard pattern matching', () => {
    it('should handle basic wildcard patterns', () => {
      const middleware = corsMiddleware({
        allowedOrigins: ['*.example.com', 'api.*.test.org']
      });
      
      const originHandler = (middleware as any).config.origin;
      
      expect(originHandler('sub.example.com')).toBe('sub.example.com');
      expect(originHandler('api.v1.test.org')).toBe('api.v1.test.org');
      expect(originHandler('other.domain.com')).toBeNull();
    });

    it('should handle exact matches without wildcards', () => {
      const middleware = corsMiddleware({
        allowedOrigins: ['https://app.example.com', 'http://localhost:3000']
      });
      
      const originHandler = (middleware as any).config.origin;
      
      expect(originHandler('https://app.example.com')).toBe('https://app.example.com');
      expect(originHandler('http://localhost:3000')).toBe('http://localhost:3000');
      expect(originHandler('https://other.example.com')).toBeNull();
    });

    it('should properly escape dots in patterns', () => {
      const middleware = corsMiddleware({
        allowedOrigins: ['api.example.com', '*.example.com']
      });
      
      const originHandler = (middleware as any).config.origin;
      
      // Exact match should work
      expect(originHandler('api.example.com')).toBe('api.example.com');
      
      // Wildcard should work
      expect(originHandler('sub.example.com')).toBe('sub.example.com');
      
      // Should not match if dots aren't properly escaped (this would match if dots weren't escaped)
      expect(originHandler('apitexampleecom')).toBeNull();
    });
  });

  describe('built-in Webflow domain handling', () => {
    it('should allow Webflow extension domains', () => {
      const middleware = corsMiddleware();
      const originHandler = (middleware as any).config.origin;
      
      expect(originHandler('https://app.webflow-ext.com')).toBe('https://app.webflow-ext.com');
      expect(originHandler('https://preview.webflow.io')).toBe('https://preview.webflow.io');
      expect(originHandler('https://webflow.com')).toBe('https://webflow.com');
    });

    it('should allow localhost for development', () => {
      const middleware = corsMiddleware();
      const originHandler = (middleware as any).config.origin;
      
      expect(originHandler('http://localhost:3000')).toBe('http://localhost:3000');
      expect(originHandler('https://localhost:8080')).toBe('https://localhost:8080');
      expect(originHandler('http://127.0.0.1:3000')).toBe('http://127.0.0.1:3000');
    });
  });

  describe('edge cases and security', () => {
    it('should handle empty origin list', () => {
      const middleware = corsMiddleware({
        allowedOrigins: []
      });
      
      const originHandler = (middleware as any).config.origin;
      
      // Should still allow Webflow domains but reject others
      expect(originHandler('https://webflow.com')).toBe('https://webflow.com');
      expect(originHandler('https://malicious.com')).toBeNull();
    });

    it('should handle null/undefined origin', () => {
      const middleware = corsMiddleware();
      const originHandler = (middleware as any).config.origin;
      
      // No origin should default to webflow.com
      expect(originHandler(null)).toBe('https://webflow.com');
      expect(originHandler(undefined)).toBe('https://webflow.com');
    });

    it('should reject malicious patterns that could exploit regex', () => {
      const middleware = corsMiddleware({
        allowedOrigins: ['*.example.com']
      });
      
      const originHandler = (middleware as any).config.origin;
      
      // These should not match due to proper escaping
      expect(originHandler('malicious.example(com')).toBeNull();
      expect(originHandler('test.example[.]com')).toBeNull();
      expect(originHandler('hack.example\\.com')).toBeNull();
    });
  });
});