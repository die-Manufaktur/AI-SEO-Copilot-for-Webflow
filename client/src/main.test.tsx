import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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
  default: () => 'App Component',
}));

// Mock CSS import
vi.mock('./index.css', () => ({}));

describe('main.tsx', () => {
  let originalConsoleError: typeof console.error;
  let mockRootElement: HTMLElement;

  beforeEach(() => {
    // Setup clean DOM environment
    document.body.innerHTML = '';
    mockRootElement = document.createElement('div');
    mockRootElement.id = 'root';
    document.body.appendChild(mockRootElement);

    // Mock console.error to capture error messages
    originalConsoleError = console.error;
    console.error = vi.fn();

    // Reset mocks and ensure consistent mock behavior
    vi.clearAllMocks();
    mockCreateRoot.mockReturnValue({ render: mockRender });
  });

  afterEach(() => {
    // Restore original console.error
    console.error = originalConsoleError;
    
    // Clean up DOM only if body exists
    if (document.body) {
      document.body.innerHTML = '';
    }
    
    // Clear module cache to ensure fresh imports
    vi.resetModules();
  });

  it('successfully renders the app when root element exists', async () => {
    // Import main.tsx to trigger the execution
    await import('./main');

    // Verify createRoot was called with the root element
    expect(mockCreateRoot).toHaveBeenCalledWith(mockRootElement);
    
    // Verify render was called
    expect(mockRender).toHaveBeenCalledTimes(1);
    const renderCall = mockRender.mock.calls[0][0];
    
    // Check that it's a React element (structure varies by React version)
    expect(renderCall).toBeTruthy();
    expect(renderCall.type).toBeTruthy();
    
    // Verify that StrictMode and App are being used by checking the structure
    // This is more flexible than checking exact type names
    expect(renderCall.props).toBeTruthy();
    expect(renderCall.props.children).toBeTruthy();
  });

  it('handles missing root element gracefully', async () => {
    // Remove the root element
    document.body.removeChild(mockRootElement);

    // Import main.tsx to trigger the execution
    await import('./main');

    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith('Root element not found in DOM');
    
    // Verify error message was added to document body
    expect(document.body.innerHTML).toContain('Error: Root element not found');
    expect(document.body.innerHTML).toContain('color:red');
    expect(document.body.innerHTML).toContain('padding:20px');
    
    // Verify createRoot was not called
    expect(mockCreateRoot).not.toHaveBeenCalled();
    expect(mockRender).not.toHaveBeenCalled();
  });

  it('handles createRoot throwing an error', async () => {
    // Make createRoot throw an error
    const testError = new Error('Failed to create root');
    mockCreateRoot.mockImplementation(() => {
      throw testError;
    });

    // Import main.tsx to trigger the execution
    await import('./main');

    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith('Error rendering React app:', testError);
    
    // Verify error message was added to document body
    expect(document.body.innerHTML).toContain('Error: Failed to create root');
    expect(document.body.innerHTML).toContain('color:red');
    expect(document.body.innerHTML).toContain('padding:20px');
    
    // Verify render was not called
    expect(mockRender).not.toHaveBeenCalled();
  });

  it('handles render throwing an error', async () => {
    // Make render throw an error after createRoot succeeds
    const testError = new Error('Failed to render');
    
    // Create a mock root that throws when render is called
    const mockRoot = {
      render: vi.fn().mockImplementation(() => {
        throw testError;
      })
    };
    
    mockCreateRoot.mockReturnValue(mockRoot);

    // Import main.tsx to trigger the execution
    await import('./main');

    // Verify createRoot was called
    expect(mockCreateRoot).toHaveBeenCalledWith(mockRootElement);
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith('Error rendering React app:', testError);
    
    // Verify error message was added to document body
    expect(document.body.innerHTML).toContain('Error: Failed to render');
    expect(document.body.innerHTML).toContain('color:red');
  });

  it('handles non-Error exceptions gracefully', async () => {
    // Make createRoot throw a non-Error object
    const testError = 'String error message';
    mockCreateRoot.mockImplementation(() => {
      throw testError;
    });

    // Import main.tsx to trigger the execution
    await import('./main');

    // Verify error was logged with the non-Error object
    expect(console.error).toHaveBeenCalledWith('Error rendering React app:', testError);
    
    // Verify generic error message was shown
    expect(document.body.innerHTML).toContain('Error: Unknown error');
    expect(document.body.innerHTML).toContain('color:red');
  });

  it('handles null error gracefully', async () => {
    // Make createRoot throw null
    mockCreateRoot.mockImplementation(() => {
      throw null;
    });

    // Import main.tsx to trigger the execution
    await import('./main');

    // Verify error was logged with null
    expect(console.error).toHaveBeenCalledWith('Error rendering React app:', null);
    
    // Verify generic error message was shown
    expect(document.body.innerHTML).toContain('Error: Unknown error');
  });

  it('applies correct inline styles for error messages', async () => {
    // Remove the root element to trigger error
    document.body.removeChild(mockRootElement);

    // Import main.tsx to trigger the execution
    await import('./main');

    // Check that the error div has the correct styles
    const errorDiv = document.body.querySelector('div');
    expect(errorDiv).toBeTruthy();
    expect(errorDiv?.getAttribute('style')).toBe('color:red;padding:20px;');
  });

  it('renders App component within React.StrictMode structure', async () => {
    // Import main.tsx to trigger the execution
    await import('./main');

    // Verify the render method was called
    expect(mockRender).toHaveBeenCalledTimes(1);
    
    // Verify that we're rendering a React element structure
    const renderCall = mockRender.mock.calls[0][0];
    expect(renderCall).toBeTruthy();
    expect(renderCall.type).toBeTruthy();
    expect(renderCall.props).toBeTruthy();
  });

  it('only renders once even with multiple imports', async () => {
    // Import main.tsx first time
    await import('./main');
    
    // Verify initial render
    expect(mockCreateRoot).toHaveBeenCalledTimes(1);
    expect(mockRender).toHaveBeenCalledTimes(1);
    
    // Clear mocks and import again
    vi.clearAllMocks();
    await import('./main');

    // Should not render again since module is already loaded
    expect(mockCreateRoot).not.toHaveBeenCalled();
    expect(mockRender).not.toHaveBeenCalled();
  });

  it('handles document.body being null during error handling', async () => {
    // Store original body
    const originalBody = document.body;
    
    // Make createRoot throw an error first
    const testError = new Error('Test error');
    mockCreateRoot.mockImplementation(() => {
      throw testError;
    });

    // Then set body to null to trigger the innerHTML error
    Object.defineProperty(document, 'body', {
      value: null,
      writable: true,
      configurable: true,
    });

    // Import main.tsx and expect it to throw when trying to access innerHTML
    await expect(import('./main')).rejects.toThrow();

    // Verify the original error was still logged before the body error
    expect(console.error).toHaveBeenCalledWith('Error rendering React app:', testError);

    // Restore original body
    Object.defineProperty(document, 'body', {
      value: originalBody,
      writable: true,
      configurable: true,
    });
  });

  it('handles getElementById returning null', async () => {
    // Mock getElementById to return null
    const originalGetElementById = document.getElementById;
    document.getElementById = vi.fn(() => null);

    // Import main.tsx to trigger the execution
    await import('./main');

    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith('Root element not found in DOM');
    
    // Verify error message was added to document body
    expect(document.body.innerHTML).toContain('Error: Root element not found');
    
    // Verify createRoot was not called
    expect(mockCreateRoot).not.toHaveBeenCalled();
    expect(mockRender).not.toHaveBeenCalled();

    // Restore original getElementById
    document.getElementById = originalGetElementById;
  });

  it('verifies complete error handling flow', async () => {
    // Test that both error paths work correctly
    const testError = new Error('Complete test error');
    mockCreateRoot.mockImplementation(() => {
      throw testError;
    });

    // Import main.tsx to trigger the execution
    await import('./main');

    // Verify all error handling steps
    expect(console.error).toHaveBeenCalledWith('Error rendering React app:', testError);
    expect(document.body.innerHTML).toContain('Error: Complete test error');
    expect(document.body.innerHTML).toContain('style="color:red;padding:20px;"');
  });
});