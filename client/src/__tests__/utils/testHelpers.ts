/**
 * Test helper utilities for common testing patterns
 * Provides reusable functions for test setup and assertions
 */

import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi, expect } from 'vitest';
import { setupServer } from 'msw/node';
import { allHandlers } from '../mocks/webflowApi';

/**
 * MSW server setup for API mocking
 */
export const server = setupServer(...allHandlers);

/**
 * Global test setup
 */
beforeAll(() => {
  // Start MSW server
  server.listen({ onUnhandledRequest: 'warn' });
});

afterEach(() => {
  // Reset MSW handlers after each test
  server.resetHandlers();
  // Clean up DOM after each test
  cleanup();
});

afterAll(() => {
  // Stop MSW server
  server.close();
});

/**
 * Custom render function for React components with providers
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: {
    initialEntries?: string[];
    route?: string;
  }
) {
  // TODO: Add providers (AuthContext, QueryClient, etc.) when they're implemented
  return render(ui);
}

/**
 * Mock localStorage for testing
 */
export const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

/**
 * Mock sessionStorage for testing
 */
export const mockSessionStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

/**
 * Setup DOM environment mocks
 */
export function setupDOMEnvironment() {
  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });

  // Mock sessionStorage
  Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true,
  });

  // Mock window.location
  Object.defineProperty(window, 'location', {
    value: {
      href: 'http://localhost:1337',
      origin: 'http://localhost:1337',
      protocol: 'http:',
      host: 'localhost:1337',
      hostname: 'localhost',
      port: '1337',
      pathname: '/',
      search: '',
      hash: '',
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
    },
    writable: true,
  });

  // Mock navigator
  Object.defineProperty(window, 'navigator', {
    value: {
      ...window.navigator,
      userAgent: 'Mozilla/5.0 (compatible; WebflowApp/1.0)',
      language: 'en-US',
      languages: ['en-US', 'en'],
    },
    writable: true,
  });

  // Mock crypto for UUID generation
  Object.defineProperty(window, 'crypto', {
    value: {
      randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
      getRandomValues: (arr: any) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      },
    },
    writable: true,
  });
}

/**
 * Wait for async operations to complete
 */
export const waitForAsync = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Create a promise that can be resolved externally
 */
export function createDeferred<T = any>() {
  let resolve: (value: T) => void;
  let reject: (error: any) => void;
  
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve: resolve!, reject: reject! };
}

/**
 * Mock console methods for testing
 */
export function mockConsole() {
  const originalConsole = { ...console };
  const mockMethods = {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  };

  Object.assign(console, mockMethods);

  return {
    restore: () => Object.assign(console, originalConsole),
    mocks: mockMethods,
  };
}

/**
 * Mock fetch API for testing
 */
export function mockFetch(responses: Record<string, any> = {}) {
  const originalFetch = global.fetch;
  
  global.fetch = vi.fn((input: string | URL | Request) => {
    const urlString = typeof input === 'string' ? input : input.toString();
    
    // Find matching response
    const matchingKey = Object.keys(responses).find(key => urlString.includes(key));
    const response = matchingKey ? responses[matchingKey] : { error: 'Not found' };
    
    return Promise.resolve({
      ok: !response.error,
      status: response.error ? 404 : 200,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
      headers: new Headers(),
      redirected: false,
      statusText: response.error ? 'Not Found' : 'OK',
      type: 'basic' as ResponseType,
      url: urlString,
      clone: function() { return this; },
      body: null,
      bodyUsed: false,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      blob: () => Promise.resolve(new Blob()),
      formData: () => Promise.resolve(new FormData()),
    } as Response);
  });

  return {
    restore: () => {
      global.fetch = originalFetch;
    },
    mock: global.fetch,
  };
}

/**
 * Test assertion helpers
 */
export const testHelpers = {
  /**
   * Assert that an element has the correct accessibility attributes
   */
  assertAccessibility: (element: HTMLElement, expectedAttributes: Record<string, string>) => {
    Object.entries(expectedAttributes).forEach(([attr, value]) => {
      expect(element).toHaveAttribute(attr, value);
    });
  },

  /**
   * Assert that an API call was made with correct parameters
   */
  assertApiCall: (mockFn: any, expectedUrl: string, expectedOptions?: any) => {
    expect(mockFn).toHaveBeenCalledWith(expectedUrl, expectedOptions);
  },

  /**
   * Assert that localStorage contains expected data
   */
  assertLocalStorage: (key: string, expectedValue: any) => {
    const stored = localStorage.getItem(key);
    const parsed = stored ? JSON.parse(stored) : null;
    expect(parsed).toEqual(expectedValue);
  },

  /**
   * Assert that an error was handled correctly
   */
  assertErrorHandling: (mockErrorFn: any, expectedErrorMessage: string) => {
    expect(mockErrorFn).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expectedErrorMessage,
      })
    );
  },

  /**
   * Wait for an element to appear with timeout
   */
  waitForElement: async (querySelector: () => HTMLElement | null, timeout = 1000) => {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      const element = querySelector();
      if (element) return element;
      await waitForAsync(10);
    }
    
    throw new Error(`Element not found within ${timeout}ms`);
  },

  /**
   * Simulate user interaction delays
   */
  simulateUserDelay: () => waitForAsync(100),

  /**
   * Generate test IDs for consistent element selection
   */
  generateTestId: (component: string, element?: string) => {
    return element ? `${component}-${element}` : component;
  },
};

/**
 * Performance testing helpers
 */
export const performanceHelpers = {
  /**
   * Measure function execution time
   */
  measureExecutionTime: async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    return { result, duration };
  },

  /**
   * Assert that function executes within time limit
   */
  assertExecutionTime: async <T>(
    fn: () => Promise<T>, 
    maxDuration: number, 
    description?: string
  ): Promise<T> => {
    const { result, duration } = await performanceHelpers.measureExecutionTime(fn);
    expect(duration).toBeLessThan(maxDuration);
    return result;
  },

  /**
   * Simulate slow network conditions
   */
  simulateSlowNetwork: (delay: number) => {
    return new Promise(resolve => setTimeout(resolve, delay));
  },
};

/**
 * Setup function to run before all tests
 */
export function setupTests() {
  setupDOMEnvironment();
  
  // Global test configuration
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  
  // Suppress console warnings in tests unless debugging
  if (!process.env.DEBUG_TESTS) {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  }
}

// Run setup immediately
setupTests();