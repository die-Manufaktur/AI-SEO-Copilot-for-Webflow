/**
 * Webflow OAuth 2.0 Authentication with PKCE
 * GREEN Phase: Minimal implementation to make tests pass
 */

import type { 
  WebflowOAuthConfig, 
  WebflowOAuthToken, 
  WebflowOAuthError 
} from '../types/webflow-data-api';

export class WebflowAuth {
  private config: WebflowOAuthConfig;
  private static readonly OAUTH_BASE_URL = 'https://webflow.com/oauth';
  private static readonly TOKEN_STORAGE_KEY = 'webflow_oauth_token';
  private static readonly STATE_STORAGE_KEY = 'webflow_oauth_state';
  private static readonly CODE_VERIFIER_STORAGE_KEY = 'webflow_oauth_code_verifier';

  constructor(config: WebflowOAuthConfig) {
    this.validateConfig(config);
    this.config = config;
  }

  /**
   * Get current configuration
   */
  getConfig(): WebflowOAuthConfig {
    return this.config;
  }

  /**
   * Validate OAuth configuration
   */
  private validateConfig(config: WebflowOAuthConfig): void {
    if (!config.clientId?.trim()) {
      throw new Error('Client ID is required');
    }
    if (!config.redirectUri?.trim()) {
      throw new Error('Redirect URI is required');
    }
    if (!config.scope?.length) {
      throw new Error('At least one scope is required');
    }
  }

  /**
   * Generate secure state parameter for OAuth
   */
  generateState(): string {
    return crypto.randomUUID() + '-' + Date.now().toString(36);
  }

  /**
   * Generate PKCE code verifier
   */
  async generateCodeVerifier(): Promise<string> {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64URLEncode(array);
  }

  /**
   * Generate PKCE code challenge from verifier
   */
  async generateCodeChallenge(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return this.base64URLEncode(new Uint8Array(digest));
  }

  /**
   * Store code verifier securely
   */
  storeCodeVerifier(codeVerifier: string): void {
    localStorage.setItem(WebflowAuth.CODE_VERIFIER_STORAGE_KEY, codeVerifier);
  }

  /**
   * Retrieve stored code verifier
   */
  getStoredCodeVerifier(): string | null {
    return localStorage.getItem(WebflowAuth.CODE_VERIFIER_STORAGE_KEY);
  }

  /**
   * Generate OAuth authorization URL with PKCE
   */
  async getAuthorizationUrl(): Promise<string> {
    const codeVerifier = await this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    const state = this.generateState();

    // Store for later verification
    this.storeCodeVerifier(codeVerifier);
    localStorage.setItem(WebflowAuth.STATE_STORAGE_KEY, state);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope.join(' '),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return `${WebflowAuth.OAUTH_BASE_URL}/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string, state: string): Promise<WebflowOAuthToken> {
    // Validate state parameter
    const storedState = localStorage.getItem(WebflowAuth.STATE_STORAGE_KEY);
    if (state !== storedState) {
      throw new Error('Invalid state parameter');
    }

    const codeVerifier = this.getStoredCodeVerifier();
    if (!codeVerifier) {
      throw new Error('Code verifier not found');
    }

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.config.clientId,
      code,
      redirect_uri: this.config.redirectUri,
      code_verifier: codeVerifier,
    });

    const response = await fetch(`${WebflowAuth.OAUTH_BASE_URL}/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as WebflowOAuthError;
      throw new Error(`OAuth error: ${error.error} - ${error.error_description || 'Unknown error'}`);
    }

    const token = data as WebflowOAuthToken;
    
    // Calculate expiration time
    token.expires_at = Date.now() + (token.expires_in * 1000);

    // Clean up temporary storage
    localStorage.removeItem(WebflowAuth.STATE_STORAGE_KEY);
    localStorage.removeItem(WebflowAuth.CODE_VERIFIER_STORAGE_KEY);

    return token;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<WebflowOAuthToken> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.config.clientId,
      refresh_token: refreshToken,
    });

    const response = await fetch(`${WebflowAuth.OAUTH_BASE_URL}/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as WebflowOAuthError;
      throw new Error(`OAuth error: ${error.error} - ${error.error_description || 'Unknown error'}`);
    }

    const token = data as WebflowOAuthToken;
    
    // Calculate expiration time
    token.expires_at = Date.now() + (token.expires_in * 1000);

    return token;
  }

  /**
   * Store token securely in localStorage
   */
  storeToken(token: WebflowOAuthToken): void {
    localStorage.setItem(WebflowAuth.TOKEN_STORAGE_KEY, JSON.stringify(token));
  }

  /**
   * Retrieve stored token
   */
  getStoredToken(): WebflowOAuthToken | null {
    try {
      const stored = localStorage.getItem(WebflowAuth.TOKEN_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /**
   * Clear all stored authentication data
   */
  clearStoredToken(): void {
    localStorage.removeItem(WebflowAuth.TOKEN_STORAGE_KEY);
    localStorage.removeItem(WebflowAuth.STATE_STORAGE_KEY);
    localStorage.removeItem(WebflowAuth.CODE_VERIFIER_STORAGE_KEY);
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: WebflowOAuthToken, bufferTimeMs: number = 5 * 60 * 1000): boolean {
    if (!token.expires_at) {
      return true;
    }
    return Date.now() + bufferTimeMs >= token.expires_at;
  }

  /**
   * Check if token has required scope(s)
   */
  hasScope(token: WebflowOAuthToken, requiredScope: string | string[]): boolean {
    const tokenScopes = token.scope.split(' ');
    
    if (typeof requiredScope === 'string') {
      return tokenScopes.includes(requiredScope);
    }
    
    return requiredScope.every(scope => tokenScopes.includes(scope));
  }

  /**
   * Get valid token, refreshing if necessary
   */
  async getValidToken(): Promise<WebflowOAuthToken | null> {
    const token = this.getStoredToken();
    
    if (!token) {
      return null;
    }

    if (!this.isTokenExpired(token)) {
      return token;
    }

    // Try to refresh token
    try {
      const newToken = await this.refreshToken(token.refresh_token);
      this.storeToken(newToken);
      return newToken;
    } catch {
      // Refresh failed, clear stored token
      this.clearStoredToken();
      return null;
    }
  }

  /**
   * Initiate OAuth flow by redirecting to authorization URL
   */
  async initiateOAuthFlow(): Promise<void> {
    const authUrl = await this.getAuthorizationUrl();
    window.location.href = authUrl;
  }

  /**
   * Handle OAuth callback from redirect
   */
  async handleOAuthCallback(url: URL): Promise<WebflowOAuthToken> {
    const params = new URLSearchParams(url.search);
    
    // Check for OAuth errors
    const error = params.get('error');
    if (error) {
      const errorDescription = params.get('error_description') || 'Unknown error';
      throw new Error(`OAuth error: ${error} - ${decodeURIComponent(errorDescription)}`);
    }

    // Extract authorization code and state
    const code = params.get('code');
    const state = params.get('state');

    if (!code || !state) {
      throw new Error('Missing authorization code or state parameter');
    }

    // Exchange code for token
    const token = await this.exchangeCodeForToken(code, state);
    
    // Store token
    this.storeToken(token);

    return token;
  }

  /**
   * Base64 URL encoding for PKCE
   */
  private base64URLEncode(array: Uint8Array): string {
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
}