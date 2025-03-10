import type { Express, Request, Response } from "express";
import { analyzeSEOElements } from "./lib/seoAnalyzer";

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

  // SEO Analysis endpoint
  app.post("/api/analyze", async (req: Request, res: Response) => {
    console.log("Received POST request to /api/analyze");
    console.log("Request body:", req.body);

    try {
      const { url, keyphrase } = req.body;

      if (!url || !keyphrase) {
        console.log("Missing URL or keyphrase in request body");
        return res.status(400).json({ message: "URL and keyphrase are required" });
      }

      const results = await analyzeSEOElements(url, keyphrase);
      console.log("Analysis results:", results);
      res.json(results);
    } catch (error: any) {
      console.error("Error analyzing SEO elements:", error);
      res.status(500).json({ message: error.message });
    }
  });

  return app;
}