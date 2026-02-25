/**
 * Test helper utilities for common testing patterns
 * Provides reusable functions for test setup and assertions
 */

import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi, expect } from 'vitest';
import { 
  startMSWServer, 
  stopMSWServer, 
  resetMSWHandlers, 
  cleanupMSWInterceptors,
  disableMSWTemporarily,
  enableMSWAfterDisable,
  getMSWServer
} from '../setup/mswSetup';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InsertionProvider } from '../../contexts/InsertionContext';
import { AuthProvider } from '../../contexts/AuthContext';

// Note: WebflowAuth mock removed - tests should use actual implementation
// Individual test files can mock WebflowAuth if needed with vi.mock() in their test file

/**
 * MSW server setup for API mocking
 */
export const server = getMSWServer();

/**
 * Global test setup
 */
beforeAll(() => {
  // Start MSW server with proper error handling
  startMSWServer();
});

afterEach(() => {
  // Reset MSW handlers after each test
  resetMSWHandlers();
  
  // Clean up DOM after each test
  cleanup();
  
  // Restore mocks after MSW reset to prevent conflicts
  vi.restoreAllMocks();
  
  // Clear any pending interceptors to prevent disposal errors
  cleanupMSWInterceptors();
  
  // Clear clipboard to allow userEvent to set it up fresh
  try {
    delete (navigator as any).clipboard;
  } catch (e) {
    // If delete fails, ignore - userEvent will handle it
  }
});

afterAll(() => {
  // Stop MSW server with proper cleanup
  stopMSWServer();
  
  // Final cleanup of any remaining interceptors
  cleanupMSWInterceptors();
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
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { 
        retry: false,
        gcTime: 0 
      },
      mutations: { 
        retry: false 
      }
    }
  });

  function AllTheProviders({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <InsertionProvider>
            {children}
          </InsertionProvider>
        </AuthProvider>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: AllTheProviders, ...options });
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
      subtle: {
        digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
      },
    },
    writable: true,
  });

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: [],
  }));

  // Mock MutationObserver
  global.MutationObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(() => []),
  }));

  // Mock requestAnimationFrame and cancelAnimationFrame
  global.requestAnimationFrame = vi.fn((callback) => {
    return setTimeout(callback, 16) as unknown as number;
  }) as any;

  global.cancelAnimationFrame = vi.fn((handle) => {
    clearTimeout(handle);
  }) as any;

  // Mock getComputedStyle
  Object.defineProperty(window, 'getComputedStyle', {
    value: vi.fn().mockImplementation(() => ({
      getPropertyValue: vi.fn(() => ''),
      setProperty: vi.fn(),
      removeProperty: vi.fn(),
      item: vi.fn(() => ''),
      length: 0,
      cssText: '',
      parentRule: null,
    })),
    writable: true,
  });

  // Mock scrollTo and scrollBy
  Object.defineProperty(window, 'scrollTo', {
    value: vi.fn(),
    writable: true,
  });

  Object.defineProperty(window, 'scrollBy', {
    value: vi.fn(),
    writable: true,
  });

  // Mock Element.scrollIntoView
  Element.prototype.scrollIntoView = vi.fn();

  // Mock document.elementFromPoint
  Object.defineProperty(document, 'elementFromPoint', {
    value: vi.fn(() => null),
    writable: true,
  });

  // Mock HTMLElement.offsetHeight, offsetWidth, etc.
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    value: 100,
  });

  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    value: 100,
  });

  Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
    configurable: true,
    value: 0,
  });

  Object.defineProperty(HTMLElement.prototype, 'offsetLeft', {
    configurable: true,
    value: 0,
  });

  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    value: 100,
  });

  Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
    configurable: true,
    value: 100,
  });

  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    value: 100,
  });

  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    value: 100,
  });

  // Mock getBoundingClientRect
  Element.prototype.getBoundingClientRect = vi.fn(() => ({
    top: 0,
    left: 0,
    bottom: 100,
    right: 100,
    width: 100,
    height: 100,
    x: 0,
    y: 0,
    toJSON: vi.fn(),
  }));

  // Mock Range and Selection APIs
  const MockRange = vi.fn().mockImplementation(() => ({
    setStart: vi.fn(),
    setEnd: vi.fn(),
    collapse: vi.fn(),
    selectNode: vi.fn(),
    selectNodeContents: vi.fn(),
    getBoundingClientRect: vi.fn(() => ({
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      toJSON: vi.fn(),
    })),
    getClientRects: vi.fn(() => []),
    insertNode: vi.fn(),
    surroundContents: vi.fn(),
    deleteContents: vi.fn(),
    extractContents: vi.fn(),
    cloneContents: vi.fn(),
    cloneRange: vi.fn(),
    detach: vi.fn(),
    toString: vi.fn(() => ''),
  }));

  // Add static properties to MockRange
  (MockRange as any).START_TO_START = 0;
  (MockRange as any).START_TO_END = 1;
  (MockRange as any).END_TO_END = 2;
  (MockRange as any).END_TO_START = 3;

  global.Range = MockRange as any;

  Object.defineProperty(document, 'createRange', {
    value: () => new MockRange(),
    writable: true,
  });

  Object.defineProperty(window, 'getSelection', {
    value: vi.fn(() => ({
      rangeCount: 0,
      focusNode: null,
      focusOffset: 0,
      anchorNode: null,
      anchorOffset: 0,
      isCollapsed: true,
      type: 'None',
      addRange: vi.fn(),
      removeRange: vi.fn(),
      removeAllRanges: vi.fn(),
      getRangeAt: vi.fn(),
      toString: vi.fn(() => ''),
      collapse: vi.fn(),
      extend: vi.fn(),
      selectAllChildren: vi.fn(),
      deleteFromDocument: vi.fn(),
      containsNode: vi.fn(() => false),
    })),
    writable: true,
  });

  // Mock focus and blur methods
  HTMLElement.prototype.focus = vi.fn();
  HTMLElement.prototype.blur = vi.fn();

  // Don't set up clipboard here - let userEvent handle it

  // Mock File and FileReader APIs
  global.File = vi.fn().mockImplementation((parts, name, options) => ({
    name,
    size: parts.reduce((acc: number, part: any) => acc + (part.length || 0), 0),
    type: options?.type || '',
    lastModified: Date.now(),
    arrayBuffer: vi.fn(() => Promise.resolve(new ArrayBuffer(0))),
    text: vi.fn(() => Promise.resolve('')),
    stream: vi.fn(),
    slice: vi.fn(),
  }));

  const MockFileReader = vi.fn().mockImplementation(() => ({
    readAsDataURL: vi.fn(),
    readAsText: vi.fn(),
    readAsArrayBuffer: vi.fn(),
    readAsBinaryString: vi.fn(),
    abort: vi.fn(),
    result: null,
    error: null,
    readyState: 0,
    EMPTY: 0,
    LOADING: 1,
    DONE: 2,
    onload: null,
    onerror: null,
    onabort: null,
    onloadstart: null,
    onloadend: null,
    onprogress: null,
  }));

  // Add static properties to MockFileReader
  (MockFileReader as any).EMPTY = 0;
  (MockFileReader as any).LOADING = 1;
  (MockFileReader as any).DONE = 2;

  global.FileReader = MockFileReader as any;

  // Mock URL and URLSearchParams
  if (!global.URL) {
    global.URL = class URL {
      constructor(public href: string, base?: string) {
        if (base) {
          this.href = new window.URL(href, base).href;
        }
      }
      toString() { return this.href; }
      toJSON() { return this.href; }
    } as any;
  }

  if (!global.URLSearchParams) {
    global.URLSearchParams = class URLSearchParams {
      private params = new Map<string, string>();

      constructor(init?: string | string[][] | Record<string, string>) {
        if (typeof init === 'string') {
          // Parse query string
          const params = init.startsWith('?') ? init.slice(1) : init;
          params.split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            if (key) this.params.set(decodeURIComponent(key), decodeURIComponent(value || ''));
          });
        } else if (Array.isArray(init)) {
          init.forEach(([key, value]) => this.params.set(key, value));
        } else if (init) {
          Object.entries(init).forEach(([key, value]) => this.params.set(key, value));
        }
      }

      append(name: string, value: string) { this.params.set(name, value); }
      delete(name: string) { this.params.delete(name); }
      get(name: string) { return this.params.get(name) || null; }
      getAll(name: string) { return this.params.has(name) ? [this.params.get(name)!] : []; }
      has(name: string) { return this.params.has(name); }
      set(name: string, value: string) { this.params.set(name, value); }
      toString() {
        return Array.from(this.params.entries())
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join('&');
      }
      entries() { return this.params.entries(); }
      keys() { return this.params.keys(); }
      values() { return this.params.values(); }
      [Symbol.iterator]() { return this.params.entries(); }
    } as any;
  }
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
 * Measure function execution time
 */
async function measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
}

/**
 * Assert that function executes within time limit
 */
async function assertExecutionTime<T>(
  fn: () => Promise<T>, 
  maxDuration: number, 
  description?: string
): Promise<T> {
  const { result, duration } = await measureExecutionTime(fn);
  expect(duration).toBeLessThan(maxDuration);
  return result;
}

/**
 * Performance testing helpers
 */
export const performanceHelpers = {
  /**
   * Measure function execution time
   */
  measureExecutionTime,

  /**
   * Assert that function executes within time limit
   */
  assertExecutionTime,

  /**
   * Simulate slow network conditions
   */
  simulateSlowNetwork: (delay: number) => {
    return new Promise(resolve => setTimeout(resolve, delay));
  },
};

/**
 * Disable MSW for tests that need direct fetch mocking
 */
export function disableMSWForTest() {
  beforeAll(() => {
    disableMSWTemporarily();
  });
  
  afterAll(() => {
    enableMSWAfterDisable();
  });
}

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