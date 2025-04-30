
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })


import { defineConfig } from 'vite';
import rollupNodePolyFill from 'rollup-plugin-node-polyfills';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['buffer', 'process'],
  },
  resolve: {
    alias: {
      process: 'process/browser',
      assert: 'assert/',
      util: 'util/',
      buffer: 'buffer/'
    }
  },
  define: {
    global: 'window',
    'process.env': {},
    'process': {
      env: {},
    },
  },
  build: {
    rollupOptions: {
      plugins: [rollupNodePolyFill()],
    },
  },
});
