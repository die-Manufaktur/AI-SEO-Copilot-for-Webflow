import { describe, it, expect } from 'vitest';
import { createMockSEOCheck } from './test-helpers';
import type { SEOCheck } from '../types';

describe('test-helpers', () => {
  describe('createMockSEOCheck', () => {
    it('should create a default mock SEO check', () => {
      const mockCheck = createMockSEOCheck();

      expect(mockCheck).toEqual({
        title: 'Mock SEO Check',
        description: 'A mock SEO check for testing',
        priority: 'medium',
        passed: true
      });
    });

    it('should override default values with provided overrides', () => {
      const overrides: Partial<SEOCheck> = {
        title: 'Custom Title Check',
        priority: 'high',
        passed: false
      };

      const mockCheck = createMockSEOCheck(overrides);

      expect(mockCheck).toEqual({
        title: 'Custom Title Check',
        description: 'A mock SEO check for testing',
        priority: 'high',
        passed: false
      });
    });

    it('should handle all SEOCheck properties', () => {
      const overrides: Partial<SEOCheck> = {
        title: 'Complete SEO Check',
        description: 'A comprehensive SEO check',
        priority: 'low',
        passed: false,
        recommendation: 'Fix this issue immediately',
        introPhrase: 'Page analysis shows',
        matchedKeyword: 'primary',
        imageData: [
          {
            url: 'https://example.com/image.jpg',
            name: 'hero-image.jpg',
            shortName: 'hero-im...',
            size: 1024,
            mimeType: 'image/jpeg',
            alt: 'Hero image'
          }
        ]
      };

      const mockCheck = createMockSEOCheck(overrides);

      expect(mockCheck.title).toBe('Complete SEO Check');
      expect(mockCheck.description).toBe('A comprehensive SEO check');
      expect(mockCheck.priority).toBe('low');
      expect(mockCheck.passed).toBe(false);
      expect(mockCheck.recommendation).toBe('Fix this issue immediately');
      expect(mockCheck.introPhrase).toBe('Page analysis shows');
      expect(mockCheck.matchedKeyword).toBe('primary');
      expect(mockCheck.imageData).toHaveLength(1);
      expect(mockCheck.imageData?.[0].name).toBe('hero-image.jpg');
    });

    it('should handle partial overrides', () => {
      const overrides: Partial<SEOCheck> = {
        recommendation: 'Consider optimizing this element'
      };

      const mockCheck = createMockSEOCheck(overrides);

      // Default values should remain
      expect(mockCheck.title).toBe('Mock SEO Check');
      expect(mockCheck.description).toBe('A mock SEO check for testing');
      expect(mockCheck.priority).toBe('medium');
      expect(mockCheck.passed).toBe(true);

      // Override should be applied
      expect(mockCheck.recommendation).toBe('Consider optimizing this element');

      // Optional fields not specified should be undefined
      expect(mockCheck.introPhrase).toBeUndefined();
      expect(mockCheck.matchedKeyword).toBeUndefined();
      expect(mockCheck.imageData).toBeUndefined();
    });

    it('should handle empty overrides object', () => {
      const mockCheck = createMockSEOCheck({});

      expect(mockCheck).toEqual({
        title: 'Mock SEO Check',
        description: 'A mock SEO check for testing',
        priority: 'medium',
        passed: true
      });
    });

    it('should handle priority values correctly', () => {
      const priorities: Array<SEOCheck['priority']> = ['high', 'medium', 'low'];

      priorities.forEach(priority => {
        const mockCheck = createMockSEOCheck({ priority });
        expect(mockCheck.priority).toBe(priority);
        expect(['high', 'medium', 'low']).toContain(mockCheck.priority);
      });
    });

    it('should handle boolean passed values correctly', () => {
      const passedMock = createMockSEOCheck({ passed: true });
      const failedMock = createMockSEOCheck({ passed: false });

      expect(passedMock.passed).toBe(true);
      expect(failedMock.passed).toBe(false);
    });

    it('should handle complex image data', () => {
      const complexImageData = [
        {
          url: 'https://cdn.example.com/image1.jpg',
          name: 'main-hero-image.jpg',
          shortName: 'main-he...',
          size: 2048000,
          mimeType: 'image/jpeg',
          alt: 'Main hero banner image'
        },
        {
          url: 'https://cdn.example.com/image2.png',
          name: 'product-showcase.png',
          shortName: 'produc...',
          size: 512000,
          mimeType: 'image/png',
          alt: 'Product showcase image'
        }
      ];

      const mockCheck = createMockSEOCheck({
        title: 'Image Optimization Check',
        imageData: complexImageData
      });

      expect(mockCheck.imageData).toHaveLength(2);
      expect(mockCheck.imageData?.[0].size).toBe(2048000);
      expect(mockCheck.imageData?.[1].mimeType).toBe('image/png');
    });

    it('should return a new object instance each time', () => {
      const mock1 = createMockSEOCheck();
      const mock2 = createMockSEOCheck();

      // Should be equal in value but not the same reference
      expect(mock1).toEqual(mock2);
      expect(mock1).not.toBe(mock2);
    });

    it('should handle undefined optional properties correctly', () => {
      const mockCheck = createMockSEOCheck({
        recommendation: undefined,
        introPhrase: undefined,
        matchedKeyword: undefined,
        imageData: undefined
      });

      expect(mockCheck.recommendation).toBeUndefined();
      expect(mockCheck.introPhrase).toBeUndefined();
      expect(mockCheck.matchedKeyword).toBeUndefined();
      expect(mockCheck.imageData).toBeUndefined();
    });

    it('should be useful for creating test fixtures', () => {
      // Test scenario: Failed title tag check
      const failedTitleCheck = createMockSEOCheck({
        title: 'Title Tag Present',
        description: 'Checks if page has a title tag',
        priority: 'high',
        passed: false,
        recommendation: 'Add a descriptive title tag to improve SEO'
      });

      // Test scenario: Passed image alt text check
      const passedImageCheck = createMockSEOCheck({
        title: 'Image Alt Text',
        description: 'Checks if images have alt text',
        priority: 'medium',
        passed: true,
        matchedKeyword: 'secondary',
        imageData: [
          {
            url: 'https://example.com/hero.jpg',
            name: 'hero.jpg',
            shortName: 'hero.jpg',
            alt: 'Professional web design services'
          }
        ]
      });

      expect(failedTitleCheck.passed).toBe(false);
      expect(failedTitleCheck.priority).toBe('high');
      expect(passedImageCheck.passed).toBe(true);
      expect(passedImageCheck.imageData).toBeDefined();
    });
  });
});