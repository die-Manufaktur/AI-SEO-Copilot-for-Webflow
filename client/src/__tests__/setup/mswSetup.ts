/**
 * MSW Setup for Test Environment
 * Provides better isolation and error handling for MSW v2.11.2
 */

import { setupServer } from 'msw/node';
import { allHandlers } from '../mocks/webflowApi';

// MSW Server instance with proper error handling
let mswServer: ReturnType<typeof setupServer> | null = null;
let isServerActive = false;

/**
 * Initialize MSW server with error handling
 */
export function initializeMSWServer() {
  if (mswServer) {
    return mswServer;
  }

  try {
    mswServer = setupServer(...allHandlers);
    return mswServer;
  } catch (error) {
    console.warn('Failed to create MSW server:', error);
    return null;
  }
}

/**
 * Start MSW server for tests
 */
export function startMSWServer() {
  const server = initializeMSWServer();
  
  if (!server || isServerActive) {
    return;
  }

  try {
    server.listen({
      onUnhandledRequest: 'bypass', // Don't intercept unhandled requests
    });
    isServerActive = true;
  } catch (error) {
    console.warn('Failed to start MSW server:', error);
  }
}

/**
 * Stop MSW server with proper cleanup
 */
export function stopMSWServer() {
  if (!mswServer || !isServerActive) {
    return;
  }

  try {
    mswServer.close();
    isServerActive = false;
  } catch (error) {
    // Ignore disposal errors during shutdown
  }
}

/**
 * Reset MSW handlers between tests
 */
export function resetMSWHandlers() {
  if (!mswServer || !isServerActive) {
    return;
  }

  try {
    mswServer.resetHandlers();
  } catch (error) {
    // Ignore reset errors during test cleanup
  }
}

/**
 * Clean up MSW interceptors to prevent disposal errors
 */
export function cleanupMSWInterceptors() {
  try {
    // Clean up any MSW-related global state that might cause disposal errors
    if (typeof globalThis !== 'undefined') {
      const globalAny = globalThis as any;
      
      // Clear common MSW interceptor references
      delete globalAny._mswInterceptors;
      delete globalAny._mswActivated;
      delete globalAny.__MSW_INTERCEPTORS__;
      
      // Clear any fetch interceptor state
      if (globalAny.fetch && globalAny.fetch.__MSW_ORIGINAL__) {
        delete globalAny.fetch.__MSW_ORIGINAL__;
      }
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}

/**
 * Get the MSW server instance (for direct access if needed)
 */
export function getMSWServer() {
  return mswServer;
}

/**
 * Check if MSW server is active
 */
export function isMSWServerActive() {
  return isServerActive;
}

/**
 * Temporarily disable MSW for specific tests
 */
export function disableMSWTemporarily() {
  if (mswServer && isServerActive) {
    try {
      mswServer.close();
      isServerActive = false;
      return true; // Returns true if we disabled it
    } catch (error) {
      return false;
    }
  }
  return false;
}

/**
 * Re-enable MSW after temporary disable
 */
export function enableMSWAfterDisable() {
  if (mswServer && !isServerActive) {
    try {
      mswServer.listen({
        onUnhandledRequest: 'bypass',
      });
      isServerActive = true;
      return true;
    } catch (error) {
      return false;
    }
  }
  return false;
}