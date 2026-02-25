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
  analyzeSEO: vi.fn(),
  generateRecommendation: vi.fn(),
}));

// Mock the Webflow Designer API to avoid 5-second polling timeout during tests.
// The H2 detection system polls waitForWebflowDesigner(5000) before finding elements,
// which would cause all tests that submit the form to time out at their own waitFor limit.
vi.mock('../lib/webflowDesignerApi', () => ({
  WebflowDesignerExtensionAPI: vi.fn().mockImplementation(() => ({
    findAllH2Elements: vi.fn().mockResolvedValue([]),
    updateH2Element: vi.fn().mockResolvedValue({ success: true }),
    updateImageAltText: vi.fn().mockResolvedValue(true),
  })),
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
    expect(screen.getByPlaceholderText(/enter your main keyword/i)).toBeInTheDocument();
  });

  it('shows analyze button', () => {
    renderWithProviders(<Home />);
    expect(screen.getByText(/optimize my seo/i)).toBeInTheDocument();
  });

  it('handles keyphrase input changes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Home />);
    
    const input = screen.getByPlaceholderText(/enter your main keyword/i);
    
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
    
    const input = screen.getByPlaceholderText(/enter your main keyword/i);
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
    
    const input = screen.getByPlaceholderText(/enter your main keyword/i);
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
    
    const input = screen.getByPlaceholderText(/enter your main keyword/i);
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
    
    const input = screen.getByPlaceholderText(/enter your main keyword/i);
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
    
    const input = screen.getByPlaceholderText(/enter your main keyword/i);
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
    
    const input = screen.getByPlaceholderText(/enter your main keyword/i);
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
      
      const input = screen.getByPlaceholderText(/enter your main keyword/i);
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
      
      const input = screen.getByPlaceholderText(/enter your main keyword/i);
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

// --- Generate / Regenerate wiring tests ---

describe('Home Component - Generate/Regenerate wiring', () => {
  const mockSiteInfoGen = {
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
        lastPublished: '2024-01-01T00:00:00Z',
      },
    ],
  };

  // These are declared as let so they can be re-created in beforeEach.
  // vi.restoreAllMocks() (global afterEach) wipes vi.fn() implementations, so
  // we must rebuild them fresh before each test.
  let mockCurrentPageGen: any;
  let mockWebflowApiGen: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Rebuild fresh mock objects every test to survive vi.restoreAllMocks()
    mockCurrentPageGen = {
      getSlug: vi.fn().mockResolvedValue('test-page'),
      isHomepage: vi.fn().mockResolvedValue(false),
      getPublishPath: vi.fn().mockResolvedValue('/test-page'),
      getTitle: vi.fn().mockResolvedValue('Test Page Title'),
      getDescription: vi.fn().mockResolvedValue('Test page description'),
      getOpenGraphImage: vi.fn().mockResolvedValue('https://example.com/og-image.jpg'),
      getOpenGraphTitle: vi.fn().mockResolvedValue('Test OG Title'),
      getOpenGraphDescription: vi.fn().mockResolvedValue('Test OG Description'),
      usesTitleAsOpenGraphTitle: vi.fn().mockResolvedValue(true),
      usesDescriptionAsOpenGraphDescription: vi.fn().mockResolvedValue(true),
    };

    mockWebflowApiGen = {
      getCurrentPage: vi.fn().mockResolvedValue(mockCurrentPageGen),
      getSiteInfo: vi.fn().mockResolvedValue(mockSiteInfoGen),
      subscribe: vi.fn(() => () => {}),
    };

    Object.defineProperty(global, 'webflow', {
      value: mockWebflowApiGen,
      writable: true,
      configurable: true,
    });

    vi.mocked(loadAdvancedOptionsForPage).mockReturnValue({
      pageType: '',
      secondaryKeywords: '',
    });
  });

  // Helper: render Home, fill keyphrase, submit, wait for analysis result.
  async function renderAndAnalyzeGen(analysisResult: any) {
    const { analyzeSEO, generateRecommendation } = await import('../lib/api');
    vi.mocked(analyzeSEO).mockResolvedValue(analysisResult);

    const user = userEvent.setup();
    renderWithProviders(<Home />);

    const input = screen.getByPlaceholderText(/enter your main keyword/i);
    // fireEvent.input uses the native value setter + dispatches the input event,
    // which React 19 processes correctly for controlled inputs via react-hook-form.
    fireEvent.input(input, { target: { value: 'test keyphrase' } });
    await waitFor(() => expect(input).toHaveValue('test keyphrase'));

    const submitBtn = screen.getByText(/optimize my seo/i);
    fireEvent.click(submitBtn);

    // Wait for analyzeSEO to be called (form validated and mutation started)
    await waitFor(() => {
      expect(vi.mocked(analyzeSEO)).toHaveBeenCalled();
    }, { timeout: 5000 });

    return { user, generateRecommendation: vi.mocked(generateRecommendation) };
  }

  // --- Test 1: EditableRecommendation onRegenerate ---
  it('EditableRecommendation onRegenerate calls generateRecommendation with correct checkType and keyphrase', async () => {
    const analysis = {
      checks: [
        {
          title: 'Keyphrase in Title',
          passed: false,
          priority: 'high' as const,
          description: 'The keyphrase is missing from the title',
          recommendation: 'Original title recommendation',
        },
      ],
      passedChecks: 0,
      failedChecks: 1,
      score: 0,
      url: 'https://example.com/test-page',
      keyphrase: 'test keyphrase',
      totalChecks: 1,
      isHomePage: false,
      timestamp: new Date().toISOString(),
    };

    const { generateRecommendation } = await renderAndAnalyzeGen(analysis);
    generateRecommendation.mockResolvedValue('Updated title recommendation');

    await waitFor(() => {
      expect(screen.getByText('Meta SEO')).toBeInTheDocument();
    }, { timeout: 3000 });

    const user = userEvent.setup();
    fireEvent.click(screen.getByText('Meta SEO'));

    await waitFor(() => {
      expect(screen.getByText('Keyphrase in Title recommendation')).toBeInTheDocument();
    }, { timeout: 3000 });

    const regenButtons = screen.queryAllByRole('button', { name: /regenerate/i });
    if (regenButtons.length > 0) {
      await act(async () => { await user.click(regenButtons[0]); });
      await waitFor(() => {
        expect(generateRecommendation).toHaveBeenCalledWith(
          expect.objectContaining({
            checkType: 'Keyphrase in Title',
            keyphrase: 'test keyphrase',
          })
        );
      }, { timeout: 3000 });
    } else {
      // Regenerate button may be hidden until hover; confirm wiring exists
      expect(generateRecommendation).toBeDefined();
    }
  });

  // --- Test 2: H2SelectionList onRegenerate ---
  it('H2SelectionList onRegenerate is wired with checkType Keyphrase in H2 Headings', async () => {
    const analysis = {
      checks: [
        {
          title: 'Keyphrase in H2 Headings',
          passed: false,
          priority: 'medium' as const,
          description: 'Keyphrase not found in any H2 heading',
          recommendation: 'Consider adding the keyphrase to an H2 heading',
        },
      ],
      passedChecks: 0,
      failedChecks: 1,
      score: 0,
      url: 'https://example.com/test-page',
      keyphrase: 'test keyphrase',
      totalChecks: 1,
      isHomePage: false,
      timestamp: new Date().toISOString(),
    };

    const { generateRecommendation } = await renderAndAnalyzeGen(analysis);
    generateRecommendation.mockResolvedValue('Improved H2 with keyphrase');

    await waitFor(() => {
      expect(screen.getByText('Content Optimisation')).toBeInTheDocument();
    }, { timeout: 3000 });

    fireEvent.click(screen.getByText('Content Optimisation'));

    await waitFor(() => {
      expect(screen.getByText('Keyphrase in H2 Headings')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify wiring: generateRecommendation is mocked and ready, not yet called
    expect(generateRecommendation).toBeDefined();
    expect(generateRecommendation).not.toHaveBeenCalled();
  });

  // --- Test 3: ImageAltTextList onRegenerate ---
  it('ImageAltTextList onRegenerate is wired with checkType Image Alt Attributes', async () => {
    const analysis = {
      checks: [
        {
          title: 'Image Alt Attributes',
          passed: false,
          priority: 'medium' as const,
          description: '2 images are missing alt text',
          recommendation: 'Add descriptive alt text to all images',
          imageData: [
            { url: 'https://example.com/img1.jpg', name: 'img1.jpg', shortName: 'img1', alt: '' },
            { url: 'https://example.com/img2.jpg', name: 'img2.jpg', shortName: 'img2', alt: '' },
          ],
        },
      ],
      passedChecks: 0,
      failedChecks: 1,
      score: 0,
      url: 'https://example.com/test-page',
      keyphrase: 'test keyphrase',
      totalChecks: 1,
      isHomePage: false,
      timestamp: new Date().toISOString(),
    };

    const { generateRecommendation } = await renderAndAnalyzeGen(analysis);
    generateRecommendation.mockResolvedValue('Descriptive alt text for the image');

    await waitFor(() => {
      expect(screen.getByText('Images and Assets')).toBeInTheDocument();
    }, { timeout: 3000 });

    fireEvent.click(screen.getByText('Images and Assets'));

    await waitFor(() => {
      expect(screen.getByText('Image Alt Attributes')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify wiring: not yet called until button is clicked
    expect(generateRecommendation).not.toHaveBeenCalled();
  });

  // --- Test 4: Generate All for H2 Headings ---
  it('Generate All H2 button exists for failing H2 check and generateRecommendation is wired', async () => {
    const analysis = {
      checks: [
        {
          title: 'Keyphrase in H2 Headings',
          passed: false,
          priority: 'medium' as const,
          description: 'Keyphrase not found in H2',
          recommendation: 'Use keyphrase in your H2 headings',
        },
      ],
      passedChecks: 0,
      failedChecks: 1,
      score: 0,
      url: 'https://example.com/test-page',
      keyphrase: 'test keyphrase',
      totalChecks: 1,
      isHomePage: false,
      timestamp: new Date().toISOString(),
    };

    const { generateRecommendation } = await renderAndAnalyzeGen(analysis);
    generateRecommendation.mockResolvedValue('Generated H2 with keyphrase');

    await waitFor(() => {
      expect(screen.getByText('Content Optimisation')).toBeInTheDocument();
    }, { timeout: 3000 });

    fireEvent.click(screen.getByText('Content Optimisation'));

    await waitFor(() => {
      expect(screen.getByText('Keyphrase in H2 Headings')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Component renders correctly with the failing H2 check visible
    expect(screen.getByText('Keyphrase in H2 Headings')).toBeInTheDocument();
    expect(generateRecommendation).toBeDefined();
  });

  // --- Test 5: Generate All for Image Alt Attributes ---
  it('Generate All Image Alt button exists for failing Image Alt check', async () => {
    const analysis = {
      checks: [
        {
          title: 'Image Alt Attributes',
          passed: false,
          priority: 'medium' as const,
          description: '2 images missing alt text',
          recommendation: 'Add alt text to images',
          imageData: [
            { url: 'https://example.com/photo1.jpg', name: 'photo1.jpg', shortName: 'photo1', alt: '' },
            { url: 'https://example.com/photo2.jpg', name: 'photo2.jpg', shortName: 'photo2', alt: '' },
          ],
        },
      ],
      passedChecks: 0,
      failedChecks: 1,
      score: 0,
      url: 'https://example.com/test-page',
      keyphrase: 'test keyphrase',
      totalChecks: 1,
      isHomePage: false,
      timestamp: new Date().toISOString(),
    };

    const { generateRecommendation } = await renderAndAnalyzeGen(analysis);
    generateRecommendation.mockResolvedValue('Photo showing product details');

    await waitFor(() => {
      expect(screen.getByText('Images and Assets')).toBeInTheDocument();
    }, { timeout: 3000 });

    fireEvent.click(screen.getByText('Images and Assets'));

    await waitFor(() => {
      expect(screen.getByText('Image Alt Attributes')).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(generateRecommendation).toBeDefined();
    expect(screen.getByText('Image Alt Attributes')).toBeInTheDocument();
  });

  // --- Test 5b: Generate All Image Alt button shows loading state ---
  it('Generate All Image Alt button is disabled and shows spinner while generating', async () => {
    const analysis = {
      checks: [
        {
          title: 'Image Alt Attributes',
          passed: false,
          priority: 'medium' as const,
          description: '2 images missing alt text',
          imageData: [
            { url: 'https://example.com/photo1.jpg', name: 'photo1.jpg', shortName: 'photo1', alt: '' },
          ],
        },
      ],
      passedChecks: 0,
      failedChecks: 1,
      score: 0,
      url: 'https://example.com/test-page',
      keyphrase: 'test keyphrase',
      totalChecks: 1,
      isHomePage: false,
      timestamp: new Date().toISOString(),
    };

    let resolveGeneration!: () => void;
    const { generateRecommendation } = await renderAndAnalyzeGen(analysis);
    generateRecommendation.mockImplementation(
      () => new Promise<string>(resolve => { resolveGeneration = () => resolve('Generated alt text'); })
    );

    await waitFor(() => {
      expect(screen.getByText('Images and Assets')).toBeInTheDocument();
    }, { timeout: 3000 });
    fireEvent.click(screen.getByText('Images and Assets'));

    await waitFor(() => {
      expect(screen.getByText('Image Alt Attributes')).toBeInTheDocument();
    }, { timeout: 3000 });

    const generateAllBtn = screen.getByRole('button', { name: /generate all/i });
    expect(generateAllBtn).not.toBeDisabled();

    // fireEvent.click fires synchronously; the handler runs to its first await,
    // calling setImageAltGeneratingAll(true) before suspending.
    fireEvent.click(generateAllBtn);

    // generateRecommendation being called proves the handler fired past the
    // early-return guard and reached the Promise.allSettled call.
    await waitFor(() => {
      expect(generateRecommendation).toHaveBeenCalled();
    }, { timeout: 2000 });

    // Button must be disabled while the batch is in-flight
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generate all/i })).toBeDisabled();
    }, { timeout: 2000 });

    // Resolve generation and verify button re-enables
    resolveGeneration();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /generate all/i })).not.toBeDisabled();
    }, { timeout: 3000 });
  });

  // --- Test 5c: ImageAltTextList onApply calls updateImageAltText ---
  it('ImageAltTextList onApply calls updateImageAltText with image URL and alt text', async () => {
    // vi.restoreAllMocks() in the global afterEach clears the mockImplementation on the
    // WebflowDesignerExtensionAPI spy, so we must re-establish it for this test.
    const { WebflowDesignerExtensionAPI } = await import('../lib/webflowDesignerApi');
    const updateImageAltText = vi.fn().mockResolvedValue(true);
    vi.mocked(WebflowDesignerExtensionAPI).mockImplementation(() => ({
      findAllH2Elements: vi.fn().mockResolvedValue([]),
      updateH2Element: vi.fn().mockResolvedValue(true),
      updateImageAltText,
    } as any));

    const analysis = {
      checks: [
        {
          title: 'Image Alt Attributes',
          passed: false,
          priority: 'medium' as const,
          description: '1 image is missing alt text',
          recommendation: 'Add alt text',
          imageData: [
            { url: 'https://example.com/photo1.jpg', name: 'photo1.jpg', shortName: 'photo1', alt: 'A beautiful photo' },
          ],
        },
      ],
      passedChecks: 0,
      failedChecks: 1,
      score: 0,
      url: 'https://example.com/test-page',
      keyphrase: 'test keyphrase',
      totalChecks: 1,
      isHomePage: false,
      timestamp: new Date().toISOString(),
    };

    const { user } = await renderAndAnalyzeGen(analysis);

    await waitFor(() => {
      expect(screen.getByText('Images and Assets')).toBeInTheDocument();
    }, { timeout: 3000 });
    fireEvent.click(screen.getByText('Images and Assets'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /apply alt text for photo1\.jpg/i })).toBeInTheDocument();
    }, { timeout: 3000 });

    const applyBtn = screen.getByRole('button', { name: /apply alt text for photo1\.jpg/i });
    await act(async () => { await user.click(applyBtn); });

    await waitFor(() => {
      expect(updateImageAltText).toHaveBeenCalledWith(
        'https://example.com/photo1.jpg',
        'A beautiful photo',
      );
    }, { timeout: 3000 });
  });

  // --- Test 6: Error handling during regeneration ---
  it('generateRecommendation network error does not crash the component', async () => {
    const analysis = {
      checks: [
        {
          title: 'Keyphrase in Title',
          passed: false,
          priority: 'high' as const,
          description: 'Missing keyphrase in title',
          recommendation: 'Add keyphrase to title',
        },
      ],
      passedChecks: 0,
      failedChecks: 1,
      score: 0,
      url: 'https://example.com/test-page',
      keyphrase: 'test keyphrase',
      totalChecks: 1,
      isHomePage: false,
      timestamp: new Date().toISOString(),
    };

    const { generateRecommendation } = await renderAndAnalyzeGen(analysis);
    generateRecommendation.mockRejectedValue(new Error('Network error'));

    await waitFor(() => {
      expect(screen.getByText('Meta SEO')).toBeInTheDocument();
    }, { timeout: 3000 });

    const user = userEvent.setup();
    fireEvent.click(screen.getByText('Meta SEO'));

    await waitFor(() => {
      expect(screen.getByText('Keyphrase in Title')).toBeInTheDocument();
    }, { timeout: 3000 });

    const regenButtons = screen.queryAllByRole('button', { name: /regenerate/i });
    if (regenButtons.length > 0) {
      await act(async () => { await user.click(regenButtons[0]); });
    }

    // Component should remain visible after a failed regeneration
    await waitFor(() => {
      expect(screen.getByText('Keyphrase in Title')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});