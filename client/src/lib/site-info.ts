/**
 * Retrieves site information from the Webflow API
 * 
 * @returns The site information object, or null if an error occurs
 */
export interface SiteInfo {
  siteId: string;
  siteName: string;
  shortName: string;
  domains: Array<{ url: string; default: boolean }>;
}

/**
 * Retrieves site information from the Webflow API
 */
export async function getSiteInfo(): Promise<SiteInfo | null> {
  try {
    if (!window.webflow?.getSiteInfo) {
      console.warn('Webflow getSiteInfo API not available');
      return null;
    }
    
    const siteInfo = await window.webflow.getSiteInfo();
    return siteInfo as SiteInfo;
  } catch (error) {
    console.error(`Error getting site info: ${error}`);
    return null;
  }
}
