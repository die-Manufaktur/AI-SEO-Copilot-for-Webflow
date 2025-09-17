import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the heavy dependencies to avoid complex setup
vi.mock('@tanstack/react-query', () => ({
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="query-client-provider">{children}</div>,
}));

vi.mock('./components/ui/toaster', () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

vi.mock('./lib/queryClient', () => ({
  queryClient: {},
}));

vi.mock('./pages/Home', () => ({
  default: () => <div data-testid="home-page">Home Page</div>,
}));

vi.mock('./components/WebflowAppWrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="webflow-app-wrapper">{children}</div>
  ),
}));

// Mock console methods to avoid noise in tests
const consoleMethods = {
  error: vi.fn(),
  log: vi.fn(),
  warn: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(console, consoleMethods);
});

// Helper component to trigger errors
const ErrorComponent = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

const LengthErrorComponent = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error("Cannot read properties of undefined (reading 'length')");
  }
  return <div>No error</div>;
};

describe('App', () => {
  it('should render app structure correctly', () => {
    render(<App />);
    
    // Check that all main components are rendered
    expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
    expect(screen.getByTestId('webflow-app-wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
  });

  it('should render components in correct hierarchy', () => {
    render(<App />);
    
    const queryProvider = screen.getByTestId('query-client-provider');
    const webflowWrapper = screen.getByTestId('webflow-app-wrapper');
    const homePage = screen.getByTestId('home-page');
    const toaster = screen.getByTestId('toaster');
    
    // Check hierarchy: QueryClient > WebflowWrapper > Home
    expect(queryProvider).toContainElement(webflowWrapper);
    expect(webflowWrapper).toContainElement(homePage);
    expect(queryProvider).toContainElement(toaster);
  });
});

describe('ErrorBoundary', () => {
  // Create a test ErrorBoundary component that mimics the real one
  class TestErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error?: Error }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
      
      if (error.message.includes("Cannot read properties of undefined (reading 'length')")) {
        console.error('Caught the length property error:', {
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack
        });
      }
    }

    render() {
      if (this.state.hasError) {
        return (
          <div 
            data-testid="error-boundary-fallback"
            style={{ 
              padding: '20px', 
              color: 'red', 
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              margin: '20px',
              borderRadius: '4px'
            }}
          >
            <h2>Something went wrong.</h2>
            <details style={{ whiteSpace: 'pre-wrap' as const }}>
              <summary>Error Details</summary>
              {this.state.error?.toString()}
              <br />
              {this.state.error?.stack}
            </details>
          </div>
        );
      }

      return this.props.children;
    }
  }

  it('should render children when no error occurs', () => {
    render(
      <TestErrorBoundary>
        <ErrorComponent shouldThrow={false} />
      </TestErrorBoundary>
    );
    
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should catch errors and display error boundary', () => {
    // Suppress console.error for this test as we expect an error
    const originalError = console.error;
    console.error = vi.fn();
    
    render(
      <TestErrorBoundary>
        <ErrorComponent shouldThrow={true} />
      </TestErrorBoundary>
    );
    
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    expect(screen.getByText('Error Details')).toBeInTheDocument();
    
    console.error = originalError;
  });

  it('should handle specific length property errors', () => {
    // Suppress console.error for this test as we expect an error
    const originalError = console.error;
    console.error = vi.fn();
    
    render(
      <TestErrorBoundary>
        <LengthErrorComponent shouldThrow={true} />
      </TestErrorBoundary>
    );
    
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    
    // Check if the specific error logging was called
    expect(console.error).toHaveBeenCalledWith(
      'Caught the length property error:',
      expect.objectContaining({
        message: expect.stringContaining('length'),
      })
    );
    
    console.error = originalError;
  });

  it('should display error details in fallback UI', () => {
    const originalError = console.error;
    console.error = vi.fn();
    
    render(
      <TestErrorBoundary>
        <ErrorComponent shouldThrow={true} />
      </TestErrorBoundary>
    );
    
    // Check that error details are expandable
    const details = screen.getByText('Error Details');
    expect(details.tagName).toBe('SUMMARY');
    
    console.error = originalError;
  });

  it('should log error information when componentDidCatch is called', () => {
    const originalError = console.error;
    console.error = vi.fn();
    
    render(
      <TestErrorBoundary>
        <ErrorComponent shouldThrow={true} />
      </TestErrorBoundary>
    );
    
    expect(console.error).toHaveBeenCalledWith(
      'ErrorBoundary caught an error:',
      expect.any(Error),
      expect.any(Object)
    );
    
    console.error = originalError;
  });

  it('should have correct error boundary state structure', () => {
    const originalError = console.error;
    console.error = vi.fn();
    
    render(
      <TestErrorBoundary>
        <ErrorComponent shouldThrow={true} />
      </TestErrorBoundary>
    );
    
    // Verify the error boundary renders the fallback UI
    expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
    
    console.error = originalError;
  });

  it('should apply correct styling to error boundary fallback', () => {
    const originalError = console.error;
    console.error = vi.fn();
    
    render(
      <TestErrorBoundary>
        <ErrorComponent shouldThrow={true} />
      </TestErrorBoundary>
    );
    
    const errorBoundary = screen.getByTestId('error-boundary-fallback');
    
    // Check that the error boundary has styling applied
    expect(errorBoundary).toHaveStyle({
      padding: '20px',
      color: 'rgb(255, 0, 0)', // red in rgb format
      backgroundColor: 'rgb(255, 243, 205)', // #fff3cd in rgb format
    });
    
    console.error = originalError;
  });
});