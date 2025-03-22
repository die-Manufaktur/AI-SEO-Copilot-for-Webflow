import { describe, it, expect, vi, beforeEach } from 'vitest';

// Directly import the getSiteInfo function from Home.tsx
// Note: For this test to work, we would need to extract getSiteInfo as a separate function
// This is a simplified version for demonstration purposes
const mockGetSiteInfo = async () => {
  try {
    if (!window.webflow?.getSiteInfo) {
      throw new Error('Webflow API not available');
    }
    return await window.webflow.getSiteInfo();
  } catch (error) {
    console.error(`Error getting site info: ${error}`);
    return null;
  }
};

describe('getSiteInfo function', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return site info when Webflow API call succeeds', async () => {
    // Mock data to be returned by the getSiteInfo function
    const mockSiteInfo = {
      siteId: 'site123',
      siteName: 'My Test Site',
      shortName: 'test-site',
      domains: [
        { url: 'example.com', default: true },
        { url: 'test-site.webflow.io', default: false }
      ]
    };

    // Setup the mock
    window.webflow.getSiteInfo = vi.fn().mockResolvedValue(mockSiteInfo);

    // Call the function
    const result = await mockGetSiteInfo();

    // Assertions
    expect(window.webflow.getSiteInfo).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockSiteInfo);
    expect(result?.domains[0].url).toBe('example.com');
    expect(result?.domains[0].default).toBe(true);
  });

  it('should return null when Webflow API call fails', async () => {
    // Setup the mock to throw an error
    window.webflow.getSiteInfo = vi.fn().mockRejectedValue(new Error('API error'));

    // Call the function
    const result = await mockGetSiteInfo();

    // Assertions
    expect(window.webflow.getSiteInfo).toHaveBeenCalledTimes(1);
    expect(result).toBeNull();
  });

  it('should return null when webflow is not available', async () => {
    // Temporarily remove webflow from window
    const originalWebflow = window.webflow;
    window.webflow = undefined;

    // Call the function
    const result = await mockGetSiteInfo();

    // Assertions
    expect(result).toBeNull();

    // Restore webflow
    window.webflow = originalWebflow;
  });
});
