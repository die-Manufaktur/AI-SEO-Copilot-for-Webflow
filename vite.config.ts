/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

const __dirname = process.cwd();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  base: './', // Keep base relative if index.html is served from root
  optimizeDeps: {
    exclude: ['whatwg-url', 'jsdom']
  },
  build: {
    // Ensure outDir matches where the webflow bundler expects files
    outDir: 'public', // Changed from 'dist/client'
    emptyOutDir: true,
    sourcemap: false, // Keep sourcemaps off for production build if desired
    assetsDir: 'assets', // Assets relative to outDir
    rollupOptions: {
      input: {
        // Explicitly point to your index.html within the client folder
        main: path.resolve(__dirname, 'client/index.html')
      },
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor';
          }
          if (id.includes('node_modules/react-icons') || id.includes('node_modules/tailwindcss')) {
            return 'ui';
          }
        }
      }
    },
    manifest: true, // Make sure manifest generation is enabled if needed by the bundler
  },
  css: {
    // Path relative to project root
    postcss: path.resolve(__dirname, 'postcss.config.mjs'),
  },
  resolve: {
    alias: {
      // Path relative to project root
      '@': path.resolve(__dirname, './client/src'),
    },
  },
  server: {
    // Serve from the client directory during development
    fs: {
      strict: false, // Allow serving files from outside the workspace root (needed for client dir)
    },
    origin: 'http://127.0.0.1:5173', // Explicitly set origin if needed
    watch: {
      usePolling: true,
      interval: 300,
    },
    hmr: {
      overlay: true,
      protocol: 'ws',
      port: 24678, // Ensure this port is free
      timeout: 5000,
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787', // Your worker backend
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    },
  },
  // Consolidated Vitest Configuration
  test: {
    globals: true,
    environment: 'jsdom',
    // Path relative to project root
    setupFiles: './client/src/setupTests.ts',
    // Use relative paths from project root for include patterns
    include: [
        'client/**/*.{test,spec}.?(c|m)[jt]s?(x)',
        'workers/**/*.{test,spec}.?(c|m)[jt]s?(x)'
    ],
    // Exclude patterns relative to project root
    exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/cypress/**',
        '**/.{idea,git,cache,output,temp}/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*',
    ],
    // Alias relative to project root - Correct
    alias: {
       '@': path.resolve(__dirname, './client/src'),
    }
  },
});