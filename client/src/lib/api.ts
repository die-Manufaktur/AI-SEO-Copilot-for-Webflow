import type { AnalyzeRequest, SEOAnalysisResult } from "./types";

export async function analyzeSEO({ keyphrase, url }: { keyphrase: string; url: string }) {
  console.log("Sending request to /api/analyze with data:", { keyphrase, url });
  const response = await fetch("http://localhost:5000/api/analyze", {
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
}

/**
 * Register domains with the server to be added to the allowlist
 * @param domains Array of domain URLs to register
 * @returns Response from server
 */
export async function registerDomains(domains: string[]): Promise<{ success: boolean; message: string }> {
  try {
    console.log("Registering domains:", domains);
    const response = await fetch("http://localhost:5000/api/register-domains", {
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
