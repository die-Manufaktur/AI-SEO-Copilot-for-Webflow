import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';

// Mock React DOM
const mockRender = vi.fn();
const mockCreateRoot = vi.fn(() => ({
  render: mockRender,
}));

vi.mock('react-dom/client', () => ({
  createRoot: mockCreateRoot,
}));

// Mock the App component
vi.mock('./App', () => ({
  default: () => React.createElement('div', null, 'App Component'),
}));

// Mock CSS import
vi.mock('./index.css', () => ({}));

describe('main.tsx', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let originalInnerHTML: string;

  beforeEach(() => {
    // Setup clean DOM environment
    originalInnerHTML = document.body.innerHTML;
    document.body.innerHTML = '<div id="root"></div>';
    vi.clearAllMocks();
    
    // Mock console.error to avoid noise in tests
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    document.body.innerHTML = originalInnerHTML;
    consoleErrorSpy.mockRestore();
    
    // Clear module cache to allow re-importing
    vi.resetModules();
  });

  it('renders the App component when root element exists', async () => {
    // Import main.tsx to trigger the rendering logic
    await import('./main');

    // Verify React root was created with correct element
    expect(mockCreateRoot).toHaveBeenCalledWith(
      document.getElementById('root')
    );

    // Verify App component was rendered with StrictMode
    expect(mockRender).toHaveBeenCalledTimes(1);
    const callArg = mockRender.mock.calls[0][0];
    expect(callArg.type).toBe(React.StrictMode);
    expect(callArg.props.children).toBeDefined();
  });

  it('handles missing root element gracefully', async () => {
    // Remove root element
    document.body.innerHTML = '';

    await import('./main');

    // Should not attempt to create React root
    expect(mockCreateRoot).not.toHaveBeenCalled();
    expect(mockRender).not.toHaveBeenCalled();
    
    // Should log error
    expect(consoleErrorSpy).toHaveBeenCalledWith('Root element not found in DOM');
    
    // Should add error message to DOM
    expect(document.body.innerHTML).toContain('Error: Root element not found');
    expect(document.body.innerHTML).toContain('color:red');
  });

  it('handles React rendering errors gracefully', async () => {
    // Make createRoot throw an error
    mockCreateRoot.mockImplementationOnce(() => {
      throw new Error('React initialization failed');
    });

    await import('./main');

    // Should log the error
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error rendering React app:',
      expect.any(Error)
    );
    
    // Should add error message to DOM
    expect(document.body.innerHTML).toContain('Error: React initialization failed');
    expect(document.body.innerHTML).toContain('color:red');
  });

  it('handles non-Error exceptions gracefully', async () => {
    // Make createRoot throw a non-Error object
    mockCreateRoot.mockImplementationOnce(() => {
      throw 'String error';
    });

    await import('./main');

    // Should log the error
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error rendering React app:',
      'String error'
    );
    
    // Should handle non-Error gracefully
    expect(document.body.innerHTML).toContain('Error: Unknown error');
    expect(document.body.innerHTML).toContain('color:red');
  });

  it('handles render method throwing an error', async () => {
    // Make render throw an error
    mockRender.mockImplementationOnce(() => {
      throw new Error('Render failed');
    });

    await import('./main');

    // Should still attempt to create root
    expect(mockCreateRoot).toHaveBeenCalled();
    
    // Should log the rendering error
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error rendering React app:',
      expect.any(Error)
    );
    
    // Should add error message to DOM
    expect(document.body.innerHTML).toContain('Error: Render failed');
  });

  it('preserves existing DOM content when adding error messages', async () => {
    // Add some existing content
    document.body.innerHTML = '<div id="existing">Existing content</div>';

    await import('./main');

    // Should preserve existing content
    expect(document.body.innerHTML).toContain('Existing content');
    
    // Should also add error message
    expect(document.body.innerHTML).toContain('Error: Root element not found');
  });

  it('uses strict mode for React rendering', async () => {
    await import('./main');

    // Check that StrictMode is used
    const callArg = mockRender.mock.calls[0][0];
    expect(callArg.type).toBe(React.StrictMode);
  });

  it('finds and uses the correct root element', async () => {
    // Add multiple elements, ensure it uses the right one
    document.body.innerHTML = `
      <div id="other">Other</div>
      <div id="root">Root element</div>
      <div id="another">Another</div>
    `;

    await import('./main');

    const rootElement = document.getElementById('root');
    expect(mockCreateRoot).toHaveBeenCalledWith(rootElement);
    expect(rootElement?.textContent).toBe('Root element');
  });

  it('handles DOM manipulation during error conditions', async () => {
    document.body.innerHTML = '';
    const originalInnerHTML = document.body.innerHTML;

    await import('./main');

    // Should have added error content
    expect(document.body.innerHTML).not.toBe(originalInnerHTML);
    expect(document.body.innerHTML.length).toBeGreaterThan(0);
  });

  it('ensures error styling is applied correctly', async () => {
    document.body.innerHTML = '';

    await import('./main');

    const errorContent = document.body.innerHTML;
    expect(errorContent).toMatch(/style=['"]color:red[^'"]*padding:20px/);
    expect(errorContent).toContain('Error: Root element not found');
  });
});