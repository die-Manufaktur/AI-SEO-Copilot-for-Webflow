/**
 * Webflow Designer API Detection and Compatibility Layer
 * TDD approach to properly detect available Designer APIs
 */

export interface WebflowDesignerCapabilities {
  canReadPageInfo: boolean;
  canUpdatePageTitle: boolean;
  canUpdatePageMeta: boolean;
  canUpdatePageSlug: boolean;
  canAddCustomCode: boolean;
  canUpdateCMS: boolean;
  canManipulateElements: boolean;
  canSelectElements: boolean;
  hasElementBuilder: boolean;
  availableMethods: string[];
}

/**
 * Detect what Webflow Designer APIs are actually available
 */
export function detectWebflowDesignerCapabilities(): WebflowDesignerCapabilities {
  const capabilities: WebflowDesignerCapabilities = {
    canReadPageInfo: false,
    canUpdatePageTitle: false,
    canUpdatePageMeta: false,
    canUpdatePageSlug: false,
    canAddCustomCode: false,
    canUpdateCMS: false,
    canManipulateElements: false,
    canSelectElements: false,
    hasElementBuilder: false,
    availableMethods: [],
  };

  if (typeof window === 'undefined' || !window.webflow) {
    console.log('[WebflowDesignerDetection] No window.webflow object found');
    return capabilities;
  }

  // Deep inspection of window.webflow
  console.log('[WebflowDesignerDetection] === WEBFLOW API INSPECTION ===');
  console.log('[WebflowDesignerDetection] typeof window.webflow:', typeof window.webflow);
  console.log('[WebflowDesignerDetection] window.webflow:', window.webflow);
  
  // Get all properties (including non-enumerable ones)
  const webflowProps = Object.getOwnPropertyNames(window.webflow);
  const webflowMethods = webflowProps.filter(prop => {
    try {
      return typeof (window.webflow as any)[prop] === 'function';
    } catch (e) {
      return false;
    }
  });
  
  console.log('[WebflowDesignerDetection] Available webflow properties:', webflowProps);
  console.log('[WebflowDesignerDetection] Available webflow methods:', webflowMethods);
  
  // Try to inspect each method
  webflowMethods.forEach(method => {
    try {
      const fn = (window.webflow as any)[method];
      console.log(`[WebflowDesignerDetection] Method '${method}':`, {
        type: typeof fn,
        length: fn.length,
        name: fn.name,
        toString: fn.toString().substring(0, 200) + '...'
      });
    } catch (e) {
      console.log(`[WebflowDesignerDetection] Method '${method}': inspection failed`, e);
    }
  });
  
  // Check for prototype methods
  if (window.webflow.constructor && window.webflow.constructor.prototype) {
    const protoMethods = Object.getOwnPropertyNames(window.webflow.constructor.prototype);
    console.log('[WebflowDesignerDetection] Prototype methods:', protoMethods);
  }
  
  capabilities.availableMethods = webflowMethods;

  // Test for page reading capabilities
  if (typeof window.webflow.getCurrentPage === 'function') {
    capabilities.canReadPageInfo = true;
  } else if (typeof window.webflow.getPage === 'function') {
    capabilities.canReadPageInfo = true;
  } else if (typeof window.webflow.getSiteInfo === 'function') {
    capabilities.canReadPageInfo = true;
  }

  // Test for page modification capabilities
  if (typeof window.webflow.setPageSettings === 'function') {
    capabilities.canUpdatePageTitle = true;
    capabilities.canUpdatePageMeta = true;
    capabilities.canUpdatePageSlug = true;
  } else if (typeof window.webflow.setPageSetting === 'function') {
    capabilities.canUpdatePageTitle = true;
    capabilities.canUpdatePageMeta = true;
    capabilities.canUpdatePageSlug = true;
  } else if (typeof window.webflow.updatePage === 'function') {
    capabilities.canUpdatePageTitle = true;
    capabilities.canUpdatePageMeta = true;
    capabilities.canUpdatePageSlug = true;
  }

  // Test for custom code capabilities
  if (typeof window.webflow.addCustomCode === 'function' ||
      typeof window.webflow.setCustomCode === 'function') {
    capabilities.canAddCustomCode = true;
  }

  // Test for CMS capabilities
  if (typeof window.webflow.updateCMSItem === 'function' ||
      typeof window.webflow.setCMSItem === 'function') {
    capabilities.canUpdateCMS = true;
  }

  // Test for element manipulation capabilities
  if (typeof window.webflow.getAllElements === 'function') {
    capabilities.canManipulateElements = true;
  }

  // Test for element selection capabilities
  if (typeof window.webflow.getSelectedElement === 'function' &&
      typeof window.webflow.setSelectedElement === 'function') {
    capabilities.canSelectElements = true;
  }

  // Test for element builder capabilities
  if (window.webflow.elementBuilder && typeof window.webflow.elementBuilder === 'object') {
    capabilities.hasElementBuilder = true;
  }

  return capabilities;
}

/**
 * Test if we can actually call Designer APIs
 */
export async function testWebflowDesignerConnection(): Promise<{
  success: boolean;
  error?: string;
  pageInfo?: any;
  siteInfo?: any;
}> {
  try {
    if (!window.webflow) {
      return { success: false, error: 'No window.webflow object' };
    }

    let pageInfo = null;
    let siteInfo = null;

    // Try to get current page info
    if (typeof window.webflow.getCurrentPage === 'function') {
      try {
        pageInfo = await window.webflow.getCurrentPage();
      } catch (error) {
        console.log('[WebflowDesignerDetection] getCurrentPage failed:', error);
      }
    }

    if (!pageInfo && typeof window.webflow.getPage === 'function') {
      try {
        pageInfo = window.webflow.getPage();
      } catch (error) {
        console.log('[WebflowDesignerDetection] getPage failed:', error);
      }
    }

    // Try to get site info
    if (typeof window.webflow.getSiteInfo === 'function') {
      try {
        siteInfo = window.webflow.getSiteInfo();
      } catch (error) {
        console.log('[WebflowDesignerDetection] getSiteInfo failed:', error);
      }
    }

    return {
      success: true,
      pageInfo,
      siteInfo,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Wait for Webflow Designer API to be available
 */
export async function waitForWebflowDesigner(timeoutMs: number = 5000): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const test = await testWebflowDesignerConnection();
    if (test.success && (test.pageInfo || test.siteInfo)) {
      console.log('[WebflowDesignerDetection] Designer API is ready');
      return true;
    }
    
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  
  console.log('[WebflowDesignerDetection] Designer API failed to become ready within timeout');
  return false;
}