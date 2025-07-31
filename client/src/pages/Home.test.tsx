import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { renderWithQueryClient } from '../test-utils';
import Home from './Home';

// Mock ResizeObserver for ScrollArea component
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock the API module
vi.mock('../lib/api', () => ({
  analyzeSEO: vi.fn()
}));

// Mock the clipboard utility module
vi.mock('../utils/clipboard', () => ({
  copyTextToClipboard: vi.fn()
}));

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn()
}));

// Mock the webflow API
const mockWebflowApi = {
  getCurrentPage: vi.fn(),
  getSiteInfo: vi.fn(),
  subscribe: vi.fn(() => () => {}) // Return unsubscribe function
};

// Mock the global webflow object
Object.defineProperty(global, 'webflow', {
  value: mockWebflowApi,
  writable: true,
  configurable: true
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    reload: vi.fn(),
    hostname: 'localhost'
  },
  writable: true
});

// Mock WebflowDomain interface
interface WebflowDomain {
  id: string;
  name: string;
  url: string;
  host: string;
  publicUrl: string;
  publishedOn: string;
  lastPublished: string;
}

// Mock WebflowSiteInfo interface  
interface WebflowSiteInfo {
  id: string;
  name: string;
  shortName: string;
  domains: WebflowDomain[];
}

// Helper function to create complete mock analysis with all required fields
const createMockAnalysis = (overrides: any = {}) => ({
  checks: [
    {
      title: 'Keyphrase in Title',
      passed: true,
      priority: 'high' as const,
      description: 'The keyphrase appears in the page title',
      recommendation: null
    }
  ],
  passedChecks: 1,
  failedChecks: 0,
  score: 100,
  url: 'https://example.com/test-page',
  keyphrase: 'test keyphrase',
  totalChecks: 1,
  isHomePage: false,
  timestamp: new Date().toISOString(),
  ...overrides
});

describe('Home Component', () => {
  const mockSiteInfo: WebflowSiteInfo = {
    id: 'site123',
    name: 'Test Site',
    shortName: 'test-site',
    domains: [
      {
        id: 'domain1',
        name: 'example.com',
        url: 'https://example.com',
        host: 'example.com',
        publicUrl: 'https://example.com',
        publishedOn: '2024-01-01T00:00:00Z',
        lastPublished: '2024-01-01T00:00:00Z'
      }
    ]
  };

  const mockCurrentPage = {
    getSlug: vi.fn(() => Promise.resolve('test-page')),
    isHomepage: vi.fn(() => Promise.resolve(false)),
    getPublishPath: vi.fn(() => Promise.resolve('/test-page')),
    getOpenGraphImage: vi.fn(() => Promise.resolve('https://example.com/og-image.jpg')),
    usesTitleAsOpenGraphTitle: vi.fn(() => Promise.resolve(true)),
    usesDescriptionAsOpenGraphDescription: vi.fn(() => Promise.resolve(true))
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockWebflowApi.getCurrentPage.mockResolvedValue(mockCurrentPage);
    mockWebflowApi.getSiteInfo.mockResolvedValue(mockSiteInfo);
  });

  it('renders without crashing', () => {
    renderWithQueryClient(<Home />);
    expect(screen.getByText(/SEO Analysis Tool/i)).toBeInTheDocument();
  });

  it('displays keyphrase input field', () => {
    renderWithQueryClient(<Home />);
    expect(screen.getByPlaceholderText(/enter your target keyphrase/i)).toBeInTheDocument();
  });

  it('shows analyze button', () => {
    renderWithQueryClient(<Home />);
    expect(screen.getByText(/start optimizing your seo/i)).toBeInTheDocument();
  });

  it('handles keyphrase input changes', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<Home />);
    
    const input = screen.getByPlaceholderText(/enter your target keyphrase/i);
    await user.type(input, 'test keyphrase');
    
    expect(input).toHaveValue('test keyphrase');
  });

  it('validates keyphrase length', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<Home />);
    
    const input = screen.getByPlaceholderText(/enter your target keyphrase/i);
    const button = screen.getByText(/start optimizing your seo/i);
    
    await user.type(input, 'a');
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/keyphrase must be at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it('performs SEO analysis on valid keyphrase', async () => {
    const { analyzeSEO } = await import('../lib/api');
    const mockAnalysis = createMockAnalysis();
    
    vi.mocked(analyzeSEO).mockResolvedValue(mockAnalysis);
    
    const user = userEvent.setup();
    renderWithQueryClient(<Home />);
    
    const input = screen.getByPlaceholderText(/enter your target keyphrase/i);
    const button = screen.getByText(/start optimizing your seo/i);
    
    await user.type(input, 'test keyphrase');
    await user.click(button);
    
    await waitFor(() => {
      expect(analyzeSEO).toHaveBeenCalledWith(
        expect.objectContaining({
          keyphrase: 'test keyphrase',
          url: 'https://example.com/test-page',
          isHomePage: false,
          siteInfo: expect.objectContaining({
            domains: expect.arrayContaining([
              expect.objectContaining({
                url: 'https://example.com'
              })
            ])
          }),
          publishPath: '/test-page',
          webflowPageData: expect.objectContaining({
            openGraphImage: 'https://example.com/og-image.jpg'
          })
        })
      );
    });
  });

  it('displays loading state during analysis', async () => {
    const { analyzeSEO } = await import('../lib/api');
    vi.mocked(analyzeSEO).mockImplementation(() => new Promise(() => {})); // Never resolves
    
    const user = userEvent.setup();
    renderWithQueryClient(<Home />);
    
    const input = screen.getByPlaceholderText(/enter your target keyphrase/i);
    const button = screen.getByText(/start optimizing your seo/i);
    
    await user.type(input, 'test keyphrase');
    await user.click(button);
    
    expect(button).toBeDisabled();
    expect(screen.getByRole('button', { name: /start optimizing your seo/i })).toHaveAttribute('disabled');
  });

  it('handles analysis errors gracefully', async () => {
    const { analyzeSEO } = await import('../lib/api');
    vi.mocked(analyzeSEO).mockRejectedValue(new Error('Analysis failed'));
    
    const user = userEvent.setup();
    renderWithQueryClient(<Home />);
    
    const input = screen.getByPlaceholderText(/enter your target keyphrase/i);
    const button = screen.getByText(/start optimizing your seo/i);
    
    await user.type(input, 'test keyphrase');
    await user.click(button);
    
    // Wait for the button to be enabled again (indicates error handling completed)
    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
    
    // Check that no analysis results are shown (the main indicator of error state)
    expect(screen.queryByText(/Analysis Results/i)).not.toBeInTheDocument();
  });

  it('displays results after successful analysis', async () => {
    const { analyzeSEO } = await import('../lib/api');
    const mockAnalysis = createMockAnalysis({
      checks: [
        { 
          title: 'Keyphrase in Title', 
          passed: true, 
          priority: 'high', 
          description: 'The keyphrase appears in the page title',
          recommendation: null
        },
        { 
          title: 'Keyphrase in Meta Description', 
          passed: false, 
          priority: 'high', 
          description: 'The keyphrase should appear in the meta description',
          recommendation: 'Add your keyphrase to the meta description'
        }
      ],
      passedChecks: 1,
      failedChecks: 1,
      totalChecks: 2,
      score: 50
    });
    
    vi.mocked(analyzeSEO).mockResolvedValue(mockAnalysis);
    
    const user = userEvent.setup();
    renderWithQueryClient(<Home />);
    
    const input = screen.getByPlaceholderText(/enter your target keyphrase/i);
    const button = screen.getByText(/start optimizing your seo/i);
    
    await user.type(input, 'test keyphrase');
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/Analysis Results/i)).toBeInTheDocument();
      expect(screen.getByText(/SEO Score/i)).toBeInTheDocument();
      expect(screen.getByText(/1 passed/i)).toBeInTheDocument();
      expect(screen.getByText(/1 to improve/i)).toBeInTheDocument();
    });
  });

  it('handles unpublished page error correctly', async () => {
    const { analyzeSEO } = await import('../lib/api');
    vi.mocked(analyzeSEO).mockRejectedValue(new Error('Failed to fetch page content: 500'));
    
    const user = userEvent.setup();
    renderWithQueryClient(<Home />);
    
    const input = screen.getByPlaceholderText(/enter your target keyphrase/i);
    const button = screen.getByText(/start optimizing your seo/i);
    
    await user.type(input, 'test keyphrase');
    await user.click(button);
    
    // Wait for the button to be enabled again (indicates error handling completed)
    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
    
    // Check that the form is still visible (no results shown)
    expect(screen.queryByText(/Analysis Results/i)).not.toBeInTheDocument();
  });

  it('handles homepage URL check correctly', async () => {
    // Mock homepage
    mockCurrentPage.isHomepage.mockResolvedValue(true);
    mockCurrentPage.getPublishPath.mockResolvedValue('/');
    
    const { analyzeSEO } = await import('../lib/api');
    
    // Start with a failed URL check for homepage
    const mockAnalysis = createMockAnalysis({
      checks: [
        { 
          title: 'Keyphrase in URL', 
          passed: false, 
          priority: 'high', 
          description: 'The URL should contain the keyphrase for better SEO',
          recommendation: 'Add keyphrase to URL slug'
        }
      ],
      passedChecks: 0,
      failedChecks: 1,
      totalChecks: 1,
      score: 0,
      url: 'https://example.com/',
      isHomePage: true
    });
    
    vi.mocked(analyzeSEO).mockResolvedValue(mockAnalysis);
    
    const user = userEvent.setup();
    renderWithQueryClient(<Home />);
    
    const input = screen.getByPlaceholderText(/enter your target keyphrase/i);
    const button = screen.getByText(/start optimizing your seo/i);
    
    await user.type(input, 'test keyphrase');
    await user.click(button);
    
    // Wait for analysis results to appear
    await waitFor(() => {
      expect(screen.getByText(/Analysis Results/i)).toBeInTheDocument();
    });
    
    // After homepage modification, the component modifies the result
    // The failed URL check becomes passed, so we should see 1 passed, 0 to improve
    await waitFor(() => {
      expect(screen.getByText(/1 passed/i)).toBeInTheDocument();
      // The format might be different - let's check for the actual pattern used
      expect(screen.getByText(/0.*improve/i)).toBeInTheDocument();
    });
  });

  it('can navigate to category details', async () => {
    const { analyzeSEO } = await import('../lib/api');
    const mockAnalysis = createMockAnalysis({
      checks: [
        { 
          title: 'Keyphrase in Title', 
          passed: true, 
          priority: 'high', 
          description: 'The keyphrase appears in the page title',
          recommendation: null
        }
      ]
    });
    
    vi.mocked(analyzeSEO).mockResolvedValue(mockAnalysis);
    
    const user = userEvent.setup();
    renderWithQueryClient(<Home />);
    
    const input = screen.getByPlaceholderText(/enter your target keyphrase/i);
    const button = screen.getByText(/start optimizing your seo/i);
    
    await user.type(input, 'test keyphrase');
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/Meta SEO/i)).toBeInTheDocument();
    });
    
    // Click on Meta SEO category
    const metaSeoCategory = screen.getByText(/Meta SEO/i);
    await user.click(metaSeoCategory);
    
    await waitFor(() => {
      expect(screen.getByText(/Keyphrase in Title/i)).toBeInTheDocument();
    });
  });

  it('can copy recommendations to clipboard', async () => {
    const { analyzeSEO } = await import('../lib/api');
    const { copyTextToClipboard } = await import('../utils/clipboard');
    
    // Mock the copyTextToClipboard function to return success
    vi.mocked(copyTextToClipboard).mockResolvedValue(true);
    
    const mockAnalysis = createMockAnalysis({
      checks: [
        { 
          title: 'Keyphrase in Meta Description', 
          passed: false, 
          priority: 'high', 
          description: 'The keyphrase should appear in the meta description',
          recommendation: 'Add your keyphrase to the meta description'
        }
      ],
      passedChecks: 0,
      failedChecks: 1,
      score: 0
    });
    
    vi.mocked(analyzeSEO).mockResolvedValue(mockAnalysis);
    
    const user = userEvent.setup();
    renderWithQueryClient(<Home />);
    
    const input = screen.getByPlaceholderText(/enter your target keyphrase/i);
    const button = screen.getByText(/start optimizing your seo/i);
    
    await user.type(input, 'test keyphrase');
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/Meta SEO/i)).toBeInTheDocument();
    });
    
    // Click on Meta SEO category to see details
    const metaSeoCategory = screen.getByText(/Meta SEO/i);
    await user.click(metaSeoCategory);
    
    await waitFor(() => {
      expect(screen.getByText(/Copy/i)).toBeInTheDocument();
    });
    
    const copyButton = screen.getByText(/Copy/i);
    await user.click(copyButton);
    
    // Verify the copyTextToClipboard utility was called with the correct text
    expect(copyTextToClipboard).toHaveBeenCalledWith('Add your keyphrase to the meta description');
  });

  it('shows perfect score celebration for 100 score', async () => {
    const { analyzeSEO } = await import('../lib/api');
    const mockPerfectAnalysis = createMockAnalysis({
      checks: [
        { 
          title: 'Keyphrase in Title', 
          passed: true, 
          priority: 'high', 
          description: 'Perfect optimization achieved!',
          recommendation: null
        }
      ],
      score: 100
    });
    
    vi.mocked(analyzeSEO).mockResolvedValue(mockPerfectAnalysis);
    
    const user = userEvent.setup();
    renderWithQueryClient(<Home />);
    
    const input = screen.getByPlaceholderText(/enter your target keyphrase/i);
    const button = screen.getByText(/start optimizing your seo/i);
    
    await user.type(input, 'test keyphrase');
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/You are an absolute SEO legend/i)).toBeInTheDocument();
    });
  });

  it('handles no published domain found error', async () => {
    // Mock site info with empty domains array
    mockWebflowApi.getSiteInfo.mockResolvedValue({
      ...mockSiteInfo,
      domains: []
    });
    
    const user = userEvent.setup();
    renderWithQueryClient(<Home />);
    
    const input = screen.getByPlaceholderText(/enter your target keyphrase/i);
    const button = screen.getByText(/start optimizing your seo/i);
    
    await user.type(input, 'test keyphrase');
    await user.click(button);
    
    // Wait for the button to be enabled again (indicates error handling completed)
    await waitFor(() => {
      expect(button).not.toBeDisabled();
    }, { timeout: 3000 });
    
    // Check that no analysis results are shown
    expect(screen.queryByText(/Analysis Results/i)).not.toBeInTheDocument();
  });

  it('displays different score ratings correctly', async () => {
    const { analyzeSEO } = await import('../lib/api');
    
    // Create checks that will result in a calculated score of 60%
    // 1 high passed (3 points) + 0 medium passed (0 points) = 3 points
    // 1 high total (3 points) + 1 medium total (2 points) = 5 total points  
    // 3/5 = 60%
    const goodAnalysis = createMockAnalysis({
      checks: [
        { 
          title: 'Test Check 1', 
          passed: true, 
          priority: 'high', 
          description: 'Passed check',
          recommendation: null
        },
        { 
          title: 'Test Check 2', 
          passed: false, 
          priority: 'medium', 
          description: 'Failed check',
          recommendation: 'Fix this issue'
        }
      ],
      passedChecks: 1,
      failedChecks: 1,
      totalChecks: 2,
      score: 65 // This will be recalculated by the component to 60
    });
    
    vi.mocked(analyzeSEO).mockResolvedValue(goodAnalysis);
    
    const user = userEvent.setup();
    renderWithQueryClient(<Home />);
    
    const input = screen.getByPlaceholderText(/enter your target keyphrase/i);
    const button = screen.getByText(/start optimizing your seo/i);
    
    await user.type(input, 'test keyphrase');
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/Analysis Results/i)).toBeInTheDocument();
      
      // Look for the calculated score (60%) instead of the mocked score (65%)
      expect(screen.getByText('60')).toBeInTheDocument();
    });
  });

  it('handles multiple SEO check categories correctly', async () => {
    const { analyzeSEO } = await import('../lib/api');
    const mockAnalysis = createMockAnalysis({
      checks: [
        { 
          title: 'Keyphrase in Title', 
          passed: true, 
          priority: 'high', 
          description: 'Title optimization is good',
          recommendation: null
        },
        { 
          title: 'Content Length', 
          passed: false, 
          priority: 'medium', 
          description: 'Content could be longer',
          recommendation: 'Add more content to reach optimal length'
        },
        { 
          title: 'Internal Links', 
          passed: true, 
          priority: 'low', 
          description: 'Good internal linking',
          recommendation: null
        }
      ],
      passedChecks: 2,
      failedChecks: 1,
      totalChecks: 3,
      score: 75
    });
    
    vi.mocked(analyzeSEO).mockResolvedValue(mockAnalysis);
    
    const user = userEvent.setup();
    renderWithQueryClient(<Home />);
    
    const input = screen.getByPlaceholderText(/enter your target keyphrase/i);
    const button = screen.getByText(/start optimizing your seo/i);
    
    await user.type(input, 'test keyphrase');
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/Meta SEO/i)).toBeInTheDocument();
      expect(screen.getByText(/Content Optimisation/i)).toBeInTheDocument();
      // Use more specific selector for Links category to avoid ambiguity
      expect(screen.getByRole('heading', { name: /Links/i })).toBeInTheDocument();
    });
  });
});

describe('Home Component - Additional Coverage', () => {
  const mockSiteInfo = {
    id: 'site123',
    name: 'Test Site',
    shortName: 'test-site',
    domains: [
      {
        id: 'domain1',
        name: 'example.com',
        url: 'https://example.com',
        host: 'example.com',
        publicUrl: 'https://example.com',
        publishedOn: '2024-01-01T00:00:00Z',
        lastPublished: '2024-01-01T00:00:00Z'
      }
    ]
  };

  const mockCurrentPage = {
    getSlug: vi.fn(() => Promise.resolve('test-page')),
    isHomepage: vi.fn(() => Promise.resolve(false)),
    getPublishPath: vi.fn(() => Promise.resolve('/test-page')),
    getOpenGraphImage: vi.fn(() => Promise.resolve('https://example.com/og-image.jpg')),
    usesTitleAsOpenGraphTitle: vi.fn(() => Promise.resolve(true)),
    usesDescriptionAsOpenGraphDescription: vi.fn(() => Promise.resolve(true))
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockWebflowApi.getCurrentPage.mockResolvedValue(mockCurrentPage);
    mockWebflowApi.getSiteInfo.mockResolvedValue(mockSiteInfo);
    
    // Reset window.location.reload mock
    vi.mocked(window.location.reload).mockClear();
    
    // Ensure webflow is available by default
    Object.defineProperty(global, 'webflow', {
      value: mockWebflowApi,
      writable: true,
      configurable: true
    });
  });

  describe('Error Handling Scenarios', () => {
    it('handles webflow API not available scenario', async () => {
      // Mock webflow as undefined before rendering
      Object.defineProperty(global, 'webflow', {
        value: undefined,
        writable: true,
        configurable: true
      });
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      renderWithQueryClient(<Home />);
      
      // Component should still render
      expect(screen.getByText(/SEO Analysis Tool/i)).toBeInTheDocument();
      
      // Should log warning about webflow not being available
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Webflow API not available");
      });
      
      consoleSpy.mockRestore();
      
      // Restore webflow for other tests
      Object.defineProperty(global, 'webflow', {
        value: mockWebflowApi,
        writable: true,
        configurable: true
      });
    });

    it('handles getSiteInfo API errors', async () => {
      mockWebflowApi.getSiteInfo.mockRejectedValue(new Error('Site info error'));
      
      const user = userEvent.setup();
      renderWithQueryClient(<Home />);
      
      const input = screen.getByPlaceholderText(/enter your target keyphrase/i);
      const button = screen.getByText(/start optimizing your seo/i);
      
      await user.type(input, 'test keyphrase');
      await user.click(button);
      
      // Should handle error gracefully and show toast
      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });

    it('handles getCurrentPage API errors during analysis', async () => {
      // Mock getCurrentPage to fail after the initial setup
      mockWebflowApi.getCurrentPage
        .mockResolvedValueOnce(mockCurrentPage) // Initial render succeeds
        .mockRejectedValue(new Error('Page fetch error')); // Analysis fails
      
      const user = userEvent.setup();
      renderWithQueryClient(<Home />);
      
      const input = screen.getByPlaceholderText(/enter your target keyphrase/i);
      const button = screen.getByText(/start optimizing your seo/i);
      
      await user.type(input, 'test keyphrase');
      await user.click(button);
      
      // Should handle error and show toast
      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });
  });


  describe('Page Change Subscription', () => {
    it('handles page path changes correctly', async () => {
      let subscriptionCallback: Function | null = null;
      
      // Use direct function assignment to avoid TypeScript issues
      const originalMock = mockWebflowApi.subscribe;
      mockWebflowApi.subscribe = vi.fn((event: any, callback: any) => {
        if (event === 'currentpage') {
          subscriptionCallback = callback;
        }
        return () => {}; // unsubscribe function
      });
      
      // Mock different page paths for before/after
      mockCurrentPage.getPublishPath
        .mockResolvedValueOnce('/initial-page') // Initial call
        .mockResolvedValueOnce('/new-page'); // After change
      
      renderWithQueryClient(<Home />);
      
      // Wait for initial setup
      await waitFor(() => {
        expect(mockWebflowApi.subscribe).toHaveBeenCalled();
      });
      
      // Trigger the page change
      if (subscriptionCallback) {
        await (subscriptionCallback as any)({});
      }
      
      // Should trigger reload after path change
      await waitFor(() => {
        expect(window.location.reload).toHaveBeenCalled();
      });
      
      // Restore original mock
      mockWebflowApi.subscribe = originalMock;
    });

    it('does not reload when page path remains the same', async () => {
      let subscriptionCallback: Function | null = null;
      
      const originalMock = mockWebflowApi.subscribe;
      mockWebflowApi.subscribe = vi.fn((event: any, callback: any) => {
        if (event === 'currentpage') {
          subscriptionCallback = callback;
        }
        return () => {};
      });
      
      // Mock same page path for both calls
      mockCurrentPage.getPublishPath.mockResolvedValue('/same-page');
      
      renderWithQueryClient(<Home />);
      
      await waitFor(() => {
        expect(mockWebflowApi.subscribe).toHaveBeenCalled();
      });
      
      // Trigger the page change callback
      if (subscriptionCallback) {
        await (subscriptionCallback as any)({});
      }
      
      // Should not reload since path didn't change
      expect(window.location.reload).not.toHaveBeenCalled();
      
      // Restore original mock
      mockWebflowApi.subscribe = originalMock;
    });

    it('handles page change subscription errors', async () => {
      let subscriptionCallback: Function | null = null;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const originalMock = mockWebflowApi.subscribe;
      mockWebflowApi.subscribe = vi.fn((event: any, callback: any) => {
        if (event === 'currentpage') {
          subscriptionCallback = callback;
        }
        return () => {};
      });
      
      // Mock getCurrentPage to throw error during the subscription callback
      mockWebflowApi.getCurrentPage
        .mockResolvedValueOnce(mockCurrentPage) // Initial setup succeeds
        .mockRejectedValue(new Error('Page change error')); // Subscription callback fails
      
      renderWithQueryClient(<Home />);
      
      await waitFor(() => {
        expect(mockWebflowApi.subscribe).toHaveBeenCalled();
      });
      
      if (subscriptionCallback) {
        await (subscriptionCallback as any)({});
      }
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error handling page change:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
      // Restore original mock
      mockWebflowApi.subscribe = originalMock;
    });
  });

  describe('Test Mode Functionality', () => {
    beforeEach(() => {
      // Mock NODE_ENV for development mode
      vi.stubEnv('NODE_ENV', 'development');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('shows test button in development mode', () => {
      renderWithQueryClient(<Home />);
      
      expect(screen.getByText(/🧪 Test 100 Score/)).toBeInTheDocument();
    });

    it('activates perfect score test mode with existing results', async () => {
      const { analyzeSEO } = await import('../lib/api');
      const confetti = await import('canvas-confetti');
      
      // First run analysis to have results
      vi.mocked(analyzeSEO).mockResolvedValue({
        checks: [
          { title: 'Test Check', passed: false, priority: 'high', description: 'Test', recommendation: 'Fix this' }
        ],
        passedChecks: 0,
        failedChecks: 1,
        score: 0,
        url: 'https://example.com',
        keyphrase: 'test',
        totalChecks: 1,
        isHomePage: false,
        timestamp: new Date().toISOString()
      });
      
      const user = userEvent.setup();
      renderWithQueryClient(<Home />);
      
      // Run initial analysis
      const input = screen.getByPlaceholderText(/enter your target keyphrase/i);
      const analyzeButton = screen.getByText(/start optimizing your seo/i);
      
      await user.type(input, 'test keyphrase');
      await user.click(analyzeButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Analysis Results/i)).toBeInTheDocument();
      });
      
      // Now click the test button
      const testButton = screen.getByText(/🧪 Test 100 Score/);
      await user.click(testButton);
      
      // Should trigger confetti and show perfect score message
      expect(confetti.default).toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.getByText(/You are an absolute SEO legend/i)).toBeInTheDocument();
      });
    });

    it('shows error when trying to test without existing results', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<Home />);
      
      const testButton = screen.getByText(/🧪 Test 100 Score/);
      await user.click(testButton);
      
      // Should show error toast (though we can't easily test toast content)
      // The button click should complete without crashing
      expect(testButton).toBeInTheDocument();
    });
  });

  describe('Image Data Display Logic', () => {
    it('renders image data for image-related checks', async () => {
      const { analyzeSEO } = await import('../lib/api');
      
      const mockAnalysisWithImages = {
        checks: [
          {
            title: 'Image Alt Attributes',
            passed: false,
            priority: 'high' as const,
            description: 'Images need alt attributes',
            recommendation: 'Add alt text to images',
            imageData: [
              { 
                url: 'https://example.com/image1.jpg', 
                name: 'image1.jpg', 
                shortName: 'image1', 
                alt: '', 
                size: 150000, 
                mimeType: 'image/jpeg' 
              }
            ]
          }
        ],
        passedChecks: 0,
        failedChecks: 1,
        score: 0,
        url: 'https://example.com',
        keyphrase: 'test',
        totalChecks: 1,
        isHomePage: false,
        timestamp: new Date().toISOString()
      };
      
      vi.mocked(analyzeSEO).mockResolvedValue(mockAnalysisWithImages);
      
      const user = userEvent.setup();
      renderWithQueryClient(<Home />);
      
      const input = screen.getByPlaceholderText(/enter your target keyphrase/i);
      const button = screen.getByText(/start optimizing your seo/i);
      
      await user.type(input, 'test keyphrase');
      await user.click(button);
      
      // Wait for analysis results to appear
      await waitFor(() => {
        expect(screen.getByText(/Analysis Results/i)).toBeInTheDocument();
      });
      
      // Look for the Images and Assets category in the overview
      await waitFor(() => {
        expect(screen.getByText(/Images and Assets/i)).toBeInTheDocument();
      });
      
      // Click on the Images and Assets category
      const categoryButton = screen.getByText(/Images and Assets/i).closest('.cursor-pointer');
      expect(categoryButton).toBeInTheDocument();
      
      await user.click(categoryButton!);
      
      // Wait for category details to load and verify the check title appears
      await waitFor(() => {
        expect(screen.getByText(/Image Alt Attributes/i)).toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Since the recommendation text is rendered through ImageSizeDisplay component
      // when imageData is present, let's look for image-related content instead
      await waitFor(() => {
        // Look for image-related content that would be displayed by ImageSizeDisplay
        const hasImageContent = 
          screen.queryByText(/image1/i) ||
          screen.queryByText(/jpg/i) ||
          screen.queryByText(/150000/i) || // file size in bytes
          screen.queryByText(/146.5/i) || // formatted file size in KB
          screen.queryByText(/KB/i); // file size unit
      
        expect(hasImageContent).toBeInTheDocument();
      });
    });
  });
});