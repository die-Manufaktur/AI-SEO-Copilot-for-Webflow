/**
 * Test data factory for generating SEO recommendation test data
 * Provides dynamic test data generation for various recommendation scenarios
 */

import { build, fake, sequence } from 'test-data-bot';

export interface TestRecommendation {
  id: string;
  type: 'page_title' | 'meta_description' | 'heading' | 'alt_text' | 'schema' | 'cms_field';
  category: 'technical' | 'content' | 'performance' | 'accessibility';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  currentValue?: string;
  suggestedValue: string;
  reasoning: string;
  impact: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'medium' | 'hard';
  elementSelector?: string;
  pageId?: string;
  cmsItemId?: string;
  fieldId?: string;
  language: string;
  isApplicable: boolean;
  isApplied: boolean;
  appliedAt?: string;
  estimatedMinutes?: number;
  resources?: TestRecommendationResource[];
}

export interface TestRecommendationResource {
  type: 'documentation' | 'tutorial' | 'tool' | 'example';
  title: string;
  url: string;
  description: string;
}

export interface TestSEOAnalysisResult {
  url: string;
  analysisId: string;
  timestamp: string;
  overallScore: number;
  recommendations: TestRecommendation[];
  metrics: {
    titleLength: number;
    metaDescriptionLength: number;
    headingStructure: {
      h1Count: number;
      h2Count: number;
      h3Count: number;
    };
    imageCount: number;
    imagesWithoutAlt: number;
    internalLinks: number;
    externalLinks: number;
  };
  issues: TestSEOIssue[];
}

export interface TestSEOIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: 'technical' | 'content' | 'performance' | 'accessibility';
  title: string;
  description: string;
  element?: string;
  recommendation?: string;
}

/**
 * Factory for generating SEO recommendations
 */
export const recommendationFactory = build<TestRecommendation>('Recommendation', {
  id: sequence((x: number) => `rec_${x.toString().padStart(5, '0')}`),
  type: fake((f) => f.helpers.arrayElement(['page_title', 'meta_description', 'heading', 'alt_text', 'schema'])),
  category: fake((f) => f.helpers.arrayElement(['technical', 'content', 'performance', 'accessibility'])),
  priority: fake((f) => f.helpers.arrayElement(['high', 'medium', 'low'])),
  title: fake((f) => f.lorem.sentence({ min: 3, max: 6 })),
  description: fake((f) => f.lorem.sentences({ min: 2, max: 4 })),
  suggestedValue: fake((f) => f.lorem.sentence({ min: 5, max: 12 })),
  reasoning: fake((f) => f.lorem.paragraph({ min: 2, max: 4 })),
  impact: fake((f) => f.helpers.arrayElement(['high', 'medium', 'low'])),
  difficulty: fake((f) => f.helpers.arrayElement(['easy', 'medium', 'hard'])),
  language: fake((f) => f.helpers.arrayElement(['en', 'fr', 'de', 'es', 'it'])),
  isApplicable: true,
  isApplied: false,
  estimatedMinutes: fake((f) => f.number.int({ min: 1, max: 30 })),
});

/**
 * Factory for generating recommendation resources
 */
export const recommendationResourceFactory = build<TestRecommendationResource>('RecommendationResource', {
  type: fake((f) => f.helpers.arrayElement(['documentation', 'tutorial', 'tool', 'example'])),
  title: fake((f) => f.lorem.sentence({ min: 3, max: 6 })),
  url: fake((f) => f.internet.url()),
  description: fake((f) => f.lorem.sentence({ min: 5, max: 10 })),
});

/**
 * Factory for generating SEO issues
 */
export const seoIssueFactory = build<TestSEOIssue>('SEOIssue', {
  id: sequence((x: number) => `issue_${x.toString().padStart(5, '0')}`),
  type: fake((f) => f.helpers.arrayElement(['error', 'warning', 'info'])),
  category: fake((f) => f.helpers.arrayElement(['technical', 'content', 'performance', 'accessibility'])),
  title: fake((f) => f.lorem.sentence({ min: 3, max: 6 })),
  description: fake((f) => f.lorem.sentences({ min: 2, max: 3 })),
  element: fake((f) => f.helpers.arrayElement(['<title>', '<meta name="description">', '<h1>', '<img>', '<a>'])),
  recommendation: fake((f) => f.lorem.sentence({ min: 4, max: 8 })),
});

/**
 * Factory for generating complete SEO analysis results
 */
export const seoAnalysisFactory = build<TestSEOAnalysisResult>('SEOAnalysis', {
  url: fake((f) => f.internet.url()),
  analysisId: sequence((x: number) => `analysis_${x.toString().padStart(8, '0')}`),
  timestamp: fake((f) => f.date.recent().toISOString()),
  overallScore: fake((f) => f.number.int({ min: 60, max: 95 })),
  recommendations: [],
  metrics: {
    titleLength: fake((f) => f.number.int({ min: 30, max: 70 })),
    metaDescriptionLength: fake((f) => f.number.int({ min: 120, max: 180 })),
    headingStructure: {
      h1Count: fake((f) => f.number.int({ min: 1, max: 3 })),
      h2Count: fake((f) => f.number.int({ min: 2, max: 8 })),
      h3Count: fake((f) => f.number.int({ min: 0, max: 12 })),
    },
    imageCount: fake((f) => f.number.int({ min: 5, max: 25 })),
    imagesWithoutAlt: fake((f) => f.number.int({ min: 0, max: 5 })),
    internalLinks: fake((f) => f.number.int({ min: 10, max: 50 })),
    externalLinks: fake((f) => f.number.int({ min: 2, max: 15 })),
  },
  issues: [],
});

/**
 * Utility functions for common recommendation scenarios
 */
export const recommendationFactoryUtils = {
  /**
   * Create title optimization recommendation
   */
  createTitleRecommendation: (currentTitle?: string) => {
    return recommendationFactory({
      type: 'page_title',
      category: 'content',
      priority: 'high',
      title: 'Optimize Page Title',
      description: 'Improve your page title for better SEO performance',
      currentValue: currentTitle || fake((f) => f.lorem.sentence({ min: 3, max: 6 })),
      suggestedValue: fake((f) => f.lorem.sentence({ min: 4, max: 8 })),
      reasoning: 'A well-crafted title improves click-through rates and search rankings',
      impact: 'high',
      difficulty: 'easy',
      estimatedMinutes: 2,
    });
  },

  /**
   * Create meta description recommendation
   */
  createMetaDescriptionRecommendation: (currentDescription?: string) => {
    return recommendationFactory({
      type: 'meta_description',
      category: 'content',
      priority: 'high',
      title: 'Improve Meta Description',
      description: 'Write a compelling meta description to increase click-through rates',
      currentValue: currentDescription || fake((f) => f.lorem.paragraph({ min: 1, max: 2 })),
      suggestedValue: fake((f) => f.lorem.paragraph({ min: 2, max: 3 })),
      reasoning: 'Meta descriptions significantly impact click-through rates from search results',
      impact: 'high',
      difficulty: 'easy',
      estimatedMinutes: 3,
    });
  },

  /**
   * Create alt text recommendation
   */
  createAltTextRecommendation: (elementSelector: string) => {
    return recommendationFactory({
      type: 'alt_text',
      category: 'accessibility',
      priority: 'medium',
      title: 'Add Alt Text to Image',
      description: 'Improve accessibility and SEO by adding descriptive alt text',
      currentValue: '',
      suggestedValue: fake((f) => f.lorem.sentence({ min: 4, max: 8 })),
      reasoning: 'Alt text improves accessibility for screen readers and helps search engines understand image content',
      impact: 'medium',
      difficulty: 'easy',
      elementSelector,
      estimatedMinutes: 1,
    });
  },

  /**
   * Create heading structure recommendation
   */
  createHeadingRecommendation: () => {
    return recommendationFactory({
      type: 'heading',
      category: 'technical',
      priority: 'medium',
      title: 'Improve Heading Structure',
      description: 'Organize content with proper heading hierarchy',
      reasoning: 'Proper heading structure helps search engines understand content organization',
      impact: 'medium',
      difficulty: 'medium',
      estimatedMinutes: 10,
    });
  },

  /**
   * Create schema markup recommendation
   */
  createSchemaRecommendation: (schemaType: string) => {
    return recommendationFactory({
      type: 'schema',
      category: 'technical',
      priority: 'medium',
      title: `Add ${schemaType} Schema Markup`,
      description: 'Implement structured data to enhance search results',
      suggestedValue: `{
  "@context": "https://schema.org",
  "@type": "${schemaType}",
  "name": "Example",
  "description": "Example description"
}`,
      reasoning: 'Schema markup helps search engines better understand and display your content',
      impact: 'medium',
      difficulty: 'medium',
      estimatedMinutes: 15,
    });
  },

  /**
   * Create CMS field recommendation
   */
  createCMSRecommendation: (cmsItemId: string, fieldId: string) => {
    return recommendationFactory({
      type: 'cms_field',
      category: 'content',
      priority: 'high',
      title: 'Optimize CMS Content',
      description: 'Improve CMS field content for better SEO',
      cmsItemId,
      fieldId,
      impact: 'high',
      difficulty: 'easy',
      estimatedMinutes: 3,
    });
  },

  /**
   * Create a complete analysis with multiple recommendations
   */
  createCompleteAnalysis: (url: string, recommendationCount = 8) => {
    const analysis = seoAnalysisFactory({ url });
    
    // Create diverse recommendations
    const recommendations = [
      recommendationFactoryUtils.createTitleRecommendation(),
      recommendationFactoryUtils.createMetaDescriptionRecommendation(),
      recommendationFactoryUtils.createAltTextRecommendation('img[src*="hero"]'),
      recommendationFactoryUtils.createAltTextRecommendation('img[src*="feature"]'),
      recommendationFactoryUtils.createHeadingRecommendation(),
      recommendationFactoryUtils.createSchemaRecommendation('Article'),
      ...Array.from({ length: recommendationCount - 6 }, () => recommendationFactory()),
    ];

    // Create some issues
    const issues = [
      seoIssueFactory({ type: 'error', category: 'technical' }),
      seoIssueFactory({ type: 'warning', category: 'content' }),
      seoIssueFactory({ type: 'info', category: 'performance' }),
    ];

    return {
      ...analysis,
      recommendations,
      issues,
    };
  },

  /**
   * Create recommendations for different languages
   */
  createMultilingualRecommendations: (languages: string[]) => {
    return languages.map(language => 
      recommendationFactory({
        language,
        title: `Optimize content for ${language.toUpperCase()}`,
        description: `Improve SEO content for ${language} audience`,
      })
    );
  },

  /**
   * Create applied recommendations (for testing undo functionality)
   */
  createAppliedRecommendations: (count = 3) => {
    return Array.from({ length: count }, () => 
      recommendationFactory({
        isApplied: true,
        appliedAt: fake((f) => f.date.recent().toISOString()),
      })
    );
  },

  /**
   * Create high priority recommendations for urgent testing
   */
  createHighPriorityRecommendations: (count = 5) => {
    return Array.from({ length: count }, () => 
      recommendationFactory({
        priority: 'high',
        impact: 'high',
        difficulty: 'easy',
        estimatedMinutes: fake((f) => f.number.int({ min: 1, max: 5 })),
      })
    );
  },

  /**
   * Create recommendations with resources
   */
  createRecommendationsWithResources: (count = 3) => {
    return Array.from({ length: count }, () => {
      const resources = Array.from({ length: fake((f) => f.number.int({ min: 1, max: 3 })) }, () => 
        recommendationResourceFactory()
      );
      
      return recommendationFactory({ resources });
    });
  },
};