import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
    
    // Reset global webflow
    Object.defineProperty(global, 'webflow', {
      value: undefined,
      writable: true,
      configurable: true,
    });
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
    expect(wrapper).toHaveClass('bg-background', 'text-text1', 'min-h-screen');
  });

  it('sets extension size when webflow API is available', () => {
    // Mock webflow as available
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
      height: 1009,
    });
  });

  it('logs warning when webflow API is not available', () => {
    // webflow is undefined by default from beforeEach
    render(
      <WebflowAppWrapper>
        <div>Test</div>
      </WebflowAppWrapper>
    );

    expect(mockLogger.warn).toHaveBeenCalledWith('webflow.setExtensionSize is not available');
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
      height: 1009,
    });
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to set extension size:',
      expect.any(Error)
    );
  });

  it('handles webflow object without setExtensionSize method', () => {
    // Mock webflow object without setExtensionSize
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

    expect(mockLogger.warn).toHaveBeenCalledWith('webflow.setExtensionSize is not available');
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
});