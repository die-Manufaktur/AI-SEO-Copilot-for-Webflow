import { createLogger } from './utils';

// Properly declare Vite's environment variable types once
interface ImportMetaEnv {
  VITE_API_URL?: string;
  DEV?: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Create a namespaced logger for the API module
const logger = createLogger('API');

// Helper function to determine the appropriate API URL based on environment
export const getApiBaseUrl = (): string => {
  // Try to get Webflow extension API URL first
  try {
    const isExtension = !!window.webflow;
    if (isExtension) {
      logger.info('Using production API URL for Webflow Extension');
      return 'https://seo-copilot-api.paul-130.workers.dev';
    }
  } catch (e) {
    // Not in Webflow extension context
  }

  // Try to use local dev URL
  try {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      const localWorkerUrl = 'http://localhost:8787';
      logger.info('Using development Worker URL:', localWorkerUrl);
      return localWorkerUrl;
    }
  } catch (e) {
    // Error accessing window.location, fall back to production
  }

  logger.info('Falling back to production API URL');
  return 'https://seo-copilot-api.paul-130.workers.dev';
};

export async function analyzeSEO({ keyphrase, url }: { keyphrase: string; url: string }) {
  const baseUrl = getApiBaseUrl();
  logger.debug(`Sending request to ${baseUrl}/api/analyze with data:`, { keyphrase, url });
  
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
      // Clone the response to read it multiple times if needed
      const responseClone = response.clone();
      
      // Try to parse as JSON, but have a fallback for HTML errors
      try {
        const errorData = await response.json();
        logger.error("Error response from /api/analyze:", errorData);
        throw new Error(errorData.message || "Failed to analyze SEO");
      } catch (parseError) {
        // If we couldn't parse JSON, get the text from the cloned response
        try {
          const errorText = await responseClone.text();
          logger.error("Non-JSON error response:", errorText.substring(0, 150) + "...");
        } catch (textError) {
          logger.error("Could not read error response content");
        }
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
    }

    const data = await response.json();
    logger.debug("Received response from /api/analyze:", data);
    return data;
  } catch (error) {
    logger.error("API request failed:", error);
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
  logger.info(`Registering domains at ${baseUrl}/api/register-domains:`, domains);
  
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
      logger.error("Failed to register domains:", data);
      return { 
        success: false, 
        message: data.message || "Failed to register domains" 
      };
    }

    logger.info("Domains registered successfully:", data);
    return { 
      success: true, 
      message: data.message || "Domains registered successfully" 
    };
  } catch (error) {
    logger.error("Error registering domains:", error);
    return { 
      success: false, 
      message: `Error registering domains: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}
