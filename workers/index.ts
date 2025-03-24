import OpenAI from 'openai';
import { WebflowClient } from 'webflow-api';

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
    const authorizeUrl = WebflowClient.authorizeURL({
      state: env.STATE,
      scope: 'sites:read',
      clientId: env.WEBFLOW_CLIENT_ID,
      redirectUri: env.WEBFLOW_REDIRECT_URI,
    });
    return Response.redirect(authorizeUrl, 302);
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

function isNextGenImageFormat(src: string): boolean {
  if (!src) return false;
  
  // Get the file extension
  const extension = src.split('.').pop()?.toLowerCase();
  
  // Check if it's a next-gen format
  return extension === 'webp' || 
         extension === 'avif' || 
         extension === 'jxl' || 
         extension === 'heif' || 
         extension === 'heic';
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
    
    // Use JSDOM to parse HTML instead of regex
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const baseUrl = new URL(url);

    // Extract title and meta description safely
    const title = document.querySelector("title")?.textContent?.trim() || "";
    const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
    
    // Extract OpenGraph metadata safely
    const ogMetadata: Record<string, string> = {
      title: document.querySelector('meta[property="og:title"]')?.getAttribute("content") || "",
      description: document.querySelector('meta[property="og:description"]')?.getAttribute("content") || "",
      image: document.querySelector('meta[property="og:image"]')?.getAttribute("content") || "",
      imageWidth: document.querySelector('meta[property="og:image:width"]')?.getAttribute("content") || "",
      imageHeight: document.querySelector('meta[property="og:image:height"]')?.getAttribute("content") || ""
    };
    
    // Extract body content safely
    const content = document.body.textContent?.trim() || "";
    
    // Extract paragraphs safely
    const paragraphs: string[] = [];
    document.querySelectorAll("p").forEach(p => {
      const text = p.textContent?.trim() || "";
      if (text) paragraphs.push(text);
    });
    
    // Extract headings safely
    const headings: Array<{ level: number; text: string }> = [];
    for (let i = 1; i <= 6; i++) {
      document.querySelectorAll(`h${i}`).forEach(h => {
        const text = h.textContent?.trim() || "";
        if (text) headings.push({ level: i, text });
      });
    }
    
    // Extract images safely
    const images: Array<{ src: string; alt: string; isNextGen?: boolean }> = [];
    document.querySelectorAll("img").forEach(img => {
      const src = img.getAttribute("src") || "";
      const alt = img.getAttribute("alt") || "";
      if (src) {
        images.push({ 
          src, 
          alt,
          isNextGen: isNextGenImageFormat(src)
        });
      }
    });
    
    // Extract links safely
    const internalLinks: string[] = [];
    const outboundLinks: string[] = [];
    document.querySelectorAll("a[href]").forEach(a => {
      const href = a.getAttribute("href");
      if (!href) return;
      if (href.startsWith('#') || href.startsWith('javascript:')) return;
      
      try {
        const linkUrl = new URL(href, baseUrl.origin);
        if (linkUrl.hostname === baseUrl.hostname) {
          internalLinks.push(href);
        } else {
          outboundLinks.push(href);
        }
      } catch (e) {
        // Skip invalid URLs
      }
    });
    
    // Extract JavaScript and CSS resources safely
    const resources = {
      js: [] as Array<{url: string; minified: boolean}>,
      css: [] as Array<{url: string; minified: boolean}>
    };
    
    // Extract JavaScript files
    document.querySelectorAll("script[src]").forEach(script => {
      const scriptUrl = script.getAttribute("src");
      if (scriptUrl) {
        try {
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
    });
    
    // Extract inline scripts
    document.querySelectorAll("script:not([src])").forEach(script => {
      const scriptContent = script.textContent?.trim();
      if (scriptContent && scriptContent.length > 0) {
        const isMinified = !scriptContent.includes('\n') && 
                         !(/\s{2,}/).test(scriptContent) &&
                         scriptContent.length > 50;
        resources.js.push({
          url: 'inline-script',
          minified: isMinified
        });
      }
    });
    
    // Extract CSS files
    document.querySelectorAll("link[rel='stylesheet']").forEach(link => {
      const cssUrl = link.getAttribute("href");
      if (cssUrl) {
        try {
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
    });
    
    // Extract inline styles
    document.querySelectorAll("style").forEach(style => {
      const styleContent = style.textContent?.trim();
      if (styleContent && styleContent.length > 0) {
        const isMinified = !styleContent.includes('\n') && 
                         !(/\s{2,}/).test(styleContent) &&
                         styleContent.length > 50;
        resources.css.push({
          url: 'inline-style',
          minified: isMinified
        });
      }
    });
    
    // Check for schema.org structured data
    const schema = {
      detected: false,
      types: [] as string[]
    };
    
    const schemaScripts = document.querySelectorAll('script[type="application/ld+json"]');
    if (schemaScripts.length > 0) {
      schema.detected = true;
      schemaScripts.forEach(script => {
        try {
          const jsonData = JSON.parse(script.textContent || "{}");
          if (jsonData['@type']) {
            if (Array.isArray(jsonData['@type'])) {
              jsonData['@type'].forEach((type: string) => {
                if (type && !schema.types.includes(type)) {
                  schema.types.push(type);
                }
              });
            } else {
              if (jsonData['@type'] && !schema.types.includes(jsonData['@type'])) {
                schema.types.push(jsonData['@type']);
              }
            }
          } else if (Array.isArray(jsonData) && jsonData[0] && jsonData[0]['@type']) {
            jsonData.forEach(item => {
              if (item['@type'] && !schema.types.includes(item['@type'])) {
                schema.types.push(item['@type']);
              }
            });
          }
        } catch (e) {
          console.log('Error parsing schema JSON:', e);
        }
      });
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
import * as ip from "ip";
import IPCIDR from "ip-cidr";
import { URL } from "url";

let ALLOWED_DOMAINS = [
  "example.com",
  "pull-list.net",
  "*.pull-list.net",
  "www.pmds.pull-list.net",
  "pmds.pull-list.net"
];

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
// ===== End Security Functions =====

// ===== Begin GPT Functionality (moved from gpt.ts) =====

// Remove global instantiation and use of process.env in GPT section
// const useGPT = process.env.USE_GPT_RECOMMENDATIONS !== "false";
// const openai = useGPT ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

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
    // ...existing cache code...
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

// ===== End GPT Functionality =====

// === Begin SEO Analyzer functionality (moved from server\lib\seoAnalyzer.ts) ===

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
	try {
		const urlObj = new URL(url);
		return urlObj.pathname === "/" || urlObj.pathname === "";
	} catch {
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

// Main SEO analysis function (moved from seoAnalyzer.ts)
export async function analyzeSEOElements(url: string, keyphrase: string) {
	console.log(`[SEO Analyzer] Starting analysis for URL: ${url} with keyphrase: ${keyphrase}`);
	const startTime = Date.now();

	try {
		// Use your existing scrapeWebpage function (already present in this worker)
		const scrapedData = await scrapeWebpage(url);
		const checks: any[] = [];
		let passedChecks = 0,
			failedChecks = 0;

		// Success messages
		const messages: Record<string, string> = {
			"Keyphrase in Title": "Great job! Your title includes the target keyphrase.",
			// ... add other success messages as needed ...
		};

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
					recommendation = await getGPTRecommendation(title, keyphrase, context);
				} catch (error) {
					recommendation = analyzerFallbackRecommendations[title]
						? analyzerFallbackRecommendations[title]({ keyphrase })
						: `Consider optimizing your content for "${keyphrase}" in relation to ${title.toLowerCase()}.`;
				}
			}
			const successDescription = passed ? messages[title] : description;
			const priority = analyzerCheckPriorities[title] || "medium";
			checks.push({ title, description: successDescription, passed, recommendation, priority });
			passed ? passedChecks++ : failedChecks++;
		};

		// Example check: Title analysis
		await addCheck(
			"Keyphrase in Title",
			"The page title should contain the focus keyphrase.",
			scrapedData.title.toLowerCase().includes(keyphrase.toLowerCase()),
			scrapedData.title
		);

		// ... add additional checks similar to those in seoAnalyzer.ts ...
		// For instance: Meta Description, URL analysis, content length, keyphrase density, etc.
		// You can call calculateKeyphraseDensityFromAnalyzer and isHomePageFromAnalyzer as needed.

		const score = Math.round((passedChecks / checks.length) * 100);
		console.log(`[SEO Analyzer] Analysis completed in ${Date.now() - startTime}ms`);
		return { checks, passedChecks, failedChecks, url, score, timestamp: new Date().toISOString() };
	} catch (error: any) {
		console.error(`[SEO Analyzer] Error during analysis:`, error);
		throw error;
	}
}

// === End SEO Analyzer functionality (moved from server\lib\seoAnalyzer.ts) ===

// ===== Begin WebScraper functionality (moved from server\lib\webScraper.ts) =====
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

export async function scrapeWebpageJS(url: string): Promise<ScrapedData> {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `http://${url}`;
  }
  try {
    const response = await fetch(url);
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const baseUrl = new URL(url);

    const title = document.querySelector("title")?.textContent?.trim() || "";
    const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute("content") || "";

    const ogMetadata = {
      title: document.querySelector('meta[property="og:title"]')?.getAttribute("content") || "",
      description: document.querySelector('meta[property="og:description"]')?.getAttribute("content") || "",
      image: document.querySelector('meta[property="og:image"]')?.getAttribute("content") || "",
      imageWidth: document.querySelector('meta[property="og:image:width"]')?.getAttribute("content") || "",
      imageHeight: document.querySelector('meta[property="og:image:height"]')?.getAttribute("content") || ""
    };

    const content = document.body.textContent?.trim() || "";
    console.log("Scraping paragraphs...");
    const allParagraphElements = document.querySelectorAll("article p, main p, .content p, #content p, .post-content p, p");
    const paragraphs = Array.from(allParagraphElements)
      .map((el: Element) => el.textContent?.trim() || "")
      .filter((text: string) => text.length > 0);

    const subheadings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"))
      .map((el: Element) => el.textContent?.trim() || "")
      .filter((text: string) => text.length > 0);

    const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"))
      .map((el: Element) => {
        const tagName = el.tagName.toLowerCase();
        const level = parseInt(tagName.substring(1), 10);
        return { level, text: el.textContent?.trim() || "" };
      })
      .filter((heading: { level: number; text: string }) => heading.text.length > 0);

    const imageElements = Array.from(document.querySelectorAll("img"))
      .map((el: Element) => ({
        src: el.getAttribute("src") || "",
        alt: el.getAttribute("alt") || "",
      }));
      
    const images = await Promise.all(
      imageElements.map(async (img: { src: string; alt: string }) => {
        if (!img.src) return img;
        const size = await getImageSize(img.src, baseUrl);
        return { ...img, size };
      })
    );

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
      } catch (error) {
        // Skip invalid URLs
      }
    });

    const jsResources: Array<{ url: string; content?: string; minified?: boolean }> = [];
    const cssResources: Array<{ url: string; content?: string; minified?: boolean }> = [];
    
    document.querySelectorAll("script[src]").forEach((el: Element) => {
      const src = el.getAttribute("src");
      if (src) {
        try {
          const fullUrl = new URL(src, baseUrl.origin).toString();
          jsResources.push({ url: fullUrl });
        } catch (error) {
          // Skip invalid URL
        }
      }
    });
    document.querySelectorAll("link[rel='stylesheet']").forEach((el: Element) => {
      const href = el.getAttribute("href");
      if (href) {
        try {
          const fullUrl = new URL(href, baseUrl.origin).toString();
          cssResources.push({ url: fullUrl });
        } catch (error) {
          // Skip invalid URL
        }
      }
    });
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

    const microdataTypes: string[] = [];
    document.querySelectorAll('[itemscope]').forEach((el: Element) => {
      const itemtype = el.getAttribute('itemtype');
      if (itemtype) {
        try {
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

    const schemaTypes = new Set<string>();
    jsonLdBlocks.forEach(block => {
      if (block['@type']) {
        if (Array.isArray(block['@type'])) {
          block['@type'].forEach((type: string) => schemaTypes.add(type));
        } else {
          schemaTypes.add(block['@type']);
        }
      }
    });
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
      resources: { js: jsResources, css: cssResources },
      schema: { detected: jsonLdBlocks.length > 0 || microdataTypes.length > 0, types: Array.from(schemaTypes), jsonLdBlocks, microdataTypes }
    };
  } catch (error: any) {
    console.error("Failed to scrape webpage:", error);
    throw new Error(`Failed to scrape webpage: ${error.message}`);
  }
}

function isMinified(code: string): boolean {
  if (!code || code.length < 50) return true;
  const newlineRatio = (code.match(/\n/g) || []).length / code.length;
  const whitespaceRatio = (code.match(/\s/g) || []).length / code.length;
  const lines = code.split('\n').filter(line => line.trim().length > 0);
  const avgLineLength = lines.length > 0 ? code.length / lines.length : 0;
  return (newlineRatio < 0.01 && whitespaceRatio < 0.15) || avgLineLength > 500;
}
// ===== End WebScraper functionality (moved from server\lib\webScraper.ts) =====

// Main SEO analysis function that calls analyzeSEOElements with proper environment
async function analyzeSEO(url: string, keyphrase: string, env: any): Promise<any> {
  console.log(`Starting SEO analysis for ${url} with keyphrase "${keyphrase}"`);
  
  try {
    // Scrape the webpage
    const scrapedData = await scrapeWebpage(url);
    const checks: any[] = [];
    let passedChecks = 0;
    let failedChecks = 0;

    // Helper function to add a check result
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
          // Use the env parameter when calling getGPTRecommendation
          recommendation = await getGPTRecommendation(title, keyphrase, env, context);
        } catch (error) {
          console.error(`Error getting GPT recommendation for ${title}:`, error);
          recommendation = fallbackRecommendations[title] 
            ? fallbackRecommendations[title](keyphrase, context || "") 
            : `Consider optimizing your content for "${keyphrase}" in relation to ${title.toLowerCase()}.`;
        }
      }
      
      const successMessage = passed ? getSuccessMessage(title, url) : description;
      const priority = checkPriorities[title] || "medium";
      
      checks.push({
        title,
        description: successMessage,
        passed,
        recommendation,
        priority
      });
      
      passed ? passedChecks++ : failedChecks++;
    };

    // Run all SEO checks
    // 1. Title check
    await addCheck(
      "Keyphrase in Title",
      "Your title doesn't contain the keyphrase.",
      scrapedData.title.toLowerCase().includes(keyphrase.toLowerCase()),
      scrapedData.title
    );

    // 2. Meta description check
    await addCheck(
      "Keyphrase in Meta Description",
      "Your meta description doesn't contain the keyphrase.",
      scrapedData.metaDescription.toLowerCase().includes(keyphrase.toLowerCase()),
      scrapedData.metaDescription
    );

    // 3. URL check
    const urlObj = new URL(url);
    await addCheck(
      "Keyphrase in URL",
      "Your URL doesn't contain the keyphrase.",
      isHomePage(url) || urlObj.pathname.toLowerCase().includes(keyphrase.toLowerCase().replace(/\s+/g, '-')),
      urlObj.pathname
    );

    // 4. Content length check
    const contentLength = scrapedData.content.length;
    await addCheck(
      "Content Length on page",
      "Your content is too short. Aim for at least 300 words.",
      contentLength >= 300,
      `Current content length: ${contentLength} characters`
    );

    // 5. Keyphrase density check
    const { density, occurrences, totalWords } = calculateKeyphraseDensity(scrapedData.content, keyphrase);
    await addCheck(
      "Keyphrase Density",
      `Your keyphrase density of ${density.toFixed(1)}% is outside the optimal range (0.5% to 2.5%).`,
      density >= 0.5 && density <= 2.5,
      `Current density: ${density.toFixed(1)}% (${occurrences} occurrences in ${totalWords} words)`
    );

    // 6. Introduction check
    const hasIntroduction = scrapedData.paragraphs.length > 0;
    const introductionText = hasIntroduction ? scrapedData.paragraphs[0] : "";
    await addCheck(
      "Keyphrase in Introduction",
      "Your introduction doesn't contain the keyphrase.",
      hasIntroduction && introductionText.toLowerCase().includes(keyphrase.toLowerCase()),
      introductionText
    );

    // 7. H1 check
    const h1Headings = scrapedData.headings.filter(h => h.level === 1);
    const hasH1WithKeyphrase = h1Headings.some(h => h.text.toLowerCase().includes(keyphrase.toLowerCase()));
    await addCheck(
      "Keyphrase in H1 Heading",
      h1Headings.length === 0 ? "Your page has no H1 heading." : "Your H1 heading doesn't contain the keyphrase.",
      hasH1WithKeyphrase,
      h1Headings.map(h => h.text).join(", ")
    );

    // 8. H2 check
    const h2Headings = scrapedData.headings.filter(h => h.level === 2);
    const hasH2WithKeyphrase = h2Headings.some(h => h.text.toLowerCase().includes(keyphrase.toLowerCase()));
    await addCheck(
      "Keyphrase in H2 Headings",
      h2Headings.length === 0 ? "Your page has no H2 headings." : "None of your H2 headings contain the keyphrase.",
      hasH2WithKeyphrase,
      h2Headings.map(h => h.text).join(", ")
    );

    // 9. Heading hierarchy check
    const hasProperHierarchy = h1Headings.length === 1 && scrapedData.headings.every((h, i, arr) => 
      i === 0 || h.level >= arr[i-1].level || h.level === arr[i-1].level + 1
    );
    await addCheck(
      "Heading Hierarchy",
      "Your page doesn't have proper heading hierarchy. Use exactly one H1 and nest headings properly.",
      hasProperHierarchy
    );

    // 10. Image alt attributes check
    const imagesWithAlt = scrapedData.images.filter(img => img.alt && img.alt.trim() !== "");
    const imagesWithKeyphraseInAlt = scrapedData.images.filter(img => 
      img.alt && img.alt.toLowerCase().includes(keyphrase.toLowerCase())
    );
    await addCheck(
      "Image Alt Attributes",
      scrapedData.images.length === 0 ? "Your page has no images." : 
        imagesWithAlt.length === 0 ? "None of your images have alt attributes." :
        "None of your image alt attributes contain the keyphrase.",
      imagesWithKeyphraseInAlt.length > 0,
      imagesWithAlt.map(img => img.alt).join(", ")
    );

    // 11. Internal links check
    await addCheck(
      "Internal Links",
      "Your page has no internal links.",
      scrapedData.internalLinks.length > 0,
      `Current internal links: ${scrapedData.internalLinks.length}`
    );

    // 12. Outbound links check
    await addCheck(
      "Outbound Links",
      "Your page has no outbound links to authoritative sources.",
      scrapedData.outboundLinks.length > 0,
      `Current outbound links: ${scrapedData.outboundLinks.length}`
    );

    // 13. Next-gen image formats check
    const nextGenImages = scrapedData.images.filter(img => isNextGenImageFormat(img.src));
    await addCheck(
      "Next-Gen Image Formats",
      "None of your images use next-gen formats like WebP, AVIF, or JPEG 2000.",
      nextGenImages.length > 0 || scrapedData.images.length === 0,
      `${nextGenImages.length} of ${scrapedData.images.length} images use next-gen formats`
    );

    // 14. OpenGraph image check
    await addCheck(
      "OpenGraph Image",
      "Your page is missing an OpenGraph image for social sharing.",
      !!scrapedData.ogMetadata.image,
      scrapedData.ogMetadata.image
    );

    // 15. Open Graph title and description check
    await addCheck(
      "Open Graph Title and Description",
      "Your page is missing OpenGraph title and description for social sharing.",
      !!scrapedData.ogMetadata.title && !!scrapedData.ogMetadata.description,
      `OG Title: ${scrapedData.ogMetadata.title}, OG Description: ${scrapedData.ogMetadata.description}`
    );

    // 16. Code minification check
    const minifiedJs = scrapedData.resources.js.filter(js => js.minified).length;
    const minifiedCss = scrapedData.resources.css.filter(css => css.minified).length;
    const allResourcesMinified = 
      (minifiedJs === scrapedData.resources.js.length || scrapedData.resources.js.length === 0) &&
      (minifiedCss === scrapedData.resources.css.length || scrapedData.resources.css.length === 0);
    await addCheck(
      "Code Minification",
      "Your JavaScript and/or CSS files are not minified.",
      allResourcesMinified,
      `Minified JS: ${minifiedJs}/${scrapedData.resources.js.length}, Minified CSS: ${minifiedCss}/${scrapedData.resources.css.length}`
    );

    // 17. Schema markup check
    await addCheck(
      "Schema Markup",
      "Your page doesn't include schema.org structured data.",
      scrapedData.schema.detected,
      scrapedData.schema.types.length > 0 ? `Schema types: ${scrapedData.schema.types.join(", ")}` : "No schema types detected"
    );

    // 18. Image file size check (if available)
    const largeImages = scrapedData.images.filter(img => img.size && img.size > 200000);
    await addCheck(
      "Image File Size",
      largeImages.length > 0 ? "Some of your images are too large (>200KB)." : "Your images are well optimized.",
      largeImages.length === 0,
      `${largeImages.length} of ${scrapedData.images.length} images are too large`
    );

    // Calculate score and return results
    const score = Math.round((passedChecks / checks.length) * 100);
    const timestamp = new Date().toISOString();
    
    console.log(`Completed SEO analysis with score: ${score}%`);
    
    return {
      checks,
      passedChecks,
      failedChecks,
      score,
      url,
      keyphrase,
      timestamp
    };
  } catch (error: any) {
    console.error("Error analyzing SEO:", error);
    throw new Error(`Failed to analyze SEO: ${error.message}`);
  }
}

export default { fetch: handleRequest }
