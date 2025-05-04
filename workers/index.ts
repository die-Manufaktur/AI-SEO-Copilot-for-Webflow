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
          temperature: 0.7,
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

/**
 * Scrapes a web page for SEO-relevant content
 * @param url URL to scrape
 * @returns Structured page data
 */
async function scrapeWebPage(url: string): Promise<ScrapedPageData> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SEO-Analyzer/1.0',
        'Accept': 'text/html',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    
    // Extract title
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Extract meta description
    const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
    const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : '';

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
    
    // Look for JSON-LD script tags
    const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gi);
    for (const match of jsonLdMatches) {
      try {
        const jsonContent = match[1].trim();
        const schemaData = JSON.parse(jsonContent);
        
        schemaMarkup.hasSchema = true;
        schemaMarkup.schemaCount++;
        
        // Extract @type field from schema
        const type = schemaData['@type'];
        if (type) {
          if (Array.isArray(type)) {
            schemaMarkup.schemaTypes.push(...type);
          } else {
            schemaMarkup.schemaTypes.push(type);
          }
        }
      } catch (error) {
        console.error('[SEO Analyzer] Error parsing schema markup:', error);
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
      resources,
      schemaMarkup
    };
  } catch (error) {
    console.error('[SEO Analyzer] Error scraping web page:', error);
    throw new Error(`Failed to analyze page: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Handles CORS preflight requests and required headers
 * @param request Incoming request
 * @returns CORS headers or preflight response
 */
function handleCors(request: Request): Response | Record<string, string> {
  const origin = request.headers.get('Origin');
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
  env: any,
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
    titleCheck.description = `Found keyphrase "${keyphrase}" in title: "${pageTitle}". ${getSuccessMessage(titleCheck.title)}`;
  } else {
    titleCheck.description = `Keyphrase "${keyphrase}" not found in title: "${pageTitle}"`;
    
    // Get AI recommendation if enabled
    if (env.USE_GPT_RECOMMENDATIONS === "true") {
      try {
        titleCheck.recommendation = await getAIRecommendation(
          titleCheck.title,
          keyphrase,
          env,
          `Current title: "${pageTitle}"`
        );
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for title:", error);
        titleCheck.recommendation = `Consider including your keyphrase "${keyphrase}" in the page title for better SEO. Current title: "${pageTitle}"`;
      }
    } else {
      titleCheck.recommendation = `Consider including your keyphrase "${keyphrase}" in the page title for better SEO. Current title: "${pageTitle}"`;
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
  const metaDescription = useApiData && webflowPageData?.metaDescription
    ? webflowPageData.metaDescription
    : scrapedData.metaDescription;
  
  // Check if meta description contains the keyphrase
  metaDescriptionCheck.passed = metaDescription.toLowerCase().includes(normalizedKeyphrase);
  
  if (metaDescriptionCheck.passed) {
    metaDescriptionCheck.description = `Found keyphrase "${keyphrase}" in meta description. ${getSuccessMessage(metaDescriptionCheck.title)}`;
  } else {
    metaDescriptionCheck.description = `Keyphrase "${keyphrase}" not found in meta description: "${metaDescription}"`;
    
    // Get AI recommendation if enabled
    if (env.USE_GPT_RECOMMENDATIONS === "true") {
      try {
        metaDescriptionCheck.recommendation = await getAIRecommendation(
          metaDescriptionCheck.title,
          keyphrase,
          env,
          `Current meta description: "${metaDescription}"`
        );
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for meta description:", error);
        metaDescriptionCheck.recommendation = `Include your keyphrase "${keyphrase}" in the meta description to improve click-through rates from search results.`;
      }
    } else {
      metaDescriptionCheck.recommendation = `Include your keyphrase "${keyphrase}" in the meta description to improve click-through rates from search results.`;
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
  
  // Skip for homepage if desired
  if (isHomePage) {
    urlCheck.passed = true;
    urlCheck.description = "This is the homepage URL, so the keyphrase is not required in the URL";
  } else {
    // Check if URL contains the keyphrase
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const pathSegments = path.split('/').filter(segment => segment.length > 0);
    const lastSegment = pathSegments[pathSegments.length - 1] || '';
    
    urlCheck.passed = lastSegment.toLowerCase().includes(normalizedKeyphrase);
    
    if (urlCheck.passed) {
      urlCheck.description = `Found keyphrase "${keyphrase}" in URL: ${url}. ${getSuccessMessage(urlCheck.title)}`;
    } else {
      urlCheck.description = `Keyphrase "${keyphrase}" not found in URL: ${url}`;
      
      // Get AI recommendation if enabled
      if (env.USE_GPT_RECOMMENDATIONS === "true") {
        try {
          urlCheck.recommendation = await getAIRecommendation(
            urlCheck.title,
            keyphrase,
            env,
            `Current URL: ${url}`
          );
        } catch (error) {
          console.error("[SEO Analyzer] Error getting AI recommendation for URL:", error);
          urlCheck.recommendation = `Consider including your keyphrase "${keyphrase}" in the URL for better SEO. Current URL: ${url}`;
        }
      } else {
        urlCheck.recommendation = `Consider including your keyphrase "${keyphrase}" in the URL for better SEO. Use hyphens to separate words.`;
      }
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
  
  // Get content from scraped data
  const contentWordCount = scrapedData.content.split(/\s+/).filter(word => word.length > 0).length;
  const MIN_WORD_COUNT = 300;
  const RECOMMENDED_WORD_COUNT = 500;
  
  contentLengthCheck.passed = contentWordCount >= MIN_WORD_COUNT;
  
  if (contentLengthCheck.passed) {
    if (contentWordCount >= RECOMMENDED_WORD_COUNT) {
      contentLengthCheck.description = `Content length is ${contentWordCount} words, which is good. ${getSuccessMessage(contentLengthCheck.title)}`;
    } else {
      contentLengthCheck.description = `Content length is ${contentWordCount} words, which meets the minimum but could be improved.`;
    }
  } else {
    contentLengthCheck.description = `Content length is ${contentWordCount} words, which is below the recommended minimum of ${MIN_WORD_COUNT} words.`;
    
    // Get AI recommendation if enabled
    if (env.USE_GPT_RECOMMENDATIONS === "true") {
      try {
        contentLengthCheck.recommendation = await getAIRecommendation(
          contentLengthCheck.title,
          keyphrase,
          env,
          `Current content length: ${contentWordCount} words. Minimum recommended: ${MIN_WORD_COUNT} words.`
        );
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for content length:", error);
        contentLengthCheck.recommendation = `Aim for at least ${MIN_WORD_COUNT} words of high-quality content focused on your topic. Longer content typically performs better in search engines.`;
      }
    } else {
      contentLengthCheck.recommendation = `Aim for at least ${MIN_WORD_COUNT} words of high-quality content focused on your topic. Longer content typically performs better in search engines.`;
    }
  }
  checks.push(contentLengthCheck);
  
  // --- Keyphrase Density Check ---
  const densityCheck: SEOCheck = {
    title: "Keyphrase Density",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Keyphrase Density"]
  };
  
  // Calculate keyphrase density
  const keyphraseWords = normalizedKeyphrase.split(/\s+/).filter(word => word.length > 0);
  const contentWords = scrapedData.content.toLowerCase().split(/\s+/).filter(word => word.length > 0);
  let keyphraseCount = 0;
  
  // For multi-word keyphrases, check for the entire phrase
  if (keyphraseWords.length > 1) {
    const contentText = scrapedData.content.toLowerCase();
    let startIndex = 0;
    let count = 0;
    
    while (startIndex < contentText.length) {
      const index = contentText.indexOf(normalizedKeyphrase, startIndex);
      if (index === -1) break;
      count++;
      startIndex = index + normalizedKeyphrase.length;
    }
    
    keyphraseCount = count;
  } else {
    // For single-word keyphrase, count occurrences
    keyphraseCount = contentWords.filter(word => word === normalizedKeyphrase).length;
  }
  
  // Calculate density as percentage
  const density = contentWordCount > 0 ? (keyphraseCount / contentWordCount) * 100 : 0;
  const MIN_DENSITY = 0.5;
  const MAX_DENSITY = 2.5;
  
  densityCheck.passed = density >= MIN_DENSITY && density <= MAX_DENSITY;
  
  if (densityCheck.passed) {
    densityCheck.description = `Keyphrase density is ${density.toFixed(2)}%, which is optimal. ${getSuccessMessage(densityCheck.title)}`;
  } else if (density < MIN_DENSITY) {
    densityCheck.description = `Keyphrase density is ${density.toFixed(2)}%, which is below the recommended minimum of ${MIN_DENSITY}%.`;
    
    // Get AI recommendation if enabled
    if (env.USE_GPT_RECOMMENDATIONS === "true") {
      try {
        densityCheck.recommendation = await getAIRecommendation(
          densityCheck.title,
          keyphrase,
          env,
          `Current keyphrase density: ${density.toFixed(2)}%. Recommended range: ${MIN_DENSITY}%-${MAX_DENSITY}%. The keyphrase appears ${keyphraseCount} times in ${contentWordCount} words.`
        );
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for keyphrase density:", error);
        densityCheck.recommendation = `Increase the use of your keyphrase "${keyphrase}" throughout your content to reach the optimal density of ${MIN_DENSITY}%-${MAX_DENSITY}%.`;
      }
    } else {
      densityCheck.recommendation = `Increase the use of your keyphrase "${keyphrase}" throughout your content to reach the optimal density of ${MIN_DENSITY}%-${MAX_DENSITY}%.`;
    }
  } else {
    densityCheck.description = `Keyphrase density is ${density.toFixed(2)}%, which is above the recommended maximum of ${MAX_DENSITY}%.`;
    
    // Get AI recommendation if enabled
    if (env.USE_GPT_RECOMMENDATIONS === "true") {
      try {
        densityCheck.recommendation = await getAIRecommendation(
          densityCheck.title,
          keyphrase,
          env,
          `Current keyphrase density: ${density.toFixed(2)}%. Recommended maximum: ${MAX_DENSITY}%. The keyphrase appears ${keyphraseCount} times in ${contentWordCount} words.`
        );
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for keyphrase density:", error);
        densityCheck.recommendation = `Reduce the use of your keyphrase "${keyphrase}" in your content to avoid keyword stuffing. Aim for a density between ${MIN_DENSITY}% and ${MAX_DENSITY}%.`;
      }
    } else {
      densityCheck.recommendation = `Reduce the use of your keyphrase "${keyphrase}" in your content to avoid keyword stuffing. Aim for a density between ${MIN_DENSITY}% and ${MAX_DENSITY}%.`;
    }
  }
  checks.push(densityCheck);
  
  // --- Keyphrase in Introduction Check ---
  const introCheck: SEOCheck = {
    title: "Keyphrase in Introduction",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Keyphrase in Introduction"]
  };
  
  // Get first paragraph as introduction
  const firstParagraph = scrapedData.paragraphs[0] || '';
  
  introCheck.passed = firstParagraph.toLowerCase().includes(normalizedKeyphrase);
  
  if (introCheck.passed) {
    introCheck.description = `Found keyphrase "${keyphrase}" in the introduction paragraph. ${getSuccessMessage(introCheck.title)}`;
  } else {
    introCheck.description = `Keyphrase "${keyphrase}" not found in the introduction paragraph.`;
    
    // Get AI recommendation if enabled
    if (env.USE_GPT_RECOMMENDATIONS === "true") {
      try {
        introCheck.recommendation = await getAIRecommendation(
          introCheck.title,
          keyphrase,
          env,
          `Current introduction: "${firstParagraph}"`
        );
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for introduction:", error);
        introCheck.recommendation = `Include your keyphrase "${keyphrase}" in the first paragraph of your content to signal relevance to search engines.`;
      }
    } else {
      introCheck.recommendation = `Include your keyphrase "${keyphrase}" in the first paragraph of your content to signal relevance to search engines.`;
    }
  }
  checks.push(introCheck);
  
  // --- Image Alt Attributes Check ---
  const imageAltCheck: SEOCheck = {
    title: "Image Alt Attributes",
    description: "",
    passed: true,
    priority: analyzerCheckPriorities["Image Alt Attributes"]
  };

  // Filter images that are missing alt text
  const imagesWithoutAlt = scrapedData.images.filter(img => !img.alt);
  imageAltCheck.passed = imagesWithoutAlt.length === 0;

  if (imagesWithoutAlt.length > 0) {
    imageAltCheck.description = `${imagesWithoutAlt.length} images are missing alt text attributes. Alt text is important for accessibility and SEO.`;
    
    // Use OpenAI recommendation if available
    if (env.USE_GPT_RECOMMENDATIONS === "true") {
      try {
        const context = `Found ${imagesWithoutAlt.length} images missing alt text out of ${scrapedData.images.length} total.`;
        imageAltCheck.recommendation = await getAIRecommendation(
          imageAltCheck.title,
          keyphrase,
          env,
          context
        );
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for alt text:", error);
        // Fallback recommendation
        imageAltCheck.recommendation = `Add descriptive alt text to all images, focusing on context and including the keyphrase where natural.`;
      }
    } else {
      imageAltCheck.recommendation = `Add descriptive alt text to all images, focusing on context and including the keyphrase where natural.`;
    }
    
    // Add structured imageData
    imageAltCheck.imageData = imagesWithoutAlt.map(img => {
      const filename = img.src.split('/').pop() || 'unknown';
      return {
        url: img.src,
        name: filename,
        shortName: shortenFileName(filename, 10),
        size: Math.round((img.size || 0) / 1024), // Convert to KB
        mimeType: 'Missing alt text'
      };
    });
  } else {
    imageAltCheck.description = `All ${scrapedData.images.length} images have alt text. ${getSuccessMessage(imageAltCheck.title)}`;
  }
  checks.push(imageAltCheck);
  
  // --- Internal Links Check ---
  const internalLinksCheck: SEOCheck = {
    title: "Internal Links",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Internal Links"]
  };
  
  // Check for internal links
  const internalLinksCount = scrapedData.internalLinks.length;
  const MIN_INTERNAL_LINKS = 2;
  
  internalLinksCheck.passed = internalLinksCount >= MIN_INTERNAL_LINKS;
  
  if (internalLinksCheck.passed) {
    internalLinksCheck.description = `Found ${internalLinksCount} internal links on the page. ${getSuccessMessage(internalLinksCheck.title)}`;
  } else {
    internalLinksCheck.description = `Found only ${internalLinksCount} internal links on the page. Recommended minimum is ${MIN_INTERNAL_LINKS}.`;
    
    // Get AI recommendation if enabled
    if (env.USE_GPT_RECOMMENDATIONS === "true") {
      try {
        internalLinksCheck.recommendation = await getAIRecommendation(
          internalLinksCheck.title,
          keyphrase,
          env,
          `Current internal links: ${internalLinksCount}. Recommended minimum: ${MIN_INTERNAL_LINKS}.`
        );
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for internal links:", error);
        internalLinksCheck.recommendation = `Add more internal links to improve site navigation and distribute link equity throughout your site. Aim for at least ${MIN_INTERNAL_LINKS} internal links.`;
      }
    } else {
      internalLinksCheck.recommendation = `Add more internal links to improve site navigation and distribute link equity throughout your site. Aim for at least ${MIN_INTERNAL_LINKS} internal links.`;
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
  
  // Check for outbound links
  const outboundLinksCount = scrapedData.outboundLinks.length;
  const MIN_OUTBOUND_LINKS = 1;
  
  outboundLinksCheck.passed = outboundLinksCount >= MIN_OUTBOUND_LINKS;
  
  if (outboundLinksCheck.passed) {
    outboundLinksCheck.description = `Found ${outboundLinksCount} outbound links on the page. ${getSuccessMessage(outboundLinksCheck.title)}`;
  } else {
    outboundLinksCheck.description = `Found ${outboundLinksCount} outbound links on the page. Recommended minimum is ${MIN_OUTBOUND_LINKS}.`;
    
    // Get AI recommendation if enabled
    if (env.USE_GPT_RECOMMENDATIONS === "true") {
      try {
        outboundLinksCheck.recommendation = await getAIRecommendation(
          outboundLinksCheck.title,
          keyphrase,
          env,
          `Current outbound links: ${outboundLinksCount}. Recommended minimum: ${MIN_OUTBOUND_LINKS}.`
        );
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for outbound links:", error);
        outboundLinksCheck.recommendation = `Include at least ${MIN_OUTBOUND_LINKS} relevant outbound links to authoritative sources to enhance your content's credibility and provide additional value to readers.`;
      }
    } else {
      outboundLinksCheck.recommendation = `Include at least ${MIN_OUTBOUND_LINKS} relevant outbound links to authoritative sources to enhance your content's credibility and provide additional value to readers.`;
    }
  }
  checks.push(outboundLinksCheck);
  
  // --- Next-Gen Image Formats Check ---
  const imageFormatCheck: SEOCheck = {
    title: "Next-Gen Image Formats",
    description: "Checks if images use modern formats like WebP, AVIF, or SVG. (Basic check, manual verification recommended)",
    passed: true,
    priority: analyzerCheckPriorities["Next-Gen Image Formats"]
  };

  const nonNextGenImages = scrapedData.images.filter(img =>
    !img.src.toLowerCase().endsWith('.webp') &&
    !img.src.toLowerCase().endsWith('.avif') &&
    !img.src.toLowerCase().endsWith('.svg') &&
    !img.src.toLowerCase().includes('data:image/')
  );

  if (nonNextGenImages.length > 0) {
    imageFormatCheck.passed = false;
    imageFormatCheck.description = `${nonNextGenImages.length} images are not using modern formats like WebP, AVIF, or SVG.`;
    
    // Get AI recommendation or use fallback
    if (env.USE_GPT_RECOMMENDATIONS === "true") {
      try {
        const context = `Found ${nonNextGenImages.length} images not using next-gen formats (WebP, AVIF, or SVG) out of ${scrapedData.images.length} total.`;
        imageFormatCheck.recommendation = await getAIRecommendation(
          imageFormatCheck.title,
          keyphrase,
          env,
          context
        );
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for image formats:", error);
        imageFormatCheck.recommendation = `Convert images to modern formats like WebP, AVIF, or SVG to improve loading speed and SEO performance.`;
      }
    } else {
      imageFormatCheck.recommendation = `Convert images to modern formats like WebP, AVIF, or SVG to improve loading speed and SEO performance.`;
    }
    
    // Add structured imageData
    imageFormatCheck.imageData = nonNextGenImages.map(img => {
      const filename = img.src.split('/').pop() || 'unknown';
      const ext = filename.split('.').pop()?.toUpperCase() || 'Unknown format';
      return {
        url: img.src,
        name: filename,
        shortName: shortenFileName(filename, 10),
        size: Math.round((img.size || 0) / 1024), // Convert to KB
        mimeType: ext
      };
    });
  } else if (scrapedData.images.length > 0) {
    imageFormatCheck.description = getSuccessMessage(imageFormatCheck.title);
  } else {
    imageFormatCheck.description = "No images found to check format.";
  }
  checks.push(imageFormatCheck);
  
  // --- OG Image Check ---
  const ogImageCheck: SEOCheck = {
    title: "OG Image",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["OG Image"]
  };
  
  // Determine OG image from API data if available
  let ogImageToCheck: string | null = null;
  
  if (useApiData && webflowPageData?.ogImage) {
    ogImageToCheck = webflowPageData.ogImage;
  } else {
    // Look for OG meta tags in scraped HTML
    const metaTags = scrapedData.content.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']*)["'][^>]*>/i);
    if (metaTags && metaTags[1]) {
      ogImageToCheck = metaTags[1];
    }
  }

  // Use the finally determined ogImageToCheck
  ogImageCheck.passed = !!ogImageToCheck;
  ogImageCheck.description = ogImageCheck.passed
    ? `Open Graph image is set: ${ogImageToCheck}. ${getSuccessMessage(ogImageCheck.title)}`
    : "Open Graph image is not set. This image is shown when the page is shared on social media.";

  if (!ogImageCheck.passed) {
    // Get AI recommendation or use fallback
    if (env.USE_GPT_RECOMMENDATIONS === "true") {
      try {
        ogImageCheck.recommendation = await getAIRecommendation(
          ogImageCheck.title,
          keyphrase,
          env,
          "No Open Graph image found."
        );
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for OG image:", error);
        ogImageCheck.recommendation = `Add an Open Graph image to improve visibility when your page is shared on social media.`;
      }
    } else {
      ogImageCheck.recommendation = `Add an Open Graph image to improve visibility when your page is shared on social media.`;
    }
    
    // If there are other images on the page, suggest one as OG image
    if (scrapedData.images.length > 0) {
      const potentialOgImages = scrapedData.images
        .filter(img => img.alt && img.alt.length > 0 && !img.src.includes('icon') && !img.src.includes('logo'))
        .slice(0, 3);
      
      if (potentialOgImages.length > 0) {
        ogImageCheck.imageData = potentialOgImages.map(img => {
          const filename = img.src.split('/').pop() || 'unknown';
          return {
            url: img.src,
            name: filename,
            shortName: shortenFileName(filename, 10),
            size: Math.round((img.size || 0) / 1024), // Convert to KB
            mimeType: 'Suggested OG image'
          };
        });
      }
    }
  }
  checks.push(ogImageCheck);
  
  // --- OG Title and Description Check ---
  const ogMetaCheck: SEOCheck = {
    title: "OG Title and Description",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["OG Title and Description"]
  };
  
  // Determine OG title and description from API data if available
  let hasOgTitle = false;
  let hasOgDescription = false;
  let customOgTitle = "";
  let customOgDescription = "";
  
  if (useApiData) {
    hasOgTitle = !!webflowPageData?.ogTitle;
    hasOgDescription = !!webflowPageData?.ogDescription;
    customOgTitle = (!webflowPageData?.usesTitleAsOGTitle || false).toString();
    customOgDescription = (!webflowPageData?.usesDescriptionAsOGDescription || false).toString();
  } else {
    // Look for OG meta tags in scraped HTML
    const titleTags = scrapedData.content.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']*)["'][^>]*>/i);
    const descTags = scrapedData.content.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']*)["'][^>]*>/i);
    
    hasOgTitle = !!titleTags;
    hasOgDescription = !!descTags;
    
    if (titleTags) {
      customOgTitle = (titleTags[1] !== scrapedData.title).toString();
    }
    
    if (descTags) {
      customOgDescription = (descTags[1] !== scrapedData.metaDescription).toString();
    }
  }
  
  ogMetaCheck.passed = hasOgTitle && hasOgDescription;
  
  if (ogMetaCheck.passed) {
    if (customOgTitle || customOgDescription) {
      ogMetaCheck.description = `Open Graph title and description are set with custom values. ${getSuccessMessage(ogMetaCheck.title)}`;
    } else {
      ogMetaCheck.description = `Open Graph title and description are set (using default page values). ${getSuccessMessage(ogMetaCheck.title)}`;
    }
  } else {
    if (!hasOgTitle && !hasOgDescription) {
      ogMetaCheck.description = "Open Graph title and description are not set.";
    } else if (!hasOgTitle) {
      ogMetaCheck.description = "Open Graph title is not set.";
    } else {
      ogMetaCheck.description = "Open Graph description is not set.";
    }
    
    // Get AI recommendation if enabled
    if (env.USE_GPT_RECOMMENDATIONS === "true") {
      try {
        ogMetaCheck.recommendation = await getAIRecommendation(
          ogMetaCheck.title,
          keyphrase,
          env,
          `Current status: OG Title set: ${hasOgTitle}, OG Description set: ${hasOgDescription}.`
        );
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for OG meta tags:", error);
        ogMetaCheck.recommendation = `Set Open Graph title and description to optimize how your content appears when shared on social media. Consider customizing them to be more engaging than your standard title and meta description.`;
      }
    } else {
      ogMetaCheck.recommendation = `Set Open Graph title and description to optimize how your content appears when shared on social media. Consider customizing them to be more engaging than your standard title and meta description.`;
    }
  }
  checks.push(ogMetaCheck);
  
  // --- Keyphrase in H1 Heading Check ---
  const h1Check: SEOCheck = {
    title: "Keyphrase in H1 Heading",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Keyphrase in H1 Heading"]
  };
  
  // Find H1 headings
  const h1Headings = scrapedData.headings.filter(h => h.level === 1);
  
  // Check if any H1 contains the keyphrase
  const h1WithKeyphrase = h1Headings.find(h => h.text.toLowerCase().includes(normalizedKeyphrase));
  h1Check.passed = !!h1WithKeyphrase;
  
  if (h1Check.passed) {
    h1Check.description = `Found keyphrase "${keyphrase}" in H1 heading: "${h1WithKeyphrase?.text}". ${getSuccessMessage(h1Check.title)}`;
  } else if (h1Headings.length === 0) {
    h1Check.description = "No H1 heading found on the page. Each page should have exactly one H1 heading.";
    
    // Get AI recommendation if enabled
    if (env.USE_GPT_RECOMMENDATIONS === "true") {
      try {
        h1Check.recommendation = await getAIRecommendation(
          h1Check.title,
          keyphrase,
          env,
          "No H1 heading found on the page."
        );
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for H1 heading:", error);
        h1Check.recommendation = `Add an H1 heading to your page that includes your target keyphrase "${keyphrase}". The H1 heading is one of the strongest signals to search engines about your page's topic.`;
      }
    } else {
      h1Check.recommendation = `Add an H1 heading to your page that includes your target keyphrase "${keyphrase}". The H1 heading is one of the strongest signals to search engines about your page's topic.`;
    }
  } else {
    h1Check.description = `Keyphrase "${keyphrase}" not found in H1 heading: "${h1Headings[0]?.text}"`;
    
    // Get AI recommendation if enabled
    if (env.USE_GPT_RECOMMENDATIONS === "true") {
      try {
        h1Check.recommendation = await getAIRecommendation(
          h1Check.title,
          keyphrase,
          env,
          `Current H1 heading: "${h1Headings[0]?.text}"`
        );
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for H1 heading:", error);
        h1Check.recommendation = `Include your target keyphrase "${keyphrase}" in your H1 heading to clearly signal your page's topic to search engines.`;
      }
    } else {
      h1Check.recommendation = `Include your target keyphrase "${keyphrase}" in your H1 heading to clearly signal your page's topic to search engines.`;
    }
  }
  checks.push(h1Check);
  
  // --- Keyphrase in H2 Headings Check ---
  const h2Check: SEOCheck = {
    title: "Keyphrase in H2 Headings",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Keyphrase in H2 Headings"]
  };
  
  // Find H2 headings
  const h2Headings = scrapedData.headings.filter(h => h.level === 2);
  
  // Check if any H2 contains the keyphrase
  const h2WithKeyphrase = h2Headings.find(h => h.text.toLowerCase().includes(normalizedKeyphrase));
  h2Check.passed = !!h2WithKeyphrase;
  
  if (h2Check.passed) {
    h2Check.description = `Found keyphrase "${keyphrase}" in at least one H2 heading. ${getSuccessMessage(h2Check.title)}`;
  } else if (h2Headings.length === 0) {
    h2Check.description = "No H2 headings found on the page. Consider adding H2 headings to structure your content.";
    
    // Get AI recommendation if enabled
    if (env.USE_GPT_RECOMMENDATIONS === "true") {
      try {
        h2Check.recommendation = await getAIRecommendation(
          h2Check.title,
          keyphrase,
          env,
          "No H2 headings found on the page."
        );
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for H2 headings:", error);
        h2Check.recommendation = `Add H2 headings to structure your content, and include your keyphrase "${keyphrase}" in at least one of them to reinforce the topic of your page.`;
      }
    } else {
      h2Check.recommendation = `Add H2 headings to structure your content, and include your keyphrase "${keyphrase}" in at least one of them to reinforce the topic of your page.`;
    }
  } else {
    h2Check.description = `Found ${h2Headings.length} H2 headings, but none contain the keyphrase "${keyphrase}".`;
    
    // Get AI recommendation if enabled
    if (env.USE_GPT_RECOMMENDATIONS === "true") {
      try {
        h2Check.recommendation = await getAIRecommendation(
          h2Check.title,
          keyphrase,
          env,
          `Current H2 headings: ${h2Headings.map(h => `"${h.text}"`).join(', ')}`
        );
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for H2 headings:", error);
        h2Check.recommendation = `Include your keyphrase "${keyphrase}" in at least one of your H2 headings to reinforce the topic of your page and improve structure.`;
      }
    } else {
      h2Check.recommendation = `Include your keyphrase "${keyphrase}" in at least one of your H2 headings to reinforce the topic of your page and improve structure.`;
    }
  }
  checks.push(h2Check);
  
  // --- Heading Hierarchy Check ---
  const headingCheck: SEOCheck = {
    title: "Heading Hierarchy",
    description: "",
    passed: true,
    priority: analyzerCheckPriorities["Heading Hierarchy"]
  };
  
  // Check heading hierarchy
  const h1Count = h1Headings.length;
  const hasProperHierarchy = h1Count === 1;
  const skippedLevels = [];
  
  // Check for skipped heading levels
  const headingLevels = new Set(scrapedData.headings.map(h => h.level));
  for (let level = 1; level < 6; level++) {
    if (!headingLevels.has(level) && [...headingLevels].some(l => l > level)) {
      skippedLevels.push(level);
    }
  }
  
  headingCheck.passed = hasProperHierarchy && skippedLevels.length === 0;
  
  if (headingCheck.passed) {
    headingCheck.description = `Proper heading hierarchy with one H1 and no skipped levels. ${getSuccessMessage(headingCheck.title)}`;
  } else {
    let issues = [];
    
    if (h1Count === 0) {
      issues.push("No H1 heading found");
    } else if (h1Count > 1) {
      issues.push(`Found ${h1Count} H1 headings (recommended: 1)`);
    }
    
    if (skippedLevels.length > 0) {
      issues.push(`Skipped heading levels: ${skippedLevels.join(', ')}`);
    }
    
    headingCheck.description = `Heading hierarchy issues: ${issues.join('; ')}.`;
    
    // Get AI recommendation if enabled
    if (env.USE_GPT_RECOMMENDATIONS === "true") {
      try {
        const headingStats = {
          h1: h1Headings.length,
          h2: h2Headings.length,
          h3: scrapedData.headings.filter(h => h.level === 3).length,
          h4: scrapedData.headings.filter(h => h.level === 4).length,
          h5: scrapedData.headings.filter(h => h.level === 5).length,
          h6: scrapedData.headings.filter(h => h.level === 6).length
        };
        
        headingCheck.recommendation = await getAIRecommendation(
          headingCheck.title,
          keyphrase,
          env,
          `Current heading structure: ${JSON.stringify(headingStats)}. Issues: ${issues.join('; ')}`
        );
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for heading hierarchy:", error);
        headingCheck.recommendation = `Improve your heading structure: use exactly one H1 heading, followed by H2 headings for main sections, H3 for subsections, etc. Don't skip heading levels.`;
      }
    } else {
      headingCheck.recommendation = `Improve your heading structure: use exactly one H1 heading, followed by H2 headings for main sections, H3 for subsections, etc. Don't skip heading levels.`;
    }
  }
  checks.push(headingCheck);
  
  // --- Code Minification Check ---
  const minificationCheck: SEOCheck = {
    title: "Code Minification",
    description: "",
    passed: true,
    priority: analyzerCheckPriorities["Code Minification"]
  };
  
  // Check JS and CSS resources for minification
  let unminifiedJs = 0;
  let unminifiedCss = 0;
  
  scrapedData.resources.js.forEach(resource => {
    // Basic heuristic for minified JS: lack of line breaks and comments
    if (resource.content && (
      resource.content.includes('\n') ||
      resource.content.includes('//') ||
      resource.content.includes('/*')
    )) {
      unminifiedJs++;
    }
  });
  
  scrapedData.resources.css.forEach(resource => {
    // Basic heuristic for minified CSS: lack of line breaks and comments
    if (resource.content && (
      resource.content.includes('\n') ||
      resource.content.includes('/*')
    )) {
      unminifiedCss++;
    }
  });
  
  const totalJs = scrapedData.resources.js.length;
  const totalCss = scrapedData.resources.css.length;
  
  minificationCheck.passed = unminifiedJs === 0 && unminifiedCss === 0;
  
  if (minificationCheck.passed) {
    if (totalJs === 0 && totalCss === 0) {
      minificationCheck.description = "No external JS or CSS resources found to check minification.";
    } else {
      minificationCheck.description = `All JS and CSS resources appear to be minified. ${getSuccessMessage(minificationCheck.title)}`;
    }
  } else {
    const jsIssues = unminifiedJs > 0 ? `${unminifiedJs}/${totalJs} JS files` : "";
    const cssIssues = unminifiedCss > 0 ? `${unminifiedCss}/${totalCss} CSS files` : "";
    const issues = [jsIssues, cssIssues].filter(Boolean).join(" and ");
    
    minificationCheck.description = `Unminified resources detected: ${issues}. Minification reduces file sizes and improves page load speed.`;
    
    // Get AI recommendation if enabled
    if (env.USE_GPT_RECOMMENDATIONS === "true") {
      try {
        minificationCheck.recommendation = await getAIRecommendation(
          minificationCheck.title,
          keyphrase,
          env,
          `Unminified resources: ${issues}`
        );
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for code minification:", error);
        minificationCheck.recommendation = `Minify your JavaScript and CSS files to reduce their size and improve page load speed. Consider using tools like Terser for JavaScript and CSSNano for CSS.`;
      }
    } else {
      minificationCheck.recommendation = `Minify your JavaScript and CSS files to reduce their size and improve page load speed. Consider using tools like Terser for JavaScript and CSSNano for CSS.`;
    }
  }
  checks.push(minificationCheck);
  
  // --- Schema Markup Check ---
  const schemaCheck: SEOCheck = {
    title: "Schema Markup",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Schema Markup"]
  };
  
  // Check for schema markup
  schemaCheck.passed = scrapedData.schemaMarkup.hasSchema;
  
  if (schemaCheck.passed) {
    const schemaTypes = scrapedData.schemaMarkup.schemaTypes.join(", ");
    schemaCheck.description = `Found schema markup with types: ${schemaTypes}. ${getSuccessMessage(schemaCheck.title)}`;
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
        if (analyzerFallbackRecommendations["Schema Markup"]) {
          schemaCheck.recommendation = analyzerFallbackRecommendations["Schema Markup"]({ keyphrase });
        } else {
          schemaCheck.recommendation = `Add schema markup to your page to help search engines understand your content better and potentially display rich results in search listings.`;
        }
      }
    } else {
      if (analyzerFallbackRecommendations["Schema Markup"]) {
        schemaCheck.recommendation = analyzerFallbackRecommendations["Schema Markup"]({ keyphrase });
      } else {
        schemaCheck.recommendation = `Add schema markup to your page to help search engines understand your content better and potentially display rich results in search listings.`;
      }
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
    // Keep the existing failure message logic
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
  
  // --- Calculate final values and return result ---
  const passedChecks = checks.filter(check => check.passed).length;
  const failedChecks = checks.length - passedChecks;
  const score = calculateSEOScore(checks);
  
  // Prepare OG data if available
  let ogData: OGMetadata | undefined = undefined;
  if (useApiData && webflowPageData) {
    ogData = {
      title: webflowPageData.ogTitle || '',
      description: webflowPageData.ogDescription || '',
      image: webflowPageData.ogImage || '',
      imageWidth: '',
      imageHeight: ''
    };
  }
  
  return {
    checks,
    passedChecks,
    failedChecks,
    url,
    score,
    ogData,
    timestamp: new Date().toISOString(),
    apiDataUsed: useApiData
  };
}

// --- Define API routes ---
const app = new Hono();

// Apply CORS middleware
app.use('/*', async (c, next) => {
  const corsResult = handleCors(c.req.raw);
  
  if (corsResult instanceof Response) {
    return corsResult;
  }
  
  // Apply CORS headers to all responses
  await next();
  
  // Add CORS headers to the response
  if (corsResult && typeof corsResult === 'object') {
    Object.entries(corsResult).forEach(([key, value]) => {
      c.res.headers.set(key, value);
    });
  }
});

// Health check endpoint
app.get('/api/ping', (c) => {
  return c.json({ status: 'ok', message: 'SEO Analyzer API is running' });
});

/**
 * Main analyze endpoint
 */
app.post('/api/analyze', async (c) => {
  try {
    const body = await c.req.json();
    const { keyphrase, url, isHomePage = false, webflowPageData, pageAssets } = body;
    
    // Validate required fields
    if (!keyphrase) {
      return c.json({ error: 'Keyphrase is required' }, 400);
    }
    
    if (!url) {
      return c.json({ error: 'URL is required' }, 400);
    }
    
    // Perform scraping
    const scrapedData = await scrapeWebPage(url);
    
    // Use the page assets directly provided by the client
    // No need to "enhance" them with collection images
    const result = await analyzeSEOElements(
      scrapedData,
      keyphrase,
      url,
      isHomePage,
      c.env,
      webflowPageData,
      pageAssets // Use assets directly from client
    );
    
    return c.json(result);
  } catch (error) {
    console.error('[SEO Analyzer] Error analyzing SEO:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    return c.json({ error: `Failed to analyze SEO: ${errorMessage}` }, 500);
  }
});

// Register domains endpoint
app.post('/api/register-domains', async (c) => {
  try {
    const body = await c.req.json();
    const { domains } = body;
    
    if (!Array.isArray(domains) || domains.length === 0) {
      return c.json({ success: false, message: 'No valid domains provided' }, 400);
    }
    
    // Log domains for now (in a real implementation, you would store these somewhere)
    console.log('[SEO Analyzer] Registering domains:', domains);
    
    return c.json({ 
      success: true, 
      message: `Successfully registered ${domains.length} domains` 
    });
  } catch (error) {
    console.error('[SEO Analyzer] Error registering domains:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    return c.json({ 
      success: false, 
      message: `Failed to register domains: ${errorMessage}` 
    }, 500);
  }
});

// Export for Cloudflare Workers
export default {
  fetch: app.fetch
};
