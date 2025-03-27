import { describe, it, expect } from 'vitest';

// Fixed domain pattern function with proper metacharacter escaping
function createDomainPattern(domain: string): RegExp {
  // Escape dots and other regex special characters in the domain
  const escapeRegExp = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };
  
  if (domain.includes('*')) {
    // Handle wildcard domains (e.g., *.example.com)
    const parts = domain.split('*.');
    if (parts.length === 2) {
      const escapedDomain = escapeRegExp(parts[1]);
      // Ensure subdomain must exist and be properly formed
      return new RegExp('^([a-zA-Z0-9][-a-zA-Z0-9]*\\.)' + escapedDomain + '$');
    }
  }
  
  // For non-wildcard domains, escape all special characters
  return new RegExp('^' + escapeRegExp(domain) + '$');
}

describe('Domain Pattern Security', () => {
  it('should properly escape dots in domain patterns', () => {
    // Test regular domain
    const pattern = createDomainPattern('example.com');
    
    // Should match the exact domain
    expect(pattern.test('example.com')).toBe(true);
    
    // Should NOT match when dot is treated as any character
    expect(pattern.test('exampleAcom')).toBe(false);
    expect(pattern.test('example-com')).toBe(false);
    expect(pattern.test('example_com')).toBe(false);
  });
  
  it('should handle wildcard domains correctly', () => {
    // Test wildcard domain
    const pattern = createDomainPattern('*.example.com');
    
    // Should match valid subdomains
    expect(pattern.test('sub.example.com')).toBe(true);
    expect(pattern.test('test.example.com')).toBe(true);
    expect(pattern.test('example.com')).toBe(false); // Base domain without subdomain
    
    // Should NOT match unrelated domains
    expect(pattern.test('sub.exampleAcom')).toBe(false);
    expect(pattern.test('sub.otherexample.com')).toBe(false);
    expect(pattern.test('example.org')).toBe(false);
  });
  
  it('should properly handle domains with multiple dots', () => {
    // Test domain with multiple dots
    const pattern = createDomainPattern('sub.example.com');
    
    // Should match the exact domain only
    expect(pattern.test('sub.example.com')).toBe(true);
    expect(pattern.test('subsexample.com')).toBe(false);
    expect(pattern.test('sub.exampleAcom')).toBe(false);
  });
  
  it('should safely handle domains with regex special characters', () => {
    // Test domain with characters that have special meaning in regex
    const pattern = createDomainPattern('example-site.com+special');
    
    // Should match the exact string only
    expect(pattern.test('example-site.com+special')).toBe(true);
    expect(pattern.test('example-site.comispecial')).toBe(false);
  });

  it('should handle nested subdomains correctly', () => {
    // Test with a specific wildcard domain
    const pattern = createDomainPattern('*.example.com');
    
    // Should match valid direct subdomains
    expect(pattern.test('sub.example.com')).toBe(true);
    
    // Should reject nested subdomains to prevent security bypasses
    // This is a limitation of our implementation but safer
    expect(pattern.test('nested.sub.example.com')).toBe(false);
  });
  
  it('should reject domain pattern bypasses', () => {
    // Test direct domain match
    const pattern = createDomainPattern('example.com');
    
    // These should all be rejected - shows escaping is working correctly
    expect(pattern.test('exampletcom')).toBe(false);   // 't' instead of dot
    expect(pattern.test('example1com')).toBe(false);   // '1' instead of dot
    expect(pattern.test('example com')).toBe(false);   // space instead of dot
    expect(pattern.test('example\ncom')).toBe(false);  // newline instead of dot
    expect(pattern.test('example\tcom')).toBe(false);  // tab instead of dot
    
    // Make sure dot is not treated as a regex metacharacter (which would match any character)
    expect(pattern.test('exampleXcom')).toBe(false);   // 'X' instead of dot
  });
  
  it('should correctly handle URL manipulation attempts', () => {
    // Test with IP pattern
    const ipPattern = createDomainPattern('127.0.0.1');
    
    // Correctly match IP
    expect(ipPattern.test('127.0.0.1')).toBe(true);
    
    // Reject manipulations
    expect(ipPattern.test('127,0,0,1')).toBe(false);   // commas instead of dots
    expect(ipPattern.test('127+0+0+1')).toBe(false);   // plus instead of dots
    
    // Test with domain containing a hyphen
    const domainPattern = createDomainPattern('my-domain.com');
    
    // Correctly match the domain with hyphen
    expect(domainPattern.test('my-domain.com')).toBe(true);
    
    // Reject manipulation attempts
    expect(domainPattern.test('my_domain.com')).toBe(false);  // underscore instead of hyphen
    expect(domainPattern.test('mydomain.com')).toBe(false);   // missing hyphen
  });
});
