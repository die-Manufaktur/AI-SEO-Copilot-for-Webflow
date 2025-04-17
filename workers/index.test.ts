import { extractFullTextContent } from './index';
import { describe, it, expect, vi, beforeEach, afterEach, MockedClass } from 'vitest';
import OpenAI from 'openai';
import { getAIRecommendation } from './index'; // Assuming index.ts is in the same directory

describe('extractFullTextContent', () => {
    // Regex for H1 tags (non-greedy match for content)
    const h1Pattern = /<h1[^>]*>(.*?)<\/h1>/gis;
    // Regex for P tags
    const pPattern = /<p[^>]*>(.*?)<\/p>/gis;
    // Regex for DIV tags
    const divPattern = /<div[^>]*>(.*?)<\/div>/gis;

    it('should extract text from a single simple tag', () => {
        const html = '<html><body><h1>Simple Title</h1></body></html>';
        expect(extractFullTextContent(html, h1Pattern)).toEqual(['Simple Title']);
    });

    it('should extract text from multiple tags of the same type', () => {
        const html = '<h1>Title 1</h1><p>Para 1</p><h1>Title 2</h1>';
        expect(extractFullTextContent(html, h1Pattern)).toEqual(['Title 1', 'Title 2']);
    });

    it('should extract text from tags with nested elements', () => {
        const html = '<h1>Title with <span>nested</span> text</h1>';
        expect(extractFullTextContent(html, h1Pattern)).toEqual(['Title with nested text']);
    });

    it('should handle tags with attributes', () => {
        const html = '<h1 class="main-title" id="title1">Title with Attributes</h1>';
        expect(extractFullTextContent(html, h1Pattern)).toEqual(['Title with Attributes']);
    });

    it('should handle self-closing tags within the content', () => {
        const html = '<h1>Title with<br/>a break</h1>';
        expect(extractFullTextContent(html, h1Pattern)).toEqual(['Title with a break']);
    });

    it('should handle empty tags', () => {
        const html = '<h1></h1><p>Some text</p><h1>   </h1>';
        expect(extractFullTextContent(html, h1Pattern)).toEqual([]); // Empty or whitespace-only content should not be included
    });

    it('should return an empty array if no matching tags are found', () => {
        const html = '<p>Paragraph text</p><div>Div text</div>';
        expect(extractFullTextContent(html, h1Pattern)).toEqual([]);
    });

    it('should handle complex nested structures', () => {
        const html = '<div>Outer <div>Inner <b>Bold</b> Text</div> More outer</div>';
        // Adjust expectation based on non-greedy regex behavior
        expect(extractFullTextContent(html, divPattern)).toEqual(['Outer Inner Bold Text']);
    });

    it('should handle multiple levels of nesting correctly', () => {
        const html = '<div>Level 1 <p>Level 2 <span>Level 3</span></p> End Level 1</div>';
        // Adjust expectation based on non-greedy regex behavior and updated tag stripping
        expect(extractFullTextContent(html, divPattern)).toEqual(['Level 1 Level 2 Level 3 End Level 1']);
    });

    it('should handle tags with extra whitespace around content', () => {
        const html = '<h1>  Spaced Out Title  </h1>';
        expect(extractFullTextContent(html, h1Pattern)).toEqual(['Spaced Out Title']);
    });

    it('should extract text using a different tag pattern (p tags)', () => {
        const html = '<p>First paragraph.</p><div>Ignore this</div><p>Second <span>paragraph</span>.</p>';
        expect(extractFullTextContent(html, pPattern)).toEqual(['First paragraph.', 'Second paragraph.']);
    });

    it('should handle HTML comments within the tag content', () => {
        const html = '<h1>Title <!-- This is a comment --> with comment</h1>';
        // The regex replacement might leave extra spaces where comments were
        expect(extractFullTextContent(html, h1Pattern)).toEqual(['Title with comment']);
    });

    it('should handle tags spanning multiple lines', () => {
        const html = `
            <h1>
                Multi-line
                <span>Title</span>
            </h1>
        `;
        expect(extractFullTextContent(html, h1Pattern)).toEqual(['Multi-line Title']);
    });

    it('should not extract content from improperly closed tags if regex relies on closing tag', () => {
        const html = '<h1>Open but not closed';
        // The specific regex used requires a closing tag
        expect(extractFullTextContent(html, h1Pattern)).toEqual([]);
    });

    it('should handle mixed content including text nodes and elements', () => {
        const html = '<div>Text <span>More Text</span> Even More Text</div>';
        expect(extractFullTextContent(html, divPattern)).toEqual(['Text More Text Even More Text']);
    });

    // Mock the OpenAI module
    vi.mock('openai', () => {
        const mockCompletion = {
            choices: [{ message: { content: 'Default mock recommendation' } }],
        };
        const mockChat = {
            completions: {
                create: vi.fn().mockResolvedValue(mockCompletion),
            },
        };
        const MockOpenAI = vi.fn(() => ({
            chat: mockChat,
        }));
        return {
            __esModule: true, // This is important for ES modules
            default: MockOpenAI,
            OpenAI: MockOpenAI, // Also export named if needed
        };
    });

    // Mock Date.now for cache testing
    let dateNowMock: any;

    // Mock Math.random for predictable system prompt
    let mathRandomMock: any;

    describe('getAIRecommendation', () => {
        const mockEnv = { OPENAI_API_KEY: 'test-api-key' };
        const title = 'Meta Description';
        const keyphrase = 'SEO analysis tool';
        const context = 'Current meta description is missing the keyphrase.';
        const additionalContext = 'The page targets developers using Webflow.';
        const cacheKey = `${title}-${keyphrase}-${context?.substring(0, 50) || ''}`;

        const MockedOpenAI = OpenAI as MockedClass<typeof OpenAI>;
        const mockCreate = vi.mocked(new MockedOpenAI().chat.completions.create);

        beforeEach(() => {
            vi.clearAllMocks();

            let currentTime = 1700000000000;
            dateNowMock = vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

            // Mock Math.random to always return 0 for predictable prompt selection
            mathRandomMock = vi.spyOn(Math, 'random').mockReturnValue(0);

            mockCreate.mockResolvedValue({
                choices: [{
                    message: { role: 'assistant', content: 'Here is a better [element]: Use "SEO analysis tool" in your Meta Description.', refusal: null },
                    finish_reason: 'stop',
                    index: 0,
                    logprobs: null,
                }],
                id: 'chatcmpl-mockId',
                created: Date.now(),
                model: 'gpt-mock-model',
                object: 'chat.completion',
            });
        });

        afterEach(() => {
            dateNowMock.mockRestore();
            mathRandomMock.mockRestore();
        });

        it('should call OpenAI API when no valid cache entry exists', async () => {
            await getAIRecommendation(title, keyphrase, mockEnv, context, additionalContext);
            expect(MockedOpenAI).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
            expect(mockCreate).toHaveBeenCalledTimes(1);
        });

        it('should return a cleaned recommendation from OpenAI', async () => {
            const recommendation = await getAIRecommendation(title, keyphrase, mockEnv, context, additionalContext);
            expect(recommendation).toBe('Use "SEO analysis tool" in your Meta Description.');
        });

        it('should call OpenAI API on subsequent calls (no caching)', async () => {
            // First call
            await getAIRecommendation(title, keyphrase, mockEnv, context, additionalContext);
            expect(mockCreate).toHaveBeenCalledTimes(1);

            // Advance time slightly (simulating a quick second request)
            dateNowMock.mockImplementation(() => 1700000000000 + 10000); // +10 seconds

            // Second call - should *still* call the API
            const recommendation = await getAIRecommendation(title, keyphrase, mockEnv, context, additionalContext);
            // Expect API to be called again because caching is disabled
            expect(mockCreate).toHaveBeenCalledTimes(2);
            // The result should still be the cleaned version from the (mocked) API response
            expect(recommendation).toBe('Use "SEO analysis tool" in your Meta Description.');
        });

        it('should call OpenAI API again after a delay (no caching)', async () => {
            // First call
            await getAIRecommendation(title, keyphrase, mockEnv, context, additionalContext);
            expect(mockCreate).toHaveBeenCalledTimes(1);

            // Advance time significantly
            dateNowMock.mockImplementation(() => 1700000000000 + 900001); // +15 mins and 1ms

            // Second call - should call the API again
            await getAIRecommendation(title, keyphrase, mockEnv, context, additionalContext);
            // Expect API to be called again because caching is disabled
            expect(mockCreate).toHaveBeenCalledTimes(2);
        });

        it('should handle OpenAI API errors gracefully and return fallback', async () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const apiError = new Error('OpenAI API failed');
            mockCreate.mockRejectedValueOnce(apiError);

            const recommendation = await getAIRecommendation(title, keyphrase, mockEnv, context, additionalContext);

            // Expect the GENERIC fallback message from the CATCH block
            const expectedFallback = `${keyphrase.charAt(0).toUpperCase() + keyphrase.slice(1)} - Your Website`;
            expect(recommendation).toBe(expectedFallback);
            // Expect the error to be logged
            expect(consoleErrorSpy).toHaveBeenCalledWith('[SEO Analyzer] Error getting AI recommendation:', apiError);

            consoleErrorSpy.mockRestore(); // Clean up the spy
        });

        it('should return fallback if OpenAI response content is empty or null', async () => {
            mockCreate.mockResolvedValueOnce({
                choices: [{ message: { role: 'assistant', content: null, refusal: null }, finish_reason: 'stop', index: 0, logprobs: null }],
                id: 'chatcmpl-mockId1', created: Date.now(), model: 'gpt-mock-model', object: 'chat.completion'
            });
            // Use a unique keyphrase to avoid cache hits from previous tests if necessary
            const recommendation1 = await getAIRecommendation(title, keyphrase + '-null', mockEnv);
            expect(recommendation1).toBe(`Add "${keyphrase}-null" to your ${title.toLowerCase()}`); // Specific fallback when cleaning results in empty

            mockCreate.mockResolvedValueOnce({
                choices: [{ message: { role: 'assistant', content: '   ', refusal: null }, finish_reason: 'stop', index: 0, logprobs: null }],
                id: 'chatcmpl-mockId2', created: Date.now(), model: 'gpt-mock-model', object: 'chat.completion'
             }); // Whitespace only
             // Use a unique keyphrase
            const recommendation2 = await getAIRecommendation(title, keyphrase + '-empty', mockEnv);
             expect(recommendation2).toBe(`Add "${keyphrase}-empty" to your ${title.toLowerCase()}`);
        });

        it('should truncate long context and additionalContext', async () => {
            const longContext = 'a'.repeat(400);
            const longAdditionalContext = 'b'.repeat(250);
            const expectedTruncatedContext = 'a'.repeat(300) + '...';
            const expectedTruncatedAdditionalContext = 'b'.repeat(200) + '...';

            await getAIRecommendation(title, keyphrase, mockEnv, longContext, longAdditionalContext);

            expect(mockCreate).toHaveBeenCalledTimes(1);
            const calls = mockCreate.mock.calls;
            const messages = calls[0][0].messages;
            const userMessage = messages.find(m => m.role === 'user');

            expect(userMessage?.content).toContain(`Current content: ${expectedTruncatedContext}`);
            expect(userMessage?.content).toContain(`Additional context: ${expectedTruncatedAdditionalContext}`);
        });

        it('should construct the user prompt correctly without context', async () => {
            await getAIRecommendation(title, keyphrase, mockEnv);
            expect(mockCreate).toHaveBeenCalledTimes(1);
            const calls = mockCreate.mock.calls;
            const messages = calls[0][0].messages;
            const userMessage = messages.find(m => m.role === 'user');
            const expectedUserContent = `Fix this SEO issue: "${title}" for keyphrase "${keyphrase}".\n         \n         `; // Note the trailing spaces from template literals

            expect(userMessage?.content).toBe(expectedUserContent);
        });

        it('should construct the system prompt correctly using mocked Math.random', async () => {
            await getAIRecommendation(title, keyphrase, mockEnv);
            expect(mockCreate).toHaveBeenCalledTimes(1);
            const calls = mockCreate.mock.calls;
            const messages = calls[0][0].messages;
            const systemMessage = messages.find(m => m.role === 'system');
            const expectedIntroPhrase = "Here is a better [element]: [example]"; // First phrase because Math.random = 0
            // ADJUSTED WHITESPACE to match source code template literal exactly
            const expectedSystemContent = `You are an SEO expert providing concise, actionable recommendations.
         Keep responses under 100 words.
         Format: "${expectedIntroPhrase}"
         Avoid quotation marks.`;

            expect(systemMessage?.content).toBe(expectedSystemContent);
        });

        it('should clean the recommendation string correctly', async () => {
            const testCases = [
                { input: 'Here is a better title: Use the keyphrase.', expected: 'Use the keyphrase.' },
                // This case should now pass with the updated regex in getAIRecommendation
                { input: 'Try this meta description: Include SEO analysis tool.', expected: 'Include SEO analysis tool.' },
                { input: 'Improved h1: Add "Webflow SEO" to your heading.', expected: 'Add "Webflow SEO" to your heading.' },
                { input: 'A better alt text: Image of a Webflow dashboard.', expected: 'Image of a Webflow dashboard.' },
                { input: 'Recommendation: Ensure your keyphrase appears early.', expected: 'Ensure your keyphrase appears early.' },
                { input: 'Suggestion: Make the title more engaging.', expected: 'Make the title more engaging.' },
                { input: 'Update: Your meta description is too short.', expected: 'Your meta description is too short.' },
                { input: 'Fix: Add alt text to all images.', expected: 'Add alt text to all images.' },
                { input: '"Here is a better title: Use the keyphrase."', expected: 'Use the keyphrase.' }, // With quotes
                { input: '  Recommendation: Ensure your keyphrase appears early.  ', expected: 'Ensure your keyphrase appears early.' }, // With padding
                { input: 'Use the keyphrase.', expected: 'Use the keyphrase.' }, // No prefix
                { input: '[element]: Just the content.', expected: 'Just the content.' }, // Malformed prefix
                { input: 'Here is a better [element]: Use "SEO analysis tool" in your Meta Description.', expected: 'Use "SEO analysis tool" in your Meta Description.' },
            ];

            for (const { input, expected } of testCases) {
                mockCreate.mockResolvedValueOnce({
                    choices: [{ message: { role: 'assistant', content: input, refusal: null }, finish_reason: 'stop', index: 0, logprobs: null }],
                    id: `chatcmpl-mockId-${input.substring(0,5)}`, created: Date.now(), model: 'gpt-mock-model', object: 'chat.completion'
                });
                // Use a unique keyphrase for each sub-test to avoid cache interference if needed
                const result = await getAIRecommendation(title, `test-${input.substring(0,5)}`, mockEnv);
                expect(result, `Failed for input: ${input}`).toBe(expected);
            }
        });
    });
});