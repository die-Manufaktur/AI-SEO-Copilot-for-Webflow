/**
 * Browser-compatible HTML sanitizer
 * Replaces sanitize-html which uses Node.js modules
 */

/**
 * Strips all HTML tags from a string, returning only text content.
 * Uses the browser's DOMParser for safe parsing.
 */
export function stripHtmlTags(input: string): string {
  if (!input) return '';
  
  // Use DOMParser to safely parse HTML and extract text
  const doc = new DOMParser().parseFromString(input, 'text/html');
  return doc.body.textContent || '';
}

/**
 * Sanitizes HTML input by removing all tags and attributes.
 * Drop-in replacement for sanitize-html({ allowedTags: [], allowedAttributes: {} })
 */
export function sanitizeHtmlBrowser(
  input: string, 
  _options?: { allowedTags?: string[]; allowedAttributes?: Record<string, string[]>; disallowedTagsMode?: string }
): string {
  return stripHtmlTags(input);
}
