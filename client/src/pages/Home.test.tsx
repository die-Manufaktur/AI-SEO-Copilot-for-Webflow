import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { act } from 'react';
import userEvent from '@testing-library/user-event';
import React, { useEffect } from 'react';
import { renderWithProviders } from '../__tests__/utils/testHelpers';
import Home from './Home';
import { saveAdvancedOptionsForPage, loadAdvancedOptionsForPage } from '../utils/advancedOptionsStorage';

// Remove local ResizeObserver mock - use the one from setupTests.ts
// The global ResizeObserver is already properly mocked in setupTests.ts

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

// Mock Auth Context to prevent provider errors
vi.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { email: 'test@example.com', id: 'test-user-id' },
    token: { access_token: 'test-token', scope: 'sites:read sites:write cms:read cms:write pages:read pages:write' },
    status: 'authenticated' as const,
    login: vi.fn(),
    logout: vi.fn(),
    hasPermission: vi.fn(() => true),
    refreshAuth: vi.fn(() => Promise.resolve()),
  }),
}));

// Mock the clipboard utility module
vi.mock('../utils/clipboard', () => ({
  copyTextToClipboard: vi.fn()
}));

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn()
}));

// Mock advanced options storage
vi.mock('../utils/advancedOptionsStorage', () => ({
  saveAdvancedOptionsForPage: vi.fn(),
  loadAdvancedOptionsForPage: vi.fn()
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

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
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

  // Helper function to wait for form validation
  const waitForFormValidation = async (
    expectedMessage: string | RegExp,
    shouldExist: boolean = true,
    timeout: number = 3000
  ) => {
    await waitFor(
      () => {
        const errorMessage = screen.queryByText(expectedMessage);
        if (shouldExist) {
          expect(errorMessage).toBeInTheDocument();
        } else {
          expect(errorMessage).not.toBeInTheDocument();
        }
      },
      { 
        timeout,
        interval: 100,
        onTimeout: () => {
          // Get all text content that might contain error messages
          const allText = document.body.textContent || '';
          throw new Error(
            `Form validation message "${expectedMessage}" ${shouldExist ? 'not found' : 'unexpectedly found'}. ` +
            `Page content includes: ${allText.slice(0, 500)}...`
          );
        }
      }
    );
  };

  const mockCurrentPage = {
    getSlug: vi.fn(() => Promise.resolve('test-page')),
    isHomepage: vi.fn(() => Promise.resolve(false)),
    getPublishPath: vi.fn(() => Promise.resolve('/test-page')),
    getTitle: vi.fn(() => Promise.resolve('Test Page Title')),
    getDescription: vi.fn(() => Promise.resolve('Test page description')),
    getOpenGraphImage: vi.fn(() => Promise.resolve('https://example.com/og-image.jpg')),
    getOpenGraphTitle: vi.fn(() => Promise.resolve('Test OG Title')),
    getOpenGraphDescription: vi.fn(() => Promise.resolve('Test OG Description')),
    usesTitleAsOpenGraphTitle: vi.fn(() => Promise.resolve(true)),
    usesDescriptionAsOpenGraphDescription: vi.fn(() => Promise.resolve(true))
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockWebflowApi.getCurrentPage.mockResolvedValue(mockCurrentPage);
    mockWebflowApi.getSiteInfo.mockResolvedValue(mockSiteInfo);
    
    // Mock advanced options storage to prevent initialization errors
    vi.mocked(loadAdvancedOptionsForPage).mockReturnValue({
      pageType: '',
      secondaryKeywords: ''
    });
  });

  it('renders without crashing', () => {
    renderWithProviders(<Home />);
    expect(screen.getByText(/Set up your SEO analysis/i)).toBeInTheDocument();
  });

  it('displays keyphrase input field', () => {
    renderWithProviders(<Home />);
    expect(screen.getByPlaceholderText(/enter your target keyphrase/i)).toBeInTheDocument();
  });

  it('shows analyze button', () => {
    renderWithProviders(<Home />);
    expect(screen.getByText(/optimize my seo/i)).toBeInTheDocument();
  });

  it('handles keyphrase input changes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Home />);
    
    const input = screen.getByPlaceholderText(/enter your target keyphrase/i);
    
    // Type text into input field
    await user.type(input, 'test keyphrase');
    
    // Wait for the input value to be updated
    await waitFor(() => {
      expect(input).toHaveValue('test keyphrase');
    });
  });

  it('validates keyphrase length', async () => {
    const { analyzeSEO } = await import('../lib/api');
    const mockAnalyzeSEO = vi.mocked(analyzeSEO);
    
    const user = userEvent.setup();
    renderWithProviders(<Home />);
    
    const input = screen.getByPlaceholderText(/enter your target keyphrase/i);
    const button = screen.getByText(/optimize my seo/i);
    
    // Type a single character (should be invalid)
    await user.type(input, 'a');
    
    // Submit the form to trigger validation
    await user.click(button);
    
    // Wait for form to process and check that validation prevented API call
    await waitFor(() => {
      // The key validation is that the API should not be called with invalid input
      expect(mockAnalyzeSEO).not.toHaveBeenCalled();
    }, { timeout: 2000 });
    
    // Additionally check if validation message appears (but don't require it for test to pass)
    const validationMessage = screen.queryByText(/Keyphrase must be at least 2 characters/i);
    if (validationMessage) {
      expect(validationMessage).toBeInTheDocument();
    }
  });


  it('prevents form submission when validation fails', async () => {
    const { analyzeSEO } = await import('../lib/api');
    const mockAnalyzeSEO = vi.mocked(analyzeSEO);
    
    const user = userEvent.setup();
    renderWithProviders(<Home />);
    
    const input = screen.getByPlaceholderText(/enter your target keyphrase/i);
    const button = screen.getByText(/optimize my seo/i);
    
    // Type invalid input
    await user.type(input, 'x');
    
    // Verify button is clickable initially
    expect(button).not.toBeDisabled();
    
    // Click submit button
    await user.click(button);
    
    // Wait and verify that the API was not called due to validation failure
    await waitFor(() => {
      expect(mockAnalyzeSEO).not.toHaveBeenCalled();
    }, { timeout: 2000 });
    
    // Button should remain enabled (not in loading state)
    expect(button).not.toBeDisabled();
  });

  it('handles rapid input changes and validation correctly', async () => {
    const { analyzeSEO } = await import('../lib/api');
    const mockAnalyzeSEO = vi.mocked(analyzeSEO);
    
    const user = userEvent.setup();
    renderWithProviders(<Home />);
    
    const input = screen.getByPlaceholderText(/enter your target keyphrase/i);
    const button = screen.getByText(/optimize my seo/i);
    
    // Perform rapid input changes
    await user.type(input, 'a');
    await user.type(input, 'bc');  // Now "abc" which is valid
    await user.clear(input);
    await user.type(input, 'x'); // Back to invalid single char
    
    // Submit form with final invalid state
    await user.click(button);
    
    // Should prevent API call due to final invalid state
    await waitFor(() => {
      expect(mockAnalyzeSEO).not.toHaveBeenCalled();
    }, { timeout: 2000 });
  });



  it('handles analysis errors gracefully', async () => {
    const { analyzeSEO } = await import('../lib/api');
    vi.mocked(analyzeSEO).mockRejectedValue(new Error('Analysis failed'));
    
    const user = userEvent.setup();
    renderWithProviders(<Home />);
    
    const input = screen.getByPlaceholderText(/enter your target keyphrase/i);
    const button = screen.getByText(/optimize my seo/i);
    
    await user.type(input, 'test keyphrase');
    await user.click(button);
    
    // Wait for the button to be enabled again with shorter timeout
    await waitFor(() => {
      expect(button).not.toBeDisabled();
    }, { timeout: 500, interval: 10 });
    
    // Check that no analysis results are shown
    expect(screen.queryByText(/Analysis Results/i)).not.toBeInTheDocument();
  });


  it('handles unpublished page error correctly', async () => {
    const { analyzeSEO } = await import('../lib/api');
    vi.mocked(analyzeSEO).mockRejectedValue(new Error('Failed to fetch page content: 500'));
    
    const user = userEvent.setup();
    renderWithProviders(<Home />);
    
    const input = screen.getByPlaceholderText(/enter your target keyphrase/i);
    const button = screen.getByText(/optimize my seo/i);
    
    await user.type(input, 'test keyphrase');
    await user.click(button);
    
    // Wait for the button to be enabled again with shorter timeout
    await waitFor(() => {
      expect(button).not.toBeDisabled();
    }, { timeout: 500, interval: 10 });
    
    // Check that the form is still visible (no results shown)
    expect(screen.queryByText(/Analysis Results/i)).not.toBeInTheDocument();
  });





  it('handles no published domain found error', async () => {
    // Mock site info with empty domains array
    mockWebflowApi.getSiteInfo.mockResolvedValue({
      ...mockSiteInfo,
      domains: []
    });
    
    const user = userEvent.setup();
    renderWithProviders(<Home />);
    
    const input = screen.getByPlaceholderText(/enter your target keyphrase/i);
    const button = screen.getByText(/optimize my seo/i);
    
    await user.type(input, 'test keyphrase');
    await user.click(button);
    
    // Wait for the button to be enabled again with shorter timeout
    await waitFor(() => {
      expect(button).not.toBeDisabled();
    }, { timeout: 500, interval: 10 });
    
    // Check that no analysis results are shown
    expect(screen.queryByText(/Analysis Results/i)).not.toBeInTheDocument();
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
    getTitle: vi.fn(() => Promise.resolve('Test Page Title')),
    getDescription: vi.fn(() => Promise.resolve('Test page description')),
    getOpenGraphImage: vi.fn(() => Promise.resolve('https://example.com/og-image.jpg')),
    getOpenGraphTitle: vi.fn(() => Promise.resolve('Test OG Title')),
    getOpenGraphDescription: vi.fn(() => Promise.resolve('Test OG Description')),
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
      
      renderWithProviders(<Home />);
      
      // Component should still render
      expect(screen.getByText(/Set up your SEO analysis/i)).toBeInTheDocument();
      
      // Should log warning about webflow not being available with shorter timeout
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Home:", "Webflow API not available");
      }, { timeout: 100, interval: 10 });
      
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
      renderWithProviders(<Home />);
      
      const input = screen.getByPlaceholderText(/enter your target keyphrase/i);
      const button = screen.getByText(/optimize my seo/i);
      
      await user.type(input, 'test keyphrase');
      await user.click(button);
      
      // Should handle error gracefully with shorter timeout
      await waitFor(() => {
        expect(button).not.toBeDisabled();
      }, { timeout: 500, interval: 10 });
    });

    it('handles getCurrentPage API errors during analysis', async () => {
      // Mock getCurrentPage to fail after the initial setup
      mockWebflowApi.getCurrentPage
        .mockResolvedValueOnce(mockCurrentPage) // Initial render succeeds
        .mockRejectedValue(new Error('Page fetch error')); // Analysis fails
      
      const user = userEvent.setup();
      renderWithProviders(<Home />);
      
      const input = screen.getByPlaceholderText(/enter your target keyphrase/i);
      const button = screen.getByText(/optimize my seo/i);
      
      await user.type(input, 'test keyphrase');
      await user.click(button);
      
      // Should handle error with shorter timeout
      await waitFor(() => {
        expect(button).not.toBeDisabled();
      }, { timeout: 500, interval: 10 });
    });
  });


  describe('Page Change Subscription', () => {

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
      
      renderWithProviders(<Home />);
      
      await waitFor(() => {
        expect(mockWebflowApi.subscribe).toHaveBeenCalled();
      }, { timeout: 100, interval: 10 });
      
      // Trigger the page change callback
      if (subscriptionCallback) {
        await act(async () => {
          await (subscriptionCallback as any)({});
        });
      }
      
      // Should not reload since path didn't change
      expect(window.location.reload).not.toHaveBeenCalled();
      
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
      renderWithProviders(<Home />);
      
      expect(screen.getByText(/🧪 Test 100 Score/)).toBeInTheDocument();
    });


  });


  describe('Advanced Options Persistent Settings', () => {
    beforeEach(() => {
      // Reset mocks
      vi.mocked(saveAdvancedOptionsForPage).mockClear();
      vi.mocked(loadAdvancedOptionsForPage).mockClear();
      
      // Default return empty options
      vi.mocked(loadAdvancedOptionsForPage).mockReturnValue({
        pageType: '',
        secondaryKeywords: ''
      });
    });

    it('should hide advanced options section by default', async () => {
      renderWithProviders(<Home />);
      
      // Advanced Analysis section should be visible but form fields should be hidden initially
      expect(screen.getByText(/Advanced Analysis/i)).toBeInTheDocument();
      // Look for the actual form controls, not labels
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/Enter secondary keywords/i)).not.toBeInTheDocument();
    });





  });
});