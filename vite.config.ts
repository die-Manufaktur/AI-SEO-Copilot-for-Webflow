import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import tailwindcss from '@tailwindcss/vite'

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  root: path.resolve(__dirname, 'client'), // Set the root directory to 'client'
  plugins: [react(), tailwindcss()],
  build: {
    outDir: path.resolve(__dirname, 'public'), // Change output directory to 'public'
    emptyOutDir: true, // Ensure the output directory is emptied before building
    rollupOptions: {
      input: path.resolve(__dirname, 'client/index.html'), // Specify the entry point
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
});
