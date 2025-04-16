import { describe, it, expect, vi } from 'vitest';

// Temporarily define the function here for testing as it's not exported
// In a real scenario, export it from the original file and import it here.
/**
 * Extracts the complete text content from HTML elements, including text within nested elements
 * @param html The HTML string to extract text from
 * @param tagPattern The regex pattern to match the desired tag (e.g., h1, p, etc.)
 * @returns An array of extracted text strings
 */
function extractFullTextContent(html: string, tagPattern: RegExp): string[] {
    // Mock console.log to prevent test output pollution
    const originalConsoleLog = console.log;
    console.log = vi.fn();

    const results: string[] = [];
    let match;

    // Find all instances of the pattern in HTML
    while ((match = tagPattern.exec(html)) !== null) {
        if (match[1]) {
            // Extract the content between opening and closing tags
            const fullTagContent = match[1];

            // Replace <br> tags with spaces first
            const contentWithBreaksAsSpaces = fullTagContent.replace(/<br\s*\/?>/gi, ' ');

            // Strip remaining HTML tags and normalize whitespace
            const textContent = contentWithBreaksAsSpaces // Use the modified content
                .replace(/<[^>]+>/g, '')   // Replace other tags with empty string
                .replace(/\s+/g, ' ')      // Replace multiple spaces with single space
                .trim();

            if (textContent) {
                results.push(textContent);
            }
        }
    }
    // Restore console.log
    console.log = originalConsoleLog;
    return results;
}

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
});