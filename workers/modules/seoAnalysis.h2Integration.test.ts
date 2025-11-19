/**
 * Integration tests for H2 heading text retrieval from Webflow Designer API
 * Testing that SEO analysis uses H2 content from Designer API when available
 */

import { describe, it, expect, vi } from 'vitest';
import { analyzeSEOElements } from './seoAnalysis';
import type { SEOCheck, WebflowPageData, ScrapedPageData, H2ElementInfo, Resource } from '../../shared/types';

describe('SEO Analysis - H2 Heading Integration with Designer API', () => {
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
});