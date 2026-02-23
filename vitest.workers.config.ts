import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 15000,
    include: ['workers/**/*.test.ts'],
    reporters: ['default'],
  },
});
