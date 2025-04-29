import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMobile } from './use-mobile';

describe('useMobile Hook', () => {
  // Store original window properties to restore later
  let originalInnerWidth: number;
  
  beforeEach(() => {
    // Save original value
    originalInnerWidth = window.innerWidth;
    
    // Mock addEventListener and removeEventListener
    vi.spyOn(window, 'addEventListener');
    vi.spyOn(window, 'removeEventListener');
  });
  
  afterEach(() => {
    // Clean up all mocks
    vi.restoreAllMocks();
    
    // Restore original window properties
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: originalInnerWidth
    });
  });
  
  it('should initialize as mobile when width is less than 768px', () => {
    // Set window width to mobile size
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 767
    });
    
    const { result } = renderHook(() => useMobile());
    expect(result.current).toBe(true);
  });
  
  it('should initialize as desktop when width is 768px or greater', () => {
    // Set window width to desktop size
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 768
    });
    
    const { result } = renderHook(() => useMobile());
    expect(result.current).toBe(false);
  });
  
  it('should add event listener for resize on mount', () => {
    renderHook(() => useMobile());
    
    expect(window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });
  
  it('should remove event listener on unmount', () => {
    const { unmount } = renderHook(() => useMobile());
    unmount();
    
    expect(window.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });
  
  it('should update value when window is resized', async () => {
    // Start with desktop size
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1024
    });
    
    const { result, rerender } = renderHook(() => useMobile());
    expect(result.current).toBe(false);
    
    // Capture the resize handler
    const resizeHandler = vi.mocked(window.addEventListener).mock.calls.find(
      call => call[0] as unknown as string === 'resize'
    )?.[1] as Function;
    
    // Change to mobile size and trigger resize
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 500
    });
    
    // Call the resize handler directly
    resizeHandler();
    rerender();
    
    expect(result.current).toBe(true);
    
    // Change back to desktop size
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1024
    });
    
    // Call the resize handler directly
    resizeHandler();
    rerender();
    
    expect(result.current).toBe(false);
  });
  
  it('should handle multiple instances independently', () => {
    // Set window width to desktop size
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1024
    });
    
    const { result: result1 } = renderHook(() => useMobile());
    const { result: result2 } = renderHook(() => useMobile());
    
    expect(result1.current).toBe(false);
    expect(result2.current).toBe(false);
    
    // Both hooks should have added their own event listeners
    expect(window.addEventListener).toHaveBeenCalledTimes(2);
  });
  
  it('should handle edge case at exactly 768px (not mobile)', () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 768
    });
    
    const { result } = renderHook(() => useMobile());
    expect(result.current).toBe(false);
  });
  
  it('should handle edge case at 767px (mobile)', () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 767
    });
    
    const { result } = renderHook(() => useMobile());
    expect(result.current).toBe(true);
  });
});