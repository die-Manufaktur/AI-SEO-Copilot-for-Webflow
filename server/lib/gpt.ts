import OpenAI from "openai";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config({ path: '.env' });

// Use an environment variable to enable/disable GPT recommendations
const useGPT = process.env.USE_GPT_RECOMMENDATIONS !== "false";

// Simple in-memory cache for recommendations
interface CacheEntry {
  recommendation: string;
  timestamp: number;
}
const recommendationCache: Record<string, CacheEntry> = {};
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Initialize OpenAI only if enabled
const openai = useGPT ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// Check if OpenAI API key is available
const hasValidOpenAIKey = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-');

export async function getGPTRecommendation(
  checkType: string,
  keyphrase: string,
  context?: string
): Promise<string> {
  // If GPT is disabled or API key is invalid, return early with a message
  if (!useGPT || !hasValidOpenAIKey) {
    console.log("GPT recommendations are disabled or API key is invalid");
    return "GPT recommendations are currently disabled. Enable them by setting USE_GPT_RECOMMENDATIONS=true and providing a valid OPENAI_API_KEY.";
  }

  try {
    // Create a cache key based on check type and keyphrase
    const cacheKey = `${checkType}_${keyphrase}_${context?.substring(0, 50) || ''}`;

    // Check if we have a valid cached response
    const cachedEntry = recommendationCache[cacheKey];
    if (cachedEntry && (Date.now() - cachedEntry.timestamp) < CACHE_TTL) {
      console.log(`Using cached recommendation for ${checkType}`);
      return cachedEntry.recommendation;
    }

    // Limit the context length to reduce token usage
    const truncatedContext = context && context.length > 300 
      ? context.substring(0, 300) + "..." 
      : context;

    // Optimize the prompt to be more concise and use fewer tokens
    if (!openai) {
      throw new Error("OpenAI is not initialized.");
    }
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Use the most cost-effective model
      messages: [
        {
          role: "system",
          content: `You are an SEO expert providing concise, actionable recommendations.
          Keep responses under 100 words.
          Format: "Here is a better [element]: [example]"
          Avoid quotation marks.`
        },
        {
          role: "user",
          content: `Fix this SEO issue: "${checkType}" for keyphrase "${keyphrase}".
          ${truncatedContext ? `Current content: ${truncatedContext}` : ''}`
        }
      ],
      max_tokens: 100, // Reduce token limit to save costs
      temperature: 0.5, // Lower temperature for more predictable outputs
    });

    const recommendation = response.choices[0].message.content?.trim() || 
      "Unable to generate recommendation at this time.";

    // Cache the response
    recommendationCache[cacheKey] = {
      recommendation,
      timestamp: Date.now()
    };

    return recommendation;
  } catch (error: any) {
    console.error("GPT API Error:", error);

    // Return a more helpful error message
    if (error.status === 401) {
      return "API key error. Please check your OpenAI API key and ensure it's valid.";
    }

    return "Unable to generate recommendation. Please try again later.";
  }
}