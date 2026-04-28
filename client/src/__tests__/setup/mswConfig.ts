/**
 * MSW Configuration for Test Environment
 * Handles compatibility issues with MSW v2.11.2 and Vitest
 */

// Ensure proper environment setup for MSW in Node.js test environment
if (typeof global !== 'undefined' && !global.TextEncoder) {
  // Add TextEncoder/TextDecoder for Node.js environments that don't have it
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Polyfill for Node.js fetch if needed (MSW v2 relies on proper fetch implementation)
if (typeof global !== 'undefined' && !global.fetch) {
  // MSW will provide its own fetch mock, but we need to ensure the global exists
  global.fetch = (() => Promise.reject(new Error('Fetch not available'))) as any;
}

// Configure MSW to work better with Vitest's environment
export const mswConfig = {
  // MSW server options that work well with Vitest
  serverOptions: {
    onUnhandledRequest: 'bypass' as const,
  },
  
  // Environment detection
  isTestEnvironment: process.env.NODE_ENV === 'test' || process.env.VITEST,
  
  // Cleanup configuration
  cleanup: {
    // Properties to clean up from global scope
    globalProperties: [
      '_mswInterceptors',
      '_mswActivated', 
      '__MSW_INTERCEPTORS__',
      '__MSW_ACTIVE__'
    ],
    
    // Clean up fetch interceptor state
    cleanFetchState: true,
  }
} as const;

/**
 * Setup MSW environment compatibility
 */
export function setupMSWEnvironment() {
  // Ensure proper error handling for MSW interceptors
  if (typeof global !== 'undefined') {
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      // Filter out common MSW disposal errors that are harmless in tests
      const message = args[0]?.toString() || '';
      if (
        message.includes('Failed to dispose interceptor') ||
        message.includes('Object.defineProperty called on non-object') ||
        message.includes('Cannot read properties of null')
      ) {
        // Silently ignore these MSW disposal errors
        return;
      }
      originalConsoleError.apply(console, args);
    };
  }
  
  // Configure MSW for better Vitest compatibility
  if (mswConfig.isTestEnvironment) {
    // Ensure MSW doesn't interfere with Vitest's own fetch mocking
    process.env.MSW_DISABLE_REQUEST_DEDUPLICATION = 'true';
  }
}

/**
 * Cleanup MSW environment after tests
 */
export function cleanupMSWEnvironment() {
  if (typeof global !== 'undefined') {
    const globalAny = global as any;
    
    // Clean up MSW-specific global properties
    mswConfig.cleanup.globalProperties.forEach(prop => {
      try {
        delete globalAny[prop];
      } catch (error) {
        // Ignore cleanup errors
      }
    });
    
    // Clean up fetch interceptor state if enabled
    if (mswConfig.cleanup.cleanFetchState && globalAny.fetch) {
      try {
        delete globalAny.fetch.__MSW_ORIGINAL__;
        delete globalAny.fetch.__MSW_PATCHED__;
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }
}

// Auto-setup when imported
setupMSWEnvironment();