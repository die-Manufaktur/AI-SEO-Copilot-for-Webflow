/**
 * TDD Tests for AI Recommendations Service
 * RED Phase: These tests should FAIL initially until implementation is complete
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateRecommendations } from './aiRecommendations';
import type { AIRecommendationRequest, AIRecommendationResponse } from './aiRecommendations';

// Mock fetch for AI API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AI Recommendations Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up environment variables - mock both window.env and process.env
    vi.stubEnv('VITE_WORKER_URL', 'http://localhost:8787');
    vi.stubEnv('USE_GPT_RECOMMENDATIONS', 'true');
    
    // Also mock process.env for Node.js environment
    process.env.USE_GPT_RECOMMENDATIONS = 'true';
    process.env.VITE_WORKER_URL = 'http://localhost:8787';
    
    // Mock window.env for browser environment
    Object.defineProperty(window, 'env', {
      value: {
        USE_GPT_RECOMMENDATIONS: 'true',
        VITE_WORKER_URL: 'http://localhost:8787'
      },
      configurable: true,
      writable: true
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    
    // Clean up process.env
    delete process.env.USE_GPT_RECOMMENDATIONS;
    delete process.env.VITE_WORKER_URL;
    
    // Clean up window.env
    delete (window as any).env;
  });

  describe('generateRecommendations', () => {
    it('should generate AI-powered title and description recommendations', async () => {
      const mockResponse: AIRecommendationResponse = {
        title: 'AI-Optimized Page Title for Maximum Engagement',
        description: 'This is an AI-generated meta description that includes relevant keywords and compelling copy to improve click-through rates from search engine results pages.',
        keywords: ['optimization', 'AI', 'SEO', 'engagement'],
        reasoning: {
          title: 'Optimized for search intent and emotional triggers',
          description: 'Balanced keyword density with natural language flow',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockResponse }),
      });

      const request: AIRecommendationRequest = {
        content: {
          title: 'Old Page Title',
          description: 'Old meta description',
        },
        options: {
          targetKeywords: ['optimization', 'AI'],
          contentType: 'landing_page',
          language: 'en',
        },
      };

      const result = await generateRecommendations(request);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8787/api/ai-recommendations',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        })
      );
    });

    it('should handle different content types appropriately', async () => {
      const blogResponse: AIRecommendationResponse = {
        title: 'Complete Guide to AI Optimization: Expert Tips',
        description: 'Learn advanced AI optimization techniques in this comprehensive guide. Discover proven strategies, best practices, and actionable insights.',
        keywords: ['AI optimization', 'guide', 'tips'],
        reasoning: {
          title: 'Optimized for blog post search intent',
          description: 'Educational tone with clear value proposition',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: blogResponse }),
      });

      const request: AIRecommendationRequest = {
        content: {
          title: 'AI Guide',
          description: 'Learn about AI',
        },
        options: {
          targetKeywords: ['AI optimization'],
          contentType: 'blog_post',
          language: 'en',
        },
      };

      const result = await generateRecommendations(request);

      expect(result.title).toContain('Guide');
      expect(result.description).toContain('Learn');
      expect(result.reasoning?.title).toContain('blog post');
    });

    it('should support multiple languages', async () => {
      const frenchResponse: AIRecommendationResponse = {
        title: 'Guide Complet d\'Optimisation IA: Conseils d\'Expert',
        description: 'Découvrez les techniques avancées d\'optimisation IA dans ce guide complet. Stratégies éprouvées et conseils pratiques inclus.',
        keywords: ['optimisation IA', 'guide', 'conseils'],
        reasoning: {
          title: 'Optimisé pour l\'intention de recherche en français',
          description: 'Ton éducatif avec proposition de valeur claire',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: frenchResponse }),
      });

      const request: AIRecommendationRequest = {
        content: {
          title: 'Guide IA',
          description: 'Apprendre l\'IA',
        },
        options: {
          targetKeywords: ['optimisation IA'],
          contentType: 'blog_post',
          language: 'fr',
        },
      };

      const result = await generateRecommendations(request);

      expect(result.title).toMatch(/[àâäéèêëïîôöùûüÿç]/); // Contains French characters
      expect(result.description).toMatch(/[àâäéèêëïîôöùûüÿç]/);
    });

    it('should include keyword optimization in recommendations', async () => {
      const mockResponse: AIRecommendationResponse = {
        title: 'Premium SEO Tools - Best Keyword Optimization Software',
        description: 'Discover powerful SEO tools and keyword optimization software designed for maximum search visibility and organic traffic growth.',
        keywords: ['SEO tools', 'keyword optimization', 'search visibility'],
        reasoning: {
          title: 'Keywords strategically placed at beginning and end',
          description: 'Primary keywords integrated naturally with compelling CTAs',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockResponse }),
      });

      const request: AIRecommendationRequest = {
        content: {
          title: 'Tools',
          description: 'Software for SEO',
        },
        options: {
          targetKeywords: ['SEO tools', 'keyword optimization'],
          contentType: 'product_page',
        },
      };

      const result = await generateRecommendations(request);

      expect(result.title).toContain('SEO tools');
      expect(result.description).toContain('keyword optimization');
      expect(result.keywords).toContain('SEO tools');
      expect(result.keywords).toContain('keyword optimization');
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const request: AIRecommendationRequest = {
        content: {
          title: 'Test Title',
          description: 'Test description',
        },
        options: {
          targetKeywords: ['test'],
        },
      };

      await expect(generateRecommendations(request)).rejects.toThrow(
        'AI recommendations API error: 500 Internal Server Error'
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network connection failed'));

      const request: AIRecommendationRequest = {
        content: {
          title: 'Test Title',
          description: 'Test description',
        },
        options: {
          targetKeywords: ['test'],
        },
      };

      await expect(generateRecommendations(request)).rejects.toThrow(
        'Failed to generate AI recommendations'
      );
    });

    it('should validate request content', async () => {
      const invalidRequest = {
        content: {
          title: '',
          description: '',
        },
        options: {},
      } as AIRecommendationRequest;

      await expect(generateRecommendations(invalidRequest)).rejects.toThrow(
        'Content title or description is required'
      );
    });

    it('should handle missing environment configuration', async () => {
      vi.unstubAllEnvs();
      vi.stubEnv('USE_GPT_RECOMMENDATIONS', 'false');

      const request: AIRecommendationRequest = {
        content: {
          title: 'Test Title',
          description: 'Test description',
        },
        options: {
          targetKeywords: ['test'],
        },
      };

      await expect(generateRecommendations(request)).rejects.toThrow(
        'AI recommendations are disabled'
      );
    });

    it('should provide fallback recommendations when AI fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      const request: AIRecommendationRequest = {
        content: {
          title: 'Original Title',
          description: 'Original description',
        },
        options: {
          targetKeywords: ['keyword'],
          enableFallback: true,
        },
      };

      const result = await generateRecommendations(request);

      expect(result.title).toContain('keyword');
      expect(result.description).toContain('keyword');
      expect(result.reasoning?.title).toContain('fallback');
    });

    it('should respect rate limiting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Headers({
          'Retry-After': '60',
        }),
      });

      const request: AIRecommendationRequest = {
        content: {
          title: 'Test Title',
          description: 'Test description',
        },
        options: {
          targetKeywords: ['test'],
        },
      };

      await expect(generateRecommendations(request)).rejects.toThrow(
        'Rate limit exceeded. Retry after 60 seconds'
      );
    });

    it('should include content length optimization', async () => {
      const mockResponse: AIRecommendationResponse = {
        title: 'Perfect Length SEO Title - 45 Characters',
        description: 'This meta description is optimized to exactly 155 characters for maximum search engine visibility and user engagement rates.',
        keywords: ['SEO', 'optimization', 'length'],
        reasoning: {
          title: 'Optimized to 45 characters for ideal SERP display',
          description: 'Optimized to 155 characters for complete SERP visibility',
        },
        metadata: {
          titleLength: 45,
          descriptionLength: 155,
          keywordDensity: 8.5,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockResponse }),
      });

      const request: AIRecommendationRequest = {
        content: {
          title: 'Very long title that exceeds the recommended character limit for SEO optimization',
          description: 'Short desc',
        },
        options: {
          optimizeLength: true,
        },
      };

      const result = await generateRecommendations(request);

      expect(result.metadata?.titleLength).toBeLessThanOrEqual(60);
      expect(result.metadata?.descriptionLength).toBeGreaterThanOrEqual(120);
      expect(result.metadata?.descriptionLength).toBeLessThanOrEqual(160);
    });
  });

  describe('Error Recovery', () => {
    it('should retry failed requests with exponential backoff', async () => {
      // First call fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            title: 'Retry Success Title',
            description: 'Successfully retried description',
            keywords: ['retry', 'success'],
          },
        }),
      });

      const request: AIRecommendationRequest = {
        content: {
          title: 'Test Title',
          description: 'Test description',
        },
        options: {
          targetKeywords: ['test'],
          retryOnFailure: true,
        },
      };

      const result = await generateRecommendations(request);

      expect(result.title).toBe('Retry Success Title');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});