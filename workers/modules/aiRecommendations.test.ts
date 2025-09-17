import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import OpenAI from 'openai';
import {
  shouldHaveCopyButton,
  getAIRecommendation,
  handleRecommendationResult
} from './aiRecommendations';
import { shouldShowCopyButton } from '../../shared/utils/seoUtils';
import { sanitizeText } from '../../shared/utils/stringUtils';
import { getLanguageByCode, DEFAULT_LANGUAGE_CODE } from '../../shared/types/language';

// Mock dependencies
vi.mock('openai');
vi.mock('../../shared/utils/seoUtils');
vi.mock('../../shared/utils/stringUtils');
vi.mock('../../shared/types/language');

const mockOpenAI = vi.mocked(OpenAI);
const mockShouldShowCopyButton = vi.mocked(shouldShowCopyButton);
const mockSanitizeText = vi.mocked(sanitizeText);
const mockGetLanguageByCode = vi.mocked(getLanguageByCode);

describe('aiRecommendations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockSanitizeText.mockImplementation((text: string) => text);
    mockGetLanguageByCode.mockReturnValue({
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸'
    });
    
    // Mock OpenAI constructor and methods
    const mockOpenAIInstance = {
      chat: {
        completions: {
          create: vi.fn()
        }
      }
    };
    mockOpenAI.mockImplementation(() => mockOpenAIInstance as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('shouldHaveCopyButton', () => {
    it('should delegate to shouldShowCopyButton utility', () => {
      mockShouldShowCopyButton.mockReturnValue(true);
      
      const result = shouldHaveCopyButton('Keyphrase in Title');
      
      expect(mockShouldShowCopyButton).toHaveBeenCalledWith('Keyphrase in Title');
      expect(result).toBe(true);
    });
  });

  describe('getAIRecommendation', () => {
    const mockEnv = {
      OPENAI_API_KEY: 'test-api-key'
    } as any;

    it('should throw error when OpenAI API key is not configured', async () => {
      const envWithoutKey = {} as any;
      
      await expect(
        getAIRecommendation('Keyphrase in Title', 'test keyword', envWithoutKey)
      ).rejects.toThrow('OpenAI API key not configured');
    });

    it('should generate AI recommendation for copyable content', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'SEO Optimized Title with Test Keyword'
          }
        }]
      };

      mockShouldShowCopyButton.mockReturnValue(true);
      
      const mockCreate = vi.fn().mockResolvedValue(mockResponse);
      mockOpenAI.mockImplementation(() => ({
        chat: { completions: { create: mockCreate } }
      } as any));

      const result = await getAIRecommendation(
        'Keyphrase in Title',
        'test keyword',
        mockEnv,
        'Current title context'
      );

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-3.5-turbo',
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user' })
          ]),
          max_tokens: 500,
          temperature: 0.5,
          stream: false
        })
      );

      expect(result).toBe('SEO Optimized Title with Test Keyword');
      expect(mockSanitizeText).toHaveBeenCalledWith('SEO Optimized Title with Test Keyword', DEFAULT_LANGUAGE_CODE);
    });

    it('should generate AI recommendation for non-copyable content', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Consider adding the keyphrase to your title for better SEO visibility.'
          }
        }]
      };

      mockShouldShowCopyButton.mockReturnValue(false);
      
      const mockCreate = vi.fn().mockResolvedValue(mockResponse);
      mockOpenAI.mockImplementation(() => ({
        chat: { completions: { create: mockCreate } }
      } as any));

      const result = await getAIRecommendation(
        'Content Length',
        'test keyword',
        mockEnv
      );

      expect(result).toBe('Consider adding the keyphrase to your title for better SEO visibility.');
    });

    it('should handle advanced options with page type and secondary keywords', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Page-type specific recommendation'
          }
        }]
      };

      mockShouldShowCopyButton.mockReturnValue(false);
      
      const mockCreate = vi.fn().mockResolvedValue(mockResponse);
      mockOpenAI.mockImplementation(() => ({
        chat: { completions: { create: mockCreate } }
      } as any));

      const advancedOptions = {
        pageType: 'Product Page',
        secondaryKeywords: 'ecommerce, shopping, product',
        languageCode: 'en'
      };

      await getAIRecommendation(
        'Keyphrase in Meta Description',
        'test keyword',
        mockEnv,
        'current meta description',
        advancedOptions
      );

      // Check that the prompt includes advanced context
      const systemPrompt = mockCreate.mock.calls[0][0].messages[0].content;
      const userPrompt = mockCreate.mock.calls[0][0].messages[1].content;
      
      expect(userPrompt).toContain('Page Type: Product Page');
      expect(userPrompt).toContain('Secondary Keywords:');
    });

    it('should handle multilingual recommendations', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Titre SEO optimisé avec mot-clé'
          }
        }]
      };

      mockGetLanguageByCode.mockReturnValue({
        code: 'fr',
        name: 'French',
        nativeName: 'Français',
        flag: '🇫🇷'
      });

      mockShouldShowCopyButton.mockReturnValue(true);
      
      const mockCreate = vi.fn().mockResolvedValue(mockResponse);
      mockOpenAI.mockImplementation(() => ({
        chat: { completions: { create: mockCreate } }
      } as any));

      const advancedOptions = {
        languageCode: 'fr'
      };

      const result = await getAIRecommendation(
        'Keyphrase in Title',
        'mot-clé test',
        mockEnv,
        'titre actuel',
        advancedOptions
      );

      expect(result).toBe('Titre SEO optimisé avec mot-clé');
      expect(mockSanitizeText).toHaveBeenCalledWith('Titre SEO optimisé avec mot-clé', 'fr');
      
      // Check that language instruction was included in system prompt
      const systemPrompt = mockCreate.mock.calls[0][0].messages[0].content;
      expect(systemPrompt).toContain('Generate all content in French');
    });

    it('should handle special URL slug generation', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'seo-optimization-guide'
          }
        }]
      };

      mockShouldShowCopyButton.mockReturnValue(true);
      
      const mockCreate = vi.fn().mockResolvedValue(mockResponse);
      mockOpenAI.mockImplementation(() => ({
        chat: { completions: { create: mockCreate } }
      } as any));

      const result = await getAIRecommendation(
        'Keyphrase in URL',
        'SEO optimization',
        mockEnv,
        'https://example.com/current-page'
      );

      expect(result).toBe('seo-optimization-guide');
      
      // Check that URL-specific instructions were included
      const userPrompt = mockCreate.mock.calls[0][0].messages[1].content;
      expect(userPrompt).toContain('Create an SEO-friendly URL slug');
      expect(userPrompt).toContain('Use lowercase letters only');
      expect(userPrompt).toContain('Separate words with hyphens');
    });

    it('should retry on OpenAI API failures with exponential backoff', async () => {
      const mockError = new Error('API temporarily unavailable');
      const mockSuccess = {
        choices: [{
          message: {
            content: 'Success after retry'
          }
        }]
      };

      mockShouldShowCopyButton.mockReturnValue(false);
      
      const mockCreate = vi.fn()
        .mockRejectedValueOnce(mockError)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce(mockSuccess);
      
      mockOpenAI.mockImplementation(() => ({
        chat: { completions: { create: mockCreate } }
      } as any));

      // Mock setTimeout to avoid actual delays in tests
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn((fn: Function) => {
        fn();
        return 1 as any;
      }) as any;

      const result = await getAIRecommendation(
        'Keyphrase in Title',
        'test keyword',
        mockEnv
      );

      expect(mockCreate).toHaveBeenCalledTimes(3);
      expect(result).toBe('Success after retry');

      global.setTimeout = originalSetTimeout;
    });

    it('should throw error after max retries exceeded', async () => {
      const mockError = new Error('Persistent API error');

      mockShouldShowCopyButton.mockReturnValue(false);
      
      const mockCreate = vi.fn().mockRejectedValue(mockError);
      mockOpenAI.mockImplementation(() => ({
        chat: { completions: { create: mockCreate } }
      } as any));

      // Mock setTimeout to avoid actual delays
      global.setTimeout = vi.fn((fn: Function) => {
        fn();
        return 1 as any;
      }) as any;

      await expect(
        getAIRecommendation('Keyphrase in Title', 'test keyword', mockEnv)
      ).rejects.toThrow('Persistent API error');

      expect(mockCreate).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });

    it('should provide localized error messages for non-English languages', async () => {
      mockGetLanguageByCode.mockReturnValue({
        code: 'fr',
        name: 'French',
        nativeName: 'Français',
        flag: '🇫🇷'
      });

      const mockError = new Error('API error');
      
      const mockCreate = vi.fn().mockRejectedValue(mockError);
      mockOpenAI.mockImplementation(() => ({
        chat: { completions: { create: mockCreate } }
      } as any));

      const advancedOptions = {
        languageCode: 'fr'
      };

      await expect(
        getAIRecommendation('Keyphrase in Title', 'test', mockEnv, undefined, advancedOptions)
      ).rejects.toThrow('Impossible de générer une recommandation');
    });

    it('should handle empty AI response', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: null
          }
        }]
      };

      const mockCreate = vi.fn().mockResolvedValue(mockResponse);
      mockOpenAI.mockImplementation(() => ({
        chat: { completions: { create: mockCreate } }
      } as any));

      await expect(
        getAIRecommendation('Keyphrase in Title', 'test keyword', mockEnv)
      ).rejects.toThrow('No recommendation received from OpenAI');
    });

    it('should warn about potential language mismatch', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'This is an English response with the and or but in on at words'
          }
        }]
      };

      mockGetLanguageByCode.mockReturnValue({
        code: 'fr',
        name: 'French',
        nativeName: 'Français',
        flag: '🇫🇷'
      });

      const mockCreate = vi.fn().mockResolvedValue(mockResponse);
      mockOpenAI.mockImplementation(() => ({
        chat: { completions: { create: mockCreate } }
      } as any));

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const advancedOptions = {
        languageCode: 'fr'
      };

      await getAIRecommendation(
        'Keyphrase in Title',
        'test keyword',
        mockEnv,
        undefined,
        advancedOptions
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('AI may have responded in English instead of requested language: French')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('handleRecommendationResult', () => {
    it('should set sanitized recommendation on check object', () => {
      mockSanitizeText.mockReturnValue('Sanitized recommendation');
      
      const check: { recommendation?: string } = {};
      handleRecommendationResult('Raw AI recommendation', check);

      expect(check.recommendation).toBe('Sanitized recommendation');
      expect(mockSanitizeText).toHaveBeenCalledWith('Raw AI recommendation');
    });

    it('should handle check object with existing properties', () => {
      const check = {
        recommendation: 'Old recommendation',
        introPhrase: 'Existing intro'
      };

      handleRecommendationResult('New recommendation', check);

      expect(check.recommendation).toBe('New recommendation');
      expect(check.introPhrase).toBe('Existing intro'); // Should preserve other properties
    });
  });
});