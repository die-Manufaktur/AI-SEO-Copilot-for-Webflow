import type { SEOAnalysisResult, WebflowPageData, AnalyzeSEORequest } from "../../../shared/types";
import { createLogger } from '../lib/utils';

const logger = createLogger('[API]');
const assetLogger = createLogger('[SEO Assets]');

// Add this near the top of your file
type Asset = {
  url: string;
  alt: string;
  type: string;
  size?: number;
  source?: string;
};

// Helper function to determine the appropriate API URL based on environment
export const getApiBaseUrl = (): string => {
  // For local development environment
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const workerPort = 8787;
    const workerUrl = `http://127.0.0.1:${workerPort}`;
    logger.info(`Using local development worker at ${workerUrl}`);
    return workerUrl;
  }
  
  // Otherwise use production URL
  return 'https://seo-copilot-api.paul-130.workers.dev';
}

// Update the error handling in analyzeSEO function
export async function analyzeSEO({
  keyphrase,
  url,
  isHomePage,
  siteInfo,
  publishPath,
  webflowPageData,
  debug = true
}: AnalyzeSEORequest): Promise<SEOAnalysisResult> {
  const apiBaseUrl = getApiBaseUrl();
  console.log("[SEO Analyzer] Starting analysis with API endpoint:", apiBaseUrl);
  
  // Collect image assets with size information
  const pageAssets = await collectPageAssets();
  console.log(`[SEO Analyzer] Collected ${pageAssets.length} assets with size information`);
  
  // Identify which images are potentially from collections
  if (webflowPageData?.designerImages) {
    const designerImageUrls = new Set(webflowPageData.designerImages.map((img: { url: string }) => 
      new URL(img.url).pathname.split('/').pop()?.toLowerCase() || ''));
    
    // Mark collection images (any images not found in designer data)
    pageAssets.forEach(asset => {
      if (asset.type === 'image') {
        // Extract filename for comparison
        const filename = new URL(asset.url, window.location.origin).pathname.split('/').pop()?.toLowerCase() || '';
        // If image isn't found in designer data, mark it as collection
        asset.source = designerImageUrls.has(filename) ? 'designer' : 'collection';
      }
    });
    
    const collectionImages = pageAssets.filter(asset => asset.source === 'collection');
    console.log(`[SEO Analyzer] Identified ${collectionImages.length} potential collection images`);
  }
  
  try {
    // Add retry logic for local development
    let retryCount = 0;
    const maxRetries = 2;
    let response: Response | null = null;
    
    while (retryCount <= maxRetries) {
      try {
        response = await fetch(`${apiBaseUrl}/api/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            keyphrase,
            url,
            isHomePage,
            siteInfo,
            publishPath,
            webflowPageData,
            pageAssets,
            debug
          })
        });
        
        // Exit retry loop if successful
        break;
      } catch (fetchError) {
        console.warn(`[SEO Analyzer] Retry ${retryCount + 1}/${maxRetries + 1} failed:`, fetchError);
        retryCount++;
        
        if (retryCount > maxRetries) {
          throw fetchError;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!response || !response.ok) {
      const status = response?.status || 'unknown';
      
      if (status === 404) {
        console.error('[SEO Analyzer] API endpoint not found. Check if worker is running and the /api/analyze endpoint is defined.');
      }
      
      throw new Error(`API returned status code ${status}`);
    }

    const data: SEOAnalysisResult = await response.json();
    return data;
  } catch (error: unknown) {
    console.error("[SEO Analyzer] Fetch error:", error);
    throw error instanceof Error
      ? new Error(`SEO Analysis failed: ${error.message}`)
      : new Error("An unknown error occurred during SEO analysis.");
  }
}

export async function fetchOAuthToken(authCode: string): Promise<string> {
  const response = await fetch('/api/oauth/callback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code: authCode }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch OAuth token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.token;
}

/**
 * Register domains with the server to be added to the allowlist
 * @param domains Array of domain URLs to register
 * @returns Response from server
 */
export async function registerDomains(domains: string[]): Promise<{ success: boolean; message: string }> {
  const baseUrl = getApiBaseUrl();
  
  try {
    const response = await fetch(`${baseUrl}/api/register-domains`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ domains })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { 
        success: false, 
        message: data.message || "Failed to register domains" 
      };
    }

    return { 
      success: true, 
      message: data.message || "Domains registered successfully" 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Error registering domains: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Collects all page assets including collection images and background images
 * @returns Array of page assets with metadata
 */
export async function collectPageAssets(): Promise<Asset[]> {
  const assets: Asset[] = [];
  const processedUrls = new Set<string>();
  const baseUrl = new URL(window.location.href);
  
  try {
    assetLogger.info('Starting comprehensive collection of page assets');
    
    // 1. Try to get images from Webflow page data first
    try {
      const pageData = await getWebflowPageData();
      if (pageData && pageData.ogImage) {
        assetLogger.info(`Found OG image: ${pageData.ogImage}`);
        const asset: Asset = {
          url: pageData.ogImage,
          alt: 'OG Image',
          type: 'image',
          source: 'webflow-meta'
        };
        
        // Try to get size but don't block if it fails
        const size = await getImageSize(pageData.ogImage, baseUrl);
        if (size) {
          asset.size = size;
          assetLogger.info(`OG image size: ${formatBytes(size)}`);
        }
        
        assets.push(asset);
        processedUrls.add(pageData.ogImage);
      }
    } catch (error) {
      assetLogger.error(`Error getting Webflow page data: ${error}`);
    }
    
    // 2. Get all <img> elements (standard approach)
    const imgElements = Array.from(document.querySelectorAll('img'));
    assetLogger.info(`Found ${imgElements.length} standard img elements`);
    
    // Process standard <img> elements
    for (const img of imgElements) {
      const src = img.getAttribute('src');
      
      if (!src) {
        assetLogger.info(`Skipping image with no src attribute`);
        continue;
      }
      
      if (src.startsWith('data:')) {
        assetLogger.info(`Skipping data URI image`);
        continue;
      }
      
      if (processedUrls.has(src)) {
        assetLogger.info(`Skipping duplicate image URL: ${src}`);
        continue;
      }
      
      processedUrls.add(src);
      
      // Create the asset first, then try to get size
      const asset: Asset = {
        url: src,
        alt: img.getAttribute('alt') || '',
        type: 'image'
      };
      
      // Try to get size but don't block if it fails
      try {
        const size = await getImageSize(src, baseUrl);
        if (size) {
          asset.size = size;
          assetLogger.info(`Image size for ${src}: ${formatBytes(size)}`);
        } else {
          assetLogger.info(`Could not determine size for ${src}`);
        }
      } catch (sizeError) {
        assetLogger.error(`Error getting size for ${src}: ${sizeError}`);
      }
      
      assets.push(asset);
      assetLogger.info(`Added image: ${src}`);
    }
    
    // 3. Get background images (if any)
    try {
      const allElements = document.querySelectorAll('*');
      let bgImagesFound = 0;
      
      for (const element of Array.from(allElements)) {
        const style = window.getComputedStyle(element);
        const bgImage = style.backgroundImage;
        
        if (bgImage && bgImage !== 'none') {
          // Extract URL from "url('...')" format
          const match = bgImage.match(/url\(['"]?(.*?)['"]?\)/);
          if (match && match[1] && !match[1].startsWith('data:')) {
            const bgUrl = match[1];
            if (!processedUrls.has(bgUrl)) {
              processedUrls.add(bgUrl);
              
              // Create the asset first, then try to get size
              const asset: Asset = {
                url: bgUrl,
                alt: '',
                type: 'background-image'
              };
              
              // Try to get size but don't block if it fails
              try {
                const size = await getImageSize(bgUrl, baseUrl);
                if (size) {
                  asset.size = size;
                  assetLogger.info(`Background image size for ${bgUrl}: ${formatBytes(size)}`);
                }
              } catch (sizeError) {
                assetLogger.error(`Error getting size for ${bgUrl}: ${sizeError}`);
              }
              
              assets.push(asset);
              bgImagesFound++;
            }
          }
        }
      }
      assetLogger.info(`Found ${bgImagesFound} elements with background images`);
    } catch (error) {
      assetLogger.error(`Error getting background images: ${error}`);
    }
    
    // Log result summary
    assetLogger.info(`Final assets array length: ${assets.length}`);
    if (assets.length === 0) {
      assetLogger.warn('No assets were collected, something may be wrong');
    } else {
      assetLogger.info('First asset for verification:', assets[0]);
      if (assets[0].size) {
        assetLogger.info(`Size: ${formatBytes(assets[0].size)}`);
      }
    }
    
    assetLogger.info(`Successfully collected ${assets.length} total assets with metadata`);
    assetLogger.info('Assets with sizes:', assets.filter(a => a.size !== undefined).length);
  } catch (error) {
    assetLogger.error(`Error in collectPageAssets: ${error}`);
  }
  
  return assets;
}

// Helper function to get Webflow page data
async function getWebflowPageData() {
  if (typeof webflow === 'undefined') {
    return null;
  }
  
  try {
    const currentPage = await webflow.getCurrentPage();
    return {
      ogImage: await currentPage.getOpenGraphImage()
    };
  } catch (error) {
    assetLogger.error(`Error in getWebflowPageData: ${error}`);
    return null;
  }
}

/**
 * Gets the size of an image, with fallback mechanisms
 * @param imageUrl The URL of the image
 * @param baseUrl The base URL for resolving relative URLs
 * @returns The size of the image in bytes, or undefined if unable to determine
 */
async function getImageSize(imageUrl: string, baseUrl: URL): Promise<number | undefined> {
  try {
    // Resolve relative URLs
    const fullUrl = new URL(imageUrl, baseUrl.origin).toString();

    // First try: HEAD request (most efficient)
    try {
      const response = await fetch(fullUrl, { 
        method: 'HEAD',
        cache: 'no-store'
      });
      
      if (response.ok) {
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
          return parseInt(contentLength, 10);
        }
      }
    } catch (headError) {
      assetLogger.debug(`HEAD request failed for ${imageUrl}: ${headError}`);
      // Continue to fallback
    }
    
    // Second try: XHR fallback (better CORS handling for binary data)
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', fullUrl, true);
      xhr.responseType = 'blob';
      
      xhr.onload = function() {
        if (xhr.status === 200) {
          resolve(xhr.response.size);
        } else {
          resolve(undefined);
        }
      };
      
      xhr.onerror = function() {
        resolve(undefined);
      };
      
      xhr.send();
      
      // Set timeout in case request hangs
      setTimeout(() => resolve(undefined), 5000);
    });
  } catch (error) {
    assetLogger.error(`Error getting size for image ${imageUrl}: ${error}`);
    return undefined;
  }
}

/**
 * Format bytes to a human-readable string
 * @param bytes The number of bytes
 * @returns Formatted string (e.g. "1.5 KB")
 */
function formatBytes(bytes?: number): string {
  if (!bytes) return "Unknown size";

  if (bytes < 1024) return bytes + " bytes";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  else return (bytes / 1048576).toFixed(1) + " MB";
}

// In the fetchFromAPI function
export async function fetchFromAPI<T>(endpoint: string, data: any): Promise<T> {
  // Get worker URL from environment or use local development worker
  const workerUrl = import.meta.env.VITE_WORKER_URL || 'http://127.0.0.1:8787';
  logger.info(`Using worker at ${workerUrl}`);
  
  try {
    logger.debug(`Sending request to ${workerUrl}${endpoint}`, data);
    const response = await fetch(`${workerUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    logger.debug(`Got response with status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`API error (${response.status}): ${errorText}`);
      throw new Error(`API error: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    return result as T;
  } catch (error) {
    logger.error(`API fetch error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}
