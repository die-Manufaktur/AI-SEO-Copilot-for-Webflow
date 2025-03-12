import type { Express, Request, Response } from "express";
import { analyzeSEOElements } from "./lib/seoAnalyzer";
import { URL } from 'url';
import dns from 'dns';
import IPCIDR from 'ip-cidr';

export function registerRoutes(app: Express) {
  // Log environment variable status for OpenAI API (without exposing the key)
  const useGPT = process.env.USE_GPT_RECOMMENDATIONS !== "false";
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-');

  console.log(`[SEO Analyzer] GPT Recommendations: ${useGPT ? "Enabled" : "Disabled"}`);
  console.log(`[SEO Analyzer] OpenAI API Key: ${hasOpenAIKey ? "Provided" : "Not provided or invalid"}`);

  if (useGPT && !hasOpenAIKey) {
    console.warn("[SEO Analyzer] WARNING: GPT recommendations are enabled but no valid OpenAI API key was provided. Will use fallback recommendations.");
  }

  const enabledChecks = process.env.ENABLED_GPT_CHECKS ? 
    process.env.ENABLED_GPT_CHECKS.split(',') : 
    ["Keyphrase in Title", "Keyphrase in Meta Description", "Keyphrase in Introduction", "Keyphrase in H1 Heading", "Keyphrase in H2 Headings"];

  if (useGPT && hasOpenAIKey) {
    console.log(`[SEO Analyzer] Enabled GPT checks: ${enabledChecks.join(', ')}`);
  }

  // URL validation function
  function isValidUrl(urlString: string): boolean {
    try {
      // Add protocol if missing
      if (!/^https?:\/\//i.test(urlString)) {
        urlString = 'http://' + urlString;
      }
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (err) {
      return false;
    }
  }

  // IP address validation function
  function isPrivateIP(ip: string): boolean {
    const privateRanges = [
      '10.0.0.0/8',
      '172.16.0.0/12',
      '192.168.0.0/16',
      '127.0.0.0/8',
      '169.254.0.0/16'
    ];

    return privateRanges.some(range => {
      const cidr = new IPCIDR(range);
      return cidr.contains(ip);
    });
  }

  // SEO Analysis endpoint
  app.post("/api/analyze", async (req: Request, res: Response) => {
    console.log("Received POST request to /api/analyze");
    console.log("Request body:", req.body);

    try {
      let { url, keyphrase } = req.body;

      if (!url || !keyphrase) {
        console.log("Missing URL or keyphrase in request body");
        return res.status(400).json({ message: "URL and keyphrase are required" });
      }

      if (!isValidUrl(url)) {
        console.log("Invalid URL format");
        return res.status(400).json({ message: "Invalid URL format" });
      }

      // Add protocol if missing
      if (!/^https?:\/\//i.test(url)) {
        url = 'http://' + url;
      }

      // Resolve the hostname to an IP address
      dns.lookup(new URL(url).hostname, (err, address) => {
        if (err) {
          console.error("DNS lookup error:", err);
          return res.status(500).json({ message: "Failed to resolve hostname" });
        }

        if (isPrivateIP(address)) {
          console.log("Private IP address detected");
          return res.status(400).json({ message: "Requests to private IP addresses are not allowed" });
        }

        // Perform the analysis using the validated and allowed URL
        analyzeSEOElements(url, keyphrase)
          .then(results => {
            console.log("Analysis results:", results);
            res.json(results);
          })
          .catch(error => {
            console.error("Error analyzing SEO elements:", error);
            res.status(500).json({ message: error.message });
          });
      });
    } catch (error: any) {
      console.error("Error analyzing SEO elements:", error);
      res.status(500).json({ message: error.message });
    }
  });

  return app;
}