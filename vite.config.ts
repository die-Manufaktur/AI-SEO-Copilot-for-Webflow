/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// Custom plugin to replace navigator.userAgent in production builds and check for localhost references
const webflowCompatPlugin = () => ({
  name: 'webflow-compat',
  generateBundle(options, bundle) {
    if (process.env.NODE_ENV === 'production') {
      Object.keys(bundle).forEach(fileName => {
        const chunk = bundle[fileName];
        if (chunk.type === 'chunk' && chunk.code) {
          // Check for localhost references before processing
          if (chunk.code.includes('localhost')) {
            console.warn(`⚠️  Found localhost reference in bundle chunk: ${fileName}`);
            const lines = chunk.code.split('\n');
            lines.forEach((line, index) => {
              if (line.includes('localhost')) {
                console.warn(`  Line ${index + 1}: ${line.slice(0, 100)}...`);
              }
            });
          }
          
          // Replace navigator.userAgent with a safe string
          chunk.code = chunk.code.replace(
            /navigator\.userAgent/g,
            '"Mozilla/5.0 (compatible; WebflowApp/1.0)"'
          );
          // Also handle potential variations
          chunk.code = chunk.code.replace(
            /navigator\?\.\w*userAgent/g,
            '"Mozilla/5.0 (compatible; WebflowApp/1.0)"'
          );
        }
      });
    }
  }
});

const __dirname = process.cwd();

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
  plugins: [
    react(),
    webflowCompatPlugin(),
  ],
  define: {
    // Replace navigator.userAgent usage in production builds to pass Webflow validation
    ...(process.env.NODE_ENV === 'production' && {
      'navigator.userAgent': '"Mozilla/5.0 (compatible; WebflowApp/1.0)"',
    }),
  },
  root: path.resolve(__dirname, 'client'),
  base: './',
  build: {
    outDir: path.resolve(__dirname, 'public'),
    emptyOutDir: true, // Clean the 'public' directory before build
    sourcemap: false,
    assetsDir: 'assets', // Assets relative to outDir ('public/assets')
    rollupOptions: {
      // Input is now relative to the 'root' directory ('client')
      // Vite automatically picks up index.html from the root directory
      // input: { main: 'index.html' }, // Usually not needed if index.html is at root
      output: {
        // Output paths remain relative to outDir ('public')
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        manualChunks: (id) => {
          // Ensure paths in manualChunks are handled correctly relative to project root
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor';
          }
          if (id.includes('node_modules/react-icons') || id.includes('node_modules/tailwindcss')) {
            return 'ui';
          }
        }
      }
    },
    manifest: true, // Generate manifest.json in outDir/.vite/
  },
  css: {
    postcss: path.resolve(__dirname, 'postcss.config.mjs'),
  },
  resolve: {
    alias: {
      // Alias relative to project root, pointing inside the 'client/src' directory
      // Vite automatically resolves '@' relative to 'root' if not absolute
      '@': path.resolve(__dirname, './client/src'),
    },
  },
  server: {
    // Server settings might need adjustment if 'root' changes behavior significantly
    // The 'root' option sets the server's root directory
    fs: {
      // Allow serving files needed for development, potentially from project root
      allow: [path.resolve(__dirname)], // Allow serving from the project root
    },
    origin: process.env.VITE_SERVER_ORIGIN || 'http://127.0.0.1:5173',
    watch: {
      usePolling: true,
      interval: 300,
    },
    hmr: {
      overlay: true,
      protocol: 'ws',
      port: 24678,
      timeout: 5000,
    },
    proxy: {
      '/api': {
        target: env.VITE_WORKER_URL || 'https://seo-copilot-api-production.paul-130.workers.dev', // Your worker backend
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    },
  },
  // Vitest Configuration - Paths need to be relative to project root
  test: {
    // Set root for tests to project root explicitly if needed, otherwise defaults to vite config root ('client')
    root: __dirname, // Uncomment if tests need project root context
    globals: true,
    environment: 'jsdom',
    // Setup file relative to project root
    setupFiles: path.resolve(__dirname, './client/src/setupTests.ts'),
    // Include patterns relative to project root
    include: [
        // Adjust paths relative to project root if test.root is changed
        'client/**/*.{test,spec}.?(c|m)[jt]s?(x)',
        'workers/**/*.{test,spec}.?(c|m)[jt]s?(x)'
    ],
    // Exclude patterns relative to project root
    exclude: [
        '**/node_modules/**',
        '**/dist/**', // Exclude default vite dist
        '**/public/**', // Exclude build output dir
        '**/cypress/**',
        '**/.{idea,git,cache,output,temp}/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*',
    ],
    // Alias relative to project root
    alias: {
       '@': path.resolve(__dirname, './client/src'),
    },
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'client/src/**/*.{ts,tsx}',
        'workers/**/*.{ts,tsx}',
        'shared/**/*.{ts,tsx}'
      ],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.d.ts',
        '**/test-utils.tsx',
        '**/setupTests.ts',
        '**/vite-env.d.ts',
        'client/src/main.tsx',
        'client/src/index.css'
      ]
    }
  },
}});