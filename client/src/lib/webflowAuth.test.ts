/**
 * TDD Tests for Webflow OAuth Authentication
 * RED Phase: These tests should FAIL initially until implementation is complete
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebflowAuth } from './webflowAuth';
import type { WebflowOAuthConfig, WebflowOAuthToken } from '../types/webflow-data-api';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock crypto for PKCE
Object.defineProperty(window, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-123',
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    subtle: {
      digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
    },
  },
});

describe('WebflowAuth', () => {
  let webflowAuth: WebflowAuth;
  let mockConfig: WebflowOAuthConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    
    mockConfig = {
      clientId: 'test-client-id',
      redirectUri: 'http://localhost:1337/oauth/callback',
      scope: ['sites:read', 'sites:write', 'cms:read', 'cms:write', 'pages:read', 'pages:write'],
    };

    webflowAuth = new WebflowAuth(mockConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('OAuth Initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(webflowAuth.getConfig()).toEqual(mockConfig);
    });

    it('should validate required configuration parameters', () => {
      expect(() => new WebflowAuth({
        clientId: '',
        redirectUri: 'http://localhost:1337/oauth/callback',
        scope: ['sites:read'],
      })).toThrow('Client ID is required');

      expect(() => new WebflowAuth({
        clientId: 'test-client-id',
        redirectUri: '',
        scope: ['sites:read'],
      })).toThrow('Redirect URI is required');

      expect(() => new WebflowAuth({
        clientId: 'test-client-id',
        redirectUri: 'http://localhost:1337/oauth/callback',
        scope: [],
      })).toThrow('At least one scope is required');
    });

    it('should generate state parameter for OAuth security', () => {
      const state = webflowAuth.generateState();
      expect(state).toBeDefined();
      expect(typeof state).toBe('string');
      expect(state.length).toBeGreaterThan(10);
    });
  });

  describe('PKCE Implementation', () => {
    it('should generate code verifier', async () => {
      const codeVerifier = await webflowAuth.generateCodeVerifier();
      expect(codeVerifier).toBeDefined();
      expect(typeof codeVerifier).toBe('string');
      expect(codeVerifier.length).toBeGreaterThanOrEqual(43);
      expect(codeVerifier.length).toBeLessThanOrEqual(128);
    });

    it('should generate code challenge from verifier', async () => {
      const codeVerifier = await webflowAuth.generateCodeVerifier();
      const codeChallenge = await webflowAuth.generateCodeChallenge(codeVerifier);
      
      expect(codeChallenge).toBeDefined();
      expect(typeof codeChallenge).toBe('string');
      expect(codeChallenge).not.toBe(codeVerifier);
    });

    it('should store code verifier securely', async () => {
      const codeVerifier = await webflowAuth.generateCodeVerifier();
      webflowAuth.storeCodeVerifier(codeVerifier);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'webflow_oauth_code_verifier',
        expect.stringContaining(codeVerifier)
      );
    });

    it('should retrieve stored code verifier', async () => {
      const codeVerifier = 'test-code-verifier';
      mockLocalStorage.getItem.mockReturnValue(codeVerifier);
      
      const retrieved = webflowAuth.getStoredCodeVerifier();
      expect(retrieved).toBe(codeVerifier);
    });
  });

  describe('OAuth URL Generation', () => {
    it('should generate authorization URL with PKCE', async () => {
      const codeVerifier = 'test-code-verifier';
      const codeChallenge = 'test-code-challenge';
      const state = 'test-state';
      
      vi.spyOn(webflowAuth, 'generateCodeVerifier').mockResolvedValue(codeVerifier);
      vi.spyOn(webflowAuth, 'generateCodeChallenge').mockResolvedValue(codeChallenge);
      vi.spyOn(webflowAuth, 'generateState').mockReturnValue(state);
      
      const authUrl = await webflowAuth.getAuthorizationUrl();
      
      expect(authUrl).toContain('https://webflow.com/oauth/authorize');
      expect(authUrl).toContain(`client_id=${mockConfig.clientId}`);
      expect(authUrl).toContain(`redirect_uri=${encodeURIComponent(mockConfig.redirectUri)}`);
      expect(authUrl).toContain(`scope=${encodeURIComponent(mockConfig.scope.join(' '))}`);
      expect(authUrl).toContain(`state=${state}`);
      expect(authUrl).toContain(`code_challenge=${codeChallenge}`);
      expect(authUrl).toContain('code_challenge_method=S256');
      expect(authUrl).toContain('response_type=code');
    });

    it('should store state for validation', async () => {
      const state = 'test-state';
      vi.spyOn(webflowAuth, 'generateState').mockReturnValue(state);
      
      await webflowAuth.getAuthorizationUrl();
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'webflow_oauth_state',
        state
      );
    });
  });

  describe('Token Exchange', () => {
    const mockToken: WebflowOAuthToken = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'sites:read sites:write cms:read cms:write pages:read pages:write',
    };

    it('should exchange authorization code for tokens', async () => {
      const authCode = 'test-auth-code';
      const codeVerifier = 'test-code-verifier';
      const state = 'test-state';
      
      mockLocalStorage.getItem
        .mockReturnValueOnce(codeVerifier) // code verifier
        .mockReturnValueOnce(state); // state
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockToken),
      });
      
      const result = await webflowAuth.exchangeCodeForToken(authCode, state);
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://webflow.com/oauth/access_token',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
          }),
          body: expect.stringContaining('grant_type=authorization_code'),
        })
      );
      
      expect(result).toEqual(expect.objectContaining(mockToken));
    });

    it('should validate state parameter', async () => {
      const authCode = 'test-auth-code';
      const invalidState = 'invalid-state';
      const storedState = 'valid-state';
      
      mockLocalStorage.getItem.mockReturnValue(storedState);
      
      await expect(
        webflowAuth.exchangeCodeForToken(authCode, invalidState)
      ).rejects.toThrow('Invalid state parameter');
    });

    it('should handle token exchange errors', async () => {
      const authCode = 'test-auth-code';
      const state = 'test-state';
      
      mockLocalStorage.getItem.mockReturnValue(state);
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          error: 'invalid_grant',
          error_description: 'The provided authorization grant is invalid',
        }),
      });
      
      await expect(
        webflowAuth.exchangeCodeForToken(authCode, state)
      ).rejects.toThrow('OAuth error: invalid_grant - The provided authorization grant is invalid');
    });

    it('should calculate and store token expiration time', async () => {
      const authCode = 'test-auth-code';
      const state = 'test-state';
      
      mockLocalStorage.getItem.mockReturnValue(state);
      
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockToken),
      });
      
      const result = await webflowAuth.exchangeCodeForToken(authCode, state);
      
      expect(result.expires_at).toBe(now + (mockToken.expires_in * 1000));
    });
  });

  describe('Token Refresh', () => {
    const mockToken: WebflowOAuthToken = {
      access_token: 'old-access-token',
      refresh_token: 'test-refresh-token',
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'sites:read sites:write cms:read cms:write pages:read pages:write',
      expires_at: Date.now() - 1000, // Expired
    };

    const mockNewToken: WebflowOAuthToken = {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'sites:read sites:write cms:read cms:write pages:read pages:write',
    };

    it('should refresh expired tokens', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockNewToken),
      });
      
      const result = await webflowAuth.refreshToken(mockToken.refresh_token);
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://webflow.com/oauth/access_token',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
          }),
          body: expect.stringContaining('grant_type=refresh_token'),
        })
      );
      
      expect(result.access_token).toBe(mockNewToken.access_token);
    });

    it('should handle refresh token errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          error: 'invalid_grant',
          error_description: 'The refresh token is expired',
        }),
      });
      
      await expect(
        webflowAuth.refreshToken('expired-refresh-token')
      ).rejects.toThrow('OAuth error: invalid_grant - The refresh token is expired');
    });
  });

  describe('Token Storage', () => {
    const mockToken: WebflowOAuthToken = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'sites:read sites:write cms:read cms:write pages:read pages:write',
      expires_at: Date.now() + 3600000,
    };

    it('should store tokens securely', () => {
      webflowAuth.storeToken(mockToken);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'webflow_oauth_token',
        expect.stringContaining(mockToken.access_token)
      );
    });

    it('should retrieve stored tokens', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockToken));
      
      const retrieved = webflowAuth.getStoredToken();
      
      expect(retrieved).toEqual(mockToken);
    });

    it('should return null for missing tokens', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const retrieved = webflowAuth.getStoredToken();
      
      expect(retrieved).toBeNull();
    });

    it('should handle corrupted token data', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');
      
      const retrieved = webflowAuth.getStoredToken();
      
      expect(retrieved).toBeNull();
    });

    it('should clear stored tokens', () => {
      webflowAuth.clearStoredToken();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('webflow_oauth_token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('webflow_oauth_state');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('webflow_oauth_code_verifier');
    });
  });

  describe('Token Validation', () => {
    it('should detect expired tokens', () => {
      const expiredToken: WebflowOAuthToken = {
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'sites:read',
        expires_at: Date.now() - 1000, // Expired 1 second ago
      };
      
      expect(webflowAuth.isTokenExpired(expiredToken)).toBe(true);
    });

    it('should detect valid tokens', () => {
      const validToken: WebflowOAuthToken = {
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'sites:read',
        expires_at: Date.now() + 3600000, // Expires in 1 hour
      };
      
      expect(webflowAuth.isTokenExpired(validToken)).toBe(false);
    });

    it('should provide buffer time for token expiration', () => {
      const bufferTime = 5 * 60 * 1000; // 5 minutes
      const tokenExpiringWithinBuffer: WebflowOAuthToken = {
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'sites:read',
        expires_at: Date.now() + (bufferTime - 1000), // Expires within buffer
      };
      
      expect(webflowAuth.isTokenExpired(tokenExpiringWithinBuffer, bufferTime)).toBe(true);
    });

    it('should validate token scopes', () => {
      const token: WebflowOAuthToken = {
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'sites:read pages:read',
        expires_at: Date.now() + 3600000,
      };
      
      expect(webflowAuth.hasScope(token, 'sites:read')).toBe(true);
      expect(webflowAuth.hasScope(token, 'sites:write')).toBe(false);
      expect(webflowAuth.hasScope(token, ['sites:read', 'pages:read'])).toBe(true);
      expect(webflowAuth.hasScope(token, ['sites:read', 'sites:write'])).toBe(false);
    });
  });

  describe('Auto Token Refresh', () => {
    it('should automatically refresh token when needed', async () => {
      const expiredToken: WebflowOAuthToken = {
        access_token: 'expired-token',
        refresh_token: 'test-refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'sites:read',
        expires_at: Date.now() - 1000,
      };

      const newToken: WebflowOAuthToken = {
        access_token: 'new-token',
        refresh_token: 'new-refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'sites:read',
        expires_at: Date.now() + 3600000,
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredToken));
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(newToken),
      });

      const result = await webflowAuth.getValidToken();

      expect(result).toEqual(expect.objectContaining(newToken));
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'webflow_oauth_token',
        expect.stringContaining(newToken.access_token)
      );
    });

    it('should return null when refresh fails', async () => {
      const expiredToken: WebflowOAuthToken = {
        access_token: 'expired-token',
        refresh_token: 'expired-refresh-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'sites:read',
        expires_at: Date.now() - 1000,
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredToken));
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          error: 'invalid_grant',
          error_description: 'The refresh token is expired',
        }),
      });

      const result = await webflowAuth.getValidToken();

      expect(result).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('webflow_oauth_token');
    });
  });

  describe('OAuth Flow Integration', () => {
    it('should initiate OAuth flow', async () => {
      const mockWindow = {
        location: { href: '' },
      };
      
      vi.stubGlobal('window', mockWindow);
      
      await webflowAuth.initiateOAuthFlow();
      
      expect(mockWindow.location.href).toContain('https://webflow.com/oauth/authorize');
    });

    it('should handle OAuth callback', async () => {
      const mockUrl = new URL('http://localhost:1337/oauth/callback?code=test-code&state=test-state');
      const mockToken: WebflowOAuthToken = {
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'sites:read',
        expires_at: Date.now() + 3600000,
      };

      mockLocalStorage.getItem.mockReturnValue('test-state');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockToken),
      });

      const result = await webflowAuth.handleOAuthCallback(mockUrl);

      expect(result).toEqual(expect.objectContaining(mockToken));
    });

    it('should handle OAuth callback errors', async () => {
      const mockUrl = new URL('http://localhost:1337/oauth/callback?error=access_denied&error_description=User%20denied%20access');

      await expect(
        webflowAuth.handleOAuthCallback(mockUrl)
      ).rejects.toThrow('OAuth error: access_denied - User denied access');
    });
  });
});