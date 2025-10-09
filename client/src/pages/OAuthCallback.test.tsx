/**
 * TDD Tests for OAuth Callback Page
 * RED Phase: These tests should FAIL initially until implementation is complete
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { OAuthCallback } from './OAuthCallback';

// Mock useAuth hook with stable function reference
const mockRefreshAuth = vi.fn();
const mockUseAuth = {
  refreshAuth: mockRefreshAuth,
  status: 'unauthenticated',
  isLoading: false,
};

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth,
}));

// Mock WebflowAuth at the top level to ensure proper hoisting
const mockHandleOAuthCallback = vi.fn();
const mockStoreToken = vi.fn();
const mockGetConfig = vi.fn();
const mockValidateConfig = vi.fn();

vi.mock('../lib/webflowAuth', () => ({
  WebflowAuth: vi.fn().mockImplementation((config) => {
    // Call validateConfig to mimic constructor behavior
    if (!config.clientId?.trim()) {
      throw new Error('Client ID is required');
    }
    if (!config.redirectUri?.trim()) {
      throw new Error('Redirect URI is required');
    }
    if (!config.scope?.length) {
      throw new Error('At least one scope is required');
    }
    
    return {
      handleOAuthCallback: mockHandleOAuthCallback,
      storeToken: mockStoreToken,
      getConfig: mockGetConfig,
      validateConfig: mockValidateConfig,
    };
  }),
}));

// Mock URL
const mockLocation = {
  href: 'http://localhost:1337/oauth/callback?code=test-code&state=test-state',
  search: '?code=test-code&state=test-state',
  replace: vi.fn(),
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Mock URL constructor for tests
global.URL = global.URL || class URL {
  href: string;
  origin: string;
  protocol: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  
  constructor(url: string) {
    this.href = url;
    this.origin = 'http://localhost:1337';
    this.protocol = 'http:';
    this.host = 'localhost:1337';
    this.hostname = 'localhost';
    this.port = '1337';
    this.pathname = '/oauth/callback';
    this.search = '?code=test-code&state=test-state';
    this.hash = '';
  }
  
  toString() {
    return this.href;
  }
};

describe('OAuthCallback', () => {
  const mockToken = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    token_type: 'Bearer' as const,
    expires_in: 3600,
    scope: 'sites:read sites:write',
    expires_at: Date.now() + 3600000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up mocks with immediate resolution
    mockRefreshAuth.mockImplementation(() => Promise.resolve(undefined));
    mockHandleOAuthCallback.mockResolvedValue(mockToken);
    mockStoreToken.mockImplementation(() => {});
    mockGetConfig.mockReturnValue({
      clientId: 'test-client-id',
      redirectUri: 'http://localhost:1337/oauth/callback',
      scope: ['sites:read', 'sites:write'],
    });
    mockValidateConfig.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Successful OAuth Flow', () => {
    it('should show loading state initially', () => {
      render(<OAuthCallback />);
      
      expect(screen.getByTestId('oauth-callback-loading')).toBeInTheDocument();
      expect(screen.getByText(/processing authentication/i)).toBeInTheDocument();
    });


    it('should handle successful OAuth callback', async () => {
      render(<OAuthCallback />);

      // Wait for the success state with a reasonable timeout
      await waitFor(() => {
        expect(screen.getByTestId('oauth-callback-success')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Verify our mocks were called
      expect(mockHandleOAuthCallback).toHaveBeenCalled();
      expect(mockRefreshAuth).toHaveBeenCalled();
    });

    it('should redirect to main app after successful authentication', async () => {
      // Mock is already set up in beforeEach
      vi.useFakeTimers();

      render(<OAuthCallback />);

      // Wait for the success state to be shown first
      await waitFor(() => {
        expect(screen.getByTestId('oauth-callback-success')).toBeInTheDocument();
      });

      // Advance timers by 1500ms to trigger the redirect
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(mockLocation.replace).toHaveBeenCalledWith('/');
      vi.useRealTimers();
    });

    it('should show success message before redirect', async () => {
      // Mock is already set up in beforeEach

      render(<OAuthCallback />);

      await waitFor(() => {
        expect(screen.getByTestId('oauth-callback-success')).toBeInTheDocument();
      });

      expect(screen.getByText(/redirecting/i)).toBeInTheDocument();
    });
  });

  describe('OAuth Error Handling', () => {
    it('should handle OAuth error from URL parameters', async () => {
      // Mock URL with error parameters
      Object.defineProperty(window, 'location', {
        value: {
          ...mockLocation,
          href: 'http://localhost:1337/oauth/callback?error=access_denied&error_description=User%20denied%20access',
          search: '?error=access_denied&error_description=User%20denied%20access',
        },
        writable: true,
      });

      mockHandleOAuthCallback.mockRejectedValue(
        new Error('OAuth error: access_denied - User denied access')
      );

      render(<OAuthCallback />);

      await waitFor(() => {
        expect(screen.getByTestId('oauth-callback-error')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      expect(screen.getByText(/authentication failed/i)).toBeInTheDocument();
      expect(screen.getByText(/User denied access/i)).toBeInTheDocument();
    });

    it('should handle invalid state parameter', async () => {
      mockHandleOAuthCallback.mockRejectedValue(
        new Error('Invalid state parameter')
      );

      render(<OAuthCallback />);

      await waitFor(() => {
        expect(screen.getByTestId('oauth-callback-error')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      expect(screen.getByText(/Invalid state parameter/i)).toBeInTheDocument();
    });

    it('should handle network errors during token exchange', async () => {
      mockHandleOAuthCallback.mockRejectedValue(
        new Error('Network error: Failed to exchange code for token')
      );

      render(<OAuthCallback />);

      await waitFor(() => {
        expect(screen.getByTestId('oauth-callback-error')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });

    it('should handle missing authorization code', async () => {
      // Mock URL without code parameter
      Object.defineProperty(window, 'location', {
        value: {
          ...mockLocation,
          href: 'http://localhost:1337/oauth/callback?state=test-state',
          search: '?state=test-state',
        },
        writable: true,
      });

      mockHandleOAuthCallback.mockRejectedValue(
        new Error('Missing authorization code or state parameter')
      );

      render(<OAuthCallback />);

      await waitFor(() => {
        expect(screen.getByTestId('oauth-callback-error')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      expect(screen.getByText(/Missing authorization code/i)).toBeInTheDocument();
    });

    it('should provide retry functionality on error', async () => {
      mockHandleOAuthCallback.mockRejectedValue(
        new Error('Network error')
      );

      render(<OAuthCallback />);

      await waitFor(() => {
        expect(screen.getByTestId('oauth-callback-error')).toBeInTheDocument();
      }, { timeout: 2000 });

      const retryButton = screen.getByTestId('oauth-retry-button');
      expect(retryButton).toBeInTheDocument();
      expect(screen.getByText(/try again/i)).toBeInTheDocument();
    });

    it('should show back to app link on error', async () => {
      mockHandleOAuthCallback.mockRejectedValue(
        new Error('OAuth error')
      );

      render(<OAuthCallback />);

      await waitFor(() => {
        expect(screen.getByTestId('oauth-callback-error')).toBeInTheDocument();
      }, { timeout: 2000 });

      const backLink = screen.getByTestId('oauth-back-link');
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/');
      expect(screen.getByText(/back to app/i)).toBeInTheDocument();
    });
  });

  describe('Loading States and UX', () => {
    it('should show progress indicator during processing', () => {
      render(<OAuthCallback />);
      
      expect(screen.getByTestId('oauth-loading-spinner')).toBeInTheDocument();
    });

    it('should show processing steps', async () => {
      mockHandleOAuthCallback.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          access_token: 'test-token',
          refresh_token: 'test-refresh',
          token_type: 'Bearer' as const,
          expires_in: 3600,
          scope: 'sites:read',
          expires_at: Date.now() + 3600000,
        }), 100))
      );

      mockRefreshAuth.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<OAuthCallback />);

      expect(screen.getByText(/verifying authorization code/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText(/fetching user information/i)).toBeInTheDocument();
      });
    });

    it('should show appropriate messages for different processing stages', async () => {

      let resolveCallback: (value: any) => void;
      const callbackPromise = new Promise(resolve => {
        resolveCallback = resolve;
      });

      mockHandleOAuthCallback.mockReturnValue(callbackPromise);

      render(<OAuthCallback />);

      expect(screen.getByText(/verifying authorization code/i)).toBeInTheDocument();

      // Resolve the callback  
      resolveCallback!(mockToken);

      await waitFor(() => {
        expect(screen.getByText(/authentication successful/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<OAuthCallback />);
      
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'OAuth authentication callback');
      
      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
    });

    it('should announce status changes to screen readers', async () => {
      mockHandleOAuthCallback.mockRejectedValue(
        new Error('Test error')
      );

      render(<OAuthCallback />);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent(/authentication failed/i);
      });
    });

    it('should have proper heading structure', () => {
      render(<OAuthCallback />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      mockHandleOAuthCallback.mockRejectedValue(
        new Error('Test error')
      );

      render(<OAuthCallback />);

      await waitFor(() => {
        const retryButton = screen.getByTestId('oauth-retry-button');
        expect(retryButton).toBeInTheDocument();
        expect(retryButton).toHaveAttribute('tabIndex', '0');
      });
    });
  });

  describe('Security Considerations', () => {
    it('should clear URL parameters after processing', async () => {
      // Mock is already set up in beforeEach
      vi.useFakeTimers();

      render(<OAuthCallback />);

      // Wait for the success state to be shown
      await waitFor(() => {
        expect(screen.getByTestId('oauth-callback-success')).toBeInTheDocument();
      });

      // Advance timers by 1500ms to trigger the redirect
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(mockLocation.replace).toHaveBeenCalledWith('/');

      // Should not expose sensitive parameters in URL
      expect(mockLocation.replace).not.toHaveBeenCalledWith(
        expect.stringContaining('code=')
      );

      vi.useRealTimers();
    });

    it('should not log sensitive information', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Use a token with sensitive data to test logging
      const sensitiveToken = {
        access_token: 'sensitive-token',
        refresh_token: 'sensitive-refresh',
        token_type: 'Bearer' as const,
        expires_in: 3600,
        scope: 'sites:read',
        expires_at: Date.now() + 3600000,
      };

      mockHandleOAuthCallback.mockResolvedValue(sensitiveToken);

      render(<OAuthCallback />);

      await waitFor(() => {
        expect(screen.getByTestId('oauth-callback-success')).toBeInTheDocument();
      });

      // Should not log tokens
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('sensitive-token')
      );
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('sensitive-token')
      );

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});