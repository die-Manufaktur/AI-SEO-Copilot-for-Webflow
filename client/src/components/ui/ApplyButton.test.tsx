/**
 * TDD Tests for Apply Button Component
 * RED Phase: These tests should FAIL initially until implementation is complete
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApplyButton } from './ApplyButton';
import type { 
  WebflowInsertionRequest, 
  WebflowInsertionResult 
} from '../../types/webflow-data-api';

// Mock insertion contexts
const mockInsertionRequest: WebflowInsertionRequest = {
  type: 'page_title',
  pageId: 'page_123',
  value: 'New Optimized Title',
};

const mockInsertionResult: WebflowInsertionResult = {
  success: true,
  data: {
    _id: 'page_123',
    title: 'New Optimized Title',
    lastUpdated: new Date().toISOString(),
  },
};

describe('ApplyButton', () => {
  const mockOnApply = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render apply button with default state', () => {
      render(
        <ApplyButton
          insertionRequest={mockInsertionRequest}
          onApply={mockOnApply}
        />
      );

      const button = screen.getByRole('button', { name: /apply/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
      expect(button).toHaveClass('bg-blue-600');
    });

    it('should render with custom label', () => {
      render(
        <ApplyButton
          insertionRequest={mockInsertionRequest}
          onApply={mockOnApply}
          label="Apply Title Change"
        />
      );

      expect(screen.getByRole('button', { name: 'Apply Title Change' })).toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(
        <ApplyButton
          insertionRequest={mockInsertionRequest}
          onApply={mockOnApply}
          loading={true}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByText('Applying...')).toBeInTheDocument();
    });

    it('should show success state', () => {
      render(
        <ApplyButton
          insertionRequest={mockInsertionRequest}
          onApply={mockOnApply}
          success={true}
        />
      );

      expect(screen.getByText('Applied')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveClass('bg-green-600');
    });

    it('should show error state', () => {
      render(
        <ApplyButton
          insertionRequest={mockInsertionRequest}
          onApply={mockOnApply}
          error="Failed to apply changes"
        />
      );

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveClass('bg-red-600');
    });
  });

  describe('User Interactions', () => {
    it('should call onApply when clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <ApplyButton
          insertionRequest={mockInsertionRequest}
          onApply={mockOnApply}
        />
      );

      await user.click(screen.getByRole('button'));
      
      expect(mockOnApply).toHaveBeenCalledWith(mockInsertionRequest);
      expect(mockOnApply).toHaveBeenCalledTimes(1);
    });

    it('should not call onApply when disabled', async () => {
      const user = userEvent.setup();
      
      render(
        <ApplyButton
          insertionRequest={mockInsertionRequest}
          onApply={mockOnApply}
          disabled={true}
        />
      );

      await user.click(screen.getByRole('button'));
      
      expect(mockOnApply).not.toHaveBeenCalled();
    });


    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <ApplyButton
          insertionRequest={mockInsertionRequest}
          onApply={mockOnApply}
        />
      );

      const button = screen.getByRole('button');
      
      // Direct focus instead of user.tab() to ensure the button gets focus
      button.focus();
      expect(button).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(mockOnApply).toHaveBeenCalledWith(mockInsertionRequest);
    });
  });


  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <ApplyButton
          insertionRequest={mockInsertionRequest}
          onApply={mockOnApply}
          ariaLabel="Apply page title recommendation"
        />
      );

      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Apply page title recommendation'
      );
    });

    it('should have loading state ARIA attributes', () => {
      render(
        <ApplyButton
          insertionRequest={mockInsertionRequest}
          onApply={mockOnApply}
          loading={true}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should have error state ARIA attributes', () => {
      render(
        <ApplyButton
          insertionRequest={mockInsertionRequest}
          onApply={mockOnApply}
          error="Network error"
        />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  describe('Confirmation Mode', () => {
    it('should show confirmation dialog when requiresConfirmation is true', async () => {
      const user = userEvent.setup();
      
      render(
        <ApplyButton
          insertionRequest={mockInsertionRequest}
          onApply={mockOnApply}
          requiresConfirmation={true}
          confirmationMessage="Are you sure you want to apply this change?"
        />
      );

      await user.click(screen.getByRole('button', { name: /apply/i }));
      
      expect(screen.getByText('Are you sure you want to apply this change?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should call onApply when confirmation is accepted', async () => {
      const user = userEvent.setup();
      
      render(
        <ApplyButton
          insertionRequest={mockInsertionRequest}
          onApply={mockOnApply}
          requiresConfirmation={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /apply/i }));
      await user.click(screen.getByRole('button', { name: /confirm/i }));
      
      expect(mockOnApply).toHaveBeenCalledWith(mockInsertionRequest);
    });

    it('should not call onApply when confirmation is cancelled', async () => {
      const user = userEvent.setup();
      
      render(
        <ApplyButton
          insertionRequest={mockInsertionRequest}
          onApply={mockOnApply}
          requiresConfirmation={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /apply/i }));
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      
      expect(mockOnApply).not.toHaveBeenCalled();
    });
  });

  describe('Different Insertion Types', () => {
    it('should handle page title insertion', () => {
      const titleRequest: WebflowInsertionRequest = {
        type: 'page_title',
        pageId: 'page_123',
        value: 'New Title',
      };

      render(
        <ApplyButton
          insertionRequest={titleRequest}
          onApply={mockOnApply}
        />
      );

      expect(screen.getByText('Apply')).toBeInTheDocument();
    });

    it('should handle meta description insertion', () => {
      const metaRequest: WebflowInsertionRequest = {
        type: 'meta_description',
        pageId: 'page_123',
        value: 'New meta description',
      };

      render(
        <ApplyButton
          insertionRequest={metaRequest}
          onApply={mockOnApply}
        />
      );

      expect(screen.getByText('Apply')).toBeInTheDocument();
    });

    it('should handle CMS field insertion', () => {
      const cmsRequest: WebflowInsertionRequest = {
        type: 'cms_field',
        cmsItemId: 'item_123',
        fieldId: 'name',
        value: 'New CMS Value',
      };

      render(
        <ApplyButton
          insertionRequest={cmsRequest}
          onApply={mockOnApply}
        />
      );

      expect(screen.getByText('Apply')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should show error tooltip on hover', async () => {
      const user = userEvent.setup();
      
      render(
        <ApplyButton
          insertionRequest={mockInsertionRequest}
          onApply={mockOnApply}
          error="Network connection failed"
        />
      );

      await user.hover(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(screen.getByText('Network connection failed')).toBeVisible();
      });
    });

    it('should call onError when provided', async () => {
      const user = userEvent.setup();
      mockOnApply.mockRejectedValue(new Error('Test error'));
      
      render(
        <ApplyButton
          insertionRequest={mockInsertionRequest}
          onApply={mockOnApply}
          onError={mockOnError}
        />
      );

      await user.click(screen.getByRole('button'));
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
      });
    });
  });

  describe('Success Animation', () => {
    it('should show success animation when success state changes', async () => {
      const { rerender } = render(
        <ApplyButton
          insertionRequest={mockInsertionRequest}
          onApply={mockOnApply}
        />
      );

      rerender(
        <ApplyButton
          insertionRequest={mockInsertionRequest}
          onApply={mockOnApply}
          success={true}
        />
      );

      expect(screen.getByTestId('success-animation')).toBeInTheDocument();
    });

    it('should auto-reset success state after timeout', async () => {
      vi.useFakeTimers();
      
      try {
        const { rerender } = render(
          <ApplyButton
            insertionRequest={mockInsertionRequest}
            onApply={mockOnApply}
            success={false}
            successTimeout={2000}
          />
        );

        // Change to success state to trigger the useEffect and internal timeout
        act(() => {
          rerender(
            <ApplyButton
              insertionRequest={mockInsertionRequest}
              onApply={mockOnApply}
              success={true}
              successTimeout={2000}
            />
          );
        });

        expect(screen.getByText('Applied')).toBeInTheDocument();
        
        // Fast-forward time by timeout amount to trigger the internal reset
        act(() => {
          vi.advanceTimersByTime(2000);
        });
        
        // The component should reset to default state after the timeout
        // because it uses internal state management with setTimeout
        expect(screen.queryByText('Applied')).not.toBeInTheDocument();
        expect(screen.getByText('Apply')).toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    });
  });
});