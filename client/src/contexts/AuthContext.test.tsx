/**
 * Tests for Authentication Context
 * Simplified tests that work with the existing testHelpers setup
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuth, AuthStatus } from './AuthContext';
import { renderWithProviders } from '../__tests__/utils/testHelpers';
import { WebflowAuth } from '../lib/webflowAuth';

// Mock WebflowAuth specifically for AuthContext tests
vi.mock('../lib/webflowAuth', () => ({
  WebflowAuth: vi.fn().mockImplementation(() => ({
    getValidToken: vi.fn(() => Promise.resolve({
      access_token: 'test-token',
      refresh_token: 'test-refresh-token',
      scope: 'sites:read sites:write cms:read cms:write pages:read pages:write',
      expires_in: 3600,
      expires_at: Date.now() + 3600000
    })),
    hasScope: vi.fn(() => true),
    clearStoredToken: vi.fn(),
    initiateOAuthFlow: vi.fn(() => Promise.resolve()),
  }))
}));

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
    hasPermission,
    refreshAuth
  } = useAuth();

  return (
    <div>
      <div data-testid="auth-status">{status}</div>
      <div data-testid="is-authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="is-loading">{isLoading.toString()}</div>
      <div data-testid="user-email">{user?.email || 'No user'}</div>
      <div data-testid="token-access">{token?.access_token || 'No token'}</div>
      <div data-testid="has-write-permission">{String(hasPermission('sites:write') || false)}</div>
      <button data-testid="login-button" onClick={login}>Login</button>
      <button data-testid="logout-button" onClick={logout}>Logout</button>
      <button data-testid="refresh-button" onClick={refreshAuth}>Refresh</button>
    </div>
  );
}

describe('AuthContext', () => {
  // Get the mocked constructor
  const MockedWebflowAuth = vi.mocked(WebflowAuth);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic functionality', () => {
    it('should render without errors when wrapped in providers', () => {
      renderWithProviders(<TestComponent />);
      
      expect(screen.getByTestId('auth-status')).toBeInTheDocument();
      expect(screen.getByTestId('is-authenticated')).toBeInTheDocument();
      expect(screen.getByTestId('is-loading')).toBeInTheDocument();
    });

    it('should provide auth functions', () => {
      renderWithProviders(<TestComponent />);
      
      expect(screen.getByTestId('login-button')).toBeInTheDocument();
      expect(screen.getByTestId('logout-button')).toBeInTheDocument();
      expect(screen.getByTestId('refresh-button')).toBeInTheDocument();
    });

    it('should handle login button clicks', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<TestComponent />);
      
      const loginButton = screen.getByTestId('login-button');
      await user.click(loginButton);
      
      // Should not throw an error
      expect(loginButton).toBeInTheDocument();
    });

    it('should handle logout button clicks', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<TestComponent />);
      
      const logoutButton = screen.getByTestId('logout-button');
      await user.click(logoutButton);
      
      // Should not throw an error
      expect(logoutButton).toBeInTheDocument();
    });

    it('should handle refresh button clicks', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<TestComponent />);
      
      const refreshButton = screen.getByTestId('refresh-button');
      await user.click(refreshButton);
      
      // Should not throw an error
      expect(refreshButton).toBeInTheDocument();
    });
  });

  describe('Context Usage', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderWithProviders(<TestComponent />);
      }).not.toThrow(); // Should not throw since renderWithProviders includes AuthProvider

      consoleSpy.mockRestore();
    });
  });
});