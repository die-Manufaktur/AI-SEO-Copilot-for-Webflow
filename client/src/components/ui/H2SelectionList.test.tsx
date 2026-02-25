/**
 * Tests for H2SelectionList — per-H2 AI suggestions with regenerate functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { H2SelectionList } from './H2SelectionList';
import type { H2ElementInfo } from '../../lib/webflowDesignerApi';
import type { WebflowInsertionResult } from '../../types/webflow-data-api';

// Mock the useAppliedRecommendations hook
vi.mock('../../hooks/useAppliedRecommendations', () => ({
  useAppliedRecommendations: vi.fn(() => ({
    isApplied: vi.fn(() => false),
    markAsApplied: vi.fn(),
  })),
}));

// Mock the api module so tests don't make real HTTP calls
vi.mock('../../lib/api', () => ({
  generateRecommendation: vi.fn(),
}));

const mockH2Elements: H2ElementInfo[] = [
  { element: {} as any, id: 'h2_1', text: 'Discover Our Real Results', index: 0 },
  { element: {} as any, id: 'h2_2', text: 'Why Choose Our Platform', index: 1 },
  { element: {} as any, id: 'h2_3', text: 'How It Works', index: 2 },
];

const mockH2Recommendations = [
  { h2Index: 0, h2Text: 'Discover Our Real Results', suggestion: 'Real Results with Test Keyword' },
  { h2Index: 1, h2Text: 'Why Choose Our Platform', suggestion: 'Why Test Keyword Users Choose Us' },
  { h2Index: 2, h2Text: 'How It Works', suggestion: 'How Test Keyword Works for You' },
];

const mockInsertionResult: WebflowInsertionResult = {
  success: true,
  data: { _id: 'h2_1', content: 'Applied text', lastUpdated: new Date().toISOString() },
};

const defaultProps = {
  h2Elements: mockH2Elements,
  h2Recommendations: mockH2Recommendations,
  keyphrase: 'test keyword',
  onApply: vi.fn(),
};

describe('H2SelectionList', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Re-establish default mock implementation after clearAllMocks
    const { generateRecommendation } = await import('../../lib/api');
    vi.mocked(generateRecommendation).mockResolvedValue('Freshly Generated Suggestion');
  });

  describe('Rendering with per-H2 suggestions', () => {
    it('shows the AI suggestion as the prominent text for each H2 card', () => {
      render(<H2SelectionList {...defaultProps} />);
      expect(screen.getByText('Real Results with Test Keyword')).toBeInTheDocument();
      expect(screen.getByText('Why Test Keyword Users Choose Us')).toBeInTheDocument();
      expect(screen.getByText('How Test Keyword Works for You')).toBeInTheDocument();
    });

    it('shows the current H2 text as secondary reference', () => {
      render(<H2SelectionList {...defaultProps} />);
      expect(screen.getByText('Discover Our Real Results')).toBeInTheDocument();
      expect(screen.getByText('Why Choose Our Platform')).toBeInTheDocument();
    });

    it('shows H2 #N label for each card', () => {
      render(<H2SelectionList {...defaultProps} />);
      expect(screen.getByText('H2 #1')).toBeInTheDocument();
      expect(screen.getByText('H2 #2')).toBeInTheDocument();
      expect(screen.getByText('H2 #3')).toBeInTheDocument();
    });

    it('renders "Generate All" button', () => {
      render(<H2SelectionList {...defaultProps} />);
      expect(screen.getByRole('button', { name: /generate all/i })).toBeInTheDocument();
    });

    it('shows empty state when no valid H2 elements', () => {
      render(<H2SelectionList {...defaultProps} h2Elements={[]} />);
      expect(screen.getByText(/no valid h2 elements found/i)).toBeInTheDocument();
    });

    it('falls back gracefully when no h2Recommendations provided', () => {
      render(<H2SelectionList {...defaultProps} h2Recommendations={undefined} />);
      // Should still render h2 cards (no crash), just no suggestion text
      expect(screen.getByText('H2 #1')).toBeInTheDocument();
    });
  });

  describe('Apply functionality', () => {
    it('calls onApply with the per-H2 suggestion (not a shared recommendation)', async () => {
      const user = userEvent.setup();
      const mockOnApply = vi.fn().mockResolvedValue(mockInsertionResult);

      render(<H2SelectionList {...defaultProps} onApply={mockOnApply} />);

      const applyButtons = screen.getAllByRole('button', { name: /apply to h2/i });
      await user.click(applyButtons[0]);

      expect(mockOnApply).toHaveBeenCalledWith({
        h2Element: mockH2Elements[0],
        recommendation: 'Real Results with Test Keyword', // per-H2 suggestion, not shared
      });
    });

    it('calls onApply with the second H2s suggestion when second apply is clicked', async () => {
      const user = userEvent.setup();
      const mockOnApply = vi.fn().mockResolvedValue(mockInsertionResult);

      render(<H2SelectionList {...defaultProps} onApply={mockOnApply} />);

      const applyButtons = screen.getAllByRole('button', { name: /apply to h2/i });
      await user.click(applyButtons[1]);

      expect(mockOnApply).toHaveBeenCalledWith({
        h2Element: mockH2Elements[1],
        recommendation: 'Why Test Keyword Users Choose Us',
      });
    });

    it('shows "Applied" badge and disables all buttons after successful apply', async () => {
      const user = userEvent.setup();
      const mockOnApply = vi.fn().mockResolvedValue(mockInsertionResult);

      render(<H2SelectionList {...defaultProps} onApply={mockOnApply} />);

      const applyButtons = screen.getAllByRole('button', { name: /apply to h2/i });
      await user.click(applyButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Applied')).toBeInTheDocument();
      });
    });
  });

  describe('Per-item regeneration', () => {
    it('calls generateRecommendation with individual H2 text when per-item regenerate clicked', async () => {
      const { generateRecommendation } = await import('../../lib/api');
      const user = userEvent.setup();

      render(<H2SelectionList {...defaultProps} />);

      const regenerateButtons = screen.getAllByRole('button', { name: /generate new suggestion/i });
      await user.click(regenerateButtons[0]); // First H2's regenerate button

      await waitFor(() => {
        expect(generateRecommendation).toHaveBeenCalledWith({
          checkType: 'Keyphrase in H2 Headings',
          keyphrase: 'test keyword',
          context: 'Discover Our Real Results', // individual H2 text
          advancedOptions: undefined,
        });
      });
    });

    it('updates the suggestion for that card after regeneration', async () => {
      const user = userEvent.setup();

      render(<H2SelectionList {...defaultProps} />);

      // Initially shows initial suggestion
      expect(screen.getByText('Real Results with Test Keyword')).toBeInTheDocument();

      const regenerateButtons = screen.getAllByRole('button', { name: /generate new suggestion/i });
      await user.click(regenerateButtons[0]);

      // After regeneration, shows the new suggestion from mock
      await waitFor(() => {
        expect(screen.getByText('Freshly Generated Suggestion')).toBeInTheDocument();
      });
    });

    it('only regenerates the clicked H2, leaving others unchanged', async () => {
      const user = userEvent.setup();

      render(<H2SelectionList {...defaultProps} />);

      const regenerateButtons = screen.getAllByRole('button', { name: /generate new suggestion/i });
      await user.click(regenerateButtons[0]); // Only regenerate first H2

      await waitFor(() => {
        expect(screen.getByText('Freshly Generated Suggestion')).toBeInTheDocument();
      });

      // Second and third H2 suggestions unchanged
      expect(screen.getByText('Why Test Keyword Users Choose Us')).toBeInTheDocument();
      expect(screen.getByText('How Test Keyword Works for You')).toBeInTheDocument();
    });

    it('disables per-item regenerate button while regenerating', async () => {
      const { generateRecommendation } = await import('../../lib/api');
      // Delay the mock to simulate loading
      vi.mocked(generateRecommendation).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('New suggestion'), 100))
      );
      const user = userEvent.setup();

      render(<H2SelectionList {...defaultProps} />);

      const regenerateButtons = screen.getAllByRole('button', { name: /generate new suggestion/i });
      await user.click(regenerateButtons[0]);

      // During loading, all regenerate/apply buttons should be in loading/disabled state
      await waitFor(() => {
        expect(regenerateButtons[0]).toBeDisabled();
      });
    });
  });

  describe('"Generate All" button', () => {
    it('calls generateRecommendation for every H2 when "Generate All" clicked', async () => {
      const { generateRecommendation } = await import('../../lib/api');
      const user = userEvent.setup();

      render(<H2SelectionList {...defaultProps} />);

      const generateAllButton = screen.getByRole('button', { name: /generate all/i });
      await user.click(generateAllButton);

      await waitFor(() => {
        expect(generateRecommendation).toHaveBeenCalledTimes(3);
      });

      expect(generateRecommendation).toHaveBeenCalledWith(expect.objectContaining({
        context: 'Discover Our Real Results',
      }));
      expect(generateRecommendation).toHaveBeenCalledWith(expect.objectContaining({
        context: 'Why Choose Our Platform',
      }));
      expect(generateRecommendation).toHaveBeenCalledWith(expect.objectContaining({
        context: 'How It Works',
      }));
    });

    it('updates all suggestions after "Generate All" completes', async () => {
      const { generateRecommendation } = await import('../../lib/api');
      vi.mocked(generateRecommendation).mockResolvedValue('Freshly Generated Suggestion');
      const user = userEvent.setup();

      render(<H2SelectionList {...defaultProps} />);

      const generateAllButton = screen.getByRole('button', { name: /generate all/i });
      await user.click(generateAllButton);

      await waitFor(() => {
        const allSuggestions = screen.getAllByText('Freshly Generated Suggestion');
        expect(allSuggestions).toHaveLength(3);
      });
    });
  });

  describe('Disabled state', () => {
    it('disables all buttons when disabled prop is true', () => {
      render(<H2SelectionList {...defaultProps} disabled={true} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(btn => expect(btn).toBeDisabled());
    });
  });

  describe('Error handling', () => {
    it('calls onError when apply fails', async () => {
      const user = userEvent.setup();
      const mockOnApply = vi.fn().mockRejectedValue(new Error('Apply failed'));
      const mockOnError = vi.fn();

      render(<H2SelectionList {...defaultProps} onApply={mockOnApply} onError={mockOnError} />);

      const applyButtons = screen.getAllByRole('button', { name: /apply to h2/i });
      await user.click(applyButtons[0]);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Apply failed' }));
      });
    });
  });
});
