/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'path';

const __dirname = process.cwd();

// Base Vitest configuration for unit tests
export default defineConfig({
  test: {
    name: 'unit',
    root: __dirname,
    globals: true,
    environment: 'jsdom',
    setupFiles: [
      path.resolve(__dirname, './client/src/setupTests.ts')
    ],
    // Only include unit test files (excluding integration tests)
    include: [
      'client/**/*.test.?(c|m)[jt]s?(x)',
      'workers/**/*.test.?(c|m)[jt]s?(x)',
      'shared/**/*.test.?(c|m)[jt]s?(x)'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/public/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*',
      // Exclude integration tests from unit test config
      '**/*.integration.test.?(c|m)[jt]s?(x)',
      '**/*.e2e.test.?(c|m)[jt]s?(x)',
      '**/test-results/**'
    ],
    alias: {
      '@': path.resolve(__dirname, './client/src'),
    },
    // Coverage configuration for unit tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: [
        'client/src/**/*.{ts,tsx}',
        'workers/**/*.{ts,tsx}',
        'shared/**/*.{ts,tsx}'
      ],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.integration.test.{ts,tsx}',
        '**/*.d.ts',
        '**/test-utils.tsx',
        '**/setupTests.ts',
        '**/vite-env.d.ts',
        'client/src/main.tsx',
        'client/src/index.css',
        'client/src/__tests__/**',
        'workers/__tests__/**'
      ],
      // Unit test thresholds - focused on individual components
      thresholds: {
        global: {
          branches: 80,
          functions: 90,
          lines: 90,
          statements: 90
        }
      }
    },
    // Fast execution for unit tests
    reporters: ['default'],
    testTimeout: 5000,
    hookTimeout: 3000,
    // Optimized for fast feedback in development
    watch: {
      ignore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/public/**',
        '**/test-results/**',
        '**/*.integration.test.*'
      ]
    },
    // Run tests in parallel for speed
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
    },
  },
});