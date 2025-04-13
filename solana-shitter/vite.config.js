import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite'
import rollupNodePolyFill from 'rollup-plugin-node-polyfills';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ['buffer', 'process'],
  },
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  build: {
    rollupOptions: {
      plugins: [
        rollupNodePolyFill(),
      ],
    },
  },
});
