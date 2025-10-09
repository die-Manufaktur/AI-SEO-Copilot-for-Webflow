/**
 * TDD Tests for Insertion Context
 * RED Phase: These tests should FAIL initially until implementation is complete
 */

import { describe, it, expect, vi, beforeEach, afterEach, type MockedFunction } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InsertionProvider, useInsertion } from './InsertionContext';
import { WebflowInsertion } from '../lib/webflowInsertion';
import { renderWithProviders } from '../__tests__/utils/testHelpers';
import { AuthProvider } from './AuthContext';
import type { 
  WebflowInsertionRequest,
  WebflowInsertionResult,
  WebflowBatchInsertionRequest,
  WebflowBatchInsertionResult
} from '../types/webflow-data-api';

// Mock WebflowInsertion
vi.mock('../lib/webflowInsertion');

// Mock WebflowAuth specifically for InsertionContext tests
vi.mock('../lib/webflowAuth', () => ({
  WebflowAuth: vi.fn().mockImplementation(() => ({
    getValidToken: vi.fn(() => Promise.resolve({
      access_token: 'test-token',
      refresh_token: 'test-refresh-token',
      scope: 'sites:read sites:write cms:read cms:write pages:read pages:write',
      expires_in: 3600,
      expires_at: Date.now() + 3600000
    })),
    hasScope: vi.fn(() => true),
    clearStoredToken: vi.fn(),
    initiateOAuthFlow: vi.fn(() => Promise.resolve()),
  }))
}));

// Mock WebflowDataAPI to prevent authentication errors
vi.mock('../lib/webflowDataApi', () => ({
  WebflowDataAPI: vi.fn().mockImplementation(() => ({
    getConfig: vi.fn(() => ({})),
    getAuthHeaders: vi.fn(() => ({ Authorization: 'Bearer test-token' })),
    getPage: vi.fn(() => Promise.resolve({ _id: 'page_123', title: 'Test Page' })),
    updatePage: vi.fn(() => Promise.resolve({ _id: 'page_123', title: 'Updated Page' })),
    listCollections: vi.fn(() => Promise.resolve([])),
    listCollectionItems: vi.fn(() => Promise.resolve([])),
    updateCollectionItem: vi.fn(() => Promise.resolve({ _id: 'item_123' })),
    getRateLimitInfo: vi.fn(() => ({ remainingRequests: 100, resetTime: Date.now() + 3600000 })),
  }))
}));

// Helper to render with insertion provider using proper test helpers
const renderWithInsertion = (ui: React.ReactElement, options?: { insertionInstance?: WebflowInsertion }) => {
  // Use the standard test helpers which already include AuthProvider
  return renderWithProviders(ui);
};

// Test component to access context
function TestComponent() {
  const {
    applyInsertion,
    applyBatch,
    rollbackBatch,
    insertionHistory,
    pendingOperations,
    isLoading,
    error,
    progress,
    lastResult,
    clearError,
    addToPending,
    removeFromPending,
    clearPending,
  } = useInsertion();

  return (
    <div>
      <div data-testid="loading-state">{isLoading ? 'loading' : 'idle'}</div>
      <div data-testid="error-state">{error || 'no-error'}</div>
      <div data-testid="pending-count">{pendingOperations.length}</div>
      <div data-testid="history-count">{insertionHistory.length}</div>
      
      {progress && (
        <div data-testid="progress">
          {progress.current}/{progress.total} - {progress.percentage}%
        </div>
      )}
      
      {lastResult && (
        <div data-testid="last-result">
          {lastResult.success ? 'success' : 'failed'}
        </div>
      )}

      <button
        data-testid="apply-single"
        onClick={() => {
          applyInsertion({
            type: 'page_title',
            pageId: 'page_123',
            value: 'Test Title',
          }).catch(() => {
            // Error is already handled by context
          });
        }}
      >
        Apply Single
      </button>


      <button
        data-testid="apply-batch"
        onClick={() => {
          applyBatch({
            operations: [
              { type: 'page_title', pageId: 'page_123', value: 'Title 1' },
              { type: 'meta_description', pageId: 'page_123', value: 'Desc 1' },
            ],
          }).catch(() => {
            // Error is already handled by context
          });
        }}
      >
        Apply Batch
      </button>

      <button
        data-testid="add-pending"
        onClick={() => addToPending({
          type: 'page_title',
          pageId: 'page_456',
          value: 'Pending Title',
        })}
      >
        Add Pending
      </button>

      <button
        data-testid="clear-pending"
        onClick={() => clearPending()}
      >
        Clear Pending
      </button>

      <button
        data-testid="clear-error"
        onClick={() => clearError()}
      >
        Clear Error
      </button>

      <button
        data-testid="rollback"
        onClick={() => {
          rollbackBatch('rollback_123').catch(() => {
            // Error is already handled by context
          });
        }}
      >
        Rollback
      </button>
    </div>
  );
}

describe('InsertionContext', () => {
  let mockWebflowInsertion: ReturnType<typeof vi.mocked<WebflowInsertion>>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a properly mocked WebflowInsertion instance
    mockWebflowInsertion = {
      apply: vi.fn().mockResolvedValue({
        success: true,
        data: { _id: 'page_123', title: 'Test Title' }
      }),
      applyBatch: vi.fn().mockResolvedValue({
        success: true,
        results: [
          { success: true, data: {} },
          { success: true, data: {} }
        ],
        succeeded: 2,
        failed: 0,
        rollbackId: 'rollback_123'
      }),
      prepareBatchConfirmation: vi.fn(),
      rollback: vi.fn().mockResolvedValue({
        success: true
      }),
    } as any;

    (WebflowInsertion as any).mockImplementation(() => mockWebflowInsertion);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Provider Setup', () => {
    it('should throw error when used outside provider', () => {
      // Temporarily suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useInsertion must be used within an InsertionProvider');
      
      consoleSpy.mockRestore();
    });

    it('should provide initial state when wrapped in provider', () => {
      renderWithInsertion(<TestComponent />);

      expect(screen.getByTestId('loading-state')).toHaveTextContent('idle');
      expect(screen.getByTestId('error-state')).toHaveTextContent('no-error');
      expect(screen.getByTestId('pending-count')).toHaveTextContent('0');
      expect(screen.getByTestId('history-count')).toHaveTextContent('0');
    });

    it('should initialize with custom WebflowInsertion instance', () => {
      const customInsertion = new WebflowInsertion({} as any);
      
      renderWithInsertion(<TestComponent />, { insertionInstance: customInsertion });

      expect(screen.getByTestId('loading-state')).toHaveTextContent('idle');
    });
  });

  describe('Single Insertion Operations', () => {
    it('should handle successful single insertion', async () => {
      const user = userEvent.setup();
      
      // Mock is already configured for success in beforeEach
      
      renderWithInsertion(<TestComponent />);

      await act(async () => {
        await user.click(screen.getByTestId('apply-single'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('last-result')).toHaveTextContent('success');
      }, { timeout: 5000 });

      expect(mockWebflowInsertion.apply).toHaveBeenCalledWith({
        type: 'page_title',
        pageId: 'page_123',
        value: 'Test Title',
      });

      expect(screen.getByTestId('history-count')).toHaveTextContent('1');
    });

    it('should handle failed single insertion', async () => {
      const user = userEvent.setup();
      const error = new Error('Network error');

      mockWebflowInsertion.apply.mockRejectedValueOnce(error);

      renderWithInsertion(<TestComponent />);

      await act(async () => {
        await user.click(screen.getByTestId('apply-single'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toHaveTextContent('Network error');
      }, { timeout: 5000 });

      expect(screen.getByTestId('last-result')).toHaveTextContent('failed');
    });

    it('should show loading state during insertion', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: WebflowInsertionResult) => void;
      
      const promise = new Promise<WebflowInsertionResult>((resolve) => {
        resolvePromise = resolve;
      });

      mockWebflowInsertion.apply.mockReturnValueOnce(promise);

      renderWithInsertion(<TestComponent />);

      await act(async () => {
        await user.click(screen.getByTestId('apply-single'));
      });

      expect(screen.getByTestId('loading-state')).toHaveTextContent('loading');

      await act(async () => {
        resolvePromise!({ success: true, data: {} });
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('idle');
      }, { timeout: 5000 });
    });

    it('should handle preview insertion', async () => {
      const user = userEvent.setup();
      
      // Override the default mock for preview scenario
      mockWebflowInsertion.apply.mockResolvedValueOnce({
        success: true,
        data: {
          current: { title: 'Old Title' },
          preview: { title: 'Test Title' },
        },
      });

      renderWithInsertion(<TestComponent />);

      await user.click(screen.getByTestId('preview-single'));

      await waitFor(() => {
        expect(screen.getByTestId('last-result')).toHaveTextContent('success');
      });

      expect(mockWebflowInsertion.apply).toHaveBeenCalledWith({
        type: 'page_title',
        pageId: 'page_123',
        value: 'Test Title',
        preview: true,
      });
    });
  });

  describe('Batch Operations', () => {
    it('should handle successful batch insertion', async () => {
      const user = userEvent.setup();
      
      // Override the default mock to simulate progress callbacks
      mockWebflowInsertion.applyBatch.mockImplementation(async (request: any, progressCallback: any) => {
        if (progressCallback) {
          // Start progress
          progressCallback({ current: 1, total: 2, percentage: 50, currentOperation: request.operations[0] });
          await new Promise(resolve => setTimeout(resolve, 10));
          
          // Progress through operations
          progressCallback({ current: 2, total: 2, percentage: 100, currentOperation: request.operations[1] });
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        return {
          success: true,
          results: [
            { success: true, data: {} },
            { success: true, data: {} },
          ],
          succeeded: 2,
          failed: 0,
          rollbackId: 'rollback_123',
        };
      });

      renderWithInsertion(<TestComponent />);

      await user.click(screen.getByTestId('apply-batch'));

      // Check progress updates
      await waitFor(() => {
        expect(screen.queryByTestId('progress')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByTestId('last-result')).toHaveTextContent('success');
      });

      expect(mockWebflowInsertion.applyBatch).toHaveBeenCalledWith(
        {
          operations: [
            { type: 'page_title', pageId: 'page_123', value: 'Title 1' },
            { type: 'meta_description', pageId: 'page_123', value: 'Desc 1' },
          ],
        },
        expect.any(Function)
      );

      expect(screen.getByTestId('history-count')).toHaveTextContent('1');
    });

    it('should handle partial batch failure', async () => {
      const user = userEvent.setup();
      const mockResult: WebflowBatchInsertionResult = {
        success: false,
        results: [
          { success: true, data: {} },
          { success: false, error: { err: 'Validation Error', code: 400, msg: 'Invalid value' } },
        ],
        succeeded: 1,
        failed: 1,
      };

      mockWebflowInsertion.applyBatch.mockResolvedValueOnce(mockResult);

      renderWithInsertion(<TestComponent />);

      await user.click(screen.getByTestId('apply-batch'));

      await waitFor(() => {
        expect(screen.getByTestId('last-result')).toHaveTextContent('failed');
      });

      // Should still add to history even with partial failure
      expect(screen.getByTestId('history-count')).toHaveTextContent('1');
    });

    it('should handle rollback operation', async () => {
      const user = userEvent.setup();
      
      // Mock is already configured for success in beforeEach

      renderWithInsertion(<TestComponent />);

      await user.click(screen.getByTestId('rollback'));

      await waitFor(() => {
        expect(mockWebflowInsertion.rollback).toHaveBeenCalledWith('rollback_123');
      });
    });
  });

  describe('Pending Operations Management', () => {
    it('should add operations to pending list', async () => {
      const user = userEvent.setup();

      renderWithInsertion(<TestComponent />);

      await user.click(screen.getByTestId('add-pending'));

      expect(screen.getByTestId('pending-count')).toHaveTextContent('1');
    });

    it('should prevent duplicate pending operations', async () => {
      const user = userEvent.setup();

      renderWithInsertion(<TestComponent />);

      // Add same operation twice
      await user.click(screen.getByTestId('add-pending'));
      await user.click(screen.getByTestId('add-pending'));

      expect(screen.getByTestId('pending-count')).toHaveTextContent('1');
    });

    it('should clear pending operations', async () => {
      const user = userEvent.setup();

      renderWithInsertion(<TestComponent />);

      await user.click(screen.getByTestId('add-pending'));
      expect(screen.getByTestId('pending-count')).toHaveTextContent('1');

      await user.click(screen.getByTestId('clear-pending'));
      expect(screen.getByTestId('pending-count')).toHaveTextContent('0');
    });

    it('should remove specific operation from pending', async () => {
      const user = userEvent.setup();

      renderWithInsertion(<TestComponent />);

      await user.click(screen.getByTestId('add-pending'));
      expect(screen.getByTestId('pending-count')).toHaveTextContent('1');

      // Access context to remove specific operation
      act(() => {
        const TestRemove = () => {
          const { removeFromPending, pendingOperations } = useInsertion();
          if (pendingOperations.length > 0) {
            removeFromPending(pendingOperations[0]);
          }
          return null;
        };
        
        renderWithInsertion(<TestRemove />);
      });
    });
  });

  describe('Error Management', () => {
    it('should clear errors when requested', async () => {
      const user = userEvent.setup();
      
      // Override the default mock to simulate an error
      mockWebflowInsertion.apply.mockRejectedValueOnce(new Error('Test error'));

      renderWithInsertion(<TestComponent />);

      await user.click(screen.getByTestId('apply-single'));

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toHaveTextContent('Test error');
      });

      await user.click(screen.getByTestId('clear-error'));

      expect(screen.getByTestId('error-state')).toHaveTextContent('no-error');
    });

    it('should auto-clear errors after successful operations', async () => {
      const user = userEvent.setup();
      
      // First operation fails
      mockWebflowInsertion.apply.mockRejectedValueOnce(new Error('Test error'));

      renderWithInsertion(<TestComponent />);

      await user.click(screen.getByTestId('apply-single'));

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toHaveTextContent('Test error');
      });

      // Reset mock to default success behavior for second operation
      mockWebflowInsertion.apply.mockResolvedValueOnce({ 
        success: true, 
        data: { _id: 'page_123', title: 'Test Title' } 
      });

      await user.click(screen.getByTestId('apply-single'));

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toHaveTextContent('no-error');
      });
    });
  });

  describe('History Management', () => {
    it('should track insertion history', async () => {
      const user = userEvent.setup();
      
      mockWebflowInsertion.apply.mockResolvedValue({ success: true, data: {} });

      renderWithInsertion(<TestComponent />);

      await user.click(screen.getByTestId('apply-single'));
      await waitFor(() => {
        expect(screen.getByTestId('history-count')).toHaveTextContent('1');
      });

      await user.click(screen.getByTestId('apply-single'));
      await waitFor(() => {
        expect(screen.getByTestId('history-count')).toHaveTextContent('2');
      });
    });

    it('should limit history size', async () => {
      const user = userEvent.setup();
      
      mockWebflowInsertion.apply.mockResolvedValue({ success: true, data: {} });

      renderWithProviders(
        <InsertionProvider maxHistorySize={2}>
          <TestComponent />
        </InsertionProvider>
      );

      // Add 3 operations
      await user.click(screen.getByTestId('apply-single'));
      await user.click(screen.getByTestId('apply-single'));
      await user.click(screen.getByTestId('apply-single'));

      await waitFor(() => {
        expect(screen.getByTestId('history-count')).toHaveTextContent('2');
      });
    });

    it('should include timestamps in history', async () => {
      const user = userEvent.setup();
      
      mockWebflowInsertion.apply.mockResolvedValue({ success: true, data: {} });

      const TestWithHistory = () => {
        const { insertionHistory } = useInsertion();
        
        return (
          <div data-testid="history-timestamp">
            {insertionHistory.length > 0 ? insertionHistory[0].timestamp : 'no-history'}
          </div>
        );
      };

      renderWithInsertion(
        <>
          <TestComponent />
          <TestWithHistory />
        </>
      );

      await user.click(screen.getByTestId('apply-single'));

      await waitFor(() => {
        expect(screen.getByTestId('history-timestamp')).not.toHaveTextContent('no-history');
      });
    });
  });

  describe('Progress Tracking', () => {
    it('should track batch operation progress', async () => {
      const user = userEvent.setup();
      
      mockWebflowInsertion.applyBatch.mockImplementation(async (request: any, callback: any) => {
        // Call the callback synchronously to ensure progress is displayed
        if (callback) {
          callback({ current: 1, total: 2, percentage: 50, currentOperation: request.operations[0] });
        }
        
        // Return after a small delay
        await new Promise(resolve => setTimeout(resolve, 50));
        
        return { 
          success: true, 
          results: [
            { success: true, data: {} },
            { success: true, data: {} }
          ], 
          succeeded: 2, 
          failed: 0,
          rollbackId: 'rollback_123' 
        };
      });

      renderWithInsertion(<TestComponent />);

      await user.click(screen.getByTestId('apply-batch'));

      await waitFor(() => {
        expect(screen.getByTestId('progress')).toHaveTextContent('1/2 - 50%');
      }, { timeout: 2000 });
    });

    it('should clear progress after completion', async () => {
      const user = userEvent.setup();
      
      mockWebflowInsertion.applyBatch.mockImplementation(async (request: any, callback: any) => {
        if (callback) {
          callback({ current: 2, total: 2, percentage: 100, currentOperation: request.operations[1] });
        }
        return { success: true, results: [], succeeded: 2, failed: 0 };
      });

      renderWithInsertion(<TestComponent />);

      await user.click(screen.getByTestId('apply-batch'));

      await waitFor(() => {
        expect(screen.queryByTestId('progress')).not.toBeInTheDocument();
      });
    });
  });
});