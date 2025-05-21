/**
 * Decodes all HTML entities in a string to their corresponding characters
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  
  // Create a temporary element to leverage the browser's native HTML decoding
  const doc = new DOMParser().parseFromString(text, 'text/html');
  const decodedText = doc.documentElement.textContent || '';
  
  // Handle edge cases that DOMParser might miss
  return decodedText
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#x3D;/g, '=')
    .replace(/&#x60;/g, '`');
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
 * Complete sanitization of text for display and copying
 * Decodes HTML entities and ensures ASCII-only characters
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  return ensureAscii(decodeHtmlEntities(text));
}