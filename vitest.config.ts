import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['**/node_modules/**', '**/tests/**', '**/dist/**']
    },
    alias: {
      '@': path.resolve(__dirname, './client/src')
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src')
    }
  }
});