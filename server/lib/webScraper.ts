import { JSDOM } from "jsdom";

interface ScrapedData {
  title: string;
  metaDescription: string;
  content: string;
  paragraphs: string[];
  subheadings: string[];
  headings: Array<{ level: number; text: string }>;
  images: Array<{ 
    src: string; 
    alt: string; 
    size?: number;  // Image size in bytes
  }>;
  internalLinks: string[];
  outboundLinks: string[];
  ogMetadata: {
    title: string;
    description: string;
    image: string;
    imageWidth: string;
    imageHeight: string;
  };
  resources: {
    js: Array<{ url: string; content?: string; minified?: boolean }>;
    css: Array<{ url: string; content?: string; minified?: boolean }>;
  };
  schema: {
    detected: boolean;
    types: string[];
    jsonLdBlocks: any[];
    microdataTypes: string[];
  };
}

// Helper function to get image size
async function getImageSize(imageUrl: string, baseUrl: URL): Promise<number | undefined> {
  try {
    // Resolve relative URLs
    const fullUrl = new URL(imageUrl, baseUrl.origin).toString();

    // Make a HEAD request to get content-length without downloading the entire image
    const response = await fetch(fullUrl, { method: 'HEAD' });

    if (response.ok) {
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        return parseInt(contentLength, 10);
      }
    }

    return undefined;
  } catch (error) {
    console.log(`Error getting size for image ${imageUrl}:`, error);
    return undefined;
  }
}

export async function scrapeWebpage(url: string): Promise<ScrapedData> {
  // Add a default protocol if the URL does not have one
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `http://${url}`;
  }

  try {
    const response = await fetch(url);
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Get base URL for resolving relative links
    const baseUrl = new URL(url);

    // Extract meta information
    const title = document.querySelector("title")?.textContent?.trim() || "";
    const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute("content") || "";

    // Extract Open Graph metadata
    const ogMetadata = {
      title: document.querySelector('meta[property="og:title"]')?.getAttribute("content") || "",
      description: document.querySelector('meta[property="og:description"]')?.getAttribute("content") || "",
      image: document.querySelector('meta[property="og:image"]')?.getAttribute("content") || "",
      imageWidth: document.querySelector('meta[property="og:image:width"]')?.getAttribute("content") || "",
      imageHeight: document.querySelector('meta[property="og:image:height"]')?.getAttribute("content") || ""
    };

    // Get all text content
    const content = document.body.textContent?.trim() || "";

    console.log("Scraping paragraphs...");
    console.log("Total p tags found:", document.querySelectorAll("p").length);

    // Get paragraphs with more detailed selector and logging
    const allParagraphElements = document.querySelectorAll("article p, main p, .content p, #content p, .post-content p, p");
    console.log("Found elements with paragraph selectors:", allParagraphElements.length);

    const paragraphs = Array.from(allParagraphElements)
      .map((el: Element) => {
        const text = el.textContent?.trim() || "";
        const parentClass = el.parentElement?.getAttribute('class') || 'no-parent-class';
        console.log(`Paragraph found in ${parentClass}:`, text.substring(0, 100) + (text.length > 100 ? '...' : ''));
        return text;
      })
      .filter((text: string) => text.length > 0);

    console.log(`After filtering, found ${paragraphs.length} non-empty paragraphs`);
    if (paragraphs.length > 0) {
      console.log("First paragraph content:", paragraphs[0]);
    } else {
      console.log("No valid paragraphs found");
    }

    // Get subheadings
    const subheadings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"))
      .map((el: Element) => el.textContent?.trim() || "")
      .filter((text: string) => text.length > 0);

    // Get headings with their levels
    const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"))
      .map((el: Element) => {
        const tagName = el.tagName.toLowerCase();
        const level = parseInt(tagName.substring(1), 10); // Extract the number from "h1", "h2", etc.
        return {
          level,
          text: el.textContent?.trim() || ""
        };
      })
      .filter((heading: { level: number; text: string }) => heading.text.length > 0);

    // Get images with alt text
    const imageElements = Array.from(document.querySelectorAll("img"))
      .map((el: Element) => ({
        src: el.getAttribute("src") || "",
        alt: el.getAttribute("alt") || "",
      }));

    // Get image sizes (in parallel)
    const images = await Promise.all(
      imageElements.map(async (img: { src: string; alt: string }) => {
        if (!img.src) return img;

        const size = await getImageSize(img.src, baseUrl);
        return {
          ...img,
          size
        };
      })
    );

    // Get internal and outbound links
    const internalLinks: string[] = [];
    const outboundLinks: string[] = [];

    document.querySelectorAll("a[href]").forEach((el: Element) => {
      const href = el.getAttribute("href");
      if (!href) return;

      try {
        const linkUrl = new URL(href, baseUrl.origin);
        if (linkUrl.hostname === baseUrl.hostname) {
          internalLinks.push(href);
        } else {
          outboundLinks.push(href);
        }
      } catch (error: any) {
        // Invalid URL, skip
      }
    });

    // Extract JavaScript and CSS resources
    const jsResources: Array<{ url: string; content?: string; minified?: boolean }> = [];
    const cssResources: Array<{ url: string; content?: string; minified?: boolean }> = [];

    // Collect script sources
    document.querySelectorAll("script[src]").forEach((el: Element) => {
      const src = el.getAttribute("src");
      if (src) {
        try {
          const fullUrl = new URL(src, baseUrl.origin).toString();
          jsResources.push({ url: fullUrl });
        } catch (error) {
          // Invalid URL, skip
        }
      }
    });

    // Collect stylesheet links
    document.querySelectorAll("link[rel='stylesheet']").forEach((el: Element) => {
      const href = el.getAttribute("href");
      if (href) {
        try {
          const fullUrl = new URL(href, baseUrl.origin).toString();
          cssResources.push({ url: fullUrl });
        } catch (error) {
          // Invalid URL, skip
        }
      }
    });

    // Also look for inline styles
    document.querySelectorAll("style").forEach((el: Element) => {
      const content = el.textContent;
      if (content && content.trim()) {
        cssResources.push({ 
          url: 'inline-style',
          content: content.trim(),
          minified: isMinified(content.trim())
        });
      }
    });

    // Look for inline scripts
    document.querySelectorAll("script:not([src])").forEach((el: Element) => {
      const content = el.textContent;
      if (content && content.trim()) {
        jsResources.push({ 
          url: 'inline-script',
          content: content.trim(),
          minified: isMinified(content.trim())
        });
      }
    });

    // Extract schema markup
    // 1. Look for JSON-LD
    const jsonLdBlocks: any[] = [];
    document.querySelectorAll('script[type="application/ld+json"]').forEach((el: Element) => {
      try {
        const jsonContent = el.textContent;
        if (jsonContent) {
          const parsed = JSON.parse(jsonContent);
          jsonLdBlocks.push(parsed);
        }
      } catch (error) {
        console.log("Error parsing JSON-LD:", error);
      }
    });

    // 2. Look for Microdata
    const microdataTypes: string[] = [];
    document.querySelectorAll('[itemscope]').forEach((el: Element) => {
      const itemtype = el.getAttribute('itemtype');
      if (itemtype) {
        try {
          // Extract the schema type from the URL (e.g., http://schema.org/Product -> Product)
          const match = itemtype.match(/schema\.org\/([a-zA-Z]+)/);
          if (match && match[1]) {
            microdataTypes.push(match[1]);
          } else {
            microdataTypes.push(itemtype);
          }
        } catch (error) {
          console.log("Error extracting microdata type:", error);
        }
      }
    });

    // Combine all schema types
    const schemaTypes = new Set<string>();

    // Add types from JSON-LD
    jsonLdBlocks.forEach(block => {
      if (block['@type']) {
        if (Array.isArray(block['@type'])) {
          block['@type'].forEach((type: string) => schemaTypes.add(type));
        } else {
          schemaTypes.add(block['@type']);
        }
      }
    });

    // Add types from Microdata
    microdataTypes.forEach(type => schemaTypes.add(type));

    return {
      title,
      metaDescription,
      content,
      paragraphs,
      subheadings,
      headings,
      images,
      internalLinks,
      outboundLinks,
      ogMetadata,
      resources: {
        js: jsResources,
        css: cssResources
      },
      schema: {
        detected: jsonLdBlocks.length > 0 || microdataTypes.length > 0,
        types: Array.from(schemaTypes),
        jsonLdBlocks,
        microdataTypes
      }
    };
  } catch (error: any) {
    console.error("Failed to scrape webpage:", error);
    throw new Error(`Failed to scrape webpage: ${error.message}`);
  }
}

// Helper function to determine if a code snippet is minified
function isMinified(code: string): boolean {
  if (!code || code.length < 50) return true; // Too short to analyze

  // Check for multiple newlines (non-minified code typically has many)
  const newlineRatio = (code.match(/\n/g) || []).length / code.length;

  // Check for excessive whitespace
  const whitespaceRatio = (code.match(/\s/g) || []).length / code.length;

  // Check for long lines (minified code typically has very long lines)
  const lines = code.split('\n').filter(line => line.trim().length > 0);
  let avgLineLength = 0;
  if (lines.length > 0) {
    avgLineLength = code.length / lines.length;
  }

  // Content with very few newlines, low whitespace ratio and long average line lengths is likely minified
  return (newlineRatio < 0.01 && whitespaceRatio < 0.15) || avgLineLength > 500;
}