import type { AnalyzeRequest, SEOAnalysisResult } from "./types";

// Properly declare Vite's environment variable types once
interface ImportMetaEnv {
  VITE_API_URL?: string;
  DEV?: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
// Helper function to determine the appropriate API URL based on environment
const isWebflowExtension = import.meta.env.VITE_WEBFLOW_EXTENSION === 'true';

export const getApiBaseUrl = (): string => {
  if (isWebflowExtension) {
    console.log('Using production API URL for Webflow Extension');
    return 'https://seo-copilot-api.paul-130.workers.dev';
  } 
  
  // In development mode - Vite sets import.meta.env.DEV to true in development
  if (import.meta.env.DEV) {
    // Local development Worker URL
    const localWorkerUrl = 'http://127.0.0.1:8787';
    console.log('Using development Worker URL:', localWorkerUrl);
    return localWorkerUrl;
  }
  
  // Fallback to production URL
  console.log('Falling back to production API URL');
  return 'https://seo-copilot-api.paul-130.workers.dev';
};

export async function analyzeSEO({ keyphrase, url }: { keyphrase: string; url: string }) {
  const baseUrl = getApiBaseUrl();
  console.log(`Sending request to ${baseUrl}/api/analyze with data:`, { keyphrase, url });
  
  try {
    const response = await fetch(`${baseUrl}/api/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ keyphrase, url })
    });

    // First check if response is OK
    if (!response.ok) {
      // Try to parse as JSON, but have a fallback for HTML errors
      try {
        const errorData = await response.json();
        console.error("Error response from /api/analyze:", errorData);
        throw new Error(errorData.message || "Failed to analyze SEO");
      } catch (parseError) {
        // If we couldn't parse JSON, get the text and show a more helpful error
        const errorText = await response.text();
        console.error("Non-JSON error response:", errorText.substring(0, 150) + "...");
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
    }

    const data = await response.json();
    console.log("Received response from /api/analyze:", data);
    return data;
  } catch (error) {
    console.error("API request failed:", error);
    throw new Error(error instanceof Error ? error.message : "Network error");
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
    console.log(`Registering domains at ${baseUrl}/api/register-domains:`, domains);
    const response = await fetch(`${baseUrl}/api/register-domains`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ domains })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Failed to register domains:", data);
      return { 
        success: false, 
        message: data.message || "Failed to register domains" 
      };
    }

    console.log("Domains registered successfully:", data);
    return { 
      success: true, 
      message: data.message || "Domains registered successfully" 
    };
  } catch (error) {
    console.error("Error registering domains:", error);
    return { 
      success: false, 
      message: `Error registering domains: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}
