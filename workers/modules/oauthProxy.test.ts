/**
 * Worker OAuth Proxy Tests
 * RED Phase: Write failing tests for OAuth proxy functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { oauthProxy } from './oauthProxy';
import { Context } from 'hono';

describe('Worker OAuth Proxy', () => {
  let mockContext: Partial<Context>;
  let mockEnv: any;

  beforeEach(() => {
    mockEnv = {
      WEBFLOW_CLIENT_ID: 'test_client_id',
      WEBFLOW_CLIENT_SECRET: 'test_client_secret',
      OAUTH_REDIRECT_URI: 'https://localhost:1337/oauth/callback',
    };

    mockContext = {
      req: {
        json: vi.fn(),
        text: vi.fn(),
        header: vi.fn(),
      },
      json: vi.fn(),
      text: vi.fn(),
      env: mockEnv,
    } as any;
  });

  describe('Token Exchange', () => {
    it('should exchange authorization code for access token', async () => {
      const requestBody = {
        grant_type: 'authorization_code',
        code: 'test_auth_code',
        code_verifier: 'test_code_verifier',
        redirect_uri: 'https://localhost:1337/oauth/callback',
      };

      (mockContext.req!.json as any).mockResolvedValue(requestBody);

      // Mock fetch for Webflow token exchange
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'wf_access_token_12345',
          refresh_token: 'wf_refresh_token_12345',
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'sites:read sites:write cms:read cms:write pages:read pages:write',
        }),
      });

      const result = await oauthProxy.exchangeToken(mockContext as Context);

      expect(mockContext.json).toHaveBeenCalledWith({
        access_token: 'wf_access_token_12345',
        refresh_token: 'wf_refresh_token_12345',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'sites:read sites:write cms:read cms:write pages:read pages:write',
      });
    });

    it('should handle invalid authorization code', async () => {
      const requestBody = {
        grant_type: 'authorization_code',
        code: 'invalid_code',
        code_verifier: 'test_code_verifier',
        redirect_uri: 'https://localhost:1337/oauth/callback',
      };

      (mockContext.req!.json as any).mockResolvedValue(requestBody);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          error: 'invalid_grant',
          error_description: 'The provided authorization grant is invalid',
        }),
      });

      const result = await oauthProxy.exchangeToken(mockContext as Context);

      expect(mockContext.json).toHaveBeenCalledWith({
        error: 'invalid_grant',
        error_description: 'The provided authorization grant is invalid',
      }, 400);
    });

    it('should validate required parameters', async () => {
      const requestBody = {
        grant_type: 'authorization_code',
        // Missing code and code_verifier
        redirect_uri: 'https://localhost:1337/oauth/callback',
      };

      (mockContext.req!.json as any).mockResolvedValue(requestBody);

      const result = await oauthProxy.exchangeToken(mockContext as Context);

      expect(mockContext.json).toHaveBeenCalledWith({
        error: 'invalid_request',
        error_description: 'Missing required parameters: code, code_verifier',
      }, 400);
    });
  });

  describe('Token Refresh', () => {
    it('should refresh access token using refresh token', async () => {
      const requestBody = {
        grant_type: 'refresh_token',
        refresh_token: 'wf_refresh_token_12345',
      };

      (mockContext.req!.json as any).mockResolvedValue(requestBody);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'wf_new_access_token_12345',
          refresh_token: 'wf_new_refresh_token_12345',
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'sites:read sites:write cms:read cms:write pages:read pages:write',
        }),
      });

      const result = await oauthProxy.refreshToken(mockContext as Context);

      expect(mockContext.json).toHaveBeenCalledWith({
        access_token: 'wf_new_access_token_12345',
        refresh_token: 'wf_new_refresh_token_12345',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'sites:read sites:write cms:read cms:write pages:read pages:write',
      });
    });

    it('should handle expired refresh token', async () => {
      const requestBody = {
        grant_type: 'refresh_token',
        refresh_token: 'expired_refresh_token',
      };

      (mockContext.req!.json as any).mockResolvedValue(requestBody);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          error: 'invalid_grant',
          error_description: 'The refresh token is expired',
        }),
      });

      const result = await oauthProxy.refreshToken(mockContext as Context);

      expect(mockContext.json).toHaveBeenCalledWith({
        error: 'invalid_grant',
        error_description: 'The refresh token is expired',
      }, 400);
    });

    it('should validate refresh token parameter', async () => {
      const requestBody = {
        grant_type: 'refresh_token',
        // Missing refresh_token
      };

      (mockContext.req!.json as any).mockResolvedValue(requestBody);

      const result = await oauthProxy.refreshToken(mockContext as Context);

      expect(mockContext.json).toHaveBeenCalledWith({
        error: 'invalid_request',
        error_description: 'Missing required parameter: refresh_token',
      }, 400);
    });
  });

  describe('User Info Proxy', () => {
    it('should proxy user info request to Webflow API', async () => {
      const authHeader = 'Bearer wf_access_token_12345';
      (mockContext.req!.header as any).mockReturnValue(authHeader);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          _id: 'user_12345',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        }),
      });

      const result = await oauthProxy.getUserInfo(mockContext as Context);

      expect(global.fetch).toHaveBeenCalledWith('https://api.webflow.com/user', {
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/json',
        },
      });

      expect(mockContext.json).toHaveBeenCalledWith({
        _id: 'user_12345',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      });
    });

    it('should handle missing authorization header', async () => {
      (mockContext.req!.header as any).mockReturnValue(null);

      const result = await oauthProxy.getUserInfo(mockContext as Context);

      expect(mockContext.json).toHaveBeenCalledWith({
        error: 'unauthorized',
        error_description: 'Missing or invalid authorization header',
      }, 401);
    });

    it('should handle invalid access token', async () => {
      const authHeader = 'Bearer invalid_token';
      (mockContext.req!.header as any).mockReturnValue(authHeader);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          err: 'Unauthorized',
          code: 401,
          msg: 'Invalid or expired access token',
        }),
      });

      const result = await oauthProxy.getUserInfo(mockContext as Context);

      expect(mockContext.json).toHaveBeenCalledWith({
        err: 'Unauthorized',
        code: 401,
        msg: 'Invalid or expired access token',
      }, 401);
    });
  });

  describe('Security', () => {
    it('should validate client credentials', async () => {
      // Test with missing client secret
      mockEnv.WEBFLOW_CLIENT_SECRET = undefined;

      const requestBody = {
        grant_type: 'authorization_code',
        code: 'test_auth_code',
        code_verifier: 'test_code_verifier',
        redirect_uri: 'https://localhost:1337/oauth/callback',
      };

      (mockContext.req!.json as any).mockResolvedValue(requestBody);

      const result = await oauthProxy.exchangeToken(mockContext as Context);

      expect(mockContext.json).toHaveBeenCalledWith({
        error: 'server_error',
        error_description: 'OAuth client credentials not configured',
      }, 500);
    });

    it('should validate redirect URI', async () => {
      const requestBody = {
        grant_type: 'authorization_code',
        code: 'test_auth_code',
        code_verifier: 'test_code_verifier',
        redirect_uri: 'https://malicious-site.com/callback', // Invalid redirect URI
      };

      (mockContext.req!.json as any).mockResolvedValue(requestBody);

      const result = await oauthProxy.exchangeToken(mockContext as Context);

      expect(mockContext.json).toHaveBeenCalledWith({
        error: 'invalid_request',
        error_description: 'Invalid redirect URI',
      }, 400);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limiting from Webflow API', async () => {
      const requestBody = {
        grant_type: 'authorization_code',
        code: 'test_auth_code',
        code_verifier: 'test_code_verifier',
        redirect_uri: 'https://localhost:1337/oauth/callback',
      };

      (mockContext.req!.json as any).mockResolvedValue(requestBody);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Map([
          ['X-RateLimit-Remaining', '0'],
          ['X-RateLimit-Reset', (Date.now() + 60000).toString()],
        ]),
        json: () => Promise.resolve({
          error: 'rate_limit_exceeded',
          error_description: 'Too many requests',
        }),
      });

      const result = await oauthProxy.exchangeToken(mockContext as Context);

      expect(mockContext.json).toHaveBeenCalledWith({
        error: 'rate_limit_exceeded',
        error_description: 'Too many requests',
        retry_after: 60,
      }, 429);
    });
  });
});