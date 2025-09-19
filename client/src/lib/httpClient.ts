/**
 * HTTP Client
 * REFACTOR Phase: Extract HTTP logic for better testability and organization
 */

import { RateLimitManager, type RateLimitManagerConfig } from './rateLimitManager';
import { 
  WebflowErrorFactory, 
  WebflowConfigError, 
  WebflowAuthError,
  WebflowError 
} from './webflowErrors';
import type { 
  WebflowOAuthToken, 
  WebflowApiError, 
  WebflowRateLimitInfo 
} from '../types/webflow-data-api';

export interface HttpClientConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  rateLimitStrategy: 'queue' | 'throw' | 'retry';
}

export interface RequestOptions {
  timeout?: number;
  retries?: number;
  [key: string]: any;
}

export class HttpClient {
  private token: WebflowOAuthToken;
  private rateLimitManager: RateLimitManager;

  constructor(
    token: WebflowOAuthToken,
    private config: HttpClientConfig
  ) {
    if (!token || !token.access_token) {
      throw WebflowConfigError.invalidToken();
    }

    this.token = token;
    this.rateLimitManager = new RateLimitManager({
      strategy: config.rateLimitStrategy,
      maxRetries: config.retries,
      baseDelay: config.retryDelay,
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): HttpClientConfig {
    return { ...this.config };
  }

  /**
   * Get authorization headers
   */
  getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.token.access_token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get current rate limit information
   */
  getRateLimitInfo(): WebflowRateLimitInfo {
    return this.rateLimitManager.getRateLimitInfo();
  }

  /**
   * Update token
   */
  updateToken(token: WebflowOAuthToken): void {
    if (!token || !token.access_token) {
      throw WebflowConfigError.invalidToken();
    }
    this.token = token;
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(): boolean {
    if (!this.token.expires_at) {
      return false;
    }
    return Date.now() >= this.token.expires_at;
  }

  /**
   * Build query string from parameters
   */
  private buildQueryString(params?: Record<string, any>): string {
    if (!params || Object.keys(params).length === 0) {
      return '';
    }

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Execute HTTP request with retries and rate limiting
   */
  async executeRequest<T>(
    url: string,
    options: RequestInit & RequestOptions,
    retryCount = 0
  ): Promise<T> {
    if (this.isTokenExpired()) {
      throw WebflowAuthError.tokenExpired();
    }

    const { timeout = this.config.timeout, retries = this.config.retries, ...fetchOptions } = options;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          ...this.getAuthHeaders(),
          ...fetchOptions.headers,
        },
      });

      clearTimeout(timeoutId);

      // Update rate limit info
      this.rateLimitManager.updateFromHeaders(response.headers);

      // Handle rate limiting
      if (response.status === 429) {
        const apiError = await response.json() as WebflowApiError;
        const rateLimitError = WebflowErrorFactory.fromResponse(response, apiError);
        
        return this.rateLimitManager.handleRateLimit(
          () => this.executeRequest<T>(url, options, retryCount + 1),
          retryCount
        );
      }

      // Handle success
      if (response.ok) {
        if (response.status === 204) {
          return {} as T; // No content
        }
        return await response.json();
      }

      // Handle errors
      const apiError = await response.json() as WebflowApiError;
      const error = WebflowErrorFactory.fromResponse(response, apiError);
      
      // Retry on 5xx errors
      if (response.status >= 500 && retryCount < retries) {
        const delay = Math.pow(2, retryCount) * this.config.retryDelay;
        await this.sleep(delay);
        return this.executeRequest<T>(url, options, retryCount + 1);
      }

      throw error;

    } catch (error: any) {
      clearTimeout(timeoutId);

      // Handle specific error types
      if (error instanceof WebflowError) {
        throw error;
      }

      const webflowError = WebflowErrorFactory.fromNetworkError(error);

      // Retry on network errors (but not auth errors)
      if (retryCount < retries && !webflowError.message.includes('expired')) {
        const delay = Math.pow(2, retryCount) * this.config.retryDelay;
        await this.sleep(delay);
        return this.executeRequest<T>(url, options, retryCount + 1);
      }

      throw webflowError;
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * HTTP GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>, options: RequestOptions = {}): Promise<T> {
    const queryString = this.buildQueryString(params);
    const url = `${this.config.baseUrl}${endpoint}${queryString}`;
    return this.executeRequest<T>(url, { ...options, method: 'GET' });
  }

  /**
   * HTTP POST request
   */
  async post<T>(endpoint: string, body?: any, options: RequestOptions = {}): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    return this.executeRequest<T>(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * HTTP PATCH request
   */
  async patch<T>(endpoint: string, body?: any, options: RequestOptions = {}): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    return this.executeRequest<T>(url, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * HTTP DELETE request
   */
  async delete(endpoint: string, options: RequestOptions = {}): Promise<void> {
    const url = `${this.config.baseUrl}${endpoint}`;
    await this.executeRequest<void>(url, { ...options, method: 'DELETE' });
  }
}