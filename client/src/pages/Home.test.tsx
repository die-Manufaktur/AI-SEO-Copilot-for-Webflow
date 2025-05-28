import { vi, describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQueryClient } from '../test-utils';
import Home from './Home';

// Mock ResizeObserver for ScrollArea component
global.ResizeObserver = vi.fn().mockImplementation(() => ({
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
      recommendation: null,
      category: 'Meta SEO'
    }
  ],
  passedChecks: 1,
  failedChecks: 0,
  score: 100,
  url: 'https://example.com/test-page',
  keyphrase: 'test keyphrase',
  totalChecks: 1,
  analysisDate: new Date().toISOString(),
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
          recommendation: null,
          category: 'Meta SEO'
        },
        { 
          title: 'Keyphrase in Meta Description', 
          passed: false, 
          priority: 'high', 
          description: 'The keyphrase should appear in the meta description',
          recommendation: 'Add your keyphrase to the meta description',
          category: 'Meta SEO'
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
          recommendation: 'Add keyphrase to URL slug',
          category: 'Meta SEO'
        }
      ],
      passedChecks: 0,
      failedChecks: 1,
      totalChecks: 1,
      score: 0,
      url: 'https://example.com/'
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
          recommendation: null,
          category: 'Meta SEO'
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
          recommendation: 'Add your keyphrase to the meta description',
          category: 'Meta SEO'
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
          recommendation: null,
          category: 'Meta SEO'
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
          recommendation: null,
          category: 'Meta SEO'
        },
        { 
          title: 'Test Check 2', 
          passed: false, 
          priority: 'medium', 
          description: 'Failed check',
          recommendation: 'Fix this issue',
          category: 'Content Optimisation'
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
          recommendation: null,
          category: 'Meta SEO'
        },
        { 
          title: 'Content Length', 
          passed: false, 
          priority: 'medium', 
          description: 'Content could be longer',
          recommendation: 'Add more content to reach optimal length',
          category: 'Content Optimisation'
        },
        { 
          title: 'Internal Links', 
          passed: true, 
          priority: 'low', 
          description: 'Good internal linking',
          recommendation: null,
          category: 'Links'
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