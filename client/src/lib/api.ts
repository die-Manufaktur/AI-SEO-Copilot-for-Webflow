import type { AnalyzeRequest, SEOAnalysisResult } from "./types";

// Helper function to determine the appropriate API URL based on environment
const getApiBaseUrl = (): string => {
  // In production (Webflow extension environment), use relative paths
  if (process.env.NODE_ENV === 'production' || 
      window.location.hostname.includes('webflow.io') ||
      !window.location.hostname.includes('localhost')) {
    return '';  // Use relative URLs in production
  }
  
  // In development, use localhost with the API port
  return 'http://localhost:5000';
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

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error response from /api/analyze:", errorData);
      throw new Error(errorData.message || "Failed to analyze SEO");
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
