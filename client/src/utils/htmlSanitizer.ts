/**
 * Browser-compatible HTML sanitizer
 * Replaces sanitize-html which uses Node.js modules
 */

/**
 * Strips all HTML tags from a string, returning only text content.
 * Uses regex to avoid DOMParser HTML parsing of untrusted input.
 */
export function stripHtmlTags(input: string): string {
  if (!input) return '';

  // Remove HTML tags using regex without parsing as HTML
  const stripped = input.replace(/<[^>]*>/g, '');
  // Decode common HTML entities
  const textarea = document.createElement('textarea');
  textarea.innerHTML = stripped;
  return textarea.value;
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
