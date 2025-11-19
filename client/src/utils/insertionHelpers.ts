/**
 * Utility functions for converting SEO recommendations to Webflow insertion requests
 */

import type { WebflowInsertionRequest } from '../types/webflow-data-api';

export interface RecommendationContext {
  checkTitle: string;
  recommendation: string;
  pageId?: string;
  cmsItemId?: string;
  fieldId?: string;
}

/**
 * Convert an SEO recommendation to a WebflowInsertionRequest
 */
export function createInsertionRequest(
  context: RecommendationContext
): WebflowInsertionRequest | null {
  const { checkTitle, recommendation, pageId, cmsItemId, fieldId } = context;

  // Map SEO check titles to insertion types
  const insertionType = getInsertionTypeFromCheckTitle(checkTitle);
  
  if (!insertionType) {
    return null;
  }

  const baseRequest: WebflowInsertionRequest = {
    type: insertionType,
    value: recommendation,
    checkTitle: checkTitle,
  };

  // Add context-specific parameters
  if (pageId) {
    baseRequest.pageId = pageId;
  }

  if (cmsItemId) {
    baseRequest.cmsItemId = cmsItemId;
  }

  if (fieldId) {
    baseRequest.fieldId = fieldId;
  }

  // For custom code (schema), default to head placement
  if (insertionType === 'custom_code') {
    baseRequest.location = 'head';
  }

  // For content elements, set targeting information
  // NOTE: h1_heading, h2_heading, and introduction insertion types work in test environments
  // but may have limited availability in production due to Webflow Designer API write permissions (issue #504)

  return baseRequest;
}

/**
 * Map SEO check titles to Webflow insertion types
 */
function getInsertionTypeFromCheckTitle(
  checkTitle: string
): 'page_title' | 'meta_description' | 'page_seo' | 'page_slug' | 'cms_field' | 'custom_code' | 'h1_heading' | 'h2_heading' | 'introduction_text' | null {
  // Normalize the check title for comparison
  const normalizedTitle = checkTitle.toLowerCase().trim();

  // Title-related checks
  if (
    normalizedTitle.includes('title tag') ||
    normalizedTitle.includes('page title') ||
    normalizedTitle.includes('seo title') ||
    normalizedTitle.includes('keyphrase in title') ||
    normalizedTitle === 'title'
  ) {
    return 'page_title';
  }

  // Meta description checks
  if (
    normalizedTitle.includes('meta description') ||
    normalizedTitle.includes('description tag') ||
    normalizedTitle.includes('page description')
  ) {
    return 'meta_description';
  }

  // URL/Slug-related checks
  if (
    normalizedTitle.includes('keyphrase in url') ||
    normalizedTitle.includes('url slug') ||
    normalizedTitle.includes('page url') ||
    normalizedTitle.includes('seo url') ||
    normalizedTitle === 'url'
  ) {
    return 'page_slug';
  }

  // Schema/Structured data checks
  if (
    normalizedTitle.includes('schema markup') ||
    normalizedTitle.includes('structured data') ||
    normalizedTitle.includes('json-ld') ||
    normalizedTitle.includes('schema.org') ||
    normalizedTitle.includes('schema')
  ) {
    return 'custom_code';
  }

  // General SEO checks that might affect multiple fields
  if (
    normalizedTitle.includes('open graph') ||
    normalizedTitle.includes('og:') ||
    normalizedTitle.includes('social media') ||
    normalizedTitle.includes('seo')
  ) {
    return 'page_seo';
  }

  // CMS field checks (for collection items)
  if (
    normalizedTitle.includes('cms') ||
    normalizedTitle.includes('collection') ||
    normalizedTitle.includes('dynamic')
  ) {
    return 'cms_field';
  }

  // H1 heading checks - Now supported with Webflow Designer API v2
  if (
    normalizedTitle.includes('keyphrase in h1') ||
    normalizedTitle.includes('h1 heading') ||
    normalizedTitle === 'h1'
  ) {
    return 'h1_heading';
  }

  // H2 heading checks - Now supported with Webflow Designer API v2  
  if (
    normalizedTitle.includes('keyphrase in h2') ||
    normalizedTitle.includes('h2 heading') ||
    normalizedTitle.includes('h2 headings') ||
    normalizedTitle === 'h2'
  ) {
    return 'h2_heading';
  }

  // Introduction paragraph checks - Now supported with Webflow Designer API v2
  // Note: 'Keyphrase in Introduction' is excluded from apply functionality per user request
  if (
    (normalizedTitle.includes('introduction') ||
    normalizedTitle.includes('first paragraph') ||
    normalizedTitle.includes('intro')) &&
    !normalizedTitle.includes('keyphrase in introduction')
  ) {
    return 'introduction_text';
  }

  // Return null for checks that don't map to insertable content
  return null;
}

/**
 * Check if a recommendation can be applied directly
 */
export function canApplyRecommendation(checkTitle: string): boolean {
  return getInsertionTypeFromCheckTitle(checkTitle) !== null;
}

/**
 * Get a human-readable description of what will be applied
 */
export function getApplyDescription(checkTitle: string): string {
  const insertionType = getInsertionTypeFromCheckTitle(checkTitle);
  
  switch (insertionType) {
    case 'page_title':
      return 'Apply as page title';
    case 'meta_description':
      return 'Apply as meta description';
    case 'page_slug':
      return 'Apply as page URL slug';
    case 'custom_code':
      return 'Apply schema to page head';
    case 'page_seo':
      return 'Apply SEO settings';
    case 'cms_field':
      return 'Apply to CMS field';
    case 'h1_heading':
      return 'Apply as H1 heading';
    case 'h2_heading':
      return 'Apply as first H2 heading';
    case 'introduction_text':
      return 'Apply as introduction paragraph';
    default:
      // Check if it's specifically the disabled 'Keyphrase in Introduction' check
      if (checkTitle.toLowerCase().includes('keyphrase in introduction')) {
        return 'This recommendation cannot be applied automatically';
      }
      return 'Apply content';
  }
}


/**
 * Create batch insertion request from multiple recommendations
 */
export function createBatchInsertionRequest(
  contexts: RecommendationContext[]
): { operations: WebflowInsertionRequest[] } | null {
  const operations = contexts
    .map(createInsertionRequest)
    .filter((request): request is WebflowInsertionRequest => request !== null);

  if (operations.length === 0) {
    return null;
  }

  return {
    operations,
  };
}