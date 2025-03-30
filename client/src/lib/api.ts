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
    logger.warn('Error checking Webflow extension context:', e);
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
    logger.warn('Error checking local development environment:', e);
  }

  logger.info('Falling back to production API URL');
  return 'https://seo-copilot-api.paul-130.workers.dev';
};

export async function analyzeSEO({ keyphrase, url, isHomePage }: { keyphrase: string; url: string; isHomePage: boolean }) {
  const apiBaseUrl = getApiBaseUrl();
  logger.debug('Analyzing SEO with:', { keyphrase, url, apiUrl: apiBaseUrl });
  
  try {
    const response = await fetch(`${apiBaseUrl}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keyphrase, url }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`API error (${response.status}):`, errorText);
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }
    
    logger.debug('API response received successfully');
    return await response.json();
  } catch (error) {
    logger.error('SEO analysis request failed:', error);
    throw error; // Re-throw to allow handling by the caller
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
