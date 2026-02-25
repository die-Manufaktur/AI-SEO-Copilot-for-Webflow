import { createLogger } from './utils';

// Create a namespaced logger for the page slug functionality
const logger = createLogger('PageSlug');

/**
 * Get the current page slug from Webflow
 * @returns The page slug
 */
export async function getPageSlug(): Promise<string> {
  try {
    if (!window.webflow) {
      throw new Error('Webflow API not available');
    }
    const page = await window.webflow.getCurrentPage();
    const pageSlug = await page.getSlug();
    
    // Only log in debug mode as this is diagnostic information
    logger.debug('Page slug retrieved:', pageSlug);
    
    return pageSlug;
  } catch (error) {
    logger.error('Error getting page slug:', error);
    throw new Error('Failed to get page slug');
  }
}
