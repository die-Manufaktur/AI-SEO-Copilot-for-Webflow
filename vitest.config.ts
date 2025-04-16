// filepath: c:\Users\class\apps\ai-seo-copilot\vite.config.ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // Or @vitejs/plugin-react-swc

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './client/src/setupTests.ts',
    include: ['client/**/*.{test,spec}.?(c|m)[jt]s?(x)', 'workers/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/cypress/**',
        '**/.{idea,git,cache,output,temp}/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*'
    ],
  },
});