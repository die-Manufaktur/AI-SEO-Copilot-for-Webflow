import { URL } from "node:url";
import * as cheerio from 'cheerio';
import { ScrapedPageData, Resource } from '../../shared/types/index';

/**
 * Scrapes a web page for SEO-relevant content
 * @param url URL to scrape
 * @param keyphrase Target SEO keyphrase (for context)
 * @returns Structured page data
 */
export async function scrapeWebPage(url: string, keyphrase: string): Promise<ScrapedPageData> {
  try {
    console.log('[Web Scraper] Attempting to fetch URL:', url);
    
    // Try a HEAD request first to check if URL exists
    try {
      const headResponse = await fetch(url, { method: 'HEAD' });
      console.log('[Web Scraper] HEAD request status:', headResponse.status, headResponse.statusText);
    } catch (headError) {
      console.log('[Web Scraper] HEAD request failed:', headError);
    }
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Remove unwanted elements that interfere with content analysis
    removeUnwantedElements($);
    
    // Extract all SEO-relevant data
    const extractedData = extractPageData($, url);
    
    return extractedData;
  } catch (error) {
    console.error('[Web Scraper] Error scraping web page:', error);
    throw new Error(`Failed to analyze page: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Remove elements that interfere with content analysis
 */
function removeUnwantedElements($: cheerio.CheerioAPI): void {
  const elementsToRemove = [
    // Cookie and consent banners
    '.cookie-banner', '.cookie-consent', '#cookie-notice', '.cookie-policy', 
    '[class*="cookie"]', '[id*="cookie"]', '[aria-label*="cookie"]',
    
    // Chat widgets and support tools
    '.chat-widget', '.chatbot', '#intercom-container', '.crisp-client',
    '.livechat-widget', '.drift-widget', '.zendesk-chat',
    
    // Popups and modals
    '.popup', '.modal', '.notification-bar', '.promo-banner',
    '[role="dialog"]:not([aria-label*="content"])',
    '[aria-hidden="true"]'
  ];
  
  elementsToRemove.forEach(selector => {
    try {
      $(selector).remove();
    } catch (e) {
      // Silently continue if a selector fails
    }
  });
}

/**
 * Extract all SEO-relevant data from the page
 */
function extractPageData($: cheerio.CheerioAPI, url: string): ScrapedPageData {
  return {
    url,
    title: extractTitle($),
    metaDescription: extractMetaDescription($),
    headings: extractHeadings($),
    paragraphs: extractParagraphs($),
    images: extractImages($),
    internalLinks: extractInternalLinks($, url),
    outboundLinks: extractOutboundLinks($, url),
    resources: extractResources($),
    canonicalUrl: extractCanonicalUrl($, url),
    metaKeywords: extractMetaKeywords($),
    ogImage: extractOgImage($),
    content: extractBodyText($),
    schemaMarkup: extractSchemaMarkup($)
  };
}

/**
 * Extract page title with fallbacks
 */
function extractTitle($: cheerio.CheerioAPI): string {
  return $('title').text().trim() || 
         $('meta[property="og:title"]').attr('content') || 
         '';
}

/**
 * Extract meta description with fallbacks
 */
function extractMetaDescription($: cheerio.CheerioAPI): string {
  return $('meta[name="description"]').attr('content') || 
         $('meta[property="og:description"]').attr('content') || 
         '';
}

/**
 * Extract all headings with their levels
 */
function extractHeadings($: cheerio.CheerioAPI): Array<{level: number, text: string}> {
  const headings: Array<{level: number, text: string}> = [];
  
  $('h1, h2, h3, h4, h5, h6').each((_, element) => {
    if (element.type === 'tag') {
      const tagName = element.tagName?.toLowerCase();
      if (tagName && tagName.startsWith('h')) {
        const level = parseInt(tagName.substring(1), 10);
        headings.push({
          level,
          text: $(element).text().trim()
        });
      }
    }
  });
  
  return headings;
}

/**
 * Extract all paragraph text
 */
function extractParagraphs($: cheerio.CheerioAPI): string[] {
  const paragraphs: string[] = [];
  
  $('p').each((_, element) => {
    const text = $(element).text().trim();
    if (text) paragraphs.push(text);
  });
  
  return paragraphs;
}

/**
 * Extract all images with their metadata
 */
function extractImages($: cheerio.CheerioAPI): Array<{src: string, alt: string, size?: number}> {
  const images: Array<{src: string, alt: string, size?: number}> = [];
  
  $('img').each((_, element) => {
    const src = $(element).attr('src') || '';
    if (src) {
      images.push({
        src,
        alt: $(element).attr('alt') || '',
      });
    }
  });
  
  return images;
}

/**
 * Extract internal and outbound links
 */
function extractInternalLinks($: cheerio.CheerioAPI, url: string): string[] {
  const { internalLinks } = extractLinks($, url);
  return internalLinks;
}

function extractOutboundLinks($: cheerio.CheerioAPI, url: string): string[] {
  const { outboundLinks } = extractLinks($, url);
  return outboundLinks;
}

function extractLinks($: cheerio.CheerioAPI, url: string): {
  internalLinks: string[];
  outboundLinks: string[];
} {
  const internalLinks: string[] = [];
  const outboundLinks: string[] = [];
  
  const urlObj = new URL(url);
  const baseDomain = urlObj.hostname;
  
  $('a[href]').each((_, element) => {
    try {
      const href = $(element).attr('href') || '';
      const normalizedHref = href.trim().toLowerCase();
      
      // Skip invalid or non-HTTP links
      if (!href || 
          normalizedHref.startsWith('#') || 
          normalizedHref.startsWith('javascript:') || 
          normalizedHref.startsWith('data:') || 
          normalizedHref.startsWith('vbscript:')) {
        return;
      }
      
      let fullUrl;
      try {
        fullUrl = new URL(href, url).href;
      } catch {
        return;
      }
      
      const linkUrl = new URL(fullUrl);
      
      if (linkUrl.hostname === baseDomain) {
        internalLinks.push(fullUrl);
      } else {
        // Normalize external links by ensuring domain-only URLs have trailing slash
        const normalizedUrl = linkUrl.pathname === '/' && !fullUrl.endsWith('/') 
          ? fullUrl + '/' 
          : fullUrl;
        outboundLinks.push(normalizedUrl);
      }
    } catch (error) {
      // Skip invalid URLs
    }
  });
  
  return { internalLinks, outboundLinks };
}

/**
 * Extract JavaScript and CSS resources
 */
function extractResources($: cheerio.CheerioAPI): {js: Resource[], css: Resource[]} {
  const resources = {
    js: [] as Resource[],
    css: [] as Resource[]
  };
  
  // Extract JavaScript files
  $('script[src]').each((_, element) => {
    const src = $(element).attr('src');
    if (src) resources.js.push({ url: src });
  });
  
  // Extract CSS files
  $('link[rel="stylesheet"][href]').each((_, element) => {
    const href = $(element).attr('href');
    if (href) resources.css.push({ url: href });
  });
  
  return resources;
}

/**
 * Extract canonical URL
 */
function extractCanonicalUrl($: cheerio.CheerioAPI, fallbackUrl: string): string {
  return $('link[rel="canonical"]').attr('href') || fallbackUrl;
}

/**
 * Extract meta keywords
 */
function extractMetaKeywords($: cheerio.CheerioAPI): string {
  return $('meta[name="keywords"]').attr('content') || '';
}

/**
 * Extract Open Graph image
 */
function extractOgImage($: cheerio.CheerioAPI): string {
  return $('meta[property="og:image"]').attr('content') || '';
}

/**
 * Extract body text content
 */
function extractBodyText($: cheerio.CheerioAPI): string {
  return $('body').text().trim();
}

/**
 * Extract and parse schema markup
 */
function extractSchemaMarkup($: cheerio.CheerioAPI): {
  hasSchema: boolean;
  schemaTypes: string[];
  schemaCount: number;
  detected?: any[];
} {
  const schemaMarkup = {
    hasSchema: false,
    schemaTypes: [] as string[],
    schemaCount: 0,
    detected: []
  };
  
  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const json = JSON.parse($(element).html() || '{}');
      const schemaType = json['@type'];
      
      if (schemaType) {
        schemaMarkup.hasSchema = true;
        if (Array.isArray(schemaType)) {
          schemaMarkup.schemaTypes = [...schemaMarkup.schemaTypes, ...schemaType];
        } else {
          schemaMarkup.schemaTypes.push(schemaType);
        }
        schemaMarkup.schemaCount++;
      }
    } catch (error) {
      console.error('[Web Scraper] Error parsing JSON-LD schema:', error);
    }
  });
  
  return schemaMarkup;
}