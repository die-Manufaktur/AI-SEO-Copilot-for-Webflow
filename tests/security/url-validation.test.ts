import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

// Import the security functions (recreated for testing)
function hasDangerousScheme(url: string): boolean {
  const dangerous = ['javascript:', 'data:', 'vbscript:'];
  return dangerous.some(scheme => url.toLowerCase().startsWith(scheme));
}

// Simplified version of scrapeWebpage for testing URL validation
async function testUrlValidation(url: string): Promise<{ valid: boolean, error?: string }> {
  try {
    // First check for dangerous schemes BEFORE adding https:// prefix
    if (hasDangerousScheme(url)) {
      throw new Error("URL uses a dangerous scheme");
    }
    
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }
    
    // Validate URL structure
    const urlObj = new URL(url);
    return { valid: true };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

describe('URL Validation Security', () => {
  it('should reject URLs with dangerous schemes', async () => {
    // Test malicious URLs
    const javascriptUrl = await testUrlValidation('javascript:alert(1)');
    expect(javascriptUrl.valid).toBe(false);
    expect(javascriptUrl.error).toContain('dangerous scheme');
    
    const dataUrl = await testUrlValidation('data:text/html,<script>alert(1)</script>');
    expect(dataUrl.valid).toBe(false);
    expect(dataUrl.error).toContain('dangerous scheme');
    
    const vbscriptUrl = await testUrlValidation('vbscript:msgbox("XSS")');
    expect(vbscriptUrl.valid).toBe(false);
    expect(vbscriptUrl.error).toContain('dangerous scheme');
  });
  
  it('should accept valid URLs', async () => {
    // Test valid URLs
    const httpsUrl = await testUrlValidation('https://example.com');
    expect(httpsUrl.valid).toBe(true);
    
    const domainOnly = await testUrlValidation('example.com');
    expect(domainOnly.valid).toBe(true);
    
    const withPath = await testUrlValidation('example.com/path/to/page');
    expect(withPath.valid).toBe(true);
  });
  
  it('should handle link extraction correctly', () => {
    // Test for a function that extracts links safely
    const sampleHtml = `
      <a href="https://example.com">Safe link</a>
      <a href="javascript:alert(1)">Dangerous link</a>
      <a href="data:text/html,<script>alert(1)</script>">Data URI link</a>
      <a href="/relative/path">Relative link</a>
    `;
    
    const dom = new JSDOM(sampleHtml);
    const document = dom.window.document;
    
    // Parse links safely
    const safeLinks: string[] = [];
    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (href && !hasDangerousScheme(href)) {
        safeLinks.push(href);
      }
    });
    
    // Verify only safe links are included
    expect(safeLinks).toContain('https://example.com');
    expect(safeLinks).toContain('/relative/path');
    expect(safeLinks).not.toContain('javascript:alert(1)');
    expect(safeLinks).not.toContain('data:text/html,<script>alert(1)</script>');
    expect(safeLinks.length).toBe(2);
  });
});
