/**
 * TDD Tests for Webflow Designer API Element Manipulation
 * RED Phase: These tests should FAIL initially and drive implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebflowDesignerExtensionAPI } from './webflowDesignerApi';

// Mock element structure based on actual Webflow API
const mockElement = {
  tagName: 'h1',
  textContent: 'Original H1 Content',
  setTextContent: vi.fn(),
  getTextContent: vi.fn(),
  getAttribute: vi.fn(),
  setAttribute: vi.fn(),
};

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

describe('WebflowDesignerAPI Element Discovery and Manipulation', () => {
  let api: WebflowDesignerExtensionAPI;

  beforeEach(() => {
    vi.clearAllMocks();
    api = new WebflowDesignerExtensionAPI();
    
    // Setup default successful mocks
    mockWebflowAPI.getCurrentPage.mockResolvedValue({ id: 'page-123' });
    mockElement.setTextContent.mockResolvedValue(true);
    mockElement.getTextContent.mockResolvedValue('Original Content');
  });

  describe('Element Discovery', () => {
    it('should detect getAllElements method exists', async () => {
      expect(typeof window.webflow?.getAllElements).toBe('function');
    });

    it('should get all elements with proper structure', async () => {
      const mockElements = [
        { tagName: 'h1', textContent: 'Main Heading', setTextContent: vi.fn(), getTextContent: vi.fn() },
        { tagName: 'p', textContent: 'First paragraph', setTextContent: vi.fn(), getTextContent: vi.fn() },
        { tagName: 'h2', textContent: 'Sub heading', setTextContent: vi.fn(), getTextContent: vi.fn() }
      ];
      
      mockWebflowAPI.getAllElements.mockResolvedValue(mockElements);

      const elements = await api.getAllElements();
      
      expect(elements).toHaveLength(3);
      expect(elements[0]).toHaveProperty('tagName', 'h1');
      expect(elements[0]).toHaveProperty('textContent', 'Main Heading');
      expect(typeof elements[0].setTextContent).toBe('function');
    });

    it('should filter elements by tag name', async () => {
      const mockElements = [
        { tagName: 'h1', textContent: 'H1 Content', setTextContent: vi.fn(), getTextContent: vi.fn() },
        { tagName: 'p', textContent: 'Paragraph', setTextContent: vi.fn(), getTextContent: vi.fn() },
        { tagName: 'h2', textContent: 'H2 Content', setTextContent: vi.fn(), getTextContent: vi.fn() },
        { tagName: 'h2', textContent: 'Another H2', setTextContent: vi.fn(), getTextContent: vi.fn() }
      ];
      
      mockWebflowAPI.getAllElements.mockResolvedValue(mockElements);

      const h2Elements = await api.getElementsByTagName('h2');
      
      expect(h2Elements).toHaveLength(2);
      expect(h2Elements[0].textContent).toBe('H2 Content');
      expect(h2Elements[1].textContent).toBe('Another H2');
    });

    it('should handle empty element lists', async () => {
      mockWebflowAPI.getAllElements.mockResolvedValue([]);

      const elements = await api.getElementsByTagName('h1');
      
      expect(elements).toHaveLength(0);
    });
  });

  describe.skip('H1 Heading Updates - DISABLED (issue #504)', () => {
    it('should find and update first H1 element', async () => {
      const h1Element = { 
        tagName: 'h1', 
        textContent: 'Old H1', 
        setTextContent: vi.fn().mockResolvedValue(true),
        getTextContent: vi.fn().mockResolvedValue('Old H1')
      };
      
      mockWebflowAPI.getAllElements.mockResolvedValue([h1Element]);

      const result = await api.updateH1Heading('page-123', 'New H1 Content');
      
      expect(result).toBe(true);
      expect(h1Element.setTextContent).toHaveBeenCalledWith('New H1 Content');
    });

    it('should handle pages without H1 elements', async () => {
      const elements = [
        { tagName: 'p', textContent: 'Just a paragraph', setTextContent: vi.fn(), getTextContent: vi.fn() }
      ];
      
      mockWebflowAPI.getAllElements.mockResolvedValue(elements);

      await expect(api.updateH1Heading('page-123', 'New H1')).rejects.toThrow('No H1 elements found');
    });

    it('should preserve element attributes when updating', async () => {
      const h1Element = { 
        tagName: 'h1', 
        textContent: 'Old H1',
        getAttribute: vi.fn().mockReturnValue('custom-class'),
        setAttribute: vi.fn(),
        setTextContent: vi.fn().mockResolvedValue(true),
        getTextContent: vi.fn().mockResolvedValue('Old H1')
      };
      
      mockWebflowAPI.getAllElements.mockResolvedValue([h1Element]);

      await api.updateH1Heading('page-123', 'New H1 Content');
      
      // Should not modify attributes, only text content
      expect(h1Element.setAttribute).not.toHaveBeenCalled();
      expect(h1Element.setTextContent).toHaveBeenCalledWith('New H1 Content');
    });
  });

  describe.skip('H2 Heading Updates - DISABLED (issue #504)', () => {
    it('should update H2 by index', async () => {
      const h2Elements = [
        { tagName: 'h2', textContent: 'First H2', setTextContent: vi.fn().mockResolvedValue(true), getTextContent: vi.fn() },
        { tagName: 'h2', textContent: 'Second H2', setTextContent: vi.fn().mockResolvedValue(true), getTextContent: vi.fn() }
      ];
      
      mockWebflowAPI.getAllElements.mockResolvedValue(h2Elements);

      const result = await api.updateH2Heading('page-123', 'Updated Second H2', 1);
      
      expect(result).toBe(true);
      expect(h2Elements[1].setTextContent).toHaveBeenCalledWith('Updated Second H2');
      expect(h2Elements[0].setTextContent).not.toHaveBeenCalled();
    });

    it('should handle out-of-bounds index', async () => {
      const h2Elements = [
        { tagName: 'h2', textContent: 'Only H2', setTextContent: vi.fn(), getTextContent: vi.fn() }
      ];
      
      mockWebflowAPI.getAllElements.mockResolvedValue(h2Elements);

      await expect(api.updateH2Heading('page-123', 'New Content', 5)).rejects.toThrow('H2 element at index 5 not found');
    });

    it('should default to first H2 when no index provided', async () => {
      const h2Elements = [
        { tagName: 'h2', textContent: 'First H2', setTextContent: vi.fn().mockResolvedValue(true), getTextContent: vi.fn() },
        { tagName: 'h2', textContent: 'Second H2', setTextContent: vi.fn(), getTextContent: vi.fn() }
      ];
      
      mockWebflowAPI.getAllElements.mockResolvedValue(h2Elements);

      const result = await api.updateH2Heading('page-123', 'Updated First H2');
      
      expect(result).toBe(true);
      expect(h2Elements[0].setTextContent).toHaveBeenCalledWith('Updated First H2');
      expect(h2Elements[1].setTextContent).not.toHaveBeenCalled();
    });
  });

  describe.skip('Introduction Paragraph Updates - DISABLED (issue #504)', () => {
    it('should identify introduction by content length', async () => {
      const elements = [
        { tagName: 'p', textContent: 'Short', setTextContent: vi.fn(), getTextContent: vi.fn().mockResolvedValue('Short') },
        { tagName: 'p', textContent: 'This is a much longer paragraph that could be the introduction because it has substantial content explaining the page purpose', setTextContent: vi.fn().mockResolvedValue(true), getTextContent: vi.fn().mockResolvedValue('This is a much longer paragraph that could be the introduction because it has substantial content explaining the page purpose') }
      ];
      
      mockWebflowAPI.getAllElements.mockResolvedValue(elements);

      const result = await api.updateIntroductionParagraph('page-123', 'New introduction content');
      
      expect(result).toBe(true);
      expect(elements[1].setTextContent).toHaveBeenCalledWith('New introduction content');
      expect(elements[0].setTextContent).not.toHaveBeenCalled();
    });

    it('should skip empty paragraphs', async () => {
      const elements = [
        { tagName: 'p', textContent: '', setTextContent: vi.fn(), getTextContent: vi.fn().mockResolvedValue('') },
        { tagName: 'p', textContent: '   ', setTextContent: vi.fn(), getTextContent: vi.fn().mockResolvedValue('   ') },
        { tagName: 'p', textContent: 'This is the actual introduction with meaningful content that should be selected', setTextContent: vi.fn().mockResolvedValue(true), getTextContent: vi.fn().mockResolvedValue('This is the actual introduction with meaningful content that should be selected') }
      ];
      
      mockWebflowAPI.getAllElements.mockResolvedValue(elements);

      const result = await api.updateIntroductionParagraph('page-123', 'New content');
      
      expect(result).toBe(true);
      expect(elements[2].setTextContent).toHaveBeenCalledWith('New content');
    });

    it('should handle Webflow text blocks when no paragraphs found', async () => {
      const elements = [
        { tagName: 'div', className: 'text-block', textContent: 'This is a Webflow text block with substantial content that serves as the introduction', setTextContent: vi.fn().mockResolvedValue(true), getTextContent: vi.fn().mockResolvedValue('This is a Webflow text block with substantial content that serves as the introduction') }
      ];
      
      mockWebflowAPI.getAllElements.mockResolvedValue(elements);

      const result = await api.updateIntroductionParagraph('page-123', 'New text block content');
      
      expect(result).toBe(true);
      expect(elements[0].setTextContent).toHaveBeenCalledWith('New text block content');
    });

    it('should throw error when no suitable introduction found', async () => {
      const elements = [
        { tagName: 'p', textContent: 'Too short', setTextContent: vi.fn(), getTextContent: vi.fn().mockResolvedValue('Too short') },
        { tagName: 'div', textContent: 'Not a text element', setTextContent: vi.fn(), getTextContent: vi.fn() }
      ];
      
      mockWebflowAPI.getAllElements.mockResolvedValue(elements);

      await expect(api.updateIntroductionParagraph('page-123', 'New content')).rejects.toThrow('No suitable introduction paragraph found');
    });
  });

  describe('Error Handling', () => {
    it('should handle API timeout gracefully', async () => {
      mockWebflowAPI.getAllElements.mockRejectedValue(new Error('Timeout'));

      await expect(api.updateH1Heading('page-123', 'New content')).rejects.toThrow('Timeout');
    });

    it('should retry failed operations', async () => {
      const h1Element = { 
        tagName: 'h1', 
        textContent: 'H1', 
        setTextContent: vi.fn()
          .mockRejectedValueOnce(new Error('Temporary failure'))
          .mockResolvedValueOnce(true),
        getTextContent: vi.fn().mockResolvedValue('H1')
      };
      
      mockWebflowAPI.getAllElements.mockResolvedValue([h1Element]);

      const result = await api.updateH1Heading('page-123', 'New H1');
      
      expect(result).toBe(true);
      expect(h1Element.setTextContent).toHaveBeenCalledTimes(2);
    });
  });
});