import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPageSlug } from '../../client/src/lib/get-page-slug';

declare global {
  interface Window {
    webflow: any;
  }
}

describe('getPageSlug', () => {
  beforeEach(() => {
    // Reset mock before each test
    vi.resetAllMocks();
  });

  it('should return the page slug from Webflow API', async () => {
    // Mock the page object with getSlug method
    const mockPage = {
      getSlug: vi.fn().mockResolvedValue('about-us')
    };

    // Mock getCurrentPage to return our mock page
    window.webflow.getCurrentPage = vi.fn().mockResolvedValue(mockPage);

    // Call the function
    const result = await getPageSlug();

    // Assertions
    expect(window.webflow.getCurrentPage).toHaveBeenCalledTimes(1);
    expect(mockPage.getSlug).toHaveBeenCalledTimes(1);
    expect(result).toBe('about-us');
  });

  it('should throw an error when getCurrentPage fails', async () => {
    // Mock getCurrentPage to throw an error
    window.webflow.getCurrentPage = vi.fn().mockRejectedValue(new Error('API error'));

    // Expect the function to throw
    await expect(getPageSlug()).rejects.toThrow('Failed to get page slug');

    // Verify getCurrentPage was called
    expect(window.webflow.getCurrentPage).toHaveBeenCalledTimes(1);
  });

  it('should throw an error when getSlug fails', async () => {
    // Mock the page object with getSlug method that throws
    const mockPage = {
      getSlug: vi.fn().mockRejectedValue(new Error('Slug error'))
    };

    // Mock getCurrentPage to return our mock page
    window.webflow.getCurrentPage = vi.fn().mockResolvedValue(mockPage);

    // Expect the function to throw
    await expect(getPageSlug()).rejects.toThrow('Failed to get page slug');

    // Verify both methods were called
    expect(window.webflow.getCurrentPage).toHaveBeenCalledTimes(1);
    expect(mockPage.getSlug).toHaveBeenCalledTimes(1);
  });

  it('should handle empty slugs', async () => {
    // Mock the page object with getSlug method that returns empty string
    const mockPage = {
      getSlug: vi.fn().mockResolvedValue('')
    };

    // Mock getCurrentPage to return our mock page
    window.webflow.getCurrentPage = vi.fn().mockResolvedValue(mockPage);

    // Call the function
    const result = await getPageSlug();

    // Assertions
    expect(result).toBe('');
  });
});
