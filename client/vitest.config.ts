import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom', // Use jsdom for better compatibility with testing-library
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
    testTimeout: 15000, // Set global timeout to 15 seconds for async tests
    env: {
      NODE_ENV: 'test'
    },
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.test.{ts,tsx}', '**/*.d.ts', '**/test-utils.tsx', '**/setupTests.ts']
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});