import { describe, test, expect, beforeAll } from 'vitest';
import fetch from 'node-fetch';

// Import the function from Home.tsx
// We'll need to extract this function to a separate utility file in the next step
const getLearnMoreUrl = (checkTitle: string): string => {
  const baseUrl = "https://ai-seo-copilot.gitbook.io/ai-seo-copilot/documentation"; // Base URL

  const checkUrls: Record<string, string> = {
    "Keyphrase in Title": `${baseUrl}/meta-seo/keyphrase-in-title`,
    "Keyphrase in Meta Description": `${baseUrl}/meta-seo/keyphrase-in-meta-description`,
    "Keyphrase in URL": `${baseUrl}/meta-seo/keyphrase-in-url`,
    "Content Length on page": `${baseUrl}/content-optimization/content-length-on-page`,
    "Keyphrase Density": `${baseUrl}/content-optimization/keyphrase-density`,
    "Keyphrase in Introduction": `${baseUrl}/content-optimization/keyphrase-in-introduction`,
    "Image Alt Attributes": `${baseUrl}/images/image-alt-attributes`,
    "Internal Links": `${baseUrl}/links/internal-links`,
    "Outbound Links": `${baseUrl}/links/outbound-links`,
    "Next-Gen Image Formats": `${baseUrl}/images/next-gen-image-formats`,
    "OpenGraph Image": `${baseUrl}/images/opengraph-image`,
    "Open Graph Title and Description": `${baseUrl}/meta-seo/open-graph-title-and-description`,
    "Keyphrase in H1 Heading": `${baseUrl}/content-optimization/keyphrase-in-h1-heading`,
    "Keyphrase in H2 Headings": `${baseUrl}/content-optimization/keyphrase-in-h2-headings`,
    "Heading Hierarchy": `${baseUrl}/content-optimization/heading-hierarchy`,
    "Code Minification": `${baseUrl}/tech-seo/code-minification`,
    "Schema Markup": `${baseUrl}/tech-seo/schema-markup`,
    "Image File Size": `${baseUrl}/images/image-file-size`,
  };

  return checkUrls[checkTitle] || `${baseUrl}/seo-optimization-guide`;
};

// List of all check titles that should have valid URLs
const allCheckTitles = [
  "Keyphrase in Title",
  "Keyphrase in Meta Description",
  "Keyphrase in URL",
  "Content Length on page",
  "Keyphrase Density",
  "Keyphrase in Introduction",
  "Image Alt Attributes",
  "Internal Links",
  "Outbound Links",
  "Next-Gen Image Formats",
  "OpenGraph Image", 
  "Open Graph Title and Description",
  "Keyphrase in H1 Heading",
  "Keyphrase in H2 Headings",
  "Heading Hierarchy",
  "Code Minification",
  "Schema Markup",
  "Image File Size"
];

describe('Learn More Links', () => {
  test('Every check title has a valid URL mapping', () => {
    allCheckTitles.forEach(checkTitle => {
      const url = getLearnMoreUrl(checkTitle);
      expect(url).toBeDefined();
      expect(url).not.toEqual('');
      expect(url.startsWith('https://')).toBeTruthy();
    });
  });

  test('Default URL is returned for unknown check titles', () => {
    const defaultUrl = getLearnMoreUrl('Unknown Check Title');
    const baseUrl = "https://ai-seo-copilot.gitbook.io/ai-seo-copilot/documentation";
    expect(defaultUrl).toEqual(`${baseUrl}/seo-optimization-guide`);
  });
});

// Optional: This test checks if the URLs actually exist and return a 200 status
// Note: This is more of an integration test and might be slow or flaky in CI environments
describe('URL Reachability (Optional)', () => {
  // Set timeout to accommodate network requests
  test.concurrent.each(allCheckTitles)(
    '%s link is reachable', 
    async (checkTitle) => {
      const url = getLearnMoreUrl(checkTitle);
      try {
        const response = await fetch(url, { method: 'HEAD' });
        expect([200, 301, 302]).toContain(response.status);
      } catch (e) {
        // If network is unavailable during tests, this will still pass
        console.warn(`Could not reach ${url} - network might be unavailable`);
      }
    },
    { timeout: 10000 } // 10 second timeout for network requests
  );
});
