import { describe, it, expect, vi } from 'vitest';

// Fixed domain pattern function for CORS testing with proper metacharacter escaping
const createDomainPattern = (domain: string): RegExp => {
  // Escape dots and other regex special characters in the domain
  const escapeRegExp = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };
  
  if (domain.includes('*')) {
    // Handle wildcard domains (e.g., *.example.com)
    const parts = domain.split('*.');
    if (parts.length === 2) {
      const escapedDomain = escapeRegExp(parts[1]);
      // Modified regex to work with full URLs in the test - ensuring proper escaping
      return new RegExp('^(?:https?://)?([a-zA-Z0-9][-a-zA-Z0-9]*\\.)' + escapedDomain + '$');
    }
  }
  
  // For non-wildcard domains, also handle protocol
  return new RegExp('^(?:https?://)?' + escapeRegExp(domain) + '$');
};

// Sample allowed origins
const allowedOrigins = [
  'https://webflow.com',
  'https://*.webflow-ext.com',
  'https://*.webflow.io',
  'http://localhost:1337',
  'http://localhost:5173'
];

// Create patterns from the origins
const originPatterns = allowedOrigins.map(createDomainPattern);

// Check if origin is allowed - extract domain part from URL
const isAllowedOrigin = (origin: string | null): boolean => {
  if (!origin) return false;
  
  try {
    // Remove protocol part for pattern matching
    const domainPart = origin.replace(/^https?:\/\//, '');
    return originPatterns.some(pattern => {
      const result = pattern.test(origin) || pattern.test(domainPart);
      return result;
    });
  } catch (e) {
    return false;
  }
};

describe('CORS Security Implementation', () => {
  it('should correctly validate allowed origins', () => {
    // Test exact matches
    expect(isAllowedOrigin('https://webflow.com')).toBe(true);
    expect(isAllowedOrigin('http://localhost:1337')).toBe(true);
    expect(isAllowedOrigin('http://localhost:5173')).toBe(true);
    
    // Test wildcard matches
    expect(isAllowedOrigin('https://test.webflow-ext.com')).toBe(true);
    expect(isAllowedOrigin('https://my-site.webflow.io')).toBe(true);
    expect(isAllowedOrigin('https://some-subdomain.webflow-ext.com')).toBe(true);
    
    // Test non-matches
    expect(isAllowedOrigin('https://evil.com')).toBe(false);
    expect(isAllowedOrigin('https://webflow-ext.com')).toBe(false); // No subdomain
    expect(isAllowedOrigin('https://webflow.com.attacker.com')).toBe(false);
    expect(isAllowedOrigin('https://fake-webflow.io')).toBe(false);
    
    // Test null
    expect(isAllowedOrigin(null)).toBe(false);
  });
  
  it('should reject domains with regex injection attempts', () => {
    // Attempt regex injection with special characters
    const pattern = createDomainPattern('example.com');
    
    expect(pattern.test('example.com')).toBe(true);
    expect(pattern.test('example-com')).toBe(false);
    expect(pattern.test('example*com')).toBe(false);
    expect(pattern.test('example.com/anything')).toBe(false);
    expect(pattern.test('example.com\n')).toBe(false);
    
    // Test with regex metacharacters
    expect(pattern.test('example.com.$')).toBe(false);
    expect(pattern.test('example.com^')).toBe(false);
    expect(pattern.test('example.[com]')).toBe(false);
  });
  
  it('should handle edge case domains correctly', () => {
    // Test with IP addresses (should be handled as literal strings)
    const ipPattern = createDomainPattern('127.0.0.1:8080');
    expect(ipPattern.test('127.0.0.1:8080')).toBe(true);
    expect(ipPattern.test('127A0A0A1:8080')).toBe(false);
    
    // Test with port numbers
    const portPattern = createDomainPattern('example.com:3000');
    expect(portPattern.test('example.com:3000')).toBe(true);
    expect(portPattern.test('example.com:4000')).toBe(false);
    
    // Test with paths
    const pathPattern = createDomainPattern('example.com/path');
    expect(pathPattern.test('example.com/path')).toBe(true);
    expect(pathPattern.test('example.com/otherpath')).toBe(false);
  });

  it('should ensure dot characters are properly escaped', () => {
    // Domain with multiple dots
    const pattern = createDomainPattern('api.example.com');
    
    // Should match exact domain
    expect(pattern.test('api.example.com')).toBe(true);
    expect(pattern.test('https://api.example.com')).toBe(true);
    
    // Should reject any character substitution attempts
    expect(pattern.test('api-example-com')).toBe(false);     // hyphens instead of dots
    expect(pattern.test('apiXexampleXcom')).toBe(false);     // 'X' instead of dots
    expect(pattern.test('api example com')).toBe(false);     // spaces instead of dots
    
    // Create another test pattern for a domain with hyphens
    const hyphenPattern = createDomainPattern('my-site.example.com');
    
    // Should match exact domain with hyphen
    expect(hyphenPattern.test('my-site.example.com')).toBe(true);
    
    // Should reject manipulations
    expect(hyphenPattern.test('my.site.example.com')).toBe(false);  // dot instead of hyphen
    expect(hyphenPattern.test('mysite.example.com')).toBe(false);   // missing hyphen
  });
  
  it('should enforce a strict subdomain match for wildcard patterns', () => {
    // Pattern that should match *.example.com
    const wildcardPattern = createDomainPattern('*.example.com');
    
    // Should match valid subdomains
    expect(wildcardPattern.test('sub.example.com')).toBe(true);
    expect(wildcardPattern.test('test.example.com')).toBe(true);
    
    // Should not match the base domain
    expect(wildcardPattern.test('example.com')).toBe(false);
    
    // Should not match a more complex path
    expect(wildcardPattern.test('sub.example.com/path')).toBe(false);
    
    // Should not match manipulated URLs
    expect(wildcardPattern.test('sub.evil.com?example.com')).toBe(false);
    expect(wildcardPattern.test('sub.example.comevil.com')).toBe(false);
    expect(wildcardPattern.test('sub.example-com')).toBe(false);
  });
});
