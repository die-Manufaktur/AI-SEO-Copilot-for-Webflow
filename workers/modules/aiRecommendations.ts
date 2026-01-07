import OpenAI from 'openai';
import { sanitizeForAI, sanitizeText } from '../../shared/utils/stringUtils';
import { shouldShowCopyButton } from '../../shared/utils/seoUtils';
import { WorkerEnvironment, AdvancedOptions } from '../../shared/types/index';
import { getLanguageByCode, DEFAULT_LANGUAGE_CODE } from '../../shared/types/language';

/**
 * Check if a specific SEO check type should have a copy button
 */
export function shouldHaveCopyButton(checkType: string): boolean {
  return shouldShowCopyButton(checkType);
}

/**
 * Generate rule-based fallback recommendations when OpenAI is unavailable
 * Provides useful SEO guidance without requiring an API key
 */
function generateFallbackRecommendation(
  checkType: string,
  keyphrase: string,
  context?: string,
  advancedOptions?: AdvancedOptions
): string {
  const languageCode = advancedOptions?.languageCode || DEFAULT_LANGUAGE_CODE;
  const pageType = advancedOptions?.pageType?.toLowerCase() || 'page';
  const needsCopyableContent = shouldShowCopyButton(checkType);

  // Multilingual fallback templates
  const templates: Record<string, Record<string, Record<string, string>>> = {
    en: {
      'Keyphrase in Title': {
        copyable: `${keyphrase} - Professional ${pageType === 'homepage' ? 'Solutions' : 'Guide'} | Your Brand`,
        advice: `Add "${keyphrase}" to your title tag. Optimal length is 50-60 characters. Place the keyphrase near the beginning for better SEO impact.`
      },
      'Keyphrase in Meta Description': {
        copyable: `Discover expert insights about ${keyphrase}. Our comprehensive ${pageType} provides actionable tips and proven strategies to help you succeed. Learn more today!`,
        advice: `Include "${keyphrase}" naturally in your meta description. Keep it between 120-155 characters and make it compelling to encourage clicks.`
      },
      'Keyphrase in URL': {
        copyable: keyphrase.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        advice: `Use a URL-friendly version of "${keyphrase}". Use lowercase letters, hyphens for spaces, and keep it concise.`
      },
      'Keyphrase in Introduction': {
        copyable: `Welcome to our comprehensive guide on ${keyphrase}. In this ${pageType}, we'll explore everything you need to know about ${keyphrase} and how it can benefit you.`,
        advice: `Add "${keyphrase}" to your first paragraph. This helps search engines understand your content's topic immediately.`
      },
      'Keyphrase in H1 Heading': {
        copyable: `Complete Guide to ${keyphrase}`,
        advice: `Include "${keyphrase}" in your main H1 heading. Each page should have exactly one H1 tag.`
      },
      'Keyphrase in H2 Headings': {
        copyable: `Understanding ${keyphrase}: Key Insights`,
        advice: `Add at least one H2 heading containing "${keyphrase}". This improves content structure and SEO.`
      },
      'Image Alt Attributes': {
        copyable: `${keyphrase} - descriptive image`,
        advice: `Add descriptive alt text to all images. Include "${keyphrase}" where relevant, but keep it natural and descriptive.`
      },
      'Internal Links': {
        copyable: '',
        advice: `Add internal links to related pages on your site. This helps distribute link equity and improves user navigation.`
      },
      'Outbound Links': {
        copyable: '',
        advice: `Include 1-2 outbound links to authoritative, relevant sources. This adds credibility and context to your content.`
      },
      'default': {
        copyable: '',
        advice: `Review and optimize this SEO element for "${keyphrase}". Follow best practices for improved search visibility.`
      }
    },
    de: {
      'Keyphrase in Title': {
        copyable: `${keyphrase} - Professioneller Leitfaden | Ihre Marke`,
        advice: `Fügen Sie "${keyphrase}" zu Ihrem Titel hinzu. Optimale Länge: 50-60 Zeichen.`
      },
      'Keyphrase in Meta Description': {
        copyable: `Entdecken Sie Expertenwissen über ${keyphrase}. Unser umfassender Leitfaden bietet praktische Tipps und bewährte Strategien.`,
        advice: `Integrieren Sie "${keyphrase}" natürlich in Ihre Meta-Beschreibung. Halten Sie sie zwischen 120-155 Zeichen.`
      },
      'default': {
        copyable: '',
        advice: `Überprüfen und optimieren Sie dieses SEO-Element für "${keyphrase}".`
      }
    },
    fr: {
      'Keyphrase in Title': {
        copyable: `${keyphrase} - Guide Professionnel | Votre Marque`,
        advice: `Ajoutez "${keyphrase}" à votre titre. Longueur optimale : 50-60 caractères.`
      },
      'Keyphrase in Meta Description': {
        copyable: `Découvrez des conseils d'experts sur ${keyphrase}. Notre guide complet offre des conseils pratiques et des stratégies éprouvées.`,
        advice: `Incluez "${keyphrase}" naturellement dans votre méta-description. Gardez-la entre 120-155 caractères.`
      },
      'default': {
        copyable: '',
        advice: `Examinez et optimisez cet élément SEO pour "${keyphrase}".`
      }
    },
    es: {
      'Keyphrase in Title': {
        copyable: `${keyphrase} - Guía Profesional | Tu Marca`,
        advice: `Añade "${keyphrase}" a tu título. Longitud óptima: 50-60 caracteres.`
      },
      'Keyphrase in Meta Description': {
        copyable: `Descubre información experta sobre ${keyphrase}. Nuestra guía completa ofrece consejos prácticos y estrategias probadas.`,
        advice: `Incluye "${keyphrase}" de forma natural en tu meta descripción. Mantenla entre 120-155 caracteres.`
      },
      'default': {
        copyable: '',
        advice: `Revisa y optimiza este elemento SEO para "${keyphrase}".`
      }
    },
    it: {
      'default': {
        copyable: '',
        advice: `Rivedi e ottimizza questo elemento SEO per "${keyphrase}".`
      }
    },
    ja: {
      'default': {
        copyable: '',
        advice: `"${keyphrase}"のSEO要素を確認し、最適化してください。`
      }
    },
    pt: {
      'default': {
        copyable: '',
        advice: `Revise e otimize este elemento SEO para "${keyphrase}".`
      }
    },
    nl: {
      'default': {
        copyable: '',
        advice: `Controleer en optimaliseer dit SEO-element voor "${keyphrase}".`
      }
    },
    pl: {
      'default': {
        copyable: '',
        advice: `Sprawdź i zoptymalizuj ten element SEO dla "${keyphrase}".`
      }
    }
  };

  // Get templates for requested language, fallback to English
  const langTemplates = templates[languageCode] || templates.en;
  const checkTemplates = langTemplates[checkType] || langTemplates['default'] || templates.en['default'];

  if (needsCopyableContent && checkTemplates.copyable) {
    return checkTemplates.copyable;
  }

  return checkTemplates.advice;
}

/**
 * Generates an AI-powered recommendation for an SEO check
 * Falls back to rule-based recommendations when OpenAI is unavailable
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
    // If no OpenAI API key, use fallback recommendations
    if (!env.OPENAI_API_KEY) {
      console.log('[AI Recommendations] No API key configured, using fallback recommendations');
      return generateFallbackRecommendation(checkType, keyphrase, context, advancedOptions);
    }

    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
    
    const needsCopyableContent = shouldHaveCopyButton(checkType);
    
    // Build advanced context string if available
    const secondaryKeywords = advancedOptions?.secondaryKeywords;
    const languageCode = advancedOptions?.languageCode || DEFAULT_LANGUAGE_CODE;
    const language = getLanguageByCode(languageCode);
    
    let advancedContext = '';
    if (advancedOptions?.pageType || secondaryKeywords) {
      advancedContext = '\n\nAdvanced Context:';
      if (advancedOptions.pageType) {
        advancedContext += `\n- Page Type: ${advancedOptions.pageType}`;
      }
      if (secondaryKeywords) {
        const sanitizedContext = sanitizeForAI(secondaryKeywords, languageCode);
        advancedContext += `\n- Secondary Keywords: ${sanitizedContext}`;
      }
    }
    
    // Build language instruction if not default language
    let languageInstruction = '';
    if (languageCode !== DEFAULT_LANGUAGE_CODE && language) {
      languageInstruction = `\n\nIMPORTANT: Generate all content in ${language.name} (${language.nativeName}). Provide recommendations entirely in this language.`;
    }
    
    const systemPrompt = needsCopyableContent 
      ? `You are an SEO expert providing ready-to-use content.
         Create a single, concise, and optimized ${checkType.toLowerCase()} that naturally incorporates the keyphrase.
         Return ONLY the final content with no additional explanation, quotes, or formatting.
         The content must be directly usable by copying and pasting.
         Focus on being specific, clear, and immediately usable.${advancedContext ? ' Consider the page type and additional context provided to make recommendations more relevant and specific.' : ''}${languageInstruction}`
      : `You are an SEO expert providing actionable advice.
         Provide a concise recommendation for the SEO check "${checkType}".${advancedContext ? ' Consider the page type and additional context provided to make recommendations more relevant and specific.' : ''}${languageInstruction}`;

    // Special handling for URL and H2 checks with enhanced logic
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
        : checkType === "Keyphrase in H2 Headings"
        ? `Create a perfect H2 heading for the keyphrase "${keyphrase}".
           Current H2 headings: ${context || 'None'}${advancedContext}
           CRITICAL: The H2 heading must contain the exact word "${keyphrase}" literally in the text.
           
           Requirements:
           - Include the exact word "${keyphrase}" (not synonyms like "testimonials" for "test")
           - Keep it engaging and readable (40-60 characters ideal)
           - Make it compelling and relevant${advancedOptions?.pageType ? ` for a ${advancedOptions.pageType.toLowerCase()}` : ''}
           - Use title case capitalization
           
           Return ONLY the H2 heading text with no explanations, quotes, or additional formatting.`
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

    const recommendation = sanitizeText(response.choices[0].message.content.trim(), languageCode);
    
    // Basic validation for language-specific content
    if (languageCode !== DEFAULT_LANGUAGE_CODE && language) {
      // Simple heuristic: if non-English language was requested but response seems to be in English,
      // add a note about fallback
      const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
      const wordCount = recommendation.toLowerCase().split(/\s+/).length;
      const englishWordCount = englishWords.filter(word => 
        recommendation.toLowerCase().includes(` ${word} `) || 
        recommendation.toLowerCase().startsWith(`${word} `) ||
        recommendation.toLowerCase().endsWith(` ${word}`)
      ).length;
      
      // If more than 30% of words are common English words and it's a non-English request
      if (wordCount > 5 && (englishWordCount / wordCount) > 0.3 && languageCode !== 'en') {
        console.warn(`AI may have responded in English instead of requested language: ${language.name}`);
      }
    }
    
    return recommendation;
  } catch (error) {
    console.error(`[AI Recommendations] Error generating AI recommendation:`, error);

    // Gracefully fallback to rule-based recommendations on any error
    console.log('[AI Recommendations] Falling back to rule-based recommendations due to error');
    return generateFallbackRecommendation(checkType, keyphrase, context, advancedOptions);
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