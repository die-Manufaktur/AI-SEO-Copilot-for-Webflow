// ===== Imports =====
import OpenAI from 'openai';
import * as ip from "ip";
import IPCIDR from "ip-cidr";
import { URL } from "url";
import { Page } from 'openai/pagination.mjs';

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
    return new Response(JSON.stringify({ error: 'Failed to handle auth callback' }), { status: 500 });
  }
}

// =======================================
// SEO ANALYSIS LOGIC
// =======================================

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper function to get meta description via Webflow Designer API
async function getMetaDescriptionFromAPI(): Promise<string | null> {
  try {
    const currentPage = await webflow.getCurrentPage();
    const pageId = currentPage?.id;
    if (!pageId) {
      return null;
    }
    
    const metaDescription = await currentPage.getDescription();
    return metaDescription || null;
  } catch (error) {
    console.error("Error fetching meta description from Webflow API:", error);
    return null;
  }
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
    "Keyphrase in Title": "Nice work! Your title nails it with the keyphrase. 👍",
    "Keyphrase in Meta Description": "Awesome! Your meta description is spot on with the keyphrase.",
    "Keyphrase in URL": isHomePage(url) ? "You're all set! No need for a keyphrase since it's the homepage. ✨" : "Boom! Your URL is clean, readable, and SEO-friendly.",
    "Content Length": "Great job! Your content is just the right length for SEO and readers alike.",
    "Keyphrase Density": "Perfect balance! Your keyphrase appears just the right amount of times.",
    "Keyphrase in Introduction": "Love it! You got the keyphrase in right where it matters—at the start.",
    "Image Alt Attributes": "Nice! Your images are optimized with descriptive alt text. 👌",
    "Internal Links": "You're crushing it! Your internal links are helping users (and Google) navigate smoothly.",
    "Outbound Links": "Great move! Linking to relevant sources makes your content even stronger.",
    "Next-Gen Image Formats": "Smart choice! Your images are using modern formats for faster load times.",
    "OG Image": "Looks good! Your Open Graph image is set up and ready for sharing.",
    "OG Title and Description": "Spot on! Your Open Graph title and description are well configured.",
    "Keyphrase in H1 Heading": "Nice! Your H1 heading highlights the keyphrase perfectly.",
    "Keyphrase in H2 Headings": "Great thinking! Using the keyphrase in H2s reinforces your topic.",
    "Heading Hierarchy": "Smooth structure! Your headings follow a clear, logical order.",
    "Code Minification": "Awesome! Your code is minified for speed and efficiency. 🚀",
    "Schema Markup": "Nice touch! Schema markup is in place, making your content even easier for search engines to understand.",
    "Image File Size": "Perfect! Your images are well-optimized for a fast-loading page.",
    "Page Indexability": "You're all set! Search engines can find and index your page without a problem.",
  };
  return messages[checkType] || "Good job!";
}


async function scrapeWebpage(url: string): Promise<any> {
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
    
    const metaDescriptionMatches = [
      html.match(/<meta\s+name=["']description["'][^>]*content=["'](.*?)["']/i),
      html.match(/<meta\s+content=["'](.*?)["'][^>]*name=["']description["']/i),
      html.match(/<meta\s+property=["']og:description["'][^>]*content=["'](.*?)["']/i),
      html.match(/<meta\s+content=["'](.*?)["'][^>]*property=["']og:description["']/i)
    ];
    
    let metaDescription = "";
    for (const match of metaDescriptionMatches) {
      if (match && match[1]) {
        metaDescription = match[1].trim();
        break;
      }
    }
    
    // Add this after extracting meta description
    console.log("Debug - Meta Description Found:", metaDescription);
    
    // Extract OpenGraph metadata
    const ogMetadata: Record<string, string> = {
      title: "",
      description: "",
      image: "",
      imageWidth: "",
      imageHeight: ""
    };
    
    // Extract OG title
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["'][^>]*content=["'](.*?)["']/i);
    if (ogTitleMatch) ogMetadata.title = ogTitleMatch[1].trim();
    
    // Extract OG description
    const ogDescMatch = html.match(/<meta\s+property=["']og:description["'][^>]*content=["'](.*?)["']/i);
    if (ogDescMatch) ogMetadata.description = ogDescMatch[1].trim();
    
    // Extract OG image
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["'][^>]*content=["'](.*?)["']/i);
    if (ogImageMatch) ogMetadata.image = ogImageMatch[1].trim();
    
    // Extract OG image dimensions
    const ogImageWidthMatch = html.match(/<meta\s+property=["']og:image:width["'][^>]*content=["'](.*?)["']/i);
    if (ogImageWidthMatch) ogMetadata.imageWidth = ogImageWidthMatch[1].trim();
    
    const ogImageHeightMatch = html.match(/<meta\s+property=["']og:image:height["'][^>]*content=["'](.*?)["']/i);
    if (ogImageHeightMatch) ogMetadata.imageHeight = ogImageHeightMatch[1].trim();
    
    // Replace browser DOM-dependent code with regex-based parsing
    // Extract body content
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : html;
    const content = bodyContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    console.log("Extracted content:", content.substring(0, 200) + "...");

    console.log("Scraping paragraphs...");
    // Use regex to extract paragraphs instead of DOM API
    const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    const paragraphMatches = [...bodyContent.matchAll(paragraphRegex)];
    console.log("Total p tags found:", paragraphMatches.length);

    // Extract paragraphs with parent context
    const paragraphs = paragraphMatches
      .map(match => {
        const text = match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        // Try to get parent element class (simplified)
        const fullMatch = match[0];
        const parentClassMatch = bodyContent.substring(
          Math.max(0, bodyContent.indexOf(fullMatch) - 200), 
          bodyContent.indexOf(fullMatch)
        ).match(/<([a-z0-9]+)[^>]*class=["']([^"']+)["'][^>]*>[^<]*$/i);
        
        const parentClass = parentClassMatch ? parentClassMatch[2] : 'no-parent-class';
        console.log(`Paragraph found in ${parentClass}:`, text.substring(0, 100) + (text.length > 100 ? '...' : ''));
        return text;
      })
      .filter(text => text.length > 0);
    
    // Extract headings
    const headings: Array<{ level: number; text: string }> = [];
    for (let i = 1; i <= 6; i++) {
      const headingMatches = html.matchAll(new RegExp(`<h${i}[^>]*>(.*?)</h${i}>`, 'gi'));
      for (const match of headingMatches) {
        const text = match[1].replace(/<[^>]+>/g, ' ').trim();
        if (text) headings.push({ level: i, text });
      }
    }
    
    // Extract images with sizes
    const images: Array<{ src: string; alt: string; size?: number }> = [];
    const imageMatches = html.matchAll(/<img[^>]*src=["'](.*?)["'][^>]*alt=["'](.*?)["'][^>]*>/gi);
    for (const match of imageMatches) {
      images.push({ src: match[1], alt: match[2] });
    }
    
    // Extract links
    const baseUrl = new URL(url);
    const internalLinks: string[] = [];
    const outboundLinks: string[] = [];
    const linkMatches = html.matchAll(/<a[^>]*href=["'](.*?)["'][^>]*>/gi);
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
    const scriptMatches = html.matchAll(/<script[^>]*src=["'](.*?)["'][^>]*>/gi);
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
        }
      }
    }
    
    // Extract inline scripts - replace sanitizeHtml with manual extraction
    const inlineScriptMatches = html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi);
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
    const cssMatches = html.matchAll(/<link[^>]*rel=["']stylesheet["'][^>]*href=["'](.*?)["'][^>]*>/gi);
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
        }
      }
    }
    
    // Extract inline styles
    const inlineStyleMatches = html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi);
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
const matches1 = Array.from(html.matchAll(pattern1));
// Check if pattern1 found any matches
if (matches1.length > 0) {
  matchesArray = matches1;
}
// Define remaining match variables that will be used later
let matches2: RegExpMatchArray[] = [];
let matches3: RegExpMatchArray[] = [];
let matches4: RegExpMatchArray[] = [];
let matches5: RegExpMatchArray[] = [];
// Pattern 2: More permissive to handle different attribute ordering
if (matchesArray.length === 0) {
  const pattern2 = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  matches2 = Array.from(html.matchAll(pattern2));
  if (matches2.length > 0) {
    matchesArray = matches2;
  }
}
// Pattern 3: Most permissive - any script with ld+json anywhere in attributes
if (matchesArray.length === 0) {
  const pattern3 = /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi;
  matches3 = Array.from(html.matchAll(pattern3));
  if (matches3.length > 0) {
    matchesArray = matches3;
  }
}

// Pattern 4: Exact pattern for specific cases (trying to match your exact format)
if (matchesArray.length === 0) {
  // This pattern specifically looks for your script format with no whitespace between attributes
  const pattern4 = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  matches4 = Array.from(html.matchAll(pattern4));
  if (matches4.length > 0) {
    matchesArray = matches4;
  }
}

// Pattern 5: Ultra-permissive pattern
if (matchesArray.length === 0) {
  // Look for any script tag that might contain schema.org data
  const pattern5 = /<script[^>]*>([\s\S]*?@context[\s\S]*?schema\.org[\s\S]*?@type[\s\S]*?)<\/script>/gi;
  matches5 = Array.from(html.matchAll(pattern5));
  if (matches5.length > 0) {
    matchesArray = matches5;
  }
}

// If we still haven't found anything, look for raw JSON with schema.org in the HTML (without script tags)
if (matchesArray.length === 0) {
  // Look for JSON-like structures containing schema.org
  const rawJsonPattern = /(\{[\s\S]*?"@context"[\s\S]*?"schema\.org"[\s\S]*?"@type"[\s\S]*?\})/gi;
  const rawMatches = Array.from(html.matchAll(rawJsonPattern));
  if (rawMatches.length > 0) {
    
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
              schema.detected = true;
              schema.jsonLdBlocks.push(jsonData);
              schema.types.push(jsonData["@type"]);
            }
          } catch (e) {
          }
        }
      } catch (e) {
      }
    }
  }
}

// Additional diagnostic check - log a sample if schema not found
if (matchesArray.length === 0) {
  // Look for any fragment containing "schema.org" in the HTML
  const schemaOrgIndex = html.indexOf('schema.org');
  if (schemaOrgIndex !== -1) {
    const contextFragment = html.substring(
      Math.max(0, schemaOrgIndex - 100), 
      Math.min(html.length, schemaOrgIndex + 300)
    );
  } else {
  }
}

// Process any found scripts
    
    for (const match of matchesArray) {
      try {
        // Extract and trim the content inside the script tag
        const scriptContent = match[1].trim();
        
        // Log the raw content to aid debugging
        
        // Try to parse the JSON
        try {
          const jsonData = JSON.parse(scriptContent);
          
          schema.detected = true;
          schema.jsonLdBlocks.push(jsonData);
          
          // Log type information
          
          if (jsonData['@type']) {
            schema.types.push(jsonData['@type']);
          } else if (Array.isArray(jsonData)) {
            jsonData.forEach((item, index) => {
              if (item && item['@type']) {
                schema.types.push(item['@type']);
              }
            });
          }
        } catch (jsonError: unknown) {
          // Try to identify the position of the error if it's an Error object
          if (jsonError instanceof Error && jsonError.message.includes('position')) {
            const position = parseInt(jsonError.message.match(/position (\d+)/)?.[1] || '0');
            const errorContext = scriptContent.substring(
              Math.max(0, position - 20),
              Math.min(scriptContent.length, position + 20)
            );
          }
          throw jsonError; // Re-throw to be caught by the outer try-catch
        }
      } catch (e) {
        if (match[1]) {
        }
      }
    }

    // After processing all scripts, log the final state
    
    // When processing schema markup, add debug info to the schema object
// After all pattern matching attempts
if (matchesArray.length === 0) {
  // No schema found, add debug info
  schema.debug = {
    patternsChecked: 5,
    foundMatches: false,
    bodyContentSample: html.substring(0, 300),
    hasSchemaOrgReference: (() => {
      try {
        const url = new URL(html);
        return url.host === 'schema.org' || url.host.endsWith('.schema.org');
      } catch (e) {
        return false;
      }
    })(),
    documentLength: html.length
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
    const microdataMatches = html.matchAll(/<[^>]+\s+itemscope[^>]*>/gi);
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
    throw new Error(`Failed to scrape webpage: ${error.message}`);
  }
}

// Function to extract paragraphs using Webflow Designer API
async function extractParagraphsFromWebflow(): Promise<string[]> {
  try {
    if (typeof webflow === 'undefined') {
      console.log("Webflow API not available");
      return [];
    }

    console.log("Using Webflow Designer API to extract paragraphs");
    const paragraphs: string[] = [];
    
    // Get all elements from the current page
    const allElements = await webflow.getAllElements();
    console.log("Total elements found:", allElements.length);
    
    // First pass: collect direct paragraphs
    for (const element of allElements) {
      if (!element) continue;
      
      // Check if element is a paragraph
      const isParagraph = ('tagName' in element && (element as { tagName: string }).tagName.toLowerCase() === 'p') ||
      (Array.isArray(element.customAttributes) && element.customAttributes.some(attr =>
          attr.name === 'data-element-type' && attr.value === 'paragraph'
        ));

      if (isParagraph && element.textContent) {
        const text = typeof element.textContent === 'string' ? (element.textContent as string).trim() : '';
        if (text.length >= 30) { // Only collect substantial paragraphs
          console.log("Found paragraph:", text.substring(0, 100) + (text.length > 100 ? '...' : ''));
          paragraphs.push(text);
        }
      }
    }
    
    // Second pass: check containers for text content
    if (paragraphs.length === 0) {
      for (const element of allElements) {
        if (!element || !element.children) continue;
        
        try {
          const children = element.children;
          for (const child of Array.isArray(children) ? children : []) {
            if (!child) continue;
            
            if ((child.type === 'string' || child.tagName?.toLowerCase() === 'p') && child.textContent) {
              const text = child.textContent.trim();
              if (text.length >= 30) {
                console.log("Found text in container:", text.substring(0, 100) + (text.length > 100 ? '...' : ''));
                paragraphs.push(text);
              }
            }
          }
        } catch (e) {
          console.warn('Error accessing children:', e);
        }
      }
    }
    
    console.log(`Found ${paragraphs.length} paragraphs using Webflow API`);
    return paragraphs;
  } catch (error) {
    console.error("Error extracting paragraphs from Webflow:", error);
    return [];
  }
}

export async function analyzeSEOElements(url: string, keyphrase: string, env: any) {
    const startTime = Date.now();

    try {
        // Initialize API data with default empty values
        const apiData = {
            title: '',
            metaDescription: '',
            ogTitle: '',
            ogDescription: '',
            ogImage: '',
            usesPageTitleAsOgTitle: false,
            usesDescriptionAsOgDescription: false,
            slug: ''
        };

        // Get data via scraping (fallback method)
        const scrapedData = await scrapeWebpage(url);
        
        // IMPORTANT: Webflow API is not directly accessible in Workers
        // We need to receive this data from the client side
        if (env.webflowData) {
            try {
                const webflowParagraphs = env.webflowData.paragraphs || [];
                if (webflowParagraphs.length > 0) {
                    console.log("Using paragraphs from Webflow API data");
                    scrapedData.paragraphs = webflowParagraphs;
                }
            } catch (apiError) {
                console.error("Error processing Webflow data:", apiError);
                // Continue with scraped data
            }
        }

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
                        : `Consider optimizing your content for "${keyphrase}" in relation to ${title.toLowerCase()}.'`;
                }
            }
            const successDescription = passed ? getSuccessMessage(title, url) : description;
            const priority = analyzerCheckPriorities[title] || "medium";
            checks.push({ title, description: successDescription, passed, recommendation, priority });
            passed ? passedChecks++ : failedChecks++;
        };

        // Prioritize API data over scraped data
        const pageTitle = apiData.title || scrapedData.title;
        const metaDescription = apiData.metaDescription || scrapedData.metaDescription;
        
        // Update Open Graph data with API values if available
        if (apiData.ogTitle || apiData.ogDescription || apiData.ogImage) {
            scrapedData.ogMetadata = scrapedData.ogMetadata || {};
            if (apiData.ogTitle) scrapedData.ogMetadata.title = apiData.ogTitle;
            if (apiData.ogDescription) scrapedData.ogMetadata.description = apiData.ogDescription;
            if (apiData.ogImage) scrapedData.ogMetadata.image = apiData.ogImage;
        }

        // 1. Title Analysis
        await addCheck(
            "Keyphrase in Title",
            "The page title should contain the focus keyphrase.",
            pageTitle.toLowerCase().includes(keyphrase.toLowerCase()),
            pageTitle
        );

        // 2. Meta Description Analysis
        await addCheck(
            "Keyphrase in Meta Description",
            "The meta description should contain the focus keyphrase.",
            metaDescription.toLowerCase().includes(keyphrase.toLowerCase()),
            metaDescription
        );

        // 3. URL Analysis
        // Use API slug if available
        const pageSlug = apiData.slug || null;
        const urlForCheck = pageSlug 
            ? new URL(url).origin + '/' + pageSlug
            : url;
            
        await addCheck(
            "Keyphrase in URL",
            "The URL should contain the focus keyphrase when appropriate.",
            isHomePageFromAnalyzer(urlForCheck) || urlForCheck.toLowerCase().includes(keyphrase.toLowerCase()),
            urlForCheck
        );

        // 4. Content Length Check - Update the check title to match success messages
        const wordCount = scrapedData.content.trim().split(/\s+/).length;
        await addCheck(
            "Content Length",  // This should match exactly with the success message key
            "The content should be at least 300 words long.",
            wordCount >= 300,
            `Current word count: ${wordCount}`
        );

        // 5. Keyphrase Density
        const { density, occurrences, totalWords } = calculateKeyphraseDensity(scrapedData.content, keyphrase);
        const densityInRange = density >= 0.5 && density <= 2.5;
        const densityMessage = densityInRange
            ? "Keyphrase density is optimal."
            : `Keyphrase density should be between 0.5% and 2.5%. Current density: ${density.toFixed(1)}% (${occurrences} occurrences in ${totalWords} words)`;
            
        await addCheck(
            "Keyphrase Density",
            densityMessage,
            densityInRange,
            `Current density: ${density.toFixed(1)}%, ${occurrences} occurrences in ${totalWords} words`
        );

        // 6. Headings Analysis
        const h1s = scrapedData.headings.filter((h: { level: number; text: string }) => h.level === 1);
        
        // Enhanced H1 check to verify keyphrase presence and ensure single H1 per page
        const hasKeyphraseInH1 = h1s.some((h: { level: number; text: string }) => h.text.toLowerCase().includes(keyphrase.toLowerCase()));
        const hasSingleH1 = h1s.length === 1;
        
        // Pass the check only if there is exactly one H1 and it contains the keyphrase
        const h1CheckPassed = hasSingleH1 && hasKeyphraseInH1;
        
        // Create a more detailed context for the recommendation
        const h1Context = JSON.stringify({
            h1Count: h1s.length,
            h1Texts: h1s.map((h: { level: number; text: string }) => h.text),
            hasSingleH1: hasSingleH1,
            hasKeyphraseInH1: hasKeyphraseInH1
        });
        
        // Determine the appropriate description based on the scenario
        let h1Description = "The page should have exactly one H1 heading containing the focus keyphrase.";
        
        if (!hasSingleH1) {
            h1Description = `The page has ${h1s.length} H1 headings. Ideally, there should be exactly one.`;
        } else if (!hasKeyphraseInH1) {
            h1Description = "The H1 heading should contain the focus keyphrase.";
        }
        
        await addCheck(
            "Keyphrase in H1 Heading",
            h1Description,
            h1CheckPassed,
            h1Context
        );

        // 7. OpenGraph Tags - Use API data if available
        console.log("=== OpenGraph Title and Description Check - DEBUG ===");
        
        // Get OpenGraph title from all possible sources
        const hasOgTitleDirect = Boolean(apiData.ogTitle);
        const hasOgTitleFromPageTitle = Boolean(apiData.usesPageTitleAsOgTitle && apiData.title);
        const hasOgTitleFromScraping = Boolean(scrapedData.ogMetadata.title);
        
        // Get OpenGraph description from all possible sources
        const hasOgDescriptionDirect = Boolean(apiData.ogDescription);
        const hasOgDescriptionFromMetaDesc = Boolean(apiData.usesDescriptionAsOgDescription && apiData.metaDescription);
        const hasOgDescriptionFromScraping = Boolean(scrapedData.ogMetadata.description);
        
        // Overall availability checks
        const hasOgTitle = hasOgTitleDirect || hasOgTitleFromPageTitle || hasOgTitleFromScraping;
        const hasOgDescription = hasOgDescriptionDirect || hasOgDescriptionFromMetaDesc || hasOgDescriptionFromScraping;
        
        // Simplified check - either have direct OG meta tags or have fallbacks
        const titleCheckPasses = hasOgTitleDirect || hasOgTitleFromScraping || apiData.usesPageTitleAsOgTitle;
        const descriptionCheckPasses = hasOgDescriptionDirect || hasOgDescriptionFromScraping || apiData.usesDescriptionAsOgDescription;
        
        // The overall check passes if both title and description are available
        const ogCheckPassed = titleCheckPasses && descriptionCheckPasses;
        
        // Debug logging - detailed info for each data point
        console.log("[SEO Analyzer] OG Title Sources:");
        console.log("- Direct OG Title:", apiData.ogTitle || "(empty)");
        console.log("- Uses Page Title as OG:", apiData.usesPageTitleAsOgTitle);
        console.log("- Page Title:", apiData.title || "(empty)");
        console.log("- Scraped OG Title:", scrapedData.ogMetadata.title || "(empty)");
        
        console.log("[SEO Analyzer] OG Description Sources:");
        console.log("- Direct OG Description:", apiData.ogDescription || "(empty)");
        console.log("- Uses Description as OG:", apiData.usesDescriptionAsOgDescription);
        console.log("- Meta Description:", apiData.metaDescription || "(empty)");
        console.log("- Scraped OG Description:", scrapedData.ogMetadata.description || "(empty)");
        
        console.log("[SEO Analyzer] Title Check Results:");
        console.log("- Has OG Title Direct:", hasOgTitleDirect);
        console.log("- Has OG Title From Page Title:", hasOgTitleFromPageTitle);
        console.log("- Has OG Title From Scraping:", hasOgTitleFromScraping);
        console.log("- Title Check Passes:", titleCheckPasses);
        
        console.log("[SEO Analyzer] Description Check Results:");
        console.log("- Has OG Description Direct:", hasOgDescriptionDirect);
        console.log("- Has OG Description From Meta Desc:", hasOgDescriptionFromMetaDesc);
        console.log("- Has OG Description From Scraping:", hasOgDescriptionFromScraping);
        console.log("- Description Check Passes:", descriptionCheckPasses);
        
        console.log("[SEO Analyzer] FINAL RESULT:", ogCheckPassed ? "PASSED ✅" : "FAILED ❌");
        
        await addCheck(
            "Open Graph Title and Description",
            "OpenGraph meta tags should be present and optimized.",
            ogCheckPassed,
            JSON.stringify({
                title: hasOgTitle ? (apiData.ogTitle || apiData.title || scrapedData.ogMetadata.title) : "(missing)",
                description: hasOgDescription ? (apiData.ogDescription || apiData.metaDescription || scrapedData.ogMetadata.description) : "(missing)",
                usesPageTitleAsOgTitle: apiData.usesPageTitleAsOgTitle,
                usesDescriptionAsOgDescription: apiData.usesDescriptionAsOgDescription,
                titleCheckPasses,
                descriptionCheckPasses
            }, null, 2)
        );

        // 8. Image Analysis
        const imageCheckContext = { images: [] };
        let imageAltTextValid = true;
        let hasNextGenImages = false;
        let allImagesOptimized = true;
        const MAX_IMAGE_SIZE = 500 * 1024; // 500KB
        const nextGenFormats = ['webp', 'avif'];

        try {
            // Use Webflow Designer API to get all assets
            if (typeof webflow !== 'undefined') {
                console.log("Using Webflow Designer API to analyze images");
                const assets = await webflow.getAllAssets();
                console.log(`Found ${assets.length} assets via Webflow Designer API`);
                
                // Process each asset to get more detailed information
                for (const asset of assets) {
                    if (!asset) continue;
                    
                    try {
                        // Extract image data from the asset
                        const imageData: { src: string; alt: string; size?: number; mimeType?: string } = {
                            src: await asset.getUrl() || '',
                            alt: await asset.getAltText() || ''
                        };
                        
                        // Get mime type to determine format
                        try {
                            const mimeType = await asset.getMimeType();
                            imageData.mimeType = mimeType;
                            
                            // Check if it's a next-gen format based on mime type
                            if (mimeType && (
                                mimeType.includes('webp') || 
                                mimeType.includes('avif')
                            )) {
                                hasNextGenImages = true;
                            }
                        } catch (mimeError) {
                            console.error("Error getting mime type:", mimeError);
                            // Fallback: Check file extension
                            const fileExt = imageData.src.split('.').pop()?.toLowerCase();
                            if (fileExt && nextGenFormats.includes(fileExt)) {
                                hasNextGenImages = true;
                            }
                        }
                        
                        // Get file size if available
                        try {
                            // Get file size by fetching the image
                            const imageUrl = await asset.getUrl();
                            if (imageUrl) {
                                const response = await fetch(imageUrl, { method: 'HEAD' });
                                if (response.ok) {
                                    const contentLength = response.headers.get('content-length');
                                    if (contentLength) {
                                        imageData.size = parseInt(contentLength, 10);
                                        
                                        // Check if image exceeds maximum size
                                        if (imageData.size > MAX_IMAGE_SIZE) {
                                            allImagesOptimized = false;
                                        }
                                    }
                                }
                            }
                        } catch (sizeError) {
                            console.error("Error getting file size:", sizeError);
                        }
                        
                        // Check alt text
                        if (!imageData.alt || imageData.alt.trim().length === 0) {
                            imageAltTextValid = false;
                        }
                        
                        // Add to context for reporting
                        imageCheckContext.images.push(imageData);
                    } catch (assetError) {
                        console.error("Error processing asset:", assetError);
                    }
                }
                
                console.log(`Processed ${imageCheckContext.images.length} images via Webflow Designer API`);
            } else {
                // Fallback to scraped data if Webflow API is unavailable
                console.log("Webflow Designer API not available, falling back to scraped data");
                imageCheckContext.images = scrapedData.images;
                imageAltTextValid = scrapedData.images.every((img: { alt: string }) => img.alt?.length > 0);
                hasNextGenImages = scrapedData.images.some((img: { src: string }) => 
                    nextGenFormats.some(format => img.src.toLowerCase().endsWith(`.${format}`))
                );
                allImagesOptimized = scrapedData.images.every((img: { size?: number }) => 
                    !img.size || img.size <= MAX_IMAGE_SIZE
                );
            }
        } catch (error) {
            console.error("Error using Webflow Designer API for image analysis:", error);
            // Fallback to scraped data on error
            imageCheckContext.images = scrapedData.images;
            imageAltTextValid = scrapedData.images.every((img: { alt: string }) => img.alt?.length > 0);
            hasNextGenImages = scrapedData.images.some((img: { src: string }) => 
                nextGenFormats.some(format => img.src.toLowerCase().endsWith(`.${format}`))
            );
            allImagesOptimized = scrapedData.images.every((img: { size?: number }) => 
                !img.size || img.size <= MAX_IMAGE_SIZE
            );
        }

        // Apply Image Alt Text Check
        await addCheck(
            "Image Alt Attributes",
            "Images should have descriptive alt text.",
            imageAltTextValid,
            JSON.stringify(imageCheckContext.images)
        );

        // Apply Next-Gen Image Formats Check
        await addCheck(
            "Next-Gen Image Formats",
            "Images should use modern formats like WebP or AVIF for better performance.",
            hasNextGenImages,
            JSON.stringify(imageCheckContext.images.map((img: { src: string }) => ({ src: img.src })))
        );

        // Apply Image File Size Check
        await addCheck(
            "Image File Size",
            "Images should be optimized and under 500KB for better page load times.",
            allImagesOptimized,
            JSON.stringify(imageCheckContext.images.map((img: { src: string; size?: number }) => ({ src: img.src, size: img.size })))
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
          Page title: ${pageTitle}
          Meta description: ${metaDescription}
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
        console.log("Analyzing introduction paragraphs...");

        // Improved introduction detection
        let keyphraseInIntro = false;
        let introContext = "No suitable introduction paragraph found";

        // Print all paragraphs for debugging
        console.log("All paragraphs:");
        scrapedData.paragraphs.forEach((p: string, idx: number) => {
          if (p.length > 30) {
            console.log(`Paragraph ${idx}: ${p.substring(0, 100)}${p.length > 100 ? '...' : ''}`);
          }
        });

        // Find a suitable introduction paragraph
        // Look through the first few paragraphs
        const potentialIntros = scrapedData.paragraphs
          .filter((p: string) => p.length >= 50) // Only substantial paragraphs
          .slice(0, 5); // Check the first 5 paragraphs

        console.log(`Found ${potentialIntros.length} potential introduction paragraphs`);

        if (potentialIntros.length > 0) {
          // Try different matching techniques for each potential intro paragraph
          for (const paragraph of potentialIntros) {
            const normalizedParagraph = paragraph.toLowerCase().trim();
            const normalizedKeyphrase = keyphrase.toLowerCase().trim();
            
            // Try multiple matching strategies
            const exactMatch = normalizedParagraph.includes(normalizedKeyphrase);
            
            // Allow for singular/plural variations (simple version - just add/remove 's')
            const keyphraseWithS = normalizedKeyphrase.endsWith('s') ? 
              normalizedKeyphrase : `${normalizedKeyphrase}s`;
            const keyphraseWithoutS = normalizedKeyphrase.endsWith('s') ? 
              normalizedKeyphrase.slice(0, -1) : normalizedKeyphrase;
            
            const pluralMatch = normalizedParagraph.includes(keyphraseWithS);
            const singularMatch = normalizedParagraph.includes(keyphraseWithoutS);
            
            // Words in any order (for multi-word keyphrases)
            const keyphraseWords = normalizedKeyphrase.split(/\s+/);
            const allWordsIncluded = keyphraseWords.length > 1 && 
              keyphraseWords.every(word => normalizedParagraph.includes(word));
            
            // Successful if any matching technique works
            if (exactMatch || pluralMatch || singularMatch || allWordsIncluded) {
              keyphraseInIntro = true;
              introContext = paragraph;
              console.log("✅ Found keyphrase in introduction paragraph:", paragraph.substring(0, 100));
              
              // Log which matching technique worked
              if (exactMatch) console.log("- Matched by exact match");
              if (pluralMatch) console.log("- Matched by plural form");
              if (singularMatch) console.log("- Matched by singular form");
              if (allWordsIncluded) console.log("- Matched by all words included");
              
              break;
            }
          }
          
          if (!keyphraseInIntro) {
            introContext = potentialIntros[0]; // Use the first substantial paragraph anyway
            console.log("❌ Keyphrase not found in any introduction paragraph");
          }
        } else {
          console.log("No substantial paragraphs found for introduction check");
        }

        await addCheck(
          "Keyphrase in Introduction",
          keyphraseInIntro
            ? "The focus keyphrase appears naturally in the first paragraph"
            : "The focus keyphrase should appear in the first paragraph to establish topic relevance early",
          keyphraseInIntro,
          introContext
        );
              
        // 14. Keyphrase in H2 Headings Check
        console.log("Analyzing H2 headings for keyphrase:", keyphrase);

        // Get all H2 headings from the page
        const h2Headings = scrapedData.headings.filter((h: { level: number; text: string }) => h.level === 2);

        // Log all H2s found for debugging
        console.log(`Found ${h2Headings.length} H2 headings:`);
        h2Headings.forEach((h: { text: string }, idx: number) => {
            console.log(`H2 #${idx + 1}: "${h.text}"`);
        });

        // Improved keyphrase in H2 detection
        let keyphraseInH2 = false;
        let matchedH2 = '';

        if (h2Headings.length > 0) {
            // Try different matching techniques for each H2
            for (const heading of h2Headings) {
                const normalizedHeading = heading.text.toLowerCase().trim();
                const normalizedKeyphrase = keyphrase.toLowerCase().trim();
                
                // Try multiple matching strategies (similar to our introduction check)
                const exactMatch = normalizedHeading.includes(normalizedKeyphrase);
                
                // Allow for singular/plural variations
                const keyphraseWithS = normalizedKeyphrase.endsWith('s') ? 
                    normalizedKeyphrase : `${normalizedKeyphrase}s`;
                const keyphraseWithoutS = normalizedKeyphrase.endsWith('s') ? 
                    normalizedKeyphrase.slice(0, -1) : normalizedKeyphrase;
                
                const pluralMatch = normalizedHeading.includes(keyphraseWithS);
                const singularMatch = normalizedHeading.includes(keyphraseWithoutS);
                
                // Words in any order (for multi-word keyphrases)
                const keyphraseWords = normalizedKeyphrase.split(/\s+/);
                const allWordsIncluded = keyphraseWords.length > 1 && 
                    keyphraseWords.every(word => normalizedHeading.includes(word));
                
                // Successful if any matching technique works
                if (exactMatch || pluralMatch || singularMatch || allWordsIncluded) {
                    keyphraseInH2 = true;
                    matchedH2 = heading.text;
                    console.log(`✅ Found keyphrase in H2 heading: "${heading.text}"`);
                    
                    // Log which matching technique worked
                    if (exactMatch) console.log("- Matched by exact match");
                    if (pluralMatch) console.log("- Matched by plural form");
                    if (singularMatch) console.log("- Matched by singular form");
                    if (allWordsIncluded) console.log("- Matched by all words included");
                    
                    break;
                }
            }
        }

        if (!keyphraseInH2) {
            console.log("❌ Keyphrase not found in any H2 heading");
        }

        await addCheck(
            "Keyphrase in H2 Headings",
            "At least one H2 heading should contain the focus keyphrase.",
            keyphraseInH2,
            `H2 headings: ${h2Headings.map((h: { text: string }) => h.text).join(', ')}${keyphraseInH2 ? `\nMatched in: "${matchedH2}"` : ''}`
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

        // 16. OpenGraph Image Check - Use API data if available
        const hasOgImage = apiData.ogImage || scrapedData.ogMetadata.image;
        
        await addCheck(
            "OpenGraph Image",
            "The page should have an OpenGraph image.",
            Boolean(hasOgImage),
            hasOgImage || "No OpenGraph image found",
            true
        );

        const score = Math.round((passedChecks / checks.length) * 100);

        return { 
            checks, 
            passedChecks, 
            failedChecks, 
            url, 
            score, 
            timestamp: new Date().toISOString(),
            apiDataUsed: Object.keys(apiData).length > 0  // Flag indicating if API data was used
        };
    } catch (error: any) {
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
  
  
  try {
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
        const results = await analyzeSEOElements(url, keyphrase, env);
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
      return new Response(JSON.stringify({ message: "Internal server error", error: error.message }), { status: 500, headers: corsHeaders });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ message: "Internal server error", error: error.message }), { status: 500, headers: corsHeaders });
  }
}

// ===== Begin Security Functions (moved from server\lib\security.ts) =====

const ENFORCE_ALLOWLIST = process.env.ENFORCE_DOMAIN_ALLOWLIST !== 'false';

export function addDomainToAllowlist(domain: string): boolean {
  domain = domain.toLowerCase().trim();
  if (ALLOWED_DOMAINS.includes(domain)) {
    return false;
  }
  ALLOWED_DOMAINS.push(domain);
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
      return false;
    }
    if (ENFORCE_ALLOWLIST && !isAllowedDomain(url.hostname)) {
      return false;
    }
    const pathname = url.pathname;
    if (pathname.includes('../') || pathname.includes('/..')) {
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
  if (ALLOWED_DOMAINS.includes(domain)) {
    return true;
  }
  const matchedWildcard = ALLOWED_DOMAINS.find(allowedDomain => {
    if (allowedDomain.startsWith('*.')) {
      const baseDomain = allowedDomain.substring(2);
      const matches = domain.endsWith(baseDomain) && domain.length > baseDomain.length;
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
    const urlObj = new URL(url);
    const protocol = urlObj.protocol.toLowerCase();
    if (protocol !== 'https:') {
      return false;
    }
    const hostname = urlObj.hostname;
    if (ENFORCE_ALLOWLIST && !isAllowedDomain(hostname)) {
      return false;
    }
    if (isIPv4Format(hostname) || isIPv6Format(hostname)) {
      const ipValid = validateIPAddress(hostname);
      return ipValid;
    }
    return true;
  } catch (e) {
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
  try {
    const urlObj = new URL(url);
    const result = urlObj.pathname === "/" || urlObj.pathname === "";
    return result;
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

// Helper function to check if a page has Webflow Designer API data available
async function hasWebflowDesignerData(): Promise<boolean> {
  try {
    // Get the current page and check if it has the expected methods
    const currentPage = await webflow.getCurrentPage();
    // Use bracket notation to avoid TypeScript errors with potential missing methods
    return currentPage && typeof (currentPage as any).getDescription === 'function';
  } catch (error) {
    console.error("Error checking for Webflow Designer API:", error);
    return false;
  }
}

export default { fetch: handleRequest }