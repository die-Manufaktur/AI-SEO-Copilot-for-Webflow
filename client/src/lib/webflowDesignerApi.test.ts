/**
 * Webflow Designer API Tests
 * TDD approach for fixing API loading issues
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebflowDesignerExtensionAPI } from './webflowDesignerApi';

// Mock window.webflow
const mockWebflow = {
  getCurrentPage: vi.fn().mockReturnValue({ id: 'test-page' }),
  setPageSetting: vi.fn(),
  updateCMSItem: vi.fn(),
  getAllElements: vi.fn().mockResolvedValue([]),
};

describe('WebflowDesignerExtensionAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup window.webflow mock
    Object.defineProperty(global, 'window', {
      value: {
        webflow: mockWebflow,
      },
      writable: true,
    });
  });

  describe('Basic API Functionality', () => {
    it('should create API instance', () => {
      const api = new WebflowDesignerExtensionAPI();
      expect(api).toBeDefined();
    });

    it('should be properly instantiated', () => {
      const api = new WebflowDesignerExtensionAPI();
      expect(api).toBeInstanceOf(WebflowDesignerExtensionAPI);
    });
  });

  describe('API Method Coverage', () => {
    beforeEach(() => {
      mockWebflow.getCurrentPage.mockReturnValue({ id: 'test-page' });
      mockWebflow.setPageSetting.mockResolvedValue(undefined);
      mockWebflow.updateCMSItem.mockResolvedValue(undefined);
    });

    it('should handle updatePageTitle correctly', async () => {
      const api = new WebflowDesignerExtensionAPI();
      
      const mockPage = {
        setTitle: vi.fn().mockResolvedValue(undefined)
      };
      mockWebflow.getCurrentPage.mockResolvedValue(mockPage);
      
      await expect(api.updatePageTitle('test-page-id', 'New Title')).resolves.not.toThrow();
      expect(mockPage.setTitle).toHaveBeenCalledWith('New Title');
    });

    it('should handle updatePageMetaDescription correctly', async () => {
      const api = new WebflowDesignerExtensionAPI();
      
      const mockPage = {
        setMetadata: vi.fn().mockResolvedValue(undefined)
      };
      mockWebflow.getCurrentPage.mockResolvedValue(mockPage);
      
      await expect(api.updatePageMetaDescription('test-page-id', 'New Description')).resolves.not.toThrow();
      expect(mockPage.setMetadata).toHaveBeenCalledWith({ description: 'New Description' });
    });

    it('should handle updatePageSlug correctly', async () => {
      const api = new WebflowDesignerExtensionAPI();
      
      const mockPage = {
        setSlug: vi.fn().mockResolvedValue(undefined)
      };
      mockWebflow.getCurrentPage.mockResolvedValue(mockPage);
      
      await expect(api.updatePageSlug('test-page-id', 'new-slug')).resolves.not.toThrow();
      expect(mockPage.setSlug).toHaveBeenCalledWith('new-slug');
    });
  });

  describe('updateImageAltText', () => {
    function makeImageElement(src: string) {
      return {
        id: `img-${src}`,
        type: 'ImageElement',
        getAttribute: vi.fn((name: string) => (name === 'src' ? src : null)),
        setAttribute: vi.fn(),
      };
    }

    it('sets alt attribute on the image element matching the exact URL', async () => {
      const imgEl = makeImageElement('https://cdn.example.com/photo.jpg');
      mockWebflow.getAllElements.mockResolvedValue([imgEl]);

      const api = new WebflowDesignerExtensionAPI();
      const result = await api.updateImageAltText('https://cdn.example.com/photo.jpg', 'A beautiful photo');

      expect(result).toBe(true);
      expect(imgEl.setAttribute).toHaveBeenCalledWith('alt', 'A beautiful photo');
    });

    it('matches image element by filename when src is a relative path', async () => {
      const imgEl = makeImageElement('/images/photo.jpg');
      mockWebflow.getAllElements.mockResolvedValue([imgEl]);

      const api = new WebflowDesignerExtensionAPI();
      const result = await api.updateImageAltText('https://example.com/images/photo.jpg', 'Landscape');

      expect(result).toBe(true);
      expect(imgEl.setAttribute).toHaveBeenCalledWith('alt', 'Landscape');
    });

    it('falls back to checking all elements when type is not a known image type', async () => {
      const unknownTypeEl = {
        id: 'unknown-img',
        type: 'UnknownType',
        getAttribute: vi.fn((name: string) => (name === 'src' ? 'https://cdn.example.com/hero.jpg' : null)),
        setAttribute: vi.fn(),
      };
      mockWebflow.getAllElements.mockResolvedValue([unknownTypeEl]);

      const api = new WebflowDesignerExtensionAPI();
      const result = await api.updateImageAltText('https://cdn.example.com/hero.jpg', 'Hero image');

      expect(result).toBe(true);
      expect(unknownTypeEl.setAttribute).toHaveBeenCalledWith('alt', 'Hero image');
    });

    it('throws when no image element matches the URL', async () => {
      const imgEl = makeImageElement('https://cdn.example.com/other.jpg');
      mockWebflow.getAllElements.mockResolvedValue([imgEl]);

      const api = new WebflowDesignerExtensionAPI();
      await expect(
        api.updateImageAltText('https://cdn.example.com/missing.jpg', 'alt text')
      ).rejects.toThrow(/No image element found/);
    });

    it('only sets alt on the matching image, not others', async () => {
      const imgA = makeImageElement('https://cdn.example.com/a.jpg');
      const imgB = makeImageElement('https://cdn.example.com/b.jpg');
      mockWebflow.getAllElements.mockResolvedValue([imgA, imgB]);

      const api = new WebflowDesignerExtensionAPI();
      await api.updateImageAltText('https://cdn.example.com/b.jpg', 'Image B');

      expect(imgA.setAttribute).not.toHaveBeenCalled();
      expect(imgB.setAttribute).toHaveBeenCalledWith('alt', 'Image B');
    });
  });
});