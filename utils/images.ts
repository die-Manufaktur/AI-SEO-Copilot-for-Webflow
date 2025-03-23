/**
 * Checks if an image URL points to a next-gen image format
 */
export function isNextGenImageFormat(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return lowerUrl.endsWith('.webp') || 
         lowerUrl.endsWith('.avif') || 
         lowerUrl.endsWith('.svg') ||
         lowerUrl.includes('.webp?') ||
         lowerUrl.includes('.avif?') ||
         lowerUrl.includes('.svg?');
}