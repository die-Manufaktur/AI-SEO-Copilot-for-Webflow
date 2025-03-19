import type { AnalyzeRequest, SEOAnalysisResult } from "./types";

// Helper function to determine the appropriate API URL based on environment
export const getApiBaseUrl = (): string => {
  // Force the API URL to the Cloudflare Worker regardless of environment (temporary debug fix)
  const WORKER_URL = 'http://127.0.0.1:8787';
  
  // Log the hostname and port for debugging
  console.log(`Current window location: ${window.location.hostname}:${window.location.port}`);

  // Handle Webflow Extension Production Environment
  const isWebflowExtension = window.location.hostname.includes('webflow-ext.com');
  
  if (isWebflowExtension) {
    console.log('Using production API URL for Webflow Extension');
    // In Webflow production, use the Cloudflare Worker URL
    return 'https://seo-copilot-api.paul-130.workers.dev';
  } 
  
  // In development mode, always use the Worker URL
  console.log('Using development Worker URL:', WORKER_URL);
  return WORKER_URL;
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
