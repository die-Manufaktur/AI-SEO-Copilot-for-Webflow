import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import svgrPlugin from 'vite-plugin-svgr'
import viteTsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    minify: true,
    watch: {
      include: 'src/**',
      exclude: 'node_modules/**, .git/**, dist/**, .vscode/**',
    },
    outDir: 'public',
    copyPublicDir: false,
    rollupOptions: {
      treeshake: true,
      output: {
        entryFileNames: `index.js`,
      },
    },
  },
  plugins: [react(), viteTsconfigPaths(), svgrPlugin()],
})
