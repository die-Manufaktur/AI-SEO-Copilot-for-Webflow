/**
 * OAuth Callback Page Component
 * GREEN Phase: Minimal implementation to make tests pass
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { WebflowAuth } from '../lib/webflowAuth';

interface OAuthCallbackState {
  status: 'loading' | 'success' | 'error';
  message: string;
  error?: string;
  step: string;
}

const WEBFLOW_CONFIG = {
  clientId: import.meta.env.VITE_WEBFLOW_CLIENT_ID || 'test-client-id',
  redirectUri: import.meta.env.VITE_WEBFLOW_REDIRECT_URI || 'http://localhost:1337/oauth/callback',
  scope: [
    'sites:read',
    'sites:write', 
    'cms:read',
    'cms:write',
    'pages:read',
    'pages:write'
  ],
};

export function OAuthCallback(): React.ReactElement {
  const { refreshAuth } = useAuth();
  const [state, setState] = useState<OAuthCallbackState>({
    status: 'loading',
    message: 'Processing authentication...',
    step: 'Verifying authorization code...',
  });

  const handleOAuthCallback = async () => {
    try {
      setState(prev => ({
        ...prev,
        step: 'Verifying authorization code...',
      }));

      const webflowAuth = new WebflowAuth(WEBFLOW_CONFIG);
      const currentUrl = new URL(window.location.href);
      
      // Handle OAuth callback
      await webflowAuth.handleOAuthCallback(currentUrl);

      setState(prev => ({
        ...prev,
        step: 'Fetching user information...',
      }));

      // Refresh auth context to load user data
      await refreshAuth();

      setState({
        status: 'success',
        message: 'Authentication successful!',
        step: 'Redirecting to application...',
      });

      // Redirect to main app after brief delay
      setTimeout(() => {
        window.location.replace('/');
      }, 1500);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setState({
        status: 'error',
        message: 'Authentication failed',
        error: errorMessage,
        step: '',
      });
    }
  };

  const handleRetry = () => {
    setState({
      status: 'loading',
      message: 'Processing authentication...',
      step: 'Verifying authorization code...',
    });
    handleOAuthCallback();
  };

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  return (
    <main 
      className="min-h-screen flex items-center justify-center bg-gray-50"
      aria-label="OAuth authentication callback"
    >
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">
          Webflow Authentication
        </h1>

        {state.status === 'loading' && (
          <div data-testid="oauth-callback-loading" role="status" aria-live="polite">
            <div className="flex items-center justify-center mb-4">
              <div 
                data-testid="oauth-loading-spinner"
                className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
                aria-hidden="true"
              ></div>
            </div>
            <p className="text-center text-gray-600 mb-2">{state.message}</p>
            <p className="text-center text-sm text-gray-500">{state.step}</p>
          </div>
        )}

        {state.status === 'success' && (
          <div data-testid="oauth-callback-success" role="status" aria-live="polite">
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-green-100 p-2">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <p className="text-center text-green-600 font-medium mb-2">{state.message}</p>
            <p className="text-center text-sm text-gray-500">{state.step}</p>
          </div>
        )}

        {state.status === 'error' && (
          <div data-testid="oauth-callback-error" role="alert" aria-live="assertive">
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full bg-red-100 p-2">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </div>
            <p className="text-center text-red-600 font-medium mb-2">{state.message}</p>
            
            {state.error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <p className="text-sm text-red-700">{state.error}</p>
              </div>
            )}

            <div className="flex flex-col space-y-3">
              <button
                data-testid="oauth-retry-button"
                onClick={handleRetry}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                tabIndex={0}
              >
                Try Again
              </button>
              
              <a
                data-testid="oauth-back-link"
                href="/"
                className="w-full text-center bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 block"
              >
                Back to App
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}