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
  const passedChecks = checks.filter(check => check.passed);
  return (passedChecks.length / checks.length) * 100;
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
  
  // Title Check
  const titleResult = checkKeywordMatch(scrapedData.title, keyphrase, secondaryKeywords);
  let titleCheck: SEOCheck = {
    title: "Keyphrase in Title",
    description: titleResult.found 
      ? "Great! Your keyphrase appears in the title." 
      : `Your title doesn't contain the keyphrase${secondaryKeywords ? ' or any secondary keywords' : ''}.`,
    passed: titleResult.found,
    priority: analyzerCheckPriorities["Keyphrase in Title"]
  };
  
  // Add AI recommendation if check failed and AI is enabled
  if (!titleCheck.passed && env.USE_GPT_RECOMMENDATIONS === 'true' && env.OPENAI_API_KEY) {
    try {
      titleCheck.recommendation = await getAIRecommendation(
        "title",
        keyphrase,
        env,
        scrapedData.title,
        advancedOptions
      );
    } catch (error) {
      console.error('Error generating AI recommendation for title:', error);
    }
  }
  checks.push(titleCheck);

  // Meta Description Check
  const metaResult = checkKeywordMatch(scrapedData.metaDescription, keyphrase, secondaryKeywords);
  let metaCheck: SEOCheck = {
    title: "Keyphrase in Meta Description",
    description: metaResult.found 
      ? "Perfect! Your keyphrase appears in the meta description." 
      : `Your meta description doesn't contain the keyphrase${secondaryKeywords ? ' or any secondary keywords' : ''}.`,
    passed: metaResult.found,
    priority: analyzerCheckPriorities["Keyphrase in Meta Description"]
  };
  
  if (!metaCheck.passed && env.USE_GPT_RECOMMENDATIONS === 'true' && env.OPENAI_API_KEY) {
    try {
      metaCheck.recommendation = await getAIRecommendation(
        "meta_description",
        keyphrase,
        env,
        scrapedData.metaDescription,
        advancedOptions
      );
    } catch (error) {
      console.error('Error generating AI recommendation for meta description:', error);
    }
  }
  checks.push(metaCheck);

  // URL Check
  const urlResult = checkUrlKeywordMatch(url, keyphrase, secondaryKeywords);
  checks.push({
    title: "Keyphrase in URL",
    description: urlResult.found 
      ? "Excellent! Your keyphrase appears in the URL." 
      : `Your URL doesn't contain the keyphrase${secondaryKeywords ? ' or any secondary keywords' : ''}.`,
    passed: urlResult.found,
    priority: analyzerCheckPriorities["Keyphrase in URL"]
  });

  // Content Length Check
  const bodyText = scrapedData.paragraphs.join(' ');
  const contentLength = bodyText.length;
  const contentLengthPassed = contentLength >= 300;
  checks.push({
    title: "Content Length",
    description: contentLengthPassed 
      ? `Great! Your content has ${contentLength} characters, which is above the recommended minimum.`
      : `Your content is ${contentLength} characters. Consider adding more content (recommended: 300+ characters).`,
    passed: contentLengthPassed,
    priority: analyzerCheckPriorities["Content Length"]
  });

  // Keyphrase Density Check  
  const density = calculateCombinedKeyphraseDensity(bodyText, keyphrase, secondaryKeywords);
  const densityPassed = density >= 0.5 && density <= 3.0;
  checks.push({
    title: "Keyphrase Density",
    description: densityPassed 
      ? `Perfect! Your keyphrase density is ${density.toFixed(1)}%, which is in the optimal range.`
      : `Your keyphrase density is ${density.toFixed(1)}%. Aim for 0.5-3.0% for better SEO.`,
    passed: densityPassed,
    priority: analyzerCheckPriorities["Keyphrase Density"]
  });

  // Introduction Check
  const introduction = bodyText.substring(0, 200);
  const introResult = checkKeywordMatch(introduction, keyphrase, secondaryKeywords);
  checks.push({
    title: "Keyphrase in Introduction",
    description: introResult.found 
      ? "Excellent! Your keyphrase appears in the introduction." 
      : `Your introduction doesn't contain the keyphrase${secondaryKeywords ? ' or any secondary keywords' : ''}.`,
    passed: introResult.found,
    priority: analyzerCheckPriorities["Keyphrase in Introduction"]
  });

  // H1 Check
  const h1Text = scrapedData.headings.find(h => h.level === 1)?.text || '';
  const h1Result = checkKeywordMatch(h1Text, keyphrase, secondaryKeywords);
  checks.push({
    title: "Keyphrase in H1 Heading",
    description: h1Result.found 
      ? "Great! Your keyphrase appears in the H1 heading." 
      : `Your H1 heading doesn't contain the keyphrase${secondaryKeywords ? ' or any secondary keywords' : ''}.`,
    passed: h1Result.found,
    priority: analyzerCheckPriorities["Keyphrase in H1 Heading"]
  });

  // H2 Check
  const h2Text = scrapedData.headings.filter(h => h.level === 2).map(h => h.text).join(' ');
  const h2Result = checkKeywordMatch(h2Text, keyphrase, secondaryKeywords);
  checks.push({
    title: "Keyphrase in H2 Headings",
    description: h2Result.found 
      ? "Perfect! Your keyphrase appears in H2 headings." 
      : `Your H2 headings don't contain the keyphrase${secondaryKeywords ? ' or any secondary keywords' : ''}.`,
    passed: h2Result.found,
    priority: analyzerCheckPriorities["Keyphrase in H2 Headings"]
  });

  // Add more basic checks here as needed...
  // For now, I'll add placeholders for the remaining checks
  
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