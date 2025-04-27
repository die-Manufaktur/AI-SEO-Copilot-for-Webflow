import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react'; // Note change from react-hooks to react
import { useToast, toast, reducer } from './use-toast';
import type { ToastProps } from '../components/ui/toast';
import { createMockToastState, createMockToast } from "@/__mocks__/toast-mock";

// Declare global variables used in tests
declare global {
  var dispatch: (action: any) => void;
  var memoryState: { toasts: any[] };
  var addToRemoveQueue: (toastId: string) => void;
}

describe('useToast Hook', () => {
  beforeEach(() => {
    // Clear any mocks
    vi.clearAllMocks();
    
    // Reset internal state by directly manipulating memoryState through dispatch
    // This avoids using the hook in setup
    const originalDispatch = global.dispatch;
    try {
      global.dispatch = vi.fn((action) => {
        if (action.type === 'REMOVE_TOAST' && action.toastId === undefined) {
          global.memoryState = { toasts: [] };
        }
      });
      
      // Call the dismiss function directly to reset the state
      global.dispatch({ type: 'REMOVE_TOAST' });
      
    } finally {
      global.dispatch = originalDispatch;
    }
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with empty toasts array', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it('should add a toast when toast() is called', async () => {
    const { result } = renderHook(() => useToast());
    
    await act(async () => {
      result.current.toast({
        title: 'Test Title',
        description: 'Test Description',
        variant: 'default',
      });
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe('Test Title');
    expect(result.current.toasts[0].description).toBe('Test Description');
    expect(result.current.toasts[0].variant).toBe('default');
    expect(result.current.toasts[0].open).toBe(true);
  });

  it('should respect the TOAST_LIMIT constant', async () => {
    const { result } = renderHook(() => useToast());
    
    await act(async () => {
      result.current.toast({ title: 'Toast 1' });
      result.current.toast({ title: 'Toast 2' });
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe('Toast 2');
  });

  it('should update an existing toast', async () => {
    const { result } = renderHook(() => useToast());
    let toastId: string;
    
    await act(async () => {
      const response = result.current.toast({ 
        title: 'Original Title', 
        description: 'Original Description' 
      });
      toastId = response.id;
    });
    
    await act(async () => {
      const toastToUpdate = result.current.toasts.find(t => t.id === toastId);
      if (toastToUpdate) {
        result.current.toast({
          id: toastId,
          title: 'Updated Title',
          description: 'Updated Description'
        } as ToastProps);
      }
    });
    
    expect(result.current.toasts[0].title).toBe('Updated Title');
    expect(result.current.toasts[0].description).toBe('Updated Description');
  });

  it('should dismiss a toast by id', async () => {
    const { result } = renderHook(() => useToast());
    let toastId: string;
    
    vi.useFakeTimers();
    
    await act(async () => {
      const response = result.current.toast({ title: 'Test Toast' });
      toastId = response.id;
    });
    
    expect(result.current.toasts[0].open).toBe(true);
    
    await act(async () => {
      result.current.dismiss(toastId);
    });
    
    expect(result.current.toasts[0].open).toBe(false);
  });

  it('should dismiss all toasts when dismiss() is called without id', async () => {
    const { result } = renderHook(() => useToast());
    
    vi.useFakeTimers();
    
    await act(async () => {
      result.current.toast({ title: 'Toast 1' });
    });
    
    expect(result.current.toasts[0].open).toBe(true);
    
    await act(async () => {
      result.current.dismiss(); // Dismiss all
    });
    
    expect(result.current.toasts[0].open).toBe(false);
  });

  it('should remove a toast after TOAST_REMOVE_DELAY', async () => {
    const { result } = renderHook(() => useToast());
    let toastId: string;
    
    vi.useFakeTimers();
    
    await act(async () => {
      const response = result.current.toast({ title: 'Test Toast' });
      toastId = response.id;
    });
    
    expect(result.current.toasts).toHaveLength(1);
    
    await act(async () => {
      result.current.dismiss(toastId);
    });
    
    // Fast-forward time past the TOAST_REMOVE_DELAY (1000000ms)
    await act(async () => {
      vi.advanceTimersByTime(1000001);
    });
    
    expect(result.current.toasts).toHaveLength(0);
  });

  it('should close a toast when onOpenChange is triggered with false', async () => {
    const { result } = renderHook(() => useToast());
    
    await act(async () => {
      result.current.toast({ title: 'Test Toast' });
    });
    
    expect(result.current.toasts[0].open).toBe(true);
    
    await act(async () => {
      // Simulate the toast being closed via its UI
      result.current.toasts[0].onOpenChange?.(false);
    });
    
    expect(result.current.toasts[0].open).toBe(false);
  });
});

// Test the reducer separately
describe('toast reducer', () => {
  it('should add a toast with ADD_TOAST action', () => {
    const initialState = { toasts: [] };
    const action = {
      type: 'ADD_TOAST' as const,
      toast: {
        id: '1',
        title: 'Test Toast',
        open: true
      }
    };
    
    const newState = reducer(initialState, action);
    
    expect(newState.toasts).toHaveLength(1);
    expect(newState.toasts[0].title).toBe('Test Toast');
  });

  it('should update a toast with UPDATE_TOAST action', () => {
    const initialState = { 
      toasts: [
        {
          id: '1',
          title: 'Original Title',
          description: 'Original Description',
          open: true
        }
      ] 
    };
    
    const action = {
      type: 'UPDATE_TOAST' as const,
      toast: {
        id: '1',
        title: 'Updated Title'
      }
    };
    
    const newState = reducer(initialState, action);
    
    expect(newState.toasts[0].title).toBe('Updated Title');
    expect(newState.toasts[0].description).toBe('Original Description'); // Unchanged
  });

  it('should mark a toast as closed with DISMISS_TOAST action', () => {
    // Create mock state using the utility
    const initialState = createMockToastState([
      createMockToast({ id: '1', title: 'Toast 1' }),
      createMockToast({ id: '2', title: 'Toast 2' })
    ]);
    
    const action = {
      type: 'DISMISS_TOAST' as const,
      toastId: '1'
    };
    
    // Rather than mocking the entire module (which causes circular dependencies)
    // Create a local spy for addToRemoveQueue
    const addToRemoveQueueSpy = vi.fn();
    // Use type assertion to fix the TypeScript error
    const originalAddToQueue = (globalThis as any).addToRemoveQueue;
    (globalThis as any).addToRemoveQueue = addToRemoveQueueSpy;
    
    try {
      const newState = reducer(initialState, action);
      
      expect(newState.toasts[0].open).toBe(false);
      expect(newState.toasts[1].open).toBe(true);
    } finally {
      // Restore the original function
      (globalThis as any).addToRemoveQueue = originalAddToQueue;
    }
  });

  it('should remove a toast with REMOVE_TOAST action', () => {
    const initialState = { 
      toasts: [
        { id: '1', title: 'Toast 1', open: true },
        { id: '2', title: 'Toast 2', open: true }
      ] 
    };
    
    const action = {
      type: 'REMOVE_TOAST' as const,
      toastId: '1'
    };
    
    const newState = reducer(initialState, action);
    
    expect(newState.toasts).toHaveLength(1);
    expect(newState.toasts[0].id).toBe('2');
  });

  it('should remove all toasts when REMOVE_TOAST action has no toastId', () => {
    const initialState = { 
      toasts: [
        { id: '1', title: 'Toast 1', open: true },
        { id: '2', title: 'Toast 2', open: true }
      ] 
    };
    
    const action = {
      type: 'REMOVE_TOAST' as const
    };
    
    const newState = reducer(initialState, action);
    
    expect(newState.toasts).toHaveLength(0);
  });
});

// Test the standalone toast function
describe('toast function', () => {
  it('should return methods for controlling the toast', () => {
    // Mock dispatch to prevent side effects
    const originalDispatch = global.dispatch;
    global.dispatch = vi.fn();
    
    try {
      const result = toast({ title: 'Test Toast' });
      
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('dismiss');
      expect(result).toHaveProperty('update');
      expect(typeof result.id).toBe('string');
      expect(typeof result.dismiss).toBe('function');
      expect(typeof result.update).toBe('function');
    } finally {
      global.dispatch = originalDispatch;
    }
  });
});