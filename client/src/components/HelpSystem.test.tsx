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
  const mockSearchHelp = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useHelp as any).mockReturnValue({
      isHelpEnabled: true,
      toggleHelp: mockToggleHelp,
      getHelp: mockGetHelp,
      searchHelp: mockSearchHelp
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
      mockGetHelp.mockReturnValue([
        { id: '1', title: 'What is SEO?', category: 'seo' },
        { id: '2', title: 'Keyword Research', category: 'seo' }
      ]);

      render(<HelpSystem />);
      await userEvent.click(screen.getByRole('button', { name: /help/i }));
      await userEvent.click(screen.getByText('SEO Optimization'));
      
      await waitFor(() => {
        expect(screen.getByText('What is SEO?')).toBeInTheDocument();
        expect(screen.getByText('Keyword Research')).toBeInTheDocument();
      });
    });
  });

  describe('Interactive Tutorials', () => {
    it('should start tutorial when clicked', async () => {
      render(<HelpSystem />);
      await userEvent.click(screen.getByRole('button', { name: /help/i }));
      await userEvent.click(screen.getByText('Start Tutorial'));
      
      expect(screen.getByText(/step 1 of/i)).toBeInTheDocument();
    });

    it('should navigate through tutorial steps', async () => {
      render(<HelpSystem />);
      await userEvent.click(screen.getByRole('button', { name: /help/i }));
      await userEvent.click(screen.getByText('Start Tutorial'));
      
      expect(screen.getByText(/step 1 of/i)).toBeInTheDocument();
      
      await userEvent.click(screen.getByText('Next'));
      expect(screen.getByText(/step 2 of/i)).toBeInTheDocument();
      
      await userEvent.click(screen.getByText('Previous'));
      expect(screen.getByText(/step 1 of/i)).toBeInTheDocument();
    });

    it('should complete tutorial', async () => {
      render(<HelpSystem />);
      await userEvent.click(screen.getByRole('button', { name: /help/i }));
      await userEvent.click(screen.getByText('Start Tutorial'));
      
      // Navigate to last step
      const nextButton = screen.getByText('Next');
      while (screen.queryByText('Complete')) {
        await userEvent.click(nextButton);
      }
      
      await userEvent.click(screen.getByText('Complete'));
      expect(screen.getByText(/tutorial completed/i)).toBeInTheDocument();
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
        searchHelp: mockSearchHelp
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
      const mockTrackEvent = vi.fn();
      (useHelp as any).mockReturnValue({
        isHelpEnabled: true,
        toggleHelp: mockToggleHelp,
        getHelp: mockGetHelp,
        searchHelp: mockSearchHelp,
        trackEvent: mockTrackEvent
      });

      mockGetHelp.mockReturnValue([
        { id: '1', title: 'What is SEO?', category: 'seo' }
      ]);

      render(<HelpSystem />);
      await userEvent.click(screen.getByRole('button', { name: /help/i }));
      await userEvent.click(screen.getByText('SEO Optimization'));
      await userEvent.click(screen.getByText('What is SEO?'));
      
      expect(mockTrackEvent).toHaveBeenCalledWith('help_article_viewed', {
        articleId: '1',
        title: 'What is SEO?',
        category: 'seo'
      });
    });

    it('should track search queries', async () => {
      const mockTrackEvent = vi.fn();
      (useHelp as any).mockReturnValue({
        isHelpEnabled: true,
        toggleHelp: mockToggleHelp,
        getHelp: mockGetHelp,
        searchHelp: mockSearchHelp,
        trackEvent: mockTrackEvent
      });

      render(<HelpSystem />);
      await userEvent.click(screen.getByRole('button', { name: /help/i }));
      
      const searchInput = screen.getByPlaceholderText(/search help/i);
      await userEvent.type(searchInput, 'SEO optimization');
      
      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith('help_search', {
          query: 'SEO optimization'
        });
      });
    });
  });
});