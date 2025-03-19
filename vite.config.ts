import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from '@tailwindcss/vite'

// Use process.cwd() instead of fileURLToPath which is causing issues
const __dirname = process.cwd();

export default defineConfig({
  root: path.resolve(__dirname, 'client'), // Set the root directory to 'client'
  plugins: [react(), tailwindcss()],
  base: './', // Use relative paths for assets
  build: {
    outDir: path.resolve(__dirname, 'public'), // Change output directory to 'public'
    emptyOutDir: true, // Ensure the output directory is emptied before building
    assetsDir: 'assets', // Specify assets directory explicitly
    rollupOptions: {
      input: path.resolve(__dirname, 'client/index.html'), // Specify the entry point
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
    },
  },
  server: {
    watch: {
      usePolling: true, // Help with file system watching issues
    },
    hmr: {
      overlay: true, // Enable error overlay
    }
  },
});