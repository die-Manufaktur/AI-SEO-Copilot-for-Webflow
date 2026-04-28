/**
 * TDD Tests for Content Intelligence System
 * RED Phase: These tests should FAIL initially until implementation is complete
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContentIntelligence, type OptimizationRules } from './contentIntelligence';
import type { 
  WebflowPage,
  WebflowCMSItem,
  WebflowInsertionRequest 
} from '../types/webflow-data-api';

// Mock AI service
const mockAIRecommendations = vi.fn();
vi.mock('../services/aiRecommendations', () => ({
  generateRecommendations: mockAIRecommendations,
}));

describe('ContentIntelligence', () => {
  let contentIntelligence: ContentIntelligence;

  const mockPage: WebflowPage = {
    _id: 'page_123',
    siteId: 'site_123',
    title: 'Old Page Title',
    slug: 'old-page-title',
    createdOn: '2024-01-01T00:00:00.000Z',
    lastUpdated: '2024-01-15T12:00:00.000Z',
    isHomePage: false,
    isFolderHomePage: false,
    archived: false,
    draft: false,
    seo: {
      title: 'Old SEO Title',
      description: 'Old SEO description that is quite long and not optimized',
    },
    openGraph: {
      title: 'Old OG Title',
      description: 'Old OG description',
    },
  };

  const mockCMSItem: WebflowCMSItem = {
    _id: 'item_123',
    lastUpdated: '2024-01-15T12:00:00.000Z',
    createdOn: '2024-01-10T00:00:00.000Z',
    isArchived: false,
    isDraft: false,
    fieldData: {
      name: 'Short',
      slug: 'old-blog-post-title',
      'meta-description': 'Short desc',
      content: 'This is the blog post content...',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    contentIntelligence = new ContentIntelligence();
  });

  describe('Content Analysis', () => {
    it('should analyze page content and identify optimization opportunities', async () => {
      const analysis = await contentIntelligence.analyzePage(mockPage);

      expect(analysis).toEqual({
        pageId: 'page_123',
        score: expect.any(Number),
        issues: expect.arrayContaining([
          expect.objectContaining({
            type: expect.stringMatching(/title|description|seo/),
            severity: expect.stringMatching(/low|medium|high|critical/),
            message: expect.any(String),
            field: expect.any(String),
          }),
        ]),
        recommendations: expect.arrayContaining([
          expect.objectContaining({
            type: expect.stringMatching(/page_title|meta_description|page_seo/),
            confidence: expect.any(Number),
            priority: expect.stringMatching(/low|medium|high/),
            reason: expect.any(String),
            suggestedValue: expect.any(String),
          }),
        ]),
        metrics: expect.objectContaining({
          titleLength: expect.any(Number),
          descriptionLength: expect.any(Number),
          keywordDensity: expect.any(Number),
          readabilityScore: expect.any(Number),
        }),
      });
    });

    it('should analyze CMS item content', async () => {
      const analysis = await contentIntelligence.analyzeCMSItem(mockCMSItem, 'blog_posts');

      expect(analysis).toEqual({
        itemId: 'item_123',
        collectionId: 'blog_posts',
        score: expect.any(Number),
        issues: expect.any(Array),
        recommendations: expect.arrayContaining([
          expect.objectContaining({
            type: 'cms_field',
            fieldId: expect.any(String),
            confidence: expect.any(Number),
            suggestedValue: expect.any(String),
          }),
        ]),
        metrics: expect.any(Object),
      });
    });

    it('should detect title length issues', async () => {
      const longTitlePage: WebflowPage = {
        ...mockPage,
        title: 'This is an extremely long page title that exceeds the recommended length for SEO optimization and should be flagged as an issue',
        seo: {
          title: 'This is an extremely long SEO title that exceeds the recommended length for SEO optimization and should be flagged as an issue',
          description: 'Valid description',
        },
      };

      const analysis = await contentIntelligence.analyzePage(longTitlePage);

      expect(analysis.issues).toContainEqual(
        expect.objectContaining({
          type: 'title_length',
          severity: 'high',
          field: 'title',
        })
      );

      expect(analysis.issues).toContainEqual(
        expect.objectContaining({
          type: 'seo_title_length',
          severity: 'high',
          field: 'seo.title',
        })
      );
    });

    it('should detect missing meta descriptions', async () => {
      const noDescriptionPage: WebflowPage = {
        ...mockPage,
        seo: {
          title: 'Good SEO Title',
          description: '',
        },
      };

      const analysis = await contentIntelligence.analyzePage(noDescriptionPage);

      expect(analysis.issues).toContainEqual(
        expect.objectContaining({
          type: 'missing_description',
          severity: 'critical',
          field: 'seo.description',
        })
      );
    });

    it('should score content quality accurately', async () => {
      const perfectPage: WebflowPage = {
        ...mockPage,
        title: 'Perfect SEO Title',
        seo: {
          title: 'Perfect SEO Title - Optimized Length',
          description: 'This is a perfectly optimized meta description that provides clear value proposition and contains relevant keywords within the ideal character range for search engines.',
        },
      };

      const analysis = await contentIntelligence.analyzePage(perfectPage);
      expect(analysis.score).toBeGreaterThan(80);

      const poorPage: WebflowPage = {
        ...mockPage,
        title: '',
        seo: {
          title: '',
          description: '',
        },
      };

      const poorAnalysis = await contentIntelligence.analyzePage(poorPage);
      expect(poorAnalysis.score).toBeLessThan(30);
    });
  });

  describe('Smart Recommendations', () => {
    it('should generate AI-powered content recommendations', async () => {
      mockAIRecommendations.mockResolvedValueOnce({
        title: 'AI Generated Optimized Title',
        description: 'AI generated meta description that is optimized for search engines and user engagement',
        keywords: ['optimization', 'seo', 'content'],
      });

      const recommendations = await contentIntelligence.generateSmartRecommendations(mockPage, {
        includeAI: true,
        targetKeywords: ['optimization', 'seo'],
        contentType: 'landing_page',
      });

      expect(recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'page_title',
            suggestedValue: 'AI Generated Optimized Title',
            confidence: expect.any(Number),
            source: 'ai',
            reasoning: expect.any(String),
          }),
          expect.objectContaining({
            type: 'meta_description',
            suggestedValue: expect.stringContaining('AI generated'),
            source: 'ai',
          }),
        ])
      );

      expect(mockAIRecommendations).toHaveBeenCalledWith({
        content: expect.objectContaining({
          title: mockPage.title,
          description: mockPage.seo.description,
        }),
        options: expect.objectContaining({
          targetKeywords: ['optimization', 'seo'],
          contentType: 'landing_page',
        }),
      });
    });

    it('should generate rule-based recommendations when AI is disabled', async () => {
      const recommendations = await contentIntelligence.generateSmartRecommendations(mockPage, {
        includeAI: false,
        targetKeywords: ['optimization'],
      });

      expect(recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            source: 'rules',
            type: expect.stringMatching(/page_title|meta_description/),
            suggestedValue: expect.any(String),
          }),
        ])
      );

      expect(mockAIRecommendations).not.toHaveBeenCalled();
    });

    it('should prioritize recommendations by impact and confidence', async () => {
      const recommendations = await contentIntelligence.generateSmartRecommendations(mockPage);

      // Should be sorted by priority (high > medium > low) then confidence (high > low)
      for (let i = 0; i < recommendations.length - 1; i++) {
        const current = recommendations[i];
        const next = recommendations[i + 1];
        
        if (current.priority === 'high' && next.priority !== 'high') {
          expect(true).toBe(true); // High priority comes first
        } else if (current.priority === next.priority) {
          expect(current.confidence).toBeGreaterThanOrEqual(next.confidence);
        }
      }
    });

    it('should handle different content types appropriately', async () => {
      const blogRecommendations = await contentIntelligence.generateSmartRecommendations(mockPage, {
        contentType: 'blog_post',
        targetKeywords: ['blogging', 'content'],
      });

      const landingRecommendations = await contentIntelligence.generateSmartRecommendations(mockPage, {
        contentType: 'landing_page',
        targetKeywords: ['conversion', 'sales'],
      });

      expect(blogRecommendations).not.toEqual(landingRecommendations);
    });
  });

  describe('Batch Analysis', () => {
    it('should analyze multiple pages efficiently', async () => {
      const pages = [mockPage, { ...mockPage, _id: 'page_456', title: 'Second Page' }];
      
      const batchAnalysis = await contentIntelligence.analyzeBatch(pages);

      expect(batchAnalysis).toEqual({
        totalPages: 2,
        averageScore: expect.any(Number),
        totalIssues: expect.any(Number),
        issueBreakdown: expect.objectContaining({
          critical: expect.any(Number),
          high: expect.any(Number),
          medium: expect.any(Number),
          low: expect.any(Number),
        }),
        recommendations: expect.any(Array),
        pageAnalyses: expect.arrayContaining([
          expect.objectContaining({ pageId: 'page_123' }),
          expect.objectContaining({ pageId: 'page_456' }),
        ]),
        potentialImpact: expect.objectContaining({
          scoreImprovement: expect.any(Number),
          issuesResolved: expect.any(Number),
          estimatedTrafficIncrease: expect.any(Number),
        }),
      });
    });

    it('should identify cross-page optimization opportunities', async () => {
      const pages = [
        { ...mockPage, _id: 'page_1', title: 'Duplicate Title' },
        { ...mockPage, _id: 'page_2', title: 'Duplicate Title' },
        { ...mockPage, _id: 'page_3', seo: { title: 'Duplicate SEO Title', description: 'Desc' } },
        { ...mockPage, _id: 'page_4', seo: { title: 'Duplicate SEO Title', description: 'Desc' } },
      ] as WebflowPage[];

      const batchAnalysis = await contentIntelligence.analyzeBatch(pages);

      expect(batchAnalysis.recommendations).toContainEqual(
        expect.objectContaining({
          type: 'batch_optimization',
          category: 'duplicate_titles',
          affectedPages: ['page_1', 'page_2'],
          priority: 'high',
        })
      );

      expect(batchAnalysis.recommendations).toContainEqual(
        expect.objectContaining({
          type: 'batch_optimization',
          category: 'duplicate_seo_titles',
          affectedPages: ['page_3', 'page_4'],
        })
      );
    });

    it('should estimate batch operation impact', async () => {
      const pages = Array.from({ length: 10 }, (_, i) => ({
        ...mockPage,
        _id: `page_${i}`,
        title: i < 5 ? '' : 'Good Title',
      })) as WebflowPage[];

      const batchAnalysis = await contentIntelligence.analyzeBatch(pages);

      expect(batchAnalysis).toEqual(
        expect.objectContaining({
          potentialImpact: expect.objectContaining({
            scoreImprovement: expect.any(Number),
            issuesResolved: expect.any(Number),
            estimatedTrafficIncrease: expect.any(Number),
          }),
        })
      );
    });
  });

  describe('Content Optimization Rules', () => {
    it('should validate title optimization rules', () => {
      const rules = contentIntelligence.getOptimizationRules();

      expect(rules.title).toEqual(
        expect.objectContaining({
          minLength: expect.any(Number),
          maxLength: expect.any(Number),
          preferredLength: expect.any(Object),
          patterns: expect.any(Array),
        })
      );
    });

    it('should validate meta description rules', () => {
      const rules = contentIntelligence.getOptimizationRules();

      expect(rules.metaDescription).toEqual(
        expect.objectContaining({
          minLength: expect.any(Number),
          maxLength: expect.any(Number),
          preferredLength: expect.any(Object),
          requiredElements: expect.any(Array),
        })
      );
    });

    it('should apply custom rules when provided', async () => {
      const customRules: Partial<OptimizationRules> = {
        title: { 
          minLength: 10, 
          maxLength: 40,
          preferredLength: { min: 15, max: 35 },
          patterns: []
        },
        metaDescription: { 
          minLength: 100, 
          maxLength: 140,
          preferredLength: { min: 120, max: 135 },
          requiredElements: []
        },
      };

      const customIntelligence = new ContentIntelligence(customRules);
      
      const analysis = await customIntelligence.analyzePage({
        ...mockPage,
        title: 'Short', // Below custom min
        seo: { title: 'Good Title', description: 'Too short' }, // Below custom min
      });

      expect(analysis.issues).toContainEqual(
        expect.objectContaining({
          type: 'title_length',
          message: expect.stringContaining('10'),
        })
      );
    });
  });

  describe('Performance and Caching', () => {
    it('should cache analysis results', async () => {
      const spy = vi.spyOn(contentIntelligence as any, 'performAnalysis');
      
      // First call
      await contentIntelligence.analyzePage(mockPage);
      
      // Second call with same content should use cache
      await contentIntelligence.analyzePage(mockPage);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should invalidate cache when content changes', async () => {
      const spy = vi.spyOn(contentIntelligence as any, 'performAnalysis');
      
      await contentIntelligence.analyzePage(mockPage);
      
      const modifiedPage = { ...mockPage, title: 'New Title' };
      await contentIntelligence.analyzePage(modifiedPage);

      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('should handle concurrent analysis requests', async () => {
      const pages = Array.from({ length: 5 }, (_, i) => ({
        ...mockPage,
        _id: `page_${i}`,
      })) as WebflowPage[];

      const promises = pages.map(page => contentIntelligence.analyzePage(page));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toEqual(
          expect.objectContaining({
            pageId: expect.any(String),
            score: expect.any(Number),
          })
        );
      });
    });
  });

  describe('Conflict Detection', () => {
    it('should detect simultaneous edits to the same page', async () => {
      const pageId = 'page_123';
      const userId1 = 'user_alice';
      const userId2 = 'user_bob';

      // Simulate two users editing the same page
      await contentIntelligence.trackEdit(pageId, 'title', userId1, 'Old Title', 'New Title by Alice');
      await contentIntelligence.trackEdit(pageId, 'title', userId2, 'Old Title', 'New Title by Bob');

      const conflicts = await contentIntelligence.detectConflicts(pageId);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]).toEqual({
        id: expect.any(String),
        type: 'simultaneous_edit',
        pageId,
        field: 'title',
        conflictingUsers: [userId1, userId2],
        conflictingValues: ['New Title by Alice', 'New Title by Bob'],
        timestamp: expect.any(Number),
        severity: 'medium',
        resolutionSuggestions: [{
          type: 'merge_changes',
          description: 'Merge the conflicting changes manually'
        }]
      });
    });

    it('should detect SEO keyword conflicts across pages', async () => {
      const page1 = 'page_123';
      const page2 = 'page_456';
      const userId = 'user_alice';
      const targetKeyword = 'best seo tools';

      // Both pages targeting the same keyword
      await contentIntelligence.trackEdit(page1, 'seo.title', userId, '', `${targetKeyword} - Page 1`);
      await contentIntelligence.trackEdit(page2, 'seo.title', userId, '', `${targetKeyword} - Page 2`);

      const conflicts = await contentIntelligence.detectConflicts();

      expect(conflicts.some(conflict => 
        conflict.type === 'keyword_cannibalization' &&
        conflict.conflictingPages?.includes(page1) &&
        conflict.conflictingPages?.includes(page2)
      )).toBe(true);
    });

    it('should track multiple users editing simultaneously', async () => {
      const pageId = 'page_123';
      
      // User Alice starts editing
      await contentIntelligence.startEditSession(pageId, 'user_alice', 'title');
      
      // User Bob starts editing the same field
      const conflict = await contentIntelligence.startEditSession(pageId, 'user_bob', 'title');

      expect(conflict).toEqual({
        type: 'edit_conflict',
        message: 'Another user (user_alice) is currently editing this field',
        activeUser: 'user_alice',
        suggestions: [
          'Wait for the other user to finish',
          'Edit a different field',
          'Coordinate with the other user'
        ]
      });
    });
  });

  describe('Smart Field Mapping', () => {
    it('should suggest field mappings for similar content types', async () => {
      const sourceSchema = {
        fields: [
          { id: 'title', name: 'Title', type: 'PlainText' },
          { id: 'desc', name: 'Description', type: 'RichText' },
          { id: 'img', name: 'Image', type: 'Image' }
        ]
      };

      const targetSchema = {
        fields: [
          { id: 'heading', name: 'Heading', type: 'PlainText' },
          { id: 'content', name: 'Content', type: 'RichText' },
          { id: 'photo', name: 'Photo', type: 'Image' },
          { id: 'tags', name: 'Tags', type: 'PlainText' }
        ]
      };

      const mapping = await contentIntelligence.generateFieldMapping(sourceSchema, targetSchema);

      expect(mapping).toEqual({
        title: {
          targetField: 'heading',
          confidence: expect.any(Number),
          reasoning: 'Similar field names and types'
        },
        desc: {
          targetField: 'content',
          confidence: expect.any(Number),
          reasoning: 'Both are rich text content fields'
        },
        img: {
          targetField: 'photo',
          confidence: expect.any(Number),
          reasoning: 'Both are image fields'
        }
      });

      expect(mapping.title.confidence).toBeGreaterThan(0.8);
    });

    it('should handle complex field type conversions', async () => {
      const sourceSchema = {
        fields: [
          { id: 'price', name: 'Price', type: 'PlainText' }, // "$19.99"
          { id: 'tags', name: 'Tags', type: 'PlainText' } // "tag1, tag2, tag3"
        ]
      };

      const targetSchema = {
        fields: [
          { id: 'cost', name: 'Cost', type: 'Number' },
          { id: 'categories', name: 'Categories', type: 'MultiReference' }
        ]
      };

      const mapping = await contentIntelligence.generateFieldMapping(sourceSchema, targetSchema);

      expect(mapping.price).toEqual({
        targetField: 'cost',
        confidence: expect.any(Number),
        reasoning: 'Price field can be converted to number',
        transformation: {
          type: 'text_to_number',
          pattern: /\$?(\d+\.?\d*)/,
          instructions: 'Extract numeric value from price string'
        }
      });
    });

    it('should learn from user corrections to improve mappings', async () => {
      const sourceSchema = {
        fields: [
          { id: 'summary', name: 'Summary', type: 'PlainText' }
        ]
      };

      const targetSchema = {
        fields: [
          { id: 'title', name: 'Title', type: 'PlainText' },
          { id: 'excerpt', name: 'Excerpt', type: 'PlainText' }
        ]
      };

      // Initial mapping
      const initialMapping = await contentIntelligence.generateFieldMapping(sourceSchema, targetSchema);
      
      // User corrects the mapping
      await contentIntelligence.recordMappingCorrection(
        'summary',
        initialMapping.summary.targetField,
        'excerpt',
        { userFeedback: 'Summary should map to excerpt, not title' }
      );

      // Generate mapping again
      const improvedMapping = await contentIntelligence.generateFieldMapping(sourceSchema, targetSchema);

      expect(improvedMapping.summary.targetField).toBe('excerpt');
      expect(improvedMapping.summary.confidence).toBeGreaterThan(initialMapping.summary.confidence);
    });
  });

  describe('Error Handling', () => {
    it('should handle AI service failures gracefully', async () => {
      mockAIRecommendations.mockRejectedValueOnce(new Error('AI service unavailable'));

      const recommendations = await contentIntelligence.generateSmartRecommendations(mockPage, {
        includeAI: true,
      });

      // Should fall back to rule-based recommendations
      expect(recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            source: 'rules',
          }),
        ])
      );
    });

    it('should handle malformed content gracefully', async () => {
      const malformedPage = {
        ...mockPage,
        seo: null as any,
        title: undefined as any,
      };

      const analysis = await contentIntelligence.analyzePage(malformedPage);

      expect(analysis.score).toBeGreaterThanOrEqual(0);
      expect(analysis.issues).toEqual(expect.any(Array));
    });

    it('should provide meaningful error messages', async () => {
      try {
        await contentIntelligence.analyzePage(null as any);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Invalid page data');
      }
    });
  });
});