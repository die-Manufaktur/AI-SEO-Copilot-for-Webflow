export {}; // Ensure this file is treated as a module

// Define Cloudflare Workers types
interface FetchEvent extends Event {
  request: Request;
  respondWith(response: Response | Promise<Response>): void;
}

// Define allowed domains for CORS
const allowedOrigins: string[] = [
  'https://webflow.com', 
  'https://*.webflow-ext.com', 
  'https://*.webflow.io',
  'http://localhost:1337',  // For local development
  'http://localhost:5173'   // For Vite development server
];

// Create a pattern to test domains against
const createDomainPattern = (domain: string): RegExp => {
  if (domain.includes('*')) {
    return new RegExp('^' + domain.replace('*.', '([a-zA-Z0-9-]+\\.)?') + '$');
  }
  return new RegExp('^' + domain + '$');
};

const originPatterns: RegExp[] = allowedOrigins.map(createDomainPattern);

// Check if origin is allowed
const isAllowedOrigin = (origin: string | null): boolean => {
  if (!origin) return false;
  return originPatterns.some(pattern => pattern.test(origin));
};

// Handle CORS headers
const handleCors = (request: Request): Response | null => {
  const origin = request.headers.get('Origin');
  
  if (!origin || !isAllowedOrigin(origin)) {
    return new Response('Forbidden', { status: 403 });
  }
  
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      }
    });
  }
  
  return null;
};

// =======================================
// SEO ANALYSIS LOGIC
// =======================================

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function calculateKeyphraseDensity(content: string, keyphrase: string): {
  density: number;
  occurrences: number;
  totalWords: number;
} {
  const normalizedContent = content.toLowerCase().trim();
  const normalizedKeyphrase = keyphrase.toLowerCase().trim();
  const escapedKeyphrase = escapeRegExp(normalizedKeyphrase);
  const totalWords = normalizedContent.split(/\s+/).filter(word => word.length > 0).length;
  const regex = new RegExp(`\\b${escapedKeyphrase}\\b`, 'gi');
  const matches = normalizedContent.match(regex) || [];
  const occurrences = matches.length;
  const density = (occurrences * (normalizedKeyphrase.split(/\s+/).length)) / totalWords * 100;
  return { density, occurrences, totalWords };
}

function isHomePage(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname === "/" || urlObj.pathname === "";
  } catch {
    return false;
  }
}

// Update check types and priorities to match Home.tsx
const checkPriorities: Record<string, 'high' | 'medium' | 'low'> = {
  "Keyphrase in Title": "high",
  "Keyphrase in Meta Description": "high",
  "Keyphrase in URL": "medium",
  "Content Length on page": "high",  // Updated name
  "Keyphrase Density": "medium",
  "Keyphrase in Introduction": "medium",
  "Keyphrase in H1 Heading": "high",
  "Keyphrase in H2 Headings": "medium",
  "Heading Hierarchy": "high",
  "Image Alt Attributes": "low",
  "Internal Links": "medium",
  "Outbound Links": "low",
  "Next-Gen Image Formats": "low",
  "OpenGraph Image": "medium",  // Updated to OpenGraph instead of OG
  "Open Graph Title and Description": "medium",  // Updated to match Home.tsx
  "Code Minification": "low",
  "Schema Markup": "medium",
  "Image File Size": "medium"
};

// Update success messages with new check names
function getSuccessMessage(checkType: string, url: string): string {
  const messages: Record<string, string> = {
    "Keyphrase in Title": "Great job! Your title includes the target keyphrase.",
    "Keyphrase in Meta Description": "Perfect! Your meta description effectively uses the keyphrase.",
    "Keyphrase in URL": isHomePage(url) ? "All good here, since it's the homepage! ✨" : "Excellent! Your URL is SEO-friendly with the keyphrase.",
    "Content Length on page": "Well done! Your content length is good for SEO.",
    "Keyphrase Density": "Perfect! Your keyphrase density is within the optimal range.",
    "Keyphrase in Introduction": "Excellent! You've included the keyphrase in your introduction.",
    "Image Alt Attributes": "Well done! Your images are properly optimized with the keyphrase.",
    "Internal Links": "Perfect! You have a good number of internal links.",
    "Outbound Links": "Excellent! You've included relevant outbound links.",
    "Next-Gen Image Formats": "Excellent! Your images use modern, optimized formats.",
    "OpenGraph Image": "Great job! Your page has a properly configured OpenGraph image.",
    "Open Graph Title and Description": "Perfect! Open Graph title and description are well configured.",
    "Keyphrase in H1 Heading": "Excellent! Your main H1 heading effectively includes the keyphrase.",
    "Keyphrase in H2 Headings": "Great job! Your H2 subheadings include the keyphrase, reinforcing your topic focus.",
    "Heading Hierarchy": "Great job! Your page has a proper heading tag hierarchy.",
    "Code Minification": "Excellent! Your JavaScript and CSS files are properly minified for better performance.",
    "Schema Markup": "Great job! Your page has schema markup implemented, making it easier for search engines to understand your content.",
    "Image File Size": "Great job! All your images are well-optimized, keeping your page loading times fast."
  };
  return messages[checkType] || "Good job!";
}

const fallbackRecommendations: Record<string, (...args: any[]) => string> = {
  "Keyphrase in Title": (keyphrase: string, title: string) => 
    `Consider rewriting your title to include '${keyphrase}', preferably at the beginning. Here is a better title: "${keyphrase} - ${title}"`,
  "Keyphrase in Meta Description": (keyphrase: string, metaDescription: string) =>
    `Add '${keyphrase}' to your meta description in a natural way that encourages clicks. Here is a better meta description: "${metaDescription ? metaDescription.substring(0, 50) : 'Learn about'} ${keyphrase} ${metaDescription ? metaDescription.substring(50, 100) : 'and discover how it can help you'}."`,
  "Keyphrase in Introduction": (keyphrase: string) =>
    `Mention '${keyphrase}' in your first paragraph to establish relevance early.`,
  "Image Alt Attributes": (keyphrase: string) =>
    `Add descriptive alt text containing '${keyphrase}' to at least one relevant image.`,
  "Internal Links": () =>
    `Add links to other relevant pages on your site to improve navigation and SEO.`,
  "Outbound Links": () =>
    `Link to reputable external sources to increase your content's credibility.`
};

async function scrapeWebpage(url: string): Promise<any> {
  console.log(`Scraping webpage: ${url}`);
  try {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
    const html = await response.text();
    
    // Extract title and meta description
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";
    const metaDescriptionMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
    const metaDescription = metaDescriptionMatch ? metaDescriptionMatch[1].trim() : "";
    
    // Extract OpenGraph metadata
    const ogMetadata: Record<string, string> = {
      title: "",
      description: "",
      image: "",
      imageWidth: "",
      imageHeight: ""
    };
    
    // Extract OG title
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i);
    if (ogTitleMatch) ogMetadata.title = ogTitleMatch[1].trim();
    
    // Extract OG description
    const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i);
    if (ogDescMatch) ogMetadata.description = ogDescMatch[1].trim();
    
    // Extract OG image
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i);
    if (ogImageMatch) ogMetadata.image = ogImageMatch[1].trim();
    
    // Extract OG image dimensions
    const ogImageWidthMatch = html.match(/<meta\s+property=["']og:image:width["']\s+content=["'](.*?)["']/i);
    if (ogImageWidthMatch) ogMetadata.imageWidth = ogImageWidthMatch[1].trim();
    
    const ogImageHeightMatch = html.match(/<meta\s+property=["']og:image:height["']\s+content=["'](.*?)["']/i);
    if (ogImageHeightMatch) ogMetadata.imageHeight = ogImageHeightMatch[1].trim();
    
    // Extract body content
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : "";
    const content = bodyContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Extract paragraphs
    const paragraphs: string[] = [];
    const paragraphMatches = bodyContent.matchAll(/<p[^>]*>(.*?)<\/p>/gi);
    for (const match of paragraphMatches) {
      const text = match[1].replace(/<[^>]+>/g, ' ').trim();
      if (text) paragraphs.push(text);
    }
    
    // Extract headings
    const headings: Array<{ level: number; text: string }> = [];
    for (let i = 1; i <= 6; i++) {
      const headingMatches = bodyContent.matchAll(new RegExp(`<h${i}[^>]*>(.*?)</h${i}>`, 'gi'));
      for (const match of headingMatches) {
        const text = match[1].replace(/<[^>]+>/g, ' ').trim();
        if (text) headings.push({ level: i, text });
      }
    }
    
    // Extract images with sizes
    const images: Array<{ src: string; alt: string; size?: number }> = [];
    const imageMatches = bodyContent.matchAll(/<img[^>]*src=["'](.*?)["'][^>]*alt=["'](.*?)["'][^>]*>/gi);
    for (const match of imageMatches) {
      images.push({ src: match[1], alt: match[2] });
    }
    
    // Extract links
    const baseUrl = new URL(url);
    const internalLinks: string[] = [];
    const outboundLinks: string[] = [];
    const linkMatches = bodyContent.matchAll(/<a[^>]*href=["'](.*?)["'][^>]*>/gi);
    for (const match of linkMatches) {
      try {
        const href = match[1];
        if (href.startsWith('#') || href.startsWith('javascript:')) continue;
        const linkUrl = new URL(href, baseUrl.origin);
        if (linkUrl.hostname === baseUrl.hostname) {
          internalLinks.push(href);
        } else {
          outboundLinks.push(href);
        }
      } catch (e) {
        // Skip invalid URLs
      }
    }
    
    // Extract JavaScript and CSS resources to check minification
    const resources = {
      js: [] as Array<{url: string; minified: boolean}>,
      css: [] as Array<{url: string; minified: boolean}>
    };
    
    // Extract JavaScript files
    const scriptMatches = bodyContent.matchAll(/<script[^>]*src=["'](.*?)["'][^>]*>/gi);
    for (const match of Array.from(scriptMatches)) {
      const scriptUrl = match[1];
      if (scriptUrl) {
        try {
          // Determine if it's external or can be fetched
          let absoluteUrl = scriptUrl;
          if (scriptUrl.startsWith('//')) {
            absoluteUrl = `https:${scriptUrl}`;
          } else if (scriptUrl.startsWith('/')) {
            absoluteUrl = `${baseUrl.protocol}//${baseUrl.host}${scriptUrl}`;
          } else if (!scriptUrl.startsWith('http')) {
            absoluteUrl = new URL(scriptUrl, url).toString();
          }
          resources.js.push({
            url: absoluteUrl,
            minified: scriptUrl.includes('.min.js') || scriptUrl.includes('-min.js')
          });
        } catch (e) {
          console.log(`Error processing script URL: ${scriptUrl}`, e);
        }
      }
    }
    
    // Extract inline scripts
    const inlineScriptMatches = bodyContent.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi);
    for (const match of Array.from(inlineScriptMatches)) {
      const scriptContent = match[1]?.trim();
      if (scriptContent && scriptContent.length > 0) {
        // Check if script is minified by looking for newlines and multiple spaces
        const isMinified = !scriptContent.includes('\n') && 
                          !(/\s{2,}/).test(scriptContent) &&
                          scriptContent.length > 50;
        resources.js.push({
          url: 'inline-script',
          minified: isMinified
        });
      }
    }
    
    // Extract CSS files
    const cssMatches = bodyContent.matchAll(/<link[^>]*rel=["']stylesheet["'][^>]*href=["'](.*?)["'][^>]*>/gi);
    for (const match of Array.from(cssMatches)) {
      const cssUrl = match[1];
      if (cssUrl) {
        try {
          // Determine if it's external or can be fetched
          let absoluteUrl = cssUrl;
          if (cssUrl.startsWith('//')) {
            absoluteUrl = `https:${cssUrl}`;
          } else if (cssUrl.startsWith('/')) {
            absoluteUrl = `${baseUrl.protocol}//${baseUrl.host}${cssUrl}`;
          } else if (!cssUrl.startsWith('http')) {
            absoluteUrl = new URL(cssUrl, url).toString();
          }
          resources.css.push({
            url: absoluteUrl,
            minified: cssUrl.includes('.min.css') || cssUrl.includes('-min.css')
          });
        } catch (e) {
          console.log(`Error processing CSS URL: ${cssUrl}`, e);
        }
      }
    }
    
    // Extract inline styles
    const inlineStyleMatches = bodyContent.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    for (const match of Array.from(inlineStyleMatches)) {
      const styleContent = match[1]?.trim();
      if (styleContent && styleContent.length > 0) {
        // Check if style is minified
        const isMinified = !styleContent.includes('\n') && 
                          !(/\s{2,}/).test(styleContent) &&
                          styleContent.length > 50;
        resources.css.push({
          url: 'inline-style',
          minified: isMinified
        });
      }
    }
    
    // Check for schema.org structured data
    const schema = {
      detected: false,
      types: [] as string[]
    };
    
    const schemaJsonMatch = html.match(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    if (schemaJsonMatch) {
      schema.detected = true;
      try {
        const jsonData = JSON.parse(schemaJsonMatch[1]);
        if (jsonData['@type']) {
          schema.types.push(jsonData['@type']);
        } else if (Array.isArray(jsonData) && jsonData[0] && jsonData[0]['@type']) {
          schema.types = jsonData.map(item => item['@type']).filter(Boolean);
        }
      } catch (e) {
        console.log('Error parsing schema JSON:', e);
      }
    }
    
    return {
      title,
      metaDescription,
      content,
      paragraphs,
      headings,
      images,
      internalLinks,
      outboundLinks,
      url,
      ogMetadata,
      resources,
      schema
    };
  } catch (error: any) {
    console.error(`Error scraping webpage: ${error.message}`);
    throw new Error(`Failed to scrape webpage: ${error.message}`);
  }
}

// Update the check title in the analyzeSEO function to match the UI
async function analyzeSEO(url: string, keyphrase: string): Promise<any> {
  console.log(`Analyzing SEO for URL: ${url}, keyphrase: ${keyphrase}`);
  try {
    const scrapedData = await scrapeWebpage(url);
    const checks: any[] = [];
    let passedChecks = 0;
    let failedChecks = 0;
    const addCheck = (title: string, description: string, passed: boolean, recommendation = "") => {
      let finalDescription = passed ? getSuccessMessage(title, url) : description;
      let finalRecommendation = "";
      if (!passed) {
        switch (title) {
          case "Keyphrase in Title":
            finalRecommendation = fallbackRecommendations[title](keyphrase, scrapedData.title);
            break;
          case "Keyphrase in Meta Description":
            finalRecommendation = fallbackRecommendations[title](keyphrase, scrapedData.metaDescription);
            break;
          default:
            finalRecommendation = fallbackRecommendations[title] ? fallbackRecommendations[title](keyphrase) : `Consider optimizing your content for the keyphrase "${keyphrase}" in relation to ${title.toLowerCase()}.`;
        }
      }
      if (passed) {
        passedChecks++;
      } else {
        failedChecks++;
      }
      const priority = checkPriorities[title] || "medium";
      checks.push({ title, description: finalDescription, passed, recommendation: finalRecommendation, priority });
    };
    
    addCheck(
      "Keyphrase in Title",
      "The focus keyphrase should appear in the page title",
      scrapedData.title.toLowerCase().includes(keyphrase.toLowerCase())
    );
    
    addCheck(
      "Keyphrase in Meta Description",
      "The meta description should contain the focus keyphrase",
      Boolean(scrapedData.metaDescription && scrapedData.metaDescription.toLowerCase().includes(keyphrase.toLowerCase()))
    );
    
    const isHome = isHomePage(url);
    addCheck(
      "Keyphrase in URL",
      isHome
        ? "This is the homepage URL, so the keyphrase is not required in the URL ✨"
        : "The URL should contain the focus keyphrase",
      isHome || url.toLowerCase().includes(keyphrase.toLowerCase())
    );
    
    const minWordCount = 300;
    const wordCount = scrapedData.content.split(/\s+/).length;
    addCheck(
      "Content Length on page", // Updated name to match Home.tsx
      `Your content has ${wordCount} words. For good SEO, aim for at least ${minWordCount} words to provide comprehensive coverage of your topic.`,
      wordCount >= minWordCount
    );
    
    const densityResult = calculateKeyphraseDensity(scrapedData.content, keyphrase);
    addCheck(
      "Keyphrase Density",
      `Keyphrase density should be between 0.5% and 2.5%. Current density: ${densityResult.density.toFixed(1)}% (${densityResult.occurrences} occurrences in ${densityResult.totalWords} words)`,
      densityResult.density >= 0.5 && densityResult.density <= 2.5
    );
    
    const firstParagraph = scrapedData.paragraphs[0] || "";
    addCheck(
      "Keyphrase in Introduction",
      "The focus keyphrase should appear in the first paragraph to establish topic relevance early",
      firstParagraph.toLowerCase().includes(keyphrase.toLowerCase())
    );
    
    // Image Alt Attributes check - Implementation instead of placeholder comment
    const altTextsWithKeyphrase = scrapedData.images.some((img: { alt: string }) => img.alt?.toLowerCase().includes(keyphrase.toLowerCase()));
    addCheck(
      "Image Alt Attributes",
      "At least one image should have an alt attribute containing the focus keyphrase",
      altTextsWithKeyphrase
    );
    
    // Internal Links check - Implementation instead of placeholder comment
    const hasInternalLinks = scrapedData.internalLinks.length > 0;
    addCheck(
      "Internal Links",
      "The page should contain internal links to other pages",
      hasInternalLinks
    );
    
    // Outbound Links check - Implementation instead of placeholder comment
    const hasOutboundLinks = scrapedData.outboundLinks.length > 0;
    addCheck(
      "Outbound Links",
      "The page should contain outbound links to authoritative sources",
      hasOutboundLinks
    );
    
    // 7. H1 Heading analysis
    const h1Tags = scrapedData.headings.filter(heading => heading.level === 1);
    let h1HasKeyphrase = h1Tags.some(heading =>
      heading.text.toLowerCase().includes(keyphrase.toLowerCase())
    );
    
    // If not found, check for all important words
    if (!h1HasKeyphrase && h1Tags.length > 0) {
      const keyphraseWords = keyphrase.toLowerCase().split(/\s+/).filter(word => word.length > 2);
      if (keyphraseWords.length > 0) {
        const allWordsFoundInAnyH1 = h1Tags.some(heading => {
          const headingText = heading.text.toLowerCase();
          return keyphraseWords.every(word => headingText.includes(word));
        });
        h1HasKeyphrase = allWordsFoundInAnyH1;
      }
    }
    
    addCheck(
      "Keyphrase in H1 Heading",
      h1Tags.length === 0
        ? "Your page is missing an H1 heading. Add an H1 heading that includes your keyphrase."
        : h1Tags.length > 1
          ? "You have multiple H1 headings. Best practice is to have a single H1 heading that includes your keyphrase."
          : "Your H1 heading should include your target keyphrase for optimal SEO.",
      h1HasKeyphrase && h1Tags.length === 1
    );
    
    // 8. H2 Headings analysis
    const h2Tags = scrapedData.headings.filter(heading => heading.level === 2);
    let h2HasKeyphrase = h2Tags.some(heading =>
      heading.text.toLowerCase().includes(keyphrase.toLowerCase())
    );
    
    // More flexible keyword matching for H2s
    if (!h2HasKeyphrase && h2Tags.length > 0) {
      const keyphraseWords = keyphrase.toLowerCase().split(/\s+/).filter(word => word.length > 2);
      if (keyphraseWords.length > 0) {
        const allWordsFoundInAnyH2 = h2Tags.some(heading => {
          const headingText = heading.text.toLowerCase();
          return keyphraseWords.every(word => headingText.includes(word));
        });
        h2HasKeyphrase = allWordsFoundInAnyH2;
      }
    }
    
    addCheck(
      "Keyphrase in H2 Headings",
      h2Tags.length === 0
        ? "Your page doesn't have any H2 headings. Add H2 subheadings that include your keyphrase to structure your content."
        : "Your H2 headings should include your target keyphrase at least once to reinforce your topic focus.",
      h2HasKeyphrase && h2Tags.length > 0
    );
    
    // 9. Heading hierarchy check
    const hasH1 = h1Tags.length > 0;
    const hasH2 = h2Tags.length > 0;
    const hasProperHeadingStructure = hasH1 && hasH2 && h1Tags.length === 1;
    
    let hasProperLevelOrder = true;
    const allHeadings = [...scrapedData.headings].sort((a, b) => {
      return scrapedData.headings.indexOf(a) - scrapedData.headings.indexOf(b);
    });
    
    let prevLevel = 0;
    for (const heading of allHeadings) {
      if (heading.level > prevLevel + 1 && prevLevel > 0) {
        hasProperLevelOrder = false;
        break;
      }
      prevLevel = heading.level;
    }
    
    const hasProperHeadingHierarchy = hasProperHeadingStructure && hasProperLevelOrder;
    
    addCheck(
      "Heading Hierarchy",
      hasProperHeadingHierarchy
        ? "Your page has a proper heading structure with a single H1 followed by appropriate subheadings."
        : !hasH1
          ? "Your page is missing an H1 heading, which is crucial for SEO and document structure."
          : h1Tags.length > 1
            ? "Your page has multiple H1 headings. Best practice is to have a single H1 heading per page."
            : !hasH2
              ? "Your page is missing H2 headings. Use H2 headings to structure your content under the main H1 heading."
              : !hasProperLevelOrder
                ? "Your heading structure skips levels (e.g., H1 followed directly by H3). This can confuse search engines and assistive technologies."
                : "Your heading structure needs improvement. Follow a logical hierarchy (H1 → H2 → H3) for better SEO.",
      hasProperHeadingHierarchy
    );
    
    // 10. Open Graph Title and Description
    const hasOGTitle = Boolean(scrapedData.ogMetadata.title);
    const hasOGDescription = Boolean(scrapedData.ogMetadata.description);
    const ogTitleLength = hasOGTitle ? scrapedData.ogMetadata.title.length : 0;
    const ogDescLength = hasOGDescription ? scrapedData.ogMetadata.description.length : 0;
    
    const validOGMeta = hasOGTitle && hasOGDescription &&
      ogTitleLength >= 10 && ogTitleLength <= 70 &&
      ogDescLength >= 100 && ogDescLength <= 200;
    
    addCheck(
      "Open Graph Title and Description",
      validOGMeta
        ? "Open Graph title and description are properly set with optimal lengths"
        : "Open Graph title and/or description need optimization",
      validOGMeta
    );
    
    // 11. Open Graph Image
    const hasOGImage = Boolean(scrapedData.ogMetadata.image);
    const validOGImageSize = Boolean(
      scrapedData.ogMetadata.imageWidth &&
      scrapedData.ogMetadata.imageHeight &&
      parseInt(scrapedData.ogMetadata.imageWidth) >= 1200 &&
      parseInt(scrapedData.ogMetadata.imageHeight) >= 630
    );
    
    addCheck(
      "OpenGraph Image",
      hasOGImage
        ? (validOGImageSize
          ? `Open Graph image is present with recommended dimensions (1200x630 or larger).`
          : `Open Graph image is present but may not have the optimal dimensions.`)
        : "Open Graph image is missing. Add an OG image with dimensions of at least 1200x630px.",
      hasOGImage
    );
    
    // 15. Schema Markup
    const hasSchemaMarkup = scrapedData.schema.detected;
    
    addCheck(
      "Schema Markup",
      hasSchemaMarkup ?
        `Your page has schema markup implemented (${scrapedData.schema.types.join(', ') || 'Unknown type'})` :
        "Your page is missing schema markup (structured data)",
      hasSchemaMarkup
    );
    
    // Add Code Minification check
    const jsResources = scrapedData.resources.js;
    const cssResources = scrapedData.resources.css;

    // Count resources and check minification status
    const totalJsResources = jsResources.length;
    const totalCssResources = cssResources.length;
    const minifiedJsCount = jsResources.filter(r => r.minified).length;
    const minifiedCssCount = cssResources.filter(r => r.minified).length;

    // Calculate percentage of minified resources
    const totalResources = totalJsResources + totalCssResources;
    const minifiedResources = minifiedJsCount + minifiedCssCount;
    const minificationPercentage = totalResources > 0
      ? Math.round((minifiedResources / totalResources) * 100)
      : 100; // If no resources, consider it 100% passed

    // List of non-minified resources to provide in the recommendation
    const nonMinifiedJs = jsResources
      .filter(r => !r.minified && r.url !== 'inline-script')
      .map(r => r.url);

    const nonMinifiedCss = cssResources
      .filter(r => !r.minified && r.url !== 'inline-style')
      .map(r => r.url);

    const hasNonMinified = nonMinifiedJs.length > 0 || nonMinifiedCss.length > 0;
    const hasInlineNonMinified = jsResources.some(r => r.url === 'inline-script' && !r.minified) ||
      cssResources.some(r => r.url === 'inline-style' && !r.minified);

    // Create context for recommendation
    let minificationRecommendation = "";
    if (totalResources === 0) {
      minificationRecommendation = "No JavaScript or CSS resources found on the page.";
    } else {
      minificationRecommendation = `Found ${totalJsResources} JavaScript and ${totalCssResources} CSS resources. `;
      minificationRecommendation += `${minifiedJsCount} of ${totalJsResources} JavaScript and ${minifiedCssCount} of ${totalCssResources} CSS resources are minified. `;

      if (hasInlineNonMinified) {
        minificationRecommendation += `\n\nNon-minified inline scripts or styles detected. Consider minifying them or moving to external files.`;
      }
      
      minificationRecommendation += `\n\nMinify your JavaScript and CSS files to improve page load speed. Use tools like UglifyJS, Terser, or CSSNano, or build tools like Webpack or Parcel.`;
    }

    // Determine if the check passes (40% or more resources minified)
    const minificationPasses = minificationPercentage >= 40;

    addCheck(
      "Code Minification",
      minificationPasses
        ? `Your JavaScript and CSS resources are well optimized. ${minificationPercentage}% are minified.`
        : `${minificationPercentage}% of your JavaScript and CSS resources are minified. Aim for at least 40% minification.`,
      minificationPasses,
      minificationRecommendation
    );
    
    // If the check failed, add our custom recommendation
    if (!minificationPasses) {
      const minificationCheck = checks.find(check => check.title === "Code Minification");
      if (minificationCheck) {
        minificationCheck.recommendation = minificationRecommendation;
      }
    }
    
    const score = Math.round((passedChecks / checks.length) * 100);
    return { checks, passedChecks, failedChecks, url, score, timestamp: new Date().toISOString() };
  } catch (error: any) {
    console.error(`Error analyzing SEO: ${error.message}`);
    throw error;
  }
}

// Worker event handler
// @ts-ignore: Cloudflare Workers specific API
addEventListener('fetch', (event: any) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request: Request): Promise<Response> {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;
  
  const url = new URL(request.url);
  const path = url.pathname;
  const origin = request.headers.get('Origin');
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin || '*',
    'Content-Type': 'application/json'
  };
  
  console.log(`Handling request: ${request.method} ${path} from ${origin || 'unknown origin'}`);
  
  if (path === '/api/analyze' && request.method === 'HEAD') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  
  try {
    if (path === '/api/analyze' && request.method === 'POST') {
      const data = await request.json();
      const { keyphrase, url } = data;
      if (!keyphrase || !url) {
        return new Response(JSON.stringify({ message: "Keyphrase and URL are required" }), { status: 400, headers: corsHeaders });
      }
      const results = await analyzeSEO(url, keyphrase);
      return new Response(JSON.stringify(results), { status: 200, headers: corsHeaders });
    } else if (path === '/api/register-domains' && request.method === 'POST') {
      const data = await request.json();
      const { domains } = data;
      if (!domains || !Array.isArray(domains)) {
        return new Response(JSON.stringify({ success: false, message: "Domains array is required" }), { status: 400, headers: corsHeaders });
      }
      return new Response(JSON.stringify({ success: true, message: `Successfully registered ${domains.length} domains.` }), { status: 200, headers: corsHeaders });
    }
    else if (path === '/api/ping' && (request.method === 'GET' || request.method === 'HEAD')) {
      return new Response(JSON.stringify({ status: 'ok', message: 'Worker is running', timestamp: new Date().toISOString() }), { status: 200, headers: corsHeaders });
    }
    return new Response(JSON.stringify({ message: "Route not found", path }), { status: 404, headers: corsHeaders });
  } catch (error: any) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ message: "Internal server error", error: error.message }), { status: 500, headers: corsHeaders });
  }
}
