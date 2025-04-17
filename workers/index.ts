// ===== Imports =====
import OpenAI from 'openai';
import * as ip from "ip";
import { URL } from "url";

export {}; // Ensure this file is treated as a module

// Add utility function for extracting full text content from HTML elements with nested children
/**
 * Extracts the complete text content from HTML elements, including text within nested elements
 * @param html The HTML string to extract text from
 * @param tagPattern The regex pattern to match the desired tag (e.g., h1, p, etc.)
 * @returns An array of extracted text strings
 */
export function extractFullTextContent(html: string, tagPattern: RegExp): string[] {
  const results: string[] = [];
  let match;

  // Find all instances of the pattern in HTML
  while ((match = tagPattern.exec(html)) !== null) {
    if (match[1]) {
      // Extract the content between opening and closing tags
      const fullTagContent = match[1];

      // Improved debugging - log the raw content found
      console.log(`[SEO Analyzer] Found tag content: ${fullTagContent.substring(0, 50)}${fullTagContent.length > 50 ? '...' : ''}`);

      // Strip HTML tags but preserve the text content
      const textContent = fullTagContent
        .replace(/<!--.*?-->/gs, '') // Remove comments first
        .replace(/<[^>]+>/g, ' ')  // Replace tags with spaces
        .replace(/\s+/g, ' ')      // Replace multiple spaces with single space
        .replace(/\s+([.,!?;:])/g, '$1') // Remove space before punctuation
        .trim();

      // Additional debugging for the extracted text
      console.log(`[SEO Analyzer] Extracted text: "${textContent}"`);

      if (textContent) {
        results.push(textContent);
      }
    }
  }

  // Add debug log for all extracted results
  console.log(`[SEO Analyzer] Total extracted items: ${results.length}`);
  if (results.length > 0) {
    console.log(`[SEO Analyzer] First extracted item: "${results[0]}"`);
  }

  return results;
}

// ===== Constants =====
const ALLOWED_DOMAINS = [
  "example.com",
  "pull-list.net",
  "*.pull-list.net",
  "www.pmds.pull-list.net",
  "pmds.pull-list.net"
];

// Helper function to get AI-powered SEO recommendations
export async function getAIRecommendation(title: string, keyphrase: string, env: any, context?: string, additionalContext?: string): Promise<string> {
  try {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY
    });

    // ... (context truncation logic remains the same) ...
    const truncatedContext = context && context.length > 300
      ? context.substring(0, 300) + "..."
      : context;
    const truncatedAdditionalContext = additionalContext && additionalContext.length > 200
      ? additionalContext.substring(0, 200) + "..."
      : additionalContext;

    // ... (introduction phrases and system/user content remain the same) ...
    const introductionPhrases = [
      "Here is a better [element]: [example]",
      "Try this improved [element]: [example]",
      "Recommended [element]: [example]",
      "Optimize your [element] with: [example]",
      "Better [element] suggestion: [example]",
      "Enhanced [element]: [example]"
    ];
    const selectedIntroPhrase = introductionPhrases[Math.floor(Math.random() * introductionPhrases.length)];
    const systemContent = `You are an SEO expert providing concise, actionable recommendations.
         Keep responses under 100 words.
         Format: "${selectedIntroPhrase}"
         Avoid quotation marks.`;
    const userContent = `Fix this SEO issue: "${title}" for keyphrase "${keyphrase}".
         ${truncatedContext ? `Current content: ${truncatedContext}` : ''}
         ${truncatedAdditionalContext ? `Additional context: ${truncatedAdditionalContext}` : ''}`;


    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userContent }
      ],
      max_tokens: 120,
      temperature: 0.2,
    });

    const rawRecommendation = response.choices[0].message.content;

    // Handle null/undefined/empty raw recommendation *before* cleaning
    if (!rawRecommendation || rawRecommendation.trim() === '') {
        console.log("[SEO Analyzer] OpenAI returned empty recommendation, using fallback.");
        // Return the specific fallback for empty AI response
        return `Add "${keyphrase}" to your ${title.toLowerCase()}`;
    }

    const recommendation = rawRecommendation.trim(); // Now we know it's a non-empty string

    // Clean the recommendation - Refined logic
    let cleanedRecommendation = recommendation
      // Remove surrounding quotes FIRST
      .replace(/^["']|["']$/g, '')
      // Remove common conversational prefixes
      .replace(/^(?:I recommend|You should|Consider|Suggested|Here'?s|Recommendation:|Suggestion:|Update:|Fix:)\s+/i, '')
      // Remove the specific intro patterns used in the prompt (match element name loosely)
      .replace(/^(?:Here is a better|A better|Try this improved|Try this|Recommended|Optimize your|Better|Enhanced|Improved)\s+.+?:\s*/i, '')
      // ADDED: Remove potential malformed prefixes like "[element]: "
      .replace(/^\[.*?\]:\s*/, '')
      // Remove quotes around internal text (optional, check if needed)
      // .replace(/["']([^"']+)["']/g, '$1')
      // Remove backticks
      .replace(/`([^`]+)`/g, '$1')
      // Remove trailing colons or whitespace
      .replace(/:\s*$/, '')
      .trim(); // Trim final result

    // Return cleaned recommendation (fallback here is less likely needed but safe)
    return cleanedRecommendation || `Add "${keyphrase}" to your ${title.toLowerCase()}`;

  } catch (error) {
    console.error("[SEO Analyzer] Error getting AI recommendation:", error);
    // This fallback is now *only* for actual API errors or unexpected issues
    return `${keyphrase.charAt(0).toUpperCase() + keyphrase.slice(1)} - Your Website`;
  }
}

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

  const tokenUrl = 'https://api.webflow.com/oauth/access_token';
  const urlWithCacheBust = new URL(tokenUrl);
  urlWithCacheBust.searchParams.set('_t', Date.now().toString()); // Add cache buster

  const response = await fetch(urlWithCacheBust.toString(), { // Use updated URL
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store', // Prevent caching of this request/response
      'Pragma': 'no-cache'
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
    cache: 'no-store', // Standard fetch cache directive
    cf: { cacheTtl: 0 } // Prevent Cloudflare edge caching
  } as RequestInit); // Cast to include Cloudflare specific properties

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

// Seo analyzer constants
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
    "Image Alt Attributes": "Great job! Your images have descriptive alt text that includes your target keyphrase. 👌",
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

// Check if a specific page is published using the Webflow Designer API
async function isPagePublished(url: string): Promise<boolean> {
  try {
    console.log(`[SEO Analyzer] Checking publication status for URL: ${url}`);

    // Check if the Webflow Designer API is available
    if (typeof webflow === 'undefined') {
      console.log("[SEO Analyzer] Webflow Designer API not available in this environment");
      return true; // Assume the page is published if we can't check
    }

    try {
      // First, get the current page to check if we're currently viewing the target URL
      const currentPage = await webflow.getCurrentPage();
      if (!currentPage) {
        console.log("[SEO Analyzer] Failed to get current page from Webflow API");
        return true; // Assume page is published if we can't verify
      }

      // Parse the URL we're analyzing
      const analyzedUrl = new URL(url);
      const analyzedPathname = analyzedUrl.pathname.replace(/^\/|\/$/g, ''); // Remove leading/trailing slashes
      
      console.log(`[SEO Analyzer] Analyzing URL path: ${analyzedPathname}`);
      
      // If this is the current page we're viewing in Webflow Designer
      const currentPageSlug = await currentPage.getSlug();
      const currentPagePublishPath = await currentPage.getPublishPath();
      
      console.log(`[SEO Analyzer] Current page slug: ${currentPageSlug}`);
      console.log(`[SEO Analyzer] Current page publish path: ${currentPagePublishPath}`);
      
      // Check if we're currently viewing the page we want to analyze
      if (currentPagePublishPath === analyzedPathname || 
          '/' + currentPagePublishPath === analyzedUrl.pathname ||
          currentPageSlug === analyzedPathname) {
        
        console.log("[SEO Analyzer] Target URL matches current page");
        
        try {
          // If we're on the page, we can directly check if it's published
          // The getPublishPath method returns null for unpublished pages
          if (currentPagePublishPath) {
            console.log("[SEO Analyzer] Current page has publish path, so it's published");
            return true;
          }

          console.log("[SEO Analyzer] Current page has no publish path, may not be published");
          // If we're in Draft mode, we still want to analyze the page
          return true;
        } catch (error) {
          console.error("[SEO Analyzer] Error checking current page publish status:", error);
          return true; // Default to allowing analysis
        }
      }
      
      // If we're not on the page we want to analyze, we need to search for it
      console.log("[SEO Analyzer] Target URL doesn't match current page, searching all pages...");
      
      // Get all pages and folders
      const pagesAndFolders = await webflow.getAllPagesAndFolders();
      if (!pagesAndFolders || !Array.isArray(pagesAndFolders)) {
        console.log("[SEO Analyzer] Failed to retrieve pages from Webflow API");
        return true; // Assume page exists if we can't check
      }
      
      // Filter to only include Page objects (not Folders)
      const pages = pagesAndFolders.filter(item => 'getSlug' in item && typeof item.getSlug === 'function');
      console.log(`[SEO Analyzer] Found ${pages.length} pages to check`);
      
      // Search through all pages to find a match
      for (const page of pages) {
        try {
          const pageSlug = await page.getSlug();
          const publishPath = 'getPublishPath' in page && typeof page.getPublishPath === 'function' 
            ? await page.getPublishPath() 
            : null;
          
          console.log(`[SEO Analyzer] Checking page: slug=${pageSlug}, path=${publishPath}`);
          
          // Check if this page matches our target URL
          if ((publishPath && (publishPath === analyzedPathname || 
                              '/' + publishPath === analyzedUrl.pathname)) || 
              (pageSlug && pageSlug === analyzedPathname)) {
            
            console.log(`[SEO Analyzer] Found matching page: ${pageSlug}`);
            
            // Check if the page is published by verifying it has a publish path
            if (publishPath) {
              console.log("[SEO Analyzer] Page has publish path, so it's published");
              return true;
            } else {
              console.log("[SEO Analyzer] Page has no publish path, may not be published");
              // Even if it appears unpublished, we'll continue with analysis in case we're in draft mode
              return true;
            }
          }
        } catch (pageError) {
          console.error("[SEO Analyzer] Error checking page:", pageError);
          // Continue checking other pages
        }
      }
      
      // If we didn't find a matching page, we'll still allow the analysis
      console.log("[SEO Analyzer] No matching page found in Webflow site");
      return true;
    } catch (apiError) {
      console.error("[SEO Analyzer] Error using Webflow API:", apiError);
      return true; // Default to allowing analysis
    }
  } catch (error) {
    console.error("[SEO Analyzer] General error in isPagePublished:", error);
    return true; // Default to allowing analysis
  }
}

async function scrapeWebpage(url: string): Promise<any> {
  try {
    const maxRetries = 3;
    let lastError = null;

    // Normalize URL format
    let normalizedUrl = url;
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = `https://${normalizedUrl}`;
    } else if (url.startsWith('http://')) {
      normalizedUrl = url.replace(/^http:/, 'https:');
    }
    
    console.log(`[SEO Analyzer] Starting analysis of URL: ${normalizedUrl}`);
    
    // First, check if the page is published using the Webflow Designer API
    try {
      const pageIsPublished = await isPagePublished(normalizedUrl);
      if (!pageIsPublished) {
        console.log(`[SEO Analyzer] Warning: Page at ${normalizedUrl} appears to be unpublished according to Webflow API`);
        // Continue anyway since we want to be permissive
      }
    } catch (apiError) {
      // Just log the error but continue with fetching anyway
      console.error("[SEO Analyzer] Error checking page status with Webflow API:", apiError);
    }

    // Generate URL variants to try if the main URL fails
    const urlObj = new URL(normalizedUrl);
    const urlPathname = urlObj.pathname.replace(/^\/|\/$/g, '');
    const urlSegments = urlPathname.split('/');
    const lastSegment = urlSegments[urlSegments.length - 1];
    
    // Start with the original URL as the first variant to try
    const urlVariants = [normalizedUrl];
    
    // If we're missing a path segment that might be a folder (like 'services')
    // or if the URL only has one path segment, try adding common folder paths
    if (urlSegments.length === 1 && lastSegment) {
      console.log(`[SEO Analyzer] URL appears to have a simple path. Adding common folder variants.`);
      
      // Common folder names to try
      const commonFolders = ['services', 'projects', 'about', 'blog', 'products', 'portfolio'];
      
      for (const folder of commonFolders) {
        // Add folder path variant (e.g., /services/hosting-maintenance)
        const folderUrl = new URL(normalizedUrl);
        folderUrl.pathname = `/${folder}/${lastSegment}`;
        urlVariants.push(folderUrl.toString());
      }
    }
    
    // Try both www and non-www variants, preserving the full path
    if (!urlObj.hostname.startsWith('www.')) {
      const withWww = new URL(normalizedUrl);
      withWww.hostname = 'www.' + withWww.hostname;
      urlVariants.push(withWww.toString());
      
      // Also add www + common folder variants if it's a simple path
      if (urlSegments.length === 1 && lastSegment) {
        const commonFolders = ['services', 'projects', 'about', 'blog', 'products', 'portfolio'];
        for (const folder of commonFolders) {
          const wwwFolderUrl = new URL(normalizedUrl);
          wwwFolderUrl.hostname = 'www.' + wwwFolderUrl.hostname;
          wwwFolderUrl.pathname = `/${folder}/${lastSegment}`;
          urlVariants.push(wwwFolderUrl.toString());
        }
      }
    } else {
      const noWww = new URL(normalizedUrl);
      noWww.hostname = noWww.hostname.substring(4);
      urlVariants.push(noWww.toString());
    }
    
    // Add the specific path from your error (for this specific case)
    // This helps ensure we try the exact path that works
    const specificUrl = new URL(normalizedUrl);
    if (specificUrl.pathname.includes('hosting-maintenance') && !specificUrl.pathname.includes('services')) {
      specificUrl.pathname = '/services/hosting-maintenance';
      urlVariants.unshift(specificUrl.toString()); // Add at the beginning for priority
    }
    
    // Remove duplicates
    const uniqueVariants = Array.from(new Set(urlVariants));
    
    // Log all URL variants we'll try
    console.log(`[SEO Analyzer] Will try these URL variants: ${JSON.stringify(uniqueVariants)}`);

    // Initialize fetch options with proper headers and settings
    const fetchOptions = {
      headers: {
        'User-Agent': 'SEO-Analyzer/2.3.2 (https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow)',
        'Accept': 'text/html,application/xhtml+xml,application/xml',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache, no-store, must-revalidate', // More explicit request headers
        'Pragma': 'no-cache', // For older HTTP/1.0 caches
        'Expires': '0' // For older HTTP/1.0 caches
      },
      redirect: 'follow' as RequestRedirect,
      cache: 'no-store', // Standard fetch cache directive
      cf: { // Cloudflare-specific options
        cacheTtl: 0, // Don't cache the response at Cloudflare edge
      }
    } as RequestInit; // Cast to include Cloudflare specific properties
    
    // Try each URL variant with retries
    for (let variantUrl of uniqueVariants) {
      // Add cache-busting parameter
      const urlWithCacheBust = new URL(variantUrl);
      urlWithCacheBust.searchParams.set('_t', Date.now().toString());
      variantUrl = urlWithCacheBust.toString();

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          console.log(`[SEO Analyzer] Attempt ${attempt + 1}/${maxRetries} for URL: ${variantUrl}`);
          
          // Add a small delay between retry attempts (increasing with each retry)
          if (attempt > 0) {
            const delay = attempt * 500; // 500ms, 1000ms, 1500ms
            console.log(`[SEO Analyzer] Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          // Make the fetch request
          const response = await fetch(variantUrl, fetchOptions);
          
          // Process response status
          if (response.status === 200) {
            // Success!
            console.log(`[SEO Analyzer] Successfully fetched URL: ${variantUrl}`);
            const html = await response.text();
            console.log(`[SEO Analyzer] Retrieved ${html.length} bytes of HTML`);
            
            // Extract data from the HTML
            return processHtml(html, variantUrl);
          } 
          else if (response.status === 301 || response.status === 302 || response.status === 307 || response.status === 308) {
            // Handle redirects manually if Cloudflare Workers has issues with following them
            const location = response.headers.get('Location');
            if (location) {
              const redirectUrl = new URL(location, variantUrl).toString();
              console.log(`[SEO Analyzer] Following redirect: ${variantUrl} -> ${redirectUrl}`);
              
              // Add redirect URL to variants if not already there
              if (!uniqueVariants.includes(redirectUrl)) {
                uniqueVariants.push(redirectUrl);
              }
              break; // Break out of retry loop for this URL to try the redirect URL
            }
          }
          else {
            // Handle various HTTP status errors
            const errorMessage = `Failed to fetch URL (HTTP ${response.status}): ${variantUrl}`;
            console.error(`[SEO Analyzer] ${errorMessage}`);
            lastError = new Error(errorMessage);
            
            // For certain status codes, we should immediately try the next variant
            if (response.status === 404 || response.status === 410) {
              break; // Break out of retry loop for this URL
            }
          }
        } catch (fetchError: any) {
          // Log the error
          console.error(`[SEO Analyzer] Fetch error for ${variantUrl} (attempt ${attempt + 1}):`, fetchError.message);
          lastError = fetchError;
          
          // Some errors indicate immediate next variant
          if (fetchError.message && (
              fetchError.message.includes('ENOTFOUND') ||
              fetchError.message.includes('ECONNREFUSED') ||
              fetchError.message.includes('DNS')
          )) {
            break; // Try next variant immediately for DNS/connection issues
          }
        }
      }
    }
    
    // If we got here, all URL variants and retries failed
    throw lastError || new Error(`Failed to fetch page after trying all URL variants`);
  } catch (error: any) {
    throw new Error(`Failed to scrape webpage: ${error.message}`);
  }
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

// Function to detect schema markup in HTML content
function detectSchemaMarkup(html: string): { 
  hasSchema: boolean;
  schemaTypes: string[];
  schemaCount: number;
} {
  // Look for JSON-LD script tags
  const schemaRegex = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const matches = [...html.matchAll(schemaRegex)];
  
  const result = {
    hasSchema: false,
    schemaTypes: [] as string[],
    schemaCount: 0
  };
  
  // Process each schema found
  matches.forEach(match => {
    try {
      const jsonContent = match[1]?.trim();
      if (jsonContent) {
        const schemaData = JSON.parse(jsonContent);
        result.hasSchema = true;
        result.schemaCount++;
        
        // Extract schema type(s)
        const extractType = (obj: any): string | null => {
          if (obj && typeof obj === 'object') {
            if (obj['@type']) {
              return obj['@type'];
            } else if (obj['@graph'] && Array.isArray(obj['@graph'])) {
              return obj['@graph'].map((item: any) => item['@type']).filter(Boolean).join(', ');
            }
          }
          return null;
        };
        
        const schemaType = extractType(schemaData);
        if (schemaType && !result.schemaTypes.includes(schemaType)) {
          result.schemaTypes.push(schemaType);
        }
      }
    } catch (error) {
      // Invalid JSON in schema markup
      console.error("Error parsing schema markup:", error);
    }
  });
  
  return result;
}

// Function to process HTML content for SEO analysis
async function processHtml(html: string, url: string): Promise<any> {
  try {
    console.log(`[SEO Analyzer] Processing HTML content from: ${url}`);
    
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
    
    console.log("[SEO Analyzer] Meta Description Found:", metaDescription || "(none)");
    
    // Extract OpenGraph metadata
    const ogMetadata: Record<string, string> = {
      title: "",
      description: "",
      image: "",
      imageWidth: "",
      imageHeight: ""
    };

    // Extract OG title - Fix the regex to properly match the content
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']\s*\/?>/i) || 
                         html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']\s*\/?>/i);
    if (ogTitleMatch) ogMetadata.title = ogTitleMatch[1].trim();

    // Extract OG description - Improved regex pattern
    const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']\s*\/?>/i) ||
                        html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:description["']\s*\/?>/i);
    if (ogDescMatch) ogMetadata.description = ogDescMatch[1].trim();

    // Extract OG image - Improved regex pattern
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']\s*\/?>/i) ||
                         html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']\s*\/?>/i);
    if (ogImageMatch) ogMetadata.image = ogImageMatch[1].trim();

    // Extract OG image dimensions - Improved regex patterns
    const ogImageWidthMatch = html.match(/<meta\s+property=["']og:image:width["']\s+content=["']([^"']+)["']\s*\/?>/i) ||
                              html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image:width["']\s*\/?>/i);
    if (ogImageWidthMatch) ogMetadata.imageWidth = ogImageWidthMatch[1].trim();

    const ogImageHeightMatch = html.match(/<meta\s+property=["']og:image:height["']\s+content=["']([^"']+)["']\s*\/?>/i) ||
                               html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image:height["']\s*\/?>/i);
    if (ogImageHeightMatch) ogMetadata.imageHeight = ogImageHeightMatch[1].trim();

    // Try more flexible matching if the strict patterns didn't match
    if (!ogTitleMatch) {
      const flexMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["'][^>]*>/i);
      if (flexMatch) ogMetadata.title = flexMatch[1].trim();
    }

    if (!ogDescMatch) {
      const flexMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                       html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["'][^>]*>/i);
      if (flexMatch) ogMetadata.description = flexMatch[1].trim();
    }

    if (!ogImageMatch) {
      const flexMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
                       html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["'][^>]*>/i);
      if (flexMatch) ogMetadata.image = flexMatch[1].trim();
    }
    
    // Extract body content
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : html;
    const content = bodyContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    console.log("[SEO Analyzer] Extracted content:", content.substring(0, 200) + "...");

    console.log("[SEO Analyzer] Scraping paragraphs...");
    // Use regex to extract paragraphs instead of DOM API
    const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    const paragraphMatches = [...bodyContent.matchAll(paragraphRegex)];
    console.log("[SEO Analyzer] Total p tags found:", paragraphMatches.length);

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
        console.log(`[SEO Analyzer] Paragraph found in ${parentClass}:`, text.substring(0, 100) + (text.length > 100 ? '...' : ''));
        return text;
      })
      .filter(text => text.length > 0);
    
    // Extract headings - UPDATED to properly handle nested elements with spans
    const headings: Array<{ level: number; text: string }> = [];
    for (let i = 1; i <= 6; i++) {
      // Create pattern that captures the full content between opening and closing tags
      const headingPattern = new RegExp(`<h${i}[^>]*>(.*?)<\\/h${i}>`, 'gi');
      
      // Extract full text content including nested elements using our utility function
      const headingTexts = extractFullTextContent(html, headingPattern);
      
      // Add all found headings to the list
      headingTexts.forEach(text => {
        headings.push({ level: i, text });
      });
    }
    
    // Extract images with sizes
    const images: Array<{ src: string; alt: string; size?: number }> = [];
    const imageMatches = html.matchAll(/<img[^>]*src=["'](.*?)["'][^>]*alt=["'](.*?)["'][^>]*>/gi);
    for (const match of imageMatches) {
      images.push({ src: match[1], alt: match[2] });
    }
    
    // Also match images where alt comes before src (Webflow sometimes does this)
    const altFirstImageMatches = html.matchAll(/<img[^>]*alt=["'](.*?)["'][^>]*src=["'](.*?)["'][^>]*>/gi);
    for (const match of altFirstImageMatches) {
      images.push({ src: match[2], alt: match[1] });
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
          // Just continue if we can't fetch a script
          resources.js.push({
            url: scriptUrl,
            content: '',
            minified: scriptUrl.includes('.min.js') || scriptUrl.includes('-min.js')
          });
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
          // Just continue if we can't fetch a stylesheet
          resources.css.push({
            url: cssUrl,
            content: '',
            minified: cssUrl.includes('.min.css') || cssUrl.includes('-min.css')
          });
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

    // Process schema matches
    for (const match of matchesArray) {
      try {
        // Extract and trim the content inside the script tag
        const scriptContent = match[1].trim();
        
        // Try to parse the JSON
        try {
          const jsonData = JSON.parse(scriptContent);
          
          schema.detected = true;
          schema.jsonLdBlocks.push(jsonData);
          
          if (jsonData['@type']) {
            schema.types.push(jsonData['@type']);
          } else if (Array.isArray(jsonData)) {
            jsonData.forEach((item) => {
              if (item && item['@type']) {
                schema.types.push(item['@type']);
              }
            });
          }
        } catch (jsonError) {
          // Just continue if we can't parse the JSON
        }
      } catch (e) {
        // Just continue if there's an error processing this match
      }
    }

    // Extract Microdata schema as well
    const microdataMatches = html.matchAll(/<[^>]+\s+itemscope[^>]*>/gi);
    for (const match of microdataMatches) {
      const itemTypeMatch = match[0].match(/itemtype=["'](.*?)["']/i);
      if (itemTypeMatch) {
        schema.detected = true;
        const types = itemTypeMatch[1].split(/\s+/).filter(Boolean);
        schema.microdataTypes.push(...types);
      }
    }

    // Add schema markup detection
    const schemaMarkup = detectSchemaMarkup(html);

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
      schema,
      schemaMarkup
    };
  } catch (error) {
    console.error("[SEO Analyzer] Error processing HTML:", error);
    throw error;
  }
}

// Helper function for checking image alt text quality
function assessAltTextQuality(images: Array<{ src: string; alt: string }>, keyphrase: string): { 
  hasAltText: boolean; 
  hasKeyphraseInAlt: boolean;
  qualityScores: Array<{ src: string; alt: string; score: number; issues: string[]; hasKeyphrase: boolean }>;
  overallScore: number;
} {
  // Initialize the result
  const result = {
    hasAltText: true,
    hasKeyphraseInAlt: false,
    qualityScores: [] as Array<{ src: string; alt: string; score: number; issues: string[]; hasKeyphrase: boolean }>,
    overallScore: 0
  };
  
  if (!images || images.length === 0) {
    return result;
  }
  
  const normalizedKeyphrase = keyphrase.toLowerCase().trim();
  
  // Analyze each image alt text quality
  let totalScore = 0;
  
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const alt = img.alt || '';
    const normalizedAlt = alt.toLowerCase().trim();
    const issues = [];
    let score = 10; // Start with perfect score
    
    // Check if alt text exists
    if (!alt || alt.trim() === '') {
      score = 0;
      issues.push('Missing alt text');
    } else {
      // Check if alt text is too short (< 5 chars)
      if (alt.length < 5) {
        score -= 5;
        issues.push('Alt text too short');
      }
      
      // Ensure score doesn't go negative
      score = Math.max(0, score);
    }
    
    // Check if the alt text contains the keyphrase
    const hasKeyphrase = normalizedAlt.includes(normalizedKeyphrase);
    
    // Update the overall keyphrase presence flag
    if (hasKeyphrase) {
      result.hasKeyphraseInAlt = true;
    }
    
    // Add to quality scores array
    result.qualityScores.push({ 
      src: img.src, 
      alt: alt, 
      score: score, 
      issues: issues,
      hasKeyphrase: hasKeyphrase
    });
    
    totalScore += score;
  }
  
  // Calculate overall score (average)
  result.overallScore = images.length > 0 ? Math.round(totalScore / images.length) : 0;
  
  // Update hasAltText based on whether any image is missing alt text
  result.hasAltText = !result.qualityScores.some(item => item.issues.includes('Missing alt text'));
  
  return result;
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
            isHomePage(urlForCheck) || urlForCheck.toLowerCase().includes(keyphrase.toLowerCase()),
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
        const h1Check = {
            title: "Keyphrase in H1 Heading",
            description: "The H1 heading should contain the focus keyphrase.",
            passed: false
        };
        
        // Specific debug for H1 headings
        console.log(`[SEO Analyzer] Found ${h1s.length} H1 headings`);
        h1s.forEach((h: { text: string }, i: number) => {
            console.log(`[SEO Analyzer] H1 #${i + 1}: "${h.text}"`);
        });
        
        // Check if any H1 contains the keyphrase (case-insensitive)
        const normalizedKeyphrase = keyphrase.toLowerCase();
        const h1ContainsKeyphrase = h1s.some((h: { text: string }) => {
            const normalizedH1 = h.text.toLowerCase();
            const containsKeyphrase = normalizedH1.includes(normalizedKeyphrase);
            console.log(`[SEO Analyzer] H1 "${h.text}" contains keyphrase "${keyphrase}": ${containsKeyphrase}`);
            return containsKeyphrase;
        });
        
        h1Check.passed = h1ContainsKeyphrase;
        
        // Context for recommendation
        const h1Context = h1s.length === 0 
            ? "No H1 heading found on the page." 
            : h1s.map((h: { text: string }) => h.text).join("; ");
        
        await addCheck(
            h1Check.title,
            h1Check.description,
            h1Check.passed,
            h1Context
        );

        // 7. OpenGraph Tags - Use API data if available
        console.log("=== OpenGraph Title and Description Check - DEBUG ===");
        const hasOGTitle = Boolean(scrapedData.ogMetadata.title);
        const hasOGDescription = Boolean(scrapedData.ogMetadata.description);
        const ogTitleLength = scrapedData.ogMetadata.title.length;
        const ogDescLength = scrapedData.ogMetadata.description.length;
      
        const ogCheckPassed = hasOGTitle && hasOGDescription &&
          ogTitleLength >= 10 && ogTitleLength <= 70 &&
          ogDescLength >= 100 && ogDescLength <= 200;

        await addCheck(
            "OG Title and Description",
            ogCheckPassed
                ? "Open Graph title and description are properly set with optimal lengths"
                : "Open Graph title and/or description need optimization",
            ogCheckPassed,
            JSON.stringify({
                title: apiData.ogTitle || scrapedData.ogMetadata.title || "(using page title)",
                description: apiData.ogDescription || scrapedData.ogMetadata.description || "(using meta description)",
                usesPageTitleAsOgTitle: apiData.usesPageTitleAsOgTitle,
                usesDescriptionAsOgDescription: apiData.usesDescriptionAsOgDescription
            }),
            false
        );

        // 8. Image Analysis
        const imageCheckContext = { images: [] as Array<{ src: string; alt: string; size?: number; mimeType?: string }> };
        let imageAltTextValid = true;
        let hasNextGenImages = false;
        let allImagesOptimized = true;
        const MAX_IMAGE_SIZE = 500 * 1024; // 500KB
        const nextGenFormats = ['webp', 'avif'];

        try {
          // Use Webflow Designer API to get all assets
          if (typeof webflow !== 'undefined') {
            try {
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
              } catch (apiError) {
                  console.error("Error using Webflow Designer API for images:", apiError);
                  // Fallback to scraped data on API error
                  imageCheckContext.images = scrapedData.images;
                  imageAltTextValid = scrapedData.images.every((img: { alt: string }) => img.alt?.length > 0);
                  hasNextGenImages = scrapedData.images.some((img: { src: string }) => 
                      nextGenFormats.some(format => img.src.toLowerCase().endsWith(`.${format}`))
                  );
                  allImagesOptimized = scrapedData.images.every((img: { size?: number }) => 
                      !img.size || img.size <= MAX_IMAGE_SIZE
                  );
              }
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

        // Assess alt text quality first
        const assessment = assessAltTextQuality(imageCheckContext.images, keyphrase);

        // Apply Image Alt Text Check
        await addCheck(
          "Image Alt Attributes",
          "At least one image should have alt text that includes your target keyphrase.",
          assessment.hasKeyphraseInAlt && imageCheckContext.images.length > 0,
          JSON.stringify(imageCheckContext.images)
        );

        // If the check failed, add our custom recommendation
        const imageAltCheck = checks.find(check => check.title === "Image Alt Attributes");
        if (imageAltCheck && !imageAltCheck.passed) {
            // Create detailed context for better recommendations
            const missingAltCount = imageCheckContext.images.filter(img => !img.alt || img.alt.trim() === '').length;
            const totalImages = imageCheckContext.images.length;
            const context = `Page has ${totalImages} images. ${missingAltCount} images missing alt text. Target keyphrase: "${keyphrase}"`;
            
            // Use the existing AI recommendation function instead of custom generator
            imageAltCheck.recommendation = await getAIRecommendation(
                "Image Alt Attributes", 
                keyphrase, 
                env, 
                context
            );
        }

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

        // 12. Add schema markup check
        const hasSchemaMarkup = scrapedData.schema.detected;
        const schemaTypesDetected = scrapedData.schema.types;

        // Create context for recommendation
        let schemaContext = "";
        if (hasSchemaMarkup) {
          schemaContext = `Schema markup found on page. Types detected: ${schemaTypesDetected.join(', ') || 'Unknown'}`;
        } else {
          // Create detailed context to help generate a relevant recommendation
          const h1Tags = scrapedData.headings.filter((h: { level: number; text: string }) => h.level === 1);
          const h2Tags = scrapedData.headings.filter((h: { level: number; text: string }) => h.level === 2);
          schemaContext = `
          No schema markup detected on page.
          Page title: ${scrapedData.title}
          Meta description: ${scrapedData.metaDescription}
          URL: ${url}
          Content type indicators:
          - First H1: ${h1Tags.length > 0 ? h1Tags[0].text : 'None'}
          - First few H2s: ${h2Tags.slice(0, 3).map((h: { level: number; text: string }) => h.text).join(', ')}
          - Has images: ${scrapedData.images.length > 0 ? 'Yes' : 'No'}
          - Is homepage: ${isHomePage(url) ? 'Yes' : 'No'}
          - Content preview: ${scrapedData.paragraphs.slice(0, 2).join(' ').substring(0, 200)}...
          `;
        }

        // For schema markup, always use our custom recommendation instead of GPT
        let schemaRecommendation = "";
        if (hasSchemaMarkup) {
          schemaRecommendation = `Your page has schema markup implemented. The following schema types were detected:\n\n`;
          if (schemaTypesDetected.length > 0) {
            schemaTypesDetected.forEach((type: string, index: number) => {
              schemaRecommendation += `${index + 1}. **${type}** - This helps search engines understand that your content represents a ${type.toLowerCase()}\n`;
            });
            schemaRecommendation += `\nYou can further optimize your schema markup by ensuring all required properties are included for each type.`;
          } else {
            schemaRecommendation += `Schema markup was detected but the specific type couldn't be determined. Consider using more specific schema types from schema.org.`;
          }
        } else {
          // Use our custom recommendation generator instead of GPT
          schemaRecommendation = generateSchemaMarkupRecommendation(scrapedData, url);
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

        // If the check failed, add our custom recommendation with specific image information
        const schemaCheck = checks.find(check => check.title === "Schema Markup");
        if (schemaCheck) {
          schemaCheck.recommendation = schemaRecommendation;
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
                const keyphraseWordsIncluded = keyphraseWords.length > 1 && 
                    keyphraseWords.every(word => normalizedHeading.includes(word));
                
                // Successful if any matching technique works
                if (exactMatch || pluralMatch || singularMatch || keyphraseWordsIncluded) {
                    keyphraseInH2 = true;
                    matchedH2 = heading.text;
                    console.log(`✅ Found keyphrase in H2 heading: "${heading.text}"`);
                    
                    // Log which matching technique worked
                    if (exactMatch) console.log("- Matched by exact match");
                    if (pluralMatch) console.log("- Matched by plural form");
                    if (singularMatch) console.log("- Matched by singular form");
                    if (keyphraseWordsIncluded) console.log("- Matched by all words included");
                    
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
        const validOGImageSize = Boolean(
          scrapedData.ogMetadata.imageWidth &&
          scrapedData.ogMetadata.imageHeight &&
          parseInt(scrapedData.ogMetadata.imageWidth) >= 1200 &&
          parseInt(scrapedData.ogMetadata.imageHeight) >= 630
        );
        const currentSize = hasOgImage ?
          `Current image size: ${scrapedData.ogMetadata.imageWidth || 'unknown'}x${scrapedData.ogMetadata.imageHeight || 'unknown'}px.` :
          'No OG image found.';
        
        await addCheck(
            "OG Image",
            hasOgImage
              ? (validOGImageSize
                ? `Open Graph image is present with recommended dimensions (1200x630 or larger). ${currentSize}`
                : `Open Graph image is present. ${currentSize} Recommended size is at least 1200x630px for optimal social sharing.`)
              : `Open Graph image is missing. ${currentSize} Add an OG image with dimensions of at least 1200x630px.`,
            hasOgImage, // Changed to only check for image presence
            `Current Open Graph image: ${scrapedData.ogMetadata.image || 'none'}. ${currentSize}`,
            true
        );

        const score = Math.round((passedChecks / checks.length) * 100);

        return { 
            checks, 
            passedChecks, 
            failedChecks, 
            url, 
            score,
            // Ensure ogData is always defined with default values if needed
            ogData: {
                title: scrapedData.ogMetadata?.title || '',
                description: scrapedData.ogMetadata?.description || '',
                image: scrapedData.ogMetadata?.image || '',
                imageWidth: scrapedData.ogMetadata?.imageWidth || '',
                imageHeight: scrapedData.ogMetadata?.imageHeight || ''
            },
            timestamp: new Date().toISOString(),
            apiDataUsed: Object.keys(apiData).length > 0
        };
    } catch (error: any) {
        throw error;
    }
}

// Add helper function at the top level
function generateSchemaMarkupRecommendation(data: any, pageUrl: string): string {
  // Determine page type based on content
  const isHome = isHomePage(pageUrl);
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

  // Define standard NO-CACHE headers for all responses
  const noCacheHeaders = {
    'Access-Control-Allow-Origin': origin || '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache', // HTTP 1.0 backward compatibility
    'Expires': '0' // HTTP 1.0 backward compatibility
  };

  try {
    // HEAD request - OK to use simple headers, no body to cache
    if (path === '/api/analyze' && request.method === 'HEAD') {
      return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': origin || '*' } });
    }

    // OAuth routes - Should not be cached
    if (path === '/api/oauth/callback' && request.method === 'POST') {
      // Assuming handleOAuthTokenExchange returns a Response
      const response = await handleOAuthTokenExchange(request, env);
      // Apply no-cache headers
      Object.entries(noCacheHeaders).forEach(([key, value]) => response.headers.set(key, value));
      return response;
    }
    if (path === '/api/auth' && request.method === 'GET') {
      // Assuming handleAuthRedirect returns a Response (likely a redirect)
      const response = await handleAuthRedirect(request, env);
      // Apply no-cache headers to the redirect response itself
      Object.entries(noCacheHeaders).forEach(([key, value]) => response.headers.set(key, value));
      return response;
    }
    if (path === '/api/callback' && request.method === 'GET') {
      // Assuming handleAuthCallback returns a Response
      const response = await handleAuthCallback(request, env);
      // Apply no-cache headers
      Object.entries(noCacheHeaders).forEach(([key, value]) => response.headers.set(key, value));
      return response;
    }

    // Analyze route - Should not be cached
    if (path === '/api/analyze' && request.method === 'POST') {
      const data = await request.json();
      const { keyphrase, url: targetUrl } = data; // Renamed url to avoid conflict
      if (!keyphrase || !targetUrl) {
        return new Response(JSON.stringify({ message: "Keyphrase and URL are required" }), { status: 400, headers: noCacheHeaders });
      }
      const results = await analyzeSEOElements(targetUrl, keyphrase, env);
      return new Response(JSON.stringify(results), { status: 200, headers: noCacheHeaders });
    }

    // Register domains route - Response likely doesn't need caching
    if (path === '/api/register-domains' && request.method === 'POST') {
      const data = await request.json();
      const { domains } = data;
      if (!domains || !Array.isArray(domains)) {
        return new Response(JSON.stringify({ success: false, message: "Domains array is required" }), { status: 400, headers: noCacheHeaders });
      }
      return new Response(JSON.stringify({ success: true, message: `Successfully registered ${domains.length} domains.` }), { status: 200, headers: noCacheHeaders });
    }

    // Ping route - Remove caching
    if (path === '/api/ping' && (request.method === 'GET' || request.method === 'HEAD')) {
      const pingResponse = {
        status: 'ok',
        message: 'Worker is running',
        timestamp: new Date().toISOString()
      };
      // Use noCacheHeaders instead of allowing caching
      return new Response(JSON.stringify(pingResponse), { status: 200, headers: noCacheHeaders });
    }

    // Not found
    return new Response(JSON.stringify({ message: "Route not found", path }), { status: 404, headers: noCacheHeaders });

  } catch (error: any) {
    // Error response
    return new Response(JSON.stringify({ message: "Internal server error", error: error.message }), { status: 500, headers: noCacheHeaders });
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
    return !ip.isPrivate(normalizedAddr);
  }
}

export function validateUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol.toLowerCase();
    if (protocol !== 'https:') {
      return false;
    }
    return true; // Valid HTTPS URL
  } catch (error) {
    return false; // Invalid URL
  }
};

export default { fetch: handleRequest }