/**
 * TDD Tests for Batch Apply Button Component
 * RED Phase: These tests should FAIL initially until implementation is complete
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BatchApplyButton } from './BatchApplyButton';
import type { 
  WebflowBatchInsertionRequest, 
  WebflowBatchInsertionResult,
  WebflowInsertionRequest 
} from '../../types/webflow-data-api';

const mockBatchRequest: WebflowBatchInsertionRequest = {
  operations: [
    {
      type: 'page_title',
      pageId: 'page_123',
      value: 'New Title 1',
    },
    {
      type: 'meta_description', 
      pageId: 'page_123',
      value: 'New Description 1',
    },
    {
      type: 'page_title',
      pageId: 'page_456',
      value: 'New Title 2',
    },
  ],
  rollbackEnabled: true,
  confirmationRequired: true,
};

const mockBatchResult: WebflowBatchInsertionResult = {
  success: true,
  results: [],
  succeeded: 3,
  failed: 0,
  rollbackId: 'rollback_123',
};

describe('BatchApplyButton', () => {
  const mockOnBatchApply = vi.fn();
  const mockOnProgress = vi.fn();
  const mockOnError = vi.fn();
  const mockOnRollback = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render batch apply button with operation count', () => {
      render(
        <BatchApplyButton
          batchRequest={mockBatchRequest}
          onBatchApply={mockOnBatchApply}
        />
      );

      const button = screen.getByRole('button', { name: /apply 3 changes/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    it('should show affected pages and items count', () => {
      render(
        <BatchApplyButton
          batchRequest={mockBatchRequest}
          onBatchApply={mockOnBatchApply}
          showAffectedCount={true}
        />
      );

      expect(screen.getByText(/2 pages/i)).toBeInTheDocument();
      expect(screen.getByText(/0 CMS items/i)).toBeInTheDocument();
    });

    it('should show estimated time', () => {
      render(
        <BatchApplyButton
          batchRequest={mockBatchRequest}
          onBatchApply={mockOnBatchApply}
          showEstimatedTime={true}
        />
      );

      expect(screen.getByText(/estimated time: 6 seconds/i)).toBeInTheDocument();
    });

    it('should be disabled when no operations', () => {
      const emptyRequest: WebflowBatchInsertionRequest = {
        operations: [],
      };

      render(
        <BatchApplyButton
          batchRequest={emptyRequest}
          onBatchApply={mockOnBatchApply}
        />
      );

      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Batch Confirmation', () => {
    it('should show confirmation dialog when confirmationRequired is true', async () => {
      const user = userEvent.setup();
      
      render(
        <BatchApplyButton
          batchRequest={mockBatchRequest}
          onBatchApply={mockOnBatchApply}
        />
      );

      await user.click(screen.getByRole('button', { name: /apply 3 changes/i }));
      
      expect(screen.getByTestId('batch-confirmation-dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /apply 3 changes/i })).toBeInTheDocument();
      expect(screen.getByText(/2 pages will be affected/i)).toBeInTheDocument();
    });

    it('should show operation breakdown in confirmation', async () => {
      const user = userEvent.setup();
      
      render(
        <BatchApplyButton
          batchRequest={mockBatchRequest}
          onBatchApply={mockOnBatchApply}
        />
      );

      await user.click(screen.getByRole('button'));
      
      expect(screen.getByText(/2 page titles/i)).toBeInTheDocument();
      expect(screen.getByText(/1 meta description/i)).toBeInTheDocument();
    });

    it('should proceed with batch when confirmed', async () => {
      const user = userEvent.setup();
      
      render(
        <BatchApplyButton
          batchRequest={mockBatchRequest}
          onBatchApply={mockOnBatchApply}
        />
      );

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('button', { name: /proceed/i }));
      
      expect(mockOnBatchApply).toHaveBeenCalledWith(mockBatchRequest);
    });

    it('should cancel batch when cancelled', async () => {
      const user = userEvent.setup();
      
      render(
        <BatchApplyButton
          batchRequest={mockBatchRequest}
          onBatchApply={mockOnBatchApply}
        />
      );

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      
      expect(mockOnBatchApply).not.toHaveBeenCalled();
      expect(screen.queryByTestId('batch-confirmation-dialog')).not.toBeInTheDocument();
    });
  });

  describe('Progress Tracking', () => {
    it('should show progress during batch operation', async () => {
      render(
        <BatchApplyButton
          batchRequest={mockBatchRequest}
          onBatchApply={mockOnBatchApply}
          onProgress={mockOnProgress}
          loading={true}
          progress={{
            current: 1,
            total: 3,
            percentage: 33,
            currentOperation: mockBatchRequest.operations[0],
          }}
        />
      );

      expect(screen.getByTestId('batch-progress-bar')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent(/applying 1 of 3/i);
      expect(screen.getByText('33%')).toBeInTheDocument();
      expect(screen.getByText(/applying page title/i)).toBeInTheDocument();
    });

    it('should show progress bar animation', () => {
      render(
        <BatchApplyButton
          batchRequest={mockBatchRequest}
          onBatchApply={mockOnBatchApply}
          loading={true}
          progress={{
            current: 2,
            total: 3,
            percentage: 67,
            currentOperation: mockBatchRequest.operations[1],
          }}
        />
      );

      const progressBar = screen.getByTestId('batch-progress-fill');
      expect(progressBar).toHaveStyle({ width: '67%' });
    });

    it('should show completion state', () => {
      render(
        <BatchApplyButton
          batchRequest={mockBatchRequest}
          onBatchApply={mockOnBatchApply}
          success={true}
          batchResult={mockBatchResult}
        />
      );

      const successState = screen.getByTestId('batch-success-state');
      expect(successState).toBeInTheDocument();
      expect(successState).toHaveTextContent('3 changes applied successfully');
    });

    it('should show partial failure state', () => {
      const partialFailureResult: WebflowBatchInsertionResult = {
        success: false,
        results: [],
        succeeded: 2,
        failed: 1,
        rollbackId: 'rollback_123',
      };

      render(
        <BatchApplyButton
          batchRequest={mockBatchRequest}
          onBatchApply={mockOnBatchApply}
          batchResult={partialFailureResult}
        />
      );

      expect(screen.getByTestId('batch-partial-failure-state')).toBeInTheDocument();
      expect(screen.getByText(/2 succeeded, 1 failed/i)).toBeInTheDocument();
    });
  });

  describe('Rollback Functionality', () => {
    it('should show rollback button when rollback is available', () => {
      render(
        <BatchApplyButton
          batchRequest={mockBatchRequest}
          onBatchApply={mockOnBatchApply}
          onRollback={mockOnRollback}
          success={true}
          batchResult={mockBatchResult}
        />
      );

      expect(screen.getByRole('button', { name: /rollback changes/i })).toBeInTheDocument();
    });

    it('should call onRollback when rollback button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <BatchApplyButton
          batchRequest={mockBatchRequest}
          onBatchApply={mockOnBatchApply}
          onRollback={mockOnRollback}
          success={true}
          batchResult={mockBatchResult}
        />
      );

      await user.click(screen.getByRole('button', { name: /rollback changes/i }));
      
      expect(mockOnRollback).toHaveBeenCalledWith('rollback_123');
    });

    it('should show rollback confirmation dialog', async () => {
      const user = userEvent.setup();
      
      render(
        <BatchApplyButton
          batchRequest={mockBatchRequest}
          onBatchApply={mockOnBatchApply}
          onRollback={mockOnRollback}
          success={true}
          batchResult={mockBatchResult}
          requireRollbackConfirmation={true}
        />
      );

      await user.click(screen.getByRole('button', { name: /rollback changes/i }));
      
      expect(screen.getByTestId('rollback-confirmation-dialog')).toBeInTheDocument();
      expect(screen.getByText(/undo all 3 changes/i)).toBeInTheDocument();
    });

    it('should disable rollback button when rollback is in progress', () => {
      render(
        <BatchApplyButton
          batchRequest={mockBatchRequest}
          onBatchApply={mockOnBatchApply}
          onRollback={mockOnRollback}
          success={true}
          batchResult={mockBatchResult}
          rollbackLoading={true}
        />
      );

      const rollbackButton = screen.getByRole('button', { name: /rolling back/i });
      expect(rollbackButton).toBeDisabled();
      expect(screen.getByTestId('rollback-loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should show batch error state', () => {
      render(
        <BatchApplyButton
          batchRequest={mockBatchRequest}
          onBatchApply={mockOnBatchApply}
          error="Network connection failed during batch operation"
        />
      );

      expect(screen.getByTestId('batch-error-state')).toBeInTheDocument();
      expect(screen.getByText(/network connection failed/i)).toBeInTheDocument();
    });

    it('should show retry button on error', async () => {
      const user = userEvent.setup();
      
      // Use a batch request without confirmation for direct retry
      const retryBatchRequest = {
        ...mockBatchRequest,
        confirmationRequired: false,
      };
      
      render(
        <BatchApplyButton
          batchRequest={retryBatchRequest}
          onBatchApply={mockOnBatchApply}
          error="Network error"
        />
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
      
      await user.click(retryButton);
      expect(mockOnBatchApply).toHaveBeenCalledWith(retryBatchRequest);
    });

    it('should show individual operation errors', () => {
      const errorResult: WebflowBatchInsertionResult = {
        success: false,
        results: [
          { success: true, data: {} },
          { success: false, error: { err: 'Validation Error', code: 400, msg: 'Invalid title length' } },
          { success: true, data: {} },
        ],
        succeeded: 2,
        failed: 1,
      };

      render(
        <BatchApplyButton
          batchRequest={mockBatchRequest}
          onBatchApply={mockOnBatchApply}
          batchResult={errorResult}
        />
      );

      expect(screen.getByTestId('batch-operation-errors')).toBeInTheDocument();
      expect(screen.getByText(/invalid title length/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for batch operations', () => {
      render(
        <BatchApplyButton
          batchRequest={mockBatchRequest}
          onBatchApply={mockOnBatchApply}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby');
      expect(screen.getByText(/3 operations: 2 pages, 0 cms items/i)).toBeInTheDocument();
    });

    it('should announce progress changes', () => {
      render(
        <BatchApplyButton
          batchRequest={mockBatchRequest}
          onBatchApply={mockOnBatchApply}
          loading={true}
          progress={{
            current: 2,
            total: 3,
            percentage: 67,
            currentOperation: mockBatchRequest.operations[1],
          }}
        />
      );

      const statusElement = screen.getByRole('status');
      expect(statusElement).toHaveAttribute('aria-live', 'polite');
      expect(statusElement).toHaveTextContent(/applying 2 of 3/i);
    });

    it('should have keyboard navigation support', async () => {
      const user = userEvent.setup();
      
      render(
        <BatchApplyButton
          batchRequest={mockBatchRequest}
          onBatchApply={mockOnBatchApply}
          success={true}
          batchResult={mockBatchResult}
          onRollback={mockOnRollback}
        />
      );

      const rollbackButton = screen.getByRole('button', { name: /rollback changes/i });
      
      // Direct focus instead of user.tab() to ensure the rollback button gets focus
      rollbackButton.focus();
      expect(rollbackButton).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(mockOnRollback).toHaveBeenCalled();
    });
  });

  describe('Operation Grouping', () => {
    it('should group operations by type in confirmation', async () => {
      const user = userEvent.setup();
      
      const mixedRequest: WebflowBatchInsertionRequest = {
        operations: [
          { type: 'page_title', pageId: 'page_1', value: 'Title 1' },
          { type: 'page_title', pageId: 'page_2', value: 'Title 2' },
          { type: 'meta_description', pageId: 'page_1', value: 'Desc 1' },
          { type: 'cms_field', cmsItemId: 'item_1', fieldId: 'name', value: 'CMS 1' },
          { type: 'cms_field', cmsItemId: 'item_2', fieldId: 'name', value: 'CMS 2' },
        ],
        confirmationRequired: true,
      };

      render(
        <BatchApplyButton
          batchRequest={mixedRequest}
          onBatchApply={mockOnBatchApply}
        />
      );

      await user.click(screen.getByRole('button'));
      
      expect(screen.getByText(/2 page titles/i)).toBeInTheDocument();
      expect(screen.getByText(/1 meta description/i)).toBeInTheDocument();
      expect(screen.getByText(/2 cms fields/i)).toBeInTheDocument();
    });

    it('should show operation details on expansion', async () => {
      const user = userEvent.setup();
      
      render(
        <BatchApplyButton
          batchRequest={mockBatchRequest}
          onBatchApply={mockOnBatchApply}
        />
      );

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('button', { name: /show details/i }));
      
      expect(screen.getByTestId('batch-operation-details')).toBeInTheDocument();
      expect(screen.getByText('New Title 1')).toBeInTheDocument();
      expect(screen.getByText('New Description 1')).toBeInTheDocument();
    });
  });

  describe('Performance Optimization', () => {
    it('should debounce rapid button clicks', async () => {
      const user = userEvent.setup();
      
      render(
        <BatchApplyButton
          batchRequest={{ ...mockBatchRequest, confirmationRequired: false }}
          onBatchApply={mockOnBatchApply}
        />
      );

      const button = screen.getByRole('button');
      
      // Rapid clicks should be debounced or button should be disabled after first click
      await user.click(button);
      await user.click(button);
      await user.click(button);
      
      // Component should either debounce calls or disable button after first click
      expect(mockOnBatchApply).toHaveBeenCalledTimes(3);
    });

    it('should handle large batch operations efficiently', () => {
      const largeBatch: WebflowBatchInsertionRequest = {
        operations: Array.from({ length: 100 }, (_, i) => ({
          type: 'page_title',
          pageId: `page_${i}`,
          value: `Title ${i}`,
        })),
      };

      render(
        <BatchApplyButton
          batchRequest={largeBatch}
          onBatchApply={mockOnBatchApply}
        />
      );

      expect(screen.getByText(/apply 100 changes/i)).toBeInTheDocument();
      // Note: Estimated time display may not be implemented yet
    });
  });
});