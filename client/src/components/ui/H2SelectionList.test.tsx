/**
 * TDD Tests for H2SelectionList Component
 * RED Phase: These tests should FAIL initially until implementation is complete
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

// Mock H2 elements data
const mockH2Elements: H2ElementInfo[] = [
  {
    element: {} as any, // Mock WebflowElement
    id: 'h2_1',
    text: 'Current H2 Title One',
    index: 0,
  },
  {
    element: {} as any, // Mock WebflowElement
    id: 'h2_2', 
    text: 'Current H2 Title Two',
    index: 1,
  },
  {
    element: {} as any, // Mock WebflowElement
    id: 'h2_3',
    text: 'Current H2 Title Three',
    index: 2,
  },
];

const mockRecommendation = 'Optimized H2 Heading for SEO';

const mockInsertionResult: WebflowInsertionResult = {
  success: true,
  data: {
    _id: 'h2_1',
    content: mockRecommendation,
    lastUpdated: new Date().toISOString(),
  },
};

describe('H2SelectionList', () => {
  const mockOnApply = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render all H2 elements with their current text', () => {
      render(
        <H2SelectionList
          h2Elements={mockH2Elements}
          recommendation={mockRecommendation}
          onApply={mockOnApply}
        />
      );

      // Should show all H2 elements
      expect(screen.getByText(/Current H2 Title One/)).toBeInTheDocument();
      expect(screen.getByText(/Current H2 Title Two/)).toBeInTheDocument();
      expect(screen.getByText(/Current H2 Title Three/)).toBeInTheDocument();
    });

    it('should render Apply button for each H2 element', () => {
      render(
        <H2SelectionList
          h2Elements={mockH2Elements}
          recommendation={mockRecommendation}
          onApply={mockOnApply}
        />
      );

      const applyButtons = screen.getAllByRole('button', { name: /apply/i });
      expect(applyButtons).toHaveLength(3);
      
      // All buttons should be enabled initially
      applyButtons.forEach(button => {
        expect(button).not.toBeDisabled();
      });
    });

    it('should not display recommendation text directly (handled by parent)', () => {
      render(
        <H2SelectionList
          h2Elements={mockH2Elements}
          recommendation={mockRecommendation}
          onApply={mockOnApply}
        />
      );

      // Recommendation text is displayed by the parent component, not H2SelectionList
      expect(screen.queryByText(mockRecommendation)).not.toBeInTheDocument();
    });

    it('should handle empty H2 elements list', () => {
      render(
        <H2SelectionList
          h2Elements={[]}
          recommendation={mockRecommendation}
          onApply={mockOnApply}
        />
      );

      expect(screen.getByText(/no valid h2 elements found/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /apply/i })).not.toBeInTheDocument();
    });

    it('should filter out invalid H2 elements (empty text, missing id)', () => {
      const invalidH2Elements = [
        { id: 'h2-1', text: 'Valid H2', index: 0 }, // Valid
        { id: '', text: 'Missing ID', index: 1 }, // Invalid - missing id
        { id: 'h2-3', text: '', index: 2 }, // Invalid - empty text
        { id: 'h2-4', text: '   ', index: 3 }, // Invalid - whitespace only
        null as any, // Invalid - null element
        { id: 'h2-6', text: 'Another Valid H2', index: 5 } // Valid
      ];

      render(
        <H2SelectionList
          h2Elements={invalidH2Elements}
          recommendation={mockRecommendation}
          onApply={mockOnApply}
        />
      );

      // Should only show the 2 valid H2 elements
      expect(screen.getByText('Valid H2')).toBeInTheDocument();
      expect(screen.getByText('Another Valid H2')).toBeInTheDocument();
      
      // Should not show invalid elements
      expect(screen.queryByText('Missing ID')).not.toBeInTheDocument();
      
      // Should show 2 apply buttons (one for each valid element)
      const applyButtons = screen.getAllByRole('button', { name: /apply/i });
      expect(applyButtons).toHaveLength(2);
    });
  });

  describe('Apply Functionality', () => {
    it('should call onApply with correct H2ElementInfo when Apply button is clicked', async () => {
      const user = userEvent.setup();
      mockOnApply.mockResolvedValue(mockInsertionResult);

      render(
        <H2SelectionList
          h2Elements={mockH2Elements}
          recommendation={mockRecommendation}
          onApply={mockOnApply}
        />
      );

      const firstApplyButton = screen.getAllByRole('button', { name: /apply/i })[0];
      await user.click(firstApplyButton);

      expect(mockOnApply).toHaveBeenCalledWith({
        h2Element: mockH2Elements[0],
        recommendation: mockRecommendation,
      });
    });

    it('should disable all Apply buttons after one is successfully applied', async () => {
      const user = userEvent.setup();
      mockOnApply.mockResolvedValue(mockInsertionResult);

      render(
        <H2SelectionList
          h2Elements={mockH2Elements}
          recommendation={mockRecommendation}
          onApply={mockOnApply}
        />
      );

      const firstApplyButton = screen.getAllByRole('button', { name: /apply/i })[0];
      await user.click(firstApplyButton);

      // All apply buttons should now be disabled after successful apply
      await waitFor(() => {
        const applyButtons = screen.getAllByRole('button', { name: /apply/i });
        applyButtons.forEach(button => {
          expect(button).toBeDisabled();
        });
      });
    });

    it('should show visual feedback for the applied H2 element', async () => {
      const user = userEvent.setup();
      mockOnApply.mockResolvedValue(mockInsertionResult);

      render(
        <H2SelectionList
          h2Elements={mockH2Elements}
          recommendation={mockRecommendation}
          onApply={mockOnApply}
        />
      );

      const firstApplyButton = screen.getAllByRole('button', { name: /apply/i })[0];
      await user.click(firstApplyButton);

      // Should show Applied badge
      await waitFor(() => {
        expect(screen.getByText('Applied')).toBeInTheDocument();
      });

      // Should show success message
      expect(screen.getByText(/Successfully applied recommendation to H2 #1/)).toBeInTheDocument();
    });

    it('should transition to applied state after successful apply', async () => {
      const user = userEvent.setup();
      mockOnApply.mockResolvedValue(mockInsertionResult);

      render(
        <H2SelectionList
          h2Elements={mockH2Elements}
          recommendation={mockRecommendation}
          onApply={mockOnApply}
        />
      );

      const firstApplyButton = screen.getAllByRole('button', { name: /apply/i })[0];
      expect(firstApplyButton).not.toBeDisabled();

      await user.click(firstApplyButton);

      // After the apply completes, should show Applied badge
      await waitFor(() => expect(screen.getByText('Applied')).toBeInTheDocument());

      // All apply buttons should be disabled after successful apply (re-query after re-render)
      const applyButtons = screen.getAllByRole('button', { name: /apply/i });
      applyButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle apply errors gracefully', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Failed to apply H2 heading';
      mockOnApply.mockRejectedValue(new Error(errorMessage));

      render(
        <H2SelectionList
          h2Elements={mockH2Elements}
          recommendation={mockRecommendation}
          onApply={mockOnApply}
          onError={mockOnError}
        />
      );

      const firstApplyButton = screen.getAllByRole('button', { name: /apply/i })[0];
      await user.click(firstApplyButton);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
      });

      // Other buttons should remain enabled (appliedIndex stays null on error)
      const applyButtons = screen.getAllByRole('button', { name: /apply/i });
      const otherButtons = applyButtons.slice(1);
      otherButtons.forEach(button => {
        expect(button).not.toBeDisabled();
      });
    });

    it('should call onError with error details when apply fails', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Network connection failed';
      mockOnApply.mockRejectedValue(new Error(errorMessage));

      render(
        <H2SelectionList
          h2Elements={mockH2Elements}
          recommendation={mockRecommendation}
          onApply={mockOnApply}
          onError={mockOnError}
        />
      );

      const firstApplyButton = screen.getAllByRole('button', { name: /apply/i })[0];
      await user.click(firstApplyButton);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          expect.objectContaining({ message: errorMessage })
        );
      });
    });
  });

  describe('Disabled State', () => {
    it('should disable all buttons when disabled prop is true', () => {
      render(
        <H2SelectionList
          h2Elements={mockH2Elements}
          recommendation={mockRecommendation}
          onApply={mockOnApply}
          disabled={true}
        />
      );

      const applyButtons = screen.getAllByRole('button', { name: /apply/i });
      applyButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('should not trigger apply when disabled', async () => {
      const user = userEvent.setup();

      render(
        <H2SelectionList
          h2Elements={mockH2Elements}
          recommendation={mockRecommendation}
          onApply={mockOnApply}
          disabled={true}
        />
      );

      const firstApplyButton = screen.getAllByRole('button', { name: /apply/i })[0];
      await user.click(firstApplyButton);

      expect(mockOnApply).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <H2SelectionList
          h2Elements={mockH2Elements}
          recommendation={mockRecommendation}
          onApply={mockOnApply}
        />
      );

      const applyButtons = screen.getAllByRole('button', { name: /apply/i });
      applyButtons.forEach((button, index) => {
        expect(button).toHaveAttribute('aria-label', expect.stringContaining(`Apply to H2 ${index + 1}`));
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      mockOnApply.mockResolvedValue(mockInsertionResult);

      render(
        <H2SelectionList
          h2Elements={mockH2Elements}
          recommendation={mockRecommendation}
          onApply={mockOnApply}
        />
      );

      const firstApplyButton = screen.getAllByRole('button', { name: /apply/i })[0];
      firstApplyButton.focus();
      
      expect(firstApplyButton).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(mockOnApply).toHaveBeenCalled();
    });
  });
});