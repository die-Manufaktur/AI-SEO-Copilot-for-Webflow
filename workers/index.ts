import OpenAI from 'openai';
import * as ip from "ip";
import { URL } from "url";

// --- Shared Types ---

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

// NEW: Data fetched directly from Webflow API (Matches client type)
interface WebflowPageData {
  title: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  usesTitleAsOGTitle: boolean; // Added
  usesDescriptionAsOGDescription: boolean; // Added
}

// UPDATED: ScrapedPageData - Removed fields now coming from Webflow API
interface ScrapedPageData {
  content: string;
  paragraphs: string[];
  headings: Array<{ level: number; text: string }>;
  images: Array<{ src: string; alt: string; size?: number }>;
  internalLinks: string[];
  outboundLinks: string[];
  url: string; // Keep the actual fetched URL
  resources: {
    js: Resource[];
    css: Resource[];
  };
  schemaMarkup: SchemaMarkupResult;
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

// REVISED processHtml function signature (return type updated)
async function processHtml(html: string, url: string): Promise<ScrapedPageData> { // Return type is now the simplified ScrapedPageData
  try {
    console.log(`[SEO Analyzer] Processing HTML content from: ${url}`);
    const baseUrl = new URL(url);

    // --- Keep width/height extraction if needed for specific checks, otherwise remove ---
    const ogImageWidthMatch = html.match(/<meta[^>]*property=["']og:image:width["'][^>]*content=["'](.*?)["'][^>]*>/i);
    const ogImageHeightMatch = html.match(/<meta[^>]*property=["']og:image:height["'][^>]*content=["'](.*?)["'][^>]*>/i);
    const ogImageWidth = ogImageWidthMatch ? ogImageWidthMatch[1].trim() : '';
    const ogImageHeight = ogImageHeightMatch ? ogImageHeightMatch[1].trim() : '';


    // Extract Body Content (simplified) - REMAINS THE SAME
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : '';
    const content = bodyContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                             .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                             .replace(/<[^>]+>/g, ' ')
                             .replace(/\s+/g, ' ')
                             .trim();
    console.log(`[SEO Analyzer] Extracted Content Length: ${content.length}`);

    // Extract Paragraphs - REMAINS THE SAME
    const paragraphs = extractFullTextContent(bodyContent, /<p[^>]*>([\s\S]*?)<\/p>/gi);
    console.log(`[SEO Analyzer] Extracted ${paragraphs.length} Paragraphs`);

    // Extract Headings - REMAINS THE SAME
    const headings: Array<{ level: number; text: string }> = [];
    const headingMatches = bodyContent.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi);
    for (const match of headingMatches) {
      const level = parseInt(match[1], 10);
      const headingTextContent = match[2]
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (headingTextContent) {
        headings.push({ level, text: headingTextContent });
      }
    }
    console.log(`[SEO Analyzer] Extracted ${headings.length} Headings`);

    // Extract images - REMAINS THE SAME
    console.log("[SEO Analyzer] Starting Image Extraction...");
    const images: Array<{ src: string; alt: string; size?: number }> = [];
    const imageMatches = bodyContent.matchAll(/<img[^>]*src=["'](.*?)["'][^>]*alt=["'](.*?)["'][^>]*>/gi);
    for (const match of imageMatches) {
        const src = match[1];
        const alt = match[2];
        images.push({ src: new URL(src, baseUrl.toString()).toString(), alt: alt.trim(), size: undefined });
    }
    console.log(`[SEO Analyzer] Finished Image Extraction. Found ${images.length} images.`);

    // Extract links - REMAINS THE SAME
    console.log("[SEO Analyzer] Starting Link Extraction...");
    const internalLinks: string[] = [];
    const outboundLinks: string[] = [];
    const linkMatches = bodyContent.matchAll(/<a[^>]*href=["'](.*?)["'][^>]*>/gi);
    for (const match of linkMatches) {
        const href = match[1];
        if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
            try {
                const absoluteUrl = new URL(href, baseUrl.toString());
                if (absoluteUrl.hostname === baseUrl.hostname) {
                    internalLinks.push(absoluteUrl.toString());
                } else {
                    outboundLinks.push(absoluteUrl.toString());
                }
            } catch (e) {
                console.warn(`[SEO Analyzer] Skipping invalid link URL: ${href}`);
            }
        }
    }
    console.log(`[SEO Analyzer] Finished Link Extraction. Found ${internalLinks.length} internal, ${outboundLinks.length} outbound.`);

    // Extract JavaScript and CSS resources - REMAINS THE SAME (including fetch calls)
    console.log("[SEO Analyzer] Starting Resource Extraction...");
    const resources = { js: [] as Resource[], css: [] as Resource[] };
    // ... existing JS/CSS extraction logic ...
    console.log("[SEO Analyzer] Finished Resource Extraction.");


    // Detect schema markup - REMAINS THE SAME
    const schemaMarkup = detectSchemaMarkup(html);
    console.log(`[SEO Analyzer] Schema Markup Detected: ${schemaMarkup.hasSchema}, Types: ${schemaMarkup.schemaTypes.join(', ')}`);

    // Construct the final ScrapedPageData object (using the simplified interface)
    const scrapedData: ScrapedPageData = {
      content: content || '',
      paragraphs: paragraphs || [],
      headings: headings || [],
      images: images || [],
      internalLinks: internalLinks || [],
      outboundLinks: outboundLinks || [],
      url: url, // Keep the actual fetched URL
      resources: resources || { js: [], css: [] },
      schemaMarkup: schemaMarkup
    };

    console.log("[SEO Analyzer] Finished processing HTML.");
    return scrapedData;

  } catch (error) {
    console.error("[SEO Analyzer] CRITICAL Error processing HTML:", error);
    throw error;
  }
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

export async function analyzeSEOElements(
  url: string,
  keyphrase: string,
  isHomePage: boolean,
  siteInfo: WebflowSiteInfo,
  publishPath: string, // Keep receiving publishPath for now
  env: any,
  webflowPageData: WebflowPageData | undefined // Includes OG settings
): Promise<SEOAnalysisResult> {
  console.log("[SEO Analyzer] Analyzing elements for:", { url, keyphrase, isHomePage, siteName: siteInfo.siteName, publishPath, hasWebflowData: !!webflowPageData });

  try {
    // Scrape the page to get content, headings, images, links, resources, schema
    const scrapedData: ScrapedPageData = await scrapeWebpage(url, siteInfo);

    // --- Combine Webflow API data and Scraped Data ---
    const finalTitle = webflowPageData?.title ?? ''; // Prioritize API data, fallback to empty string
    const finalMetaDescription = webflowPageData?.metaDescription ?? ''; // Prioritize API data
    const finalOgMetadata: OGMetadata = { // Construct OG data, prioritizing API
        title: webflowPageData?.ogTitle ?? '',
        description: webflowPageData?.ogDescription ?? '',
        image: webflowPageData?.ogImage ?? '',
        // Keep width/height from scraping for now, if needed
        imageWidth: scrapedData.resources.css.length > 0 ? 'scraped' : '', // Placeholder logic, adjust as needed
        imageHeight: scrapedData.resources.css.length > 0 ? 'scraped' : '', // Placeholder logic, adjust as needed
    };
    console.log("[SEO Analyzer] Using Final Title:", finalTitle);
    console.log("[SEO Analyzer] Using Final Meta Description:", finalMetaDescription);
    console.log("[SEO Analyzer] Using Final OG Metadata:", finalOgMetadata);

    // Destructure only the necessary parts from scrapedData
    const {
      content,
      paragraphs,
      headings,
      images,
      internalLinks,
      outboundLinks,
      resources,
      schemaMarkup
    } = scrapedData;

    const checks: SEOCheck[] = [];
    const apiDataUsed = !!webflowPageData; // Track if API data was available

    // --- SEO Checks ---

    // 1. Keyphrase in Title
    const titleContainsKeyword = finalTitle.toLowerCase().includes(keyphrase.toLowerCase());
    checks.push({
      title: "Keyphrase in Title",
      description: titleContainsKeyword ? getSuccessMessage("Keyphrase in Title") : `Your title doesn't contain the keyphrase "${keyphrase}".`,
      passed: titleContainsKeyword,
      priority: analyzerCheckPriorities["Keyphrase in Title"],
      recommendation: !titleContainsKeyword ? await getAIRecommendation("Title", keyphrase, env, finalTitle) : undefined
    });

    // 2. Keyphrase in Meta Description
    const descContainsKeyword = finalMetaDescription.toLowerCase().includes(keyphrase.toLowerCase());
    checks.push({
      title: "Keyphrase in Meta Description",
      description: descContainsKeyword ? getSuccessMessage("Keyphrase in Meta Description") : `Your meta description is missing the keyphrase "${keyphrase}".`,
      passed: descContainsKeyword,
      priority: analyzerCheckPriorities["Keyphrase in Meta Description"],
      recommendation: !descContainsKeyword ? await getAIRecommendation("Meta Description", keyphrase, env, finalMetaDescription) : undefined
    });

    // 3. Keyphrase in URL (Uses scraped URL's path)
    const urlObject = new URL(url); // Use the actual fetched URL
    const slug = urlObject.pathname.split('/').pop() || '';
    const urlContainsKeyword = slug.toLowerCase().includes(keyphrase.toLowerCase().replace(/\s+/g, '-')); // Simple check
    checks.push({
      title: "Keyphrase in URL",
      description: urlContainsKeyword ? getSuccessMessage("Keyphrase in URL") : `The URL slug "${slug}" doesn't seem to contain the keyphrase "${keyphrase}".`,
      passed: urlContainsKeyword,
      priority: analyzerCheckPriorities["Keyphrase in URL"],
      // Recommendation might involve suggesting a new slug based on the title/keyphrase
      recommendation: !urlContainsKeyword ? `Consider including "${keyphrase.toLowerCase().replace(/\s+/g, '-')}" in your URL slug.` : undefined
    });

    // 4. Content Length (Uses scraped content)
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const contentLengthPassed = wordCount >= 300; // Example threshold
    checks.push({
      title: "Content Length",
      description: contentLengthPassed ? `${getSuccessMessage("Content Length")} (${wordCount} words)` : `Your content is quite short (${wordCount} words). Aim for at least 300 words.`,
      passed: contentLengthPassed,
      priority: analyzerCheckPriorities["Content Length"],
      recommendation: !contentLengthPassed ? `Expand your content to provide more value and detail, aiming for at least 300 words.` : undefined
    });

    // 5. Keyphrase Density (Uses scraped content)
    const densityInfo = calculateKeyphraseDensity(content, keyphrase);
    const densityPassed = densityInfo.density >= 0.5 && densityInfo.density <= 2.5; // Example range
    checks.push({
      title: "Keyphrase Density",
      description: densityPassed ? `${getSuccessMessage("Keyphrase Density")} (${densityInfo.density.toFixed(1)}%)` : `Keyphrase density is ${densityInfo.density.toFixed(1)}%. Aim for 0.5-2.5%.`,
      passed: densityPassed,
      priority: analyzerCheckPriorities["Keyphrase Density"],
      recommendation: !densityPassed ? `Adjust the number of times "${keyphrase}" appears (${densityInfo.occurrences} times in ${densityInfo.totalWords} words) to fall within the 0.5-2.5% density range.` : undefined
    });

    // 6. Keyphrase in Introduction (Uses scraped paragraphs)
    const firstParagraph = paragraphs.length > 0 ? paragraphs[0].toLowerCase() : "";
    const introContainsKeyword = firstParagraph.includes(keyphrase.toLowerCase());
    checks.push({
      title: "Keyphrase in Introduction",
      description: introContainsKeyword ? getSuccessMessage("Keyphrase in Introduction") : `The keyphrase "${keyphrase}" was not found in the first paragraph.`,
      passed: introContainsKeyword,
      priority: analyzerCheckPriorities["Keyphrase in Introduction"],
      recommendation: !introContainsKeyword ? await getAIRecommendation("Introduction Paragraph", keyphrase, env, firstParagraph) : undefined
    });

    // 7. Image Alt Attributes (Uses scraped images)
    const imagesMissingAlt = images.filter(img => !img.alt || img.alt.trim() === "");
    const altCheckPassed = imagesMissingAlt.length === 0;
    checks.push({
      title: "Image Alt Attributes",
      description: altCheckPassed ? getSuccessMessage("Image Alt Attributes") : `${imagesMissingAlt.length} image(s) are missing descriptive alt text.`,
      passed: altCheckPassed,
      priority: analyzerCheckPriorities["Image Alt Attributes"],
      recommendation: !altCheckPassed ? `Add descriptive alt text to all images, incorporating "${keyphrase}" where relevant. Missing on: ${imagesMissingAlt.map(img => img.src.split('/').pop()).slice(0, 2).join(', ')}${imagesMissingAlt.length > 2 ? '...' : ''}` : undefined
    });

    // 8. Internal Links (Uses scraped links)
    const internalLinksPassed = internalLinks.length > 0;
    checks.push({
      title: "Internal Links",
      description: internalLinksPassed ? `${getSuccessMessage("Internal Links")} (Found ${internalLinks.length})` : `No internal links found. Add links to other relevant pages on your site.`,
      passed: internalLinksPassed,
      priority: analyzerCheckPriorities["Internal Links"],
      recommendation: !internalLinksPassed ? `Add links from this page to other relevant pages or posts on your website to improve site structure and SEO.` : undefined
    });

    // 9. Outbound Links (Uses scraped links)
    const outboundLinksPassed = outboundLinks.length > 0;
    checks.push({
      title: "Outbound Links",
      description: outboundLinksPassed ? `${getSuccessMessage("Outbound Links")} (Found ${outboundLinks.length})` : `No outbound links found. Consider linking to relevant external resources.`,
      passed: outboundLinksPassed,
      priority: analyzerCheckPriorities["Outbound Links"],
      recommendation: !outboundLinksPassed ? `Link to authoritative external websites where relevant to provide additional context and credibility.` : undefined
    });

    // 10. Next-Gen Image Formats (Uses scraped images - Placeholder)
    // This check is complex without fetching/analyzing image headers. Basic check for now.
    const nonWebPOrAvif = images.filter(img => !img.src.toLowerCase().endsWith('.webp') && !img.src.toLowerCase().endsWith('.avif')).length;
    const nextGenPassed = nonWebPOrAvif === 0; // Simplistic check
     checks.push({
      title: "Next-Gen Image Formats",
      description: nextGenPassed ? getSuccessMessage("Next-Gen Image Formats") : `Consider using WebP or AVIF formats for ${nonWebPOrAvif} image(s) to improve loading speed.`,
      passed: nextGenPassed, // Placeholder result
      priority: analyzerCheckPriorities["Next-Gen Image Formats"],
      recommendation: !nextGenPassed ? `Convert images like ${images.filter(img => !img.src.toLowerCase().endsWith('.webp') && !img.src.toLowerCase().endsWith('.avif')).map(img => img.src.split('/').pop()).slice(0, 2).join(', ')}... to WebP or AVIF format.` : undefined
    });

    // 11. OG Image (Uses combined finalOgMetadata)
    const ogImagePassed = !!finalOgMetadata.image;
    checks.push({
      title: "OG Image",
      description: ogImagePassed ? getSuccessMessage("OG Image") : `No Open Graph image specified. Add an 'og:image' meta tag.`,
      passed: ogImagePassed,
      priority: analyzerCheckPriorities["OG Image"],
      recommendation: !ogImagePassed ? `Set an Open Graph image (og:image meta tag) for better social sharing previews. Recommended size: 1200x630px.` : undefined
    });

    // 12. OG Title and Description (Uses combined finalOgMetadata AND Webflow settings)
    const hasOgTitle = !!finalOgMetadata.title;
    const hasOgDesc = !!finalOgMetadata.description;
    const usesDefaults = webflowPageData?.usesTitleAsOGTitle && webflowPageData?.usesDescriptionAsOGDescription;

    // Pass if either the defaults are used OR specific OG title/desc are set
    const ogTitleDescPassed = usesDefaults || (hasOgTitle && hasOgDesc);
    let ogTitleDescDesc = "";
    let ogTitleDescRec = undefined;

    if (ogTitleDescPassed) {
        ogTitleDescDesc = getSuccessMessage("OG Title and Description");
        if (usesDefaults && (!hasOgTitle || !hasOgDesc)) {
            ogTitleDescDesc += " (using page title/description as fallback)";
        }
    } else {
        ogTitleDescDesc = "Open Graph title or description is missing and defaults are not enabled.";
        ogTitleDescRec = `Define both Open Graph title (og:title) and description (og:description) in Webflow settings, or ensure the page title/description are suitable fallbacks and enable the default settings.`;
    }

    checks.push({
      title: "OG Title and Description",
      description: ogTitleDescDesc,
      passed: ogTitleDescPassed,
      priority: analyzerCheckPriorities["OG Title and Description"],
      recommendation: ogTitleDescRec
    });

    // 13. Keyphrase in H1 Heading (Uses scraped headings)
    const h1Headings = headings.filter(h => h.level === 1);
    const h1ContainsKeyword = h1Headings.length > 0 && h1Headings.some(h => h.text.toLowerCase().includes(keyphrase.toLowerCase()));
    checks.push({
      title: "Keyphrase in H1 Heading",
      description: h1Headings.length === 0 ? "No H1 heading found on the page." : (h1ContainsKeyword ? getSuccessMessage("Keyphrase in H1 Heading") : `The main H1 heading doesn't contain the keyphrase "${keyphrase}".`),
      passed: h1Headings.length > 0 && h1ContainsKeyword,
      priority: analyzerCheckPriorities["Keyphrase in H1 Heading"],
      recommendation: h1Headings.length === 0 ? "Add a single, descriptive H1 heading to the page." : (!h1ContainsKeyword ? await getAIRecommendation("H1 Heading", keyphrase, env, h1Headings[0]?.text) : undefined)
    });

    // 14. Keyphrase in H2 Headings (Uses scraped headings)
    const h2Headings = headings.filter(h => h.level === 2);
    const h2ContainsKeyword = h2Headings.some(h => h.text.toLowerCase().includes(keyphrase.toLowerCase()));
    checks.push({
      title: "Keyphrase in H2 Headings",
      description: h2Headings.length === 0 ? "No H2 headings found. Use H2s for main sections." : (h2ContainsKeyword ? getSuccessMessage("Keyphrase in H2 Headings") : `The keyphrase "${keyphrase}" is not found in any H2 headings.`),
      passed: h2Headings.length === 0 || h2ContainsKeyword, // Pass if no H2s or if keyword is present
      priority: analyzerCheckPriorities["Keyphrase in H2 Headings"],
      recommendation: h2Headings.length > 0 && !h2ContainsKeyword ? `Include "${keyphrase}" naturally in one or more H2 subheadings where relevant.` : undefined
    });

    // 15. Heading Hierarchy (Uses scraped headings)
    let hierarchyPassed = true;
    let lastLevel = 0;
    let hierarchyIssue = "";
    if (headings.length > 0 && headings[0].level !== 1) {
        hierarchyPassed = false;
        hierarchyIssue = "Page should start with an H1 heading.";
    } else {
        for (const heading of headings) {
            if (heading.level > lastLevel + 1) {
                hierarchyPassed = false;
                hierarchyIssue = `Incorrect jump from H${lastLevel} to H${heading.level} ('${heading.text.substring(0,20)}...').`;
                break;
            }
            lastLevel = heading.level;
        }
    }
    checks.push({
      title: "Heading Hierarchy",
      description: hierarchyPassed ? getSuccessMessage("Heading Hierarchy") : `Heading structure issue: ${hierarchyIssue}`,
      passed: hierarchyPassed,
      priority: analyzerCheckPriorities["Heading Hierarchy"],
      recommendation: !hierarchyPassed ? `Review your heading structure (H1-H6). Ensure headings follow a logical order without skipping levels (e.g., H1 -> H2, H2 -> H3). ${hierarchyIssue}` : undefined
    });

    // 16. Code Minification (Uses scraped resources)
    const unminifiedJs = resources.js.filter(r => r.minified === false).length;
    const unminifiedCss = resources.css.filter(r => r.minified === false).length;
    const minificationPassed = unminifiedJs === 0 && unminifiedCss === 0;
    checks.push({
      title: "Code Minification",
      description: minificationPassed ? getSuccessMessage("Code Minification") : `Found ${unminifiedJs} unminified JS and ${unminifiedCss} unminified CSS files. Minify them to reduce file size.`,
      passed: minificationPassed,
      priority: analyzerCheckPriorities["Code Minification"],
      recommendation: !minificationPassed ? `Minify JavaScript and CSS files to improve page load speed. Tools like Terser (JS) or cssnano (CSS) can help.` : undefined
    });

    // 17. Schema Markup (Uses scraped schemaMarkup)
    const schemaCheckPassed = schemaMarkup.hasSchema;
    checks.push({
      title: "Schema Markup",
      description: schemaCheckPassed ? `${getSuccessMessage("Schema Markup", url)} Found types: ${schemaMarkup.schemaTypes.join(', ') || 'N/A'}` : `No Schema.org markup detected. Adding structured data can help search engines understand your content.`,
      passed: schemaCheckPassed,
      priority: analyzerCheckPriorities["Schema Markup"],
      recommendation: !schemaCheckPassed ? analyzerFallbackRecommendations["Schema Markup"]({}) : undefined
    });

    // 18. Image File Size (Uses scraped images - Placeholder)
    // Requires fetching image headers/content, which is resource-intensive. Placeholder check.
    const largeImages = images.filter(img => img.size && img.size > 150 * 1024).length; // Example: > 150KB
    const imageSizePassed = largeImages === 0; // Placeholder
    checks.push({
        title: "Image File Size",
        description: imageSizePassed ? getSuccessMessage("Image File Size") : `Found ${largeImages} image(s) potentially larger than 150KB. Optimize image sizes.`,
        passed: imageSizePassed, // Placeholder result
        priority: analyzerCheckPriorities["Image File Size"],
        recommendation: !imageSizePassed ? `Optimize images to reduce file size without sacrificing quality. Aim for <150KB per image where possible. Use tools like Squoosh or TinyPNG.` : undefined
    });

    // --- End SEO Checks ---

    const passedChecks = checks.filter(c => c.passed).length;
    const failedChecks = checks.length - passedChecks;
    // Recalculate score based on potentially different number of checks if some fail to run
    const totalPossiblePoints = checks.reduce((sum, check) => {
        const weights = { high: 3, medium: 2, low: 1 };
        return sum + (weights[check.priority] || weights.medium);
    }, 0);
    const earnedPoints = checks.reduce((sum, check) => {
        if (check.passed) {
            const weights = { high: 3, medium: 2, low: 1 };
            return sum + (weights[check.priority] || weights.medium);
        }
        return sum;
    }, 0);
    const score = totalPossiblePoints > 0 ? Math.round((earnedPoints / totalPossiblePoints) * 100) : 0;


    const result: SEOAnalysisResult = {
      checks,
      passedChecks,
      failedChecks,
      url: url, // Use the actual fetched URL
      score,
      ogData: finalOgMetadata, // Use the combined OG data
      timestamp: new Date().toISOString(),
      apiDataUsed // Indicate if API data was used
    };
    console.log("[SEO Analyzer] Analysis complete. Result:", result);
    return result;

  } catch (error: any) {
    console.error("[SEO Analyzer] Error during element analysis:", error);
    // Propagate a user-friendly error
    throw new Error(`Analysis failed: ${error.message || 'Unknown error'}`);
  }
}

// Worker event handler
// @ts-ignore: Cloudflare Workers specific API
addEventListener('fetch', (event: any) => {
  event.respondWith(handleRequest(event.request, event.env));
});

async function handleRequest(request: Request, env: any): Promise<Response> {
  // ... existing CORS handling ...
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
    // ... existing HEAD, OAuth, Auth, Callback routes ...

    if (path === '/api/analyze' && request.method === 'POST') {
      const data = await request.json();
      // Destructure webflowPageData as well
      const { keyphrase, url, isHomePage, siteInfo, publishPath, webflowPageData } = data;
      if (!keyphrase || !url || typeof isHomePage === 'undefined' || !siteInfo || typeof publishPath === 'undefined') {
        return new Response(JSON.stringify({ message: "Keyphrase, URL, isHomePage, siteInfo, and publishPath are required" }), { status: 400, headers: corsHeaders });
      }
      // Pass webflowPageData to analyzeSEOElements
      const results = await analyzeSEOElements(url, keyphrase, isHomePage, siteInfo, publishPath, env, webflowPageData);
      return new Response(JSON.stringify(results), { status: 200, headers: corsHeaders });
    } else if (path === '/api/register-domains' && request.method === 'POST') {
      // ... existing register-domains logic ...
    } else if (path === '/api/ping' && (request.method === 'GET' || request.method === 'HEAD')) {
      // ... existing ping logic ...
    }

    return new Response(JSON.stringify({ message: "Route not found", path }), { status: 404, headers: corsHeaders });

  } catch (error: any) {
    console.error("[Worker handleRequest] Error:", error); // Log top-level errors
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