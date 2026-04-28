/**
 * Rate Limit Manager
 * REFACTOR Phase: Extract rate limiting logic for better organization
 */

import type { WebflowRateLimitInfo } from '../types/webflow-data-api';

export type RateLimitStrategy = 'queue' | 'throw' | 'retry';

export interface RateLimitManagerConfig {
  strategy: RateLimitStrategy;
  maxRetries: number;
  baseDelay: number;
}

export class RateLimitManager {
  private rateLimitInfo: WebflowRateLimitInfo = {
    remaining: 100,
    limit: 100,
    resetTime: Date.now() + 3600000,
  };

  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;

  constructor(private config: RateLimitManagerConfig) {}

  /**
   * Update rate limit info from response headers
   */
  updateFromHeaders(headers: Headers): void {
    const remaining = headers.get('x-ratelimit-remaining');
    const limit = headers.get('x-ratelimit-limit');
    const reset = headers.get('x-ratelimit-reset');
    const retryAfter = headers.get('retry-after');

    if (remaining !== null) {
      this.rateLimitInfo.remaining = parseInt(remaining, 10);
    }
    if (limit !== null) {
      this.rateLimitInfo.limit = parseInt(limit, 10);
    }
    if (reset !== null) {
      this.rateLimitInfo.resetTime = parseInt(reset, 10) * 1000;
    }
    if (retryAfter !== null) {
      this.rateLimitInfo.retryAfter = parseInt(retryAfter, 10) * 1000;
    }
  }

  /**
   * Get current rate limit information
   */
  getRateLimitInfo(): WebflowRateLimitInfo {
    return { ...this.rateLimitInfo };
  }

  /**
   * Check if a request should be rate limited
   */
  shouldRateLimit(): boolean {
    return this.rateLimitInfo.remaining <= 0;
  }

  /**
   * Get delay before next request
   */
  getRetryDelay(retryCount: number = 0): number {
    if (this.rateLimitInfo.retryAfter) {
      return this.rateLimitInfo.retryAfter;
    }
    return Math.pow(2, retryCount) * this.config.baseDelay;
  }

  /**
   * Handle rate limited response
   */
  async handleRateLimit<T>(
    requestFn: () => Promise<T>,
    retryCount: number = 0,
    originalError?: Error
  ): Promise<T> {
    switch (this.config.strategy) {
      case 'throw':
        throw originalError || new Error('Rate limit exceeded');

      case 'retry':
        if (retryCount >= this.config.maxRetries) {
          throw originalError || new Error('Rate limit exceeded - max retries reached');
        }
        
        const delay = this.getRetryDelay(retryCount);
        await this.sleep(delay);
        return requestFn();

      case 'queue':
        return this.queueRequest(requestFn);

      default:
        throw new Error(`Unknown rate limit strategy: ${this.config.strategy}`);
    }
  }

  /**
   * Queue a request for later execution
   */
  private async queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      if (this.shouldRateLimit()) {
        const delay = this.getRetryDelay();
        await this.sleep(delay);
      }

      const nextRequest = this.requestQueue.shift();
      if (nextRequest) {
        await nextRequest();
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reset rate limit info (for testing)
   */
  reset(): void {
    this.rateLimitInfo = {
      remaining: 100,
      limit: 100,
      resetTime: Date.now() + 3600000,
    };
    this.requestQueue = [];
    this.isProcessingQueue = false;
  }
}