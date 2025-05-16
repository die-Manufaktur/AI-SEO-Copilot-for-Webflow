import OpenAI from 'openai';
import { URL } from "url";
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { 
  SEOCheck,
  OGMetadata,
  Resource,
  SchemaMarkupResult,
  WebflowPageData,
  ScrapedPageData,
  SEOAnalysisResult,
  WebflowDomain,
  WebflowSiteInfo,
  AnalyzeSEORequest
} from '../shared/types/index';
import { calculateSEOScore } from '../shared/utils/seoUtils';
import { shortenFileName } from '../shared/utils/fileUtils';

// --- Constants ---
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

// Fallback recommendations if AI is unavailable
const analyzerFallbackRecommendations: Record<string, (params: any) => string> = {
  "Schema Markup": () =>
    `Add structured data markup using JSON-LD format in a script tag with type="application/ld+json". Include appropriate schema types from schema.org relevant to your content. Test your markup with Google's Rich Results Test tool.`,
  // Add more fallbacks as needed
};

// Function is now imported from shared utils

/**
 * Gets a success message for a passed SEO check.
 * @param checkType The name of the check that passed
 * @returns Formatted success message
 */
function getSuccessMessage(checkType: string): string {
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
      return "Nice! Your images are in next-gen formats.";
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
      return "Great job! All your images are well-optimized, keeping your page loading times fast.";
    default:
      return `Check passed: ${checkType}`;
  }
}

/**
 * Generates an AI-powered recommendation for an SEO check
 * @param checkType The type of SEO check
 * @param keyphrase The target keyphrase
 * @param env Environment variables
 * @param context Additional context for the recommendation
 * @returns AI-powered recommendation or fallback message
 */
async function getAIRecommendation(
  checkType: string,
  keyphrase: string,
  env: any, 
  context?: string
): Promise<string> {
  try {
    if (!env.OPENAI_API_KEY) {
      console.warn("[SEO Analyzer] OpenAI API key not found");
      return analyzerFallbackRecommendations[checkType]?.({ keyphrase }) || 
        `Improve your ${checkType.toLowerCase()} to boost SEO performance.`;
    }

    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });

    // Create a detailed prompt for better recommendations
    const prompt = `You are an expert SEO consultant helping a Webflow user improve their website. 
      Provide a specific, actionable recommendation for the "${checkType}" check which failed for a webpage targeting the keyphrase "${keyphrase}".
      
      Additional context: ${context || "No additional context provided."}
      
      Provide ONLY the recommendation text in a clear, professional tone. Be specific and actionable. Do not include labels, formatting or explanations that this is a recommendation.`;

    const maxRetries = 2;
    let retries = 0;
    let response;

    while (retries <= maxRetries) {
      try {
        response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are an expert SEO consultant providing specific, actionable advice." },
            { role: "user", content: prompt }
          ],
          temperature: 0.4,
          max_tokens: 250,
        });
        break;
      } catch (error) {
        if (retries === maxRetries) throw error;
        retries++;
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
      }
    }

    if (!response || !response.choices[0]?.message?.content) {
      throw new Error("No recommendation received from OpenAI");
    }

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error(`[SEO Analyzer] Error generating AI recommendation for ${checkType}:`, error);
    // Return fallback recommendation
    return analyzerFallbackRecommendations[checkType]?.({ keyphrase }) || 
      `Improve your ${checkType.toLowerCase()} to boost SEO performance.`;
  }
}

// Add environment interface at the top level
interface Env {
  USE_GPT_RECOMMENDATIONS?: string;
  WEBFLOW_API_KEY?: string;
  OPENAI_API_KEY?: string;
  // Add other environment variables as needed
}

// Rename the local interface to avoid conflict
interface AnalyzeSEORequestBody {
  keyphrase: string;
  url: string;
  isHomePage?: boolean;
  webflowPageData?: WebflowPageData;
  pageAssets?: Array<{ url: string; alt: string; type: string; size?: number; mimeType?: string }>;
}

// Update validation function to use new interface name
function validateAnalyzeRequest(body: unknown): body is AnalyzeSEORequestBody {
  if (!body || typeof body !== 'object') return false;
  
  const request = body as AnalyzeSEORequestBody;
  return (
    typeof request.keyphrase === 'string' && request.keyphrase.length > 0 &&
    typeof request.url === 'string' && request.url.length > 0 &&
    (request.isHomePage === undefined || typeof request.isHomePage === 'boolean')
  );
}

/**
 * Scrapes a web page for SEO-relevant content
 * @param url URL to scrape
 * @param env Environment variables
 * @param keyphrase Target SEO keyphrase
 * @returns Structured page data
 */
async function scrapeWebPage(url: string, env: Env, keyphrase: string): Promise<ScrapedPageData> {
  try {
    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch (error) {
      throw new Error(`Invalid URL format: ${url}`);
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SEO-Analyzer/1.0',
        'Accept': 'text/html',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('text/html')) {
      throw new Error(`Invalid content type: ${contentType}. Expected HTML content.`);
    }

    const html = await response.text();
    if (!html) {
      throw new Error('Empty response received from the server');
    }
    
    // Extract title
    const titleRegex = /<title>([^<]*)<\/title>/i;
    const titleMatch = titleRegex.exec(html);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Extract meta description
    const metaRegex = /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i;
    const metaMatch = metaRegex.exec(html);
    const metaDescription = metaMatch ? metaMatch[1].trim() : '';

    // Extract headings
    const headings: Array<{ level: number; text: string }> = [];
    const headingMatches = html.matchAll(/<h([1-6])[^>]*>(.*?)<\/h\1>/gi);
    for (const match of headingMatches) {
      const level = parseInt(match[1]);
      // Remove any HTML tags inside the heading
      const text = match[2].replace(/<[^>]*>/g, '').trim();
      headings.push({ level, text });
    }

    // Extract paragraphs
    const paragraphs: string[] = [];
    const paragraphMatches = html.matchAll(/<p[^>]*>(.*?)<\/p>/gi);
    for (const match of paragraphMatches) {
      // Remove any HTML tags inside the paragraph
      const text = match[1].replace(/<[^>]*>/g, '').trim();
      if (text) paragraphs.push(text);
    }

    // Combine paragraphs for content
    const content = paragraphs.join(' ');

    // Extract images with alt text
    const images: Array<{ src: string; alt: string }> = [];
    const imageMatches = html.matchAll(/<img[^>]*src=["']([^"']*)["'][^>]*alt=["']([^"']*)["'][^>]*>|<img[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']*)["'][^>]*>/gi);
    for (const match of imageMatches) {
      const src = match[1] || match[4];
      const alt = match[2] || match[3] || '';
      images.push({ src, alt });
    }

    // Extract links (internal and external)
    const internalLinks: string[] = [];
    const outboundLinks: string[] = [];
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    const linkMatches = html.matchAll(/<a[^>]*href=["']([^"']*)["'][^>]*>/gi);
    for (const match of linkMatches) {
      let link = match[1].trim();
      if (!link || link.startsWith('#') || link.startsWith('javascript:')) continue;
      
      try {
        // Handle relative URLs
        if (link.startsWith('/')) {
          link = `${urlObj.protocol}//${domain}${link}`;
        } else if (!link.startsWith('http')) {
          link = new URL(link, url).href;
        }
        
        const linkUrl = new URL(link);
        if (linkUrl.hostname === domain) {
          internalLinks.push(link);
        } else {
          outboundLinks.push(link);
        }
      } catch (error) {
        console.error(`[SEO Analyzer] Error parsing link: ${link}`, error);
      }
    }

    // Extract JS and CSS resources
    const resources: { js: Resource[]; css: Resource[] } = {
      js: [],
      css: []
    };
    
    // JS resources
    const scriptMatches = html.matchAll(/<script[^>]*src=["']([^"']*)["'][^>]*>/gi);
    for (const match of scriptMatches) {
      const url = match[1].trim();
      if (url) resources.js.push({ url });
    }
    
    // CSS resources
    const cssMatches = html.matchAll(/<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']*)["'][^>]*>/gi);
    for (const match of cssMatches) {
      const url = match[1].trim();
      if (url) resources.css.push({ url });
    }

    // Detect schema markup
    const schemaMarkup: SchemaMarkupResult = {
      hasSchema: false,
      schemaTypes: [],
      schemaCount: 0
    };
    
    // Enhanced schema markup detection
    const schemaTypes: string[] = [];
    let schemaCount = 0;
    
    // Look for JSON-LD schema
    const jsonLdMatches = html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/gi);
    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        try {
          const scriptContent = match[1];
          if (scriptContent) {
            const schema = JSON.parse(scriptContent);
            if (schema['@type']) {
              schemaTypes.push(schema['@type']);
              schemaCount++;
            }
            // Handle array of schemas
            if (Array.isArray(schema)) {
              schema.forEach(item => {
                if (item['@type']) {
                  schemaTypes.push(item['@type']);
                  schemaCount++;
                }
              });
            }
          }
        } catch (error) {
          console.error("[SEO Analyzer] Error parsing JSON-LD schema:", error);
        }
      }
    }
    
    // Look for microdata schema
    const microdataMatches = html.matchAll(/itemtype=["']https?:\/\/schema\.org\/([^"']+)["']/gi);
    if (microdataMatches) {
      for (const match of microdataMatches) {
        const typeMatch = match[1];
        if (typeMatch) {
          schemaTypes.push(typeMatch);
          schemaCount++;
        }
      }
    }
    
    // Look for RDFa schema
    const rdfaMatches = html.matchAll(/vocab=["']https?:\/\/schema\.org\/["']/gi);
    if (rdfaMatches) {
      rdfaMatches.forEach(() => {
        const typeMatch = html.match(/typeof=["']([^"']+)["']/i);
        if (typeMatch && typeMatch[1]) {
          schemaTypes.push(typeMatch[1]);
          schemaCount++;
        }
      });
    }
    
    // Create schema markup result
    const schemaMarkupResult: SchemaMarkupResult = {
      hasSchema: schemaCount > 0,
      schemaTypes: [...new Set(schemaTypes)], // Remove duplicates
      schemaCount
    };
    
    // Update the scraped data with the new schema markup result
    const scrapedData: ScrapedPageData = {
      title: title || '',
      metaDescription: metaDescription || '',
      content: html,
      paragraphs,
      headings,
      images: images || [],
      internalLinks,
      outboundLinks,
      url,
      resources,
      schemaMarkup,
      ogTitle: '',
      ogDescription: ''
    };

    const schemaCheck = {
      title: "Schema Markup",
      passed: false,
      description: "",
      recommendation: ""
    };

    schemaCheck.passed = schemaMarkupResult.hasSchema;
    
    if (schemaCheck.passed) {
      const uniqueTypes = schemaMarkupResult.schemaTypes.join(", ");
      schemaCheck.description = `Found schema markup with types: ${uniqueTypes}. ${getSuccessMessage(schemaCheck.title)}`;
    } else {
      schemaCheck.description = "No schema markup detected on the page.";
      
      // Get AI recommendation if enabled
      if (env.USE_GPT_RECOMMENDATIONS === "true") {
        try {
          schemaCheck.recommendation = await getAIRecommendation(
            schemaCheck.title,
            keyphrase,
            env,
            "No schema markup found on the page."
          );
        } catch (error) {
          console.error("[SEO Analyzer] Error getting AI recommendation for schema markup:", error);
          schemaCheck.recommendation = `Add schema markup to your page to help search engines understand your content better and potentially display rich results in search listings. Consider using JSON-LD format for better compatibility.`;
        }
      } else {
        schemaCheck.recommendation = `Add schema markup to your page to help search engines understand your content better and potentially display rich results in search listings. Consider using JSON-LD format for better compatibility.`;
      }
    }

    scrapedData.schemaMarkup = schemaMarkupResult;

    return scrapedData;
  } catch (error) {
    console.error('[SEO Analyzer] Error scraping web page:', error);
    throw new Error(`Failed to analyze page: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Handles CORS preflight requests and required headers
 * @param request Incoming request (standard Request or Hono Request)
 * @returns CORS headers or preflight response
 */
function handleCors(request: Request | Record<string, any>): Response | Record<string, string> {
  // Get origin from request - handle both standard Request and Hono Request formats
  let origin: string | null = null;
  
  // Check if it's a standard Request object with headers.get method
  if ('headers' in request && typeof request.headers.get === 'function') {
    origin = request.headers.get('Origin');
  } 
  // Check if it's a Hono Request object - use type assertion to access header method
  else if ('header' in request && typeof request['header'] === 'function') {
    origin = request['header']('Origin');
  }
  // Fallback for other request formats
  else {
    console.warn('[CORS] Could not determine request type to extract Origin header');
  }
  
  const allowedOriginsStr = process.env.ALLOWED_ORIGINS || '';
  const allowedOrigins = allowedOriginsStr.split(',');
  
  console.log('[CORS] Request origin:', origin);
  console.log('[CORS] Allowed origins:', allowedOrigins);
  
  // Helper function to check if origin is allowed
  const isAllowedOrigin = (origin: string | null): boolean => {
    if (!origin) return false;
    
    // For local development, always allow localhost URLs
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return true;
    }
    
    return allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = allowed.replace('*.', '(.+\\.)');
        return new RegExp(`^${pattern}$`).test(origin);
      }
      return allowed === origin;
    });
  };
  
  const isAllowed = isAllowedOrigin(origin);
  console.log('[CORS] Is origin allowed:', isAllowed);
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
  
  // Handle OPTIONS request (preflight)
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  return corsHeaders; // Return headers for non-OPTIONS requests
}

/**
 * Main SEO Analysis function - performs all checks and returns results
 * @param scrapedData Data scraped from the webpage
 * @param keyphrase Target SEO keyphrase
 * @param url URL of the page
 * @param isHomePage Whether the page is the homepage
 * @param env Environment variables
 * @param webflowPageData Optional data from Webflow API
 * @param pageAssets Optional page assets with size information
 * @returns Complete SEO analysis results
 */
async function analyzeSEOElements(
  scrapedData: ScrapedPageData,
  keyphrase: string,
  url: string,
  isHomePage: boolean,
  env: Env,
  webflowPageData?: WebflowPageData,
  pageAssets?: Array<{ url: string, alt: string, type: string, size?: number, mimeType?: string }>
): Promise<SEOAnalysisResult> {
  const checks: SEOCheck[] = [];
  const normalizedKeyphrase = keyphrase.toLowerCase().trim();
  
  // Determine if we're using API data
  const useApiData = !!webflowPageData;
  
  // --- Title Check ---
  const titleCheck: SEOCheck = {
    title: "Keyphrase in Title",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Keyphrase in Title"]
  };
  
  // Get title from API if available, otherwise use scraped data
  const pageTitle = useApiData && webflowPageData?.title
    ? webflowPageData.title
    : scrapedData.title;
  
  // Check if title contains the keyphrase
  titleCheck.passed = pageTitle.toLowerCase().includes(normalizedKeyphrase);
  
  if (titleCheck.passed) {
    titleCheck.description = `Great! Your title includes the keyphrase "${keyphrase}".`;
  } else {
    titleCheck.description = `Keyphrase "${keyphrase}" not found in title: "${pageTitle}"`;
    
    if (env.USE_GPT_RECOMMENDATIONS === "true" && env.OPENAI_API_KEY) {
      try {
        const context = `Create a complete, ready-to-use page title (50-60 characters) that includes the keyphrase "${keyphrase}" naturally. Current title: "${pageTitle || 'None'}"`;
        
        const aiSuggestion = await getAIRecommendation(
          "Keyphrase in Title",
          keyphrase,
          env,
          context
        );
        
        if (aiSuggestion) {
          // Check if AI suggestion contains the keyphrase
          if (aiSuggestion.toLowerCase().includes(normalizedKeyphrase)) {
            titleCheck.recommendation = aiSuggestion;
          } else {
            // AI didn't include the keyphrase, create a fallback that does
            titleCheck.recommendation = `${keyphrase.charAt(0).toUpperCase() + keyphrase.slice(1)} | ${pageTitle}`;
          }
        }
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for title:", error);
        titleCheck.recommendation = `${keyphrase.charAt(0).toUpperCase() + keyphrase.slice(1)} | ${pageTitle}`;
      }
    } else {
      titleCheck.recommendation = `${keyphrase.charAt(0).toUpperCase() + keyphrase.slice(1)} | ${pageTitle}`;
    }
  }
  checks.push(titleCheck);
  
  // --- Meta Description Check ---
  const metaDescriptionCheck: SEOCheck = {
    title: "Keyphrase in Meta Description",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Keyphrase in Meta Description"]
  };
  
  // Get meta description from API if available, otherwise use scraped data
  let metaDescription = '';
  if (useApiData && webflowPageData?.metaDescription) {
    metaDescription = webflowPageData.metaDescription;
  } else {
    metaDescription = scrapedData.metaDescription || '';
  }
  
  // Check if meta description contains the keyphrase
  metaDescriptionCheck.passed = metaDescription.toLowerCase().includes(normalizedKeyphrase);

  if (metaDescriptionCheck.passed) {
    metaDescriptionCheck.description = `Great! Your meta description includes the keyphrase "${keyphrase}".`;
  } else {
    metaDescriptionCheck.description = `Keyphrase "${keyphrase}" not found in meta description: "${metaDescription}"`;
    
    // Generate a suggested meta description with the keyphrase included
    if (env.USE_GPT_RECOMMENDATIONS === "true" && env.OPENAI_API_KEY) {
      try {
        const context = `Create a complete, ready-to-use meta description (120-155 characters) that includes the keyphrase "${keyphrase}" naturally. Current meta description: "${metaDescription || 'None'}"`;
        
        const aiSuggestion = await getAIRecommendation(
          "Keyphrase in Meta Description",
          keyphrase,
          env,
          context
        );
        
        if (aiSuggestion) {
          // Check if AI suggestion contains the keyphrase
          if (aiSuggestion.toLowerCase().includes(normalizedKeyphrase)) {
            metaDescriptionCheck.recommendation = aiSuggestion;
          } else {
            // AI didn't include the keyphrase, create a fallback that does include it
            metaDescriptionCheck.recommendation = `Discover everything you need to know about ${keyphrase}. Our comprehensive guide provides expert insights and solutions related to ${keyphrase} to help you achieve optimal results.`;
          }
        }
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for meta description:", error);
        // Provide a fallback that includes the keyphrase
        metaDescriptionCheck.recommendation = `${pageTitle || 'Our website'} offers essential information about ${keyphrase}. Learn more about ${keyphrase} and how our products/services can help address your needs.`;
      }
    } else {
      // If AI recommendations are disabled, provide a useful recommendation template
      metaDescriptionCheck.recommendation = `${pageTitle || 'Our website'} offers essential information about ${keyphrase}. Learn more about ${keyphrase} and how our products/services can help address your needs.`;
    }
  }
  checks.push(metaDescriptionCheck);
  
  // --- URL Check ---
  const urlCheck: SEOCheck = {
    title: "Keyphrase in URL",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Keyphrase in URL"]
  };
  
  // Get the canonical URL from the API if available
  let canonicalUrl = useApiData && webflowPageData?.canonicalUrl
    ? webflowPageData.canonicalUrl
    : url;
  
  // Normalize the URL for comparison
  const normalizedUrl = canonicalUrl.toLowerCase().trim();
  
  // Check if the URL contains the keyphrase
  urlCheck.passed = normalizedUrl.includes(normalizedKeyphrase);
  
  if (urlCheck.passed) {
    urlCheck.description = getSuccessMessage(urlCheck.title);
  } else {
    urlCheck.description = `Keyphrase "${keyphrase}" not found in URL: "${canonicalUrl}"`;
    
    // Get AI recommendation if enabled
    if (env.USE_GPT_RECOMMENDATIONS === "true") {
      try {
        urlCheck.recommendation = await getAIRecommendation(
          urlCheck.title,
          keyphrase,
          env,
          `Current URL: "${canonicalUrl}"`
        );
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for URL:", error);
        urlCheck.recommendation = `Consider including your keyphrase "${keyphrase}" in the URL for better SEO. Current URL: "${canonicalUrl}"`;
      }
    } else {
      urlCheck.recommendation = `Consider including your keyphrase "${keyphrase}" in the URL for better SEO. Current URL: "${canonicalUrl}"`;
    }
  }
  checks.push(urlCheck);
  
  // --- Content Length Check ---
  const contentLengthCheck: SEOCheck = {
    title: "Content Length",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Content Length"]
  };
  
  // Calculate word count instead of character count
  const contentWords = scrapedData.content.trim().split(/\s+/).filter(Boolean);
  const wordCount = contentWords.length;

  // Define word count thresholds
  const minWordCount = isHomePage ? 300 : 600;
  const optimalWordCount = isHomePage ? 500 : 1200;

  // Check if the word count is within the optimal range
  contentLengthCheck.passed = wordCount >= minWordCount;

  if (contentLengthCheck.passed) {
    contentLengthCheck.description = `Content length is optimal (${wordCount} words). ${getSuccessMessage(contentLengthCheck.title)}`;
  } else {
    contentLengthCheck.description = `Content length is ${wordCount} words, which is below the recommended minimum of ${minWordCount} words.`;
    
    // Generate AI recommendation or fallback for word count
    if (env.USE_GPT_RECOMMENDATIONS === "true") {
      try {
        const context = `Content length is currently ${wordCount} words but should be at least ${minWordCount} words (ideally around ${optimalWordCount} words).`;
        
        contentLengthCheck.recommendation = await getAIRecommendation(
          contentLengthCheck.title,
          "content optimization",
          env,
          context
        );
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for content length:", error);
        contentLengthCheck.recommendation = `Increase your content length to at least ${minWordCount} words (ideally ${optimalWordCount} words) for better SEO performance. Current word count: ${wordCount} words.`;
      }
    } else {
      contentLengthCheck.recommendation = `Increase your content length to at least ${minWordCount} words (ideally ${optimalWordCount} words) for better SEO performance. Current word count: ${wordCount} words.`;
    }
  }
  checks.push(contentLengthCheck);
  
  // --- Keyphrase Density Check ---
  const keyphraseDensityCheck: SEOCheck = {
    title: "Keyphrase Density",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Keyphrase Density"]
  };
  
  // Calculate keyphrase density
  function calculateKeyphraseDensity(content: string, keyphrase: string): number {
    const lowercaseContent = content.toLowerCase();
    const lowercaseKeyphrase = keyphrase.toLowerCase();
    
    // Count occurrences of keyphrase in content
    const regex = new RegExp(lowercaseKeyphrase, 'g');
    const matches = lowercaseContent.match(regex);
    const occurrences = matches ? matches.length : 0;
    
    // Calculate total word count
    const words = lowercaseContent.split(/\s+/);
    const wordCount = words.length || 1; // Avoid division by zero
    
    // Calculate density (percentage)
    return (occurrences / wordCount) * 100;
  }
  
  const density = calculateKeyphraseDensity(scrapedData.content, keyphrase);
  
  // Define optimal density range (in percentage) - this can be adjusted
  const minDensity = 0.5;
  const maxDensity = 2.5;
  
  // Check if the keyphrase density is within the optimal range
  keyphraseDensityCheck.passed = density >= minDensity && density <= maxDensity;
  
  if (keyphraseDensityCheck.passed) {
    keyphraseDensityCheck.description = `Keyphrase density is optimal (${density.toFixed(2)}%). ${getSuccessMessage(keyphraseDensityCheck.title)}`;
  } else {
    keyphraseDensityCheck.description = `Keyphrase density is ${density.toFixed(2)}%. `;
    
    if (density < minDensity) {
      keyphraseDensityCheck.description += `Consider using the keyphrase more often to meet the minimum recommended density of ${minDensity}%.`;
    }
    
    if (density > maxDensity) {
      keyphraseDensityCheck.description += `Consider using the keyphrase less often to avoid keyword stuffing. Current density: ${density.toFixed(2)}%.`;
    }
    
    // Get AI recommendation if enabled
    if (env.USE_GPT_RECOMMENDATIONS === "true") {
      try {
        keyphraseDensityCheck.recommendation = await getAIRecommendation(
          keyphraseDensityCheck.title,
          keyphrase,
          env,
          `Current keyphrase density: ${density.toFixed(2)}%. Target density range: ${minDensity}-${maxDensity}%.`
        );
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for keyphrase density:", error);
        keyphraseDensityCheck.recommendation = `Adjust your keyphrase usage to achieve a density between ${minDensity} and ${maxDensity}%. Current density: ${density.toFixed(2)}%.`;
      }
    } else {
      keyphraseDensityCheck.recommendation = `Adjust your keyphrase usage to achieve a density between ${minDensity} and ${maxDensity}%. Current density: ${density.toFixed(2)}%.`;
    }
  }
  checks.push(keyphraseDensityCheck);
  
  // --- Keyphrase in Introduction Check ---
  const keyphraseInIntroCheck: SEOCheck = {
    title: "Keyphrase in Introduction",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Keyphrase in Introduction"]
  };
  
  // Get the first paragraph from the scraped data
  const firstParagraph = scrapedData.paragraphs[0] || '';
  
  // Check if the keyphrase is in the first paragraph
  keyphraseInIntroCheck.passed = firstParagraph.toLowerCase().includes(normalizedKeyphrase);
  
  if (keyphraseInIntroCheck.passed) {
    keyphraseInIntroCheck.description = getSuccessMessage(keyphraseInIntroCheck.title);
  } else {
    keyphraseInIntroCheck.description = `Keyphrase "${keyphrase}" not found in the introduction.`;
    
    // Get AI recommendation if enabled
    if (env.USE_GPT_RECOMMENDATIONS === "true") {
      try {
        keyphraseInIntroCheck.recommendation = await getAIRecommendation(
          keyphraseInIntroCheck.title,
          keyphrase,
          env,
          `First paragraph: "${firstParagraph}"`
        );
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for keyphrase in introduction:", error);
        keyphraseInIntroCheck.recommendation = `Include the keyphrase "${keyphrase}" in the first paragraph of your content to improve SEO.`;
      }
    } else {
      keyphraseInIntroCheck.recommendation = `Include the keyphrase "${keyphrase}" in the first paragraph of your content to improve SEO.`;
    }
  }
  checks.push(keyphraseInIntroCheck);
  
  // --- Image Alt Attributes Check ---
  const imageAltCheck: SEOCheck = {
    title: "Image Alt Attributes",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Image Alt Attributes"]
  };
  
  // Check if all images have alt attributes
  const imagesWithoutAlt = scrapedData.images.filter(img => !img.alt || img.alt.trim().length === 0);
  imageAltCheck.passed = imagesWithoutAlt.length === 0;
  
  if (imageAltCheck.passed) {
    imageAltCheck.description = `All images have alt attributes. ${getSuccessMessage(imageAltCheck.title)}`;
  } else {
    imageAltCheck.description = `Found ${imagesWithoutAlt.length} image(s) without alt attributes.`;
    
    // Get AI recommendation if enabled
    if (env.USE_GPT_RECOMMENDATIONS === "true") {
      try {
        imageAltCheck.recommendation = await getAIRecommendation(
          imageAltCheck.title,
          keyphrase,
          env,
          `${imagesWithoutAlt.length} image(s) found without alt attributes.`
        );
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for image alt attributes:", error);
        imageAltCheck.recommendation = `Add descriptive alt attributes to all images to improve accessibility and SEO.`;
      }
    } else {
      imageAltCheck.recommendation = `Add descriptive alt attributes to all images to improve accessibility and SEO.`;
    }
  }
  checks.push(imageAltCheck);
  
  // --- Internal Links Check ---
  const internalLinksCheck: SEOCheck = {
    title: "Internal Links",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Internal Links"]
  };
  
  // Check if there are internal links
  internalLinksCheck.passed = scrapedData.internalLinks.length > 0;
  
  if (internalLinksCheck.passed) {
    internalLinksCheck.description = `Internal links are present. ${getSuccessMessage(internalLinksCheck.title)}`;
  } else {
    internalLinksCheck.description = `No internal links found on the page.`;
    
    // Get AI recommendation if enabled
    if (env.USE_GPT_RECOMMENDATIONS === "true") {
      try {
        internalLinksCheck.recommendation = await getAIRecommendation(
          internalLinksCheck.title,
          keyphrase,
          env,
          "No internal links found on the page."
        );
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for internal links:", error);
        internalLinksCheck.recommendation = `Add internal links to your content to improve navigation and SEO. Link to other relevant pages or posts on your website.`;
      }
    } else {
      internalLinksCheck.recommendation = `Add internal links to your content to improve navigation and SEO. Link to other relevant pages or posts on your website.`;
    }
  }
  checks.push(internalLinksCheck);
  
  // --- Outbound Links Check ---
  const outboundLinksCheck: SEOCheck = {
    title: "Outbound Links",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Outbound Links"]
  };
  
  // Check if there are outbound links
  outboundLinksCheck.passed = scrapedData.outboundLinks.length > 0;
  
  if (outboundLinksCheck.passed) {
    outboundLinksCheck.description = `Outbound links are present. ${getSuccessMessage(outboundLinksCheck.title)}`;
  } else {
    outboundLinksCheck.description = `No outbound links found on the page.`;
    
    // Get AI recommendation if enabled
    if (env.USE_GPT_RECOMMENDATIONS === "true") {
      try {
        outboundLinksCheck.recommendation = await getAIRecommendation(
          outboundLinksCheck.title,
          keyphrase,
          env,
          "No outbound links found on the page."
        );
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for outbound links:", error);
        outboundLinksCheck.recommendation = `Include outbound links to reputable sources in your content to provide additional value and context to your readers.`;
      }
    } else {
      outboundLinksCheck.recommendation = `Include outbound links to reputable sources in your content to provide additional value and context to your readers.`;
    }
  }
  checks.push(outboundLinksCheck);
  
  // --- Next-Gen Image Formats Check ---
  const nextGenImagesCheck: SEOCheck = {
    title: "Next-Gen Image Formats",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Next-Gen Image Formats"]
  };
  
  // Check if images are in next-gen formats (e.g., WebP)
  const nextGenImageFormats = ['webp', 'avif'];
  const imagesInNextGenFormats = scrapedData.images.filter(img => {
    const ext = img.src.split('.').pop()?.toLowerCase();
    return ext && nextGenImageFormats.includes(ext);
  });
  
  nextGenImagesCheck.passed = imagesInNextGenFormats.length === scrapedData.images.length;
  
  if (nextGenImagesCheck.passed) {
    nextGenImagesCheck.description = `All images are in next-gen formats. ${getSuccessMessage(nextGenImagesCheck.title)}`;
  } else {
    nextGenImagesCheck.description = `Found ${imagesInNextGenFormats.length} image(s) in next-gen formats, out of ${scrapedData.images.length}.`;
    
    // Get AI recommendation if enabled
    if (env.USE_GPT_RECOMMENDATIONS === "true") {
      try {
        nextGenImagesCheck.recommendation = await getAIRecommendation(
          nextGenImagesCheck.title,
          keyphrase,
          env,
          `${imagesInNextGenFormats.length} image(s) found in next-gen formats.`
        );
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for next-gen image formats:", error);
        nextGenImagesCheck.recommendation = `Convert your images to next-gen formats like WebP or AVIF to reduce file size and improve loading speed.`;
      }
    } else {
      nextGenImagesCheck.recommendation = `Convert your images to next-gen formats like WebP or AVIF to reduce file size and improve loading speed.`;
    }
  }
  checks.push(nextGenImagesCheck);
  
  // --- OG Image Check ---
  const ogImageCheck: SEOCheck = {
    title: "OG Image",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["OG Image"]
  };
  
  // Check if OG image is set
  const ogImageMeta = scrapedData.content.match(/<meta property=["']og:image["'] content=["']([^"']+)["']/i);
  const ogImageUrl = ogImageMeta ? ogImageMeta[1] : '';
  
  ogImageCheck.passed = !!ogImageUrl;
  
  if (ogImageCheck.passed) {
    ogImageCheck.description = `Open Graph image is set. ${getSuccessMessage(ogImageCheck.title)}`;
  } else {
    ogImageCheck.description = `No Open Graph image found. Recommended for social media sharing.`;
    
    // Get AI recommendation if enabled
    if (env.USE_GPT_RECOMMENDATIONS === "true") {
      try {
        ogImageCheck.recommendation = await getAIRecommendation(
          ogImageCheck.title,
          keyphrase,
          env,
          "No Open Graph image found on the page."
        );
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for OG image:", error);
        ogImageCheck.recommendation = `Add an Open Graph image to your page to improve how your content is displayed on social media. Recommended size: 1200x630 pixels.`;
      }
    } else {
      ogImageCheck.recommendation = `Add an Open Graph image to your page to improve how your content is displayed on social media. Recommended size: 1200x630 pixels.`;
    }
  }
  checks.push(ogImageCheck);
  
  // --- OG Title and Description Check ---
  const ogTitleDescCheck: SEOCheck = {
    title: "OG Title and Description",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["OG Title and Description"]
  };
  
  // Check if OG title and description are set
  const ogTitleMeta = scrapedData.content.match(/<meta property=["']og:title["'] content=["']([^"']+)["']/i);
  const ogDescriptionMeta = scrapedData.content.match(/<meta property=["']og:description["'] content=["']([^"']+)["']/i);
  const ogTitle = ogTitleMeta ? ogTitleMeta[1] : '';
  const ogDescription = ogDescriptionMeta ? ogDescriptionMeta[1] : '';
  
  ogTitleDescCheck.passed = !!(ogTitle && ogDescription);
  
  if (ogTitleDescCheck.passed) {
    ogTitleDescCheck.description = `Open Graph title and description are set. ${getSuccessMessage(ogTitleDescCheck.title)}`;
  } else {
    ogTitleDescCheck.description = `Open Graph title or description is missing.`;
    
    // Get AI recommendation if enabled
    if (env.USE_GPT_RECOMMENDATIONS === "true") {
      try {
        ogTitleDescCheck.recommendation = await getAIRecommendation(
          ogTitleDescCheck.title,
          keyphrase,
          env,
          "Open Graph title or description is missing."
        );
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for OG title and description:", error);
        ogTitleDescCheck.recommendation = `Add an Open Graph title and description to your page to improve how your content is displayed on social media. Title length: 60 characters max, Description length: 110 characters max.`;
      }
    } else {
      ogTitleDescCheck.recommendation = `Add an Open Graph title and description to your page to improve how your content is displayed on social media. Title length: 60 characters max, Description length: 110 characters max.`;
    }
  }
  checks.push(ogTitleDescCheck);
  
  // --- H1 Check ---
  const h1Check: SEOCheck = {
    title: "Keyphrase in H1 Heading",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Keyphrase in H1 Heading"]
  };
  
  // Extract H1 headings from content
  const h1Headings = scrapedData.headings.filter(heading => heading.level === 1).map(h => h.text);
  const h1Text = h1Headings.length > 0 ? h1Headings[0] : '';

  // Check if any H1 heading contains the keyphrase
  h1Check.passed = h1Headings.some(heading => 
    heading.toLowerCase().includes(normalizedKeyphrase)
  );
  
  if (h1Check.passed) {
    h1Check.description = `Great! Your H1 heading includes the keyphrase "${keyphrase}".`;
  } else {
    h1Check.description = h1Text ? 
      `Keyphrase "${keyphrase}" not found in H1 heading: "${h1Text}"` : 
      `No H1 heading found, or keyphrase "${keyphrase}" is missing from the H1.`;
    
    if (env.USE_GPT_RECOMMENDATIONS === "true" && env.OPENAI_API_KEY) {
      try {
        const context = `Create a complete, ready-to-use H1 heading that includes the keyphrase "${keyphrase}" naturally. Current H1: "${h1Text || 'None'}", Page title: "${pageTitle}"`;
        
        const aiSuggestion = await getAIRecommendation(
          "Keyphrase in H1 Heading",
          keyphrase,
          env,
          context
        );
        
        if (aiSuggestion) {
          // Check if AI suggestion contains the keyphrase
          if (aiSuggestion.toLowerCase().includes(normalizedKeyphrase)) {
            h1Check.recommendation = aiSuggestion;
          } else {
            // AI didn't include the keyphrase, create a fallback that does
            h1Check.recommendation = h1Text ? 
              `${h1Text} - ${keyphrase.charAt(0).toUpperCase() + keyphrase.slice(1)}` : 
              `${keyphrase.charAt(0).toUpperCase() + keyphrase.slice(1)} | ${pageTitle}`;
          }
        }
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for H1 heading:", error);
        h1Check.recommendation = h1Text ? 
          `${h1Text} - ${keyphrase.charAt(0).toUpperCase() + keyphrase.slice(1)}` : 
          `${keyphrase.charAt(0).toUpperCase() + keyphrase.slice(1)} | ${pageTitle}`;
      }
    } else {
      h1Check.recommendation = h1Text ? 
        `${h1Text} - ${keyphrase.charAt(0).toUpperCase() + keyphrase.slice(1)}` : 
        `${keyphrase.charAt(0).toUpperCase() + keyphrase.slice(1)} | ${pageTitle}`;
    }
  }
  checks.push(h1Check);
  
  // --- H2 Check ---
  const h2Check: SEOCheck = {
    title: "Keyphrase in H2 Headings",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Keyphrase in H2 Headings"]
  };
  
  // Check if keyphrase is in any H2 heading
  const h2Headings = scrapedData.headings.filter(h => h.level === 2);
  h2Check.passed = h2Headings.some(h => h.text.toLowerCase().includes(normalizedKeyphrase));
  
  if (h2Check.passed) {
    h2Check.description = getSuccessMessage(h2Check.title);
  } else {
    h2Check.description = `Keyphrase "${keyphrase}" not found in H2 headings.`;
    
    // Get AI recommendation if enabled
    if (env.USE_GPT_RECOMMENDATIONS === "true") {
      try {
        h2Check.recommendation = await getAIRecommendation(
          h2Check.title,
          keyphrase,
          env,
          `H2 headings: "${h2Headings.map(h => h.text).join(', ')}".`
        );
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for H2 headings:", error);
        h2Check.recommendation = `Include the keyphrase "${keyphrase}" in at least one H2 heading to improve SEO.`;
      }
    } else {
      h2Check.recommendation = `Include the keyphrase "${keyphrase}" in at least one H2 heading to improve SEO.`;
    }
  }
  checks.push(h2Check);
  
  // --- Heading Hierarchy Check ---
  const headingHierarchyCheck: SEOCheck = {
    title: "Heading Hierarchy",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Heading Hierarchy"]
  };
  
  // Check the heading hierarchy
  const headingLevels = scrapedData.headings.map(h => h.level);
  const hasProperHierarchy = (
    headingLevels.includes(1) && // H1 should be present
    headingLevels.filter(level => level === 1).length === 1 && // Only one H1
    headingLevels.every((level, index) => index === 0 || level >= headingLevels[index - 1]) // Descending order
  );
  
  headingHierarchyCheck.passed = hasProperHierarchy;
  
  if (headingHierarchyCheck.passed) {
    headingHierarchyCheck.description = `Heading hierarchy is correct. ${getSuccessMessage(headingHierarchyCheck.title)}`;
  } else {
    headingHierarchyCheck.description = `Improper heading hierarchy detected.`;
    
    // Get AI recommendation if enabled
    if (env.USE_GPT_RECOMMENDATIONS === "true") {
      try {
        headingHierarchyCheck.recommendation = await getAIRecommendation(
          headingHierarchyCheck.title,
          keyphrase,
          env,
          "Improper heading hierarchy detected."
        );
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for heading hierarchy:", error);
        headingHierarchyCheck.recommendation = `Ensure proper heading hierarchy: one H1, followed by H2s, H3s, etc. Avoid skipping heading levels.`;
      }
    } else {
      headingHierarchyCheck.recommendation = `Ensure proper heading hierarchy: one H1, followed by H2s, H3s, etc. Avoid skipping heading levels.`;
    }
  }
  checks.push(headingHierarchyCheck);
  
  // --- Code Minification Check ---
  const codeMinificationCheck: SEOCheck = {
    title: "Code Minification",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Code Minification"]
  };
  
  // Check if JS and CSS files are minified
  const jsFiles = scrapedData.resources.js;
  const cssFiles = scrapedData.resources.css;
  
  const areJsFilesMinified = jsFiles.every(file => file.url.split('.').pop()?.toLowerCase() === 'min');
  const areCssFilesMinified = cssFiles.every(file => file.url.split('.').pop()?.toLowerCase() === 'min');
  
  codeMinificationCheck.passed = areJsFilesMinified && areCssFilesMinified;
  
  if (codeMinificationCheck.passed) {
    codeMinificationCheck.description = `JS and CSS files are minified. ${getSuccessMessage(codeMinificationCheck.title)}`;
  } else {
    codeMinificationCheck.description = `JS and/or CSS files are not minified.`;
    
    // Get AI recommendation if enabled
    if (env.USE_GPT_RECOMMENDATIONS === "true") {
      try {
        codeMinificationCheck.recommendation = await getAIRecommendation(
          codeMinificationCheck.title,
          keyphrase,
          env,
          "JS and/or CSS files are not minified."
        );
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for code minification:", error);
        codeMinificationCheck.recommendation = `Minify your JS and CSS files to reduce file size and improve loading speed. Use tools like Terser for JS and CSSNano for CSS.`;
      }
    } else {
      codeMinificationCheck.recommendation = `Minify your JS and CSS files to reduce file size and improve loading speed. Use tools like Terser for JS and CSSNano for CSS.`;
    }
  }
  checks.push(codeMinificationCheck);
  
  // --- Schema Markup Check ---
  const schemaCheck: SEOCheck = {
    title: "Schema Markup",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Schema Markup"]
  };
  
  // Check if schema markup is present
  schemaCheck.passed = scrapedData.schemaMarkup.hasSchema;
  
  if (schemaCheck.passed) {
    const schemaTypes = scrapedData.schemaMarkup.schemaTypes.join(", ");
    schemaCheck.description = `Schema markup is present (types: ${schemaTypes}). ${getSuccessMessage(schemaCheck.title)}`;
  } else {
    schemaCheck.description = `No schema markup found.`;
    
    // Get AI recommendation if enabled
    if (env.USE_GPT_RECOMMENDATIONS === "true") {
      try {
        schemaCheck.recommendation = await getAIRecommendation(
          schemaCheck.title,
          keyphrase,
          env,
          "No schema markup found on the page."
        );
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for schema markup:", error);
        schemaCheck.recommendation = `Add schema markup to your page to help search engines understand your content better and potentially display rich results in search listings. Consider using JSON-LD format for better compatibility.`;
      }
    } else {
      schemaCheck.recommendation = `Add schema markup to your page to help search engines understand your content better and potentially display rich results in search listings. Consider using JSON-LD format for better compatibility.`;
    }
  }
  checks.push(schemaCheck);
  
  // --- Image File Size Check ---
  const imageSizeCheck: SEOCheck = {
    title: "Image File Size",
    description: "",
    passed: true,
    priority: analyzerCheckPriorities["Image File Size"]
  };
  
  // Check image file sizes
  const MAX_IMAGE_SIZE_KB = 300; // 300KB max recommended size
  const largeImages: Array<{
    url: string;
    name: string;
    shortName: string;
    size: number;
    mimeType?: string;
  }> = [];
  let totalImages = 0;
  
  // Use page assets if available, otherwise fall back to scraped data
  if (pageAssets && pageAssets.length > 0) {
    totalImages = pageAssets.filter(asset => asset.type === "image").length;
    
    pageAssets.forEach(asset => {
      if (asset.type === "image" && asset.size && asset.size / 1024 > MAX_IMAGE_SIZE_KB) {
        const filename = asset.url.split('/').pop() || 'unknown';
        largeImages.push({
          url: asset.url,
          name: filename,
          shortName: shortenFileName(filename, 10),
          size: Math.round(asset.size / 1024), // KB
          mimeType: asset.mimeType || 'Unknown'
        });
      }
    });
  } else {
    totalImages = scrapedData.images.length;
    
    scrapedData.images.forEach(img => {
      if (img.size && img.size / 1024 > MAX_IMAGE_SIZE_KB) {
        const filename = img.src.split('/').pop() || 'unknown';
        largeImages.push({
          url: img.src,
          name: filename,
          shortName: shortenFileName(filename, 10),
          size: Math.round(img.size / 1024), // KB
          mimeType: 'Unknown'
        });
      }
    });
  }
  
  imageSizeCheck.passed = largeImages.length === 0;
  
  if (imageSizeCheck.passed) {
    imageSizeCheck.description = getSuccessMessage(imageSizeCheck.title);
  } else {
    imageSizeCheck.description = `${largeImages.length} out of ${totalImages} images exceed the recommended size of ${MAX_IMAGE_SIZE_KB}KB. Large images slow down page loading.`;
    
    // Generate AI recommendation or fallback
    if (env.USE_GPT_RECOMMENDATIONS === "true") {
      try {
        const context = `Found ${largeImages.length} large images out of ${totalImages} total. 
          Large images: ${largeImages.map(img => `${img.shortName} (${img.size}KB, ${img.mimeType || 'unknown'})`).join(', ')}.`;
        imageSizeCheck.recommendation = await getAIRecommendation(
          imageSizeCheck.title,
          "image optimization",
          env,
          context
        );
      } catch (error) {
        console.error("[SEO Analyzer] Error generating AI recommendation for image size:", error);
        imageSizeCheck.recommendation = `Compress these ${largeImages.length} large images to improve page load times.`;
      }
    } else {
      imageSizeCheck.recommendation = `Compress these ${largeImages.length} large images to improve page load times.`;
    }
    
    // Add structured data for client rendering
    imageSizeCheck.imageData = largeImages;
  }
  checks.push(imageSizeCheck);
  
  // --- Final Checks Summary ---
  const passedChecks = checks.filter(check => check.passed);
  const failedChecks = checks.filter(check => !check.passed);
  
  // Calculate overall SEO score (simple formula: % of passed checks)
  const seoScore = (passedChecks.length / checks.length) * 100;
  
  // Prepare the final result
  const result: SEOAnalysisResult = {
    keyphrase,
    url,
    isHomePage,
    score: seoScore,
    totalChecks: checks.length,
    passedChecks: passedChecks.length,
    failedChecks: failedChecks.length,
    checks
  };
  
  return result;
}

// --- Hono server and routes setup ---
const app = new Hono();

// Global middleware
app.use('*', async (c, next) => {
  // Handle CORS
  const corsHeaders = handleCors(c.req);
  if (corsHeaders instanceof Response) {
    return corsHeaders; // Preflight response
  }
  
  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    c.res.headers.set(key, value);
  });
  
  // Continue to the next middleware/route
  await next();
});

// Health check route
app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

// SEO analysis route
app.post('/analyze-seo', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate request body
    if (!validateAnalyzeRequest(body)) {
      return c.json({ error: 'Invalid request body' }, 400);
    }
    
    const { keyphrase, url, isHomePage = false, webflowPageData, pageAssets } = body;
    
    // Scrape the web page - add type assertion for env
    const scrapedData = await scrapeWebPage(url, c.env as Env, keyphrase);
    
    // Perform SEO analysis - isHomePage now has a default value
    const analysisResult = await analyzeSEOElements(
      scrapedData, 
      keyphrase, 
      url, 
      isHomePage, 
      c.env as Env, 
      webflowPageData, 
      pageAssets
    );
    
    return c.json(analysisResult);
  } catch (error) {
    console.error('[SEO Analyzer] Error in /analyze-seo route:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// --- Add compatibility endpoint for the client ---
app.post('/api/analyze', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate request body
    if (!validateAnalyzeRequest(body)) {
      return c.json({ error: 'Invalid request body' }, 400);
    }
    
    const { keyphrase, url, isHomePage = false, webflowPageData, pageAssets } = body;
    
    // Reuse the existing functionality
    const scrapedData = await scrapeWebPage(url, c.env as Env, keyphrase);
    
    const analysisResult = await analyzeSEOElements(
      scrapedData, 
      keyphrase, 
      url, 
      isHomePage, 
      c.env as Env, 
      webflowPageData, 
      pageAssets
    );
    
    return c.json(analysisResult);
  } catch (error) {
    console.error('[SEO Analyzer] Error in /api/analyze route:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default app;
