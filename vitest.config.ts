import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
    testTimeout: 15000,
    env: {
      NODE_ENV: 'test'
    },
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.test.{ts,tsx}', '**/*.d.ts', '**/test-utils.tsx', '**/setupTests.ts']
    },
    reporters: ['default'],
    pool: 'forks',
    isolate: true,
    environmentOptions: {
      jsdom: {
        resources: 'usable'
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
