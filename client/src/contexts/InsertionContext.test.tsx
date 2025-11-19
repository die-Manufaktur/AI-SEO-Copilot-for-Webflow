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

// Create a shared mock instance
const mockWebflowInsertionInstance = {
  apply: vi.fn(),
  applyBatch: vi.fn(),
  prepareBatchConfirmation: vi.fn(),
  rollback: vi.fn(),
};

// Mock WebflowInsertion
vi.mock('../lib/webflowInsertion', () => {
  return {
    WebflowInsertion: vi.fn().mockImplementation(() => mockWebflowInsertionInstance),
  };
});

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

// Mock the useAuth hook to return a valid token
vi.mock('./AuthContext', () => {
  const mockAuthContext = {
    token: {
      access_token: 'test-token',
      refresh_token: 'test-refresh-token',
      scope: 'sites:read sites:write cms:read cms:write pages:read pages:write',
      expires_in: 3600,
      expires_at: Date.now() + 3600000
    },
    isAuthenticated: true,
    loading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn()
  };

  return {
    ...vi.importActual('./AuthContext'),
    useAuth: () => mockAuthContext,
    AuthProvider: ({ children }: { children: React.ReactNode }) => {
      const AuthContext = React.createContext(mockAuthContext);
      return React.createElement(AuthContext.Provider, { value: mockAuthContext }, children);
    }
  };
});

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

// Helper to render with insertion provider using existing test infrastructure
const renderWithInsertion = (ui: React.ReactElement, options?: { insertionInstance?: WebflowInsertion }) => {
  // Use the existing renderWithProviders helper which already includes AuthProvider
  const TestWrapperWithInsertion = ({ children }: { children: React.ReactNode }) => {
    return (
      <InsertionProvider insertionInstance={options?.insertionInstance || mockWebflowInsertionInstance as any}>
        {children}
      </InsertionProvider>
    );
  };

  return renderWithProviders(
    React.createElement(TestWrapperWithInsertion, { children: ui })
  );
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
        data-testid="preview-single"
        onClick={() => {
          applyInsertion({
            type: 'page_title',
            pageId: 'page_123',
            value: 'Test Title',
            preview: true,
          }).catch(() => {
            // Error is already handled by context
          });
        }}
      >
        Preview Single
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
  beforeEach(async () => {
    // Clear all previous calls and state
    vi.clearAllMocks();
    vi.mocked(WebflowInsertion).mockClear();
    
    // Reset all mock functions completely to prevent cross-test contamination
    Object.keys(mockWebflowInsertionInstance).forEach(key => {
      if (typeof mockWebflowInsertionInstance[key as keyof typeof mockWebflowInsertionInstance] === 'function') {
        (mockWebflowInsertionInstance[key as keyof typeof mockWebflowInsertionInstance] as any).mockReset();
      }
    });
    
    // Configure default implementations for all tests
    mockWebflowInsertionInstance.apply.mockImplementation(async (request) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return {
        success: true,
        data: { _id: request.pageId || 'page_123', title: 'Test Title' }
      };
    });
    
    mockWebflowInsertionInstance.applyBatch.mockImplementation(async (request, progressCallback) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Call progress callback if provided
      if (progressCallback && typeof progressCallback === 'function') {
        progressCallback({ current: 1, total: request.operations.length, percentage: 50, currentOperation: request.operations[0] });
        await new Promise(resolve => setTimeout(resolve, 5));
        if (request.operations.length > 1) {
          progressCallback({ current: request.operations.length, total: request.operations.length, percentage: 100, currentOperation: request.operations[request.operations.length - 1] });
        }
      }
      
      return {
        success: true,
        results: request.operations.map(() => ({ success: true, data: {} })),
        succeeded: request.operations.length,
        failed: 0,
        rollbackId: 'rollback_123'
      };
    });
    
    mockWebflowInsertionInstance.prepareBatchConfirmation.mockImplementation(async () => ({}));
    
    mockWebflowInsertionInstance.rollback.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { success: true };
    });
  });

  afterEach(() => {
    // Clean up all mocks and timers
    vi.clearAllMocks();
    vi.clearAllTimers();
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
      renderWithInsertion(<TestComponent />, { insertionInstance: mockWebflowInsertionInstance as any });

      expect(screen.getByTestId('loading-state')).toHaveTextContent('idle');
    });
  });

  describe('Single Insertion Operations', () => {
    it('should handle successful single insertion', async () => {
      const user = userEvent.setup();
      
      renderWithInsertion(<TestComponent />);

      // Click the apply button
      await user.click(screen.getByTestId('apply-single'));

      // Wait for the loading state to appear and then disappear
      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('idle');
      }, { timeout: 1000 });

      // Check the result
      await waitFor(() => {
        expect(screen.getByTestId('last-result')).toHaveTextContent('success');
      }, { timeout: 1000 });

      // Verify the mock was called correctly
      expect(mockWebflowInsertionInstance.apply).toHaveBeenCalledWith({
        type: 'page_title',
        pageId: 'page_123',
        value: 'Test Title',
      });

      // Check that history was updated
      expect(screen.getByTestId('history-count')).toHaveTextContent('1');
    });

    it('should handle failed single insertion', async () => {
      const user = userEvent.setup();
      const error = new Error('Network error');

      // Override the default implementation for this test
      mockWebflowInsertionInstance.apply.mockImplementationOnce(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        throw error;
      });

      renderWithInsertion(<TestComponent />);

      // Click the apply button
      await user.click(screen.getByTestId('apply-single'));

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toHaveTextContent('Network error');
      }, { timeout: 1000 });

      // Check that result shows failed
      await waitFor(() => {
        expect(screen.getByTestId('last-result')).toHaveTextContent('failed');
      }, { timeout: 1000 });

      // Verify loading state returns to idle
      expect(screen.getByTestId('loading-state')).toHaveTextContent('idle');
    });

    it('should show loading state during insertion', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: WebflowInsertionResult) => void;
      
      const promise = new Promise<WebflowInsertionResult>((resolve) => {
        resolvePromise = resolve;
      });

      // Override the mock to return a controllable promise
      mockWebflowInsertionInstance.apply.mockImplementationOnce(() => promise);

      renderWithInsertion(<TestComponent />);

      // Start the operation
      await user.click(screen.getByTestId('apply-single'));

      // Check loading state appears immediately
      expect(screen.getByTestId('loading-state')).toHaveTextContent('loading');

      // Resolve the promise
      await act(async () => {
        resolvePromise!({ success: true, data: { _id: 'page_123', title: 'Test Title' } });
      });

      // Wait for loading state to return to idle
      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('idle');
      }, { timeout: 1000 });
    });

    it('should handle preview insertion', async () => {
      const user = userEvent.setup();
      
      // Override the default mock for preview scenario
      mockWebflowInsertionInstance.apply.mockImplementationOnce(async (request) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return {
          success: true,
          data: {
            current: { title: 'Old Title' },
            preview: { title: request.value },
          },
        };
      });

      renderWithInsertion(<TestComponent />);

      await user.click(screen.getByTestId('preview-single'));

      await waitFor(() => {
        expect(screen.getByTestId('last-result')).toHaveTextContent('success');
      }, { timeout: 1000 });

      expect(mockWebflowInsertionInstance.apply).toHaveBeenCalledWith({
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
      
      // The default mock in beforeEach already handles progress callbacks correctly
      
      renderWithInsertion(<TestComponent />);

      await user.click(screen.getByTestId('apply-batch'));

      // Wait for the operation to complete
      await waitFor(() => {
        expect(screen.getByTestId('last-result')).toHaveTextContent('success');
      }, { timeout: 1000 });

      // Verify the mock was called correctly
      expect(mockWebflowInsertionInstance.applyBatch).toHaveBeenCalledWith(
        {
          operations: [
            { type: 'page_title', pageId: 'page_123', value: 'Title 1' },
            { type: 'meta_description', pageId: 'page_123', value: 'Desc 1' },
          ],
        },
        expect.any(Function)
      );

      // Check that history was updated
      expect(screen.getByTestId('history-count')).toHaveTextContent('1');
      
      // Verify loading state returns to idle
      expect(screen.getByTestId('loading-state')).toHaveTextContent('idle');
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

      mockWebflowInsertionInstance.applyBatch.mockResolvedValueOnce(mockResult);

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

      // Wait for rollback to complete
      await waitFor(() => {
        expect(mockWebflowInsertionInstance.rollback).toHaveBeenCalledWith('rollback_123');
      }, { timeout: 1000 });

      // Verify loading state returns to idle
      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('idle');
      }, { timeout: 1000 });
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
      mockWebflowInsertionInstance.apply.mockImplementationOnce(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        throw new Error('Test error');
      });

      renderWithInsertion(<TestComponent />);

      await user.click(screen.getByTestId('apply-single'));

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toHaveTextContent('Test error');
      }, { timeout: 1000 });

      // Clear the error
      await user.click(screen.getByTestId('clear-error'));

      // Verify error is cleared
      expect(screen.getByTestId('error-state')).toHaveTextContent('no-error');
    });

    it('should auto-clear errors after successful operations', async () => {
      const user = userEvent.setup();
      
      // First operation fails, then success for subsequent calls
      let callCount = 0;
      mockWebflowInsertionInstance.apply.mockImplementation(async () => {
        callCount++;
        await new Promise(resolve => setTimeout(resolve, 10));
        
        if (callCount === 1) {
          throw new Error('Test error');
        }
        
        return {
          success: true,
          data: { _id: 'page_123', title: 'Test Title' }
        };
      });

      renderWithInsertion(<TestComponent />);

      await user.click(screen.getByTestId('apply-single'));

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toHaveTextContent('Test error');
      }, { timeout: 1000 });

      // Second operation should succeed and clear the error
      await user.click(screen.getByTestId('apply-single'));

      // Wait for error to be auto-cleared after successful operation
      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toHaveTextContent('no-error');
      }, { timeout: 1000 });

      // Verify success result
      expect(screen.getByTestId('last-result')).toHaveTextContent('success');
    });
  });

  describe('History Management', () => {
    it('should track insertion history', async () => {
      const user = userEvent.setup();
      
      mockWebflowInsertionInstance.apply.mockResolvedValue({ success: true, data: {} });

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
      
      mockWebflowInsertionInstance.apply.mockResolvedValue({ success: true, data: {} });

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
      
      mockWebflowInsertionInstance.apply.mockResolvedValue({ success: true, data: {} });

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
      
      // The default implementation in beforeEach already handles progress callbacks correctly
      // We don't need to override it, just verify it works

      renderWithInsertion(<TestComponent />);

      await user.click(screen.getByTestId('apply-batch'));

      // Wait for the operation to complete
      await waitFor(() => {
        expect(screen.getByTestId('last-result')).toHaveTextContent('success');
      }, { timeout: 1000 });

      // Verify the batch operation was called with a progress callback
      expect(mockWebflowInsertionInstance.applyBatch).toHaveBeenCalledWith(
        {
          operations: [
            { type: 'page_title', pageId: 'page_123', value: 'Title 1' },
            { type: 'meta_description', pageId: 'page_123', value: 'Desc 1' },
          ],
        },
        expect.any(Function) // Progress callback function
      );

      // Verify history was updated
      expect(screen.getByTestId('history-count')).toHaveTextContent('1');
    });

    it('should clear progress after completion', async () => {
      const user = userEvent.setup();
      
      mockWebflowInsertionInstance.applyBatch.mockImplementation(async (request: any, callback: any) => {
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