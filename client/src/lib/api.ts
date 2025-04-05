// Properly declare Vite's environment variable types once
interface ImportMetaEnv {
  VITE_API_URL?: string;
  DEV?: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Helper function to determine the appropriate API URL based on environment
export const getApiBaseUrl = (): string => {
  // Try to get Webflow extension API URL first
  try {
    const isExtension = !!window.webflow;
    if (isExtension) {
      return 'https://seo-copilot-api.paul-130.workers.dev';
    }
  } catch (e) {
    // Not in Webflow extension context
  }

  // Try to use local dev URL
  try {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      const localWorkerUrl = 'http://localhost:8787';
      return localWorkerUrl;
    }
  } catch (e) {
    // Error accessing window.location, fall back to production
  }

  return 'https://seo-copilot-api.paul-130.workers.dev';
};

export async function analyzeSEO({ 
  keyphrase, 
  url, 
  isHomePage, 
  debug = true 
}: { 
  keyphrase: string; 
  url: string; 
  isHomePage: boolean;
  debug?: boolean;
}) {
  const apiBaseUrl = getApiBaseUrl();
  console.log("[SEO Analyzer] Starting analysis with settings:", { keyphrase, url, isHomePage, debug });
  console.log(`[SEO Analyzer] Using API endpoint: ${apiBaseUrl}/api/analyze`);
  
  try {
    const response = await fetch(`${apiBaseUrl}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keyphrase, url, debug }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[SEO Analyzer] API error response:", errorText);
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log("[SEO Analyzer] Analysis results received:", result);
    
    // Extract and log OpenGraph specific data to help debug
    if (result && result.checks) {
      const ogCheck = result.checks.find((check: any) => 
        check.title === "Open Graph Title and Description" || 
        check.title === "OpenGraph Title and Description"
      );
      
      if (ogCheck) {
        console.log("[SEO Analyzer] OpenGraph check details:", ogCheck);
        try {
          // Try to parse context data if it's a JSON string
          const contextData = typeof ogCheck.context === 'string' ? 
            JSON.parse(ogCheck.context) : ogCheck.context;
          console.log("[SEO Analyzer] OpenGraph data:", contextData);
        } catch (e) {
          console.log("[SEO Analyzer] OpenGraph check context (raw):", ogCheck.context);
        }
      } else {
        console.log("[SEO Analyzer] No OpenGraph check found in results");
      }
    }
    
    return result;
  } catch (error) {
    console.error("[SEO Analyzer] Analysis failed:", error);
    throw error; // Re-throw to allow handling by the caller
  }
}

export async function analyzePage(keyphrase: string, url: string) {
  const apiUrl = getApiBaseUrl();
  
  // Get Webflow data if available
  let webflowData = null;
  if (window.webflow) {
    try {
      const allElements = await window.webflow.getAllElements();
      const paragraphs = [];
      
      // Process elements to find paragraphs
      for (const element of allElements) {
        if (!element) continue;
        
        const isParagraph = element.tagName?.toLowerCase() === 'p' || 
          (element.customAttributes?.some(attr => 
            attr.name === 'data-element-type' && attr.value === 'paragraph'
          ));

        if (isParagraph && element.textContent) {
          const text = element.textContent.trim();
          if (text.length >= 30) {
            paragraphs.push(text);
          }
        }
      }
      
      webflowData = {
        paragraphs
      };
    } catch (error) {
      console.error('Error getting Webflow data:', error);
    }
  }
  
  const response = await fetch(`${apiUrl}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      keyphrase,
      url,
      webflowData // Include Webflow data in the request
    })
  });

  if (!response.ok) {
    throw new Error('API request failed');
  }

  return response.json();
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
