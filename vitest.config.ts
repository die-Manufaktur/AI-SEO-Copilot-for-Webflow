// filepath: c:\Users\class\apps\ai-seo-copilot\vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Include test files from both client and workers directories
    include: ['client/**/*.{test,spec}.?(c|m)[jt]s?(x)', 'workers/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/cypress/**',
        '**/.{idea,git,cache,output,temp}/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*'
    ],
    // ... other configurations like environment, setupFiles, etc.
    // environment: 'jsdom', // Or 'node' depending on your tests
  },
});