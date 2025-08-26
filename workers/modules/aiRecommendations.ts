import OpenAI from 'openai';
import { sanitizeForAI, sanitizeText } from '../../shared/utils/stringUtils';
import { shouldShowCopyButton } from '../../shared/utils/seoUtils';
import { WorkerEnvironment, AdvancedOptions } from '../../shared/types/index';

/**
 * Check if a specific SEO check type should have a copy button
 */
export function shouldHaveCopyButton(checkType: string): boolean {
  return shouldShowCopyButton(checkType);
}

/**
 * Generates an AI-powered recommendation for an SEO check
 * @param checkType The type of SEO check
 * @param keyphrase The target keyphrase
 * @param env Environment variables
 * @param context Additional context for the recommendation
 * @param advancedOptions Advanced analysis options (page type, secondary keywords)
 * @returns AI-powered recommendation or fallback message
 */
export async function getAIRecommendation(
  checkType: string,
  keyphrase: string,
  env: WorkerEnvironment, 
  context?: string,
  advancedOptions?: AdvancedOptions
): Promise<string> {
  try {    
    if (!env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
    
    const needsCopyableContent = shouldHaveCopyButton(checkType);
    
    // Build advanced context string if available
    const secondaryKeywords = advancedOptions?.secondaryKeywords;
    let advancedContext = '';
    if (advancedOptions?.pageType || secondaryKeywords) {
      advancedContext = '\n\nAdvanced Context:';
      if (advancedOptions.pageType) {
        advancedContext += `\n- Page Type: ${advancedOptions.pageType}`;
      }
      if (secondaryKeywords) {
        const sanitizedContext = sanitizeForAI(secondaryKeywords);
        advancedContext += `\n- Secondary Keywords: ${sanitizedContext}`;
      }
    }
    
    const systemPrompt = needsCopyableContent 
      ? `You are an SEO expert providing ready-to-use content.
         Create a single, concise, and optimized ${checkType.toLowerCase()} that naturally incorporates the keyphrase.
         Return ONLY the final content with no additional explanation, quotes, or formatting.
         The content must be directly usable by copying and pasting.
         Focus on being specific, clear, and immediately usable.${advancedContext ? ' Consider the page type and additional context provided to make recommendations more relevant and specific.' : ''}`
      : `You are an SEO expert providing actionable advice.
         Provide a concise recommendation for the SEO check "${checkType}".${advancedContext ? ' Consider the page type and additional context provided to make recommendations more relevant and specific.' : ''}`;

    // Special handling for URL checks with enhanced logic from v3.3.14
    const userPrompt = needsCopyableContent
      ? checkType === "Keyphrase in URL"
        ? `Create an SEO-friendly URL slug for the keyphrase "${keyphrase}".
           Current URL: ${context || 'None'}${advancedContext}
           Requirements:
           - Extract ONLY the page slug from the URL (the part after the last slash, excluding query parameters)
           - Ignore protocol (http/https), domain name, and folder paths
           - Use lowercase letters only
           - Separate words with hyphens
           - Include the main keyphrase naturally
           - Keep it concise and readable
           - Example: For URL "https://example.com/blog/posts/my-page", return only "my-page-with-keyphrase"
           Return ONLY the page slug (no protocol, domain, folders, or slashes) with no explanations or other text.`
        : `Create a perfect ${checkType.toLowerCase()} for the keyphrase "${keyphrase}".
           Current content: ${context || 'None'}${advancedContext}
           Remember to:
           - Keep optimal length for the content type (title: 50-60 chars, meta description: 120-155 chars, introduction: 2-3 sentences)
           - Make it compelling and relevant${advancedOptions?.pageType ? ` for a ${advancedOptions.pageType.toLowerCase()}` : ''}
           - For introductions, rewrite the existing content to naturally include the keyphrase while maintaining the original message
           - ONLY return the final content with no explanations or formatting`
      : `Fix this SEO issue: "${checkType}" for keyphrase "${keyphrase}" if a keyphrase is appropriate for the check.
         Current status: ${context || 'Not specified'}${advancedContext}
         Provide concise but actionable advice in a couple of sentences${advancedOptions?.pageType ? ` tailored for a ${advancedOptions.pageType.toLowerCase()}` : ''}.`;

    const response = await createChatCompletionWithRetry(openai, {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 500,
      temperature: 0.5,
    });

    if (!response || !response.choices[0]?.message?.content) {
      throw new Error("No recommendation received from OpenAI");
    }

    const recommendation = sanitizeText(response.choices[0].message.content.trim());
    return recommendation;
  } catch (error) {
    console.error(`[AI Recommendations] Error generating AI recommendation:`, error);
    throw new Error(`Failed to get AI recommendation for ${checkType}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Create chat completion with retry logic and exponential backoff
 */
async function createChatCompletionWithRetry(
  openai: OpenAI,
  params: OpenAI.Chat.ChatCompletionCreateParams,
  maxRetries: number = 2
): Promise<OpenAI.Chat.ChatCompletion> {
  let retries = 0;
  
  while (retries <= maxRetries) {
    try {
      const response = await openai.chat.completions.create({
        ...params,
        stream: false // Ensure we get a ChatCompletion, not a stream
      });
      return response as OpenAI.Chat.ChatCompletion;
    } catch (error) {
      if (retries === maxRetries) {
        throw error;
      }
      
      retries++;
      // Exponential backoff: 1s, 2s, 4s
      const delay = 1000 * Math.pow(2, retries);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      console.warn(`[AI Recommendations] Retry ${retries}/${maxRetries} after ${delay}ms delay`);
    }
  }
  
  throw new Error('Max retries exceeded');
}

/**
 * Handle the result from AI recommendation and apply it to an SEO check
 */
export function handleRecommendationResult(
  result: string,
  check: { recommendation?: string; introPhrase?: string }
): void {
  check.recommendation = sanitizeText(result);
}