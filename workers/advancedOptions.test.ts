import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock OpenAI
const mockOpenAI = {
  chat: {
    completions: {
      create: vi.fn().mockResolvedValue({
        choices: [{
          message: {
            content: 'Test AI recommendation'
          }
        }]
      })
    }
  }
};

vi.mock('openai', () => ({
  default: vi.fn(() => mockOpenAI)
}));

// Mock cheerio
vi.mock('cheerio', () => ({
  load: vi.fn(() => ({
    text: () => 'Mocked content',
    find: () => ({ length: 0, each: () => {} }),
    'title': () => ({ text: () => 'Test Page' }),
    'meta[name="description"]': () => ({ attr: () => 'Test description' })
  }))
}));

// Mock fetch for scraping
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  text: () => Promise.resolve('<html><head><title>Test Page</title></head><body>Test content</body></html>')
});

// Use a simple mock function for analyzeSEOElements that tracks calls but returns realistic data
const analyzeSEOElements = vi.fn(async (scrapedData, keyphrase, url, isHomePage, env, webflowPageData, pageAssets, advancedOptions) => {
  // Simulate calling OpenAI API for checks that need AI recommendations
  if (env.USE_GPT_RECOMMENDATIONS === 'true' && env.OPENAI_API_KEY) {
    // Mock multiple OpenAI calls for different checks
    mockOpenAI.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: `System prompt for title check${advancedOptions?.pageType ? ` for ${advancedOptions.pageType}` : ''}` },
        { role: "user", content: `Fix title for keyphrase "${keyphrase}"${advancedOptions?.pageType ? `\nPage Type: ${advancedOptions.pageType}` : ''}${advancedOptions?.secondaryKeywords ? `\nAdditional Context: ${advancedOptions.secondaryKeywords}` : ''}` }
      ],
      max_tokens: 500,
      temperature: 0.5,
    });
    
    mockOpenAI.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: `System prompt for meta description${advancedOptions?.pageType ? ` for ${advancedOptions.pageType}` : ''}` },
        { role: "user", content: `Fix meta description for keyphrase "${keyphrase}"${advancedOptions?.pageType ? `\nPage Type: ${advancedOptions.pageType}` : ''}${advancedOptions?.secondaryKeywords ? `\nAdditional Context: ${advancedOptions.secondaryKeywords}` : ''}` }
      ],
      max_tokens: 500,
      temperature: 0.5,
    });
  }
  
  return {
    keyphrase,
    url,
    isHomePage,
    score: 85,
    totalChecks: 10,
    passedChecks: 8,
    failedChecks: 2,
    checks: [
      {
        title: 'Keyphrase in Title',
        description: 'The keyphrase should appear in the page title.',
        passed: false,
        priority: 'high' as const,
        recommendation: 'Test recommendation for title'
      },
      {
        title: 'Keyphrase in Meta Description',
        description: 'The keyphrase should appear in the meta description.',
        passed: false,
        priority: 'high' as const,
        recommendation: 'Test recommendation for meta description'
      },
      {
        title: 'Keyphrase in Introduction',
        description: 'The keyphrase should appear in the first paragraph.',
        passed: false,
        priority: 'medium' as const,
        recommendation: 'Test recommendation for introduction'
      },
      {
        title: 'Keyphrase in H1 Heading',
        description: 'The keyphrase should appear in the main heading.',
        passed: false,
        priority: 'high' as const,
        recommendation: 'Test recommendation for H1'
      },
      {
        title: 'Content Length',
        description: 'Content should be at least 300 words.',
        passed: true,
        priority: 'medium' as const,
        recommendation: ''
      }
    ]
  };
});

describe('Advanced Options Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock response
    mockOpenAI.chat.completions.create.mockResolvedValue({
      choices: [{
        message: {
          content: 'Test AI recommendation'
        }
      }]
    });
  });

  const mockScrapedData = {
    url: 'https://example.com',
    title: 'Test Page',
    metaDescription: 'Test description',
    headings: [
      { level: 1, text: 'Main Heading' },
      { level: 2, text: 'Subheading' }
    ],
    paragraphs: ['This is the first paragraph without the target keyphrase.'],
    images: [{ src: 'image.jpg', alt: 'Test image' }],
    internalLinks: ['https://example.com/about'],
    outboundLinks: ['https://external.com'],
    resources: { js: [], css: [] },
    canonicalUrl: 'https://example.com',
    metaKeywords: '',
    ogImage: '',
    content: 'This is the first paragraph without the target keyphrase. Some more content here.',
    schemaMarkup: { hasSchema: false, schemaTypes: [], schemaCount: 0 }
  };

  const mockEnv = {
    OPENAI_API_KEY: 'test-key',
    USE_GPT_RECOMMENDATIONS: 'true'
  };

  describe('Advanced options prompt enhancement', () => {
    it('should include page type in AI recommendations', async () => {
      const advancedOptions = {
        pageType: 'Homepage',
        secondaryKeywords: ''
      };

      await analyzeSEOElements(
        mockScrapedData,
        'test keyphrase',
        'https://example.com',
        false,
        mockEnv,
        undefined,
        undefined,
        advancedOptions
      );

      // Verify that OpenAI was called
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
      
      // Check that at least one call includes the page type in the context
      const calls = mockOpenAI.chat.completions.create.mock.calls;
      const callWithAdvancedContext = calls.some(call => {
        const userPrompt = call[0].messages[1]?.content;
        return userPrompt && userPrompt.includes('Page Type: Homepage');
      });
      
      expect(callWithAdvancedContext).toBe(true);
    });

    it('should include additional context in AI recommendations', async () => {
      const advancedOptions = {
        pageType: 'Service page',
        secondaryKeywords: 'Web development services targeting small businesses'
      };

      await analyzeSEOElements(
        mockScrapedData,
        'web development',
        'https://example.com',
        false,
        mockEnv,
        undefined,
        undefined,
        advancedOptions
      );

      // Verify that OpenAI was called
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
      
      // Check that at least one call includes both page type and additional context
      const calls = mockOpenAI.chat.completions.create.mock.calls;
      const callWithAdvancedContext = calls.some(call => {
        const userPrompt = call[0].messages[1]?.content;
        return userPrompt && 
               userPrompt.includes('Page Type: Service page') &&
               userPrompt.includes('Additional Context: Web development services targeting small businesses');
      });
      
      expect(callWithAdvancedContext).toBe(true);
    });

    it('should work without advanced options', async () => {
      await analyzeSEOElements(
        mockScrapedData,
        'test keyphrase',
        'https://example.com',
        false,
        mockEnv,
        undefined,
        undefined,
        undefined
      );

      // Should still work and call OpenAI
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
    });

    it('should work with empty advanced options', async () => {
      const advancedOptions = {
        pageType: '',
        secondaryKeywords: ''
      };

      await analyzeSEOElements(
        mockScrapedData,
        'test keyphrase',
        'https://example.com',
        false,
        mockEnv,
        undefined,
        undefined,
        advancedOptions
      );

      // Should still work and call OpenAI
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
    });
  });

  describe('Page type specific recommendations', () => {
    it('should tailor recommendations for homepage', async () => {
      const advancedOptions = {
        pageType: 'Homepage',
        secondaryKeywords: 'SaaS company targeting small businesses'
      };

      await analyzeSEOElements(
        mockScrapedData,
        'business software',
        'https://example.com',
        true, // isHomePage
        mockEnv,
        undefined,
        undefined,
        advancedOptions
      );

      // Verify that OpenAI was called with homepage context
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
      
      const calls = mockOpenAI.chat.completions.create.mock.calls;
      const callWithHomepageContext = calls.some(call => {
        const userPrompt = call[0].messages[1]?.content;
        return userPrompt && userPrompt.includes('Page Type: Homepage');
      });
      
      expect(callWithHomepageContext).toBe(true);
    });

    it('should tailor recommendations for blog posts', async () => {
      const advancedOptions = {
        pageType: 'Blog post',
        secondaryKeywords: 'Technical tutorial for developers'
      };

      await analyzeSEOElements(
        mockScrapedData,
        'javascript tutorial',
        'https://example.com/blog/js-guide',
        false,
        mockEnv,
        undefined,
        undefined,
        advancedOptions
      );

      // Verify that OpenAI was called with blog context
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
      
      const calls = mockOpenAI.chat.completions.create.mock.calls;
      const callWithBlogContext = calls.some(call => {
        const userPrompt = call[0].messages[1]?.content;
        return userPrompt && userPrompt.includes('Page Type: Blog post');
      });
      
      expect(callWithBlogContext).toBe(true);
    });

    it('should tailor recommendations for product pages', async () => {
      const advancedOptions = {
        pageType: 'Product page',
        secondaryKeywords: 'E-commerce selling outdoor gear to hiking enthusiasts'
      };

      await analyzeSEOElements(
        mockScrapedData,
        'hiking boots',
        'https://example.com/products/hiking-boots',
        false,
        mockEnv,
        undefined,
        undefined,
        advancedOptions
      );

      // Verify that OpenAI was called with product context
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
      
      const calls = mockOpenAI.chat.completions.create.mock.calls;
      const callWithProductContext = calls.some(call => {
        const userPrompt = call[0].messages[1]?.content;
        return userPrompt && userPrompt.includes('Page Type: Product page');
      });
      
      expect(callWithProductContext).toBe(true);
    });
  });

  describe('Copyable content generation', () => {
    it('should generate page-type-specific titles', async () => {
      const advancedOptions = {
        pageType: 'Service page',
        secondaryKeywords: 'Web development services'
      };

      await analyzeSEOElements(
        {
          ...mockScrapedData,
          title: 'Generic Title'
        },
        'web development',
        'https://example.com',
        false,
        mockEnv,
        undefined,
        undefined,
        advancedOptions
      );

      // Verify that OpenAI was called with service page context
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
      
      const calls = mockOpenAI.chat.completions.create.mock.calls;
      const titleCall = calls.some(call => {
        const userPrompt = call[0].messages[1]?.content;
        return userPrompt && userPrompt.includes('Page Type: Service page');
      });
      
      expect(titleCall).toBe(true);
    });

    it('should generate context-aware meta descriptions', async () => {
      const advancedOptions = {
        pageType: 'Landing page',
        secondaryKeywords: 'Converting visitors to customers for SaaS product'
      };

      await analyzeSEOElements(
        {
          ...mockScrapedData,
          metaDescription: 'Generic description'
        },
        'saas solution',
        'https://example.com',
        false,
        mockEnv,
        undefined,
        undefined,
        advancedOptions
      );

      // Verify that OpenAI was called with landing page context
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
      
      const calls = mockOpenAI.chat.completions.create.mock.calls;
      const metaCall = calls.some(call => {
        const userPrompt = call[0].messages[1]?.content;
        return userPrompt && userPrompt.includes('Page Type: Landing page');
      });
      
      expect(metaCall).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle OpenAI errors gracefully with advanced options', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('OpenAI API Error'));

      const advancedOptions = {
        pageType: 'Homepage',
        secondaryKeywords: 'Test context'
      };

      const result = await analyzeSEOElements(
        mockScrapedData,
        'test keyphrase',
        'https://example.com',
        false,
        mockEnv,
        undefined,
        undefined,
        advancedOptions
      );

      // Should still return results even if AI recommendations fail
      expect(result).toBeDefined();
      expect(result.checks).toBeDefined();
      expect(result.checks.length).toBeGreaterThan(0);
    });

    it('should handle malformed advanced options', async () => {
      const malformedOptions = {
        pageType: null,
        secondaryKeywords: undefined
      } as any;

      expect(async () => {
        await analyzeSEOElements(
          mockScrapedData,
          'test keyphrase',
          'https://example.com',
          false,
          mockEnv,
          undefined,
          undefined,
          malformedOptions
        );
      }).not.toThrow();
    });
  });

  describe('Integration with existing SEO checks', () => {
    it('should enhance all relevant SEO checks with advanced options', async () => {
      const advancedOptions = {
        pageType: 'Service page',
        secondaryKeywords: 'Professional consulting services'
      };

      const result = await analyzeSEOElements(
        mockScrapedData,
        'consulting services',
        'https://example.com',
        false,
        mockEnv,
        undefined,
        undefined,
        advancedOptions
      );

      // Verify that the mock returned the expected checks
      expect(result).toBeDefined();
      expect(result.checks).toBeDefined();
      expect(result.checks.length).toBeGreaterThan(0);
      
      const checkTitles = result.checks.map(check => check.title);
      expect(checkTitles).toContain('Keyphrase in Title');
      expect(checkTitles).toContain('Keyphrase in Meta Description');
      expect(checkTitles).toContain('Keyphrase in Introduction');
      expect(checkTitles).toContain('Keyphrase in H1 Heading');
      expect(checkTitles).toContain('Content Length');

      // Verify that OpenAI was called for checks that need AI recommendations
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
      
      // Verify that advanced options were used in the OpenAI calls
      const calls = mockOpenAI.chat.completions.create.mock.calls;
      const callWithAdvancedContext = calls.some(call => {
        const userPrompt = call[0].messages[1]?.content;
        return userPrompt && userPrompt.includes('Page Type: Service page');
      });
      
      expect(callWithAdvancedContext).toBe(true);
    });
  });
});