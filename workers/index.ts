// ===== Imports =====
import OpenAI from 'openai';
import * as ip from "ip";
import IPCIDR from "ip-cidr";
import { URL } from "url";

export {}; // Ensure this file is treated as a module

// ===== Types & Interfaces =====
interface FetchEvent extends Event {
  request: Request;
  respondWith(response: Response | Promise<Response>): void;
}

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
    size?: number;
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

// ===== Constants =====
const ALLOWED_DOMAINS = [
  "example.com",
  "pull-list.net",
  "*.pull-list.net",
  "www.pmds.pull-list.net",
  "pmds.pull-list.net"
];

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

// Helper function to fetch OAuth token
async function fetchOAuthToken(code: string, env: any): Promise<string> {
  const clientId = env.WEBFLOW_CLIENT_ID;
  const clientSecret = env.WEBFLOW_CLIENT_SECRET;
  const redirectUri = env.WEBFLOW_REDIRECT_URI;

  const response = await fetch('https://api.webflow.com/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch OAuth token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Endpoint to handle OAuth token exchange
async function handleOAuthTokenExchange(request: Request, env: any): Promise<Response> {
  try {
    const { code } = await request.json();
    if (!code) {
      return new Response(JSON.stringify({ error: 'Missing authorization code' }), { status: 400 });
    }

    const token = await fetchOAuthToken(code, env);
    return new Response(JSON.stringify({ token }), { status: 200 });
  } catch (error) {
    console.error('Error handling OAuth token exchange:', error);
    return new Response(JSON.stringify({ error: 'Failed to exchange OAuth token' }), { status: 500 });
  }
}

// Endpoint to create and redirect to the authorization link
async function handleAuthRedirect(request: Request, env: any): Promise<Response> {
  try {
    // Manually construct the Webflow OAuth URL
    const authorizeUrl = new URL('https://webflow.com/oauth/authorize');
    authorizeUrl.searchParams.append('response_type', 'code');
    authorizeUrl.searchParams.append('client_id', env.WEBFLOW_CLIENT_ID);
    authorizeUrl.searchParams.append('redirect_uri', env.WEBFLOW_REDIRECT_URI);
    authorizeUrl.searchParams.append('scope', 'sites:read');
    authorizeUrl.searchParams.append('state', env.STATE);
    
    return Response.redirect(authorizeUrl.toString(), 302);
  } catch (error) {
    console.error('Error creating authorization link:', error);
    return new Response(JSON.stringify({ error: 'Failed to create authorization link' }), { status: 500 });
  }
}

// Endpoint to handle the callback from Webflow
async function handleAuthCallback(request: Request, env: any): Promise<Response> {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code) {
      return new Response(JSON.stringify({ error: 'Missing authorization code' }), { status: 400 });
    }

    if (state !== env.STATE) {
      return new Response(JSON.stringify({ error: 'State does not match' }), { status: 400 });
    }

    // Exchange the authorization code for an access token
    const token = await fetchOAuthToken(code, env);

    // Cache the access token securely (e.g., using KV storage)
    await env.TOKENS.put('user-access-token', token);

    return new Response(JSON.stringify({ message: 'Authorization code received', token }), { status: 200 });
  } catch (error) {
    console.error('Error handling auth callback:', error);
    return new Response(JSON.stringify({ error: 'Failed to handle auth callback' }), { status: 500 });
  }
}

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
      js: [] as Array<{url: string; content?: string; minified?: boolean }> ,
      css: [] as Array<{url: string; content?: string; minified?: boolean}>
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

          // Fetch the content of the script
          const scriptResponse = await fetch(absoluteUrl);
          const scriptContent = scriptResponse.ok ? await scriptResponse.text() : '';

          resources.js.push({
            url: absoluteUrl,
            content: scriptContent,
            minified: scriptUrl.includes('.min.js') || scriptUrl.includes('-min.js')
          });
        } catch (e) {
          console.log(`Error processing script URL: ${scriptUrl}`, e);
        }
      }
    }
    
    // Extract inline scripts - replace sanitizeHtml with manual extraction
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
          content: scriptContent,
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

          // Fetch the content of the CSS
          const cssResponse = await fetch(absoluteUrl);
          const cssContent = cssResponse.ok ? await cssResponse.text() : '';

          resources.css.push({
            url: absoluteUrl,
            content: cssContent,
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
          content: styleContent,
          minified: isMinified
        });
      }
    }
    
    // Check for schema.org structured data
    const schema = {
      detected: false,
      types: [] as string[],
      jsonLdBlocks: [] as any[],
      microdataTypes: [] as string[]
    };
    
    // Extract JSON-LD schema
    const schemaJsonMatches = bodyContent.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    for (const match of schemaJsonMatches) {
      try {
        const jsonData = JSON.parse(match[1]);
        schema.detected = true;
        schema.jsonLdBlocks.push(jsonData);
        if (jsonData['@type']) {
          schema.types.push(jsonData['@type']);
        } else if (Array.isArray(jsonData)) {
          jsonData.forEach(item => {
            if (item && item['@type']) {
              schema.types.push(item['@type']);
            }
          });
        }
      } catch (e) {
        console.log('Error parsing schema JSON:', e);
      }
    }
    
    // Extract Microdata schema
    const microdataMatches = bodyContent.matchAll(/<[^>]+\s+itemscope[^>]*>/gi);
    for (const match of microdataMatches) {
      const itemTypeMatch = match[0].match(/itemtype=["'](.*?)["']/i);
      if (itemTypeMatch) {
        schema.detected = true;
        const types = itemTypeMatch[1].split(/\s+/).filter(Boolean);
        schema.microdataTypes.push(...types);
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
async function analyzeSEO(url: string, keyphrase: string, env: any): Promise<any> {
  try {
    console.log(`Analyzing SEO for URL: ${url} with keyphrase: ${keyphrase}`);
    
    // Instead of using approaches that require vm.runInContext, let's use a more
    // Cloudflare Worker-friendly approach to fetch and analyze the content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    
    // Pass the env parameter to analyzeSEOElements
    const results = await analyzeSEOElements(url, keyphrase, env);
    
    // Add the HTML content to the results for additional client-side processing if needed
    return {
      ...results,
      url,
      keyphrase
    };
  } catch (error: unknown) {
    console.error(`Error analyzing SEO:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to analyze SEO: ${errorMessage}`);
  }
}

// Worker event handler
// @ts-ignore: Cloudflare Workers specific API
addEventListener('fetch', (event: any) => {
  event.respondWith(handleRequest(event.request, event.env));
});

async function handleRequest(request: Request, env: any): Promise<Response> {
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

  if (path === '/api/oauth/callback' && request.method === 'POST') {
    return handleOAuthTokenExchange(request, env);
  }

  if (path === '/api/auth' && request.method === 'GET') {
    return handleAuthRedirect(request, env);
  }

  if (path === '/api/callback' && request.method === 'GET') {
    return handleAuthCallback(request, env);
  }
  
  try {
    if (path === '/api/analyze' && request.method === 'POST') {
      const data = await request.json();
      const { keyphrase, url } = data;
      if (!keyphrase || !url) {
        return new Response(JSON.stringify({ message: "Keyphrase and URL are required" }), { status: 400, headers: corsHeaders });
      }
      const results = await analyzeSEO(url, keyphrase, env);
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
      const pingResponse = {
        status: 'ok',
        message: 'Worker is running',
        timestamp: new Date().toISOString()
      }
      return new Response(JSON.stringify(pingResponse), { 
        status: 200, 
        headers: { 
          ...corsHeaders,
          'Cache-Control': 'public, max-age=60'  // Cache for 60 seconds 
        } 
      });
    }
    return new Response(JSON.stringify({ message: "Route not found", path }), { status: 404, headers: corsHeaders });
  } catch (error: any) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ message: "Internal server error", error: error.message }), { status: 500, headers: corsHeaders });
  }
}

// ===== Begin Security Functions (moved from server\lib\security.ts) =====

const ENFORCE_ALLOWLIST = process.env.ENFORCE_DOMAIN_ALLOWLIST !== 'false';

export function addDomainToAllowlist(domain: string): boolean {
  domain = domain.toLowerCase().trim();
  if (ALLOWED_DOMAINS.includes(domain)) {
    console.log(`Domain already in allowlist: ${domain}`);
    return false;
  }
  ALLOWED_DOMAINS.push(domain);
  console.log(`Added ${domain} to allowlist. Current list has ${ALLOWED_DOMAINS.length} domains.`);
  return true;
}

export function getAllowedDomains(): string[] {
  return [...ALLOWED_DOMAINS];
}

function isIPv4Format(address: string): boolean {
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  if (!ipv4Regex.test(address)) return false;
  const octets = address.split('.').map(Number);
  return octets.every(octet => octet >= 0 && octet <= 255);
}

function isIPv6Format(address: string): boolean {
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  return ipv6Regex.test(address);
}

export function isValidUrl(urlString: string): boolean {
  try {
    if (!/^https?:\/\//i.test(urlString)) {
      urlString = 'https://' + urlString;
    } else if (/^http:\/\//i.test(urlString)) {
      urlString = urlString.replace(/^http:/i, 'https:');
    }
    const url = new URL(urlString);
    if (url.protocol !== 'https:') {
      console.log(`Rejected non-HTTPS URL: ${urlString}`);
      return false;
    }
    if (ENFORCE_ALLOWLIST && !isAllowedDomain(url.hostname)) {
      console.warn(`Domain not in allowlist: ${url.hostname}`);
      return false;
    }
    const pathname = url.pathname;
    if (pathname.includes('../') || pathname.includes('/..')) {
      console.warn(`Path traversal detected in URL path: ${pathname}`);
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}

export function isAllowedDomain(domain: string): boolean {
  if (!ENFORCE_ALLOWLIST) return true;
  if (ALLOWED_DOMAINS.length === 0) return true;
  domain = domain.toLowerCase();
  console.log(`Checking if domain '${domain}' is in allowlist:`, JSON.stringify(ALLOWED_DOMAINS));
  if (ALLOWED_DOMAINS.includes(domain)) {
    console.log(`Domain '${domain}' found in allowlist (exact match)`);
    return true;
  }
  const matchedWildcard = ALLOWED_DOMAINS.find(allowedDomain => {
    if (allowedDomain.startsWith('*.')) {
      const baseDomain = allowedDomain.substring(2);
      const matches = domain.endsWith(baseDomain) && domain.length > baseDomain.length;
      if (matches) console.log(`Domain '${domain}' matches wildcard '${allowedDomain}'`);
      return matches;
    }
    return false;
  });
  return !!matchedWildcard;
}

export function validateIPAddress(address: string): boolean {
  if (!address) return false;
  let normalizedAddr: string;
  try {
    if (isIPv4Format(address)) {
      try {
        const buffer = ip.toBuffer(address);
        normalizedAddr = ip.toString(buffer);
      } catch (e) {
        normalizedAddr = address;
      }
    } else if (isIPv6Format(address)) {
      normalizedAddr = address;
    } else {
      return false;
    }
  } catch (e) {
    return false;
  }
  
  if (
    normalizedAddr === '127.0.0.1' || 
    normalizedAddr.startsWith('127.') || 
    normalizedAddr === '::1' ||
    normalizedAddr.toLowerCase().includes('127.0.0.1') ||
    normalizedAddr.toLowerCase().includes('::1')
  ) {
    return false;
  }
  
  try {
    return ip.isPublic(normalizedAddr);
  } catch (e) {
    return !isPrivateIP(normalizedAddr);
  }
}

export function validateUrl(url: string): boolean {
  try {
    console.log(`validateUrl - Checking URL: ${url}`);
    const urlObj = new URL(url);
    const protocol = urlObj.protocol.toLowerCase();
    console.log(`validateUrl - Protocol detected: ${protocol}`);
    if (protocol !== 'https:') {
      console.log(`Rejected non-HTTPS URL in validateUrl: ${url}`);
      return false;
    }
    const hostname = urlObj.hostname;
    console.log(`validateUrl - Hostname: ${hostname}`);
    if (ENFORCE_ALLOWLIST && !isAllowedDomain(hostname)) {
      console.warn(`Domain not in allowlist: ${hostname}`);
      return false;
    }
    console.log(`validateUrl - Domain allowlist check passed`);
    if (isIPv4Format(hostname) || isIPv6Format(hostname)) {
      console.log(`validateUrl - Hostname is an IP address: ${hostname}`);
      const ipValid = validateIPAddress(hostname);
      console.log(`validateUrl - IP validation result: ${ipValid}`);
      return ipValid;
    }
    console.log(`validateUrl - Validation successful for: ${url}`);
    return true;
  } catch (e) {
    console.error(`validateUrl - Error validating URL: ${e}`);
    return false;
  }
}

export function isPrivateIP(ipStr: string): boolean {
  const privateRanges = [
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    '127.0.0.0/8',
    '169.254.0.0/16'
  ];
  return privateRanges.some(range => {
    try {
      const cidr = new IPCIDR(range);
      return cidr.contains(ipStr);
    } catch (error) {
      console.error(`Error checking IP range ${range}:`, error);
      return false;
    }
  });
}

const hasValidOpenAIKey = (env: any): boolean =>
  !!env.OPENAI_API_KEY && ('' + env.OPENAI_API_KEY).startsWith('sk-')

// Update getGPTRecommendation to use env binding for configuration and instantiate OpenAI locally
export async function getGPTRecommendation(
  checkType: string,
  keyphrase: string,
  env: any,  // env binding
  context?: string
): Promise<string> {
  const useGPT = env.USE_GPT_RECOMMENDATIONS !== 'false'
  if (!useGPT || !hasValidOpenAIKey(env)) {
    console.log("GPT recommendations are disabled or API key is invalid")
    return "GPT recommendations are currently disabled. Enable them by setting USE_GPT_RECOMMENDATIONS=true and providing a valid OPENAI_API_KEY."
  }

  // Use local client instance instead of global variable
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY })

  try {
    const cacheKey = `${checkType}_${keyphrase}_${context?.substring(0, 50) || ''}`
    const truncatedContext = context && context.length > 300 
      ? context.substring(0, 300) + "..." 
      : context

    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an SEO expert providing concise, actionable recommendations.
Keep responses under 100 words.
Format: "Here is a better [element]: [example]"
Avoid quotation marks.`
        },
        {
          role: "user",
          content: `Fix this SEO issue: "${checkType}" for keyphrase "${keyphrase}".
${truncatedContext ? `Current content: ${truncatedContext}` : ''}`
        }
      ],
      max_tokens: 100,
      temperature: 0.5,
    })
    const recommendation = response.choices[0].message.content?.trim() || 
      "Unable to generate recommendation at this time."
    // ...update cache accordingly...
    return recommendation
  } catch (error: any) {
    console.error("GPT API Error:", error)
    if (error.status === 401) {
      return "API key error. Please check your OpenAI API key and ensure it's valid."
    }
    return "Unable to generate recommendation. Please try again later."
  }
}

// Helper functions (if not already defined or updated from existing versions)
function escapeRegExpFromAnalyzer(str: string): string {
	// $& means the whole matched string
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function calculateKeyphraseDensityFromAnalyzer(
	content: string,
	keyphrase: string
): { density: number; occurrences: number; totalWords: number } {
	const normalizedContent = content.toLowerCase().trim();
	const normalizedKeyphrase = keyphrase.toLowerCase().trim();
	const escapedKeyphrase = escapeRegExpFromAnalyzer(normalizedKeyphrase);
	const totalWords = normalizedContent.split(/\s+/).filter(word => word.length > 0).length;
	const regex = new RegExp(`\\b${escapedKeyphrase}\\b`, 'gi');
	const matches = normalizedContent.match(regex) || [];
	const occurrences = matches.length;
	const density = (occurrences * (normalizedKeyphrase.split(/\s+/).length)) / totalWords * 100;
	return { density, occurrences, totalWords };
}

function isHomePageFromAnalyzer(url: string): boolean {
  console.log(`Checking if homepage: ${url}`);
  try {
    const urlObj = new URL(url);
    const result = urlObj.pathname === "/" || urlObj.pathname === "";
    console.log(`Homepage check result: ${result}`);
    return result;
  } catch {
    console.log(`Homepage check failed for URL: ${url}`);
    return false;
  }
}

// Seo analyzer constants
const analyzerCheckPriorities: Record<string, 'high' | 'medium' | 'low'> = {
	"Keyphrase in Title": "high",
	"Keyphrase in Meta Description": "high",
	"Keyphrase in URL": "medium",
	"Content Length": "high",
	"Keyphrase Density": "medium",
	"Keyphrase in Introduction": "medium",
	"Image Alt Attributes": "low",
	"Internal Links": "medium",
	"Outbound Links": "low",
	"Next-Gen Image Formats": "low",
	"OG Image": "medium",
	"OG Title and Description": "medium",
	"Keyphrase in H1 Heading": "high",
	"Keyphrase in H2 Headings": "medium",
	"Heading Hierarchy": "high",
	"Code Minification": "low",
	"Schema Markup": "medium",
	"Image File Size": "medium"
};

const analyzerFallbackRecommendations: Record<string, (params: any) => string> = {
	"Keyphrase in Title": ({ keyphrase, title }) =>
		`Consider rewriting your title to include '${keyphrase}', preferably at the beginning.`,
	"Keyphrase in Meta Description": ({ keyphrase }) =>
		`Add '${keyphrase}' to your meta description naturally to boost click-through rates.`,
	"Keyphrase in Introduction": ({ keyphrase }) =>
		`Mention '${keyphrase}' in your first paragraph to establish relevance early.`,
	// ... add additional fallback recommendations as needed ...
};

export async function analyzeSEOElements(url: string, keyphrase: string, env: any) {
    console.log(`[SEO Analyzer] Starting analysis for URL: ${url} with keyphrase: ${keyphrase}`);
    const startTime = Date.now();

    try {
        const scrapedData = await scrapeWebpage(url);
        const checks: any[] = [];
        let passedChecks = 0, failedChecks = 0;

        // Helper to add a check (with GPT integration if available)
        const addCheck = async (
            title: string,
            description: string,
            passed: boolean,
            context?: string,
            skipRecommendation = false
        ) => {
            let recommendation = "";
            if (!passed && !skipRecommendation) {
                try {
                    recommendation = await getGPTRecommendation(title, keyphrase, env, context);
                } catch (error) {
                    recommendation = analyzerFallbackRecommendations[title]
                        ? analyzerFallbackRecommendations[title]({ keyphrase })
                        : `Consider optimizing your content for "${keyphrase}" in relation to ${title.toLowerCase()}.`;
                }
            }
            const successDescription = passed ? getSuccessMessage(title, url) : description;
            const priority = analyzerCheckPriorities[title] || "medium";
            checks.push({ title, description: successDescription, passed, recommendation, priority });
            passed ? passedChecks++ : failedChecks++;
        };

        // 1. Title Analysis
        await addCheck(
            "Keyphrase in Title",
            "The page title should contain the focus keyphrase.",
            scrapedData.title.toLowerCase().includes(keyphrase.toLowerCase()),
            scrapedData.title
        );

        // 2. Meta Description Analysis
        await addCheck(
            "Keyphrase in Meta Description",
            "The meta description should contain the focus keyphrase.",
            scrapedData.metaDescription.toLowerCase().includes(keyphrase.toLowerCase()),
            scrapedData.metaDescription
        );

        // 3. URL Analysis
        await addCheck(
            "Keyphrase in URL",
            "The URL should contain the focus keyphrase when appropriate.",
            isHomePageFromAnalyzer(url) || url.toLowerCase().includes(keyphrase.toLowerCase()),
            url
        );

        // 4. Content Length Check
        const wordCount = scrapedData.content.split(/\s+/).filter(Boolean).length;
        await addCheck(
            "Content Length on page",
            "The content should be at least 300 words long.",
            wordCount >= 300,
            `Current word count: ${wordCount}`
        );

        // 5. Keyphrase Density
        const { density } = calculateKeyphraseDensity(scrapedData.content, keyphrase);
        await addCheck(
            "Keyphrase Density",
            "Keyphrase density should be between 1% and 3%.",
            density >= 1 && density <= 3,
            `Current density: ${density.toFixed(1)}%`
        );

        // 6. Headings Analysis
        const h1s = scrapedData.headings.filter((h: { level: number; text: string }) => h.level === 1);
        const h2s = scrapedData.headings.filter((h: { level: number; text: string }) => h.level === 2);
        
        await addCheck(
            "Keyphrase in H1 Heading",
            "The main heading (H1) should contain the focus keyphrase.",
            h1s.some((h: { level: number; text: string }) => h.text.toLowerCase().includes(keyphrase.toLowerCase())),
            h1s.map((h: { level: number; text: string }) => h.text).join(', ')
        );

        // 7. OpenGraph Tags
        await addCheck(
            "Open Graph Title and Description",
            "OpenGraph meta tags should be present and optimized.",
            Boolean(scrapedData.ogMetadata.title && scrapedData.ogMetadata.description),
            JSON.stringify(scrapedData.ogMetadata)
        );

        // 8. Image Analysis
        await addCheck(
            "Image Alt Attributes",
            "Images should have descriptive alt text.",
            scrapedData.images.every((img: { src: string; alt: string; size?: number }) => img.alt?.length > 0),
            JSON.stringify(scrapedData.images)
        );

        // 8a. Next-Gen Image Formats Check
        const nextGenFormats = ['webp', 'avif'];
        const hasNextGenImages = scrapedData.images.some((img: { src: string }) => 
            nextGenFormats.some(format => img.src.toLowerCase().endsWith(`.${format}`))
        );
        await addCheck(
            "Next-Gen Image Formats",
            "Images should use modern formats like WebP or AVIF for better performance.",
            hasNextGenImages,
            JSON.stringify(scrapedData.images.map((img: { src: string; alt: string; size?: number }) => ({ src: img.src })))
        );

        // 8b. Image File Size Check
        const MAX_IMAGE_SIZE = 500 * 1024; // 500KB
        const allImagesOptimized = scrapedData.images.every((img: { size?: number }) => 
            !img.size || img.size <= MAX_IMAGE_SIZE
        );
        await addCheck(
            "Image File Size",
            "Images should be optimized and under 500KB for better page load times.",
            allImagesOptimized,
            JSON.stringify(scrapedData.images.map((img: { src: string; alt: string; size?: number }) => ({ src: img.src, size: img.size })))
        );

        // 9. Links Analysis
        await addCheck(
            "Internal Links",
            "Page should have internal links for good site structure.",
            scrapedData.internalLinks.length > 0,
            `Internal links found: ${scrapedData.internalLinks.length}`
        );

        // 10. Outbound Links Analysis
        await addCheck(
          "Outbound Links",
          "Page should have relevant outbound links to authoritative sources.",
          scrapedData.outboundLinks.length > 0,
          `Outbound links found: ${scrapedData.outboundLinks.length}`
        );

        // 11. Code Minification Check
        const jsMinified = scrapedData.resources.js.every((js: { url: string; content?: string; minified?: boolean }) => js.minified);
        const cssMinified = scrapedData.resources.css.every((css: { url: string; content?: string; minified?: boolean }) => css.minified);
        await addCheck(
            "Code Minification",
            "JavaScript and CSS code should be minified for performance.",
            jsMinified && cssMinified,
            `JS minified: ${jsMinified}, CSS minified: ${cssMinified}`
        );

        // 12. Schema Markup Check
        await addCheck(
            "Schema Markup",
            "Page should have schema markup for better search engine understanding.",
            scrapedData.schema.detected,
            JSON.stringify(scrapedData.schema)
        );

        // 13. Keyphrase in Introduction Check
        const introduction = scrapedData.paragraphs.length > 0 ? scrapedData.paragraphs[0] : '';
        await addCheck(
            "Keyphrase in Introduction",
            "The keyphrase should appear in the introduction paragraph.",
            introduction.toLowerCase().includes(keyphrase.toLowerCase()),
            introduction
        );

        // 14. Keyphrase in H2 Headings Check
        const subheadings = scrapedData.headings.filter((h: { level: number; text: string }) => h.level === 2);
        await addCheck(
            "Keyphrase in H2 Headings",
            "At least one H2 heading should contain the keyphrase.",
            subheadings.some((h: { level: number; text: string }) => h.text.toLowerCase().includes(keyphrase.toLowerCase())),
            subheadings.map((h: { level: number; text: string }) => h.text).join(', ')
        );

        // 15. Heading Hierarchy Check
        const h1Count = scrapedData.headings.filter((h: { level: number }) => h.level === 1).length;
        const h2Count = scrapedData.headings.filter((h: { level: number; text: string }) => h.level === 2).length;
        await addCheck(
            "Heading Hierarchy",
            "The page should have one H1 and multiple H2 headings.",
            h1Count === 1 && h2Count > 0,
            `H1 count: ${h1Count}, H2 count: ${h2Count}`
        );

        // 16. OpenGraph Image Check
        await addCheck(
            "OpenGraph Image",
            "The page should have an OpenGraph image.",
            Boolean(scrapedData.ogMetadata.image),
            scrapedData.ogMetadata.image
        );

        const score = Math.round((passedChecks / checks.length) * 100);

        console.log(`[SEO Analyzer] Analysis completed in ${Date.now() - startTime}ms`);
        return { checks, passedChecks, failedChecks, url, score, timestamp: new Date().toISOString() };
    } catch (error: any) {
        console.error(`[SEO Analyzer] Error during analysis:`, error);
        throw error;
    }
}

async function getImageSize(imageUrl: string, baseUrl: URL): Promise<number | undefined> {
  try {
    const fullUrl = new URL(imageUrl, baseUrl.origin).toString();
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

function isMinified(code: string): boolean {
  if (!code || code.length < 50) return true;

  // Remove comments to avoid skewing the results
  code = code.replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '$1');

  const newlineRatio = (code.match(/\n/g) || []).length / code.length;
  const whitespaceRatio = (code.match(/\s/g) || []).length / code.length;
  const lines = code.split('\n').filter(line => line.trim().length > 0);
  const avgLineLength = lines.length > 0 ? code.length / lines.length : 0;

  // More robust checks for minification
  const isLikelyMinified = (newlineRatio < 0.05 && whitespaceRatio < 0.2) || avgLineLength > 300;

  return isLikelyMinified;
}

function getMetaDescriptionRecommendation(description: string, keyphrase: string): string | undefined {
  if (!description) return 'Add a meta description that includes your keyphrase';
  if (description.length < 120) return 'Meta description is too short. Aim for 120-156 characters';
  if (description.length > 156) return 'Meta description is too long. Keep it under 156 characters';
  if (!description.toLowerCase().includes(keyphrase.toLowerCase())) {
    return `Include "${keyphrase}" in your meta description`;
  }
  return undefined;
}

function getOpenGraphRecommendation(title?: string, description?: string, image?: string): string | undefined {
  const missing = [];
  if (!title) missing.push('og:title');
  if (!description) missing.push('og:description');
  if (!image) missing.push('og:image');
  return missing.length > 0 ? `Add missing OpenGraph tags: ${missing.join(', ')}` : undefined;
}

function getHeadingStructureRecommendation(h1Count: number, h2Count: number): string | undefined {
  if (h1Count === 0) return 'Add an H1 heading to your page';
  if (h1Count > 1) return 'Remove extra H1 headings - keep only one H1 per page';
  if (h2Count === 0) return 'Add H2 headings to structure your content';
  return undefined;
}

function getImageAltRecommendation(images: HTMLImageElement[]): string | undefined {
  const missingAlt = images.filter(img => !img.hasAttribute('alt') || img.getAttribute('alt')?.trim() === '');
  if (missingAlt.length > 0) {
    return `Add descriptive alt text to ${missingAlt.length} image${missingAlt.length > 1 ? 's' : ''}`;
  }
  return undefined;
}

export default { fetch: handleRequest }
