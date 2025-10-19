/**
 * TDD Tests for OAuth Callback Page
 * RED Phase: These tests should FAIL initially until implementation is complete
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
  WebflowAuth: vi.fn().mockImplementation(() => ({
    handleOAuthCallback: mockHandleOAuthCallback,
    storeToken: mockStoreToken,
    getConfig: mockGetConfig,
    validateConfig: mockValidateConfig,
  })),
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
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default to successful auth flow
    mockRefreshAuth.mockImplementation(() => Promise.resolve(undefined));
    mockHandleOAuthCallback.mockRejectedValue(new Error('Test error'));
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

  describe('Basic Rendering', () => {
    it('should render the component', () => {
      render(<OAuthCallback />);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      render(<OAuthCallback />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Webflow Authentication');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<OAuthCallback />);
      
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'OAuth authentication callback');
    });

    it('should provide error feedback to screen readers', () => {
      render(<OAuthCallback />);
      
      // Should show error state due to mocked rejection
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});