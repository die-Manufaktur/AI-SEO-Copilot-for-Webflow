import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import svgrPlugin from 'vite-plugin-svgr';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  root: path.resolve(__dirname, 'client'), // Set the root directory to 'client'
  build: {
    minify: true,
    watch: {
      include: ['src/**', '../server/**'], // Watch 'src/**' and '../server/**'
      exclude: ['../node_modules/**', '../.git/**', '../public/**', '../.vscode/**'], // Exclude '../public/**'
    },
    outDir: path.resolve(__dirname, 'public'), // Output directory for the build
    emptyOutDir: true, // Empty the output directory before building
    copyPublicDir: true, // Ensure publicDir is copied
    rollupOptions: {
      treeshake: true,
      input: path.resolve(__dirname, 'client/index.html'), // Input is 'index.html' relative to 'client'
      output: {
        entryFileNames: `index.js`,
      },
    },
  },
  plugins: [react(), viteTsconfigPaths(), svgrPlugin()],
});
