/**
 * Shared formatting utilities used across client and worker modules
 */

/**
 * Format bytes to a human-readable string
 * @param bytes The number of bytes
 * @returns Formatted string (e.g. "1.5 KB")
 */
export function formatBytes(bytes?: number): string {
  if (!bytes) return "Unknown size";

  if (bytes < 1024) return bytes + " bytes";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  else return (bytes / 1048576).toFixed(1) + " MB";
}

/**
 * Format a URL by removing protocol and trailing slash for display
 * @param url The URL to format
 * @returns Formatted URL string
 */
export function formatUrl(url: string): string {
  if (!url) return '';
  
  return url
    .replace(/^https?:\/\//, '') // Remove protocol
    .replace(/\/$/, ''); // Remove trailing slash
}

/**
 * Format a number with thousand separators
 * @param num The number to format
 * @returns Formatted number string (e.g. "1,234")
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}