/**
 * Simple AI Recommendations Service Tests (No MSW dependencies)
 * GREEN Phase: Verify basic functionality works
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateRecommendations } from './aiRecommendations';
import type { AIRecommendationRequest } from './aiRecommendations';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AI Recommendations Service (Simple)', () => {
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

  it('should generate AI recommendations successfully', async () => {
    const mockResponse = {
      title: 'AI-Optimized Page Title for Maximum Engagement',
      description: 'This is an AI-generated meta description that includes relevant keywords and compelling copy.',
      keywords: ['optimization', 'AI', 'SEO'],
      reasoning: {
        title: 'Optimized for search intent',
        description: 'Balanced keyword density',
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
      },
    };

    const result = await generateRecommendations(request);

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8787/api/ai-recommendations',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })
    );
  });

  it('should handle disabled AI recommendations', async () => {
    vi.unstubAllEnvs();
    vi.stubEnv('USE_GPT_RECOMMENDATIONS', 'false');
    
    // Clean up and set disabled state
    process.env.USE_GPT_RECOMMENDATIONS = 'false';
    delete (window as any).env;

    const request: AIRecommendationRequest = {
      content: { title: 'Test Title' },
      options: {},
    };

    await expect(generateRecommendations(request)).rejects.toThrow(
      'AI recommendations are disabled'
    );
  });

  it('should validate required content', async () => {
    const request: AIRecommendationRequest = {
      content: { title: '', description: '' },
      options: {},
    };

    await expect(generateRecommendations(request)).rejects.toThrow(
      'Content title or description is required'
    );
  });

  it('should generate fallback recommendations when enabled', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const request: AIRecommendationRequest = {
      content: { title: 'Test Title' },
      options: {
        targetKeywords: ['test', 'optimization'],
        enableFallback: true,
      },
    };

    const result = await generateRecommendations(request);

    expect(result.title).toContain('test');
    expect(result.description).toContain('test');
    expect(result.reasoning?.title).toContain('fallback');
  });

  it('should handle rate limiting errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      headers: new Headers({ 'Retry-After': '60' }),
    });

    const request: AIRecommendationRequest = {
      content: { title: 'Test Title' },
      options: {},
    };

    await expect(generateRecommendations(request)).rejects.toThrow(
      'Rate limit exceeded. Retry after 60 seconds'
    );
  });
});