import type { Express, Request, Response } from "express";
import { analyzeSEOElements } from "./lib/seoAnalyzer";
import { isValidUrl, isPrivateIP, validateUrl, addDomainToAllowlist, getAllowedDomains } from "./lib/security";
import { URL } from 'url';
import dns from 'dns';
import { promisify } from 'util';

// Promisify DNS lookup for cleaner async code
const dnsLookup = promisify(dns.lookup);

export function registerRoutes(app: Express) {
  // Log environment variable status for OpenAI API (without exposing the key)
  const useGPT = process.env.USE_GPT_RECOMMENDATIONS !== "false";
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-');

  if (useGPT && !hasOpenAIKey) {
    console.warn("[SEO Analyzer] WARNING: GPT recommendations are enabled but no valid OpenAI API key was provided. Will use fallback recommendations.");
  }

  const enabledChecks = process.env.ENABLED_GPT_CHECKS ? 
    process.env.ENABLED_GPT_CHECKS.split(',') : 
    ["Keyphrase in Title", "Keyphrase in Meta Description", "Keyphrase in Introduction", "Keyphrase in H1 Heading", "Keyphrase in H2 Headings"];

  // Add endpoint to register domains to the allowlist
  app.post("/api/register-domains", async (req: Request, res: Response) => {
    console.log("Received POST request to /api/register-domains");
    const { domains } = req.body;

    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "Please provide an array of domains to register" 
      });
    }

    try {
      const registeredDomains = [];
      const failedDomains = [];

      for (const domainUrl of domains) {
        try {
          // Extract the domain from the URL
          const url = new URL(domainUrl.startsWith('http') ? domainUrl : `https://${domainUrl}`);
          const domain = url.hostname;
          
          console.log(`Registering domain: ${domain}`);
          
          // Add both the exact domain and wildcard for subdomains
          const added = addDomainToAllowlist(domain);
          const wildcardAdded = addDomainToAllowlist(`*.${domain}`);
          
          if (added || wildcardAdded) {
            registeredDomains.push(domain);
          } else {
            console.log(`Domain already in allowlist: ${domain}`);
          }
        } catch (err) {
          console.error(`Failed to process domain ${domainUrl}:`, err);
          failedDomains.push(domainUrl);
        }
      }

      return res.json({
        success: true,
        registered: registeredDomains,
        failed: failedDomains,
        message: `Successfully registered ${registeredDomains.length} domains. ${failedDomains.length > 0 ? `Failed to register ${failedDomains.length} domains.` : ''}`
      });
    } catch (error: any) {
      console.error("Error registering domains:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "An error occurred while registering domains"
      });
    }
  });

  // SEO Analysis endpoint
  app.post("/api/analyze", async (req: Request, res: Response) => {
    console.log("======= API ANALYZE REQUEST START =======");
    console.log("Received POST request to /api/analyze at:", new Date().toISOString());
    console.log("Request body:", JSON.stringify(req.body));

    try {
      let { url, keyphrase } = req.body;

      if (!url || !keyphrase) {
        console.log("Missing URL or keyphrase in request body");
        return res.status(400).json({ message: "URL and keyphrase are required" });
      }

      console.log("Processing request for URL:", url, "with keyphrase:", keyphrase);

      // Add HTTPS protocol if missing, or convert HTTP to HTTPS
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
        console.log("Added HTTPS protocol to URL:", url);
      } else if (/^http:\/\//i.test(url)) {
        // Convert HTTP to HTTPS
        url = url.replace(/^http:/i, 'https:');
        console.log("Converted HTTP to HTTPS:", url);
      }
      
      try {
        // Extract domain from URL and add to allowlist automatically
        const parsedUrl = new URL(url);
        const domain = parsedUrl.hostname;
        
        // Automatically register the domain and its wildcard version
        console.log(`Auto-registering domain to allowlist: ${domain}`);
        const domainAdded = addDomainToAllowlist(domain);
        const wildcardAdded = addDomainToAllowlist(`*.${domain}`);
        
        if (domainAdded || wildcardAdded) {
          console.log(`Successfully added ${domain} to allowlist`);
        } else {
          console.log(`Domain ${domain} was already in allowlist`);
        }
        
        // Log current allowlist for debugging
        console.log("Current allowlist:", getAllowedDomains());
      } catch (error) {
        console.error("Error auto-registering domain:", error);
      }
      
      // Perform enhanced URL validation with allowlist check
      console.log("Validating URL format and allowlist...");
      if (!isValidUrl(url)) {
        console.log("Invalid or disallowed URL format:", url);
        return res.status(400).json({ 
          message: "Invalid URL format, non-HTTPS protocol, or domain not allowed"
        });
      }
      
      // Create URL object for further processing
      const parsedUrl = new URL(url);
      console.log("URL parsed successfully:", parsedUrl.toString());

      try {
        // Resolve the hostname to an IP address
        console.log("Resolving hostname to IP address:", parsedUrl.hostname);
        const { address } = await dnsLookup(parsedUrl.hostname);
        console.log("Hostname resolved to IP address:", address);
        
        // Check if the IP is private/internal
        console.log("Checking if IP is private...");
        if (isPrivateIP(address)) {
          console.log("Private IP address detected:", address);
          return res.status(400).json({ 
            message: "Requests to private IP addresses are not allowed" 
          });
        }
        
        // Final validation step
        console.log("Performing final URL validation...");
        if (!validateUrl(url)) {
          console.log("URL failed security validation:", url);
          return res.status(400).json({ 
            message: "URL failed security validation" 
          });
        }

        // Perform the analysis using the validated and allowed URL
        console.log("Starting SEO analysis...");
        const analysisStartTime = Date.now();
        
        try {
          const results = await analyzeSEOElements(url, keyphrase);
          const analysisEndTime = Date.now();
          console.log(`SEO analysis completed in ${analysisEndTime - analysisStartTime}ms`);
          console.log("Analysis results:", JSON.stringify(results).substring(0, 200) + "...");
          console.log("======= API ANALYZE REQUEST END =======");
          return res.json(results);
        } catch (analysisError) {
          console.error("Error during SEO analysis:", analysisError);
          console.log("======= API ANALYZE REQUEST END WITH ERROR =======");
          return res.status(500).json({ 
            message: "Error analyzing SEO elements: " + (analysisError.message || "Unknown error")
          });
        }
      } catch (dnsError) {
        console.error("DNS or validation error:", dnsError);
        console.log("======= API ANALYZE REQUEST END WITH ERROR =======");
        return res.status(500).json({ 
          message: "Failed to resolve hostname or validate URL: " + (dnsError.message || "Unknown error") 
        });
      }
    } catch (error: any) {
      console.error("Unexpected error analyzing SEO elements:", error);
      console.log("======= API ANALYZE REQUEST END WITH ERROR =======");
      return res.status(500).json({ message: error.message || "Unknown error" });
    }
  });

  return app;
}