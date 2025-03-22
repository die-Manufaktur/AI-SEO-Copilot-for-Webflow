import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

const __dirname = process.cwd();

export default defineConfig({
  root: path.resolve(__dirname, 'client'),
  plugins: [react(), tailwindcss()],
  base: './',
  optimizeDeps: {
    exclude: ['whatwg-url'] // Exclude whatwg-url from pre-bundling to avoid the warning
  },
  build: {
    outDir: path.resolve(__dirname, 'public'),
    emptyOutDir: true,
    sourcemap: false, // disable source maps for production
    assetsDir: 'assets',
    rollupOptions: {
      input: path.resolve(__dirname, 'client/index.html'),
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    },
  },
  css: {
    postcss: path.resolve(__dirname, 'postcss.config.js'),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
      // Optionally, you can add an alias for whatwg-url if needed:
      // 'whatwg-url': path.resolve(__dirname, 'node_modules/whatwg-url/dist/whatwg-url.mjs')
    },
  },
  server: {
    watch: {
      usePolling: true,
    },
    hmr: {
      overlay: true,
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