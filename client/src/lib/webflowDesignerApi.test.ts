/**
 * Webflow Designer API Tests
 * TDD approach for fixing API loading issues
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebflowDesignerExtensionAPI } from './webflowDesignerApi';

// Mock window.webflow
const mockWebflow = {
  getPage: vi.fn(),
  setPageSetting: vi.fn(),
  updateCMSItem: vi.fn(),
};

describe('WebflowDesignerExtensionAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.webflow
    (global as any).window = {
      webflow: mockWebflow,
    };
  });

  describe('API Readiness Detection', () => {
    it('should detect when Webflow Designer API is not ready', () => {
      // Setup: API exists but getPage is not available
      (global as any).window = {
        webflow: {
          setPageSetting: vi.fn(),
          // Missing getPage method
        },
      };

      const api = new WebflowDesignerExtensionAPI();
      
      // This should throw when trying to access getCurrentPage
      expect(() => {
        (api as any).getCurrentPage();
      }).toThrow('Unable to access current page. Webflow Designer API not fully loaded.');
    });

    it('should wait for API to be ready before proceeding', async () => {
      // Setup: API starts as not ready, then becomes ready
      let apiReady = false;
      (global as any).window = {
        webflow: {
          get getPage() {
            return apiReady ? vi.fn().mockReturnValue({ id: 'test-page' }) : undefined;
          },
          setPageSetting: vi.fn().mockResolvedValue(true),
        },
      };

      const api = new WebflowDesignerExtensionAPI();

      // Start the operation - it should wait
      const updatePromise = api.updatePageTitle('test-page', 'Test Title');

      // Simulate API becoming ready after a delay
      setTimeout(() => {
        apiReady = true;
      }, 100);

      // The operation should complete successfully
      const result = await updatePromise;
      expect(result).toBe(true);
    });

    it('should timeout if API never becomes ready', async () => {
      // Setup: API never becomes ready
      (global as any).window = {
        webflow: {
          setPageSetting: vi.fn(),
          // getPage is never available
        },
      };

      const api = new WebflowDesignerExtensionAPI();

      // This should timeout and throw
      await expect(api.updatePageTitle('test-page', 'Test Title'))
        .rejects
        .toThrow('Webflow Designer API failed to load within timeout period');
    });

    it('should retry API operations if they fail due to loading issues', async () => {
      let callCount = 0;
      (global as any).window = {
        webflow: {
          getPage: vi.fn().mockReturnValue({ id: 'test-page' }),
          setPageSetting: vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount < 3) {
              throw new Error('API not ready');
            }
            return Promise.resolve();
          }),
        },
      };

      const api = new WebflowDesignerExtensionAPI();

      // Should succeed after retries
      const result = await api.updatePageTitle('test-page', 'Test Title');
      expect(result).toBe(true);
      expect(callCount).toBe(3);
    });
  });

  describe('Graceful Degradation', () => {
    it('should fall back to alternative approach when Designer API unavailable', async () => {
      // Setup: No webflow object at all
      (global as any).window = {};

      // Should throw during construction since API is required
      expect(() => new WebflowDesignerExtensionAPI()).toThrow(
        'Webflow Designer API not available. This extension must run within Webflow Designer.'
      );
    });
  });

  describe('API Method Coverage', () => {
    beforeEach(() => {
      mockWebflow.getPage.mockReturnValue({ id: 'test-page' });
      mockWebflow.setPageSetting.mockResolvedValue(undefined);
      mockWebflow.updateCMSItem.mockResolvedValue(undefined);
    });

    it('should handle updatePageTitle correctly', async () => {
      const api = new WebflowDesignerExtensionAPI();
      const result = await api.updatePageTitle('test-page', 'New Title');
      
      expect(result).toBe(true);
      expect(mockWebflow.setPageSetting).toHaveBeenCalledWith('title', 'New Title');
    });

    it('should handle updatePageMetaDescription correctly', async () => {
      const api = new WebflowDesignerExtensionAPI();
      const result = await api.updatePageMetaDescription('test-page', 'New Description');
      
      expect(result).toBe(true);
      expect(mockWebflow.setPageSetting).toHaveBeenCalledWith('seo', {
        description: 'New Description'
      });
    });

    it('should handle updatePageSlug correctly', async () => {
      const api = new WebflowDesignerExtensionAPI();
      const result = await api.updatePageSlug('test-page', 'new-slug');
      
      expect(result).toBe(true);
      expect(mockWebflow.setPageSetting).toHaveBeenCalledWith('slug', 'new-slug');
    });

    it('should handle addCustomCode correctly', async () => {
      const api = new WebflowDesignerExtensionAPI();
      const code = '<script>alert("test");</script>';
      const result = await api.addCustomCode('test-page', code, 'head');
      
      expect(result).toBe(true);
      expect(mockWebflow.setPageSetting).toHaveBeenCalledWith('customCode', {
        head: code,
        footer: undefined
      });
    });

    it('should handle updateCMSField correctly', async () => {
      const api = new WebflowDesignerExtensionAPI();
      const result = await api.updateCMSField('item-123', 'field-456', 'New Value');
      
      expect(result).toBe(true);
      expect(mockWebflow.updateCMSItem).toHaveBeenCalledWith('item-123', {
        'field-456': 'New Value'
      });
    });
  });
});