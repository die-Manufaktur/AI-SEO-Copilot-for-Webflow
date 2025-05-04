/**
 * Shortens a filename to a specified maximum length while preserving the extension
 * @param filename The original filename
 * @param maxLength Maximum length for the name part (excluding extension)
 * @returns Shortened filename with preserved extension
 */
export function shortenFileName(filename: string, maxLength: number = 10): string {
  const lastDot = filename.lastIndexOf('.');
  
  // If no extension or just a hidden file (starts with .)
  if (lastDot === -1 || lastDot === 0) {
    return filename.length <= maxLength ? filename : filename.substring(0, maxLength) + '...';
  }
  
  const name = filename.substring(0, lastDot);
  const extension = filename.substring(lastDot);
  
  if (name.length <= maxLength) {
    return filename;
  }
  
  return name.substring(0, maxLength) + '...' + extension;
}