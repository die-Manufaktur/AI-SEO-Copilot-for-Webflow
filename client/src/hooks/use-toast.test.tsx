import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast, toast, reducer, type ToasterToast } from './use-toast';
import { ToastAction } from '../components/ui/toast';

describe('useToast Hook', () => {
  beforeEach(() => {
    // Clear any existing toasts before each test
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.dismiss();
    });
  });

  describe('useToast hook', () => {
    it('provides toast function and toasts array', () => {
      const { result } = renderHook(() => useToast());
      
      expect(typeof result.current.toast).toBe('function');
      expect(Array.isArray(result.current.toasts)).toBe(true);
      expect(typeof result.current.dismiss).toBe('function');
    });

    it('starts with empty toasts array', () => {
      const { result } = renderHook(() => useToast());
      expect(result.current.toasts).toHaveLength(0);
    });

    it('adds toast when toast function is called', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({
          title: 'Test Toast',
          description: 'Test Description'
        });
      });
      
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('Test Toast');
      expect(result.current.toasts[0].description).toBe('Test Description');
    });

    it('respects TOAST_LIMIT of 1', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({ title: 'Toast 1' });
        result.current.toast({ title: 'Toast 2' });
      });
      
      // Should only have 1 toast due to TOAST_LIMIT = 1
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].id).toBeDefined();
      // The newest toast should be shown (Toast 2)
      expect(result.current.toasts[0].title).toBe('Toast 2');
    });

    it('generates unique IDs for toasts', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({ title: 'Toast 1' });
      });
      
      const firstId = result.current.toasts[0].id;
      
      act(() => {
        result.current.toast({ title: 'Toast 2' });
      });
      
      // Due to TOAST_LIMIT = 1, we still only have 1 toast, but with a different ID
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].id).toBeDefined();
      expect(result.current.toasts[0].id).not.toBe(firstId);
    });

    it('can dismiss specific toast by ID', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({ title: 'Toast 1' });
      });
      
      const toastId = result.current.toasts[0].id;
      
      act(() => {
        result.current.dismiss(toastId);
      });
      
      // Toast should be marked as closed (open: false) but still in array initially
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].open).toBe(false);
    });

    it('can dismiss all toasts when no ID provided', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({ title: 'Toast 1' });
      });
      
      expect(result.current.toasts).toHaveLength(1);
      
      act(() => {
        result.current.dismiss();
      });
      
      // Toast should be marked as closed but still in array initially
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].open).toBe(false);
    });

    it('handles toast variants correctly', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({
          title: 'Success Toast',
          variant: 'default'
        });
      });
      
      expect(result.current.toasts[0].variant).toBe('default');
      
      // Due to TOAST_LIMIT = 1, adding another toast replaces the first
      act(() => {
        result.current.toast({
          title: 'Error Toast',
          variant: 'destructive'
        });
      });
      
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].variant).toBe('destructive');
      expect(result.current.toasts[0].title).toBe('Error Toast');
    });
  });

  describe('toast function (standalone)', () => {
    it('can be called directly', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        toast({
          title: 'Standalone Toast',
          description: 'Called directly'
        });
      });
      
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('Standalone Toast');
    });
  });

  describe('reducer', () => {
    const mockToast: ToasterToast = {
      id: 'test-id',
      title: 'Test Toast',
      description: 'Test Description',
      variant: 'default'
    };

    it('handles ADD_TOAST action', () => {
      const initialState = { toasts: [] };
      const action = { type: 'ADD_TOAST' as const, toast: mockToast };
      
      const newState = reducer(initialState, action);
      
      expect(newState.toasts).toHaveLength(1);
      expect(newState.toasts[0]).toEqual(mockToast);
    });

    it('handles UPDATE_TOAST action', () => {
      const initialState = { toasts: [mockToast] };
      const updatedToast = { ...mockToast, title: 'Updated Title' };
      const action = { 
        type: 'UPDATE_TOAST' as const, 
        toast: updatedToast 
      };
      
      const newState = reducer(initialState, action);
      
      expect(newState.toasts[0].title).toBe('Updated Title');
    });

    it('handles DISMISS_TOAST action with specific ID', () => {
      const toast1 = { ...mockToast, id: 'toast-1' };
      const toast2 = { ...mockToast, id: 'toast-2' };
      const initialState = { toasts: [toast1, toast2] };
      const action = { 
        type: 'DISMISS_TOAST' as const, 
        toastId: 'toast-1' 
      };
      
      const newState = reducer(initialState, action);
      
      // DISMISS_TOAST sets open: false but doesn't remove the toast
      expect(newState.toasts).toHaveLength(2);
      expect(newState.toasts.find(t => t.id === 'toast-1')?.open).toBe(false);
      expect(newState.toasts.find(t => t.id === 'toast-2')?.open).toBeUndefined(); // unchanged
    });

    it('handles DISMISS_TOAST action without ID (dismisses all)', () => {
      const toast1 = { ...mockToast, id: 'toast-1' };
      const toast2 = { ...mockToast, id: 'toast-2' };
      const initialState = { toasts: [toast1, toast2] };
      const action = { 
        type: 'DISMISS_TOAST' as const, 
        toastId: undefined 
      };
      
      const newState = reducer(initialState, action);
      
      // DISMISS_TOAST sets open: false for all toasts but doesn't remove them
      expect(newState.toasts).toHaveLength(2);
      expect(newState.toasts[0].open).toBe(false);
      expect(newState.toasts[1].open).toBe(false);
    });

    it('handles REMOVE_TOAST action', () => {
      const toast1 = { ...mockToast, id: 'toast-1' };
      const toast2 = { ...mockToast, id: 'toast-2' };
      const initialState = { toasts: [toast1, toast2] };
      const action = { 
        type: 'REMOVE_TOAST' as const, 
        toastId: 'toast-1' 
      };
      
      const newState = reducer(initialState, action);
      
      expect(newState.toasts).toHaveLength(1);
      expect(newState.toasts[0].id).toBe('toast-2');
    });

    it('handles REMOVE_TOAST action without ID (removes all)', () => {
      const toast1 = { ...mockToast, id: 'toast-1' };
      const toast2 = { ...mockToast, id: 'toast-2' };
      const initialState = { toasts: [toast1, toast2] };
      const action = { 
        type: 'REMOVE_TOAST' as const, 
        toastId: undefined 
      };
      
      const newState = reducer(initialState, action);
      
      expect(newState.toasts).toHaveLength(0);
    });

    it('returns undefined for unknown action types', () => {
      const initialState = { toasts: [mockToast] };
      const action = { type: 'UNKNOWN_ACTION' } as any;
      
      const newState = reducer(initialState, action);
      
      // The reducer has no default case, so it returns undefined for unknown actions
      expect(newState).toBeUndefined();
    });
  });

  describe('toast limits and behavior', () => {
    it('respects TOAST_LIMIT of 1', () => {
      const { result } = renderHook(() => useToast());
      
      // Add multiple toasts - only the last one should remain due to TOAST_LIMIT = 1
      act(() => {
        for (let i = 0; i < 5; i++) {
          toast({ title: `Toast ${i}` });
        }
      });
      
      // Should only have 1 toast due to TOAST_LIMIT = 1
      expect(result.current.toasts.length).toBe(1);
      expect(result.current.toasts[0].title).toBe('Toast 4'); // Last toast added
    });

    it('newest toast replaces oldest when limit is exceeded', () => {
      const { result } = renderHook(() => useToast());
      
      // Add several toasts
      act(() => {
        toast({ title: 'First Toast' });
        toast({ title: 'Second Toast' });
        toast({ title: 'Third Toast' });
      });
      
      // Only the latest toast should remain
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('Third Toast');
    });
  });

  describe('toast with actions', () => {
    it('can include action buttons', () => {
      const { result } = renderHook(() => useToast());
      const mockAction = (
        <ToastAction altText="Undo action" onClick={() => {}}>
          Undo
        </ToastAction>
      );
      
      act(() => {
        result.current.toast({
          title: 'Action Toast',
          action: mockAction
        });
      });
      
      expect(result.current.toasts[0].action).toEqual(mockAction);
    });
  });

  describe('toast auto-configuration', () => {
    it('sets open to true by default', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({
          title: 'Test Toast'
        });
      });
      
      expect(result.current.toasts[0].open).toBe(true);
    });

    it('includes onOpenChange handler', () => {
      const { result } = renderHook(() => useToast());
      
      act(() => {
        result.current.toast({
          title: 'Test Toast'
        });
      });
      
      expect(typeof result.current.toasts[0].onOpenChange).toBe('function');
    });
  });
});