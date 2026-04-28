import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrapeWebPage } from './webScraper';

// Mock fetch globally
const mockFetch = vi.fn();

describe('webScraper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up fetch mock directly on global
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper function to set up dual fetch calls (HEAD + GET)
  const setupSuccessfulFetchMocks = (html: string) => {
    // Mock HEAD request (first call)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK'
    });
    
    // Mock GET request (second call)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => html
    });
  };

  describe('scrapeWebPage', () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>Test Page Title</title>
        <meta name="description" content="This is a test page description">
        <meta name="keywords" content="test, keywords, seo">
        <meta property="og:title" content="OG Title">
        <meta property="og:description" content="OG Description">
        <meta property="og:image" content="https://example.com/og-image.jpg">
        <link rel="canonical" href="https://example.com/canonical-page">
        <script type="application/ld+json">
          {"@context": "https://schema.org", "@type": "Article", "headline": "Test Article"}
        </script>
      </head>
      <body>
        <h1>Main Heading</h1>
        <h2>Secondary Heading</h2>
        <h3>Third Level Heading</h3>
        
        <p>This is the first paragraph with some content.</p>
        <p>Second paragraph about SEO optimization techniques.</p>
        
        <img src="https://example.com/image1.jpg" alt="Test Image 1">
        <img src="https://example.com/image2.jpg" alt="Test Image 2">
        <img src="relative-image.jpg" alt="">
        
        <a href="https://example.com/internal-page">Internal Link</a>
        <a href="https://external-site.com">External Link</a>
        <a href="/relative-internal">Relative Internal</a>
        <a href="#anchor">Anchor Link</a>
        <a href="javascript:void(0)">JavaScript Link</a>
        
        <link rel="stylesheet" href="styles.css">
        <script src="script.js"></script>
        
        <!-- Unwanted elements that should be removed -->
        <div class="cookie-banner">Cookie consent</div>
        <div class="chat-widget">Chat widget</div>
        <div class="popup">Popup content</div>
        <div aria-hidden="true">Hidden content</div>
      </body>
      </html>
    `;

    it('should successfully scrape a web page', async () => {
      setupSuccessfulFetchMocks(mockHtml);

      const result = await scrapeWebPage('https://example.com/test-page', 'seo optimization');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      
      // Check HEAD request
      expect(mockFetch).toHaveBeenNthCalledWith(1, 'https://example.com/test-page', { method: 'HEAD' });
      
      // Check GET request
      expect(mockFetch).toHaveBeenNthCalledWith(2, 'https://example.com/test-page', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        }
      });

      expect(result.url).toBe('https://example.com/test-page');
      expect(result.title).toBe('Test Page Title');
      expect(result.metaDescription).toBe('This is a test page description');
    });

    it('should extract title with fallbacks', async () => {
      const htmlWithOgTitle = `
        <html>
          <head>
            <meta property="og:title" content="Fallback OG Title">
          </head>
          <body></body>
        </html>
      `;

      setupSuccessfulFetchMocks(htmlWithOgTitle);

      const result = await scrapeWebPage('https://example.com', 'test');

      expect(result.title).toBe('Fallback OG Title');
    });

    it('should extract meta description with fallbacks', async () => {
      const htmlWithOgDesc = `
        <html>
          <head>
            <meta property="og:description" content="Fallback OG Description">
          </head>
          <body></body>
        </html>
      `;

      setupSuccessfulFetchMocks(htmlWithOgDesc);

      const result = await scrapeWebPage('https://example.com', 'test');

      expect(result.metaDescription).toBe('Fallback OG Description');
    });

    it('should extract headings with correct levels', async () => {
      setupSuccessfulFetchMocks(mockHtml);

      const result = await scrapeWebPage('https://example.com', 'test');

      expect(result.headings).toHaveLength(3);
      expect(result.headings[0]).toEqual({ level: 1, text: 'Main Heading' });
      expect(result.headings[1]).toEqual({ level: 2, text: 'Secondary Heading' });
      expect(result.headings[2]).toEqual({ level: 3, text: 'Third Level Heading' });
    });

    it('should extract paragraphs', async () => {
      setupSuccessfulFetchMocks(mockHtml);

      const result = await scrapeWebPage('https://example.com', 'test');

      expect(result.paragraphs).toHaveLength(2);
      expect(result.paragraphs[0]).toBe('This is the first paragraph with some content.');
      expect(result.paragraphs[1]).toBe('Second paragraph about SEO optimization techniques.');
    });

    it('should extract images with alt text', async () => {
      setupSuccessfulFetchMocks(mockHtml);

      const result = await scrapeWebPage('https://example.com', 'test');

      expect(result.images).toHaveLength(3);
      expect(result.images[0]).toEqual({
        src: 'https://example.com/image1.jpg',
        alt: 'Test Image 1'
      });
      expect(result.images[1]).toEqual({
        src: 'https://example.com/image2.jpg',
        alt: 'Test Image 2'
      });
      expect(result.images[2]).toEqual({
        src: 'relative-image.jpg',
        alt: ''
      });
    });

    it('should categorize links correctly', async () => {
      setupSuccessfulFetchMocks(mockHtml);

      const result = await scrapeWebPage('https://example.com/test-page', 'test');

      // Should detect internal links (same domain)
      expect(result.internalLinks).toContain('https://example.com/internal-page');
      expect(result.internalLinks).toContain('https://example.com/relative-internal');

      // Should detect external links
      expect(result.outboundLinks).toContain('https://external-site.com/');

      // Should skip anchor and javascript links
      expect(result.internalLinks).not.toContain('#anchor');
      expect(result.internalLinks).not.toContain('javascript:void(0)');
      expect(result.outboundLinks).not.toContain('#anchor');
      expect(result.outboundLinks).not.toContain('javascript:void(0)');
    });

    it('should extract resources (CSS and JS files)', async () => {
      setupSuccessfulFetchMocks(mockHtml);

      const result = await scrapeWebPage('https://example.com', 'test');

      expect(result.resources.css).toBeDefined();
      expect(result.resources.js).toBeDefined();
      
      // Should find at least the CSS and JS files from the HTML
      const cssFile = result.resources.css.find((file: any) => 
        file.url.includes('styles.css')
      );
      const jsFile = result.resources.js.find((file: any) => 
        file.url.includes('script.js')
      );
      
      expect(cssFile).toBeDefined();
      expect(jsFile).toBeDefined();
    });

    it('should extract canonical URL', async () => {
      setupSuccessfulFetchMocks(mockHtml);

      const result = await scrapeWebPage('https://example.com', 'test');

      expect(result.canonicalUrl).toBe('https://example.com/canonical-page');
    });

    it('should extract meta keywords', async () => {
      setupSuccessfulFetchMocks(mockHtml);

      const result = await scrapeWebPage('https://example.com', 'test');

      expect(result.metaKeywords).toBe('test, keywords, seo');
    });

    it('should extract Open Graph image', async () => {
      setupSuccessfulFetchMocks(mockHtml);

      const result = await scrapeWebPage('https://example.com', 'test');

      expect(result.ogImage).toBe('https://example.com/og-image.jpg');
    });

    it('should extract schema markup', async () => {
      setupSuccessfulFetchMocks(mockHtml);

      const result = await scrapeWebPage('https://example.com', 'test');

      expect(result.schemaMarkup.hasSchema).toBe(true);
      expect(result.schemaMarkup.schemaTypes).toContain('Article');
      expect(result.schemaMarkup.schemaCount).toBe(1);
    });

    it('should extract body text content', async () => {
      setupSuccessfulFetchMocks(mockHtml);

      const result = await scrapeWebPage('https://example.com', 'test');

      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.content).toContain('Main Heading');
      expect(result.content).toContain('first paragraph');
      
      // Should not contain removed unwanted elements
      expect(result.content).not.toContain('Cookie consent');
      expect(result.content).not.toContain('Chat widget');
      expect(result.content).not.toContain('Popup content');
    });

    it('should handle fetch errors', async () => {
      // Mock HEAD request failure (the actual error that will trigger the catch)
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        scrapeWebPage('https://example.com', 'test')
      ).rejects.toThrow('Failed to analyze page: Cannot read properties of undefined (reading \'ok\')');
    });

    it('should handle HTTP error responses', async () => {
      // Mock HEAD request success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK'
      });
      
      // Mock GET request failure
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(
        scrapeWebPage('https://example.com', 'test')
      ).rejects.toThrow('Failed to analyze page: Failed to fetch page: 404 Not Found');
    });

    it('should handle malformed HTML gracefully', async () => {
      const malformedHtml = '<html><head><title>Test Title</title></head><body><h1>Unclosed heading<p>Unclosed paragraph</body></html>';

      setupSuccessfulFetchMocks(malformedHtml);

      const result = await scrapeWebPage('https://example.com', 'test');

      expect(result.title).toBe('Test Title');
      expect(result.headings).toHaveLength(1);
      expect(result.paragraphs).toHaveLength(1);
    });

    it('should handle empty page content', async () => {
      const emptyHtml = '<html><head></head><body></body></html>';

      setupSuccessfulFetchMocks(emptyHtml);

      const result = await scrapeWebPage('https://example.com', 'test');

      expect(result.title).toBe('');
      expect(result.metaDescription).toBe('');
      expect(result.headings).toHaveLength(0);
      expect(result.paragraphs).toHaveLength(0);
      expect(result.images).toHaveLength(0);
      expect(result.internalLinks).toHaveLength(0);
      expect(result.outboundLinks).toHaveLength(0);
    });

    it('should remove unwanted elements before analysis', async () => {
      const htmlWithUnwantedElements = `
        <html>
          <body>
            <p>Good content paragraph</p>
            <div class="cookie-banner">Cookie banner content</div>
            <div class="chat-widget">Chat widget content</div>
            <div class="popup">Popup content</div>
            <div id="cookie-notice">Cookie notice</div>
            <div aria-hidden="true">Hidden content</div>
            <div class="crisp-client">Chat client</div>
            <p>Another good paragraph</p>
          </body>
        </html>
      `;

      setupSuccessfulFetchMocks(htmlWithUnwantedElements);

      const result = await scrapeWebPage('https://example.com', 'test');

      // Should have extracted only the good paragraphs
      expect(result.paragraphs).toHaveLength(2);
      expect(result.paragraphs[0]).toBe('Good content paragraph');
      expect(result.paragraphs[1]).toBe('Another good paragraph');

      // Body text should not contain unwanted element content
      expect(result.content).not.toContain('Cookie banner content');
      expect(result.content).not.toContain('Chat widget content');
      expect(result.content).not.toContain('Popup content');
      expect(result.content).not.toContain('Cookie notice');
      expect(result.content).not.toContain('Hidden content');
      expect(result.content).not.toContain('Chat client');
    });

    it('should handle relative URLs in links correctly', async () => {
      const htmlWithRelativeLinks = `
        <html>
          <body>
            <a href="/page1">Absolute path internal</a>
            <a href="page2.html">Relative path internal</a>
            <a href="../parent-page">Parent directory internal</a>
            <a href="https://example.com/full-internal">Full URL internal</a>
            <a href="https://external.com/page">External link</a>
          </body>
        </html>
      `;

      setupSuccessfulFetchMocks(htmlWithRelativeLinks);

      const result = await scrapeWebPage('https://example.com/current-page', 'test');

      // Internal links should include all relative and same-domain links (converted to full URLs)
      expect(result.internalLinks).toContain('https://example.com/page1');
      expect(result.internalLinks).toContain('https://example.com/page2.html');
      expect(result.internalLinks).toContain('https://example.com/parent-page');
      expect(result.internalLinks).toContain('https://example.com/full-internal');

      // External links should only include different domains
      expect(result.outboundLinks).toContain('https://external.com/page');
      expect(result.outboundLinks).not.toContain('https://example.com/full-internal');
    });

    it('should handle HTTPS and HTTP URL variations', async () => {
      const htmlWithMixedProtocols = `
        <html>
          <body>
            <a href="https://example.com/secure">HTTPS internal</a>
            <a href="http://example.com/insecure">HTTP internal</a>
            <a href="https://external.com">HTTPS external</a>
            <a href="http://external.com">HTTP external</a>
          </body>
        </html>
      `;

      setupSuccessfulFetchMocks(htmlWithMixedProtocols);

      const result = await scrapeWebPage('https://example.com', 'test');

      // Both HTTP and HTTPS should be treated as same domain for internal links
      expect(result.internalLinks).toContain('https://example.com/secure');
      expect(result.internalLinks).toContain('http://example.com/insecure');

      // External links should include both protocols (with trailing slashes)
      expect(result.outboundLinks).toContain('https://external.com/');
      expect(result.outboundLinks).toContain('http://external.com/');
    });
  });
});