/**
 * Decodes HTML entities in a string
 * @param html The HTML string containing entities to decode
 * @returns The string with HTML entities decoded
 */
export function decodeHtmlEntities(html: string): string {
  // Check if running in browser or Node.js environment
  if (typeof DOMParser !== 'undefined') {
    // Browser environment - use DOMParser
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  } else {
    // Node.js environment - use simple replacement
    return html
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Add other common entities as needed
      .replace(/&#x2F;/g, '/')
      .replace(/&#x3D;/g, '=')
      .replace(/&amp;/g, '&'); // Must be last to prevent double-unescaping
  }
}

/**
 * Ensures a string contains only ASCII characters, replacing common Unicode with ASCII equivalents
 */
export function ensureAscii(text: string): string {
  if (!text) return '';
  
  return text
    // Replace smart/curly quotes with straight quotes
    .replace(/[\u2018\u2019]/g, "'") 
    .replace(/[\u201C\u201D]/g, '"')
    // Replace en/em dashes with hyphens
    .replace(/[\u2013\u2014]/g, '-')
    // Replace ellipsis with three periods
    .replace(/\u2026/g, '...')
    // Replace non-breaking space with regular space
    .replace(/\u00A0/g, ' ')
    // Replace bullets with asterisks
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '*')
    // Remove zero-width spaces, soft hyphens, etc.
    .replace(/[\u200B-\u200F\u2060\uFEFF\u00AD]/g, '')
    // Finally, strip any remaining non-ASCII characters
    .replace(/[^\x00-\x7F]/g, '');
}

/**
 * Languages that require Unicode character preservation
 */
const UNICODE_LANGUAGES = ['ja', 'zh', 'ko', 'ru', 'ar', 'th', 'hi', 'he', 'fa'];

/**
 * Check if a language code needs Unicode character preservation
 */
function needsUnicodePreservation(languageCode?: string): boolean {
  if (!languageCode) return false;
  // Special flag to preserve Unicode when language context is unknown
  if (languageCode === 'preserve-unicode') return true;
  return UNICODE_LANGUAGES.includes(languageCode.toLowerCase());
}

/**
 * Complete sanitization of text for display and copying
 * Decodes HTML entities and optionally preserves Unicode characters for multilingual support
 */
export function sanitizeText(text: string, languageCode?: string): string {
  if (!text) return '';
  
  const decoded = decodeHtmlEntities(text);
  
  // Preserve Unicode characters for languages that need them
  if (needsUnicodePreservation(languageCode)) {
    // Only do basic cleanup for Unicode languages
    return decoded
      // Remove zero-width spaces, soft hyphens, etc.
      .replace(/[\u200B-\u200F\u2060\uFEFF\u00AD]/g, '')
      // Remove control characters except newlines and tabs
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .trim();
  }
  
  // For Latin-based languages, apply ASCII conversion but preserve common accented characters
  return decoded
    // Replace smart/curly quotes with straight quotes
    .replace(/[\u2018\u2019]/g, "'") 
    .replace(/[\u201C\u201D]/g, '"')
    // Replace en/em dashes with hyphens
    .replace(/[\u2013\u2014]/g, '-')
    // Replace ellipsis with three periods
    .replace(/\u2026/g, '...')
    // Replace non-breaking space with regular space
    .replace(/\u00A0/g, ' ')
    // Replace bullets with asterisks
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '*')
    // Remove zero-width spaces, soft hyphens, etc.
    .replace(/[\u200B-\u200F\u2060\uFEFF\u00AD]/g, '')
    // Remove control characters except newlines and tabs
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    // Keep common accented characters for European languages (À-ÿ range)
    // Remove other non-ASCII characters but preserve European accents
    .replace(/[^\x00-\x7F\u00C0-\u00FF]/g, '')
    .trim();
}

/**
 * Strips wrapping quote characters (", ', `) that LLMs sometimes add to responses
 * despite instructions not to. Only strips if the same character wraps both ends.
 * Should run after sanitizeText so curly quotes have already been normalised to straight quotes.
 */
export function stripWrappingQuotes(text: string): string {
  if (!text) return text;
  return text.replace(/^(["'`])([\s\S]+)\1$/, '$2').trim();
}

/**
 * Sanitize input specifically for AI prompts to prevent prompt injection
 */
export function sanitizeForAI(input: string, languageCode?: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return sanitizeText(input, languageCode)
    // Remove prompt injection keywords (case insensitive)
    .replace(/\b(ignore|forget|override|system|prompt|instruction|assistant|ai|model|openai|gpt|claude)\s*(previous|above|below|this|that|all|instructions?)\b/gi, '')
    // Remove template/injection patterns
    .replace(/[{}[\]]/g, '')
    // Remove excessive punctuation that might be used for injection
    .replace(/[!@#$%^&*()+=|\\:";'<>?,.\/]{3,}/g, '')
    // Limit length for AI prompts
    .substring(0, 1000)
    .trim();
}

/**
 * Sanitize keywords for safe storage and processing
 */
export function sanitizeKeywords(input: string, languageCode?: string): string {
  if (!input || typeof input !== 'string') return '';
  
  let sanitized = sanitizeText(input, languageCode);
  
  // Iterative HTML tag removal to prevent bypass attempts
  // This handles cases like <<script>alert()</script> or <scr<script>ipt>
  let previousLength: number;
  do {
    previousLength = sanitized.length;
    // Remove HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');
    // Remove any remaining HTML entities that could form tags
    sanitized = sanitized.replace(/&lt;[^&]*&gt;/gi, '');
    // Remove partial HTML entities and malformed tags
    sanitized = sanitized.replace(/&[#a-zA-Z0-9]+;?/g, '');
  } while (sanitized.length !== previousLength && sanitized.includes('<'));
  
  return sanitized
    .substring(0, 500) // Limit length
    .trim();
}