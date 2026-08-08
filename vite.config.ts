import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

// Post-build plugin: copies popup.html and options.html to dist root
function chromeExtensionFixPlugin() {
  return {
    name: 'chrome-extension-fix',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist');

      // Vite places HTML relative to project root (src/popup/popup.html → dist/src/popup/popup.html)
      const popupSrc   = resolve(distDir, 'src/popup/popup.html');
      const optionsSrc = resolve(distDir, 'src/options/options.html');

      if (existsSync(popupSrc)) {
        copyFileSync(popupSrc, resolve(distDir, 'popup.html'));
        console.log('[chrome-extension-fix] popup.html → dist/popup.html');
      } else {
        console.warn('[chrome-extension-fix] WARNING: popup.html not found at', popupSrc);
      }

      if (existsSync(optionsSrc)) {
        copyFileSync(optionsSrc, resolve(distDir, 'options.html'));
        console.log('[chrome-extension-fix] options.html → dist/options.html');
      } else {
        console.warn('[chrome-extension-fix] WARNING: options.html not found at', optionsSrc);
      }

      // Copy manifest.json to dist
      copyFileSync(resolve(__dirname, 'manifest.json'), resolve(distDir, 'manifest.json'));

      // Copy mock-irs folder
      const mockSrc  = resolve(__dirname, 'mock-irs');
      const mockDest = resolve(distDir, 'mock-irs');
      if (existsSync(mockSrc)) {
        mkdirSync(mockDest, { recursive: true });
        copyFileSync(resolve(mockSrc, 'index.html'), resolve(mockDest, 'index.html'));
      }

      console.log('[chrome-extension-fix] Build post-processing complete');
    },
  };
}

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [chromeExtensionFixPlugin()],
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/popup.html'),
        options: resolve(__dirname, 'src/options/options.html'),
        'service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
        'content/irs': resolve(__dirname, 'src/content/irs.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'service-worker') return 'service-worker.js';
          if (chunkInfo.name === 'content/irs') return 'content/irs.js';
          return '[name].js';
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) return 'assets/[name][extname]';
          if (assetInfo.name?.match(/\.(png|jpg|svg|ico)$/)) return 'icons/[name][extname]';
          return 'assets/[name][extname]';
        },
      },
    },
    modulePreload: false,
  },
  publicDir: resolve(__dirname, 'public'),
});
