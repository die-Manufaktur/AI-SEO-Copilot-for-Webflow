/**
 * Worker OAuth Proxy Module
 * GREEN Phase: Implementation to make TDD tests pass
 */

import { Context } from 'hono';

interface OAuthTokenRequest {
  grant_type: 'authorization_code' | 'refresh_token';
  code?: string;
  code_verifier?: string;
  redirect_uri?: string;
  refresh_token?: string;
}

interface WebflowOAuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
  scope: string;
}

interface WebflowOAuthError {
  error: string;
  error_description: string;
}

export const oauthProxy = {
  /**
   * Exchange authorization code for access token
   */
  async exchangeToken(c: Context): Promise<Response> {
    try {
      const body: OAuthTokenRequest = await c.req.json();

      // Validate environment variables
      if (!c.env.WEBFLOW_CLIENT_ID || !c.env.WEBFLOW_CLIENT_SECRET) {
        return c.json({
          error: 'server_error',
          error_description: 'OAuth client credentials not configured',
        }, 500);
      }

      // Validate required parameters
      if (body.grant_type !== 'authorization_code') {
        return c.json({
          error: 'unsupported_grant_type',
          error_description: 'Only authorization_code grant type is supported',
        }, 400);
      }

      if (!body.code || !body.code_verifier) {
        return c.json({
          error: 'invalid_request',
          error_description: 'Missing required parameters: code, code_verifier',
        }, 400);
      }

      // Validate redirect URI
      if (body.redirect_uri !== c.env.OAUTH_REDIRECT_URI) {
        return c.json({
          error: 'invalid_request',
          error_description: 'Invalid redirect URI',
        }, 400);
      }

      // Exchange code for token with Webflow
      const tokenResponse = await fetch('https://webflow.com/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: c.env.WEBFLOW_CLIENT_ID || '',
          client_secret: c.env.WEBFLOW_CLIENT_SECRET || '',
          code: body.code || '',
          code_verifier: body.code_verifier || '',
          redirect_uri: body.redirect_uri || '',
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        // Handle rate limiting
        if (tokenResponse.status === 429) {
          const retryAfter = tokenResponse.headers.get('X-RateLimit-Reset');
          const retryAfterSeconds = retryAfter 
            ? Math.ceil((parseInt(retryAfter) - Date.now()) / 1000)
            : 60;

          return c.json({
            ...tokenData,
            retry_after: retryAfterSeconds,
          }, 429);
        }

        return c.json(tokenData, tokenResponse.status as any);
      }

      return c.json(tokenData);
    } catch (error) {
      console.error('OAuth token exchange error:', error);
      return c.json({
        error: 'server_error',
        error_description: 'Internal server error during token exchange',
      }, 500);
    }
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(c: Context): Promise<Response> {
    try {
      const body: OAuthTokenRequest = await c.req.json();

      // Validate environment variables
      if (!c.env.WEBFLOW_CLIENT_ID || !c.env.WEBFLOW_CLIENT_SECRET) {
        return c.json({
          error: 'server_error',
          error_description: 'OAuth client credentials not configured',
        }, 500);
      }

      // Validate required parameters
      if (body.grant_type !== 'refresh_token') {
        return c.json({
          error: 'unsupported_grant_type',
          error_description: 'Only refresh_token grant type is supported',
        }, 400);
      }

      if (!body.refresh_token) {
        return c.json({
          error: 'invalid_request',
          error_description: 'Missing required parameter: refresh_token',
        }, 400);
      }

      // Refresh token with Webflow
      const tokenResponse = await fetch('https://webflow.com/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: c.env.WEBFLOW_CLIENT_ID,
          client_secret: c.env.WEBFLOW_CLIENT_SECRET,
          refresh_token: body.refresh_token,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        return c.json(tokenData, tokenResponse.status as any);
      }

      return c.json(tokenData);
    } catch (error) {
      console.error('OAuth token refresh error:', error);
      return c.json({
        error: 'server_error',
        error_description: 'Internal server error during token refresh',
      }, 500);
    }
  },

  /**
   * Proxy user info request to Webflow API
   */
  async getUserInfo(c: Context): Promise<Response> {
    try {
      const authHeader = c.req.header('Authorization');

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({
          error: 'unauthorized',
          error_description: 'Missing or invalid authorization header',
        }, 401);
      }

      // Proxy request to Webflow API
      const userResponse = await fetch('https://api.webflow.com/user', {
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/json',
        },
      });

      const userData = await userResponse.json();

      if (!userResponse.ok) {
        return c.json(userData, userResponse.status as any);
      }

      return c.json(userData);
    } catch (error) {
      console.error('OAuth user info error:', error);
      return c.json({
        error: 'server_error',
        error_description: 'Internal server error during user info retrieval',
      }, 500);
    }
  },
};