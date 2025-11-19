/**
 * Tests for Webflow Designer API Detection
 * RED phase: Write failing tests first
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  detectWebflowDesignerCapabilities,
  testWebflowDesignerConnection,
  waitForWebflowDesigner,
} from './webflowDesignerApiDetection';

describe('Webflow Designer API Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.webflow
    (global as any).window = {};
  });

  describe('detectWebflowDesignerCapabilities', () => {
    it('should detect no capabilities when webflow object is missing', () => {
      const capabilities = detectWebflowDesignerCapabilities();
      
      expect(capabilities.canReadPageInfo).toBe(false);
      expect(capabilities.canUpdatePageTitle).toBe(false);
      expect(capabilities.canUpdatePageMeta).toBe(false);
      expect(capabilities.canUpdatePageSlug).toBe(false);
      expect(capabilities.canAddCustomCode).toBe(false);
      expect(capabilities.canUpdateCMS).toBe(false);
      expect(capabilities.availableMethods).toEqual([]);
    });

    it('should detect read capabilities when getCurrentPage is available', () => {
      (global as any).window = {
        webflow: {
          getCurrentPage: vi.fn(),
        },
      };

      const capabilities = detectWebflowDesignerCapabilities();
      
      expect(capabilities.canReadPageInfo).toBe(true);
      expect(capabilities.availableMethods).toContain('getCurrentPage');
    });

    it('should detect update capabilities when setPageSetting is available', () => {
      (global as any).window = {
        webflow: {
          setPageSetting: vi.fn(),
          getCurrentPage: vi.fn(),
        },
      };

      const capabilities = detectWebflowDesignerCapabilities();
      
      expect(capabilities.canUpdatePageTitle).toBe(true);
      expect(capabilities.canUpdatePageMeta).toBe(true);
      expect(capabilities.canUpdatePageSlug).toBe(true);
      expect(capabilities.availableMethods).toContain('setPageSetting');
    });

    it('should detect custom code capabilities when addCustomCode is available', () => {
      (global as any).window = {
        webflow: {
          addCustomCode: vi.fn(),
        },
      };

      const capabilities = detectWebflowDesignerCapabilities();
      
      expect(capabilities.canAddCustomCode).toBe(true);
      expect(capabilities.availableMethods).toContain('addCustomCode');
    });
  });

  describe('testWebflowDesignerConnection', () => {
    it('should return failure when webflow object is missing', async () => {
      const result = await testWebflowDesignerConnection();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No window.webflow object');
    });

    it('should return success when can get page info', async () => {
      const mockPageInfo = { id: 'test-page', title: 'Test Page' };
      (global as any).window = {
        webflow: {
          getCurrentPage: vi.fn().mockResolvedValue(mockPageInfo),
        },
      };

      const result = await testWebflowDesignerConnection();
      
      expect(result.success).toBe(true);
      expect(result.pageInfo).toEqual(mockPageInfo);
    });

    it('should fallback to getPage if getCurrentPage fails', async () => {
      const mockPageInfo = { id: 'test-page', title: 'Test Page' };
      (global as any).window = {
        webflow: {
          getCurrentPage: vi.fn().mockRejectedValue(new Error('Not available')),
          getPage: vi.fn().mockReturnValue(mockPageInfo),
        },
      };

      const result = await testWebflowDesignerConnection();
      
      expect(result.success).toBe(true);
      expect(result.pageInfo).toEqual(mockPageInfo);
    });

    it('should get site info when available', async () => {
      const mockSiteInfo = { id: 'test-site', name: 'Test Site' };
      (global as any).window = {
        webflow: {
          getSiteInfo: vi.fn().mockReturnValue(mockSiteInfo),
        },
      };

      const result = await testWebflowDesignerConnection();
      
      expect(result.success).toBe(true);
      expect(result.siteInfo).toEqual(mockSiteInfo);
    });
  });

  describe('waitForWebflowDesigner', () => {
    it('should resolve immediately when API is ready', async () => {
      (global as any).window = {
        webflow: {
          getCurrentPage: vi.fn().mockResolvedValue({ id: 'test-page' }),
        },
      };

      const startTime = Date.now();
      const result = await waitForWebflowDesigner(1000);
      const elapsed = Date.now() - startTime;
      
      expect(result).toBe(true);
      expect(elapsed).toBeLessThan(500); // Should be quick
    });

    it('should timeout when API never becomes ready', async () => {
      (global as any).window = {
        webflow: {
          getCurrentPage: vi.fn().mockRejectedValue(new Error('Not ready')),
        },
      };

      const startTime = Date.now();
      const result = await waitForWebflowDesigner(500); // Short timeout for test
      const elapsed = Date.now() - startTime;
      
      expect(result).toBe(false);
      expect(elapsed).toBeGreaterThanOrEqual(500);
    });
  });
});