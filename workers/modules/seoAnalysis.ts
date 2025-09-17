import { 
  SEOCheck,
  ScrapedPageData,
  WebflowPageData,
  SEOAnalysisResult,
  Resource,
  WorkerEnvironment,
  AdvancedOptions
} from '../../shared/types/index';
import { shortenFileName } from '../../shared/utils/fileUtils';
import { sanitizeText } from '../../shared/utils/stringUtils';
import { shouldShowCopyButton } from '../../shared/utils/seoUtils';
import { getAIRecommendation } from './aiRecommendations';

/**
 * Maps SEO analyzer check names to their priority levels for content optimization.
 */
export const analyzerCheckPriorities: Record<string, 'high' | 'medium' | 'low'> = {
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
 */
export function getSuccessMessage(checkType: string): string {
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
 * Helper function to check keywords in content with detailed results
 */
export function checkKeywordMatch(content: string, primaryKeyword: string, secondaryKeywords?: string): { 
  found: boolean; 
  matchedKeyword?: string;
  keywordResults: Array<{ keyword: string; passed: boolean; isPrimary: boolean }>;
} {
  const results: Array<{ keyword: string; passed: boolean; isPrimary: boolean }> = [];
  
  if (!content || !primaryKeyword) {
    return { found: false, keywordResults: [] };
  }

  const normalizedContent = content.toLowerCase();
  
  // Check primary keyword first
  const normalizedPrimary = primaryKeyword.toLowerCase();
  const primaryPassed = normalizedContent.includes(normalizedPrimary);
  results.push({
    keyword: primaryKeyword,
    passed: primaryPassed,
    isPrimary: true
  });

  // If primary passes, we're done (optimization)
  if (primaryPassed) {
    return { 
      found: true, 
      matchedKeyword: primaryKeyword,
      keywordResults: results
    };
  }

  // Check secondary keywords if provided
  if (secondaryKeywords) {
    const keywords = secondaryKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    
    for (const keyword of keywords) {
      const normalizedKeyword = keyword.toLowerCase();
      const keywordPassed = normalizedContent.includes(normalizedKeyword);
      results.push({
        keyword: keyword,
        passed: keywordPassed,
        isPrimary: false
      });

      // If this secondary keyword passes, we found a match
      if (keywordPassed && !results.some(r => r.passed)) {
        return { 
          found: true, 
          matchedKeyword: keyword,
          keywordResults: results
        };
      }
    }
  }

  // Check if any keyword passed
  const anyPassed = results.some(r => r.passed);
  const matchedKeyword = results.find(r => r.passed)?.keyword;

  return { 
    found: anyPassed, 
    matchedKeyword,
    keywordResults: results
  };
}

/**
 * Check for keyword matches in URLs with special normalization
 */
export function checkUrlKeywordMatch(url: string, primaryKeyword: string, secondaryKeywords?: string): { 
  found: boolean; 
  matchedKeyword?: string;
  keywordResults: Array<{ keyword: string; passed: boolean; isPrimary: boolean }>;
} {
  const results: Array<{ keyword: string; passed: boolean; isPrimary: boolean }> = [];
  
  if (!url || !primaryKeyword) {
    return { found: false, keywordResults: [] };
  }

  // Normalize URL for comparison by removing protocol, domain, and converting separators
  const normalizedUrl = url.toLowerCase()
    .replace(/^https?:\/\//, '') // Remove protocol
    .replace(/^[^/]*\//, '') // Remove domain
    .replace(/[_-]/g, ' ') // Convert hyphens and underscores to spaces
    .replace(/%20/g, ' '); // Convert URL-encoded spaces
  
  // Check primary keyword first
  const normalizedPrimary = primaryKeyword.toLowerCase();
  const primaryPassed = normalizedUrl.includes(normalizedPrimary);
  results.push({
    keyword: primaryKeyword,
    passed: primaryPassed,
    isPrimary: true
  });

  // If primary passes, we're done (optimization)
  if (primaryPassed) {
    return { 
      found: true, 
      matchedKeyword: primaryKeyword,
      keywordResults: results
    };
  }

  // Check secondary keywords if provided
  if (secondaryKeywords) {
    const keywords = secondaryKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    
    for (const keyword of keywords) {
      const normalizedKeyword = keyword.toLowerCase();
      const keywordPassed = normalizedUrl.includes(normalizedKeyword);
      results.push({
        keyword: keyword,
        passed: keywordPassed,
        isPrimary: false
      });

      // If this secondary keyword passes, we found a match
      if (keywordPassed && !results.some(r => r.passed)) {
        return { 
          found: true, 
          matchedKeyword: keyword,
          keywordResults: results
        };
      }
    }
  }

  // Check if any keyword passed
  const anyPassed = results.some(r => r.passed);
  const matchedKeyword = results.find(r => r.passed)?.keyword;

  return { 
    found: anyPassed, 
    matchedKeyword,
    keywordResults: results
  };
}

/**
 * Calculate keyword density for primary and secondary keywords combined
 */
export function calculateCombinedKeyphraseDensity(content: string, primaryKeyword: string, secondaryKeywords?: string): number {
  if (!content || !primaryKeyword) return 0;

  const lowercaseContent = content.toLowerCase();
  let totalOccurrences = 0;

  // Count primary keyword
  const primaryRegex = new RegExp(primaryKeyword.toLowerCase(), 'g');
  const primaryMatches = lowercaseContent.match(primaryRegex);
  totalOccurrences += primaryMatches ? primaryMatches.length : 0;

  // Count secondary keywords
  if (secondaryKeywords) {
    const keywords = secondaryKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    
    for (const keyword of keywords) {
      const keywordRegex = new RegExp(keyword.toLowerCase(), 'g');
      const keywordMatches = lowercaseContent.match(keywordRegex);
      totalOccurrences += keywordMatches ? keywordMatches.length : 0;
    }
  }

  const words = lowercaseContent.split(/\s+/);
  const wordCount = words.length || 1;
  
  return (totalOccurrences / wordCount) * 100;
}

/**
 * Analyze code minification status
 */
export function analyzeMinification(jsFiles: any[], cssFiles: any[]): {
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

/**
 * Check if SEO analysis needs to be regenerated
 */
export function calculateSEOScore(checks: SEOCheck[]): number {
  if (checks.length === 0) return 0;
  const passedChecks = checks.filter(check => check.passed);
  return Math.round((passedChecks.length / checks.length) * 100);
}

/**
 * Creates an SEO check with enhanced logic from v3.3.14, including AI recommendations
 */
async function createSEOCheck(
  title: string,
  conditionFn: () => boolean,
  successMessage: string,
  failureMessage: string,
  context: string,
  keyphrase: string,
  env: WorkerEnvironment,
  advancedOptions?: AdvancedOptions,
  matchedKeyword?: string
): Promise<SEOCheck> {
  const passed = conditionFn();
  
  const check: SEOCheck = {
    title,
    description: passed ? 
      (matchedKeyword && matchedKeyword !== keyphrase ? 
        successMessage.replace(keyphrase, matchedKeyword) : 
        successMessage) : 
      failureMessage,
    passed,
    priority: analyzerCheckPriorities[title] || 'medium'
  };

  // Add AI recommendation if check failed and AI is enabled
  if (!passed && env.USE_GPT_RECOMMENDATIONS === 'true' && env.OPENAI_API_KEY) {
    try {
      const recommendation = await getAIRecommendation(
        title,
        keyphrase,
        env,
        context,
        advancedOptions
      );
      check.recommendation = recommendation;
    } catch (error) {
      console.error(`[SEO Analysis] Error generating AI recommendation for ${title}:`, error);
      // Don't fail the entire check if AI recommendation fails
    }
  }

  return check;
}

/**
 * Main SEO analysis orchestration function
 */
export async function analyzeSEOElements(
  scrapedData: ScrapedPageData,
  keyphrase: string,
  url: string,
  isHomePage: boolean,
  env: WorkerEnvironment,
  webflowPageData?: WebflowPageData,
  pageAssets?: Resource[],
  advancedOptions?: AdvancedOptions
): Promise<SEOAnalysisResult> {
  const checks: SEOCheck[] = [];
  const secondaryKeywords = advancedOptions?.secondaryKeywords || '';
  
  // Determine if we're using Webflow API data
  const useApiData = !!webflowPageData;
  
  // --- Title Check with v3.3.14 enhanced logic ---
  let pageTitle = '';
  if (useApiData && webflowPageData?.title) {
    pageTitle = webflowPageData.title;
  } else {
    pageTitle = scrapedData.title || '';
  }
  const titleKeywordMatch = checkKeywordMatch(pageTitle, keyphrase, secondaryKeywords);
  const titleCheck = await createSEOCheck(
    "Keyphrase in Title",
    () => titleKeywordMatch.found,
    titleKeywordMatch.matchedKeyword ? 
      `Great! Your title contains the keyword "${titleKeywordMatch.matchedKeyword}".` :
      `Great! Your title contains the keyphrase "${keyphrase}".`,
    `Your title does not contain the keyphrase "${keyphrase}"${secondaryKeywords ? ' or any secondary keywords' : ''}.`,
    pageTitle,
    keyphrase,
    env,
    advancedOptions,
    titleKeywordMatch.matchedKeyword
  );
  checks.push(titleCheck);

  // --- Meta Description Check with v3.3.14 enhanced logic ---
  let metaDescription = '';
  if (useApiData && webflowPageData?.metaDescription) {
    metaDescription = webflowPageData.metaDescription;
  } else {
    metaDescription = scrapedData.metaDescription || '';
  }
  const metaDescKeywordMatch = checkKeywordMatch(metaDescription, keyphrase, secondaryKeywords);
  const metaDescriptionCheck = await createSEOCheck(
    "Keyphrase in Meta Description",
    () => metaDescKeywordMatch.found,
    metaDescKeywordMatch.matchedKeyword ? 
      `Great! Your meta description contains the keyword "${metaDescKeywordMatch.matchedKeyword}".` :
      `Great! Your meta description contains the keyphrase "${keyphrase}".`,
    `Keyphrase "${keyphrase}"${secondaryKeywords ? ' or any secondary keywords' : ''} not found in meta description: "${metaDescription}"`,
    metaDescription,
    keyphrase,
    env,
    advancedOptions,
    metaDescKeywordMatch.matchedKeyword
  );
  checks.push(metaDescriptionCheck);

  // --- URL Check with v3.3.14 enhanced logic ---
  let canonicalUrl = useApiData && webflowPageData?.canonicalUrl
    ? webflowPageData.canonicalUrl
    : url;
  
  const urlKeywordMatch = checkUrlKeywordMatch(canonicalUrl, keyphrase, secondaryKeywords);
  const urlCheck = await createSEOCheck(
    "Keyphrase in URL",
    () => urlKeywordMatch.found,
    urlKeywordMatch.matchedKeyword ? 
      `Good job! The keyword "${urlKeywordMatch.matchedKeyword}" is present in the URL slug.` :
      `Good job! The keyphrase "${keyphrase}" is present in the URL slug.`,
    `The URL "${canonicalUrl}" does not contain the keyphrase "${keyphrase}"${secondaryKeywords ? ' or any secondary keywords' : ''}.`,
    canonicalUrl,
    keyphrase,
    env,
    advancedOptions,
    urlKeywordMatch.matchedKeyword
  );
  checks.push(urlCheck);
  
  // --- Content Length Check with v3.3.14 enhanced logic ---
  const contentWords = scrapedData.content.trim().split(/\s+/).filter(Boolean);
  const wordCount = contentWords.length;
  const minWordCount = isHomePage ? 300 : 600;

  const contentLengthCheck: SEOCheck = {
    title: "Content Length",
    description: wordCount >= minWordCount
      ? `Well done! Your content has ${wordCount} words, which meets the threshold of ${minWordCount} words ${isHomePage ? "(homepage)" : "(regular page)"}.`
      : `Content length is ${wordCount} words, which is below the recommended minimum of ${minWordCount} words ${isHomePage ? "(homepage)" : "(regular page)"}.`,
    passed: wordCount >= minWordCount,
    priority: analyzerCheckPriorities["Content Length"] || 'high'
  };
  checks.push(contentLengthCheck);

  // --- Keyphrase Density Check with v3.3.14 enhanced logic ---
  const keyphraseDensityCheck: SEOCheck = {
    title: "Keyphrase Density",
    description: "",
    passed: false,
    priority: analyzerCheckPriorities["Keyphrase Density"]
  };
  
  const density = calculateCombinedKeyphraseDensity(scrapedData.content, keyphrase, secondaryKeywords);
  
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

  // --- Keyphrase in Introduction Check with v3.3.14 enhanced logic ---
  const firstParagraph = scrapedData.paragraphs[0] || '';
  const introKeywordMatch = checkKeywordMatch(firstParagraph, keyphrase, secondaryKeywords);
  const keyphraseInIntroCheck = await createSEOCheck(
    "Keyphrase in Introduction",
    () => introKeywordMatch.found,
    introKeywordMatch.matchedKeyword ? 
      `Nice! The keyword "${introKeywordMatch.matchedKeyword}" appears in the first paragraph.` :
      `Nice! The keyphrase "${keyphrase}" appears in the first paragraph.`,
    `Keyphrase "${keyphrase}"${secondaryKeywords ? ' or any secondary keywords' : ''} not found in the introduction.`,
    firstParagraph,
    keyphrase,
    env,
    advancedOptions,
    introKeywordMatch.matchedKeyword
  );
  checks.push(keyphraseInIntroCheck);

  // --- Keyphrase in H1 Heading Check with v3.3.14 enhanced logic ---
  const h1Text = scrapedData.headings.find(h => h.level === 1)?.text || '';
  const h1KeywordMatch = checkKeywordMatch(h1Text, keyphrase, secondaryKeywords);
  const h1Check = await createSEOCheck(
    "Keyphrase in H1 Heading",
    () => h1KeywordMatch.found,
    h1KeywordMatch.matchedKeyword ? 
      `Great! The main H1 heading includes the keyword "${h1KeywordMatch.matchedKeyword}".` :
      `Great! The main H1 heading includes the keyphrase "${keyphrase}".`,
    `The H1 heading "${h1Text}" does not contain the keyphrase "${keyphrase}"${secondaryKeywords ? ' or any secondary keywords' : ''}.`,
    h1Text,
    keyphrase,
    env,
    advancedOptions,
    h1KeywordMatch.matchedKeyword
  );
  checks.push(h1Check);

  // --- Keyphrase in H2 Headings Check with v3.3.14 enhanced logic ---
  const h2Text = scrapedData.headings.filter(h => h.level === 2).map(h => h.text).join(' ');
  const h2KeywordMatch = checkKeywordMatch(h2Text, keyphrase, secondaryKeywords);
  const h2Check = await createSEOCheck(
    "Keyphrase in H2 Headings",
    () => h2KeywordMatch.found,
    h2KeywordMatch.matchedKeyword ? 
      `Good! The keyword "${h2KeywordMatch.matchedKeyword}" is found in at least one H2 heading.` :
      `Good! The keyphrase "${keyphrase}" is found in at least one H2 heading.`,
    `H2 headings do not contain the keyphrase "${keyphrase}"${secondaryKeywords ? ' or any secondary keywords' : ''}.`,
    h2Text,
    keyphrase,
    env,
    advancedOptions,
    h2KeywordMatch.matchedKeyword
  );
  checks.push(h2Check);

  // --- Image Alt Attributes Check with v3.3.14 enhanced logic ---
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
      if (env.USE_GPT_RECOMMENDATIONS === 'true' && env.OPENAI_API_KEY) {
        const imageAltResult = await getAIRecommendation(
          imageAltCheck.title,
          keyphrase,
          env,
          `${imagesWithoutAlt.length} image(s) found without alt attributes.`,
          advancedOptions
        );
        imageAltCheck.recommendation = imageAltResult;
      }
    } catch (error) {
      console.error("[SEO Analysis] Error getting AI recommendation for image alt attributes:", error);
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

  // --- Internal Links Check with v3.3.14 enhanced logic ---
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
  
  // --- Outbound Links Check with v3.3.14 enhanced logic ---
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

  // Next-Gen Image Formats Check
  const nextGenImages = scrapedData.images.filter(img => {
    const url = img.src.toLowerCase();
    return url.includes('.webp') || url.includes('.avif') || url.includes('.heic');
  });
  const nextGenPassed = scrapedData.images.length === 0 || (nextGenImages.length / scrapedData.images.length) >= 0.5;
  const nextGenDescription = scrapedData.images.length === 0
    ? "No images found to check."
    : nextGenPassed
      ? `Nice! ${Math.round((nextGenImages.length / scrapedData.images.length) * 100)}% of your images use next-gen formats.`
      : `Consider using next-gen image formats. Only ${nextGenImages.length} out of ${scrapedData.images.length} images use modern formats (WebP, AVIF, HEIC).`;
  checks.push({
    title: "Next-Gen Image Formats",
    description: nextGenDescription,
    passed: nextGenPassed,
    priority: analyzerCheckPriorities["Next-Gen Image Formats"]
  });

  // OG Image Check - check both scraped data and Webflow API data
  let ogImageUrl = '';
  if (useApiData && webflowPageData) {
    ogImageUrl = webflowPageData.openGraphImage || webflowPageData.ogImage || '';
  }
  if (!ogImageUrl) {
    ogImageUrl = scrapedData.ogImage;
  }
  
  const ogImagePassed = Boolean(ogImageUrl && ogImageUrl.trim().length > 0);
  checks.push({
    title: "OG Image",
    description: ogImagePassed 
      ? "Excellent! An Open Graph image is set." 
      : "No Open Graph image found. Recommended for social media sharing. Learn more",
    passed: ogImagePassed,
    priority: analyzerCheckPriorities["OG Image"]
  });

  // OG Title and Description Check - check both scraped data and Webflow API data
  let ogTitleText = '';
  let ogDescText = '';
  
  if (useApiData && webflowPageData) {
    // First check if explicit OG title/description are set
    ogTitleText = webflowPageData.ogTitle || '';
    ogDescText = webflowPageData.ogDescription || '';
    
    // If no specific OG title/description set, check if using page title/description as OG
    if (!ogTitleText && webflowPageData.usesTitleAsOpenGraphTitle) {
      ogTitleText = webflowPageData.title || '';
    }
    if (!ogDescText && webflowPageData.usesDescriptionAsOpenGraphDescription) {
      ogDescText = webflowPageData.metaDescription || '';
    }
  }
  
  // Fallback to scraped data if no API data
  if (!ogTitleText) {
    ogTitleText = scrapedData.title;
  }
  if (!ogDescText) {
    ogDescText = scrapedData.metaDescription;
  }
  
  const ogTitleExists = Boolean(ogTitleText && ogTitleText.trim().length > 0);
  const ogDescExists = Boolean(ogDescText && ogDescText.trim().length > 0);
  const ogTitleDescPassed = ogTitleExists && ogDescExists;
  const ogTitleDescDescription = ogTitleDescPassed
    ? "Perfect! Open Graph title and description are present."
    : !ogTitleExists && !ogDescExists
      ? "Missing both Open Graph title and description."
      : !ogTitleExists
        ? "Missing Open Graph title."
        : "Missing Open Graph description.";
  checks.push({
    title: "OG Title and Description",
    description: ogTitleDescDescription,
    passed: ogTitleDescPassed,
    priority: analyzerCheckPriorities["OG Title and Description"]
  });

  // Heading Hierarchy Check
  const headingLevels = scrapedData.headings.map(h => h.level).sort((a, b) => a - b);
  const hasH1 = headingLevels.includes(1);
  const hasProperHierarchy = hasH1 && headingLevels.every((level, index) => {
    if (index === 0) return true;
    return level <= headingLevels[index - 1] + 1;
  });
  const hierarchyPassed = hasH1 && hasProperHierarchy;
  const hierarchyDescription = !hasH1
    ? "Missing H1 heading. Every page should have exactly one H1."
    : !hasProperHierarchy
      ? "Heading hierarchy has gaps. Headings should follow a logical order (H1, H2, H3, etc.)."
      : "Excellent! Your heading structure follows a logical hierarchy.";
  checks.push({
    title: "Heading Hierarchy",
    description: hierarchyDescription,
    passed: hierarchyPassed,
    priority: analyzerCheckPriorities["Heading Hierarchy"]
  });

  // Code Minification Check
  const minificationResult = analyzeMinification(scrapedData.resources.js, scrapedData.resources.css);
  checks.push({
    title: "Code Minification",
    description: minificationResult.passed
      ? minificationResult.details.length > 0
        ? `Good! ${minificationResult.details.join(', ')}.`
        : "Good! JS and CSS files appear to be minified."
      : `Consider minifying your code. ${minificationResult.details.join(', ')}.`,
    passed: minificationResult.passed,
    priority: analyzerCheckPriorities["Code Minification"]
  });

  // Schema Markup Check
  const schemaMarkupPassed = scrapedData.schemaMarkup.hasSchema;
  const schemaDescription = schemaMarkupPassed
    ? `Great! Found ${scrapedData.schemaMarkup.schemaCount} schema markup${scrapedData.schemaMarkup.schemaCount === 1 ? '' : 's'} (${scrapedData.schemaMarkup.schemaTypes.join(', ')}).`
    : "No schema markup detected. Consider adding structured data to help search engines understand your content.";
  checks.push({
    title: "Schema Markup",
    description: schemaDescription,
    passed: schemaMarkupPassed,
    priority: analyzerCheckPriorities["Schema Markup"]
  });

  // Image File Size Check
  const imageFileSizePassed = scrapedData.images.length === 0 || scrapedData.images.every(img => {
    return !img.size || img.size <= 500000; // 500KB limit
  });
  const imageSizeDescription = scrapedData.images.length === 0
    ? "No images found to check."
    : imageFileSizePassed
      ? "Great job! All your images are well-optimized, keeping your page loading times fast."
      : `Some images are larger than recommended. Consider optimizing images over 500KB for better performance.`;
  checks.push({
    title: "Image File Size",
    description: imageSizeDescription,
    passed: imageFileSizePassed,
    priority: analyzerCheckPriorities["Image File Size"]
  });

  // Calculate final results
  const passedCount = checks.filter(check => check.passed).length;
  const failedCount = checks.length - passedCount;
  const score = calculateSEOScore(checks);

  return {
    checks,
    passedChecks: passedCount,
    failedChecks: failedCount,
    score,
    totalChecks: checks.length,
    url,
    keyphrase,
    isHomePage
  };
}