import { 
  SEOCheck,
  ScrapedPageData,
  WebflowPageData,
  SEOAnalysisResult
} from '../../shared/types/index';
import { shortenFileName } from '../../shared/utils/fileUtils';
import { sanitizeText } from '../../shared/utils/stringUtils';
import { shouldShowCopyButton } from '../../shared/utils/seoUtils';

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