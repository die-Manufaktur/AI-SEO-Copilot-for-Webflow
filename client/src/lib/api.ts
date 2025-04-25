import type { SEOAnalysisResult, WebflowPageData } from "../lib/types"; // Import WebflowPageData
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
}

// Define the request structure including siteInfo and publishPath
export interface AnalyzeSEORequest {
  keyphrase: string;
  url: string;
  isHomePage: boolean;
  siteInfo: WebflowSiteInfo;
  publishPath: string;
  webflowPageData?: WebflowPageData;
  pageAssets?: Array<{ url: string, alt: string, type: string }>;
  debug?: boolean;
}

export async function analyzeSEO({
  keyphrase,
  url,
  isHomePage,
  siteInfo,
  publishPath,
  webflowPageData, // Destructure webflowPageData
  debug = true
}: AnalyzeSEORequest): Promise<SEOAnalysisResult> {
  const apiBaseUrl = getApiBaseUrl();
  console.log("[SEO Analyzer] Starting analysis with settings:", { keyphrase, url, isHomePage, siteInfo, publishPath, webflowPageData, debug }); // Log webflowPageData
  console.log(`[SEO Analyzer] Using API endpoint: ${apiBaseUrl}/api/analyze`);

  try {
    const response = await fetch(`${apiBaseUrl}/api/analyze`, {
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
        webflowPageData, // Include webflowPageData in the request body
        debug
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[SEO Analyzer] API Error (${response.status}):`, errorBody);
      // Try to parse JSON error for more details
      try {
        const errorJson = JSON.parse(errorBody);
        throw new Error(errorJson.message || `API Error: ${response.status} ${response.statusText}`);
      } catch (e) {
        // If parsing fails, throw the plain text error
        throw new Error(errorBody || `API Error: ${response.status} ${response.statusText}`);
      }
    }

    const data: SEOAnalysisResult = await response.json();
    console.log("[SEO Analyzer] Analysis successful:", data);
    return data;

  } catch (error: unknown) {
    console.error("[SEO Analyzer] Fetch error:", error);
    if (error instanceof Error) {
      // Rethrow specific errors or a generic one
      throw new Error(`Failed to analyze SEO: ${error.message}`);
    }
    throw new Error("An unknown error occurred during SEO analysis.");
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
