import OpenAI from 'openai';
import * as ip from "ip";
import { URL } from "url";
import type { SEOCheck } from './../shared/types/index';
import { calculateSEOScore } from './../shared/utils/seoUtils'; // Import shared function

// --- Shared Types ---

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

// UPDATED: ScrapedPageData - Add title and metaDescription from scrape
interface ScrapedPageData {
  title: string; // Added: To store scraped <title>
  metaDescription: string; // Added: To store scraped <meta name="description">
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
  checks: SEOCheck[]; // Uses imported SEOCheck
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

// processHtml function signature (return type updated)
async function processHtml(html: string, url: string): Promise<ScrapedPageData> {
  try {
    console.log(`[SEO Analyzer] Processing HTML content from: ${url}`);
    const baseUrl = new URL(url);

    // --- Extract Title ---
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    // Decode HTML entities in the title
    const pageTitle = titleMatch ? titleMatch[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim() : '';
    console.log(`[SEO Analyzer] Extracted Page Title: ${pageTitle}`);

    // --- Extract Meta Description ---
    const metaDescriptionRegex = /<meta\s+(?:[^>]*?\s+)?(?:name=["']description["']|content=["']([^"']*)["'])\s+(?:[^>]*?\s+)?(?:name=["']description["']|content=["']([^"']*)["'])\s*[^>]*>/i;
    const metaDescriptionMatch = html.match(metaDescriptionRegex);
    const rawMetaDescription = metaDescriptionMatch ? (metaDescriptionMatch[1] || metaDescriptionMatch[2]) : '';
    const metaDescription = rawMetaDescription
      ? rawMetaDescription.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
      : '';
    console.log(`[SEO Analyzer] Extracted Meta Description: ${metaDescription}`);


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
    // --- Fetch JS resources ---
    const jsMatches = html.matchAll(/<script[^>]*src=["'](.*?)["'][^>]*>/gi);
    const jsFetchPromises = [];
    for (const match of jsMatches) {
      const src = match[1];
      if (src) {
        try {
          const absoluteUrl = new URL(src, baseUrl.toString()).toString();
          jsFetchPromises.push(
            fetch(absoluteUrl)
              .then(res => res.ok ? res.text() : Promise.resolve(undefined)) // Fetch content only if successful
              .then(content => ({ url: absoluteUrl, content }))
              .catch(() => ({ url: absoluteUrl, content: undefined })) // Handle fetch errors
          );
        } catch (e) {
          console.warn(`[SEO Analyzer] Skipping invalid JS URL: ${src}`);
        }
      }
    }
    const jsResults = await Promise.all(jsFetchPromises);
    resources.js = jsResults.map(res => ({
        ...res,
        minified: res.content ? isMinified(res.content) : undefined
    }));
    console.log(`[SEO Analyzer] Processed ${resources.js.length} JS resources.`);


    // --- Fetch CSS resources ---
    const cssMatches = html.matchAll(/<link[^>]*rel=["']stylesheet["'][^>]*href=["'](.*?)["'][^>]*>/gi);
    const cssFetchPromises = [];
    for (const match of cssMatches) {
      const href = match[1];
      if (href) {
        try {
          const absoluteUrl = new URL(href, baseUrl.toString()).toString();
          cssFetchPromises.push(
            fetch(absoluteUrl)
              .then(res => res.ok ? res.text() : Promise.resolve(undefined))
              .then(content => ({ url: absoluteUrl, content }))
              .catch(() => ({ url: absoluteUrl, content: undefined }))
          );
        } catch (e) {
          console.warn(`[SEO Analyzer] Skipping invalid CSS URL: ${href}`);
        }
      }
    }
    const cssResults = await Promise.all(cssFetchPromises);
     resources.css = cssResults.map(res => ({
        ...res,
        minified: res.content ? isMinified(res.content) : undefined
    }));
    console.log(`[SEO Analyzer] Processed ${resources.css.length} CSS resources.`);
    console.log("[SEO Analyzer] Finished Resource Extraction.");


    // Detect schema markup - REMAINS THE SAME
    const schemaMarkup = detectSchemaMarkup(html);
    console.log(`[SEO Analyzer] Schema Markup Detected: ${schemaMarkup.hasSchema}, Types: ${schemaMarkup.schemaTypes.join(', ')}`);

    // Construct the final ScrapedPageData object (using the simplified interface)
    const scrapedData: ScrapedPageData = {
      title: pageTitle, // Add scraped title
      metaDescription: metaDescription, // Add scraped description
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
    // Ensure a valid ScrapedPageData structure is returned even on error,
    // potentially with empty fields, so the calling function doesn't break.
     return {
        title: '',
        metaDescription: '',
        content: '',
        paragraphs: [],
        headings: [],
        images: [],
        internalLinks: [],
        outboundLinks: [],
        url: url,
        resources: { js: [], css: [] },
        schemaMarkup: { hasSchema: false, schemaTypes: [], schemaCount: 0 }
     };
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

  // Define the pattern for Webflow dynamic variables
  const webflowVariablePattern = /\{\{wf\s+\{&quot;.*?&quot;\\\}\s*\}\}/;
  let apiDataUsedForTitle = false;
  let apiDataUsedForDescription = false;

  let scrapedData: ScrapedPageData | null = null;
  let titleToCheck: string = '';
  let descriptionToCheck: string = '';
  let ogTitleToCheck: string = webflowPageData?.ogTitle || '';
  let ogDescriptionToCheck: string = webflowPageData?.ogDescription || '';
  let ogImageToCheck: string = webflowPageData?.ogImage || '';

  try {
    // Always scrape the page
    scrapedData = await scrapeWebpage(url, siteInfo);
    console.log("[SEO Analyzer] Page scraped successfully by worker.");
    // ADD LOG: Log the scraped title/desc immediately
    console.log(`[SEO Analyzer] SCRAPED Title: "${scrapedData.title}"`);
    console.log(`[SEO Analyzer] SCRAPED Meta Description: "${scrapedData.metaDescription}"`);

    // --- Determine Title ---
    if (webflowPageData?.title && !webflowVariablePattern.test(webflowPageData.title)) {
      titleToCheck = webflowPageData.title;
      apiDataUsedForTitle = true;
      console.log("[SEO Analyzer] Using Title from Webflow API:", titleToCheck);
    } else {
      titleToCheck = scrapedData.title;
      apiDataUsedForTitle = false;
      // ADD LOG: Confirm fallback happened
      console.log("[SEO Analyzer] Using SCRAPED Title:", titleToCheck);
    }

    // --- Determine Meta Description ---
    if (webflowPageData?.metaDescription && !webflowVariablePattern.test(webflowPageData.metaDescription)) {
      // Use API data if available and static
      descriptionToCheck = webflowPageData.metaDescription;
      apiDataUsedForDescription = true;
      console.log("[SEO Analyzer] Using Meta Description from Webflow API:", descriptionToCheck);
    } else {
      // Fallback to scraped data if API data is missing or dynamic
      descriptionToCheck = scrapedData.metaDescription;
      apiDataUsedForDescription = false;
      console.log("[SEO Analyzer] Using SCRAPED Meta Description:", descriptionToCheck); // Log fallback
    }

    // --- Determine OG Title ---
    // If Webflow says use main title, and main title ended up being scraped, use scraped title for OG too.
    if (webflowPageData?.usesTitleAsOGTitle && !apiDataUsedForTitle) {
      ogTitleToCheck = titleToCheck;
      console.log("[SEO Analyzer] Using scraped title as OG Title because usesTitleAsOGTitle is true.");
    } else if (webflowPageData?.ogTitle && !webflowVariablePattern.test(webflowPageData.ogTitle)) {
      ogTitleToCheck = webflowPageData.ogTitle; // Use specific OG title if set and static
      console.log("[SEO Analyzer] Using specific OG Title from Webflow API:", ogTitleToCheck);
    } else if (webflowPageData?.ogTitle && webflowVariablePattern.test(webflowPageData.ogTitle)) {
      // If OG title is dynamic, maybe fall back to main title? Or leave blank? Let's use main title.
      ogTitleToCheck = titleToCheck;
      console.log("[SEO Analyzer] Webflow API OG Title was dynamic, falling back to main title:", ogTitleToCheck);
    } else {
      // Default case if no specific OG title and not using main title (or main title wasn't set)
      ogTitleToCheck = titleToCheck; // Fallback to main title
      console.log("[SEO Analyzer] No specific OG Title, falling back to main title:", ogTitleToCheck);
    }

    // --- Determine OG Description ---
    // If Webflow says use main description, and main description ended up being scraped, use scraped description for OG too.
    if (webflowPageData?.usesDescriptionAsOGDescription && !apiDataUsedForDescription) {
      ogDescriptionToCheck = descriptionToCheck;
      console.log("[SEO Analyzer] Using scraped description as OG Description because usesDescriptionAsOGDescription is true.");
    } else if (webflowPageData?.ogDescription && !webflowVariablePattern.test(webflowPageData.ogDescription)) {
      ogDescriptionToCheck = webflowPageData.ogDescription; // Use specific OG description if set and static
      console.log("[SEO Analyzer] Using specific OG Description from Webflow API:", ogDescriptionToCheck);
    } else if (webflowPageData?.ogDescription && webflowVariablePattern.test(webflowPageData.ogDescription)) {
      // If OG description is dynamic, fall back to main description.
      ogDescriptionToCheck = descriptionToCheck;
      console.log("[SEO Analyzer] Webflow API OG Description was dynamic, falling back to main description:", ogDescriptionToCheck);
    } else {
      // Default case
      ogDescriptionToCheck = descriptionToCheck; // Fallback to main description
      console.log("[SEO Analyzer] No specific OG Description, falling back to main description:", ogDescriptionToCheck);
    }

    // --- OG Image ---
    // If OG image looks dynamic, we can't easily scrape it. Log a warning.
    if (webflowPageData?.ogImage && webflowVariablePattern.test(webflowPageData.ogImage)) {
      console.warn("[SEO Analyzer] OG Image uses a dynamic variable. Cannot verify its existence via scraping.");
      ogImageToCheck = ''; // Set to empty as we can't confirm it
    } else {
      ogImageToCheck = webflowPageData?.ogImage || ''; // Use static value or empty
      console.log("[SEO Analyzer] Using OG Image from Webflow API (or empty):", ogImageToCheck || 'Not Set');
    }

  } catch (scrapeError: any) {
    console.error(`[SEO Analyzer] Worker failed to scrape page: ${url}`, scrapeError);
    // If scraping fails, we MUST rely on webflowPageData, even if dynamic/incomplete
    titleToCheck = webflowPageData?.title || '';
    descriptionToCheck = webflowPageData?.metaDescription || '';
    ogTitleToCheck = webflowPageData?.ogTitle || titleToCheck; // Fallback OG title
    ogDescriptionToCheck = webflowPageData?.ogDescription || descriptionToCheck; // Fallback OG desc
    ogImageToCheck = webflowPageData?.ogImage || ''; // Fallback OG image

    // Check for dynamic patterns even in fallback data
    if (webflowVariablePattern.test(titleToCheck)) titleToCheck = ''; // If dynamic and scrape failed, we have nothing
    if (webflowVariablePattern.test(descriptionToCheck)) descriptionToCheck = '';
    if (webflowVariablePattern.test(ogTitleToCheck)) ogTitleToCheck = titleToCheck; // Fallback again
    if (webflowVariablePattern.test(ogDescriptionToCheck)) ogDescriptionToCheck = descriptionToCheck; // Fallback again
    if (webflowVariablePattern.test(ogImageToCheck)) ogImageToCheck = '';

    apiDataUsedForTitle = true; // Mark as true because we are falling back to it
    apiDataUsedForDescription = true;

    if (!titleToCheck && !descriptionToCheck) {
      // If scrape failed AND API data was dynamic/missing, we can't proceed
      throw new Error(`Failed to fetch or scrape page content for ${url}. Cannot perform analysis.`);
    }
    console.warn("[SEO Analyzer] Proceeding with potentially incomplete data from Webflow API due to scraping failure.");
  }

  // Ensure scrapedData is not null for subsequent checks that need it
  if (!scrapedData) {
    console.error("[SEO Analyzer] CRITICAL: scrapedData is null after scrape attempt. Using empty fallback.");
    // Create a minimal fallback structure to prevent crashes
    scrapedData = {
      title: titleToCheck, // Use the determined title/desc
      metaDescription: descriptionToCheck,
      content: '', paragraphs: [], headings: [], images: [],
      internalLinks: [], outboundLinks: [], url: url,
      resources: { js: [], css: [] },
      schemaMarkup: { hasSchema: false, schemaTypes: [], schemaCount: 0 }
    };
    // Potentially throw an error here if scraping is absolutely critical
    // throw new Error("Scraping failed critically, cannot continue analysis.");
  }

  const checks: SEOCheck[] = [];
  const keyphraseLower = keyphrase.toLowerCase();

  // --- Run Checks using determined values ---

  // 1. Keyphrase in Title
  // ADD LOG: Log the title being checked JUST BEFORE the check
  console.log(`[SEO Analyzer] CHECKING Title: "${titleToCheck}" for keyphrase "${keyphraseLower}"`);
  const titleCheck: SEOCheck = {
    title: "Keyphrase in Title",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Keyphrase in Title"]
  };
  const titleLower = titleToCheck.toLowerCase();
  titleCheck.passed = titleLower.includes(keyphraseLower);
  titleCheck.description = titleCheck.passed
    ? getSuccessMessage(titleCheck.title)
    : `The keyphrase "${keyphrase}" was not found in the page title. The current title is "${titleToCheck || 'Not Found'}".`;
  if (!titleCheck.passed && titleToCheck) { // Only get recommendation if title exists
    titleCheck.recommendation = await getAIRecommendation(titleCheck.title, keyphrase, env, titleToCheck);
  } else if (!titleCheck.passed && !titleToCheck) {
    titleCheck.recommendation = `The page title is missing. Add a title including the keyphrase "${keyphrase}".`;
  }
  checks.push(titleCheck);

  // 2. Keyphrase in Meta Description
  console.log(`[SEO Analyzer] CHECKING Meta Description: "${descriptionToCheck}" for keyphrase "${keyphraseLower}"`); // Log value being checked
  const descriptionCheck: SEOCheck = {
    title: "Keyphrase in Meta Description",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Keyphrase in Meta Description"]
  };
  const metaDescriptionLower = descriptionToCheck.toLowerCase(); // Uses the determined value
  descriptionCheck.passed = metaDescriptionLower.includes(keyphraseLower);
  descriptionCheck.description = descriptionCheck.passed
    ? getSuccessMessage(descriptionCheck.title)
    : `The keyphrase "${keyphrase}" was not found in the meta description. The current description is "${descriptionToCheck || 'Not Found'}".`;
  if (!descriptionCheck.passed && descriptionToCheck) { // Only get recommendation if description exists
    descriptionCheck.recommendation = await getAIRecommendation(descriptionCheck.title, keyphrase, env, descriptionToCheck);
  } else if (!descriptionCheck.passed && !descriptionToCheck) {
    descriptionCheck.recommendation = `The meta description is missing. Add a description including the keyphrase "${keyphrase}".`;
  }
  checks.push(descriptionCheck);

  // 3. Keyphrase in URL
  const urlCheck: SEOCheck = {
    title: "Keyphrase in URL",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Keyphrase in URL"]
  };
  try {
    const urlPath = new URL(url).pathname;
    // Use publishPath if not homepage, otherwise check the full URL path
    const slugToCheck = !isHomePage && publishPath ? publishPath : urlPath;
    const slugLower = slugToCheck.toLowerCase();
    // Check if keyphrase words are in the slug
    const keyphraseWords = keyphraseLower.split(/[\s-]+/); // Split by space or hyphen
    urlCheck.passed = keyphraseWords.every(word => slugLower.includes(word));
    urlCheck.description = urlCheck.passed
      ? getSuccessMessage(urlCheck.title)
      : `The keyphrase "${keyphrase}" (or parts of it) was not found in the URL slug "${slugToCheck}".`;
    if (!urlCheck.passed) {
      // Simple recommendation, AI might not be best here
      urlCheck.recommendation = `Consider including your keyphrase "${keyphrase}" in the page's URL slug for better SEO. Current slug: ${slugToCheck}`;
    }
  } catch (e) {
    urlCheck.description = "Could not parse URL to check the slug.";
    urlCheck.passed = false; // Mark as failed if URL is invalid
  }
  checks.push(urlCheck);

  // 4. Content Length
  const contentLengthCheck: SEOCheck = {
    title: "Content Length",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Content Length"]
  };
  const wordCount = scrapedData.content.split(/\s+/).filter(Boolean).length;
  const minWordCount = 300; // Example minimum
  contentLengthCheck.passed = wordCount >= minWordCount;
  contentLengthCheck.description = contentLengthCheck.passed
    ? `Content length is ${wordCount} words. ${getSuccessMessage(contentLengthCheck.title)}`
    : `Content length is ${wordCount} words, which is below the recommended minimum of ${minWordCount} words for comprehensive content.`;
  if (!contentLengthCheck.passed) {
    contentLengthCheck.recommendation = `Your page content has ${wordCount} words. Aim for at least ${minWordCount} words by expanding on topics, adding details, or including relevant examples to provide more value and improve SEO.`;
  }
  checks.push(contentLengthCheck);

  // 5. Keyphrase Density
  const densityCheck: SEOCheck = {
    title: "Keyphrase Density",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Keyphrase Density"]
  };
  const { density, occurrences, totalWords } = calculateKeyphraseDensity(scrapedData.content, keyphrase);
  const minDensity = 0.5; // 0.5%
  const maxDensity = 2.5; // 2.5%
  densityCheck.passed = density >= minDensity && density <= maxDensity;
  densityCheck.description = `Keyphrase "${keyphrase}" appears ${occurrences} times in ${totalWords} words. Density: ${density.toFixed(2)}%. `;
  if (densityCheck.passed) {
    densityCheck.description += getSuccessMessage(densityCheck.title);
  } else if (density < minDensity) {
    densityCheck.description += `This is below the recommended range (${minDensity}-${maxDensity}%). Try to include the keyphrase naturally a few more times.`;
    densityCheck.recommendation = `Keyphrase density is low (${density.toFixed(2)}%). Include "${keyphrase}" naturally a few more times within your headings and body text where relevant.`;
  } else { // density > maxDensity
    densityCheck.description += `This is above the recommended range (${minDensity}-${maxDensity}%). This could be seen as keyword stuffing. Try reducing the number of times the keyphrase appears.`;
    densityCheck.recommendation = `Keyphrase density is high (${density.toFixed(2)}%). Reduce the usage of "${keyphrase}" to avoid keyword stuffing. Replace some instances with synonyms or rephrase sentences.`;
  }
  checks.push(densityCheck);

  // 6. Keyphrase in Introduction
  const introCheck: SEOCheck = {
    title: "Keyphrase in Introduction",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Keyphrase in Introduction"]
  };
  const firstParagraph = scrapedData.paragraphs.length > 0 ? scrapedData.paragraphs[0].toLowerCase() : "";
  introCheck.passed = firstParagraph.includes(keyphraseLower);
  introCheck.description = introCheck.passed
    ? getSuccessMessage(introCheck.title)
    : `The keyphrase "${keyphrase}" was not found in the first paragraph of your content.`;
  if (!introCheck.passed && scrapedData.paragraphs.length > 0) {
    introCheck.recommendation = await getAIRecommendation(introCheck.title, keyphrase, env, scrapedData.paragraphs[0]);
  } else if (!introCheck.passed) {
    introCheck.recommendation = `Include the keyphrase "${keyphrase}" naturally within the first paragraph of your page content.`;
  }
  checks.push(introCheck);

  // 7. Image Alt Attributes
  const altTextCheck: SEOCheck = {
    title: "Image Alt Attributes",
    description: "",
    passed: false, // Default to false, set true if all relevant images pass
    priority: analyzerCheckPriorities["Image Alt Attributes"]
  };
  const imagesWithoutAlt = scrapedData.images.filter(img => !img.alt || img.alt.trim() === '');
  // Consider filtering out decorative images if possible (e.g., based on filename or context)
  altTextCheck.passed = imagesWithoutAlt.length === 0 && scrapedData.images.length > 0; // Pass if no images missing alt OR if there are no images
  if (scrapedData.images.length === 0) {
    altTextCheck.description = "No images found on the page to check for alt text.";
    altTextCheck.passed = true; // Pass if no images
  } else if (altTextCheck.passed) {
    altTextCheck.description = getSuccessMessage(altTextCheck.title);
  } else {
    altTextCheck.description = `${imagesWithoutAlt.length} image(s) are missing descriptive alt text.`;
    altTextCheck.recommendation = `Add descriptive alt text to all meaningful images. For example, for an image of a "red cat playing", use alt="Red cat playing with a ball of yarn". Missing alt text on: ${imagesWithoutAlt.map(img => img.src.split('/').pop()).slice(0, 3).join(', ')}${imagesWithoutAlt.length > 3 ? '...' : ''}`;
  }
  checks.push(altTextCheck);

  // 8. Internal Links
  const internalLinksCheck: SEOCheck = {
    title: "Internal Links",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Internal Links"]
  };
  internalLinksCheck.passed = scrapedData.internalLinks.length > 0;
  internalLinksCheck.description = internalLinksCheck.passed
    ? `Found ${scrapedData.internalLinks.length} internal links. ${getSuccessMessage(internalLinksCheck.title)}`
    : "No internal links found. Linking to other relevant pages on your site helps SEO.";
  if (!internalLinksCheck.passed) {
    internalLinksCheck.recommendation = "Add links from this page to other relevant pages or posts on your website. This helps distribute link equity and improves site navigation.";
  }
  checks.push(internalLinksCheck);

  // 9. Outbound Links
  const outboundLinksCheck: SEOCheck = {
    title: "Outbound Links",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Outbound Links"]
  };
  outboundLinksCheck.passed = scrapedData.outboundLinks.length > 0;
  outboundLinksCheck.description = outboundLinksCheck.passed
    ? `Found ${scrapedData.outboundLinks.length} outbound links. ${getSuccessMessage(outboundLinksCheck.title)}`
    : "No outbound links found. Linking to relevant external resources can add value.";
  if (!outboundLinksCheck.passed) {
    outboundLinksCheck.recommendation = "Consider adding 1-2 links to high-quality, relevant external websites or resources where appropriate. This can provide additional context and value to your readers.";
  }
  checks.push(outboundLinksCheck);

  // 10. Next-Gen Image Formats
  const imageFormatCheck: SEOCheck = {
    title: "Next-Gen Image Formats",
    description: "Checks if images use modern formats like WebP or AVIF. (Basic check, manual verification recommended)",
    passed: true,
    priority: analyzerCheckPriorities["Next-Gen Image Formats"]
  };
  const nonNextGenImages = scrapedData.images.filter(img =>
    !img.src.toLowerCase().endsWith('.webp') &&
    !img.src.toLowerCase().endsWith('.avif') &&
    !img.src.toLowerCase().endsWith('.svg') &&
    !img.src.toLowerCase().includes('data:image/')
  );
  if (nonNextGenImages.length > 0 && scrapedData.images.length > 0) {
    imageFormatCheck.passed = false;
    imageFormatCheck.description = `${nonNextGenImages.length} image(s) are not using next-gen formats (like WebP or AVIF). Consider converting formats like JPG or PNG.`;
    imageFormatCheck.recommendation = `Convert images like ${nonNextGenImages.map(img => img.src.split('/').pop()).slice(0, 3).join(', ')}${nonNextGenImages.length > 3 ? '...' : ''} to WebP or AVIF format using online tools or image editors to improve loading speed.`;
  } else if (scrapedData.images.length > 0) {
    imageFormatCheck.description = getSuccessMessage(imageFormatCheck.title);
  } else {
    imageFormatCheck.description = "No images found to check format.";
    imageFormatCheck.passed = true;
  }
  checks.push(imageFormatCheck);

  // 11. OG Image
  const ogImageCheck: SEOCheck = {
    title: "OG Image",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["OG Image"]
  };
  // Use the finally determined ogImageToCheck
  ogImageCheck.passed = !!ogImageToCheck;
  ogImageCheck.description = ogImageCheck.passed
    ? `Open Graph image is set: ${ogImageToCheck}. ${getSuccessMessage(ogImageCheck.title)}`
    : "Open Graph image is not set. This image is shown when the page is shared on social media.";
  if (!ogImageCheck.passed) {
    ogImageCheck.recommendation = "Set an Open Graph image in your page settings (under Social Image). Recommended size is 1200x630 pixels.";
  }
  checks.push(ogImageCheck);

  // 12. OG Title and Description
  const ogMetaCheck: SEOCheck = {
    title: "OG Title and Description",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["OG Title and Description"]
  };
  // Use the finally determined ogTitleToCheck and ogDescriptionToCheck
  const hasOgTitle = !!ogTitleToCheck;
  const hasOgDescription = !!ogDescriptionToCheck;
  ogMetaCheck.passed = hasOgTitle && hasOgDescription;
  let ogMetaDescText = "";
  if (ogMetaCheck.passed) {
      ogMetaDescText = `Open Graph title and description are set. ${getSuccessMessage(ogMetaCheck.title)}`;
  } else if (!hasOgTitle && !hasOgDescription) {
      ogMetaDescText = "Open Graph title and description are missing.";
  } else if (!hasOgTitle) {
      ogMetaDescText = "Open Graph title is missing.";
  } else { // !hasOgDescription
      ogMetaDescText = "Open Graph description is missing.";
  }
   ogMetaCheck.description = ogMetaDescText;
   if (!ogMetaCheck.passed) {
       let recommendation = "Set the Open Graph ";
       if (!hasOgTitle && !hasOgDescription) recommendation += "title and description";
       else if (!hasOgTitle) recommendation += "title";
       else recommendation += "description";
       recommendation += " in your page settings (under Social Title/Description) for better social media sharing previews.";
       if (!hasOgTitle) recommendation += `\nOG Title Suggestion: ${titleToCheck || keyphrase}`; // Suggest main title or keyphrase
       if (!hasOgDescription) recommendation += `\nOG Description Suggestion: ${descriptionToCheck || 'Brief summary of the page content.'}`; // Suggest main description or placeholder
       ogMetaCheck.recommendation = recommendation;
   }
  checks.push(ogMetaCheck);


  // 13. Keyphrase in H1 Heading
  const h1Check: SEOCheck = {
    title: "Keyphrase in H1 Heading",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Keyphrase in H1 Heading"]
  };
  const h1Headings = scrapedData.headings.filter(h => h.level === 1);
  if (h1Headings.length === 1) {
      const h1TextLower = h1Headings[0].text.toLowerCase();
      h1Check.passed = h1TextLower.includes(keyphraseLower);
      h1Check.description = h1Check.passed
          ? `The H1 heading "${h1Headings[0].text}" includes the keyphrase. ${getSuccessMessage(h1Check.title)}`
          : `The keyphrase "${keyphrase}" was not found in the main H1 heading: "${h1Headings[0].text}".`;
      if (!h1Check.passed) {
          h1Check.recommendation = await getAIRecommendation(h1Check.title, keyphrase, env, h1Headings[0].text);
      }
  } else if (h1Headings.length === 0) {
      h1Check.description = "No H1 heading found on the page. Every page should have exactly one H1.";
      h1Check.recommendation = `Add an H1 heading to the page that includes your target keyphrase "${keyphrase}".`;
  } else { // More than one H1
      h1Check.description = `Multiple H1 headings (${h1Headings.length}) found. A page should ideally have only one H1.`;
      h1Check.recommendation = `Review your page structure. Ensure there is only one H1 heading, and include the keyphrase "${keyphrase}" within it.`;
  }
  checks.push(h1Check);


  // 14. Keyphrase in H2 Headings
  const h2Check: SEOCheck = {
    title: "Keyphrase in H2 Headings",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Keyphrase in H2 Headings"]
  };
  const h2Headings = scrapedData.headings.filter(h => h.level === 2);
  const h2WithKeyphrase = h2Headings.filter(h => h.text.toLowerCase().includes(keyphraseLower));
  h2Check.passed = h2WithKeyphrase.length > 0;
  if (h2Headings.length === 0) {
       h2Check.description = "No H2 headings found. Using H2s helps structure content.";
       h2Check.passed = false; // Explicitly fail if no H2s exist
       h2Check.recommendation = `Add H2 headings to break up your content into logical sections. Include the keyphrase "${keyphrase}" in one or more H2s where relevant.`;
  } else {
      h2Check.description = h2Check.passed
          ? `${h2WithKeyphrase.length} out of ${h2Headings.length} H2 heading(s) include the keyphrase. ${getSuccessMessage(h2Check.title)}`
          : `The keyphrase "${keyphrase}" was not found in any H2 headings.`;
      if (!h2Check.passed) {
          h2Check.recommendation = `Include the keyphrase "${keyphrase}" in at least one relevant H2 heading to improve content structure and SEO.`;
      }
  }
  checks.push(h2Check);


  // 15. Heading Hierarchy
  const hierarchyCheck: SEOCheck = {
    title: "Heading Hierarchy",
    description: "",
    passed: true, // Assume true unless an issue is found
    priority: analyzerCheckPriorities["Heading Hierarchy"]
  };
  let lastLevel = 0;
  let hierarchyIssue = "";
  for (const heading of scrapedData.headings) {
      if (heading.level > lastLevel + 1) {
          hierarchyIssue = `Heading level skipped: Found H${heading.level} after H${lastLevel}. ("${heading.text.substring(0,30)}...")`;
          hierarchyCheck.passed = false;
          break;
      }
      lastLevel = heading.level;
  }
   if (scrapedData.headings.length > 0 && scrapedData.headings[0].level !== 1 && !hierarchyIssue) {
       // Check if first heading is not H1 (but allow if no H1 exists at all, covered by H1 check)
       const hasH1 = scrapedData.headings.some(h => h.level === 1);
       if (hasH1) {
           hierarchyIssue = `First heading is H${scrapedData.headings[0].level}, not H1.`;
           hierarchyCheck.passed = false;
       }
   }

  if (hierarchyCheck.passed) {
      hierarchyCheck.description = getSuccessMessage(hierarchyCheck.title);
  } else {
      hierarchyCheck.description = `Heading hierarchy issue detected: ${hierarchyIssue}`;
      hierarchyCheck.recommendation = `Review your heading structure (H1, H2, H3, etc.). Ensure headings follow a logical order without skipping levels (e.g., don't jump from H2 to H4). Start with an H1. Fix: ${hierarchyIssue}`;
  }
  checks.push(hierarchyCheck);


  // 16. Code Minification
  const minificationCheck: SEOCheck = {
      title: "Code Minification",
      description: "",
      passed: true, // Assume true unless unminified files found
      priority: analyzerCheckPriorities["Code Minification"]
  };
  const unminifiedJs = scrapedData.resources.js.filter(r => r.content && !r.minified);
  const unminifiedCss = scrapedData.resources.css.filter(r => r.content && !r.minified);
  if (unminifiedJs.length > 0 || unminifiedCss.length > 0) {
      minificationCheck.passed = false;
      const jsFiles = unminifiedJs.map(r => r.url.split('/').pop()).slice(0,2).join(', ');
      const cssFiles = unminifiedCss.map(r => r.url.split('/').pop()).slice(0,2).join(', ');
      minificationCheck.description = `Found potentially unminified code: ${unminifiedJs.length} JS file(s) ${jsFiles ? '('+jsFiles+'...)' : ''}, ${unminifiedCss.length} CSS file(s) ${cssFiles ? '('+cssFiles+'...)' : ''}.`;
      minificationCheck.recommendation = `Minify JavaScript and CSS files to reduce file size and improve page load speed. Webflow typically handles this, but check custom code or third-party scripts.`;
  } else {
       minificationCheck.description = getSuccessMessage(minificationCheck.title);
  }
  checks.push(minificationCheck);


  // 17. Schema Markup
  const schemaCheck: SEOCheck = {
    title: "Schema Markup",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Schema Markup"]
  };
  schemaCheck.passed = scrapedData.schemaMarkup.hasSchema;
  if (schemaCheck.passed) {
      schemaCheck.description = `Schema.org markup detected (${scrapedData.schemaMarkup.schemaCount} block(s)). Types: ${scrapedData.schemaMarkup.schemaTypes.join(', ') || 'Unknown'}. ${getSuccessMessage(schemaCheck.title)}`;
  } else {
      schemaCheck.description = "No Schema.org structured data markup found. Adding schema can help search engines understand your content better.";
      schemaCheck.recommendation = analyzerFallbackRecommendations["Schema Markup"]({}); // Use fallback
  }
  checks.push(schemaCheck);

  // 18. Image File Size (Placeholder/Basic)
  const imageSizeCheck: SEOCheck = {
      title: "Image File Size",
      description: "Checks if images have potentially large file sizes. (Basic check, manual verification recommended)",
      passed: true, // Assume true, needs actual size data
      priority: analyzerCheckPriorities["Image File Size"]
  };
  // This check requires fetching image headers or the images themselves to get size,
  // which is too intensive for this basic analysis. Mark as passed with a note.
  imageSizeCheck.description = "Image file size check requires manual verification or advanced tools. Ensure images are compressed appropriately.";
  checks.push(imageSizeCheck);


  // --- Final Calculation ---
  const passedChecks = checks.filter(check => check.passed).length;
  const failedChecks = checks.length - passedChecks;
  const score = calculateSEOScore(checks); // Now uses the imported function

  // ADD LOG: Log the flags before constructing the result
  console.log(`[SEO Analyzer] Final Flags: apiDataUsedForTitle=${apiDataUsedForTitle}, apiDataUsedForDescription=${apiDataUsedForDescription}`);

  const result: SEOAnalysisResult = {
    checks,
    passedChecks,
    failedChecks,
    url,
    score,
    timestamp: new Date().toISOString(),
    apiDataUsed: apiDataUsedForTitle || apiDataUsedForDescription
  };

  console.log("[SEO Analyzer] Analysis complete. Score:", score);
  return result;

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