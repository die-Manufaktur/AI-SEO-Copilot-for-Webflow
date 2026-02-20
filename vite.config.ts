import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    tsconfigPaths(),
    svgr()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@assets': path.resolve(__dirname, './attached_assets')
    }
  },
  root: 'client',
  publicDir: '../public',
  server: {
    port: 1337,
    host: '0.0.0.0',
    cors: true,
    strictPort: true,
    hmr: {
      clientPort: 443
    },
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    }
  },
  build: {
    outDir: '../public',
    emptyOutDir: true,
    sourcemap: true
  }
});
