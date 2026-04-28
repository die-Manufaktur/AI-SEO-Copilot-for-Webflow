/**
 * Recommendation Helper Functions
 * Utilities for managing SEO recommendation operations
 */

// List of recommendation types that can be automatically applied
const APPLICABLE_RECOMMENDATIONS = [
  'Page Title',
  'Meta Description', 
  'Page Slug',
  'H1 Heading',
  'Introduction Text',
  'Custom Code',
  'Open Graph Title',
  'Open Graph Description',
  'Twitter Card Title',
  'Twitter Card Description',
  'Schema Markup',
];

/**
 * Check if a recommendation can be automatically applied
 * @param checkTitle - The title of the SEO check
 * @returns Whether the recommendation can be applied
 */
export function canApplyRecommendation(checkTitle: string): boolean {
  return APPLICABLE_RECOMMENDATIONS.includes(checkTitle);
}

/**
 * Get the insertion type for a recommendation
 * @param checkTitle - The title of the SEO check
 * @returns The corresponding insertion type
 */
export function getInsertionType(checkTitle: string): string {
  const typeMap: Record<string, string> = {
    'Page Title': 'page_title',
    'Meta Description': 'meta_description',
    'Page Slug': 'page_slug',
    'H1 Heading': 'h1_heading',
    'Introduction Text': 'introduction_text',
    'Custom Code': 'custom_code',
    'Open Graph Title': 'page_seo',
    'Open Graph Description': 'page_seo',
    'Twitter Card Title': 'page_seo',
    'Twitter Card Description': 'page_seo',
    'Schema Markup': 'custom_code',
  };

  return typeMap[checkTitle] || 'unknown';
}

/**
 * Check if a recommendation requires confirmation before applying
 * @param checkTitle - The title of the SEO check
 * @returns Whether confirmation is required
 */
export function requiresConfirmation(checkTitle: string): boolean {
  const CONFIRMATION_REQUIRED = [
    'Custom Code',
    'Schema Markup',
    'Page Slug', // Can affect URLs
  ];

  return CONFIRMATION_REQUIRED.includes(checkTitle);
}

/**
 * Get user-friendly description of what applying a recommendation will do
 * @param checkTitle - The title of the SEO check
 * @returns Description of the action
 */
export function getApplyDescription(checkTitle: string): string {
  const descriptions: Record<string, string> = {
    'Page Title': 'Update the page title in Webflow',
    'Meta Description': 'Update the meta description in page settings',
    'Page Slug': 'Update the page URL slug (Warning: This will change the page URL)',
    'H1 Heading': 'Update the H1 heading element on the page',
    'Introduction Text': 'Update the introduction paragraph text',
    'Custom Code': 'Add custom code to the page',
    'Open Graph Title': 'Update Open Graph title in page SEO settings',
    'Open Graph Description': 'Update Open Graph description in page SEO settings',
    'Twitter Card Title': 'Update Twitter Card title in page SEO settings',
    'Twitter Card Description': 'Update Twitter Card description in page SEO settings',
    'Schema Markup': 'Add Schema.org structured data to the page',
  };

  return descriptions[checkTitle] || 'Apply the recommended changes';
}

// Individual H2 Recommendation Functions

import type { H2ElementInfo } from '../lib/webflowDesignerApi';

/**
 * Generates individual contextual recommendations for each H2 element
 * This is a frontend utility that creates unique recommendations for each H2
 * based on their current content and the target keyphrase.
 */
export function generateIndividualH2Recommendations(
  h2Elements: H2ElementInfo[],
  keyphrase: string,
  baseRecommendation?: string
): string[] {
  if (!h2Elements || h2Elements.length === 0) {
    return [];
  }

  const recommendations: string[] = [];
  const usedRecommendations = new Set<string>();

  for (let i = 0; i < h2Elements.length; i++) {
    const h2Element = h2Elements[i];
    const currentText = h2Element.text?.trim() || '';
    
    let recommendation: string;

    if (currentText) {
      // Generate contextual recommendation based on current text
      if (currentText.toLowerCase().includes(keyphrase.toLowerCase())) {
        // Current text already contains keyphrase - suggest optimization
        recommendation = `${currentText} (Already optimized - contains "${keyphrase}")`;
      } else {
        // Suggest incorporating keyphrase into existing text
        const variations = [
          `${keyphrase}: ${currentText}`,
          `${currentText} with ${keyphrase}`,
          `How ${keyphrase} ${currentText.toLowerCase()}`,
          `${currentText} - ${keyphrase} Guide`,
          `Master ${keyphrase} ${currentText.toLowerCase()}`
        ];
        
        // Pick a variation that hasn't been used yet
        let selectedVariation = variations[i % variations.length];
        let attempt = 0;
        while (usedRecommendations.has(selectedVariation) && attempt < variations.length) {
          attempt++;
          selectedVariation = variations[(i + attempt) % variations.length];
        }
        recommendation = selectedVariation;
      }
    } else {
      // Generate recommendation for empty H2
      const emptyH2Variations = [
        `Why Choose ${keyphrase}?`,
        `${keyphrase} Benefits You Need to Know`,
        `Getting Started with ${keyphrase}`,
        `${keyphrase} Best Practices`,
        `Common ${keyphrase} Questions Answered`,
        `${keyphrase} Tips and Tricks`,
        `How ${keyphrase} Can Help You`,
        `The Ultimate ${keyphrase} Guide`
      ];
      
      let selectedVariation = emptyH2Variations[i % emptyH2Variations.length];
      let attempt = 0;
      while (usedRecommendations.has(selectedVariation) && attempt < emptyH2Variations.length) {
        attempt++;
        selectedVariation = emptyH2Variations[(i + attempt) % emptyH2Variations.length];
      }
      recommendation = selectedVariation;
    }

    // Ensure the recommendation is unique
    if (usedRecommendations.has(recommendation)) {
      recommendation = `${recommendation} (H2 #${i + 1})`;
    }

    usedRecommendations.add(recommendation);
    recommendations.push(recommendation);
  }

  return recommendations;
}

/**
 * Validates that we have the correct number of recommendations for H2 elements
 */
export function validateH2Recommendations(
  h2Elements: H2ElementInfo[],
  recommendations: string[]
): boolean {
  return h2Elements.length === recommendations.length;
}

/**
 * Ensures we have fallback recommendations if needed
 */
export function ensureH2Recommendations(
  h2Elements: H2ElementInfo[],
  recommendations: string[],
  keyphrase: string
): string[] {
  if (validateH2Recommendations(h2Elements, recommendations)) {
    return recommendations;
  }

  // Generate missing recommendations
  const missingCount = h2Elements.length - recommendations.length;
  if (missingCount > 0) {
    const additionalRecommendations = generateIndividualH2Recommendations(
      h2Elements.slice(recommendations.length),
      keyphrase
    );
    return [...recommendations, ...additionalRecommendations];
  }

  // Trim excess recommendations
  return recommendations.slice(0, h2Elements.length);
}