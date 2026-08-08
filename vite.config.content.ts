import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: false,
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/content/irs.ts'),
      name: 'IRSContentScript',
      formats: ['iife'],
      fileName: () => 'content/irs.js'
    }
  }
});
