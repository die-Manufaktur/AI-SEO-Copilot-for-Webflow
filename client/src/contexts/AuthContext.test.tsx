/**
 * TDD Tests for Authentication Context
 * RED Phase: These tests should FAIL initially until implementation is complete
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth, AuthStatus } from './AuthContext';
import type { WebflowOAuthToken } from '../types/webflow-data-api';

// Mock WebflowAuth class
const mockWebflowAuth = {
  getValidToken: vi.fn(),
  initiateOAuthFlow: vi.fn(),
  handleOAuthCallback: vi.fn(),
  clearStoredToken: vi.fn(),
  getStoredToken: vi.fn(),
  storeToken: vi.fn(),
  hasScope: vi.fn(),
};

vi.mock('../lib/webflowAuth', () => ({
  WebflowAuth: vi.fn().mockImplementation(() => mockWebflowAuth),
}));

// Mock fetch for user info
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Test component that uses auth context
function TestComponent() {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    token, 
    status,
    login, 
    logout, 
    hasPermission 
  } = useAuth();

  return (
    <div>
      <div data-testid="auth-status">{status}</div>
      <div data-testid="is-authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="is-loading">{isLoading.toString()}</div>
      <div data-testid="user-email">{user?.email || 'No user'}</div>
      <div data-testid="token-access">{token?.access_token || 'No token'}</div>
      <div data-testid="has-write-permission">{hasPermission('sites:write').toString()}</div>
      <button data-testid="login-button" onClick={login}>Login</button>
      <button data-testid="logout-button" onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  const mockToken: WebflowOAuthToken = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    token_type: 'Bearer',
    expires_in: 3600,
    scope: 'sites:read sites:write cms:read cms:write pages:read pages:write',
    expires_at: Date.now() + 3600000,
  };

  const mockUser = {
    _id: 'user_12345',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    createdOn: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should provide default unauthenticated state', async () => {
      mockWebflowAuth.getValidToken.mockResolvedValue(null);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent(AuthStatus.UNAUTHENTICATED);
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
        expect(screen.getByTestId('user-email')).toHaveTextContent('No user');
        expect(screen.getByTestId('token-access')).toHaveTextContent('No token');
      });
    });

    it('should show loading state during initialization', () => {
      // Mock a pending promise
      mockWebflowAuth.getValidToken.mockReturnValue(new Promise(() => {}));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('auth-status')).toHaveTextContent(AuthStatus.LOADING);
      expect(screen.getByTestId('is-loading')).toHaveTextContent('true');
    });

    it('should restore authenticated state from stored token', async () => {
      mockWebflowAuth.getValidToken.mockResolvedValue(mockToken);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUser),
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent(AuthStatus.AUTHENTICATED);
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('user-email')).toHaveTextContent(mockUser.email);
        expect(screen.getByTestId('token-access')).toHaveTextContent(mockToken.access_token);
      });
    });
  });

  describe('Authentication Flow', () => {
    it('should handle login initiation', async () => {
      mockWebflowAuth.getValidToken.mockResolvedValue(null);
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent(AuthStatus.UNAUTHENTICATED);
      });

      const loginButton = screen.getByTestId('login-button');
      await userEvent.click(loginButton);

      expect(mockWebflowAuth.initiateOAuthFlow).toHaveBeenCalled();
    });

    it('should handle successful authentication', async () => {
      mockWebflowAuth.getValidToken.mockResolvedValue(null);
      
      const { rerender } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent(AuthStatus.UNAUTHENTICATED);
      });

      // Simulate OAuth callback success
      mockWebflowAuth.getValidToken.mockResolvedValue(mockToken);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUser),
      });

      // Trigger re-authentication check
      rerender(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent(AuthStatus.AUTHENTICATED);
        expect(screen.getByTestId('user-email')).toHaveTextContent(mockUser.email);
      });
    });

    it('should handle logout', async () => {
      mockWebflowAuth.getValidToken.mockResolvedValue(mockToken);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUser),
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent(AuthStatus.AUTHENTICATED);
      });

      const logoutButton = screen.getByTestId('logout-button');
      await userEvent.click(logoutButton);

      expect(mockWebflowAuth.clearStoredToken).toHaveBeenCalled();
      
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent(AuthStatus.UNAUTHENTICATED);
        expect(screen.getByTestId('user-email')).toHaveTextContent('No user');
        expect(screen.getByTestId('token-access')).toHaveTextContent('No token');
      });
    });
  });

  describe('User Info Fetching', () => {
    it('should fetch user info after authentication', async () => {
      mockWebflowAuth.getValidToken.mockResolvedValue(mockToken);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUser),
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/user'),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': `Bearer ${mockToken.access_token}`,
            }),
          })
        );
      });
    });

    it('should handle user info fetch errors', async () => {
      mockWebflowAuth.getValidToken.mockResolvedValue(mockToken);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent(AuthStatus.ERROR);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch user info:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should retry user info fetch on network errors', async () => {
      mockWebflowAuth.getValidToken.mockResolvedValue(mockToken);
      
      // First call fails, second succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Server Error' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUser),
        });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent(AuthStatus.AUTHENTICATED);
        expect(screen.getByTestId('user-email')).toHaveTextContent(mockUser.email);
      });

      // Should have retried the request
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Permission Checking', () => {
    it('should check token permissions correctly', async () => {
      mockWebflowAuth.getValidToken.mockResolvedValue(mockToken);
      mockWebflowAuth.hasScope.mockReturnValue(true);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUser),
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('has-write-permission')).toHaveTextContent('true');
      });

      expect(mockWebflowAuth.hasScope).toHaveBeenCalledWith(mockToken, 'sites:write');
    });

    it('should return false for permissions when not authenticated', async () => {
      mockWebflowAuth.getValidToken.mockResolvedValue(null);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('has-write-permission')).toHaveTextContent('false');
      });
    });

    it('should handle multiple permission checks', async () => {
      mockWebflowAuth.getValidToken.mockResolvedValue(mockToken);
      mockWebflowAuth.hasScope.mockImplementation((token, scope) => {
        if (Array.isArray(scope)) {
          return scope.every(s => mockToken.scope.includes(s));
        }
        return mockToken.scope.includes(scope);
      });
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUser),
      });

      function MultiPermissionComponent() {
        const { hasPermission } = useAuth();
        return (
          <div>
            <div data-testid="has-read">{hasPermission('sites:read').toString()}</div>
            <div data-testid="has-write">{hasPermission('sites:write').toString()}</div>
            <div data-testid="has-both">{hasPermission(['sites:read', 'sites:write']).toString()}</div>
            <div data-testid="has-missing">{hasPermission('missing:scope').toString()}</div>
          </div>
        );
      }

      render(
        <AuthProvider>
          <MultiPermissionComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('has-read')).toHaveTextContent('true');
        expect(screen.getByTestId('has-write')).toHaveTextContent('true');
        expect(screen.getByTestId('has-both')).toHaveTextContent('true');
        expect(screen.getByTestId('has-missing')).toHaveTextContent('false');
      });
    });
  });

  describe('Token Refresh', () => {
    it('should refresh expired tokens automatically', async () => {
      const expiredToken = {
        ...mockToken,
        expires_at: Date.now() - 1000, // Expired
      };

      const newToken = {
        ...mockToken,
        access_token: 'new-access-token',
        expires_at: Date.now() + 3600000,
      };

      mockWebflowAuth.getValidToken
        .mockResolvedValueOnce(expiredToken)
        .mockResolvedValueOnce(newToken);
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUser),
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('token-access')).toHaveTextContent(newToken.access_token);
      });
    });

    it('should handle token refresh failures', async () => {
      mockWebflowAuth.getValidToken.mockResolvedValue(null);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent(AuthStatus.UNAUTHENTICATED);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors gracefully', async () => {
      mockWebflowAuth.getValidToken.mockRejectedValue(new Error('Auth service unavailable'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent(AuthStatus.ERROR);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Authentication error:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should recover from errors on retry', async () => {
      mockWebflowAuth.getValidToken
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockToken);
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUser),
      });

      const { rerender } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent(AuthStatus.ERROR);
      });

      // Trigger retry
      rerender(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent(AuthStatus.AUTHENTICATED);
      });
    });
  });

  describe('Context Usage', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('should provide stable references for functions', async () => {
      mockWebflowAuth.getValidToken.mockResolvedValue(null);

      let renderCount = 0;
      let loginRef: (() => void) | undefined;
      let logoutRef: (() => void) | undefined;
      let hasPermissionRef: ((permission: string | string[]) => boolean) | undefined;

      function ReferenceTestComponent() {
        renderCount++;
        const { login, logout, hasPermission } = useAuth();
        
        if (renderCount === 1) {
          loginRef = login;
          logoutRef = logout;
          hasPermissionRef = hasPermission;
        } else {
          expect(login).toBe(loginRef);
          expect(logout).toBe(logoutRef);
          expect(hasPermission).toBe(hasPermissionRef);
        }

        return <div data-testid="render-count">{renderCount}</div>;
      }

      const { rerender } = render(
        <AuthProvider>
          <ReferenceTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('render-count')).toHaveTextContent('1');
      });

      rerender(
        <AuthProvider>
          <ReferenceTestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('render-count')).toHaveTextContent('2');
      });
    });
  });
});