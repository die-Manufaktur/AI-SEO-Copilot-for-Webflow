import OpenAI from 'openai';
import * as ip from "ip";
import { URL } from "url";

// --- NEW: Define Shared Types ---

// Matches client/src/lib/types.ts SEOCheck
interface SEOCheck {
  title: string;
  description: string;
  passed: boolean;
  priority: 'high' | 'medium' | 'low';
  recommendation?: string;
}

// Type for Open Graph metadata
interface OGMetadata {
  title: string;
  description: string;
  image: string;
  imageWidth: string;
  imageHeight: string;
}

// Type for JS/CSS resources
interface Resource {
  url: string;
  content?: string;
  minified?: boolean;
}

// Type for Schema detection results
interface SchemaInfo {
  detected: boolean;
  types: string[];
  jsonLdBlocks: any[]; // Keep any for flexibility with diverse schema structures
  microdataTypes: string[];
  debug: Record<string, any>; // Keep flexible for debugging
}

// Type for Schema Markup detection results from detectSchemaMarkup
interface SchemaMarkupResult {
  hasSchema: boolean;
  schemaTypes: string[];
  schemaCount: number;
}

// Type for data scraped and processed from HTML
interface ScrapedPageData {
  title: string;
  metaDescription: string;
  content: string;
  paragraphs: string[];
  headings: Array<{ level: number; text: string }>;
  images: Array<{ src: string; alt: string; size?: number }>;
  internalLinks: string[];
  outboundLinks: string[];
  url: string;
  ogMetadata: OGMetadata;
  resources: {
    js: Resource[];
    css: Resource[];
  };
  schema: SchemaInfo; // From the complex schema detection logic
  schemaMarkup: SchemaMarkupResult; // From the simpler detectSchemaMarkup function
}

// Matches client/src/lib/types.ts SEOAnalysisResult
interface SEOAnalysisResult {
  checks: SEOCheck[];
  passedChecks: number;
  failedChecks: number;
  url: string;
  score: number;
  ogData?: OGMetadata; // Use the defined OGMetadata type
  timestamp: string;
  apiDataUsed: boolean;
}

// --- End of Shared Types ---

interface WebflowDomain {
  url: string;
  lastPublished: string | null;
  default: boolean;
  stage: string;
}

interface WebflowSiteInfo {
  siteId: string;
  siteName: string;
  shortName: string;
  isPasswordProtected: boolean;
  isPrivateStaging: boolean;
  domains: WebflowDomain[];
}

interface WebflowPage {
  id: string;
  name: string;
  path: string;
}

// Add utility function for extracting full text content from HTML elements with nested children
/**
 * Extracts the complete text content from HTML elements, including text within nested elements
 * @param html The HTML string to extract text from
 * @param tagPattern The regex pattern to match the desired tag (e.g., h1, p, etc.)
 * @returns An array of extracted text strings
 */
function extractFullTextContent(html: string, tagPattern: RegExp): string[] {
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
      // This approach handles nested elements by removing tags but keeping their text
      const textContent = fullTagContent
        .replace(/<[^>]+>/g, ' ')  // Replace tags with spaces
        .replace(/\s+/g, ' ')      // Replace multiple spaces with single space
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

// Define a cache object at the module level
const recommendationCache: Record<string, { recommendation: string; timestamp: number }> = {};

// Helper function to get AI-powered SEO recommendations
async function getAIRecommendation(title: string, keyphrase: string, env: any, context?: string, additionalContext?: string): Promise<string> {
  try {
    // Create a cache key for this request
    const cacheKey = `${title}-${keyphrase}-${context?.substring(0, 50) || ''}`;
    
    // Check if we have a cached response that's less than 15 minutes old
    if (recommendationCache[cacheKey] && (Date.now() - recommendationCache[cacheKey].timestamp) < 900000) { // 15 minutes
      return recommendationCache[cacheKey].recommendation;
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY
    });
    
    // Limit the context length to reduce token usage
    const truncatedContext = context && context.length > 300 
      ? context.substring(0, 300) + "..." 
      : context;
    
    // Truncate additional context if provided
    const truncatedAdditionalContext = additionalContext && additionalContext.length > 200
      ? additionalContext.substring(0, 200) + "..."
      : additionalContext;
    
    // Define an array of introduction phrases for variety
    const introductionPhrases = [
      "Here is a better [element]: [example]",
      "Try this improved [element]: [example]",
      "Recommended [element]: [example]",
      "Optimize your [element] with: [example]",
      "Better [element] suggestion: [example]",
      "Enhanced [element]: [example]"
    ];
    
    // Randomly select an introduction phrase
    const selectedIntroPhrase = introductionPhrases[Math.floor(Math.random() * introductionPhrases.length)];
    
    const systemContent = `You are an SEO expert providing concise, actionable recommendations.
         Keep responses under 100 words.
         Format: "${selectedIntroPhrase}"
         Avoid quotation marks.`;
    
    const userContent = `Fix this SEO issue: "${title}" for keyphrase "${keyphrase}".
         ${truncatedContext ? `Current content: ${truncatedContext}` : ''}
         ${truncatedAdditionalContext ? `Additional context: ${truncatedAdditionalContext}` : ''}`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Use the most cost-effective model
      messages: [
        {
          role: "system",
          content: systemContent
        },
        {
          role: "user",
          content: userContent
        }
      ],
      max_tokens: 120, // Reduced token limit for more concise responses
      temperature: 0.2, // Lower temperature for more predictable responses
    });

    const recommendation = response.choices[0].message.content?.trim() || 
      "Unable to generate recommendation at this time.";

    // Cache the response
    recommendationCache[cacheKey] = {
      recommendation,
      timestamp: Date.now()
    };

    // Clean the recommendation - initial cleaning
    let cleanedRecommendation = recommendation
      .replace(/^I recommend /i, '')
      .replace(/^You should /i, '')
      .replace(/^Consider /i, '')
      .replace(/^Suggested /i, '')
      .replace(/^Here'?s /i, '')
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/:\s*$/, '')
      .replace(/["']([^"']+)["']/g, '$1') // Remove quotes around any text
      .replace(/`([^`]+)`/g, '$1')  
      // Remove "Here is a better X:" prefix if followed by "Example:"
      .replace(/^Here is a better [^:]+:\s*Example:\s*/i, '')
      // Remove "Better X:" if followed by "Example:"
      .replace(/^Better [^:]+:\s*Example:\s*/i, '')
      // Remove "Example:" prefix if it appears after another introduction
      .replace(/^([^:]+):\s*Example:\s*/i, '$1: ')
      // Remove duplicate labels like "Title: Meta Description:"
      .replace(/^([^:]+):\s*([^:]+):\s*/i, '$1: ')
      .replace(/^([A-Za-z\s]{1,20}):\s*([A-Za-z\s]{1,20}):\s*/i, '$1: ');
    
    return cleanedRecommendation || `Add "${keyphrase}" to your ${title.toLowerCase()}`;
  } catch (error) {
    console.error("[SEO Analyzer] Error getting AI recommendation:", error);
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

export {}; // Ensure this file is treated as a module

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

// --- NEW: Add the missing getSuccessMessage function ---
/**
 * Generates a standard success message for a passed SEO check.
 * @param checkType The name of the check that passed.
 * @param url The URL that was analyzed (optional, for context).
 * @returns A success message string.
 */
function getSuccessMessage(checkType: string, url?: string): string {
  // You can customize these messages further if needed
  switch (checkType) {
    case "Keyphrase in Title":
      return "Great! Your title contains the keyphrase.";
    case "Keyphrase in Meta Description":
      return "Excellent! Your meta description includes the keyphrase.";
    case "Keyphrase in URL":
      return "Good job! The keyphrase is present in the URL slug.";
    case "Content Length":
      return "Well done! Your content meets the recommended length.";
    case "Keyphrase Density":
      return "Perfect! Keyphrase density is within the optimal range.";
    case "Keyphrase in Introduction":
      return "Nice! The keyphrase appears in the first paragraph.";
    case "Image Alt Attributes":
      return "Good! All relevant images seem to have alt text.";
    case "Internal Links":
      return "Great! You have internal links on the page.";
    case "Outbound Links":
      return "Good! Outbound links are present.";
    case "Next-Gen Image Formats":
      return "Image formats appear optimized (manual check recommended)."; // Placeholder
    case "OG Image":
      return "Excellent! An Open Graph image is set.";
    case "OG Title and Description":
      return "Perfect! Open Graph title and description are present.";
    case "Keyphrase in H1 Heading":
      return "Great! The main H1 heading includes the keyphrase.";
    case "Keyphrase in H2 Headings":
      return "Good! The keyphrase is found in at least one H2 heading.";
    case "Heading Hierarchy":
      return "Excellent! Your heading structure follows a logical hierarchy.";
    case "Code Minification":
      return "Good! JS and CSS files appear to be minified.";
    case "Schema Markup":
      return "Great! Schema.org markup was detected on the page.";
    case "Image File Size":
       return "Image file sizes appear optimized (manual check recommended)."; // Placeholder
    default:
      return `Check passed: ${checkType}`;
  }
}
// --- End of getSuccessMessage function ---

// --- NEW: Add the missing calculateKeyphraseDensity function ---
/**
 * Calculates the keyphrase density within a given text content.
 * @param content The main text content of the page.
 * @param keyphrase The target keyphrase to search for.
 * @returns An object containing density percentage, occurrences, and total word count.
 */
function calculateKeyphraseDensity(content: string, keyphrase: string): { density: number; occurrences: number; totalWords: number } {
  if (!content || !keyphrase) {
    return { density: 0, occurrences: 0, totalWords: 0 };
  }

  // Normalize content and keyphrase
  const normalizedContent = content.toLowerCase();
  const normalizedKeyphrase = keyphrase.toLowerCase().trim();

  // Calculate total words
  const words = normalizedContent.split(/\s+/).filter(Boolean);
  const totalWords = words.length;

  if (totalWords === 0) {
    return { density: 0, occurrences: 0, totalWords: 0 };
  }

  // Calculate occurrences using a regex for whole word matching (optional, but often better)
  // If you want partial matches, use: new RegExp(escapeRegExp(normalizedKeyphrase), 'gi')
  const keyphrasePattern = new RegExp(`\\b${escapeRegExp(normalizedKeyphrase)}\\b`, 'gi');
  const matches = normalizedContent.match(keyphrasePattern);
  const occurrences = matches ? matches.length : 0;

  // Calculate density
  const density = (occurrences / totalWords) * 100;

  console.log(`[SEO Analyzer] Keyphrase Density: ${density.toFixed(2)}% (${occurrences} occurrences in ${totalWords} words) for keyphrase "${keyphrase}"`);

  return {
    density,
    occurrences,
    totalWords
  };
}
// --- End of calculateKeyphraseDensity function ---

// REVISED scrapeWebpage function signature (return type updated)
async function scrapeWebpage(url: string, siteInfo: WebflowSiteInfo): Promise<ScrapedPageData> {
  const maxRetries = 2; // Reduced retries slightly
  let lastError = null;

  // Normalize URL format (ensure https)
  let normalizedUrl = url;
  if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
    normalizedUrl = `https://${normalizedUrl}`;
  } else if (url.startsWith('http://')) {
    normalizedUrl = url.replace(/^http:/, 'https:');
  }

  console.log(`[SEO Analyzer] Starting analysis of primary URL: ${normalizedUrl}`);

  // Basic URL variants: primary, www/non-www toggle
  const urlObj = new URL(normalizedUrl);
  const urlVariants = [normalizedUrl];
  if (urlObj.hostname.startsWith('www.')) {
    const noWww = new URL(normalizedUrl);
    noWww.hostname = noWww.hostname.substring(4);
    urlVariants.push(noWww.toString());
  } else {
    const withWww = new URL(normalizedUrl);
    withWww.hostname = 'www.' + withWww.hostname;
    urlVariants.push(withWww.toString());
  }

  const uniqueVariants = Array.from(new Set(urlVariants));
  console.log(`[SEO Analyzer] Will try these URL variants: ${JSON.stringify(uniqueVariants)}`);

  const fetchOptions = {
    headers: {
      'User-Agent': 'SEO-Analyzer/2.3.2 (https://github.com/die-Manufaktur/AI-SEO-Copilot-for-Webflow)',
      'Accept': 'text/html,application/xhtml+xml,application/xml',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache', // Ensure no caching
      'Pragma': 'no-cache'         // Ensure no caching
    },
    redirect: 'follow' as RequestRedirect,
    cf: {
      cacheTtl: 0, // Explicitly disable Cloudflare caching for this fetch
      // resolveOverride: urlObj.hostname // Keep resolveOverride if needed
    }
  };

  for (const variantUrl of uniqueVariants) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`[SEO Analyzer] Attempt ${attempt + 1}/${maxRetries} for URL: ${variantUrl}`);
        if (attempt > 0) {
          const delay = attempt * 500;
          console.log(`[SEO Analyzer] Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const response = await fetch(variantUrl, fetchOptions);

        if (response.status === 200) {
          console.log(`[SEO Analyzer] Successfully fetched URL: ${variantUrl}`);
          const html = await response.text();
          console.log(`[SEO Analyzer] Retrieved ${html.length} bytes of HTML`);
          // Pass variantUrl to processHtml as it's the one that succeeded
          const processedData: ScrapedPageData = await processHtml(html, variantUrl);
          return processedData;
        } else {
          const errorMessage = `Failed to fetch URL (HTTP ${response.status}): ${variantUrl}`;
          console.error(`[SEO Analyzer] ${errorMessage}`);
          lastError = new Error(errorMessage);
          // Break inner loop for 404, try next variant immediately
          if (response.status === 404 || response.status === 410) {
             console.log(`[SEO Analyzer] Received ${response.status}, trying next variant if available.`);
             break;
          }
        }
      } catch (fetchError: any) {
        console.error(`[SEO Analyzer] Fetch error for ${variantUrl} (attempt ${attempt + 1}):`, fetchError.message);
        lastError = fetchError;
        // Break inner loop for DNS/connection errors, try next variant
         if (fetchError.message && (
              fetchError.message.includes('ENOTFOUND') ||
              fetchError.message.includes('ECONNREFUSED') ||
              fetchError.message.includes('DNS') ||
              fetchError.message.includes('Failed to connect') // Added generic connection failure
          )) {
            console.log(`[SEO Analyzer] Connection/DNS error, trying next variant if available.`);
            break;
          }
      }
    }
  }

  // If all variants and retries failed
  console.error("[SEO Analyzer] All fetch attempts failed.", lastError);
  throw lastError || new Error(`Failed to fetch page after trying all URL variants`);
}

// REVISED processHtml function signature (return type updated)
async function processHtml(html: string, url: string): Promise<ScrapedPageData> {
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
    const ogMetadata: OGMetadata = {
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
      js: [] as Resource[],
      css: [] as Resource[]
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
    const schema: SchemaInfo = {
      detected: false,
      types: [],
      jsonLdBlocks: [],
      microdataTypes: [],
      debug: {}
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

// REVISED analyzeSEOElements signature (return type updated)
export async function analyzeSEOElements(
  url: string,
  keyphrase: string,
  isHomePage: boolean,
  siteInfo: WebflowSiteInfo,
  publishPath: string,
  env: any
): Promise<SEOAnalysisResult> { // Updated return type
  console.log("[SEO Analyzer] Analyzing elements for:", { url, keyphrase, isHomePage, siteName: siteInfo.siteName, publishPath });

  try {
    // Use the simplified scrapeWebpage function, result is ScrapedPageData
    const scrapedData: ScrapedPageData = await scrapeWebpage(url, siteInfo);

    // Destructure with types from ScrapedPageData
    const {
      title,
      metaDescription,
      content,
      paragraphs,
      headings, // Now Array<{ level: number; text: string }>
      images,   // Now Array<{ src: string; alt: string; size?: number }>
      internalLinks,
      outboundLinks,
      ogMetadata, // Now OGMetadata
      resources,  // Now { js: Resource[]; css: Resource[] }
      schemaMarkup // Use schemaMarkup from ScrapedPageData
    } = scrapedData;

    // Type the checks array
    const checks: SEOCheck[] = [];

    // --- SEO Checks ---
    // ... (existing checks 1-6) ...

    // 7. Image Alt Attributes (Update type for img)
    const imagesMissingAlt = images.filter((img: { src: string; alt: string; size?: number }) => !img.alt || img.alt.trim() === "");
    // ... rest of check 7 ...

    // ... (existing checks 8-12) ...

    // 13. Keyphrase in H1 Heading (Update type for h)
    const h1Headings = headings.filter((h: { level: number; text: string }) => h.level === 1);
    const h1ContainsKeyword = h1Headings.length > 0 && h1Headings.some((h: { level: number; text: string }) => h.text.toLowerCase().includes(keyphrase.toLowerCase()));
    // ... rest of check 13 ...

    // 14. Keyphrase in H2 Headings (Update type for h)
    const h2Headings = headings.filter((h: { level: number; text: string }) => h.level === 2);
    const h2ContainsKeyword = h2Headings.some((h: { level: number; text: string }) => h.text.toLowerCase().includes(keyphrase.toLowerCase()));
    // ... rest of check 14 ...

    // 15. Heading Hierarchy (Update type for heading)
    let hierarchyPassed = true;
    let lastLevel = 0;
    for (const heading of headings) { // heading is { level: number; text: string }
      if (heading.level > lastLevel + 1) {
        hierarchyPassed = false;
        break;
      }
      lastLevel = heading.level;
    }
    // ... rest of check 15 ...

    // 16. Code Minification (Update type for r)
    const unminifiedJs = resources.js.filter((r: Resource) => r.minified === false).length;
    const unminifiedCss = resources.css.filter((r: Resource) => r.minified === false).length;
    // ... rest of check 16 ...

    // 17. Schema Markup (Use schemaMarkup from scrapedData)
    const schemaCheckPassed = schemaMarkup.hasSchema; // Use the result from detectSchemaMarkup
    checks.push({
      title: "Schema Markup",
      // Use schemaMarkup.schemaTypes which comes from detectSchemaMarkup
      description: schemaCheckPassed ? `${getSuccessMessage("Schema Markup", url)} Found types: ${schemaMarkup.schemaTypes.join(', ') || 'N/A'}` : `No Schema.org markup detected. Adding structured data can help search engines understand your content.`,
      passed: schemaCheckPassed,
      priority: analyzerCheckPriorities["Schema Markup"],
      recommendation: !schemaCheckPassed ? analyzerFallbackRecommendations["Schema Markup"]({}) : undefined
    });

    // ... (existing check 18) ...

    // --- End SEO Checks ---

    const passedChecks = checks.filter(c => c.passed).length;
    const failedChecks = checks.length - passedChecks;
    const score = Math.round((passedChecks / checks.length) * 100);

    // Ensure the returned object matches SEOAnalysisResult interface
    const result: SEOAnalysisResult = {
      checks,
      passedChecks,
      failedChecks,
      url: url,
      score,
      ogData: ogMetadata,
      timestamp: new Date().toISOString(),
      apiDataUsed: false
    };
    return result;

  } catch (error: any) {
    console.error("[SEO Analyzer] Error during element analysis:", error);
    // Propagate the error message, potentially wrapping it
    // Consider creating a custom error type or structure for API responses
    throw new Error(`Analysis failed: ${error.message}`);
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
        const { keyphrase, url, isHomePage, siteInfo, publishPath } = data;
        if (!keyphrase || !url || typeof isHomePage === 'undefined' || !siteInfo || typeof publishPath === 'undefined') {
          return new Response(JSON.stringify({ message: "Keyphrase, URL, isHomePage, siteInfo, and publishPath are required" }), { status: 400, headers: corsHeaders });
        }
        const results = await analyzeSEOElements(url, keyphrase, isHomePage, siteInfo, publishPath, env);
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