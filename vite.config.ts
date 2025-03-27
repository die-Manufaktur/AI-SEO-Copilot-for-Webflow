import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';

const __dirname = process.cwd();

export default defineConfig({
  root: path.resolve(__dirname, './'),
  plugins: [react(), tsconfigPaths(), svgr()],
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV !== 'production',
    rollupOptions: {
      input: path.resolve(__dirname, 'client/index.html'),
      output: {
        // More flexible function-based chunking strategy
        manualChunks: (id) => {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/@radix-ui/react-')) {
            return 'radix-ui';
          }
          if (id.includes('node_modules/@tanstack/')) {
            return 'tanstack';
          }
          if (id.includes('node_modules/framer-motion/')) {
            return 'animations';
          }
          // All other node_modules
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        },
        // Ensure clean output with proper naming
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
      // Optimize external dependencies
      external: [],
      // Modern Rollup features
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false
      }
    },
    // Ensure output stats for analysis
    reportCompressedSize: true,
    chunkSizeWarningLimit: 500
  },
  css: {
    postcss: path.resolve(__dirname, 'postcss.config.mjs'),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});