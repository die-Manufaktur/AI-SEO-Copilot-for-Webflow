import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// Mock the Webflow global object
Object.defineProperty(window, 'webflow', {
  value: {
    getCurrentPage: vi.fn(),
    getSiteInfo: vi.fn(),
    clipboard: {
      writeText: vi.fn()
    },
    setExtensionSize: vi.fn()
  },
  writable: true
});

// Reset all mocks before each test
beforeEach(() => {
  vi.resetAllMocks();
});
