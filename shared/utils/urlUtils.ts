/**
 * Shared URL utilities used across client and worker modules
 */

/**
 * Extract domain from URL string
 * @param url URL string (with or without protocol)
 * @returns Domain name or empty string if invalid
 */
export function extractDomainFromUrl(url: string): string {
  try {
    // Add protocol if missing
    const urlWithProtocol = url.startsWith("http")
      ? url
      : `https://${url}`;
    const urlObj = new URL(urlWithProtocol);
    return urlObj.hostname;
  } catch (e) {
    console.warn("Invalid URL:", url);
    return "";
  }
}

/**
 * Extracts text after the first colon in a string.
 * Returns the original string if no colon is found.
 * @param text The input string.
 * @returns The text after the first colon, trimmed, or the original string.
 */
export function extractTextAfterColon(text: string | undefined | null): string {
  if (!text) {
    return "";
  }
  const colonIndex = text.indexOf(":");
  if (colonIndex === -1) {
    return text.trim(); // Return trimmed original if no colon
  }
  return text.substring(colonIndex + 1).trim();
}

/**
 * Normalize URL by removing trailing slashes and standardizing format
 * @param url The URL to normalize
 * @returns Normalized URL
 */
export function normalizeUrl(url: string): string {
  if (!url) return '';
  
  try {
    const urlObj = new URL(url);
    // Remove trailing slash unless it's the root path
    const pathname = urlObj.pathname === '/' ? '/' : urlObj.pathname.replace(/\/$/, '');
    return `${urlObj.protocol}//${urlObj.host}${pathname}${urlObj.search}${urlObj.hash}`;
  } catch {
    return url;
  }
}