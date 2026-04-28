/**
 * Browser-compatible HTML sanitizer
 * Replaces sanitize-html which uses Node.js modules
 */

/**
 * Strips all HTML tags from a string, returning only text content.
 * Uses a looped regex to prevent reassembly attacks (e.g. <scr<script>ipt>)
 * and manual entity decoding to avoid innerHTML sinks.
 */
export function stripHtmlTags(input: string): string {
  if (!input) return '';
  // Loop regex to prevent reassembly attacks like <scr<script>ipt>
  let result = input;
  let previous = '';
  while (result !== previous) {
    previous = result;
    result = result.replace(/<[^>]*>/g, '');
  }
  // Decode common HTML entities without using innerHTML
  // IMPORTANT: &amp; must be decoded LAST to prevent double-unescaping (XSS vector)
  return result
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
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
