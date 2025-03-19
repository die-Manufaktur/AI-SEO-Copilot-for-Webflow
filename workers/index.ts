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

const checkPriorities: Record<string, 'high' | 'medium' | 'low'> = {
  "Keyphrase in Title": "high",
  "Keyphrase in Meta Description": "high",
  "Keyphrase in URL": "medium",
  "Content Length": "high",
  "Keyphrase Density": "medium",
  "Keyphrase in Introduction": "medium",
  "Image Alt Attributes": "low",
  "Internal Links": "medium",
  "Outbound Links": "low"
};

function getSuccessMessage(checkType: string, url: string): string {
  const messages: Record<string, string> = {
    "Keyphrase in Title": "Great job! Your title includes the target keyphrase.",
    "Keyphrase in Meta Description": "Perfect! Your meta description effectively uses the keyphrase.",
    "Keyphrase in URL": isHomePage(url) ? "All good here, since it's the homepage! ✨" : "Excellent! Your URL is SEO-friendly with the keyphrase.",
    "Content Length": "Well done! Your content length is good for SEO.",
    "Keyphrase Density": "Perfect! Your keyphrase density is within the optimal range.",
    "Keyphrase in Introduction": "Excellent! You've included the keyphrase in your introduction.",
    "Image Alt Attributes": "Well done! Your images are properly optimized with the keyphrase.",
    "Internal Links": "Perfect! You have a good number of internal links.",
    "Outbound Links": "Excellent! You've included relevant outbound links."
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
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";
    const metaDescriptionMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
    const metaDescription = metaDescriptionMatch ? metaDescriptionMatch[1].trim() : "";
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : "";
    const content = bodyContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const paragraphs: string[] = [];
    const paragraphMatches = bodyContent.matchAll(/<p[^>]*>(.*?)<\/p>/gi);
    for (const match of paragraphMatches) {
      const text = match[1].replace(/<[^>]+>/g, ' ').trim();
      if (text) paragraphs.push(text);
    }
    const images: Array<{ src: string; alt: string }> = [];
    const imageMatches = bodyContent.matchAll(/<img[^>]*src=["'](.*?)["'][^>]*alt=["'](.*?)["'][^>]*>/gi);
    for (const match of imageMatches) {
      images.push({ src: match[1], alt: match[2] });
    }
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
    return {
      title,
      metaDescription,
      content,
      paragraphs,
      images,
      internalLinks,
      outboundLinks,
      url
    };
  } catch (error: any) {
    console.error(`Error scraping webpage: ${error.message}`);
    throw new Error(`Failed to scrape webpage: ${error.message}`);
  }
}

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
      "Content Length",
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
    
    const altTextsWithKeyphrase = scrapedData.images.some((img: { alt: string }) => img.alt?.toLowerCase().includes(keyphrase.toLowerCase()));
    addCheck(
      "Image Alt Attributes",
      "At least one image should have an alt attribute containing the focus keyphrase",
      altTextsWithKeyphrase
    );
    
    const hasInternalLinks = scrapedData.internalLinks.length > 0;
    addCheck(
      "Internal Links",
      "The page should contain internal links to other pages",
      hasInternalLinks
    );
    
    const hasOutboundLinks = scrapedData.outboundLinks.length > 0;
    addCheck(
      "Outbound Links",
      "The page should contain outbound links to authoritative sources",
      hasOutboundLinks
    );
    
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
