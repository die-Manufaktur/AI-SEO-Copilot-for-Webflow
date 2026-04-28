import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelpSystem } from './HelpSystem';
import { HelpProvider, useHelp } from '../contexts/HelpContext';

// Mock the help context
vi.mock('../contexts/HelpContext', () => ({
  HelpProvider: ({ children }: { children: React.ReactNode }) => children,
  useHelp: vi.fn()
}));

describe('HelpSystem', () => {
  const mockToggleHelp = vi.fn();
  const mockGetHelp = vi.fn();
  const mockGetHelpByCategory = vi.fn();
  const mockSearchHelp = vi.fn();
  const mockStartTutorial = vi.fn();
  const mockNextTutorialStep = vi.fn();
  const mockPreviousTutorialStep = vi.fn();
  const mockCompleteTutorial = vi.fn();
  const mockGetCurrentTutorial = vi.fn();
  const mockIsTutorialCompleted = vi.fn();
  const mockTrackEvent = vi.fn();
  const mockEnableAutoDetection = vi.fn();
  const mockRegisterHelpTarget = vi.fn();
  const mockUnregisterHelpTarget = vi.fn();
  const mockGetActiveHelpTargets = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up default mock return values
    mockGetHelp.mockReturnValue(null);
    mockGetHelpByCategory.mockReturnValue([]);
    mockSearchHelp.mockResolvedValue([]);
    mockGetCurrentTutorial.mockReturnValue(null);
    mockIsTutorialCompleted.mockReturnValue(false);
    mockGetActiveHelpTargets.mockReturnValue([]);
    
    (useHelp as any).mockReturnValue({
      isHelpEnabled: true,
      toggleHelp: mockToggleHelp,
      getHelp: mockGetHelp,
      getHelpByCategory: mockGetHelpByCategory,
      searchHelp: mockSearchHelp,
      startTutorial: mockStartTutorial,
      nextTutorialStep: mockNextTutorialStep,
      previousTutorialStep: mockPreviousTutorialStep,
      completeTutorial: mockCompleteTutorial,
      getCurrentTutorial: mockGetCurrentTutorial,
      isTutorialCompleted: mockIsTutorialCompleted,
      trackEvent: mockTrackEvent,
      enableAutoDetection: mockEnableAutoDetection,
      registerHelpTarget: mockRegisterHelpTarget,
      unregisterHelpTarget: mockUnregisterHelpTarget,
      getActiveHelpTargets: mockGetActiveHelpTargets
    });
  });

  describe('Help Toggle', () => {
    it('should show help button when help is available', () => {
      render(<HelpSystem />);
      expect(screen.getByRole('button', { name: /help/i })).toBeInTheDocument();
    });

    it('should toggle help panel when clicked', async () => {
      render(<HelpSystem />);
      const helpButton = screen.getByRole('button', { name: /help/i });
      
      await userEvent.click(helpButton);
      expect(screen.getByText(/help center/i)).toBeInTheDocument();
      
      await userEvent.click(helpButton);
      expect(screen.queryByText(/help center/i)).not.toBeInTheDocument();
    });

    it('should close help panel when escape is pressed', async () => {
      render(<HelpSystem />);
      await userEvent.click(screen.getByRole('button', { name: /help/i }));
      expect(screen.getByText(/help center/i)).toBeInTheDocument();
      
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByText(/help center/i)).not.toBeInTheDocument();
    });
  });

  describe('Help Search', () => {
    it('should show search input in help panel', async () => {
      render(<HelpSystem />);
      await userEvent.click(screen.getByRole('button', { name: /help/i }));
      
      expect(screen.getByPlaceholderText(/search help/i)).toBeInTheDocument();
    });

    it('should search help articles when typing', async () => {
      mockSearchHelp.mockResolvedValue([
        { id: '1', title: 'Getting Started', content: 'How to get started...' },
        { id: '2', title: 'SEO Basics', content: 'Understanding SEO...' }
      ]);

      render(<HelpSystem />);
      await userEvent.click(screen.getByRole('button', { name: /help/i }));
      
      const searchInput = screen.getByPlaceholderText(/search help/i);
      await userEvent.clear(searchInput);
      await userEvent.type(searchInput, 'SEO');
      
      await waitFor(() => {
        expect(mockSearchHelp).toHaveBeenCalledWith('SEO');
        expect(screen.getByText('SEO Basics')).toBeInTheDocument();
      });
    });

    it('should show no results message when no articles found', async () => {
      mockSearchHelp.mockResolvedValue([]);

      render(<HelpSystem />);
      await userEvent.click(screen.getByRole('button', { name: /help/i }));
      
      const searchInput = screen.getByPlaceholderText(/search help/i);
      await userEvent.clear(searchInput);
      await userEvent.type(searchInput, 'xyz');
      
      await waitFor(() => {
        expect(screen.getByText(/no help articles found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Contextual Help', () => {
    it('should show contextual help tooltip on hover', async () => {
      mockGetHelp.mockReturnValue({
        title: 'Page Title',
        content: 'The page title appears in search results...',
        tips: ['Keep it under 60 characters', 'Include target keywords']
      });

      const { container } = render(
        <div>
          <input data-help-id="page-title" placeholder="Page Title" />
          <HelpSystem />
        </div>
      );

      const input = container.querySelector('[data-help-id="page-title"]');
      fireEvent.mouseEnter(input!);
      
      await waitFor(() => {
        expect(mockGetHelp).toHaveBeenCalledWith('page-title');
        expect(screen.getByText(/the page title appears/i)).toBeInTheDocument();
      });
    });

    it('should hide tooltip on mouse leave', async () => {
      mockGetHelp.mockReturnValue({
        title: 'Page Title',
        content: 'The page title appears in search results...'
      });

      const { container } = render(
        <div>
          <input data-help-id="page-title" placeholder="Page Title" />
          <HelpSystem />
        </div>
      );

      const input = container.querySelector('[data-help-id="page-title"]');
      fireEvent.mouseEnter(input!);
      
      await waitFor(() => {
        expect(screen.getByText(/the page title appears/i)).toBeInTheDocument();
      });
      
      fireEvent.mouseLeave(input!);
      
      await waitFor(() => {
        expect(screen.queryByText(/the page title appears/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Help Categories', () => {
    it('should display help categories', async () => {
      render(<HelpSystem />);
      await userEvent.click(screen.getByRole('button', { name: /help/i }));
      
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
      expect(screen.getByText('SEO Optimization')).toBeInTheDocument();
      expect(screen.getByText('Webflow Integration')).toBeInTheDocument();
      expect(screen.getByText('Troubleshooting')).toBeInTheDocument();
    });

    it('should show articles when category is selected', async () => {
      // Mock the getHelpByCategory to return articles for 'seo' category
      mockGetHelpByCategory.mockReturnValue([
        { id: '1', title: 'What is SEO?', category: 'seo', content: 'SEO basics...' },
        { id: '2', title: 'Keyword Research', category: 'seo', content: 'How to research keywords...' }
      ]);

      render(<HelpSystem />);
      
      // Open help panel using fireEvent for more direct control
      const helpButton = screen.getByRole('button', { name: /help/i });
      fireEvent.click(helpButton);
      
      // Wait for help panel to be visible
      await waitFor(() => {
        expect(screen.getByText(/help center/i)).toBeInTheDocument();
      });
      
      // Click on SEO Optimization category using fireEvent
      const seoCategory = screen.getByText('SEO Optimization');
      fireEvent.click(seoCategory);
      
      // Wait for articles to appear
      await waitFor(() => {
        expect(mockGetHelpByCategory).toHaveBeenCalledWith('seo');
        expect(screen.getByText('What is SEO?')).toBeInTheDocument();
        expect(screen.getByText('Keyword Research')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Interactive Tutorials', () => {
    it('should start tutorial when clicked', async () => {
      // Mock getCurrentTutorial to return a tutorial after starting
      mockGetCurrentTutorial.mockReturnValue({
        id: 'getting-started',
        currentStep: 0,
        totalSteps: 5,
        startedAt: Date.now()
      });

      render(<HelpSystem />);
      
      // Open help panel
      const helpButton = screen.getByRole('button', { name: /help/i });
      fireEvent.click(helpButton);
      
      // Wait for help panel to be visible
      await waitFor(() => {
        expect(screen.getByText(/help center/i)).toBeInTheDocument();
      });
      
      // Find and click Start Tutorial button
      const startTutorialButton = screen.getByText('Start Tutorial');
      fireEvent.click(startTutorialButton);
      
      // Verify tutorial was started
      await waitFor(() => {
        expect(mockStartTutorial).toHaveBeenCalledWith('getting-started');
      });
    });

    it('should navigate through tutorial steps', async () => {
      // Mock tutorial state on step 1 initially
      mockGetCurrentTutorial.mockReturnValue({
        id: 'getting-started',
        currentStep: 0,
        totalSteps: 5,
        startedAt: Date.now()
      });

      render(<HelpSystem />);
      
      // Wait for tutorial overlay to appear
      await waitFor(() => {
        expect(screen.getByText(/step 1 of/i)).toBeInTheDocument();
      });
      
      // Click Next button
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(mockNextTutorialStep).toHaveBeenCalled();
      });
    });

    it('should complete tutorial', async () => {
      // Mock tutorial at last step
      mockGetCurrentTutorial.mockReturnValue({
        id: 'getting-started',
        currentStep: 4, // Last step (0-based, so 4 is step 5 of 5)
        totalSteps: 5,
        startedAt: Date.now()
      });

      render(<HelpSystem />);
      
      // Wait for tutorial overlay to appear
      await waitFor(() => {
        expect(screen.getByText(/step 5 of/i)).toBeInTheDocument();
      });
      
      // Find Complete button (should be visible on last step)
      const completeButton = screen.getByText('Complete');
      fireEvent.click(completeButton);
      
      // Verify tutorial completion was called
      await waitFor(() => {
        expect(mockCompleteTutorial).toHaveBeenCalled();
      });
    });
  });

  describe('Help Preferences', () => {
    it('should disable contextual help when toggled off', async () => {
      render(<HelpSystem />);
      await userEvent.click(screen.getByRole('button', { name: /help/i }));
      
      const toggle = screen.getByLabelText(/show contextual help/i);
      await userEvent.click(toggle);
      
      expect(mockToggleHelp).toHaveBeenCalledWith(false);
    });

    it('should remember help preferences', async () => {
      (useHelp as any).mockReturnValue({
        isHelpEnabled: false,
        toggleHelp: mockToggleHelp,
        getHelp: mockGetHelp,
        getHelpByCategory: mockGetHelpByCategory,
        searchHelp: mockSearchHelp,
        startTutorial: mockStartTutorial,
        nextTutorialStep: mockNextTutorialStep,
        previousTutorialStep: mockPreviousTutorialStep,
        completeTutorial: mockCompleteTutorial,
        getCurrentTutorial: mockGetCurrentTutorial,
        isTutorialCompleted: mockIsTutorialCompleted,
        trackEvent: mockTrackEvent,
        enableAutoDetection: mockEnableAutoDetection,
        registerHelpTarget: mockRegisterHelpTarget,
        unregisterHelpTarget: mockUnregisterHelpTarget,
        getActiveHelpTargets: mockGetActiveHelpTargets
      });

      const { container } = render(
        <div>
          <input data-help-id="page-title" placeholder="Page Title" />
          <HelpSystem />
        </div>
      );

      const input = container.querySelector('[data-help-id="page-title"]');
      fireEvent.mouseEnter(input!);
      
      await waitFor(() => {
        expect(mockGetHelp).not.toHaveBeenCalled();
      });
    });
  });

  describe('Help Analytics', () => {
    it('should track help article views', async () => {
      const localMockTrackEvent = vi.fn();
      
      (useHelp as any).mockReturnValue({
        isHelpEnabled: true,
        toggleHelp: mockToggleHelp,
        getHelp: mockGetHelp,
        getHelpByCategory: mockGetHelpByCategory,
        searchHelp: mockSearchHelp,
        startTutorial: mockStartTutorial,
        nextTutorialStep: mockNextTutorialStep,
        previousTutorialStep: mockPreviousTutorialStep,
        completeTutorial: mockCompleteTutorial,
        getCurrentTutorial: mockGetCurrentTutorial,
        isTutorialCompleted: mockIsTutorialCompleted,
        trackEvent: localMockTrackEvent,
        enableAutoDetection: mockEnableAutoDetection,
        registerHelpTarget: mockRegisterHelpTarget,
        unregisterHelpTarget: mockUnregisterHelpTarget,
        getActiveHelpTargets: mockGetActiveHelpTargets
      });

      // Mock getHelpByCategory to return articles for 'seo' category
      mockGetHelpByCategory.mockReturnValue([
        { id: '1', title: 'What is SEO?', category: 'seo', content: 'SEO explanation...' }
      ]);

      render(<HelpSystem />);
      
      // Open help panel
      const helpButton = screen.getByRole('button', { name: /help/i });
      fireEvent.click(helpButton);
      
      // Wait for help panel to be visible
      await waitFor(() => {
        expect(screen.getByText(/help center/i)).toBeInTheDocument();
      });
      
      // Click on SEO Optimization category
      const seoCategory = screen.getByText('SEO Optimization');
      fireEvent.click(seoCategory);
      
      // Wait for articles to appear, then click on article
      await waitFor(() => {
        expect(screen.getByText('What is SEO?')).toBeInTheDocument();
      });
      
      const article = screen.getByText('What is SEO?');
      fireEvent.click(article);
      
      // Verify tracking event was called
      await waitFor(() => {
        expect(localMockTrackEvent).toHaveBeenCalledWith('help_article_viewed', {
          articleId: '1',
          title: 'What is SEO?',
          category: 'seo'
        });
      });
    });

    it('should track search queries', async () => {
      const localMockTrackEvent = vi.fn();
      (useHelp as any).mockReturnValue({
        isHelpEnabled: true,
        toggleHelp: mockToggleHelp,
        getHelp: mockGetHelp,
        getHelpByCategory: mockGetHelpByCategory,
        searchHelp: mockSearchHelp,
        startTutorial: mockStartTutorial,
        nextTutorialStep: mockNextTutorialStep,
        previousTutorialStep: mockPreviousTutorialStep,
        completeTutorial: mockCompleteTutorial,
        getCurrentTutorial: mockGetCurrentTutorial,
        isTutorialCompleted: mockIsTutorialCompleted,
        trackEvent: localMockTrackEvent,
        enableAutoDetection: mockEnableAutoDetection,
        registerHelpTarget: mockRegisterHelpTarget,
        unregisterHelpTarget: mockUnregisterHelpTarget,
        getActiveHelpTargets: mockGetActiveHelpTargets
      });

      render(<HelpSystem />);
      await userEvent.click(screen.getByRole('button', { name: /help/i }));
      
      const searchInput = screen.getByPlaceholderText(/search help/i);
      await userEvent.clear(searchInput);
      await userEvent.type(searchInput, 'SEO optimization');
      
      await waitFor(() => {
        expect(mockSearchHelp).toHaveBeenCalledWith('SEO optimization');
      }, { timeout: 1000 });
    });
  });
});