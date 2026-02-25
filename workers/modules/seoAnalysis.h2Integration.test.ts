/**
 * Integration tests for H2 heading text retrieval from Webflow Designer API
 * Testing that SEO analysis uses H2 content from Designer API when available
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeSEOElements } from './seoAnalysis';
import type { SEOCheck, WebflowPageData, ScrapedPageData, H2ElementInfo, Resource } from '../../shared/types';
import { getAIRecommendation } from './aiRecommendations';

vi.mock('./aiRecommendations', () => ({
  getAIRecommendation: vi.fn(),
  shouldHaveCopyButton: vi.fn(() => true),
  handleRecommendationResult: vi.fn(),
}));

describe('SEO Analysis - H2 Heading Integration with Designer API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockEnv = {
    OPENAI_API_KEY: 'mock-key',
  };

  const createMockScrapedData = (headings: Array<{level: number, text: string}>): ScrapedPageData => ({
    url: 'https://example.com',
    title: 'Test Page',
    metaDescription: 'Test description',
    headings,
    content: 'Test content',
    paragraphs: ['Test paragraph content'],
    images: [],
    internalLinks: [],
    outboundLinks: [],
    resources: {
      js: [],
      css: []
    },
    canonicalUrl: 'https://example.com',
    metaKeywords: '',
    ogImage: '',
    schemaMarkup: { 
      hasSchema: false,
      schemaTypes: [],
      schemaCount: 0,
      detected: []
    }
  });

  const createMockWebflowPageData = (h2Elements?: H2ElementInfo[]): WebflowPageData => ({
    title: 'Test Page',
    metaDescription: 'Test description',
    openGraphImage: '',
    openGraphTitle: 'Test Page',
    openGraphDescription: 'Test description',
    usesTitleAsOpenGraphTitle: false,
    usesDescriptionAsOpenGraphDescription: false,
    ...(h2Elements && { h2Elements })
  });

  it('should use H2 content from Webflow Designer API when available', async () => {
    // Arrange
    const keyphrase = 'test keyword';
    const mockH2Elements: H2ElementInfo[] = [
      { id: 'h2-1', text: 'Our Services with test keyword', index: 0, element: {} as any },
      { id: 'h2-2', text: 'Why Choose Us', index: 1, element: {} as any }
    ];
    
    const scrapedData = createMockScrapedData([
      { level: 1, text: 'Main Heading' },
      // Note: scraped data has empty H2s because scraping doesn't work in Designer
      { level: 2, text: '' },
      { level: 2, text: '' }
    ]);

    const webflowPageData = createMockWebflowPageData(mockH2Elements);

    // Act
    const result = await analyzeSEOElements(
      scrapedData,
      keyphrase,
      'https://example.com',
      false,
      mockEnv,
      webflowPageData
    );

    // Assert
    const h2Check = result.checks.find((check: SEOCheck) => check.title === 'Keyphrase in H2 Headings');
    expect(h2Check).toBeDefined();
    expect(h2Check!.passed).toBe(true);
    expect(h2Check!.description).toContain('Good! The keyword "test keyword" is found');
  });

  it('should handle when H2 content from Designer API does not contain keyphrase', async () => {
    // Arrange
    const keyphrase = 'missing keyword';
    const mockH2Elements: H2ElementInfo[] = [
      { id: 'h2-1', text: 'Our Services', index: 0, element: {} as any },
      { id: 'h2-2', text: 'Contact Information', index: 1, element: {} as any }
    ];
    
    const scrapedData = createMockScrapedData([
      { level: 2, text: '' },
      { level: 2, text: '' }
    ]);

    const webflowPageData = createMockWebflowPageData(mockH2Elements);

    // Act
    const result = await analyzeSEOElements(
      scrapedData,
      keyphrase,
      'https://example.com',
      false,
      mockEnv,
      webflowPageData
    );

    // Assert
    const h2Check = result.checks.find((check: SEOCheck) => check.name === 'Keyphrase in H2 Headings');
    expect(h2Check).toBeDefined();
    expect(h2Check!.passed).toBe(false);
    expect(h2Check!.details).toContain('Our Services');
    expect(h2Check!.details).toContain('Contact Information');
    expect(h2Check!.errorMessage).toContain('do not contain the keyphrase');
  });

  it('should count H2s correctly when using Designer API data', async () => {
    // Arrange
    const keyphrase = 'services';
    const mockH2Elements: H2ElementInfo[] = [
      { id: 'h2-1', text: 'Our Services', index: 0, element: {} as any },
      { id: 'h2-2', text: 'Additional Services', index: 1, element: {} as any },
      { id: 'h2-3', text: 'Contact Us', index: 2, element: {} as any }
    ];
    
    const scrapedData = createMockScrapedData([]);
    const webflowPageData = createMockWebflowPageData(mockH2Elements);

    // Act
    const result = await analyzeSEOElements(
      scrapedData,
      keyphrase,
      'https://example.com',
      false,
      mockEnv,
      webflowPageData
    );

    // Assert
    const h2Check = result.checks.find((check: SEOCheck) => check.name === 'Keyphrase in H2 Headings');
    expect(h2Check).toBeDefined();
    expect(h2Check!.details).toContain('3 found'); // Should show correct count
    expect(h2Check!.passed).toBe(true); // Keyphrase found in 2 out of 3 H2s
  });

  it('should fall back to scraped data when Designer API H2 data is not available', async () => {
    // Arrange
    const keyphrase = 'fallback test';
    const scrapedData = createMockScrapedData([
      { level: 2, text: 'Fallback H2 with fallback test keyword' },
      { level: 2, text: 'Another H2' }
    ]);
    
    // webflowPageData without h2Elements property
    const webflowPageData = createMockWebflowPageData();

    // Act
    const result = await analyzeSEOElements(
      scrapedData,
      keyphrase,
      'https://example.com',
      false,
      mockEnv,
      webflowPageData
    );

    // Assert
    const h2Check = result.checks.find((check: SEOCheck) => check.name === 'Keyphrase in H2 Headings');
    expect(h2Check).toBeDefined();
    expect(h2Check!.passed).toBe(true);
    expect(h2Check!.details).toContain('Fallback H2 with fallback test keyword');
  });

  it('should handle empty H2 elements array from Designer API', async () => {
    // Arrange
    const keyphrase = 'test';
    const mockH2Elements: H2ElementInfo[] = []; // No H2s on page
    
    const scrapedData = createMockScrapedData([]);
    const webflowPageData = createMockWebflowPageData(mockH2Elements);

    // Act
    const result = await analyzeSEOElements(
      scrapedData,
      keyphrase,
      'https://example.com',
      false,
      mockEnv,
      webflowPageData
    );

    // Assert
    const h2Check = result.checks.find((check: SEOCheck) => check.name === 'Keyphrase in H2 Headings');
    expect(h2Check).toBeDefined();
    expect(h2Check!.passed).toBe(false);
    expect(h2Check!.details).toContain('0 found');
    expect(h2Check!.errorMessage).toContain('do not contain the keyphrase');
  });

  it('should handle H2s with empty text content from Designer API', async () => {
    // Arrange
    const keyphrase = 'test';
    const mockH2Elements: H2ElementInfo[] = [
      { id: 'h2-1', text: '', index: 0, element: {} as any },
      { id: 'h2-2', text: 'Valid H2 with test', index: 1, element: {} as any },
      { id: 'h2-3', text: '   ', index: 2, element: {} as any } // Only whitespace
    ];
    
    const scrapedData = createMockScrapedData([]);
    const webflowPageData = createMockWebflowPageData(mockH2Elements);

    // Act
    const result = await analyzeSEOElements(
      scrapedData,
      keyphrase,
      'https://example.com',
      false,
      mockEnv,
      webflowPageData
    );

    // Assert
    const h2Check = result.checks.find((check: SEOCheck) => check.name === 'Keyphrase in H2 Headings');
    expect(h2Check).toBeDefined();
    expect(h2Check!.passed).toBe(true);
    expect(h2Check!.details).toContain('3 found');
    expect(h2Check!.details).toContain('Valid H2 with test');
  });

  it('should set h2Recommendations to undefined when check passes', async () => {
    const keyphrase = 'test keyword';
    const mockH2Elements: H2ElementInfo[] = [
      { id: 'h2-1', text: 'Our Services with test keyword', index: 0, element: {} as any },
    ];
    const scrapedData = createMockScrapedData([
      { level: 1, text: 'Main Heading' },
      { level: 2, text: 'Our Services with test keyword' },
    ]);
    const webflowPageData = createMockWebflowPageData(mockH2Elements);

    const result = await analyzeSEOElements(
      scrapedData, keyphrase, 'https://example.com', false,
      mockEnv, webflowPageData
    );

    const h2Check = result.checks.find(c => c.name === 'Keyphrase in H2 Headings');
    expect(h2Check?.passed).toBe(true);
    expect(h2Check?.h2Recommendations).toBeUndefined();
  });

  it('should work with secondary keywords when using Designer API H2 data', async () => {
    // Arrange
    const keyphrase = 'primary';
    const secondaryKeywords = 'services, solutions';
    const mockH2Elements: H2ElementInfo[] = [
      { id: 'h2-1', text: 'Our Professional Services', index: 0, element: {} as any },
      { id: 'h2-2', text: 'Business Solutions', index: 1, element: {} as any }
    ];

    const scrapedData = createMockScrapedData([]);
    const webflowPageData = createMockWebflowPageData(mockH2Elements);

    // Act
    const result = await analyzeSEOElements(
      scrapedData,
      keyphrase,
      'https://example.com',
      false,
      mockEnv,
      webflowPageData,
      undefined,
      { secondaryKeywords }
    );

    // Assert
    const h2Check = result.checks.find((check: SEOCheck) => check.name === 'Keyphrase in H2 Headings');
    expect(h2Check).toBeDefined();
    expect(h2Check!.passed).toBe(true);
    expect(h2Check!.successMessage).toContain('keyword "services" is found'); // Should match secondary keyword
  });

  it('should populate h2Recommendations with per-H2 suggestions when check fails', async () => {
    const mockGetAI = vi.mocked(getAIRecommendation);
    // Return per-H2 suggestions for H2-specific calls, generic for all others
    mockGetAI.mockImplementation((_checkName, _keyphrase, _env, context) => {
      if (context === 'Our Services') return Promise.resolve('Test Keyword in Our Services');
      if (context === 'Why Choose Us') return Promise.resolve('Why We Use Test Keyword');
      return Promise.resolve('Generic suggestion');
    });

    const keyphrase = 'test keyword';
    const mockH2Elements: H2ElementInfo[] = [
      { id: 'h2-1', text: 'Our Services', index: 0, element: {} as any },
      { id: 'h2-2', text: 'Why Choose Us', index: 1, element: {} as any },
    ];
    const scrapedData = createMockScrapedData([
      { level: 1, text: 'Main Heading' },
      { level: 2, text: 'Our Services' },
      { level: 2, text: 'Why Choose Us' },
    ]);
    const webflowPageData = createMockWebflowPageData(mockH2Elements);
    const env = { OPENAI_API_KEY: 'mock-key', USE_GPT_RECOMMENDATIONS: 'true' };

    const result = await analyzeSEOElements(
      scrapedData, keyphrase, 'https://example.com', false,
      env, webflowPageData
    );

    const h2Check = result.checks.find(c => c.name === 'Keyphrase in H2 Headings');
    expect(h2Check?.passed).toBe(false);
    expect(h2Check?.h2Recommendations).toHaveLength(2);
    expect(h2Check?.h2Recommendations?.[0]).toEqual({
      h2Index: 0,
      h2Text: 'Our Services',
      suggestion: 'Test Keyword in Our Services',
    });
    expect(h2Check?.h2Recommendations?.[1]).toEqual({
      h2Index: 1,
      h2Text: 'Why Choose Us',
      suggestion: 'Why We Use Test Keyword',
    });
    // AI should be called with each H2's individual text, not concatenated
    expect(mockGetAI).toHaveBeenCalledWith(
      'Keyphrase in H2 Headings', keyphrase, env, 'Our Services', undefined
    );
    expect(mockGetAI).toHaveBeenCalledWith(
      'Keyphrase in H2 Headings', keyphrase, env, 'Why Choose Us', undefined
    );
  });

  it('should not populate h2Recommendations when no h2Elements in webflowPageData', async () => {
    const mockGetAI = vi.mocked(getAIRecommendation);
    mockGetAI.mockResolvedValue('Blanket H2 suggestion');

    const keyphrase = 'test keyword';
    const scrapedData = createMockScrapedData([
      { level: 1, text: 'Main Heading' },
      { level: 2, text: 'Our Services' },
    ]);
    // webflowPageData has no h2Elements
    const webflowPageData = createMockWebflowPageData();
    const env = { OPENAI_API_KEY: 'mock-key', USE_GPT_RECOMMENDATIONS: 'true' };

    const result = await analyzeSEOElements(
      scrapedData, keyphrase, 'https://example.com', false,
      env, webflowPageData
    );

    const h2Check = result.checks.find(c => c.name === 'Keyphrase in H2 Headings');
    expect(h2Check?.passed).toBe(false);
    expect(h2Check?.h2Recommendations).toBeUndefined();
    // Falls back to blanket recommendation
    expect(h2Check?.recommendation).toBeDefined();
  });
});
