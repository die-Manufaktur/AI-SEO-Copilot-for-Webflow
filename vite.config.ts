import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  root: path.resolve(__dirname, 'client'), // Set the root directory to 'client'
  plugins: [react(), tsconfigPaths(), svgr()],
  build: {
    outDir: 'dist', // Changed from 'public' to 'dist'
    emptyOutDir: false,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'client/index.html'),
      },
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
    },
  },
  css: {
    postcss: path.resolve(__dirname, 'postcss.config.mjs'), // Update extension to .mjs
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
    },
  },
  server: {
    port: 3000,
    open: false,
    cors: {
      // Allow any origin in development for testing from various domains
      origin: '*',
      methods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
      credentials: true,
    },
    headers: {
      // Core security headers that don't block legitimate access
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      // More permissive CSP for development
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' *; img-src 'self' data: *;",
    },
  },
  publicDir: 'static', // Explicitly set this to a different directory
  // Add watcher configuration to prevent excessive rebuilds
  optimizeDeps: {
    exclude: ['@tailwindcss/postcss'] // Exclude problematic packages
  },
  // Configure file watching to be more efficient
  watch: {
    ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**']
  }
});
