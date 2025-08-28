import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'happy-dom', // Use happy-dom instead of jsdom for better DOM API support
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
    testTimeout: 15000, // Set global timeout to 15 seconds for async tests
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