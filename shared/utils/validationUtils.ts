/**
 * Shared validation utilities used across client and worker modules
 */

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate keyphrase content
 */
export function validateKeyphrase(keyphrase: string): boolean {
  return typeof keyphrase === 'string' && 
         keyphrase.trim().length > 0 && 
         keyphrase.length <= 200; // Reasonable max length
}

/**
 * Sanitize and validate secondary keywords
 */
export function validateSecondaryKeywords(secondaryKeywords?: string): string | undefined {
  if (!secondaryKeywords || typeof secondaryKeywords !== 'string') {
    return undefined;
  }
  
  const cleaned = secondaryKeywords.trim();
  if (cleaned.length === 0) {
    return undefined;
  }
  
  // Split, clean, and rejoin keywords
  const keywords = cleaned
    .split(',')
    .map(k => k.trim())
    .filter(k => k.length > 0 && k.length <= 100) // Max 100 chars per keyword
    .slice(0, 10); // Max 10 secondary keywords
  
  return keywords.length > 0 ? keywords.join(', ') : undefined;
}