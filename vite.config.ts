import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const __dirname = process.cwd();

// https://vitejs.dev/config/
export default defineConfig({
  root: path.resolve(__dirname, 'client'),
  plugins: [
    react(),
  ],
  base: './',
  optimizeDeps: {
    exclude: ['whatwg-url', 'jsdom']
  },
  build: {
    outDir: path.resolve(__dirname, './public'), // Output to the project root's public directory
    emptyOutDir: true,
    sourcemap: false, // disable source maps for production
    assetsDir: 'assets',
    rollupOptions: {
      input: path.resolve(__dirname, 'client/index.html'),
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        // Use a function-based approach for manualChunks
        manualChunks: (id) => {
          // Vendor chunk for React
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor';
          }
          
          // UI libraries chunk
          if (id.includes('node_modules/react-icons') || id.includes('node_modules/tailwindcss')) {
            return 'ui';
          }
          
          // You can add more chunk definitions as needed
        }
      }
    },
  },
  css: {
    postcss: path.resolve(__dirname, 'postcss.config.mjs'),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    watch: {
      usePolling: true,
      // Watch for changes more aggressively
      interval: 300,
    },
    hmr: {
      overlay: true,
      // Force full page reload if needed for Webflow integration
      protocol: 'ws',
      port: 24678,
      // Increase timeout to ensure connections are maintained
      timeout: 5000,
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
});