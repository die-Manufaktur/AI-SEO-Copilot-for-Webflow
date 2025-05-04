import type { SEOAnalysisResult, WebflowPageData, AnalyzeSEORequest } from "../../../shared/types";

// Helper function to determine the appropriate API URL based on environment
export const getApiBaseUrl = (): string => {
  // For local development environment
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const workerPort = 8787;
    const workerUrl = `http://127.0.0.1:${workerPort}`;
    console.log(`[API] Using local development worker at ${workerUrl}`);
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
export async function collectPageAssets(): Promise<Array<{ url: string, alt: string, type: string, size?: number, mimeType?: string, source?: string }>> {
  const assets: Array<{ url: string, alt: string, type: string, size?: number, mimeType?: string, source?: string }> = [];
  const processedUrls = new Set<string>();
  
  try {
    console.log('[SEO Assets] Starting comprehensive collection of page assets');
    
    // 1. Get all <img> elements
    const imgElements = Array.from(document.querySelectorAll('img'));
    console.log(`[SEO Assets] Found ${imgElements.length} standard img elements`);
    
    // 2. Get all <picture> elements and their source/img children
    const pictureElements = Array.from(document.querySelectorAll('picture source'));
    console.log(`[SEO Assets] Found ${pictureElements.length} picture source elements`);
    
    // 3. Get all elements with background images
    const elementsWithBackgroundImage: Element[] = [];
    
    // Walk through all elements to find those with background images
    const walkDOM = (node: Element): void => {
      // Check computed style for background image
      const style = window.getComputedStyle(node);
      const bgImage = style.backgroundImage;
      
      if (bgImage && bgImage !== 'none' && !bgImage.includes('gradient')) {
        elementsWithBackgroundImage.push(node);
      }
      
      // Recursively check children (limited depth to avoid performance issues)
      if (node.children.length > 0 && elementsWithBackgroundImage.length < 100) {
        Array.from(node.children).forEach(child => walkDOM(child as Element));
      }
    };
    
    // Only scan a sample of the DOM for background images to avoid performance issues
    const mainElements = Array.from(document.querySelectorAll('main, header, footer, section, .w-container, .container'));
    if (mainElements.length > 0) {
      mainElements.forEach(el => walkDOM(el));
    } else {
      walkDOM(document.body);
    }
    
    console.log(`[SEO Assets] Found ${elementsWithBackgroundImage.length} elements with background images`);
    
    // 4. Process <img> elements
    for (const img of imgElements) {
      const src = img.getAttribute('src');
      if (!src || src.startsWith('data:') || processedUrls.has(src)) continue;
      
      processedUrls.add(src);
      
      try {
        // Fetch image for size and type information
        const response = await fetch(src, { method: 'HEAD' });
        const contentLength = response.headers.get('content-length');
        const contentType = response.headers.get('content-type');
        
        assets.push({
          url: src,
          alt: img.getAttribute('alt') || '',
          type: 'image',
          size: contentLength ? parseInt(contentLength, 10) : undefined,
          mimeType: contentType || undefined
        });
      } catch (error) {
        // Still include image without size info on fetch error
        assets.push({
          url: src,
          alt: img.getAttribute('alt') || '',
          type: 'image'
        });
      }
      
      // Also process srcset if available
      const srcset = img.getAttribute('srcset');
      if (srcset) {
        const srcsetUrls = srcset.split(',')
          .map(s => s.trim().split(' ')[0])
          .filter(url => url && !url.startsWith('data:') && !processedUrls.has(url));
          
        for (const srcsetUrl of srcsetUrls) {
          if (processedUrls.has(srcsetUrl)) continue;
          processedUrls.add(srcsetUrl);
          
          try {
            const response = await fetch(srcsetUrl, { method: 'HEAD' });
            const contentLength = response.headers.get('content-length');
            const contentType = response.headers.get('content-type');
            
            assets.push({
              url: srcsetUrl,
              alt: img.getAttribute('alt') || '',
              type: 'image',
              size: contentLength ? parseInt(contentLength, 10) : undefined,
              mimeType: contentType || undefined
            });
          } catch (error) {
            assets.push({
              url: srcsetUrl,
              alt: img.getAttribute('alt') || '',
              type: 'image'
            });
          }
        }
      }
    }
    
    // 5. Process <picture> source elements
    for (const source of pictureElements) {
      const srcset = source.getAttribute('srcset');
      if (!srcset) continue;
      
      const srcsetUrls = srcset.split(',')
        .map(s => s.trim().split(' ')[0])
        .filter(url => url && !url.startsWith('data:') && !processedUrls.has(url));
        
      for (const srcsetUrl of srcsetUrls) {
        if (processedUrls.has(srcsetUrl)) continue;
        processedUrls.add(srcsetUrl);
        
        try {
          const response = await fetch(srcsetUrl, { method: 'HEAD' });
          const contentLength = response.headers.get('content-length');
          const contentType = response.headers.get('content-type');
          
          // Find the img element in the same picture to get alt text
          const parentPicture = source.closest('picture');
          const imgInPicture = parentPicture?.querySelector('img');
          const alt = imgInPicture?.getAttribute('alt') || '';
          
          assets.push({
            url: srcsetUrl,
            alt: alt,
            type: 'image',
            size: contentLength ? parseInt(contentLength, 10) : undefined,
            mimeType: contentType || undefined
          });
        } catch (error) {
          const parentPicture = source.closest('picture');
          const imgInPicture = parentPicture?.querySelector('img');
          const alt = imgInPicture?.getAttribute('alt') || '';
          
          assets.push({
            url: srcsetUrl,
            alt: alt,
            type: 'image'
          });
        }
      }
    }
    
    // 6. Process background images
    for (const element of elementsWithBackgroundImage) {
      const style = window.getComputedStyle(element);
      const bgImage = style.backgroundImage;
      
      // Extract URLs from background-image
      const urlMatches = bgImage.match(/url\(['"]?([^'"()]+)['"]?\)/g) || [];
      
      for (const urlMatch of urlMatches) {
        const url = urlMatch.replace(/url\(['"]?([^'"()]+)['"]?\)/, '$1');
        if (!url || url.startsWith('data:') || processedUrls.has(url)) continue;
        processedUrls.add(url);
        
        try {
          const response = await fetch(url, { method: 'HEAD' });
          const contentLength = response.headers.get('content-length');
          const contentType = response.headers.get('content-type');
          
          assets.push({
            url: url,
            alt: element.getAttribute('aria-label') || element.getAttribute('title') || element.textContent?.trim().substring(0, 50) || '',
            type: 'background-image',
            size: contentLength ? parseInt(contentLength, 10) : undefined,
            mimeType: contentType || undefined
          });
        } catch (error) {
          assets.push({
            url: url,
            alt: element.getAttribute('aria-label') || element.getAttribute('title') || element.textContent?.trim().substring(0, 50) || '',
            type: 'background-image'
          });
        }
      }
    }
    
    // 7. Look for inline SVGs
    const svgElements = Array.from(document.querySelectorAll('svg'));
    console.log(`[SEO Assets] Found ${svgElements.length} inline SVG elements`);
    
    for (const svg of svgElements) {
      const title = svg.querySelector('title')?.textContent || '';
      const desc = svg.querySelector('desc')?.textContent || '';
      const ariaLabel = svg.getAttribute('aria-label') || '';
      const svgId = svg.id;
      
      // Only include significant SVGs (larger than icons)
      const { width, height } = svg.getBoundingClientRect();
      if (width >= 50 || height >= 50) {
        assets.push({
          url: `#svg-${svgId || assets.length}`,
          alt: title || desc || ariaLabel || '',
          type: 'svg',
          mimeType: 'image/svg+xml'
        });
      }
    }
    
    console.log(`[SEO Assets] Successfully collected ${assets.length} total assets with metadata`);
  } catch (error) {
    console.error('[SEO Assets] Error collecting page assets:', error);
  }
  
  return assets;
}
