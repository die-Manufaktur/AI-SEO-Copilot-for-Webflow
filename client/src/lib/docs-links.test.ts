import { describe, it, expect } from 'vitest';
import { getLearnMoreUrl } from './docs-links';

describe('docs-links', () => {
  describe('getLearnMoreUrl', () => {
    const baseUrl = 'https://ai-seo-copilot.gitbook.io/ai-seo-copilot/documentation';
    const defaultUrl = `${baseUrl}/seo-optimization-guide`;

    it('should return correct URLs for meta SEO checks', () => {
      expect(getLearnMoreUrl('Keyphrase in Title')).toBe(
        `${baseUrl}/meta-seo/keyphrase-in-title`
      );
      expect(getLearnMoreUrl('Keyphrase in Meta Description')).toBe(
        `${baseUrl}/meta-seo/keyphrase-in-meta-description`
      );
      expect(getLearnMoreUrl('Keyphrase in URL')).toBe(
        `${baseUrl}/meta-seo/keyphrase-in-url`
      );
      expect(getLearnMoreUrl('Open Graph Title and Description')).toBe(
        `${baseUrl}/meta-seo/open-graph-title-and-description`
      );
    });

    it('should return correct URLs for content optimization checks', () => {
      expect(getLearnMoreUrl('Content Length on page')).toBe(
        `${baseUrl}/content-optimization/content-length-on-page`
      );
      expect(getLearnMoreUrl('Keyphrase Density')).toBe(
        `${baseUrl}/content-optimization/keyphrase-density`
      );
      expect(getLearnMoreUrl('Keyphrase in Introduction')).toBe(
        `${baseUrl}/content-optimization/keyphrase-in-introduction`
      );
      expect(getLearnMoreUrl('Keyphrase in H1 Heading')).toBe(
        `${baseUrl}/content-optimization/keyphrase-in-h1-heading`
      );
      expect(getLearnMoreUrl('Keyphrase in H2 Headings')).toBe(
        `${baseUrl}/content-optimization/keyphrase-in-h2-headings`
      );
      expect(getLearnMoreUrl('Heading Hierarchy')).toBe(
        `${baseUrl}/content-optimization/heading-hierarchy`
      );
    });

    it('should return correct URLs for image checks', () => {
      expect(getLearnMoreUrl('Image Alt Attributes')).toBe(
        `${baseUrl}/images/image-alt-attributes`
      );
      expect(getLearnMoreUrl('Next-Gen Image Formats')).toBe(
        `${baseUrl}/images/next-gen-image-formats`
      );
      expect(getLearnMoreUrl('OpenGraph Image')).toBe(
        `${baseUrl}/images/opengraph-image`
      );
      expect(getLearnMoreUrl('Image File Size')).toBe(
        `${baseUrl}/images/image-file-size`
      );
    });

    it('should return correct URLs for link checks', () => {
      expect(getLearnMoreUrl('Internal Links')).toBe(
        `${baseUrl}/links/internal-links`
      );
      expect(getLearnMoreUrl('Outbound Links')).toBe(
        `${baseUrl}/links/outbound-links`
      );
    });

    it('should return correct URLs for technical SEO checks', () => {
      expect(getLearnMoreUrl('Code Minification')).toBe(
        `${baseUrl}/tech-seo/code-minification`
      );
      expect(getLearnMoreUrl('Schema Markup')).toBe(
        `${baseUrl}/tech-seo/schema-markup`
      );
    });

    it('should return default URL for unknown check titles', () => {
      expect(getLearnMoreUrl('Unknown Check')).toBe(defaultUrl);
      expect(getLearnMoreUrl('')).toBe(defaultUrl);
      expect(getLearnMoreUrl('Random Title')).toBe(defaultUrl);
    });

    it('should handle case-sensitive check titles', () => {
      // Should not match due to case sensitivity
      expect(getLearnMoreUrl('keyphrase in title')).toBe(defaultUrl);
      expect(getLearnMoreUrl('KEYPHRASE IN TITLE')).toBe(defaultUrl);
    });

    it('should handle special characters in check titles', () => {
      // Should match exact titles with special characters
      expect(getLearnMoreUrl('Next-Gen Image Formats')).toBe(
        `${baseUrl}/images/next-gen-image-formats`
      );
    });

    it('should handle all defined check titles', () => {
      const definedChecks = [
        'Keyphrase in Title',
        'Keyphrase in Meta Description',
        'Keyphrase in URL',
        'Content Length on page',
        'Keyphrase Density',
        'Keyphrase in Introduction',
        'Image Alt Attributes',
        'Internal Links',
        'Outbound Links',
        'Next-Gen Image Formats',
        'OpenGraph Image',
        'Open Graph Title and Description',
        'Keyphrase in H1 Heading',
        'Keyphrase in H2 Headings',
        'Heading Hierarchy',
        'Code Minification',
        'Schema Markup',
        'Image File Size'
      ];

      // Each defined check should return a specific URL (not the default)
      definedChecks.forEach(checkTitle => {
        const url = getLearnMoreUrl(checkTitle);
        expect(url).not.toBe(defaultUrl);
        expect(url).toContain(baseUrl);
      });
    });

    it('should return valid URLs', () => {
      const checkTitle = 'Keyphrase in Title';
      const url = getLearnMoreUrl(checkTitle);
      
      expect(url).toMatch(/^https:\/\//);
      expect(() => new URL(url)).not.toThrow();
    });
  });
});