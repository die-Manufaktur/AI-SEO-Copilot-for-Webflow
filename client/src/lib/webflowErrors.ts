/**
 * Webflow API Error Classes
 * REFACTOR Phase: Custom error types for better error handling
 */

import type { WebflowApiError, WebflowRateLimitInfo } from '../types/webflow-data-api';

/**
 * Base class for all Webflow API errors
 */
export abstract class WebflowError extends Error {
  abstract readonly code: number;
  abstract readonly type: string;

  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = this.constructor.name;
    
    // Maintain proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert to API error format
   */
  toApiError(): WebflowApiError {
    return {
      err: this.type,
      code: this.code,
      msg: this.message,
    };
  }
}

/**
 * Authentication-related errors
 */
export class WebflowAuthError extends WebflowError {
  readonly code = 401;
  readonly type = 'Authentication Error';

  static tokenExpired(message = 'Access token has expired'): WebflowAuthError {
    return new WebflowAuthError(message);
  }

  static invalidToken(message = 'Invalid or malformed token'): WebflowAuthError {
    return new WebflowAuthError(message);
  }

  static insufficientScope(requiredScope: string): WebflowAuthError {
    return new WebflowAuthError(`Insufficient permissions: ${requiredScope} scope required`);
  }
}

/**
 * Rate limiting errors
 */
export class WebflowRateLimitError extends WebflowError {
  readonly code = 429;
  readonly type = 'Rate Limited';

  constructor(
    message: string,
    public readonly rateLimitInfo: WebflowRateLimitInfo,
    originalError?: Error
  ) {
    super(message, originalError);
  }

  static fromHeaders(headers: Headers, message = 'Rate limit exceeded'): WebflowRateLimitError {
    const rateLimitInfo: WebflowRateLimitInfo = {
      remaining: parseInt(headers.get('x-ratelimit-remaining') || '0', 10),
      limit: parseInt(headers.get('x-ratelimit-limit') || '100', 10),
      resetTime: parseInt(headers.get('x-ratelimit-reset') || '0', 10) * 1000,
      retryAfter: parseInt(headers.get('retry-after') || '0', 10) * 1000,
    };

    return new WebflowRateLimitError(message, rateLimitInfo);
  }
}

/**
 * Validation errors (4xx client errors)
 */
export class WebflowValidationError extends WebflowError {
  readonly code: number;
  readonly type = 'Validation Error';

  constructor(
    message: string,
    code: number = 400,
    public readonly details?: Record<string, any>,
    originalError?: Error
  ) {
    super(message, originalError);
    this.code = code;
  }

  static badRequest(message: string, details?: Record<string, any>): WebflowValidationError {
    return new WebflowValidationError(message, 400, details);
  }

  static notFound(resource: string): WebflowValidationError {
    return new WebflowValidationError(`${resource} not found`, 404);
  }

  static forbidden(action: string): WebflowValidationError {
    return new WebflowValidationError(`Not allowed to ${action}`, 403);
  }
}

/**
 * Server errors (5xx errors)
 */
export class WebflowServerError extends WebflowError {
  readonly code: number;
  readonly type = 'Server Error';

  constructor(message: string, code: number = 500, originalError?: Error) {
    super(message, originalError);
    this.code = code;
  }

  static internalError(message = 'Internal server error'): WebflowServerError {
    return new WebflowServerError(message, 500);
  }

  static serviceUnavailable(message = 'Service temporarily unavailable'): WebflowServerError {
    return new WebflowServerError(message, 503);
  }
}

/**
 * Network and connectivity errors
 */
export class WebflowNetworkError extends WebflowError {
  readonly code = 0;
  readonly type = 'Network Error';

  static timeout(message = 'Request timeout'): WebflowNetworkError {
    return new WebflowNetworkError(message);
  }

  static connectionFailed(message = 'Connection failed'): WebflowNetworkError {
    return new WebflowNetworkError(message);
  }
}

/**
 * Configuration errors
 */
export class WebflowConfigError extends WebflowError {
  readonly code = 0;
  readonly type = 'Configuration Error';

  static invalidToken(message = 'Valid token is required'): WebflowConfigError {
    return new WebflowConfigError(message);
  }

  static invalidConfig(field: string, message?: string): WebflowConfigError {
    return new WebflowConfigError(message || `Invalid configuration: ${field}`);
  }
}

/**
 * Error factory for creating appropriate error types from API responses
 */
export class WebflowErrorFactory {
  static fromResponse(response: Response, apiError: WebflowApiError): WebflowError {
    const { status } = response;
    const { err, msg, details } = apiError;

    switch (status) {
      case 401:
        return new WebflowAuthError(msg);
      
      case 403:
        return WebflowValidationError.forbidden(msg);
      
      case 404:
        return WebflowValidationError.notFound(msg);
      
      case 429:
        return WebflowRateLimitError.fromHeaders(response.headers, msg);
      
      case 400:
        return WebflowValidationError.badRequest(msg, details);
      
      default:
        if (status >= 400 && status < 500) {
          return new WebflowValidationError(msg, status, details);
        }
        
        if (status >= 500) {
          return new WebflowServerError(msg, status);
        }
        
        return new WebflowServerError(msg, status); // Fallback to server error
    }
  }

  static fromNetworkError(error: Error): WebflowError {
    if (error.name === 'AbortError') {
      return WebflowNetworkError.timeout();
    }
    
    if (error.message.includes('Failed to fetch')) {
      return WebflowNetworkError.connectionFailed(error.message);
    }
    
    return new WebflowNetworkError(error.message, error);
  }

  static fromUnknownError(error: unknown): WebflowError {
    if (error instanceof WebflowError) {
      return error;
    }
    
    if (error instanceof Error) {
      return this.fromNetworkError(error);
    }
    
    return new WebflowServerError(String(error), 500);
  }
}