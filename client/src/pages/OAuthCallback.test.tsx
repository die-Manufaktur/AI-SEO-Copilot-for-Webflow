/**
 * TDD Tests for OAuth Callback Page
 * RED Phase: These tests should FAIL initially until implementation is complete
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { OAuthCallback } from './OAuthCallback';

// Mock useAuth hook
const mockUseAuth = {
  refreshAuth: vi.fn(),
  status: 'unauthenticated',
  isLoading: false,
};

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth,
}));

// Mock WebflowAuth
const mockWebflowAuth = {
  handleOAuthCallback: vi.fn(),
  storeToken: vi.fn(),
  getConfig: vi.fn(),
  validateConfig: vi.fn(),
};

vi.mock('../lib/webflowAuth', () => ({
  WebflowAuth: vi.fn(() => mockWebflowAuth),
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
    mockUseAuth.refreshAuth.mockResolvedValue(undefined);
    // Make the mock resolve successfully by default
    mockWebflowAuth.handleOAuthCallback.mockResolvedValue(mockToken);
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
      // Mock is already set up in beforeEach

      render(<OAuthCallback />);

      await waitFor(() => {
        expect(mockWebflowAuth.handleOAuthCallback).toHaveBeenCalledWith(
          expect.any(URL)
        );
      });

      await waitFor(() => {
        expect(mockUseAuth.refreshAuth).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByTestId('oauth-callback-success')).toBeInTheDocument();
        expect(screen.getByText(/authentication successful/i)).toBeInTheDocument();
      });
    });

    it('should redirect to main app after successful authentication', async () => {
      // Mock is already set up in beforeEach

      render(<OAuthCallback />);

      await waitFor(() => {
        expect(mockLocation.replace).toHaveBeenCalledWith('/');
      }, { timeout: 3000 });
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

      mockWebflowAuth.handleOAuthCallback.mockRejectedValue(
        new Error('OAuth error: access_denied - User denied access')
      );

      render(<OAuthCallback />);

      await waitFor(() => {
        expect(screen.getByTestId('oauth-callback-error')).toBeInTheDocument();
        expect(screen.getByText(/authentication failed/i)).toBeInTheDocument();
        expect(screen.getByText(/User denied access/i)).toBeInTheDocument();
      });
    });

    it('should handle invalid state parameter', async () => {
      mockWebflowAuth.handleOAuthCallback.mockRejectedValue(
        new Error('Invalid state parameter')
      );

      render(<OAuthCallback />);

      await waitFor(() => {
        expect(screen.getByTestId('oauth-callback-error')).toBeInTheDocument();
        expect(screen.getByText(/Invalid state parameter/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors during token exchange', async () => {
      mockWebflowAuth.handleOAuthCallback.mockRejectedValue(
        new Error('Network error: Failed to exchange code for token')
      );

      render(<OAuthCallback />);

      await waitFor(() => {
        expect(screen.getByTestId('oauth-callback-error')).toBeInTheDocument();
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
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

      mockWebflowAuth.handleOAuthCallback.mockRejectedValue(
        new Error('Missing authorization code or state parameter')
      );

      render(<OAuthCallback />);

      await waitFor(() => {
        expect(screen.getByTestId('oauth-callback-error')).toBeInTheDocument();
        expect(screen.getByText(/Missing authorization code/i)).toBeInTheDocument();
      });
    });

    it('should provide retry functionality on error', async () => {
      mockWebflowAuth.handleOAuthCallback.mockRejectedValue(
        new Error('Network error')
      );

      render(<OAuthCallback />);

      await waitFor(() => {
        expect(screen.getByTestId('oauth-callback-error')).toBeInTheDocument();
      });

      const retryButton = screen.getByTestId('oauth-retry-button');
      expect(retryButton).toBeInTheDocument();
      expect(screen.getByText(/try again/i)).toBeInTheDocument();
    });

    it('should show back to app link on error', async () => {
      mockWebflowAuth.handleOAuthCallback.mockRejectedValue(
        new Error('OAuth error')
      );

      render(<OAuthCallback />);

      await waitFor(() => {
        expect(screen.getByTestId('oauth-callback-error')).toBeInTheDocument();
      });

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
      mockWebflowAuth.handleOAuthCallback.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          access_token: 'test-token',
          refresh_token: 'test-refresh',
          token_type: 'Bearer' as const,
          expires_in: 3600,
          scope: 'sites:read',
          expires_at: Date.now() + 3600000,
        }), 100))
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

      mockWebflowAuth.handleOAuthCallback.mockReturnValue(callbackPromise);

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
      mockWebflowAuth.handleOAuthCallback.mockRejectedValue(
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
      mockWebflowAuth.handleOAuthCallback.mockRejectedValue(
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

      render(<OAuthCallback />);

      await waitFor(() => {
        expect(mockLocation.replace).toHaveBeenCalledWith('/');
      });

      // Should not expose sensitive parameters in URL
      expect(mockLocation.replace).not.toHaveBeenCalledWith(
        expect.stringContaining('code=')
      );
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

      mockWebflowAuth.handleOAuthCallback.mockResolvedValue(sensitiveToken);

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