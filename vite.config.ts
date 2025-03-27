import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';

// Use process.cwd() instead of fileURLToPath which is causing issues
const __dirname = process.cwd();

export default defineConfig({
  root: path.resolve(__dirname, 'client'), // Set the root directory to 'client'
  plugins: [react(), tailwindcss(), svgr(), tsconfigPaths()],
  build: {
    outDir: path.resolve(__dirname, 'public'), // Change output directory to 'public'
    emptyOutDir: true, // Ensure the output directory is emptied before building
    rollupOptions: {
      input: path.resolve(__dirname, 'client/index.html'), // Specify the entry point
    },
    modulePreload: {
      polyfill: true
    }
  },
  css: {
    postcss: path.resolve(__dirname, 'postcss.config.js'),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
    },
  },
  optimizeDeps: {
    entries: ['./src/**/*.{ts,tsx}'],
  },
});