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
});