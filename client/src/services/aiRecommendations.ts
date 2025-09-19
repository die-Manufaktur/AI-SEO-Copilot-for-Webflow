/**
 * AI Recommendations Service
 * GREEN Phase: Minimal implementation to make tests pass
 */

export interface AIRecommendationRequest {
  content: {
    title?: string;
    description?: string;
    body?: string;
  };
  options: {
    targetKeywords?: string[];
    contentType?: 'landing_page' | 'blog_post' | 'product_page' | 'general';
    language?: string;
    optimizeLength?: boolean;
    enableFallback?: boolean;
    retryOnFailure?: boolean;
  };
}

export interface AIRecommendationResponse {
  title?: string;
  description?: string;
  keywords?: string[];
  reasoning?: {
    title?: string;
    description?: string;
  };
  metadata?: {
    titleLength?: number;
    descriptionLength?: number;
    keywordDensity?: number;
  };
}

interface APIResponse {
  success: boolean;
  data?: AIRecommendationResponse;
  error?: {
    message: string;
    code: string;
  };
}

const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff
const MAX_RETRIES = 3;

/**
 * Generate AI-powered SEO recommendations
 */
export async function generateRecommendations(
  request: AIRecommendationRequest
): Promise<AIRecommendationResponse> {
  // Validate configuration
  const env = (typeof window !== 'undefined' ? (window as any).env : process.env) || {};
  const useGptRecommendations = env.USE_GPT_RECOMMENDATIONS;
  if (useGptRecommendations !== 'true') {
    throw new Error('AI recommendations are disabled');
  }

  // Validate request content
  if ((!request.content.title || request.content.title.trim() === '') &&
      (!request.content.description || request.content.description.trim() === '')) {
    throw new Error('Content title or description is required');
  }

  const workerUrl = env.VITE_WORKER_URL || 'http://localhost:8787';
  const apiUrl = `${workerUrl}/api/ai-recommendations`;

  let lastError: Error | null = null;
  const maxRetries = request.options.retryOnFailure ? MAX_RETRIES : 1;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const retrySeconds = retryAfter ? parseInt(retryAfter, 10) : 60;
        throw new Error(`Rate limit exceeded. Retry after ${retrySeconds} seconds`);
      }

      // Handle other HTTP errors
      if (!response.ok) {
        if (response.status >= 500 && attempt < maxRetries - 1) {
          // Retry on server errors
          await delay(RETRY_DELAYS[attempt] || 4000);
          continue;
        }

        // For client errors or final retry, check if fallback is enabled
        if (request.options.enableFallback) {
          return generateFallbackRecommendations(request);
        }

        throw new Error(`AI recommendations API error: ${response.status} ${response.statusText}`);
      }

      const apiResponse: APIResponse = await response.json();

      if (!apiResponse.success || !apiResponse.data) {
        throw new Error(apiResponse.error?.message || 'Invalid API response');
      }

      return apiResponse.data;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If this is the last attempt or a non-retryable error
      if (attempt === maxRetries - 1 || !isRetryableError(lastError)) {
        // Try fallback if enabled
        if (request.options.enableFallback) {
          return generateFallbackRecommendations(request);
        }

        // If it's a rate limit error, don't wrap it
        if (lastError.message.includes('Rate limit exceeded')) {
          throw lastError;
        }

        throw new Error('Failed to generate AI recommendations');
      }

      // Wait before retrying
      await delay(RETRY_DELAYS[attempt] || 4000);
    }
  }

  // Should never reach here, but just in case
  throw lastError || new Error('Failed to generate AI recommendations');
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: Error): boolean {
  const retryableMessages = [
    'Network connection failed',
    'Service Unavailable',
    'timeout',
    'ECONNRESET',
    'ENOTFOUND',
  ];

  return retryableMessages.some(msg => 
    error.message.toLowerCase().includes(msg.toLowerCase())
  );
}

/**
 * Generate fallback recommendations using rule-based approach
 */
function generateFallbackRecommendations(
  request: AIRecommendationRequest
): AIRecommendationResponse {
  const { content, options } = request;
  const keywords = options.targetKeywords || [];
  const contentType = options.contentType || 'general';
  const language = options.language || 'en';

  // Generate fallback title
  const title = generateFallbackTitle(content, keywords, contentType, language);
  
  // Generate fallback description
  const description = generateFallbackDescription(content, keywords, contentType, language);

  // Calculate metadata
  const metadata = {
    titleLength: title.length,
    descriptionLength: description.length,
    keywordDensity: calculateKeywordDensity(title + ' ' + description, keywords),
  };

  return {
    title,
    description,
    keywords,
    reasoning: {
      title: 'Generated using fallback rule-based optimization',
      description: 'Generated using fallback rule-based optimization',
    },
    metadata,
  };
}

/**
 * Generate fallback title
 */
function generateFallbackTitle(
  content: AIRecommendationRequest['content'],
  keywords: string[],
  contentType: string,
  language: string
): string {
  const primaryKeyword = keywords[0] || 'optimization';
  
  const templates = {
    en: {
      landing_page: `${primaryKeyword} | Professional Solution`,
      blog_post: `Complete Guide to ${primaryKeyword}`,
      product_page: `Premium ${primaryKeyword} - Best Quality`,
      general: `${primaryKeyword} - Optimized Content`,
    },
    fr: {
      landing_page: `${primaryKeyword} | Solution Professionnelle`,
      blog_post: `Guide Complet du ${primaryKeyword}`,
      product_page: `${primaryKeyword} Premium - Meilleure Qualité`,
      general: `${primaryKeyword} - Contenu Optimisé`,
    },
    de: {
      landing_page: `${primaryKeyword} | Professionelle Lösung`,
      blog_post: `Vollständiger ${primaryKeyword} Leitfaden`,
      product_page: `Premium ${primaryKeyword} - Beste Qualität`,
      general: `${primaryKeyword} - Optimierter Inhalt`,
    },
  };

  const langTemplates = templates[language as keyof typeof templates] || templates.en;
  const template = langTemplates[contentType as keyof typeof langTemplates] || langTemplates.general;

  // Ensure title is within optimal length
  return template.length <= 60 ? template : template.substring(0, 57) + '...';
}

/**
 * Generate fallback description
 */
function generateFallbackDescription(
  content: AIRecommendationRequest['content'],
  keywords: string[],
  contentType: string,
  language: string
): string {
  const keywordList = keywords.join(', ') || 'optimization';
  
  const templates = {
    en: {
      landing_page: `Discover professional ${keywordList} solutions that deliver results. Get started today and transform your business with our proven approach.`,
      blog_post: `Learn everything about ${keywordList} in this comprehensive guide. Expert tips, best practices, and actionable insights to help you succeed.`,
      product_page: `Premium ${keywordList} products designed for excellence. High-quality solutions with guaranteed satisfaction and expert support.`,
      general: `Optimized content about ${keywordList}. Professional quality and reliable results for your specific needs and requirements.`,
    },
    fr: {
      landing_page: `Découvrez des solutions professionnelles de ${keywordList} qui donnent des résultats. Commencez aujourd'hui et transformez votre entreprise.`,
      blog_post: `Apprenez tout sur ${keywordList} dans ce guide complet. Conseils d'experts, meilleures pratiques et informations exploitables.`,
      product_page: `Produits ${keywordList} premium conçus pour l'excellence. Solutions de haute qualité avec satisfaction garantie.`,
      general: `Contenu optimisé sur ${keywordList}. Qualité professionnelle et résultats fiables pour vos besoins spécifiques.`,
    },
    de: {
      landing_page: `Entdecken Sie professionelle ${keywordList} Lösungen, die Ergebnisse liefern. Starten Sie heute und transformieren Sie Ihr Geschäft.`,
      blog_post: `Lernen Sie alles über ${keywordList} in diesem umfassenden Leitfaden. Expertentipps, bewährte Praktiken und umsetzbare Erkenntnisse.`,
      product_page: `Premium ${keywordList} Produkte für Exzellenz entwickelt. Hochwertige Lösungen mit garantierter Zufriedenheit.`,
      general: `Optimierter Inhalt über ${keywordList}. Professionelle Qualität und zuverlässige Ergebnisse für Ihre spezifischen Bedürfnisse.`,
    },
  };

  const langTemplates = templates[language as keyof typeof templates] || templates.en;
  const template = langTemplates[contentType as keyof typeof langTemplates] || langTemplates.general;

  // Ensure description is within optimal length (120-160 characters)
  if (template.length < 120) {
    // Pad with additional context if too short
    const padding = language === 'en' 
      ? ' Contact us today for more information and personalized recommendations.'
      : language === 'fr'
      ? ' Contactez-nous dès aujourd\'hui pour plus d\'informations et des recommandations personnalisées.'
      : ' Kontaktieren Sie uns heute für weitere Informationen und personalisierte Empfehlungen.';
    
    const extended = template + padding;
    return extended.length <= 160 ? extended : extended.substring(0, 157) + '...';
  }
  
  if (template.length > 160) {
    return template.substring(0, 157) + '...';
  }
  
  return template;
}

/**
 * Calculate keyword density
 */
function calculateKeywordDensity(text: string, keywords: string[]): number {
  if (!text || keywords.length === 0) return 0;

  const words = text.toLowerCase().split(/\s+/);
  const keywordMatches = keywords.reduce((count, keyword) => {
    const keywordWords = keyword.toLowerCase().split(/\s+/);
    return count + keywordWords.filter(word => words.includes(word)).length;
  }, 0);

  return words.length > 0 ? (keywordMatches / words.length) * 100 : 0;
}

/**
 * Delay utility for retries
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}