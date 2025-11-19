/**
 * Comprehensive Error Boundary Component
 * Catches and handles React errors with detailed logging and user-friendly fallbacks
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { logger } from '../services/logger';
import { performanceMonitor } from '../services/performanceMonitor';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo;
  errorId: string;
  onRetry: () => void;
  onReport: () => void;
  showDetails: boolean;
  retryCount: number;
  maxRetries: number;
}

/**
 * Default error fallback component
 */
function DefaultErrorFallback({
  error,
  errorInfo,
  errorId,
  onRetry,
  onReport,
  showDetails,
  retryCount,
  maxRetries,
}: ErrorFallbackProps) {
  const [showTechnicalDetails, setShowTechnicalDetails] = React.useState(false);
  const [reportSent, setReportSent] = React.useState(false);

  const handleReport = async () => {
    try {
      await onReport();
      setReportSent(true);
    } catch (reportError) {
      console.error('Failed to send error report:', reportError);
    }
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6 bg-red-50 border border-red-200 rounded-lg">
      <div className="max-w-md w-full text-center space-y-4">
        {/* Error Icon */}
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <svg 
            className="w-8 h-8 text-red-600" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>

        {/* Error Message */}
        <div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Something went wrong
          </h3>
          <p className="text-red-700 text-sm">
            We encountered an unexpected error. Our team has been notified and is working on a fix.
          </p>
        </div>

        {/* Error ID */}
        <div className="text-xs text-red-600 font-mono bg-red-100 px-2 py-1 rounded">
          Error ID: {errorId}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-2">
          {retryCount < maxRetries && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
            >
              Try Again {retryCount > 0 && `(${retryCount}/${maxRetries})`}
            </button>
          )}

          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            Reload Page
          </button>

          {!reportSent && (
            <button
              onClick={handleReport}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm"
            >
              Send Error Report
            </button>
          )}

          {reportSent && (
            <div className="text-green-600 text-sm">
              ✓ Error report sent successfully
            </div>
          )}
        </div>

        {/* Technical Details Toggle */}
        {showDetails && (
          <div className="text-left">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="text-sm text-red-600 hover:text-red-800 underline"
            >
              {showTechnicalDetails ? 'Hide' : 'Show'} technical details
            </button>

            {showTechnicalDetails && (
              <div className="mt-3 p-3 bg-gray-100 rounded-md text-xs text-gray-800 font-mono text-left overflow-auto max-h-40">
                <div className="mb-2">
                  <strong>Error:</strong> {error.message}
                </div>
                <div className="mb-2">
                  <strong>Stack:</strong>
                  <pre className="whitespace-pre-wrap mt-1">{error.stack}</pre>
                </div>
                {errorInfo.componentStack && (
                  <div>
                    <strong>Component Stack:</strong>
                    <pre className="whitespace-pre-wrap mt-1">{errorInfo.componentStack}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Help Links */}
        <div className="text-xs text-gray-600 space-y-1">
          <div>
            <a 
              href="/help" 
              className="text-blue-600 hover:text-blue-800 underline"
              target="_blank" 
              rel="noopener noreferrer"
            >
              Need help?
            </a>
          </div>
          <div>
            <a 
              href="https://github.com/anthropics/claude-code/issues" 
              className="text-blue-600 hover:text-blue-800 underline"
              target="_blank" 
              rel="noopener noreferrer"
            >
              Report a bug
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Enhanced Error Boundary with comprehensive error handling
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || `ERR_${Date.now()}`;

    // Log error with comprehensive context
    logger.error('React Error Boundary caught an error', {
      errorId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      buildVersion: process.env.REACT_APP_VERSION || 'unknown',
    });

    // Track error in performance monitoring
    performanceMonitor.trackApiCall(`error_boundary_${error.name}`, 0, false);

    // Update state with error info
    this.setState({ errorInfo });

    // Call optional error handler
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (handlerError) {
        logger.error('Error in ErrorBoundary onError handler', { handlerError });
      }
    }

    // Send error to monitoring service
    this.sendErrorReport(error, errorInfo, errorId);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error boundary when props change (if enabled)
    if (hasError && resetOnPropsChange) {
      if (resetKeys) {
        // Check if any reset keys have changed
        const hasResetKeyChanged = resetKeys.some((key, index) => 
          prevProps.resetKeys?.[index] !== key
        );

        if (hasResetKeyChanged) {
          this.resetErrorBoundary();
        }
      } else {
        // Reset on any prop change
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    });
  };

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      logger.info('Error boundary retry attempt', { 
        retryCount: retryCount + 1,
        maxRetries,
        errorId: this.state.errorId,
      });

      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: prevState.retryCount + 1,
      }));
    }
  };

  private handleReport = async () => {
    const { error, errorInfo, errorId } = this.state;
    
    if (error && errorInfo && errorId) {
      await this.sendErrorReport(error, errorInfo, errorId, true);
    }
  };

  private async sendErrorReport(
    error: Error, 
    errorInfo: ErrorInfo, 
    errorId: string,
    userReported = false
  ) {
    try {
      // In a real application, this would send to your error reporting service
      const errorReport = {
        errorId,
        timestamp: new Date().toISOString(),
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        errorInfo: {
          componentStack: errorInfo.componentStack,
        },
        context: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          userId: this.getUserId(),
          sessionId: this.getSessionId(),
          buildVersion: process.env.REACT_APP_VERSION || 'unknown',
          retryCount: this.state.retryCount,
          userReported,
        },
        performanceMetrics: performanceMonitor.getMetrics(),
      };

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.group('🔴 Error Report');
        console.error('Error:', error);
        console.error('Error Info:', errorInfo);
        console.log('Full Report:', errorReport);
        console.groupEnd();
      }

      // Send to error reporting service (mock implementation)
      if (process.env.REACT_APP_ERROR_REPORTING_URL) {
        fetch(process.env.REACT_APP_ERROR_REPORTING_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorReport),
        }).catch(reportError => {
          logger.error('Failed to send error report', { reportError });
        });
      }

    } catch (reportError) {
      logger.error('Error while creating error report', { reportError });
    }
  }

  private getUserId(): string | null {
    try {
      const token = localStorage.getItem('webflow_token');
      if (token) {
        const parsed = JSON.parse(token);
        return parsed.user_id || null;
      }
    } catch (e) {
      // Ignore error
    }
    return null;
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  render() {
    const { hasError, error, errorInfo, errorId, retryCount } = this.state;
    const { children, fallback, showErrorDetails = false, maxRetries = 3 } = this.props;

    if (hasError && error && errorInfo && errorId) {
      // Render custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Render default error fallback
      return (
        <DefaultErrorFallback
          error={error}
          errorInfo={errorInfo}
          errorId={errorId}
          onRetry={this.handleRetry}
          onReport={this.handleReport}
          showDetails={showErrorDetails}
          retryCount={retryCount}
          maxRetries={maxRetries}
        />
      );
    }

    return children;
  }
}

/**
 * HOC for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedWithErrorBoundary = (props: P) => {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };

  WrappedWithErrorBoundary.displayName = `withErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;

  return WrappedWithErrorBoundary;
}

/**
 * Hook for error boundary integration
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  return { handleError, resetError };
}