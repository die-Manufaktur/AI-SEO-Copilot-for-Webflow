import { Webflow } from 'webflow-api';

export async function getPageSlug(): Promise<string> {
  try {
    // Get the current page
    const currentPage = await webflow.getCurrentPage() as Page;
    
    // Get the slug of the page
    const pageSlug = await currentPage.getSlug();
    
    console.log('Page Slug:', pageSlug);
    return pageSlug;
  } catch (error) {
    console.error('Error getting page slug:', error);
    throw new Error('Failed to get page slug');
  }
}
