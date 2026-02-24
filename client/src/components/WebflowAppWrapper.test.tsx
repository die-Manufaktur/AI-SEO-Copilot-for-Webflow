import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import WebflowAppWrapper from './WebflowAppWrapper';

// Mock the createLogger utility
const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

vi.mock('../lib/utils', () => ({
  createLogger: vi.fn(() => mockLogger),
}));

// Mock global webflow
const mockWebflow = {
  setExtensionSize: vi.fn(),
};

describe('WebflowAppWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Reset global webflow
    Object.defineProperty(global, 'webflow', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders children correctly', () => {
    render(
      <WebflowAppWrapper>
        <div data-testid="test-child">Test Child</div>
      </WebflowAppWrapper>
    );

    expect(screen.getByTestId('webflow-app-wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });

  it('has correct CSS classes applied', () => {
    render(
      <WebflowAppWrapper>
        <div>Test</div>
      </WebflowAppWrapper>
    );

    const wrapper = screen.getByTestId('webflow-app-wrapper');
    expect(wrapper).toHaveClass('bg-background', 'text-text1');
  });

  it('sets extension size immediately when webflow API is available', () => {
    Object.defineProperty(global, 'webflow', {
      value: mockWebflow,
      writable: true,
      configurable: true,
    });

    render(
      <WebflowAppWrapper>
        <div>Test</div>
      </WebflowAppWrapper>
    );

    expect(mockWebflow.setExtensionSize).toHaveBeenCalledWith({
      width: 715,
      height: 800,
    });
  });

  it('polls for webflow API when not immediately available', () => {
    // webflow is undefined — simulates Designer not having injected it yet
    render(
      <WebflowAppWrapper>
        <div>Test</div>
      </WebflowAppWrapper>
    );

    expect(mockWebflow.setExtensionSize).not.toHaveBeenCalled();

    // Simulate the Designer injecting webflow after 300ms
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(mockWebflow.setExtensionSize).not.toHaveBeenCalled();

    Object.defineProperty(global, 'webflow', {
      value: mockWebflow,
      writable: true,
      configurable: true,
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(mockWebflow.setExtensionSize).toHaveBeenCalledWith({
      width: 715,
      height: 800,
    });
  });

  it('logs warning after 10s timeout when webflow never becomes available', () => {
    render(
      <WebflowAppWrapper>
        <div>Test</div>
      </WebflowAppWrapper>
    );

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(mockLogger.warn).toHaveBeenCalledWith(
      'webflow.setExtensionSize not available after 10s'
    );
    expect(mockWebflow.setExtensionSize).not.toHaveBeenCalled();
  });

  it('handles errors when setting extension size', () => {
    const mockWebflowWithError = {
      setExtensionSize: vi.fn(() => {
        throw new Error('Extension size error');
      }),
    };

    Object.defineProperty(global, 'webflow', {
      value: mockWebflowWithError,
      writable: true,
      configurable: true,
    });

    render(
      <WebflowAppWrapper>
        <div>Test</div>
      </WebflowAppWrapper>
    );

    expect(mockWebflowWithError.setExtensionSize).toHaveBeenCalledWith({
      width: 715,
      height: 800,
    });
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to set extension size:',
      expect.any(Error)
    );
  });

  it('handles webflow object without setExtensionSize method', () => {
    Object.defineProperty(global, 'webflow', {
      value: {},
      writable: true,
      configurable: true,
    });

    render(
      <WebflowAppWrapper>
        <div>Test</div>
      </WebflowAppWrapper>
    );

    // Should start polling since setExtensionSize is missing
    expect(mockWebflow.setExtensionSize).not.toHaveBeenCalled();
  });

  it('renders with correct id attribute', () => {
    render(
      <WebflowAppWrapper>
        <div>Test</div>
      </WebflowAppWrapper>
    );

    const wrapper = screen.getByTestId('webflow-app-wrapper');
    expect(wrapper).toHaveAttribute('id', 'webflow-app-wrapper');
  });

  it('cleans up interval and timeout on unmount', () => {
    const { unmount } = render(
      <WebflowAppWrapper>
        <div>Test</div>
      </WebflowAppWrapper>
    );

    // Unmount while polling is still active
    unmount();

    // Advance past timeout — should not throw or log (cleanup ran)
    act(() => {
      vi.advanceTimersByTime(11_000);
    });

    // If cleanup didn't work, the warn would fire — but it shouldn't
    // because the component unmounted and cleanup cleared the timers
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });
});
