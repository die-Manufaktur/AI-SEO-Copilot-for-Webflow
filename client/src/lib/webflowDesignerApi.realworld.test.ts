/**
 * Real-world TDD Tests for Webflow Designer API Functionality
 * 
 * These tests verify both element detection (always works) and content modification 
 * (works in test environments, limited by API permissions in production - Issue #504).
 * 
 * The tests serve multiple purposes:
 * 1. Verify element detection logic works correctly
 * 2. Validate content update methods when API permits
 * 3. Ensure defensive programming handles edge cases
 * 4. Provide regression testing for future API improvements
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebflowDesignerExtensionAPI } from './webflowDesignerApi';

// Mock elements with correct Webflow structure (using 'type' instead of 'tagName')
const mockWebflowElements = [
  { 
    // Element with no type (reproducing real API inconsistencies)
    id: 'element-1',
    textContent: 'Some content',
    setTextContent: vi.fn(),
    getTextContent: vi.fn(),
  },
  { 
    id: 'element-2',
    type: 'HeadingElement',
    textContent: 'Real H1 Content', 
    setTextContent: vi.fn(),
    getTextContent: vi.fn(),
    getText: vi.fn().mockResolvedValue('Real H1 Content'), // For compatibility
    getHeadingLevel: vi.fn().mockResolvedValue(1),
  },
  { 
    // Element with null type
    id: 'element-3',
    type: null,
    textContent: 'Null type content',
    setTextContent: vi.fn(),
    getTextContent: vi.fn(),
  },
  { 
    id: 'element-4',
    type: 'ParagraphElement',
    textContent: 'This is a substantial paragraph with more than 50 characters to be considered for introduction',
    setTextContent: vi.fn(),
    getTextContent: vi.fn(),
  },
  {
    id: 'element-5', 
    type: 'HeadingElement',
    textContent: 'H2 Content',
    setTextContent: vi.fn(),
    getTextContent: vi.fn(),
    getText: vi.fn().mockResolvedValue('H2 Content'), // For H2DetectionSystem compatibility
    getHeadingLevel: vi.fn().mockResolvedValue(2),
  }
];

const mockWebflowAPI = {
  getCurrentPage: vi.fn(),
  getAllElements: vi.fn(),
  getSelectedElement: vi.fn(),
  setSelectedElement: vi.fn(),
  elementBuilder: vi.fn(),
};

// Setup global window.webflow mock
Object.defineProperty(window, 'webflow', {
  value: mockWebflowAPI,
  writable: true,
});

describe('WebflowDesignerAPI Real-world Error Reproduction', () => {
  let api: WebflowDesignerExtensionAPI;

  beforeEach(() => {
    vi.clearAllMocks();
    api = new WebflowDesignerExtensionAPI();
    
    // Setup default mocks
    mockWebflowAPI.getCurrentPage.mockResolvedValue({ id: 'page-123' });
    mockWebflowAPI.getAllElements.mockResolvedValue(mockWebflowElements);
  });

  describe('Element Detection Using Webflow Types (FIXED)', () => {
    it('should find HeadingElement when looking for h1 tags', async () => {
      // After fix, this should work using Webflow element types
      const h1Elements = await api.getElementsByTagName('h1');
      
      // Should return HeadingElements (both H1 and H2 are HeadingElement type)
      expect(h1Elements).toHaveLength(2); // Both heading elements
      expect(h1Elements[0].type).toBe('HeadingElement');
      expect(h1Elements[1].type).toBe('HeadingElement');
    });

    it('should find ParagraphElement for introduction content', async () => {
      // Mock the getTextContent method for the paragraph element
      mockWebflowElements[3].getTextContent.mockResolvedValue(
        'This is a substantial paragraph with more than 50 characters to be considered for introduction'
      );
      
      // This should work - element detection is supported
      const introElement = await api.findIntroductionParagraph();
      expect(introElement).toBeTruthy();
      expect(introElement?.type).toBe('ParagraphElement');
      expect(introElement?.id).toBe('element-4');
    });

    it('should successfully update H1 HeadingElement (when API permits)', async () => {
      // Mock the element's methods
      const h1Element = mockWebflowElements[1];
      expect(h1Element).toBeDefined();
      h1Element.setTextContent.mockResolvedValue(true);
      h1Element.getTextContent.mockResolvedValue('Real H1 Content');
      // Ensure the H1 element returns heading level 1
      h1Element.getHeadingLevel?.mockResolvedValue(1);
      
      // Note: This functionality depends on Webflow Designer API write permissions
      // In test environment with proper mocks, this should work
      const result = await api.updateH1Heading('page-123', 'New H1 Content');
      expect(result).toBe(true);
      expect(h1Element.setTextContent).toHaveBeenCalledWith('New H1 Content');
    });

    it('should successfully update H2 HeadingElement by index (when API permits)', async () => {
      // Mock the H2 element methods (element-5 is the H2)
      const h2Element = mockWebflowElements[4];
      expect(h2Element).toBeDefined();
      h2Element.setTextContent.mockResolvedValue(true);
      h2Element.getTextContent.mockResolvedValue('H2 Content');
      // Ensure the H2 element returns heading level 2
      h2Element.getHeadingLevel?.mockResolvedValue(2);
      
      // Note: This functionality depends on Webflow Designer API write permissions
      // In test environment with proper mocks, this should work
      const result = await api.updateH2Heading('page-123', 'New H2 Content', 0); // First H2 heading (index 0)
      expect(result).toBe(true);
      expect(h2Element.setTextContent).toHaveBeenCalledWith('New H2 Content');
    });
  });

  describe('Expected Behavior After Fix', () => {
    it('should safely filter elements ignoring those with undefined/null type', async () => {
      // After fix, this should pass using Webflow types
      const h1Elements = await api.getElementsByTagName('h1');
      
      expect(h1Elements).toHaveLength(2); // Both HeadingElements
      expect(h1Elements[0].type).toBe('HeadingElement');
      expect(h1Elements[0].textContent).toBe('Real H1 Content');
    });

    it('should safely find introduction paragraph using Webflow element types', async () => {
      // Mock the getTextContent method
      mockWebflowElements[3].getTextContent.mockResolvedValue(
        'This is a substantial paragraph with more than 50 characters to be considered for introduction'
      );
      
      // This should work - element detection is supported in the API
      const introElement = await api.findIntroductionParagraph();
      
      expect(introElement).toBeTruthy();
      expect(introElement?.type).toBe('ParagraphElement');
      expect(introElement?.id).toBe('element-4');
    });

    it('should successfully update H1 after filtering out invalid elements (when API permits)', async () => {
      // Mock the element's setTextContent method
      const h1Element = mockWebflowElements[1];
      expect(h1Element).toBeDefined();
      h1Element.setTextContent.mockResolvedValue(true);
      h1Element.getTextContent.mockResolvedValue('Real H1 Content');
      // Ensure the H1 element returns heading level 1
      h1Element.getHeadingLevel?.mockResolvedValue(1);
      
      // Note: This functionality depends on Webflow Designer API write permissions  
      const result = await api.updateH1Heading('page-123', 'Updated H1 Content');
      
      expect(result).toBe(true);
      expect(h1Element.setTextContent).toHaveBeenCalledWith('Updated H1 Content');
    });

    it('should handle empty type gracefully', async () => {
      // Test with empty string type
      const elementsWithEmptyType = [
        { id: 'empty-1', type: '', textContent: 'Empty type', setTextContent: vi.fn(), getTextContent: vi.fn() },
        { id: 'valid-1', type: 'HeadingElement', textContent: 'Valid H2', setTextContent: vi.fn(), getTextContent: vi.fn() }
      ];
      
      mockWebflowAPI.getAllElements.mockResolvedValueOnce(elementsWithEmptyType);
      
      const h2Elements = await api.getElementsByTagName('h2');
      
      expect(h2Elements).toHaveLength(1);
      expect(h2Elements[0].type).toBe('HeadingElement');
    });

    it('should correctly identify HeadingElements regardless of case', async () => {
      const elementsWithHeadings = [
        { id: 'heading-1', type: 'HeadingElement', textContent: 'First heading', setTextContent: vi.fn(), getTextContent: vi.fn() },
        { id: 'heading-2', type: 'HeadingElement', textContent: 'Second heading', setTextContent: vi.fn(), getTextContent: vi.fn() }
      ];
      
      mockWebflowAPI.getAllElements.mockResolvedValueOnce(elementsWithHeadings);
      
      const h1Elements = await api.getElementsByTagName('h1');
      
      expect(h1Elements).toHaveLength(2); // Should find both HeadingElements
      expect(h1Elements[0].type).toBe('HeadingElement');
      expect(h1Elements[1].type).toBe('HeadingElement');
    });
  });

  describe('Defensive Programming Tests', () => {
    it('should handle elements that are null or undefined', async () => {
      const elementsWithNulls = [
        null,
        undefined,
        { id: 'valid-h1', type: 'HeadingElement', textContent: 'Valid H1', setTextContent: vi.fn(), getTextContent: vi.fn() },
        null
      ];
      
      mockWebflowAPI.getAllElements.mockResolvedValueOnce(elementsWithNulls);
      
      const h1Elements = await api.getElementsByTagName('h1');
      
      expect(h1Elements).toHaveLength(1);
      expect(h1Elements[0].type).toBe('HeadingElement');
    });

    it('should handle elements with non-string type', async () => {
      const elementsWithInvalidType = [
        { id: 'invalid-1', type: 123, textContent: 'Number type', setTextContent: vi.fn(), getTextContent: vi.fn() },
        { id: 'invalid-2', type: { nested: 'object' }, textContent: 'Object type', setTextContent: vi.fn(), getTextContent: vi.fn() },
        { id: 'valid-1', type: 'HeadingElement', textContent: 'Valid H1', setTextContent: vi.fn(), getTextContent: vi.fn() }
      ];
      
      mockWebflowAPI.getAllElements.mockResolvedValueOnce(elementsWithInvalidType);
      
      const h1Elements = await api.getElementsByTagName('h1');
      
      expect(h1Elements).toHaveLength(1);
      expect(h1Elements[0].type).toBe('HeadingElement');
    });
  });
});