import OpenAI from 'openai';
import { URL } from "url";
import { Hono } from 'hono';
import { corsMiddleware } from './middleware/cors';
import { 
  SEOCheck,
  WebflowPageData,
  ScrapedPageData,
  SEOAnalysisResult,
  Resource,
  AnalyzeSEORequest
} from '../shared/types/index';
import { shortenFileName } from '../shared/utils/fileUtils';
import * as cheerio from 'cheerio';
import { sanitizeText } from '../shared/utils/stringUtils';
import { shouldShowCopyButton } from '../shared/utils/seoUtils';

const app = new Hono();

app.use('*', corsMiddleware());

app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

app.post('/api/analyze', async (c) => {
  try {
    const body = await c.req.json();
    
    if (!validateAnalyzeRequest(body)) {
      return c.json({ error: 'Invalid request body' }, 400);
    }
    
    const { keyphrase, url, isHomePage = false, webflowPageData, pageAssets, advancedOptions } = body;
    
    const scrapedData = await scrapeWebPage(url, c.env as Env, keyphrase);
    
    const analysisResult = await analyzeSEOElements(
      scrapedData, 
      keyphrase, 
      url, 
      isHomePage, 
      c.env as Env, 
      webflowPageData, 
      pageAssets,
      advancedOptions
    );
    
    return c.json(analysisResult);
  } catch (error) {
    console.error('[SEO Analyzer] Error in /api/analyze route:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * Maps SEO analyzer check names to their priority levels for content optimization.
 * 
 * This configuration object defines the relative importance of various SEO factors
 * when analyzing web content. Priority levels help determine which issues should
 * be addressed first during SEO optimization.
 */
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
 * @param advancedOptions Advanced analysis options (page type, additional context)
 * @returns AI-powered recommendation or fallback message
 */
async function getAIRecommendation(
  checkType: string,
  keyphrase: string,
  env: any, 
  context?: string,
  advancedOptions?: { pageType?: string; additionalContext?: string }
): Promise<string | { introPhrase: string; copyableContent: string }> {
  try {    
    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
    
    const needsCopyableContent = shouldHaveCopyButton(checkType);
    
    // Build advanced context string if available
    let advancedContext = '';
    if (advancedOptions?.pageType || advancedOptions?.additionalContext) {
      advancedContext = '\n\nAdvanced Context:';
      if (advancedOptions.pageType) {
        advancedContext += `\n- Page Type: ${advancedOptions.pageType}`;
      }
      if (advancedOptions.additionalContext) {
        advancedContext += `\n- Additional Context: ${advancedOptions.additionalContext}`;
      }
    }
    
    const systemPrompt = needsCopyableContent 
      ? `You are an SEO expert providing ready-to-use content.
         Create a single, concise, and optimized ${checkType.toLowerCase()} that naturally incorporates the keyphrase.
         Return ONLY the final content with no additional explanation, quotes, or formatting.
         The content must be directly usable by copying and pasting.
         Focus on being specific, clear, and immediately usable.${advancedContext ? ' Consider the page type and additional context provided to make recommendations more relevant and specific.' : ''}`
      : `You are an SEO expert providing actionable advice.
         Provide a concise recommendation for the SEO check "${checkType}".${advancedContext ? ' Consider the page type and additional context provided to make recommendations more relevant and specific.' : ''}`;

    const userPrompt = needsCopyableContent
      ? `Create a perfect ${checkType.toLowerCase()} for the keyphrase "${keyphrase}".
         Current content: ${context || 'None'}${advancedContext}
         Remember to:
         - Keep optimal length for the content type (title: 50-60 chars, meta description: 120-155 chars, introduction: 2-3 sentences)
         - Make it compelling and relevant${advancedOptions?.pageType ? ` for a ${advancedOptions.pageType.toLowerCase()}` : ''}
         - For introductions, rewrite the existing content to naturally include the keyphrase while maintaining the original message
         - ONLY return the final content with no explanations or formatting`
      : `Fix this SEO issue: "${checkType}" for keyphrase "${keyphrase}" if a keyphrase is appropriate for the check.
         Current status: ${context || 'Not specified'}${advancedContext}
         Provide concise but actionable advice in a couple of sentences${advancedOptions?.pageType ? ` tailored for a ${advancedOptions.pageType.toLowerCase()}` : ''}.`;

    // Debug logging to verify advanced options are being used
    if (advancedOptions?.pageType || advancedOptions?.additionalContext) {
      console.log(`[SEO Analyzer] Using advanced options for ${checkType}:`, {
        pageType: advancedOptions.pageType,
        additionalContext: advancedOptions.additionalContext?.substring(0, 100) + '...'
      });
    }

    const maxRetries = 2;
    let retries = 0;
    let response;

    while (retries <= maxRetries) {
      try {
        response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          max_tokens: 500,
          temperature: 0.5,
        });
        const sanitizedContent = sanitizeText(response.choices[0]?.message?.content?.trim() || '');
        
        return sanitizedContent;
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

    const recommendation = sanitizeText(response.choices[0]?.message.content.trim());
    
    return recommendation;
  } catch (error) {
    console.error(`[SEO Analyzer] Error generating AI recommendation:`, error);
    throw new Error(`Failed to get AI recommendation for ${checkType}`);
  }
}

interface Env {
  USE_GPT_RECOMMENDATIONS?: string;
  OPENAI_API_KEY?: string;
  ALLOWED_ORIGINS?: string;
  CLOUDFLARE_ENV?: string;
}

/**
 * Validates that an unknown body object conforms to the AnalyzeSEORequest interface.
 * 
 * @param body - The unknown object to validate
 * @returns True if the body is a valid AnalyzeSEORequest, false otherwise
 * 
 */
function validateAnalyzeRequest(body: unknown): body is AnalyzeSEORequest {
  if (!body || typeof body !== 'object') return false;
  
  const request = body as AnalyzeSEORequest;
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
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const elementsToRemove = [
      '.cookie-banner', '.cookie-consent', '#cookie-notice', '.cookie-policy', 
      '[class*="cookie"]', '[id*="cookie"]', '[aria-label*="cookie"]',
      
      '.chat-widget', '.chatbot', '#intercom-container', '.crisp-client',
      '.livechat-widget', '.drift-widget', '.zendesk-chat',
      
      '.popup', '.modal', '.notification-bar', '.promo-banner',
      '[role="dialog"]:not([aria-label*="content"])',
      '[aria-hidden="true"]'
    ];
    
    elementsToRemove.forEach(selector => {
      try {
        $(selector).remove();
      } catch (e) {
        // Silently continue if a selector fails
      }
    });
    
    const title = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || '';
    
    const metaDescription = $('meta[name="description"]').attr('content') || 
                          $('meta[property="og:description"]').attr('content') || '';
    
    const headings = [] as Array<{level: number, text: string}>;
    $('h1, h2, h3, h4, h5, h6').each((_, element) => {
      if (element.type === 'tag') {
        const tagName = element.tagName?.toLowerCase();
        if (tagName && tagName.startsWith('h')) {
          const level = parseInt(tagName.substring(1), 10);
          headings.push({
            level,
            text: $(element).text().trim()
          });
        }
      }
    });
    
    const paragraphs: string[] = [];
    $('p').each((_, element) => {
      const text = $(element).text().trim();
      if (text) paragraphs.push(text);
    });
    
    const images = [] as Array<{src: string, alt: string, size?: number}>;
    $('img').each((_, element) => {
      const src = $(element).attr('src') || '';
      if (src) {
        images.push({
          src,
          alt: $(element).attr('alt') || '',
        });
      }
    });
    
    const internalLinks: string[] = [];
    const outboundLinks: string[] = [];
    
    const urlObj = new URL(url);
    const baseDomain = urlObj.hostname;
    
    $('a[href]').each((_, element) => {
      try {
        const href = $(element).attr('href') || '';
        const normalizedHref = href.trim().toLowerCase();
        if (!href || normalizedHref.startsWith('#') || 
            normalizedHref.startsWith('javascript:') || 
            normalizedHref.startsWith('data:') || 
            normalizedHref.startsWith('vbscript:')) {
          return;
        }
        
        let fullUrl;
        try {
          fullUrl = new URL(href, url).href;
        } catch {
          return;
        }
        
        const linkUrl = new URL(fullUrl);
        
        if (linkUrl.hostname === baseDomain) {
          internalLinks.push(fullUrl);
        } else {
          outboundLinks.push(fullUrl);
        }
      } catch (error) {
        // Skip invalid URLs
      }
    });
    
    const resources = {
      js: [] as Resource[],
      css: [] as Resource[]
    };
    
    $('script[src]').each((_, element) => {
      const src = $(element).attr('src');
      if (src) resources.js.push({ url: src });
    });
    
    $('link[rel="stylesheet"][href]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) resources.css.push({ url: href });
    });
    
    const schemaMarkup = {
      hasSchema: false,
      schemaTypes: [] as string[],
      schemaCount: 0
    };
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const json = JSON.parse($(element).html() || '{}');
        const schemaType = json['@type'];
        
        if (schemaType) {
          schemaMarkup.hasSchema = true;
          if (Array.isArray(schemaType)) {
            schemaMarkup.schemaTypes = [...schemaMarkup.schemaTypes, ...schemaType];
          } else {
            schemaMarkup.schemaTypes.push(schemaType);
          }
          schemaMarkup.schemaCount++;
        }
      } catch (error) {
        console.error('[SEO Analyzer] Error parsing JSON-LD schema:', error);
      }
    });
    
    const canonicalUrl = $('link[rel="canonical"]').attr('href') || url;
    
    const metaKeywords = $('meta[name="keywords"]').attr('content') || '';
    
    const ogImage = $('meta[property="og:image"]').attr('content') || '';
    
    const bodyText = $('body').text().trim();
    
    const scrapedData: ScrapedPageData = {
      url,
      title,
      metaDescription,
      headings,
      paragraphs,
      images,
      internalLinks,
      outboundLinks,
      resources,
      canonicalUrl,
      metaKeywords,
      ogImage,
      content: bodyText,
      schemaMarkup
    };
    
    return scrapedData;
  } catch (error) {
    console.error('[SEO Analyzer] Error scraping web page:', error);
    throw new Error(`Failed to analyze page: ${error instanceof Error ? error.message : String(error)}`);
  }
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
 * @param advancedOptions Optional advanced analysis options
 * @returns Complete SEO analysis results
 */
async function analyzeSEOElements(
  scrapedData: ScrapedPageData,
  keyphrase: string,
  url: string,
  isHomePage: boolean,
  env: Env,
  webflowPageData?: WebflowPageData,
  pageAssets?: Array<{ url: string, alt: string, type: string, size?: number, mimeType?: string }>,
  advancedOptions?: { pageType?: string; additionalContext?: string }
): Promise<SEOAnalysisResult> {
  const checks: SEOCheck[] = [];
  const normalizedKeyphrase = keyphrase.toLowerCase().trim();
  
  // Determine if we're using API data
  const useApiData = !!webflowPageData;
  
  // --- Title Check ---
  let pageTitle = '';
  if (useApiData && webflowPageData?.title) {
    pageTitle = webflowPageData.title;
  } else {
    pageTitle = scrapedData.title || '';
  }
  const titleCheck = await createSEOCheck(
    "Keyphrase in Title",
    () => pageTitle.toLowerCase().includes(normalizedKeyphrase),
    `Great! Your title contains the keyphrase "${keyphrase}".`,
    `Your title does not contain the keyphrase "${keyphrase}".`,
    pageTitle,
    keyphrase,
    env,
    advancedOptions
  );

  checks.push(titleCheck);
  
  // --- Meta Description Check ---
  let metaDescription = '';
  if (useApiData && webflowPageData?.metaDescription) {
    metaDescription = webflowPageData.metaDescription;
  } else {
    metaDescription = scrapedData.metaDescription || '';
  }

  const metaDescriptionCheck = await createSEOCheck(
    "Keyphrase in Meta Description",
    () => metaDescription.toLowerCase().includes(normalizedKeyphrase),
    `Great! Your meta description contains the keyphrase "${keyphrase}".`,
    `Keyphrase "${keyphrase}" not found in meta description: "${metaDescription}"`,
    metaDescription,
    keyphrase,
    env,
    advancedOptions
  );

  checks.push(metaDescriptionCheck);
  
  // --- URL Check ---
  let canonicalUrl = useApiData && webflowPageData?.canonicalUrl
    ? webflowPageData.canonicalUrl
    : url;
  
  // Normalize the URL for comparison
  const normalizedUrl = canonicalUrl.toLowerCase().trim();
  
  const urlCheck = await createSEOCheck(
    "Keyphrase in URL",
    () => normalizedUrl.includes(normalizedKeyphrase),
    `Good job! The keyphrase "${keyphrase}" is present in the URL slug.`,
    `The URL "${canonicalUrl}" does not contain the keyphrase "${keyphrase}".`,
    canonicalUrl,
    keyphrase,
    env,
    advancedOptions
  );
  
  checks.push(urlCheck);
  
  // --- Content Length Check ---
  const contentWords = scrapedData.content.trim().split(/\s+/).filter(Boolean);
  const wordCount = contentWords.length;

  const minWordCount = isHomePage ? 300 : 600;

  const contentLengthCheck = await createSEOCheck(
    "Content Length",
    () => wordCount >= minWordCount,
    `Well done! Your content has ${wordCount} words, which meets the threshold of ${minWordCount} words ${isHomePage ? "(homepage)" : "(regular page)"}.`,
    `Content length is ${wordCount} words, which is below the recommended minimum of ${minWordCount} words ${isHomePage ? "(homepage)" : "(regular page)"}.`,
    scrapedData.content,
    keyphrase,
    env,
    advancedOptions
  );

  checks.push(contentLengthCheck);
  
  const keyphraseDensityCheck: SEOCheck = {
    title: "Keyphrase Density",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Keyphrase Density"]
  };
  
  function calculateKeyphraseDensity(content: string, keyphrase: string): number {
    const lowercaseContent = content.toLowerCase();
    const lowercaseKeyphrase = keyphrase.toLowerCase();
    
    const regex = new RegExp(lowercaseKeyphrase, 'g');
    const matches = lowercaseContent.match(regex);
    const occurrences = matches ? matches.length : 0;
    
    const words = lowercaseContent.split(/\s+/);
    const wordCount = words.length || 1; // Avoid division by zero
    
    return (occurrences / wordCount) * 100;
  }
  
  const density = calculateKeyphraseDensity(scrapedData.content, keyphrase);
  
  const minDensity = 0.5;
  const maxDensity = 2.5;
  
  keyphraseDensityCheck.passed = density >= minDensity && density <= maxDensity;
  
  if (keyphraseDensityCheck.passed) {
    keyphraseDensityCheck.description = getSuccessMessage(keyphraseDensityCheck.title);
  } else {
    keyphraseDensityCheck.description = `Keyphrase density is ${density.toFixed(2)}%. `;
    
    if (density < minDensity) {
      keyphraseDensityCheck.description += `Consider using the keyphrase more often to meet the minimum recommended density of ${minDensity}%.`;
    }
    
    if (density > maxDensity) {
      keyphraseDensityCheck.description += `Consider using the keyphrase less often to avoid keyword stuffing. Current density: ${density.toFixed(2)}%.`;
    }
  }
  checks.push(keyphraseDensityCheck);
  
  // --- Keyphrase in Introduction Check ---
  const firstParagraph = scrapedData.paragraphs[0] || '';

  const keyphraseInIntroCheck = await createSEOCheck(
    "Keyphrase in Introduction",
    () => firstParagraph.toLowerCase().includes(normalizedKeyphrase),
    `Nice! The keyphrase "${keyphrase}" appears in the first paragraph.`,
    `Keyphrase "${keyphrase}" not found in the introduction.`,
    firstParagraph,
    keyphrase,
    env,
    advancedOptions
  );
  
  checks.push(keyphraseInIntroCheck);
  
  // --- Image Alt Attributes Check ---
  const imageAltCheck: SEOCheck = {
    title: "Image Alt Attributes",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Image Alt Attributes"]
  };
  
  const imagesWithoutAlt = scrapedData.images.filter(img => !img.alt || img.alt.trim().length === 0);
  imageAltCheck.passed = imagesWithoutAlt.length === 0;
  
  if (imageAltCheck.passed) {
    imageAltCheck.description = getSuccessMessage(imageAltCheck.title);
  } else {
    imageAltCheck.description = `Found ${imagesWithoutAlt.length} image(s) without alt attributes.`;
    
    try {
        const imageAltResult = await getAIRecommendation(
          imageAltCheck.title,
          keyphrase,
          env,
          `${imagesWithoutAlt.length} image(s) found without alt attributes.`,
          advancedOptions
        );
        handleRecommendationResult(imageAltResult, imageAltCheck);
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for image alt attributes:", error);
      }
  }
  checks.push(imageAltCheck);
  
  if (!imageAltCheck.passed) {
    imageAltCheck.imageData = imagesWithoutAlt.map(img => ({
      url: img.src,
      name: img.src.split('/').pop() || 'unknown',
      shortName: shortenFileName(img.src.split('/').pop() || 'unknown', 10),
      size: img.size ? Math.round(img.size / 1024) : 0,
      mimeType: 'Unknown',
      alt: img.alt || ''
    }));
  }
  
  // --- Internal Links Check ---
  const internalLinksCheck = await createSEOCheck(
    "Internal Links",
    () => scrapedData.internalLinks.length > 0,
    `Great! You have internal links on the page.`,
    `No internal links found on the page.`,
    scrapedData.internalLinks.join(', '),
    keyphrase,
    env,
    advancedOptions
  );
  
  checks.push(internalLinksCheck);
  
  // --- Outbound Links Check ---
  const outboundLinksCheck = await createSEOCheck(
    "Outbound Links",
    () => scrapedData.outboundLinks.length > 0,
    `Good! Outbound links are present.`,
    `No outbound links found on the page.`,
    scrapedData.outboundLinks.join(', '),
    keyphrase,
    env,
    advancedOptions
  );
  
  checks.push(outboundLinksCheck);
  
  // --- Next-Gen Image Formats Check ---
  const nextGenImagesCheck: SEOCheck = {
    title: "Next-Gen Image Formats",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Next-Gen Image Formats"]
  };
  
  const nextGenImageFormats = ['webp', 'avif', 'svg'];
  const imagesInNextGenFormats = scrapedData.images.filter(img => {
    const ext = img.src.split('.').pop()?.toLowerCase();
    return ext && nextGenImageFormats.includes(ext);
  });
  
  nextGenImagesCheck.passed = imagesInNextGenFormats.length === scrapedData.images.length;
  
  if (nextGenImagesCheck.passed) {
    nextGenImagesCheck.description = getSuccessMessage(nextGenImagesCheck.title);
  } else {
    nextGenImagesCheck.description = `Found ${imagesInNextGenFormats.length} image(s) in next-gen formats, out of ${scrapedData.images.length}.`;
    
    try {
        const nextGenImagesResult = await getAIRecommendation(
          nextGenImagesCheck.title,
          keyphrase,
          env,
          `${imagesInNextGenFormats.length} image(s) found in next-gen formats.`,
          advancedOptions
        );
        handleRecommendationResult(nextGenImagesResult, nextGenImagesCheck);
      } catch (error) {
        console.error("[SEO Analyzer] Error getting AI recommendation for next-gen image formats:", error);
      }
  }
  checks.push(nextGenImagesCheck);
  
  if (!nextGenImagesCheck.passed) {
    const nonNextGenImages = scrapedData.images.filter(img => {
      const ext = img.src.split('.').pop()?.toLowerCase();
      return !ext || !nextGenImageFormats.includes(ext);
    });
    
    nextGenImagesCheck.imageData = nonNextGenImages.map(img => ({
      url: img.src,
      name: img.src.split('/').pop() || 'unknown',
      shortName: shortenFileName(img.src.split('/').pop() || 'unknown', 10),
      size: 0,
      mimeType: img.src.split('.').pop()?.toLowerCase() || 'Unknown'
    }));
  }
  
  // --- OG Image Check ---
  const ogImageCheck: SEOCheck = {
    title: "OG Image",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["OG Image"]
  };
  
  let hasOgImage = false;

  if (useApiData && webflowPageData) {
    hasOgImage = !!webflowPageData.openGraphImage;
  } else {
    const ogImageMeta = scrapedData.content.match(/<meta property=["']og:image["'] content=["']([^"']+)["']/i);
    hasOgImage = !!ogImageMeta;
  }

  ogImageCheck.passed = hasOgImage;

  if (ogImageCheck.passed) {
    ogImageCheck.description = getSuccessMessage(ogImageCheck.title);
  } else {
    ogImageCheck.description = `No Open Graph image found. Recommended for social media sharing.`;
    ogImageCheck.recommendation = `Add an Open Graph image to your page to improve how your content is displayed on social media. Recommended size: 1200x630 pixels.`;
  }
  checks.push(ogImageCheck);
  
  // --- OG Title and Description Check ---
  const ogTitleDescCheck: SEOCheck = {
    title: "OG Title and Description",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["OG Title and Description"]
  };
  
    const titleCheckPassed = checks.find(check => check.title === "Keyphrase in Title")?.passed || false;
    const metaDescCheckPassed = checks.find(check => check.title === "Keyphrase in Meta Description")?.passed || false;
    
    const usesTitleAsOG = webflowPageData?.usesTitleAsOpenGraphTitle ?? true;
    const usesDescAsOG = webflowPageData?.usesDescriptionAsOpenGraphDescription ?? true;

    ogTitleDescCheck.passed = titleCheckPassed && metaDescCheckPassed && usesTitleAsOG && usesDescAsOG;
    if (ogTitleDescCheck.passed) {
      ogTitleDescCheck.description = getSuccessMessage(ogTitleDescCheck.title);
    } else {
      ogTitleDescCheck.description = `Open Graph title or description is missing.`;
      
      // Case 1: Title or Meta Description check fails
      const titleCheckFailed = checks.find(check => check.title === "Keyphrase in Title" && !check.passed);
      const metaDescriptionCheckFailed = checks.find(check => check.title === "Keyphrase in Meta Description" && !check.passed);
      
      if (titleCheckFailed || metaDescriptionCheckFailed) {
        ogTitleDescCheck.recommendation = `First fix your ${titleCheckFailed ? 'page title' : ''}${titleCheckFailed && metaDescriptionCheckFailed ? ' and ' : ''}${metaDescriptionCheckFailed ? 'meta description' : ''}, then set your Open Graph title and description to use these values in Webflow page settings.`;
      }
      // Case 2: Title and Meta Description pass but settings don't use them
      else {      
        if (usesTitleAsOG === false || usesDescAsOG === false) {
          ogTitleDescCheck.recommendation = `Your page ${!usesTitleAsOG ? 'title' : ''}${!usesTitleAsOG && !usesDescAsOG ? ' and ' : ''}${!usesDescAsOG ? 'meta description' : ''} ${!usesTitleAsOG && !usesDescAsOG ? 'are' : 'is'} not set to be used for Open Graph. Open Webflow page settings and enable "Use page title for Open Graph title" and "Use page description for Open Graph description".`;
        } else {
          ogTitleDescCheck.recommendation = `Add an Open Graph title and description to your page to improve how your content is displayed on social media. Title length: 60 characters max, Description length: 110 characters max.`;
        }
      }
    }
    checks.push(ogTitleDescCheck);
  
  // --- H1 Check ---
  const h1Headings = scrapedData.headings.filter(heading => heading.level === 1).map(h => h.text);
  const h1Text = h1Headings.length > 0 ? h1Headings[0] : '';

  const h1Check = await createSEOCheck(
    "Keyphrase in H1 Heading",
    () => h1Text.toLowerCase().includes(normalizedKeyphrase),
    `Great! The main H1 heading includes the keyphrase "${keyphrase}".`,
    `Keyphrase "${keyphrase}" not found in H1: "${h1Text}"`,
    h1Text,
    keyphrase,
    env,
    advancedOptions
  );

  checks.push(h1Check);
  
  // --- H2 Check ---
  const h2Headings = scrapedData.headings.filter(h => h.level === 2);

  const h2Check = await createSEOCheck(
    "Keyphrase in H2 Headings",
    () => h2Headings.some(h => h.text.toLowerCase().includes(normalizedKeyphrase)),
    `Good! The keyphrase "${keyphrase}" is found in at least one H2 heading.`,
    `Keyphrase "${keyphrase}" not found in any H2 headings.`,
    h2Headings.map(h => h.text).join(', '),
    keyphrase,
    env,
    advancedOptions
  );

  checks.push(h2Check);
  
  // --- Heading Hierarchy Check ---
  
  const headingLevels = scrapedData.headings.map(h => h.level);
  const hasProperHierarchy = (
    headingLevels.includes(1) &&
    headingLevels.filter(level => level === 1).length === 1 &&
    headingLevels.every((level, index) => 
      index === 0 ||
      level === headingLevels[index - 1] ||
      level === headingLevels[index - 1] + 1 ||
      level < headingLevels[index - 1]
    )
  );

  const headingHierarchyCheck = await createSEOCheck(
    "Heading Hierarchy",
    () => hasProperHierarchy,
    `Excellent! Your heading structure follows a logical hierarchy.`,
    `Improper heading hierarchy detected. Ensure that H1 is used only once and H2s follow a logical order.`,
    scrapedData.headings.map(h => `${h.text} (H${h.level})`).join(', '),
    keyphrase,
    env,
    advancedOptions
  );

  checks.push(headingHierarchyCheck);
  
  // --- Code Minification Check ---
  const codeMinificationCheck: SEOCheck = {
    title: "Code Minification",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Code Minification"]
  };

  function analyzeMinification(jsFiles: Resource[], cssFiles: Resource[]): {
    passed: boolean;
    jsMinified: number;
    cssMinified: number;
    totalJs: number;
    totalCss: number;
    details: string[];
  } {
    const details: string[] = [];
    
    function isLikelyMinified(url: string): boolean {
      const urlLower = url.toLowerCase();
      
      // 1. Check for explicit .min. in filename
      if (urlLower.includes('.min.')) {
        return true;
      }
      
      // 2. Check for common CDN patterns that auto-minify
      const autoMinifyingCDNs = [
        'cdnjs.cloudflare.com',
        'unpkg.com',
        'jsdelivr.net',
        'googleapis.com',
        'gstatic.com',
        'assets.webflow.com', // Webflow auto-minifies
        'global-uploads.webflow.com'
      ];
      
      if (autoMinifyingCDNs.some(cdn => urlLower.includes(cdn))) {
        return true;
      }
      
      // 3. Check for build tool patterns (webpack, vite, etc.)
      if (urlLower.match(/\.(js|css)\?v=|\/build\/|\/dist\/|\.bundle\.|\.chunk\./)) {
        return true;
      }
      
      // 4. Check for hash-based filenames (common in modern builds)
      if (urlLower.match(/\.[a-f0-9]{8,}\.(js|css)$/)) {
        return true;
      }
      
      return false;
    }
    
    // Analyze JS files
    const jsMinified = jsFiles.filter(file => isLikelyMinified(file.url)).length;
    const totalJs = jsFiles.length;
    
    // Analyze CSS files
    const cssMinified = cssFiles.filter(file => isLikelyMinified(file.url)).length;
    const totalCss = cssFiles.length;
    
    // Determine if check passes
    let passed = false;
    
    if (totalJs === 0 && totalCss === 0) {
      passed = true; // No files to minify
      details.push("No external JS or CSS files detected");
    } else {
      const totalFiles = totalJs + totalCss;
      const minifiedFiles = jsMinified + cssMinified;
      const minificationRate = minifiedFiles / totalFiles;
      
      passed = minificationRate >= 0.8;
      
      if (totalJs > 0) {
        details.push(`JS files: ${jsMinified}/${totalJs} minified`);
      }
      if (totalCss > 0) {
        details.push(`CSS files: ${cssMinified}/${totalCss} minified`);
      }
    }
    
    return {
      passed,
      jsMinified,
      cssMinified,
      totalJs,
      totalCss,
      details
    };
  }

  // Run the enhanced analysis
  const minificationAnalysis = analyzeMinification(
    scrapedData.resources.js, 
    scrapedData.resources.css
  );

  codeMinificationCheck.passed = minificationAnalysis.passed;

  if (codeMinificationCheck.passed) {
    codeMinificationCheck.description = getSuccessMessage(codeMinificationCheck.title);
    if (minificationAnalysis.details.length > 0) {
      codeMinificationCheck.description += ` (${minificationAnalysis.details.join(', ')})`;
    }
  } else {
    const unminifiedJs = minificationAnalysis.totalJs - minificationAnalysis.jsMinified;
    const unminifiedCss = minificationAnalysis.totalCss - minificationAnalysis.cssMinified;
    
    codeMinificationCheck.description = `Code optimization needed: ${unminifiedJs} JS and ${unminifiedCss} CSS files appear unminified. Confirm that your page settings are set to minify code.`;
    codeMinificationCheck.recommendation = "";
  }

  checks.push(codeMinificationCheck);

  
  // --- Schema Markup Check ---
  const schemaCheck: SEOCheck = {
    title: "Schema Markup",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Schema Markup"]
  };
  
  schemaCheck.passed = scrapedData.schemaMarkup.hasSchema;
  
  if (schemaCheck.passed) {
    const schemaTypes = scrapedData.schemaMarkup.schemaTypes.join(", ");
    schemaCheck.description = getSuccessMessage(schemaCheck.title);
    
    if (schemaTypes) {
      schemaCheck.description += ` (${schemaTypes})`;
    }
  } else {
    schemaCheck.description = `No schema markup found.`;
    
    schemaCheck.recommendation = "Add structured data using Schema.org markup to help search engines understand your content. Visit schema.org to find the appropriate schema type for your page content (e.g., Article, Product, LocalBusiness).";
  }
  checks.push(schemaCheck);
  
  // --- Image File Size Check ---
  const imageSizeCheck: SEOCheck = {
    title: "Image File Size",
    description: "",
    passed: true,
    priority: analyzerCheckPriorities["Image File Size"]
  };
  
  const MAX_IMAGE_SIZE_KB = 300;
  const largeImages: Array<{
    url: string;
    name: string;
    shortName: string;
    size: number;
    mimeType?: string;
  }> = [];
  let totalImages = 0;
  
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
    
    try {
        const context = `Found ${largeImages.length} large images out of ${totalImages} total.`;
        const imageSizeResult = await getAIRecommendation(
          imageSizeCheck.title,
          "image optimization",
          env,
          context,
          advancedOptions
        );
        handleRecommendationResult(imageSizeResult, imageSizeCheck);
      } catch (error) {
        console.error("[SEO Analyzer] Error generating AI recommendation for image size:", error);
      }
    
    imageSizeCheck.imageData = largeImages;
  }
  checks.push(imageSizeCheck);
  
  // --- Final Checks Summary ---
  const passedChecks = checks.filter(check => check.passed);
  const failedChecks = checks.filter(check => !check.passed);
  
  const seoScore = (passedChecks.length / checks.length) * 100;
  
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

export default app;

export const shouldHaveCopyButton = shouldShowCopyButton;

function handleRecommendationResult(
  result: string | { introPhrase: string; copyableContent: string },
  check: SEOCheck
) {
  if (typeof result === 'string') {
    check.recommendation = sanitizeText(result);
  } else {
    check.recommendation = sanitizeText(result.copyableContent);
    if ('introPhrase' in result) {
      check.introPhrase = sanitizeText(result.introPhrase);
    }
  }
}

/**
 * Creates an SEO check with consistent error handling and recommendations
 * @param title The title of the check
 * @param checkFunction Function that returns true if check passes, false if it fails
 * @param successMessage Message to show when check passes
 * @param failureMessage Message to show when check fails
 * @param context Additional context for AI recommendations
 * @param keyphrase The target keyphrase
 * @param env Environment variables for AI recommendations
 * @param advancedOptions Advanced analysis options
 * @returns A complete SEO check object
 */
async function createSEOCheck(
  title: string,
  checkFunction: () => boolean,
  successMessage: string,
  failureMessage: string,
  context: string | undefined,
  keyphrase: string,
  env: Env,
  advancedOptions?: { pageType?: string; additionalContext?: string }
): Promise<SEOCheck> {
  const check: SEOCheck = {
    title,
    description: "",
    passed: false,
    priority: analyzerCheckPriorities[title] || "medium"
  };
  
  try {
    check.passed = checkFunction();
  } catch (error) {
    console.error(`[SEO Analyzer] Error evaluating check "${title}":`, error);
    check.passed = false;
  }
  
  if (check.passed) {
    check.description = successMessage;
  } else {
    check.description = failureMessage;
    
    try {
      const aiSuggestion = await getAIRecommendation(
        title,
        keyphrase,
        env,
        context,
        advancedOptions
      );
      handleRecommendationResult(aiSuggestion, check);
    } catch (error) {
      console.error(`[SEO Analyzer] Error getting AI recommendation for ${title}:`, error);
    }
  }
  
  return check;
}