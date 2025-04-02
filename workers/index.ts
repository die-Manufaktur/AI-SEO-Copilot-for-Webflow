// ===== Imports =====
import OpenAI from 'openai';
import * as ip from "ip";
import IPCIDR from "ip-cidr";
import { URL } from "url";

export {}; // Ensure this file is treated as a module



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
        // Use the centralized isMinified function with the 30% threshold
        const scriptMinified = isMinified(scriptContent);
        resources.js.push({
          url: 'inline-script',
          content: scriptContent,
          minified: scriptMinified
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
        // Use the centralized isMinified function with the 30% threshold
        const styleMinified = isMinified(styleContent);
        resources.css.push({
          url: 'inline-style',
          content: styleContent,
          minified: styleMinified
        });
      }
    }
    
    // Check for schema.org structured data
    const schema = {
      detected: false,
      types: [] as string[],
      jsonLdBlocks: [] as any[],
      microdataTypes: [] as string[],
      debug: {} as {
        patternsChecked?: number;
        foundMatches?: boolean;
        bodyContentSample?: string;
        hasSchemaOrgReference?: boolean;
        documentLength?: number;
        detectionMethod?: string;
        matchCount?: number;
        sampleContent?: string;
      }
    };
    
    // Extract JSON-LD schema
// Try multiple regex patterns from most specific to most permissive
let matchesArray: RegExpMatchArray[] = [];

// Create a consistent logging prefix
const logPrefix = '[SEO Analyzer]';

// Declare all match variables at the top level so they're accessible later
const pattern1 = /<script\s+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
const matches1 = Array.from(bodyContent.matchAll(pattern1));
// Check if pattern1 found any matches
if (matches1.length > 0) {
  matchesArray = matches1;
  console.log(`${logPrefix} Found ${matchesArray.length} JSON-LD scripts with pattern 1`);
}
// Define remaining match variables that will be used later
let matches2: RegExpMatchArray[] = [];
let matches3: RegExpMatchArray[] = [];
let matches4: RegExpMatchArray[] = [];
let matches5: RegExpMatchArray[] = [];
// Pattern 2: More permissive to handle different attribute ordering
if (matchesArray.length === 0) {
  const pattern2 = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  matches2 = Array.from(bodyContent.matchAll(pattern2));
  if (matches2.length > 0) {
    matchesArray = matches2;
    console.log(`${logPrefix} Found ${matchesArray.length} JSON-LD scripts with pattern 2`);
  }
}
// Pattern 3: Most permissive - any script with ld+json anywhere in attributes
if (matchesArray.length === 0) {
  const pattern3 = /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi;
  matches3 = Array.from(bodyContent.matchAll(pattern3));
  if (matches3.length > 0) {
    matchesArray = matches3;
    console.log(`${logPrefix} Found ${matchesArray.length} JSON-LD scripts with pattern 3`);
  }
}

// Pattern 4: Exact pattern for specific cases (trying to match your exact format)
if (matchesArray.length === 0) {
  console.log(`${logPrefix} Trying with exact pattern match...`);
  // This pattern specifically looks for your script format with no whitespace between attributes
  const pattern4 = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  matches4 = Array.from(bodyContent.matchAll(pattern4));
  if (matches4.length > 0) {
    matchesArray = matches4;
    console.log(`${logPrefix} Found ${matchesArray.length} JSON-LD scripts with pattern 4 (exact match)`);
  }
}

// Pattern 5: Ultra-permissive pattern
if (matchesArray.length === 0) {
  console.log(`${logPrefix} Trying with ultra-permissive pattern...`);
  // Look for any script tag that might contain schema.org data
  const pattern5 = /<script[^>]*>([\s\S]*?@context[\s\S]*?schema\.org[\s\S]*?@type[\s\S]*?)<\/script>/gi;
  matches5 = Array.from(bodyContent.matchAll(pattern5));
  if (matches5.length > 0) {
    matchesArray = matches5;
    console.log(`${logPrefix} Found ${matchesArray.length} JSON-LD scripts with pattern 5 (ultra-permissive)`);
  }
}

// If we still haven't found anything, look for raw JSON with schema.org in the HTML (without script tags)
if (matchesArray.length === 0) {
  console.log(`${logPrefix} Trying to find raw JSON blocks...`);
  // Look for JSON-like structures containing schema.org
  const rawJsonPattern = /(\{[\s\S]*?"@context"[\s\S]*?"schema\.org"[\s\S]*?"@type"[\s\S]*?\})/gi;
  const rawMatches = Array.from(bodyContent.matchAll(rawJsonPattern));
  if (rawMatches.length > 0) {
    console.log(`${logPrefix} Found ${rawMatches.length} potential raw JSON blocks with schema.org references`);
    
    // Try to parse these as standalone JSON
    for (const rawMatch of rawMatches) {
      try {
        const potentialJson = rawMatch[1];
        const jsonData = JSON.parse(potentialJson);
        if (jsonData["@context"] && jsonData["@type"]) {
          try {
            const contextUrl = new URL(jsonData["@context"]);
            const allowedHosts = [
              'schema.org',
              'www.schema.org'
            ];
            if (allowedHosts.includes(contextUrl.host)) {
              console.log(`${logPrefix} ✅ Successfully parsed raw JSON schema data: ${jsonData["@type"]}`);
              schema.detected = true;
              schema.jsonLdBlocks.push(jsonData);
              schema.types.push(jsonData["@type"]);
            }
          } catch (e) {
            console.log(`${logPrefix} Invalid @context URL: ${jsonData["@context"]}`);
          }
        }
      } catch (e) {
        console.log(`${logPrefix} Failed to parse potential raw JSON block`);
      }
    }
  }
}

// Additional diagnostic check - log a sample if schema not found
if (matchesArray.length === 0) {
  console.log(`${logPrefix} No JSON-LD scripts found with any pattern. Looking for fragments...`);
  // Look for any fragment containing "schema.org" in the HTML
  const schemaOrgIndex = bodyContent.indexOf('schema.org');
  if (schemaOrgIndex !== -1) {
    const contextFragment = bodyContent.substring(
      Math.max(0, schemaOrgIndex - 100), 
      Math.min(bodyContent.length, schemaOrgIndex + 300)
    );
    console.log(`${logPrefix} Found schema.org reference in HTML: ${contextFragment}`);
  } else {
    console.log(`${logPrefix} No schema.org references found in the document.`);
  }
}

// Process any found scripts
console.log(`${logPrefix} Found ${matchesArray.length} total potential JSON-LD scripts to process`);
    
    console.log(`Found ${matchesArray.length} potential JSON-LD scripts in total`);

    // Sample a portion of the page content to help with debugging
    console.log(`DEBUG: Body content sample (first 300 chars): ${bodyContent.substring(0, 300)}`);
    console.log(`DEBUG: HTML contains application/ld+json: ${bodyContent.includes('application/ld+json')}`);

    for (const match of matchesArray) {
      try {
        // Extract and trim the content inside the script tag
        const scriptContent = match[1].trim();
        console.log(`Found script tag with content length: ${scriptContent.length} chars`);
        
        // Log the raw content to aid debugging
        console.log(`Raw JSON-LD content sample:\n${scriptContent.substring(0, 150)}...`);
        
        // Try to parse the JSON
        try {
          const jsonData = JSON.parse(scriptContent);
          console.log(`✅ Successfully parsed JSON-LD data`);
          
          schema.detected = true;
          schema.jsonLdBlocks.push(jsonData);
          
          // Log type information
          console.log(`Schema @type: ${jsonData['@type'] || '(none found)'}`);
          
          if (jsonData['@type']) {
            schema.types.push(jsonData['@type']);
            console.log(`Added schema type: ${jsonData['@type']}`);
          } else if (Array.isArray(jsonData)) {
            console.log(`JSON-LD is an array with ${jsonData.length} items`);
            jsonData.forEach((item, index) => {
              if (item && item['@type']) {
                schema.types.push(item['@type']);
                console.log(`Added schema type from array[${index}]: ${item['@type']}`);
              }
            });
          }
        } catch (jsonError: unknown) {
          console.error(`❌ JSON parse error:`, jsonError);
          // Try to identify the position of the error if it's an Error object
          if (jsonError instanceof Error && jsonError.message.includes('position')) {
            const position = parseInt(jsonError.message.match(/position (\d+)/)?.[1] || '0');
            const errorContext = scriptContent.substring(
              Math.max(0, position - 20),
              Math.min(scriptContent.length, position + 20)
            );
            console.error(`Error context around position ${position}: ...${errorContext}...`);
          }
          throw jsonError; // Re-throw to be caught by the outer try-catch
        }
      } catch (e) {
        console.error('❌ Error processing schema JSON:', e);
        if (match[1]) {
          console.error('Schema content sample causing error:', match[1].substring(0, 300));
        }
      }
    }

    // After processing all scripts, log the final state
    console.log(`Final schema detection state: ${schema.detected ? 'DETECTED ✓' : 'NOT DETECTED ✗'}`);
    console.log(`Schema types found: ${schema.types.length > 0 ? schema.types.join(', ') : 'NONE'}`);
    
    // When processing schema markup, add debug info to the schema object
// After all pattern matching attempts
if (matchesArray.length === 0) {
  // No schema found, add debug info
  schema.debug = {
    patternsChecked: 5,
    foundMatches: false,
    bodyContentSample: bodyContent.substring(0, 300),
    hasSchemaOrgReference: (() => {
      try {
        const url = new URL(bodyContent);
        return url.host === 'schema.org' || url.host.endsWith('.schema.org');
      } catch (e) {
        return false;
      }
    })(),
    documentLength: bodyContent.length
  };
} else {
  // Schema found, add information about which pattern worked
  let detectionMethod = "unknown";
  if (matches1 && matches1.length > 0) detectionMethod = "pattern1 (standard)";
  else if (matches2 && matches2.length > 0) detectionMethod = "pattern2 (permissive ordering)";
  else if (matches3 && matches3.length > 0) detectionMethod = "pattern3 (any ld+json)";
  else if (matches4 && matches4.length > 0) detectionMethod = "pattern4 (exact match)";
  else if (matches5 && matches5.length > 0) detectionMethod = "pattern5 (ultra-permissive)";
  
  schema.debug = {
    patternsChecked: 5,
    foundMatches: true,
    detectionMethod,
    matchCount: matchesArray.length,
    sampleContent: matchesArray[0][1].substring(0, 150) + "..."
  };
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
    
    // Fetch the page content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
    }

    
    // Check if the page is empty or has minimal content
    const html = await response.text();
    if (!html || html.trim().length < 100) {
      throw new Error('Page appears to be empty or unpublished');
    }

    // Continue with existing analysis...
    const results = await analyzeSEOElements(url, keyphrase, env);
    
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

// Centralized minification detection function with configurable threshold
function isMinified(code: string, minificationThreshold: number = 30): boolean {
  if (!code || code.length < 50) return true;

  // Remove comments to avoid skewing the results
  code = code.replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '$1');

  // Calculate metrics
  const newlineRatio = (code.match(/\n/g) || []).length / code.length;
  const whitespaceRatio = (code.match(/\s/g) || []).length / code.length;
  const lines = code.split('\n').filter(line => line.trim().length > 0);
  const avgLineLength = lines.length > 0 ? code.length / lines.length : 0;

  // Base threshold values at 50% minification threshold
  const baseNewlineRatioThreshold = 0.05;      // 5%
  const baseWhitespaceRatioThreshold = 0.2;    // 20%
  const baseAvgLineLengthThreshold = 300;      // characters
  
  // Scale thresholds based on minificationThreshold
  const scaleFactor = minificationThreshold / 50;
  const newlineRatioThreshold = baseNewlineRatioThreshold * (2 - scaleFactor);
  const whitespaceRatioThreshold = baseWhitespaceRatioThreshold * (2 - scaleFactor);
  const avgLineLengthThreshold = baseAvgLineLengthThreshold * scaleFactor;

  // More robust checks for minification
  const isLikelyMinified = 
    (newlineRatio < newlineRatioThreshold && whitespaceRatio < whitespaceRatioThreshold) || 
    avgLineLength > avgLineLengthThreshold;

  return isLikelyMinified;
}

const hasValidOpenAIKey = (env: any): boolean =>
  !!env.OPENAI_API_KEY && ('' + env.OPENAI_API_KEY).startsWith('sk-')

// Replace getGPTRecommendation with getAIRecommendation
export async function getAIRecommendation(
  checkType: string,
  keyphrase: string,
  env: any,  // env binding
  context?: string
): Promise<string> {
  const useAI = env.USE_AI_RECOMMENDATIONS !== 'false'
  if (!useAI || !hasValidOpenAIKey(env)) {
    console.log("AI recommendations are disabled or API key is invalid")
    return "AI recommendations are currently disabled. Enable them by setting USE_AI_RECOMMENDATIONS=true and providing a valid OPENAI_API_KEY."
  }

  // Use local client instance instead of global variable
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY })

  try {
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
    console.error("AI API Error:", error)
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
    "Keyphrase in Title": ({ keyphrase }) =>
        `Consider rewriting your title to include '${keyphrase}', preferably at the beginning.`,
    "Keyphrase in Meta Description": ({ keyphrase }) =>
        `Add '${keyphrase}' to your meta description naturally to boost click-through rates.`,
    "Keyphrase in Introduction": ({ keyphrase }) =>
        `Mention '${keyphrase}' in your first paragraph to establish relevance early.`,
    "Schema Markup": () =>
        `Add structured data markup using JSON-LD format in a script tag with type="application/ld+json". Include appropriate schema types from schema.org relevant to your content. Test your markup with Google's Rich Results Test tool.`,
    // ... add additional fallback recommendations as needed ...
};

export async function analyzeSEOElements(url: string, keyphrase: string, env: any) {
    console.log(`[SEO Analyzer] Starting analysis for URL: ${url} with keyphrase: ${keyphrase}`);
    const startTime = Date.now();

    try {
        const scrapedData = await scrapeWebpage(url);
        const checks: any[] = [];
        let passedChecks = 0, failedChecks = 0;

        // Helper to add a check (with AI integration if available)
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
                    recommendation = await getAIRecommendation(title, keyphrase, env, context);
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
        const jsResources = scrapedData.resources.js;
        const cssResources = scrapedData.resources.css;
        const totalResources = jsResources.length + cssResources.length;

        // Use the isMinified function for consistent detection
        const minifiedJs = jsResources.filter((js: {url: string; content?: string; minified?: boolean}) => {
          // For URLs containing .min.js or -min.js, trust the filename
          if (js.url && (js.url.includes('.min.js') || js.url.includes('-min.js'))) {
            return true;
          }
          // Otherwise use our consistent detection method
          return js.content ? isMinified(js.content) : false;
        }).length;
        
        const minifiedCss = cssResources.filter((css: {url: string; content?: string; minified?: boolean}) => {
          // For URLs containing .min.css or -min.css, trust the filename
          if (css.url && (css.url.includes('.min.css') || css.url.includes('-min.css'))) {
            return true;
          }
          // Otherwise use our consistent detection method
          return css.content ? isMinified(css.content) : false;
        }).length;
        
        const totalMinified = minifiedJs + minifiedCss;
        const minificationPercentage = totalResources > 0 
          ? Math.round((totalMinified / totalResources) * 100) 
          : 0;
        
        const minificationPasses = minificationPercentage >= 30;
        
        await addCheck(
            "Code Minification",
            minificationPasses
              ? `Your JavaScript and CSS resources are well optimized. ${minificationPercentage}% are minified.`
              : `${minificationPercentage}% of your JavaScript and CSS resources are minified. Aim for at least 30% minification.`,
            minificationPasses,
            `JS: ${minifiedJs}/${jsResources.length} minified, CSS: ${minifiedCss}/${cssResources.length} minified. Total: ${minificationPercentage}%`,
            true
        );

        // 12. Schema Markup Check
        const hasSchemaMarkup = scrapedData.schema.detected;
        const schemaTypesDetected = scrapedData.schema.types;
        
        // Define subheadings here so it can be used in schema context
        const subheadings = scrapedData.headings.filter((h: { level: number; text: string }) => h.level === 2);

        // Create context for recommendation
        let schemaContext = "";
        if (hasSchemaMarkup) {
          schemaContext = `Schema markup found on page. Types detected: ${schemaTypesDetected.join(', ') || 'Unknown'}`;
        } else {
          // Create detailed context to help generate a relevant recommendation
          schemaContext = `
No schema markup detected on page.
Page title: ${scrapedData.title}
Meta description: ${scrapedData.metaDescription}
URL: ${url}
Content type indicators:
- First H1: ${h1s.length > 0 ? h1s[0].text : 'None'}
- First few H2s: ${subheadings.slice(0, 3).map((h: { level: number; text: string }) => h.text).join(', ')}
- Has images: ${scrapedData.images.length > 0 ? 'Yes' : 'No'}
- Is homepage: ${isHomePageFromAnalyzer(url) ? 'Yes' : 'No'}
- Content preview: ${scrapedData.paragraphs.slice(0, 2).join(' ').substring(0, 200)}...
`;
        }

        await addCheck(
          "Schema Markup",
          hasSchemaMarkup ?
            `Your page has schema markup implemented (${schemaTypesDetected.join(', ') || 'Unknown type'})` :
            "Your page is missing schema markup (structured data)",
          hasSchemaMarkup,
          schemaContext,
          true // Skip GPT recommendation as we're using our custom one
        );

        // If the check failed, add our custom recommendation
        const schemaCheck = checks.find(check => check.title === "Schema Markup");
        if (schemaCheck) {
          schemaCheck.recommendation = generateSchemaMarkupRecommendation(scrapedData, url);
        }

        // 13. Keyphrase in Introduction Check
        const introduction = scrapedData.paragraphs.length > 0 ? scrapedData.paragraphs[0] : '';
        await addCheck(
            "Keyphrase in Introduction",
            "The keyphrase should appear in the introduction paragraph.",
            introduction.toLowerCase().includes(keyphrase.toLowerCase()),
            introduction
        );
        
        // 14. Keyphrase in H2 Headings Check
        // subheadings already defined above
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
            scrapedData.ogMetadata.image,
            true  // Added skipRecommendation parameter set to true
        );

        const score = Math.round((passedChecks / checks.length) * 100);

        console.log(`[SEO Analyzer] Analysis completed in ${Date.now() - startTime}ms`);
        return { checks, passedChecks, failedChecks, url, score, timestamp: new Date().toISOString() };
    } catch (error: any) {
        console.error(`[SEO Analyzer] Error during analysis:`, error);
        throw error;
    }
}

// Add helper function at the top level
function generateSchemaMarkupRecommendation(data: any, pageUrl: string): string {
  // Determine page type based on content
  const isHome = isHomePageFromAnalyzer(pageUrl);
  const h1Text = data.headings.find((h: {level: number}) => h.level === 1)?.text || '';
  const hasProducts = h1Text.toLowerCase().includes('product') || 
                     data.content.toLowerCase().includes('price') || 
                     data.content.toLowerCase().includes('buy now');
  const hasBlog = pageUrl.includes('blog') || 
                 h1Text.toLowerCase().includes('article') || 
                 data.headings.some((h: {level: number; text: string}) => 
                   h.level === 2 && h.text.toLowerCase().includes('post'));
                   
  // Generate appropriate recommendation
  let recommendation = "Add schema markup to help search engines understand your content:\n\n";
  
  if (isHome) {
    recommendation += `**Recommended Schema Type: WebSite or Organization**\n\n`;
    recommendation += `For your homepage, implement schema.org/WebSite or schema.org/Organization markup to establish your site's identity. Include your site name, URL, and logo.`;
  } else if (hasProducts) {
    recommendation += `**Recommended Schema Type: Product**\n\n`;
    recommendation += `For product pages, implement schema.org/Product markup including:
- name
- description
- price
- availability
- product images
This will enhance visibility in search results and potentially enable rich snippets.`;
  } else if (hasBlog) {
    recommendation += `**Recommended Schema Type: Article or BlogPosting**\n\n`;
    recommendation += `For this content, implement schema.org/Article or schema.org/BlogPosting markup including:
- headline
- author
- datePublished
- image
- description
This will improve how your content appears in search results.`;
  } else {
    recommendation += `**Recommended Schema Types: WebPage plus contextual type**\n\n`;
    recommendation += `Implement basic schema.org/WebPage markup plus a more specific type based on your content:
- FAQPage for Q&A content
- HowTo for instructions
- LocalBusiness if this represents a physical location
Include all required properties for your chosen type.`;
  }
  
  return recommendation;
}

export default { fetch: handleRequest }